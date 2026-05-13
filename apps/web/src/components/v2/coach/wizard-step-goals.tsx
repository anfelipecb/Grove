"use client";

import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import type { CoachGoalSuggestion } from "@/components/v2/coach/types";

const inputBase =
  "w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none ring-moss/20 transition focus:border-moss focus:ring-4";

type Props = {
  customTitle: string;
  domainId: LifeDomainId;
  error: string | null;
  loading: boolean;
  promptText: string;
  selectedKeys: string[];
  suggestions: CoachGoalSuggestion[];
  onBack: () => void;
  onContinue: () => void;
  onCustomTitleChange: (value: string) => void;
  onRefresh: () => void;
  onToggleKey: (key: string) => void;
};

function domainLabel(domainId: LifeDomainId): string {
  return LIFE_DOMAINS.find((entry) => entry.id === domainId)?.label ?? "Selected domain";
}

export function WizardStepGoals({
  customTitle,
  domainId,
  error,
  loading,
  promptText,
  selectedKeys,
  suggestions,
  onBack,
  onContinue,
  onCustomTitleChange,
  onRefresh,
  onToggleKey,
}: Props) {
  return (
    <section className="rounded-[28px] border border-border bg-card/95 p-5 shadow-panel dark:shadow-panel-dark">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Step 2 of 4</p>
      <h2 className="mt-2 text-2xl font-semibold text-foreground">Pick one or more goals for {domainLabel(domainId)}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Coach used your prompt to suggest a few practical goals. Select the ones that fit, or write your own.
      </p>

      <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your prompt</p>
        <p className="mt-1 text-sm leading-6 text-foreground">{promptText}</p>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {suggestions.map((suggestion, index) => {
          const key = `suggestion-${index}`;
          const active = selectedKeys.includes(key);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggleKey(key)}
              className={`rounded-3xl border p-4 text-left transition ${
                active
                  ? "border-moss bg-moss/10 shadow-[0_0_0_1px_rgba(112,146,103,0.2)]"
                  : "border-border bg-background hover:border-moss/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-foreground">{suggestion.title}</h3>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    active ? "bg-moss text-moss-fg" : "border border-border text-muted-foreground"
                  }`}
                >
                  {active ? "Selected" : "Goal"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{suggestion.rationale}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-3xl border border-dashed border-border bg-background/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Custom…</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Write your own goal if the suggestions are close but not quite right.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggleKey("custom")}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              selectedKeys.includes("custom")
                ? "border-moss bg-moss text-moss-fg"
                : "border-border bg-card text-muted-foreground hover:border-moss/40 hover:text-foreground"
            }`}
          >
            {selectedKeys.includes("custom") ? "Custom selected" : "Use custom goal"}
          </button>
        </div>
        {selectedKeys.includes("custom") ? (
          <input
            className={`${inputBase} mt-4`}
            placeholder="Example: Ship one visible Grove iteration each week"
            value={customTitle}
            onChange={(event) => onCustomTitleChange(event.target.value)}
          />
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh suggestions"}
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={loading}
            className="rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-moss-fg transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to tasks
          </button>
        </div>
      </div>
    </section>
  );
}
