revoke execute on function public.rls_auto_enable() from anon, authenticated, public;

create index commitments_session_id_idx on public.commitments (session_id);
create index feed_posts_author_id_idx on public.feed_posts (author_id);
create index memberships_profile_id_idx on public.memberships (profile_id);
create index nudges_community_id_idx on public.nudges (community_id);
create index reward_redemptions_reward_id_idx on public.reward_redemptions (reward_id);
create index sessions_created_by_idx on public.sessions (created_by);
create index xp_events_community_id_idx on public.xp_events (community_id);
create index xp_events_goal_id_idx on public.xp_events (goal_id);

drop policy "profiles own row" on public.profiles;
create policy "profiles own row"
  on public.profiles for all
  to authenticated
  using (clerk_user_id = ((select auth.jwt()) ->> 'sub'))
  with check (clerk_user_id = ((select auth.jwt()) ->> 'sub'));

drop policy "memberships visible to community members" on public.memberships;
create policy "memberships visible to community members"
  on public.memberships for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = memberships.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
    or exists (
      select 1 from public.memberships m
      join public.profiles p on p.id = m.profile_id
      where m.community_id = memberships.community_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

drop policy "private profile-owned onboarding" on public.onboarding_responses;
create policy "private profile-owned onboarding"
  on public.onboarding_responses for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = onboarding_responses.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = onboarding_responses.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

drop policy "profile-owned goals" on public.goals;
create policy "profile-owned goals"
  on public.goals for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = goals.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = goals.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

drop policy "profile-owned xp events" on public.xp_events;
create policy "profile-owned xp events"
  on public.xp_events for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = xp_events.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

drop policy "profile-owned rewards" on public.rewards;
create policy "profile-owned rewards"
  on public.rewards for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = rewards.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = rewards.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

drop policy "profile-owned redemptions" on public.reward_redemptions;
create policy "profile-owned redemptions"
  on public.reward_redemptions for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = reward_redemptions.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

drop policy "community session visibility" on public.sessions;
create policy "community session visibility"
  on public.sessions for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      join public.profiles p on p.id = m.profile_id
      where m.community_id = sessions.community_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

drop policy "profile attendance visibility" on public.attendance;
create policy "profile attendance visibility"
  on public.attendance for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = attendance.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

drop policy "commitment visibility" on public.commitments;
create policy "commitment visibility"
  on public.commitments for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = commitments.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
    or exists (
      select 1 from public.memberships m
      join public.profiles p on p.id = m.profile_id
      where m.community_id = commitments.community_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

drop policy "community feed visibility" on public.feed_posts;
create policy "community feed visibility"
  on public.feed_posts for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      join public.profiles p on p.id = m.profile_id
      where m.community_id = feed_posts.community_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

drop policy "private nudges" on public.nudges;
create policy "private nudges"
  on public.nudges for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = nudges.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );
