create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where id = auth.uid()
  limit 1;
$$;

create or replace function public.current_user_branch_id()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select branch_id
  from public.users
  where id = auth.uid()
  limit 1;
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_branch_id() to authenticated;

alter table public.users enable row level security;

drop policy if exists "users_select_self" on public.users;
drop policy if exists "admins_select_all_users" on public.users;
drop policy if exists "branch_management_select_branch_users" on public.users;
drop policy if exists "admins_update_all_users" on public.users;
drop policy if exists "branch_management_update_branch_users" on public.users;

create policy "users_select_self"
on public.users
for select
to authenticated
using (id = auth.uid());

create policy "admins_select_all_users"
on public.users
for select
to authenticated
using (public.current_user_role() = 'admin');

create policy "branch_management_select_branch_users"
on public.users
for select
to authenticated
using (
  public.current_user_role() in ('manager', 'supervisor')
  and branch_id = public.current_user_branch_id()
);

create policy "admins_update_all_users"
on public.users
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "branch_management_update_branch_users"
on public.users
for update
to authenticated
using (
  public.current_user_role() in ('manager', 'supervisor')
  and branch_id = public.current_user_branch_id()
)
with check (
  public.current_user_role() in ('manager', 'supervisor')
  and branch_id = public.current_user_branch_id()
  and role <> 'admin'
);
