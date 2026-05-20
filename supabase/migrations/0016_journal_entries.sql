create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  entry_date text not null,
  mood text,
  created_at timestamptz not null default now(),
  unique (profile_id, entry_date)
);

create index journal_entries_profile_id_entry_date_idx
  on public.journal_entries (profile_id, entry_date desc);

alter table public.journal_entries enable row level security;

create policy "profile-owned journal select"
  on public.journal_entries for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = journal_entries.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned journal insert"
  on public.journal_entries for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = journal_entries.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned journal update"
  on public.journal_entries for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = journal_entries.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = journal_entries.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );
