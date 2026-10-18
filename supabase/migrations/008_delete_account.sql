-- Lets a signed-in user delete their own account.
-- Everything they own (profile, workouts, exercises, sessions, notes, bug reports, usage)
-- references auth.users with on delete cascade, so removing the user removes it all.
create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;
