import type { AiMessage } from "@grove/core";
import { GROQ_TIER_MODELS, normalizeGroqModel } from "@/lib/groq-models";
import { groqText } from "@/lib/groq";
import { getOrFetch } from "@/lib/response-cache";

export type LlmTier = "fast" | "balanced" | "deep";

function firstNonWhitespace(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveTierModel(tier: LlmTier): string {
  const envModel = firstNonWhitespace(process.env.GROQ_MODEL);
  const raw = envModel ?? GROQ_TIER_MODELS[tier];
  return normalizeGroqModel(raw);
}

export async function routedCompletion(
  messages: AiMessage[],
  tier: LlmTier,
  options?: { temperature?: number; max_tokens?: number; cacheKey?: string; cacheTtlSeconds?: number },
): Promise<string> {
  const call = () =>
    groqText(messages, {
      temperature: options?.temperature,
      max_tokens: options?.max_tokens,
      model: resolveTierModel(tier),
    });

  const cacheKey = options?.cacheKey?.trim();
  if (cacheKey) {
    return getOrFetch(cacheKey, options?.cacheTtlSeconds ?? 600, call);
  }

  return call();
}

export function compressPromptBodyForTier<T>(body: T, tier: LlmTier): T {
  if (tier !== "fast" || body == null || typeof body !== "object" || Array.isArray(body)) {
    return body;
  }

  const next = { ...(body as Record<string, unknown>) };
  delete next.xpEvents;
  delete next.focusNotesRaw;
  return next as T;
}
