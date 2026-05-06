export function formatDueLabel(iso: string | null | undefined): string | null {
  if (iso == null || String(iso).trim() === "") return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
