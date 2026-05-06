-- Allow builders to create communities (with creator linkage) and managers to update listing fields.
-- Compensating rollback: delete orphaned community with no memberships while still creator.

alter table public.communities
  add column if not exists created_by uuid references public.profiles(id);

create policy "communities insert as self creator"
  on public.communities for insert
  to authenticated
  with check (
    created_by is not null
    and exists (
      select 1 from public.profiles p
      where p.id = communities.created_by
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "communities update for managers"
  on public.communities for update
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      join public.profiles p on p.id = m.profile_id
      where m.community_id = communities.id
      and m.role in ('owner', 'organizer')
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from public.memberships m
      join public.profiles p on p.id = m.profile_id
      where m.community_id = communities.id
      and m.role in ('owner', 'organizer')
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

-- Remove only empty communities created by current user (used if membership insert fails after community insert).
create policy "communities delete empty creator"
  on public.communities for delete
  to authenticated
  using (
    created_by is not null
    and exists (
      select 1 from public.profiles p
      where p.id = communities.created_by
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
    and not exists (
      select 1 from public.memberships m where m.community_id = communities.id
    )
  );
