import type { SupabaseClient } from "@supabase/supabase-js";
import { embedText, isEmbeddingEnabled } from "@/lib/coach-embeddings";

export type CoachMemoryRow = {
  content: string;
  source_type: string;
  metadata: Record<string, unknown>;
};

export async function upsertCoachMemoryChunk(
  supabase: SupabaseClient,
  params: {
    profileId: string;
    sourceType: "journal" | "session_summary" | "debrief";
    sourceId: string | null;
    content: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const content = params.content.trim();
  if (!content) {
    return;
  }

  const row: Record<string, unknown> = {
    profile_id: params.profileId,
    source_type: params.sourceType,
    source_id: params.sourceId,
    content,
    metadata: params.metadata ?? {},
  };

  const embedding = isEmbeddingEnabled() ? await embedText(content) : null;
  if (embedding) {
    row.embedding = embedding;
  }

  if (params.sourceId) {
    await supabase
      .from("coach_memory_chunks")
      .delete()
      .eq("profile_id", params.profileId)
      .eq("source_type", params.sourceType)
      .eq("source_id", params.sourceId);
  }

  const { error } = await supabase.from("coach_memory_chunks").insert(row);
  if (error) {
    console.error("[coach-memory] insert failed:", error.message);
  }
}

async function retrieveByVector(
  supabase: SupabaseClient,
  profileId: string,
  queryText: string,
  limit: number,
): Promise<CoachMemoryRow[]> {
  const embedding = await embedText(queryText);
  if (!embedding) {
    return [];
  }

  const { data, error } = await supabase.rpc("match_coach_memory", {
    p_profile_id: profileId,
    p_embedding: embedding,
    p_match_count: limit,
  });

  if (error || !data) {
    return [];
  }

  return (data as { content: string; source_type: string; metadata: Record<string, unknown> }[]).map(
    (row) => ({
      content: row.content,
      source_type: row.source_type,
      metadata: row.metadata ?? {},
    }),
  );
}

async function retrieveByFullText(
  supabase: SupabaseClient,
  profileId: string,
  queryText: string,
  limit: number,
): Promise<CoachMemoryRow[]> {
  const { data, error } = await supabase.rpc("search_coach_memory_text", {
    p_profile_id: profileId,
    p_query: queryText.trim(),
    p_match_count: limit,
  });

  if (error) {
    console.error("[coach-memory] fts failed:", error.message);
    return retrieveRecentChunks(supabase, profileId, limit);
  }

  const rows = (data ?? []) as {
    content: string;
    source_type: string;
    metadata: Record<string, unknown>;
  }[];

  if (rows.length > 0) {
    return rows.map((row) => ({
      content: row.content,
      source_type: row.source_type,
      metadata: row.metadata ?? {},
    }));
  }

  return retrieveRecentChunks(supabase, profileId, limit);
}

async function retrieveRecentChunks(
  supabase: SupabaseClient,
  profileId: string,
  limit: number,
): Promise<CoachMemoryRow[]> {
  const { data } = await supabase
    .from("coach_memory_chunks")
    .select("content, source_type, metadata")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as CoachMemoryRow[]).map((row) => ({
    content: row.content,
    source_type: row.source_type,
    metadata: row.metadata ?? {},
  }));
}

/**
 * Retrieves coach memory for Mycelium context.
 * - With OPENAI_API_KEY + migration 0021: vector similarity first, then FTS fallback.
 * - Without OpenAI: Postgres full-text search (free), then recent chunks.
 */
export async function retrieveCoachMemory(
  supabase: SupabaseClient,
  profileId: string,
  queryText: string,
  limit = 5,
): Promise<CoachMemoryRow[]> {
  if (isEmbeddingEnabled()) {
    const vectorHits = await retrieveByVector(supabase, profileId, queryText, limit);
    if (vectorHits.length > 0) {
      return vectorHits;
    }
  }

  return retrieveByFullText(supabase, profileId, queryText, limit);
}
