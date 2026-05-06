import type { IntakeDraft, MemberProfileCard } from "@grove/core";

export const CHIP_DISPLAY_MAX = 72;

export function normalizeChipLabel(raw: string, maxLen = CHIP_DISPLAY_MAX): string {
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s.length) return s;
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 1)}…`;
}

function dedupeCaseInsensitive(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const t = item.replace(/\s+/g, " ").trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

export function filterSuggestionsAgainstStatic(suggestions: string[], staticChips: string[]): string[] {
  const staticLower = new Set(staticChips.map((s) => s.toLowerCase()));
  return dedupeCaseInsensitive(suggestions).filter((s) => !staticLower.has(s.toLowerCase()));
}

export async function postProfileForSuggestions(
  intake: IntakeDraft,
  signal: AbortSignal,
): Promise<{ profile?: MemberProfileCard; safety?: boolean; message?: string } | null> {
  const res = await fetch("/api/ai/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(intake),
    signal,
  });
  const raw = await res.text();
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;
  if (o.safety === true) {
    return { safety: true, message: typeof o.message === "string" ? o.message : undefined };
  }
  if (o.profile && typeof o.profile === "object") {
    return { profile: o.profile as MemberProfileCard };
  }
  return null;
}
