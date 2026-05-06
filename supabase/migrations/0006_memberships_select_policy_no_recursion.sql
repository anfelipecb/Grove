-- Fix "infinite recursion detected in policy for relation memberships" caused by the SELECT
-- policy scanning memberships inside its own USING clause. Use SECURITY DEFINER to evaluate
-- co-member visibility without re-entering RLS on memberships.

create or replace function public.current_user_is_member_of_community(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    join public.profiles p on p.id = m.profile_id
    where m.community_id = p_community_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
  );
$$;

revoke all on function public.current_user_is_member_of_community(uuid) from public;
grant execute on function public.current_user_is_member_of_community(uuid) to authenticated;

drop policy if exists "memberships visible to community members" on public.memberships;

create policy "memberships visible to community members"
  on public.memberships for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = memberships.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
    or public.current_user_is_member_of_community(memberships.community_id)
  );
