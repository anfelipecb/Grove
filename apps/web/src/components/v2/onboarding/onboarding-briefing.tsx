"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { LIFE_DOMAINS } from "@grove/core";
import { CoachChatPanel, type CoachChatContext } from "@/components/v2/coach/coach-chat-panel";
import { DomainTag } from "@/components/v2/shared/domain-tag";

const STYLE_LABELS: Record<string, string> = {
  structured: "Structured",
  gentle: "Gentle",
  direct: "Direct",
  brief: "Brief",
};

export type OnboardingBriefingProps = {
  name: string;
  goals: string[];
  style: string;
  topDomains: Array<{ domain: string; pct: number }>;
  devPreview?: boolean;
};

export function OnboardingBriefing({ name, goals, style, topDomains, devPreview = false }: OnboardingBriefingProps) {
  const router = useRouter();
  const displayName = name.trim() || "there";
  const styleLabel = STYLE_LABELS[style] ?? style;
  const goalsLine = goals.length > 0 ? goals.join(", ") : "your goals";

  const context: CoachChatContext = {
    today: new Date().toISOString().slice(0, 10),
    topGoalTitle: goals[0] ?? null,
    activeGoals: goals.map((title) => ({ title, domain: topDomains[0]?.domain ?? "work_build" })),
    todayTasks: [],
    recentXp: [],
  };

  const initialAssistantMessage = `Based on what you shared, here's what I'm thinking for your first week: ${goalsLine}. Want me to break any of these into smaller tasks?`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          <span className="text-lg font-bold text-moss">Grove</span>
          <Sparkles className="h-4 w-4 text-moss/60" />
          {devPreview && (
            <span className="ml-2 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/30 dark:text-amber-200">
              Preview mode
            </span>
          )}
        </div>
        <h1 className="mx-auto mt-4 max-w-5xl text-2xl font-bold text-foreground">
          Here&apos;s your plan, {displayName}.
        </h1>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-stretch">
        <section className="rounded-xl border border-border bg-card p-5 lg:w-[min(360px,40%)] lg:shrink-0">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your focus</h2>
          {goals.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              {goals.map((g) => (
                <li key={g} className="flex gap-2">
                  <span className="text-moss">•</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Goals will show up once you add them on Today.</p>
          )}

          {topDomains.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top domains</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {topDomains.map(({ domain, pct }) => {
                  const label = LIFE_DOMAINS.find((d) => d.id === domain)?.label ?? domain;
                  return (
                    <span key={domain} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <DomainTag domain={domain} showInfo={false} />
                      <span>{pct}%</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coaching style</p>
            <span className="mt-2 inline-flex rounded-full border border-moss/30 bg-moss/10 px-3 py-1 text-xs font-medium text-moss">
              {styleLabel}
            </span>
          </div>
        </section>

        <section className="flex min-h-[320px] flex-1 flex-col rounded-xl border border-border bg-card overflow-hidden">
          <CoachChatPanel
            demoMode
            displayName={displayName}
            profileId="onboarding"
            context={context}
            initialAssistantMessage={initialAssistantMessage}
          />
        </section>
      </main>

      <footer className="border-t border-border px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => {
            if (devPreview) {
              window.location.assign("/api/dev/set-demo-cookie");
            } else {
              router.push("/today");
            }
          }}
          className="mx-auto block w-full max-w-5xl rounded-xl bg-moss py-3.5 text-sm font-semibold text-white transition-colors hover:bg-moss/90"
        >
          Let&apos;s go →
        </button>
      </footer>
    </div>
  );
}
