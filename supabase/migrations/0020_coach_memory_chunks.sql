-- Coach memory: text + Postgres full-text search (no paid embedding API required).
-- Optional vector search is added in 0021 when OPENAI_API_KEY is configured.

create table public.coach_memory_chunks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in ('journal', 'session_summary', 'debrief')),
  source_id uuid,
  content text not null,
  content_tsv tsvector generated always as (to_tsvector('english', coalesce(content, ''))) stored,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index coach_memory_chunks_profile_created_idx
  on public.coach_memory_chunks (profile_id, created_at desc);

create index coach_memory_chunks_content_tsv_idx
  on public.coach_memory_chunks using gin (content_tsv);

create unique index coach_memory_chunks_source_unique
  on public.coach_memory_chunks (profile_id, source_type, source_id)
  where source_id is not null;

alter table public.coach_memory_chunks enable row level security;

create policy "profile-owned coach_memory select"
  on public.coach_memory_chunks for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = coach_memory_chunks.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned coach_memory insert"
  on public.coach_memory_chunks for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = coach_memory_chunks.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned coach_memory update"
  on public.coach_memory_chunks for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = coach_memory_chunks.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = coach_memory_chunks.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

create policy "profile-owned coach_memory delete"
  on public.coach_memory_chunks for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = coach_memory_chunks.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );

-- Full-text search (free, runs in Supabase Postgres).
create or replace function public.search_coach_memory_text(
  p_profile_id uuid,
  p_query text,
  p_match_count int default 5
)
returns table (
  id uuid,
  content text,
  source_type text,
  metadata jsonb,
  rank real
)
language sql
stable
security definer
set search_path = public
as $$
  with cleaned as (
    select nullif(trim(regexp_replace(coalesce(p_query, ''), '[^\w\s]', ' ', 'g')), '') as q
  )
  select
    c.id,
    c.content,
    c.source_type,
    c.metadata,
    case
      when (select q from cleaned) is null then 0::real
      else ts_rank(c.content_tsv, plainto_tsquery('english', (select q from cleaned)))
    end as rank
  from public.coach_memory_chunks c
  where c.profile_id = p_profile_id
    and (
      (select q from cleaned) is null
      or c.content_tsv @@ plainto_tsquery('english', (select q from cleaned))
    )
  order by rank desc, c.created_at desc
  limit greatest(1, least(coalesce(p_match_count, 5), 10));
$$;

grant execute on function public.search_coach_memory_text(uuid, text, int) to authenticated;
