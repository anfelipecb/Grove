create table public.coach_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_type text not null default 'free_chat',
  mood text,
  summary text,
  transcript jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index coach_sessions_profile_started_idx
  on public.coach_sessions (profile_id, started_at desc);

alter table public.coach_sessions enable row level security;

create policy "profile-owned coach_sessions select"
  on public.coach_sessions for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = coach_sessions.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned coach_sessions insert"
  on public.coach_sessions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = coach_sessions.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned coach_sessions update"
  on public.coach_sessions for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = coach_sessions.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = coach_sessions.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );
