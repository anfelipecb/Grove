alter table public.profiles
  add column if not exists community_points integer not null default 0;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  community_id uuid references public.communities(id) on delete set null,
  title text not null,
  domain text not null,
  is_required boolean not null default false,
  is_community_task boolean not null default false,
  point_value integer not null default 10,
  community_point_value integer not null default 0,
  frequency text not null default 'once' check (frequency in ('daily', 'weekly', 'once')),
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now()
);

create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  completed_date date not null default current_date,
  notes text,
  points_earned integer not null default 0,
  community_points_earned integer not null default 0,
  created_at timestamptz not null default now(),
  unique (task_id, profile_id, completed_date)
);

create table public.scheduled_tasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_date date not null,
  created_at timestamptz not null default now(),
  unique (task_id, profile_id, scheduled_date)
);

create index tasks_profile_id_idx on public.tasks (profile_id);
create index task_completions_profile_id_completed_date_idx on public.task_completions (profile_id, completed_date);
create index scheduled_tasks_profile_id_scheduled_date_idx on public.scheduled_tasks (profile_id, scheduled_date);

alter table public.tasks enable row level security;
alter table public.task_completions enable row level security;
alter table public.scheduled_tasks enable row level security;

create policy "profile-owned tasks select"
  on public.tasks for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = tasks.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned tasks insert"
  on public.tasks for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = tasks.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned tasks delete"
  on public.tasks for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = tasks.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned task completions select"
  on public.task_completions for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = task_completions.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned task completions insert"
  on public.task_completions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = task_completions.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned task completions delete"
  on public.task_completions for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = task_completions.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned scheduled tasks select"
  on public.scheduled_tasks for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = scheduled_tasks.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned scheduled tasks insert"
  on public.scheduled_tasks for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = scheduled_tasks.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned scheduled tasks delete"
  on public.scheduled_tasks for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = scheduled_tasks.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );
