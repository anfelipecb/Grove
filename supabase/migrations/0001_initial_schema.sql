create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  display_name text not null,
  email text,
  private_focus_notes jsonb not null default '{}'::jsonb,
  public_support_preferences jsonb not null default '{}'::jsonb,
  total_xp integer not null default 0,
  spendable_points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'organizer', 'member')),
  joined_at timestamptz not null default now(),
  unique (community_id, profile_id)
);

create table public.onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  responses jsonb not null,
  profile_card jsonb,
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,
  title text not null,
  domain text not null,
  subarea text,
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'archived')),
  due_at timestamptz,
  xp_value integer not null default 0,
  spendable_value integer not null default 0,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,
  goal_id uuid references public.goals(id) on delete set null,
  reason text not null,
  xp integer not null,
  spendable_points integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  cost integer not null check (cost > 0),
  visibility text not null default 'private' check (visibility in ('private', 'community')),
  created_at timestamptz not null default now()
);

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  cost integer not null,
  created_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  agenda text,
  starts_at timestamptz,
  notes text,
  summary jsonb,
  created_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'rsvp' check (status in ('rsvp', 'attended', 'missed')),
  created_at timestamptz not null default now(),
  unique (session_id, profile_id)
);

create table public.commitments (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  title text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'dropped')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('win', 'resource', 'session_summary', 'commitment', 'note')),
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,
  channel text not null check (channel in ('in_app', 'email')),
  subject text,
  body text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'dismissed', 'failed')),
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index profiles_clerk_user_id_idx on public.profiles (clerk_user_id);
create index memberships_community_profile_idx on public.memberships (community_id, profile_id);
create index onboarding_responses_profile_id_idx on public.onboarding_responses (profile_id);
create index goals_profile_id_idx on public.goals (profile_id);
create index goals_community_id_idx on public.goals (community_id);
create index xp_events_profile_id_idx on public.xp_events (profile_id);
create index rewards_profile_id_idx on public.rewards (profile_id);
create index reward_redemptions_profile_id_idx on public.reward_redemptions (profile_id);
create index sessions_community_id_idx on public.sessions (community_id);
create index attendance_profile_id_idx on public.attendance (profile_id);
create index commitments_profile_id_idx on public.commitments (profile_id);
create index commitments_community_id_idx on public.commitments (community_id);
create index feed_posts_community_id_idx on public.feed_posts (community_id);
create index nudges_profile_id_idx on public.nudges (profile_id);

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.memberships enable row level security;
alter table public.onboarding_responses enable row level security;
alter table public.goals enable row level security;
alter table public.xp_events enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.sessions enable row level security;
alter table public.attendance enable row level security;
alter table public.commitments enable row level security;
alter table public.feed_posts enable row level security;
alter table public.nudges enable row level security;

create policy "profiles own row"
  on public.profiles for all
  to authenticated
  using (clerk_user_id = (select auth.jwt() ->> 'sub'))
  with check (clerk_user_id = (select auth.jwt() ->> 'sub'));

create policy "communities visible to authenticated users"
  on public.communities for select
  to authenticated
  using (true);

create policy "memberships visible to community members"
  on public.memberships for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = memberships.profile_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
    or exists (
      select 1 from public.memberships m
      join public.profiles p on p.id = m.profile_id
      where m.community_id = memberships.community_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "private profile-owned onboarding"
  on public.onboarding_responses for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = onboarding_responses.profile_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = onboarding_responses.profile_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "profile-owned goals"
  on public.goals for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = goals.profile_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = goals.profile_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "profile-owned xp events"
  on public.xp_events for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = xp_events.profile_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "profile-owned rewards"
  on public.rewards for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = rewards.profile_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = rewards.profile_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "profile-owned redemptions"
  on public.reward_redemptions for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = reward_redemptions.profile_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "community session visibility"
  on public.sessions for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      join public.profiles p on p.id = m.profile_id
      where m.community_id = sessions.community_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "profile attendance visibility"
  on public.attendance for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = attendance.profile_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "commitment visibility"
  on public.commitments for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = commitments.profile_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
    or exists (
      select 1 from public.memberships m
      join public.profiles p on p.id = m.profile_id
      where m.community_id = commitments.community_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "community feed visibility"
  on public.feed_posts for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      join public.profiles p on p.id = m.profile_id
      where m.community_id = feed_posts.community_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "private nudges"
  on public.nudges for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = nudges.profile_id
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
    )
  );
