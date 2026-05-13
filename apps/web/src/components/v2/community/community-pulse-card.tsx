"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, CalendarClock } from "lucide-react";

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

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-fern" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Community pulse
        </p>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          {fb?.communityName ? (
            <p className="text-xs text-muted-foreground pt-1">
              {fb.communityName} · {fb.memberCount} member{fb.memberCount !== 1 ? "s" : ""}
              {fb.nextSessionTitle ? (
                <span className="mt-1 flex items-center gap-1">
                  <CalendarClock className="inline h-3 w-3" /> Next: {fb.nextSessionTitle}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : failed ? (
        <p className="text-sm text-muted-foreground">
          Pulse unavailable right now.{" "}
          <Link href="/community" className="text-moss underline underline-offset-2">
            Open Community
          </Link>
        </p>
      ) : data && !data.hasCommunity ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{data.headline}</p>
          <p className="text-xs text-muted-foreground">{data.socialNudges[0] ?? "Join when you’re ready."}</p>
          <Link
            href="/community"
            className="inline-flex text-xs font-semibold text-moss underline underline-offset-2"
          >
            Go to Community →
          </Link>
        </div>
      ) : data ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{data.headline}</p>

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

          {data.suggestedMicroTasks[0] && onAddSuggested ? (
            <button
              type="button"
              onClick={() =>
                onAddSuggested(data.suggestedMicroTasks[0].title, data.suggestedMicroTasks[0].domain)
              }
              className="w-full rounded-lg border border-moss/40 bg-moss/5 px-3 py-2 text-left text-xs font-medium text-moss transition-colors hover:bg-moss/10"
            >
              Add suggested task: {data.suggestedMicroTasks[0].title}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
