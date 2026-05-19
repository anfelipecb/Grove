import type { AiMessage } from "@grove/core";
import { groqText } from "@/lib/groq";

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
  options?: { temperature?: number },
): Promise<string> {
  return groqText(messages, {
    temperature: options?.temperature,
    model: resolveTierModel(tier),
  });
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
