const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSlugInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");
}

export function isValidCommunitySlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= 120 && SLUG_REGEX.test(slug);
}

export function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "23505") return true;
  const m = error.message?.toLowerCase() ?? "";
  return m.includes("duplicate") || m.includes("unique constraint");
}
