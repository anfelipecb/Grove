import type { AiMessage } from "@grove/core";
import { groqText } from "@/lib/groq";
import { getOrFetch } from "@/lib/response-cache";

export type LlmTier = "fast" | "balanced" | "deep";

const DEFAULT_TIER_MODELS: Record<LlmTier, string> = {
  fast: "llama-3.1-8b-instant",
  balanced: "llama-3.1-70b-versatile",
  deep: "llama-3.3-70b-versatile",
};

function firstNonWhitespace(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveTierModel(tier: LlmTier): string {
  return firstNonWhitespace(process.env.GROQ_MODEL) ?? DEFAULT_TIER_MODELS[tier];
}

export async function routedCompletion(
  messages: AiMessage[],
  tier: LlmTier,
  options?: { temperature?: number; cacheKey?: string; cacheTtlSeconds?: number },
): Promise<string> {
  const call = () =>
    groqText(messages, {
      temperature: options?.temperature,
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
