-- Optional semantic search when OPENAI_API_KEY is set (paid embeddings).
-- Safe to skip: coach memory works via search_coach_memory_text without this file.

create extension if not exists vector;

alter table public.coach_memory_chunks
  add column if not exists embedding vector(1536);

create index if not exists coach_memory_chunks_embedding_idx
  on public.coach_memory_chunks
  using hnsw (embedding vector_cosine_ops)
  where embedding is not null;

create or replace function public.match_coach_memory(
  p_profile_id uuid,
  p_embedding vector(1536),
  p_match_count int default 5
)
returns table (
  id uuid,
  content text,
  source_type text,
  metadata jsonb,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.content,
    c.source_type,
    c.metadata,
    1 - (c.embedding <=> p_embedding) as similarity
  from public.coach_memory_chunks c
  where c.profile_id = p_profile_id
    and c.embedding is not null
  order by c.embedding <=> p_embedding
  limit greatest(1, least(p_match_count, 10));
$$;

grant execute on function public.match_coach_memory(uuid, vector(1536), int) to authenticated;
