-- Accounts: profiles, admins, and an owner column on every table.
-- Additive only. The open policies stay until 006, so the running app keeps working.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
revoke all on profiles from anon;

-- No policies: rows can only be changed from the SQL editor or with the service role.
create table if not exists app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table app_admins enable row level security;
revoke all on app_admins from anon, authenticated;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from app_admins where user_id = auth.uid());
$$;

revoke execute on function is_admin() from public, anon;
grant execute on function is_admin() to authenticated;

drop policy if exists "Read own profile, admins read all" on profiles;
drop policy if exists "Create own profile" on profiles;
drop policy if exists "Update own profile" on profiles;

create policy "Read own profile, admins read all" on profiles
  for select to authenticated using (auth.uid() = id or is_admin());
create policy "Create own profile" on profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "Update own profile" on profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on profiles;
create trigger profiles_touch_updated_at
  before update on profiles
  for each row execute function touch_updated_at();

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

insert into profiles (id, display_name)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

-- Defaulting to auth.uid() means inserts from the app need no owner field.
alter table workouts
  add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table exercises
  add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table exercise_sessions
  add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table exercise_notes
  add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table bug_reports
  add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;

create index if not exists idx_workouts_user_id on workouts(user_id);
create index if not exists idx_exercises_user_id on exercises(user_id);
create index if not exists idx_exercise_sessions_user_id on exercise_sessions(user_id);
create index if not exists idx_exercise_notes_user_id on exercise_notes(user_id);
create index if not exists idx_bug_reports_user_id on bug_reports(user_id);
