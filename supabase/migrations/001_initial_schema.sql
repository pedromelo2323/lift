-- Lift MVP schema

create extension if not exists "pgcrypto";

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  name text not null,
  sets_reps text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists exercise_sessions (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises(id) on delete cascade,
  session_date date not null,
  sets jsonb not null default '[
    {"weight": null, "reps": null},
    {"weight": null, "reps": null},
    {"weight": null, "reps": null}
  ]'::jsonb,
  created_at timestamptz not null default now(),
  unique (exercise_id, session_date)
);

create table if not exists exercise_notes (
  exercise_id uuid primary key references exercises(id) on delete cascade,
  note text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists idx_exercises_workout_id on exercises(workout_id);
create index if not exists idx_exercise_sessions_exercise_id on exercise_sessions(exercise_id);
create index if not exists idx_exercise_sessions_date on exercise_sessions(session_date desc);

alter table workouts enable row level security;
alter table exercises enable row level security;
alter table exercise_sessions enable row level security;
alter table exercise_notes enable row level security;

-- MVP: single-user, no auth yet
create policy "Allow all access to workouts" on workouts for all using (true) with check (true);
create policy "Allow all access to exercises" on exercises for all using (true) with check (true);
create policy "Allow all access to exercise_sessions" on exercise_sessions for all using (true) with check (true);
create policy "Allow all access to exercise_notes" on exercise_notes for all using (true) with check (true);
