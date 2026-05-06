"use client";

export function CoachGreeting({
  fallbackBlurb,
  greeting,
  insight,
  loading,
}: {
  fallbackBlurb: string;
  greeting: string | null;
  insight: string | null;
  loading: boolean;
}) {
  const primary = loading ? fallbackBlurb : (greeting ?? fallbackBlurb);
  const showInsight = !loading && insight && insight.trim().length > 0;

  return (
    <div className="mt-4 space-y-2">
      <p className="line-clamp-3 text-sm leading-relaxed text-foreground">{primary}</p>
      {showInsight ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{insight}</p>
      ) : null}
    </div>
  );
}
