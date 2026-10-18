-- Onboarding: saved answers, AI usage limits, supersets, and one-shot plan saving.
-- Additive and safe to re-run.

alter table profiles
  add column if not exists age_range text,
  add column if not exists sex text,
  add column if not exists goal text,
  add column if not exists days_per_week int check (days_per_week between 1 and 7),
  add column if not exists session_minutes int check (session_minutes between 10 and 240),
  add column if not exists experience text;

alter table exercises add column if not exists linked_to_next boolean not null default false;
comment on column exercises.linked_to_next is 'Superset with the next exercise by sort_order.';

-- Usage counters live outside profiles so users can read but never reset them.
create table if not exists plan_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_generations int not null default 0,
  voice_day date,
  voice_count int not null default 0,
  updated_at timestamptz not null default now()
);

alter table plan_usage enable row level security;
revoke all on plan_usage from anon, authenticated;
grant select on plan_usage to authenticated;

drop policy if exists "Read own usage" on plan_usage;
create policy "Read own usage" on plan_usage
  for select to authenticated using (auth.uid() = user_id);

-- Counts one successful AI plan build and returns the new total.
-- The limit is enforced by the server before calling the AI; calling this
-- directly only uses up the caller's own builds.
create or replace function claim_plan_generation()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  used int;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  insert into plan_usage (user_id, plan_generations)
  values (auth.uid(), 1)
  on conflict (user_id) do update
    set plan_generations = plan_usage.plan_generations + 1,
        updated_at = now()
  returning plan_generations into used;

  return used;
end;
$$;

-- Claims one voice transcription for today (UTC). False once the daily limit is reached.
create or replace function claim_voice_transcription()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed boolean;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  insert into plan_usage (user_id, voice_day, voice_count)
  values (auth.uid(), current_date, 1)
  on conflict (user_id) do update
    set voice_count = case when plan_usage.voice_day = current_date then plan_usage.voice_count + 1 else 1 end,
        voice_day = current_date,
        updated_at = now()
    where plan_usage.voice_day is distinct from current_date
       or plan_usage.voice_count < 30
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

-- Saves a whole plan in one transaction, after the caller's existing workouts.
-- Runs as the caller, so row level security applies to every insert.
-- plan: [{ "name": text, "exercises": [{ "name": text, "sets_reps": text, "linked_to_next": bool }] }]
create or replace function create_plan(plan jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  workout jsonb;
  workout_index int;
  exercise jsonb;
  exercise_index int;
  exercise_count int;
  base_order int;
  new_workout_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if jsonb_typeof(plan) is distinct from 'array'
     or jsonb_array_length(plan) = 0
     or jsonb_array_length(plan) > 7 then
    raise exception 'A plan needs 1 to 7 workouts' using errcode = '22023';
  end if;

  select coalesce(max(sort_order), 0) into base_order from workouts;

  for workout, workout_index in
    select value, ordinality::int from jsonb_array_elements(plan) with ordinality
  loop
    if coalesce(btrim(workout->>'name'), '') = '' then
      raise exception 'Every workout needs a name' using errcode = '22023';
    end if;

    if jsonb_typeof(coalesce(workout->'exercises', '[]'::jsonb)) <> 'array' then
      raise exception 'Exercises must be a list' using errcode = '22023';
    end if;

    exercise_count := jsonb_array_length(coalesce(workout->'exercises', '[]'::jsonb));
    if exercise_count > 12 then
      raise exception 'A workout can have at most 12 exercises' using errcode = '22023';
    end if;

    insert into workouts (name, sort_order)
    values (left(btrim(workout->>'name'), 40), base_order + workout_index)
    returning id into new_workout_id;

    for exercise, exercise_index in
      select value, ordinality::int
      from jsonb_array_elements(coalesce(workout->'exercises', '[]'::jsonb)) with ordinality
    loop
      continue when coalesce(btrim(exercise->>'name'), '') = '';

      insert into exercises (workout_id, name, sets_reps, sort_order, linked_to_next)
      values (
        new_workout_id,
        left(btrim(exercise->>'name'), 60),
        nullif(left(btrim(coalesce(exercise->>'sets_reps', '')), 20), ''),
        exercise_index,
        coalesce((exercise->>'linked_to_next')::boolean, false) and exercise_index < exercise_count
      );
    end loop;
  end loop;
end;
$$;

revoke execute on function claim_plan_generation() from public, anon;
revoke execute on function claim_voice_transcription() from public, anon;
revoke execute on function create_plan(jsonb) from public, anon;
grant execute on function claim_plan_generation() to authenticated;
grant execute on function claim_voice_transcription() to authenticated;
grant execute on function create_plan(jsonb) to authenticated;
