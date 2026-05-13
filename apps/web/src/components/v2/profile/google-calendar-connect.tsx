"use client";

import { CalendarDays, CheckCircle, ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";

type GoogleCalendarConnectProps = {
  connected: boolean;
};

export function GoogleCalendarConnect({ connected }: GoogleCalendarConnectProps) {
  const searchParams = useSearchParams();
  const justConnected = searchParams.get("connected") === "google";
  const error = searchParams.get("error");

  const isConnected = connected || justConnected;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="h-4 w-4 text-blue-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Google Calendar
        </p>
        {isConnected && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" /> Connected
          </span>
        )}
      </div>

      {error && (
        <p className="mb-2 text-xs text-destructive">
          {error === "not_configured"
            ? "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local to enable this."
            : `Connection failed: ${error}`}
        </p>
      )}

      {isConnected ? (
        <p className="text-xs text-muted-foreground">
          Find Time will avoid scheduling tasks during your existing calendar events.
        </p>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            Connect your calendar so Find Time can see your actual busy slots and schedule around them.
          </p>
          <a
            href="/api/auth/google"
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800/40 dark:bg-blue-900/20 dark:text-blue-400"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Connect Google Calendar
          </a>
        </>
      )}
    </div>
  );
}
