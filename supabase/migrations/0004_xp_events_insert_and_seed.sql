-- Allow users to log their own XP events (needed when completing goals from the app).
create policy "profile-owned xp events insert"
  on public.xp_events for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = xp_events.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

-- Allow joining a community when the membership row references the user's profile.
create policy "memberships insert self"
  on public.memberships for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = memberships.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

-- Default community for new members (idempotent).
insert into public.communities (name, slug, description)
values (
  'Grove Welcome',
  'grove-welcome',
  'A starter space to practice commitments and feed posts while your cohort grows.'
)
on conflict (slug) do nothing;
