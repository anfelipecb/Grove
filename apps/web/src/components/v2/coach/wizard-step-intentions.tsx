"use client";

import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";

type ParsedIntention = {
  domain: LifeDomainId;
  rationale: string;
  sampleGoal: string;
};

type Props = {
  editingMode: boolean;
  error: string | null;
  intentions: ParsedIntention[];
  loading: boolean;
  maxSelections: number;
  promptText: string;
  selectedKeys: string[];
  onBack: () => void;
  onContinue: () => void;
  onRefresh: () => void;
  onToggleKey: (key: string) => void;
};

function domainLabel(domainId: LifeDomainId): string {
  return LIFE_DOMAINS.find((entry) => entry.id === domainId)?.label ?? "Selected domain";
}

export function WizardStepIntentions({
  editingMode,
  error,
  intentions,
  loading,
  maxSelections,
  promptText,
  selectedKeys,
  onBack,
  onContinue,
  onRefresh,
  onToggleKey,
}: Props) {
  const selectedCount = selectedKeys.length;

  return (
    <section className="rounded-[28px] border border-border bg-card/95 p-5 shadow-panel dark:shadow-panel-dark">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Step 2 of 4</p>
      <h2 className="mt-2 text-2xl font-semibold text-foreground">
        {editingMode ? "Pick the goal that should replace this one" : "Pick the starter goals that fit best"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {editingMode
          ? "Coach mapped your current wording into a replacement goal. Select one option, then refine the tasks."
          : "Coach mapped your wording into domain-aware starter goals. Pick 1 to 3 goals across the areas that matter most right now."}
      </p>

      <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your wording</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">{promptText}</p>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">
          {editingMode
            ? `Selected ${selectedCount} of 1 replacement goal`
            : `Selected ${selectedCount} of up to ${maxSelections} starter goals`}
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Re-parsing..." : "Re-parse intentions"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {intentions.map((intention, index) => {
          const key = `intention-${index}`;
          const active = selectedKeys.includes(key);
          const disabled = !active && !editingMode && selectedCount >= maxSelections;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggleKey(key)}
              disabled={disabled}
              className={`rounded-3xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? "border-moss bg-moss/10 shadow-[0_0_0_1px_rgba(112,146,103,0.2)]"
                  : "border-border bg-background hover:border-moss/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {domainLabel(intention.domain)}
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    active ? "bg-moss text-moss-fg" : "border border-border text-muted-foreground"
                  }`}
                >
                  {active ? "Selected" : "Starter goal"}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{intention.sampleGoal}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{intention.rationale}</p>
            </button>
          );
        })}
      </div>

      {intentions.length === 0 && !loading ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-background/80 px-4 py-5 text-sm leading-6 text-muted-foreground">
          Coach could not derive starter goals from that yet. Go back and rewrite the wording more concretely, or try
          re-parsing.
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
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
    </section>
  );
}
