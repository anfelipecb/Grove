-- Upsert into memberships triggers UPDATE when (community_id, profile_id) already exists.
-- Inserts had RLS ("memberships insert self") but UPDATE had no policy, causing:
-- "new row violates row-level security policy (USING expression) for table memberships".
create policy "memberships update self"
  on public.memberships for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = memberships.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = memberships.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );
