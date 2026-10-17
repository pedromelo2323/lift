-- Lock every table to its owner.
-- Rows logged before accounts existed have no owner; they are assigned to the single admin,
-- so add the admin to app_admins before running this. Runs as one transaction: any error
-- leaves the database untouched.

begin;

create table if not exists backup_006_workouts as table workouts;
create table if not exists backup_006_exercises as table exercises;
create table if not exists backup_006_exercise_sessions as table exercise_sessions;
create table if not exists backup_006_exercise_notes as table exercise_notes;
create table if not exists backup_006_bug_reports as table bug_reports;

alter table backup_006_workouts enable row level security;
alter table backup_006_exercises enable row level security;
alter table backup_006_exercise_sessions enable row level security;
alter table backup_006_exercise_notes enable row level security;
alter table backup_006_bug_reports enable row level security;

do $$
declare
  owner uuid;
  admin_count int;
begin
  if exists (select 1 from workouts where user_id is null)
    or exists (select 1 from exercises where user_id is null)
    or exists (select 1 from exercise_sessions where user_id is null)
    or exists (select 1 from exercise_notes where user_id is null)
    or exists (select 1 from bug_reports where user_id is null)
  then
    select count(*) into admin_count from app_admins;
    if admin_count <> 1 then
      raise exception 'Existing rows need an owner: expected exactly 1 admin in app_admins, found %', admin_count;
    end if;
    select user_id into owner from app_admins;

    update workouts set user_id = owner where user_id is null;
    update exercises set user_id = owner where user_id is null;
    update exercise_sessions set user_id = owner where user_id is null;
    update exercise_notes set user_id = owner where user_id is null;
    update bug_reports set user_id = owner where user_id is null;
  end if;
end;
$$;

alter table workouts alter column user_id set not null;
alter table exercises alter column user_id set not null;
alter table exercise_sessions alter column user_id set not null;
alter table exercise_notes alter column user_id set not null;
alter table bug_reports alter column user_id set not null;

drop policy if exists "Allow all access to workouts" on workouts;
drop policy if exists "Allow all access to exercises" on exercises;
drop policy if exists "Allow all access to exercise_sessions" on exercise_sessions;
drop policy if exists "Allow all access to exercise_notes" on exercise_notes;
drop policy if exists "Allow all access to bug_reports" on bug_reports;

create policy "Own workouts" on workouts
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Children must also hang off a parent the user owns.
create policy "Own exercises" on exercises
  for all to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid())
  );

create policy "Own exercise sessions" on exercise_sessions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from exercises e where e.id = exercise_id and e.user_id = auth.uid())
  );

create policy "Own exercise notes" on exercise_notes
  for all to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from exercises e where e.id = exercise_id and e.user_id = auth.uid())
  );

create policy "Read own reports, admins read all" on bug_reports
  for select to authenticated using (auth.uid() = user_id or is_admin());
create policy "File own reports" on bug_reports
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Change own reports, admins change all" on bug_reports
  for update to authenticated
  using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());
create policy "Delete own reports, admins delete all" on bug_reports
  for delete to authenticated using (auth.uid() = user_id or is_admin());

revoke all on workouts, exercises, exercise_sessions, exercise_notes, bug_reports from anon;

commit;
