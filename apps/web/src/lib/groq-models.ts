const DECOMMISSIONED_MODEL = "llama-3.1-70b-versatile";
const REPLACEMENT_MODEL = "llama-3.3-70b-versatile";

/** Remap decommissioned Groq models (e.g. stale Vercel GROQ_MODEL). */
export function normalizeGroqModel(model: string): string {
  if (model === DECOMMISSIONED_MODEL) return REPLACEMENT_MODEL;
  return model;
}

export const GROQ_TIER_MODELS = {
  fast: "llama-3.1-8b-instant",
  balanced: REPLACEMENT_MODEL,
  deep: REPLACEMENT_MODEL,
} as const;
