const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIM = 1536;

/** True only when optional paid OpenAI embeddings are configured. */
export function isEmbeddingEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || !text.trim()) {
    return null;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text.slice(0, 8000),
      }),
    });
    if (!res.ok) {
      return null;
    }
    const json = (await res.json()) as { data?: { embedding?: number[] }[] };
    const vec = json.data?.[0]?.embedding;
    if (!vec || vec.length !== EMBEDDING_DIM) {
      return null;
    }
    return vec;
  } catch {
    return null;
  }
}

export { EMBEDDING_DIM };
