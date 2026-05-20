"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, CalendarClock, ChevronDown } from "lucide-react";

export type CommunityPulsePayload = {
  hasCommunity: boolean;
  headline: string;
  balanceTips: string[];
  socialNudges: string[];
  suggestedMicroTasks: Array<{ title: string; domain: string; rationale: string; is_community_task?: boolean }>;
};

export type CommunityPulseFallback = {
  communityName: string | null;
  memberCount: number;
  nextSessionTitle: string | null;
};

export function CommunityPulseCard({
  profileId,
  fallbackPulse,
  onAddSuggested,
}: {
  profileId: string;
  fallbackPulse?: CommunityPulseFallback | null;
  onAddSuggested?: (title: string, domain: string) => void;
}) {
  const [data, setData] = useState<CommunityPulsePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/v2/coach/community-balance", { method: "POST" });
        if (!res.ok) throw new Error("bad status");
        const payload = (await res.json()) as CommunityPulsePayload;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const fb = fallbackPulse;
  const extraCount =
    data && data.hasCommunity
      ? data.balanceTips.length + Math.max(0, data.socialNudges.length - 1)
      : 0;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 dark:bg-muted/10">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-fern" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Community pulse</p>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 w-2/3 rounded bg-muted" />
          {fb?.nextSessionTitle ? (
            <p className="truncate text-xs text-muted-foreground pt-1">Next: {fb.nextSessionTitle}</p>
          ) : null}
        </div>
      ) : failed ? (
        <Link href="/community" className="text-sm text-moss underline underline-offset-2">
          Open Community
        </Link>
      ) : data && !data.hasCommunity ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground line-clamp-2">{data.headline}</p>
          <Link href="/community" className="text-xs font-semibold text-moss underline underline-offset-2">
            Go to Community →
          </Link>
        </div>
      ) : data ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground line-clamp-2">{data.headline}</p>

          {!expanded && data.socialNudges[0] && extraCount === 0 ? (
            <p className="flex gap-1.5 text-xs text-muted-foreground line-clamp-1">
              <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
              <span>{data.socialNudges[0]}</span>
            </p>
          ) : null}

          {extraCount > 0 || (data.balanceTips.length > 0 && expanded) || data.socialNudges.length > 1 ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
              {expanded ? "Less" : extraCount > 0 ? `More (${extraCount})` : "More"}
            </button>
          ) : null}

          {expanded ? (
            <>
              {data.balanceTips.length > 0 && (
                <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                  {data.balanceTips.map((tip, i) => (
                    <li key={`tip-${i}`}>{tip}</li>
                  ))}
                </ul>
              )}
              {data.socialNudges.length > 0 && (
                <div className="space-y-1">
                  {data.socialNudges.map((line, i) => (
                    <p key={`soc-${i}`} className="flex gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span>{line}</span>
                    </p>
                  ))}
                </div>
              )}
            </>
          ) : null}

          {data.suggestedMicroTasks[0] && onAddSuggested ? (
            <button
              type="button"
              onClick={() =>
                onAddSuggested(data.suggestedMicroTasks[0].title, data.suggestedMicroTasks[0].domain)
              }
              className="w-full rounded-lg border border-moss/40 bg-moss/5 px-3 py-2 text-left text-xs font-medium text-moss transition-colors hover:bg-moss/10"
            >
              {data.suggestedMicroTasks[0].title}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
