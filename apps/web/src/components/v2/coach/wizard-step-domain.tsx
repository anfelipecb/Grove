"use client";

import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";

const inputBase =
  "w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none ring-moss/20 transition focus:border-moss focus:ring-4";

type Props = {
  selectedDomain: LifeDomainId | null;
  safetyMessage: string | null;
  loading: boolean;
  promptText: string;
  error: string | null;
  onPromptChange: (value: string) => void;
  onSelectDomain: (value: LifeDomainId) => void;
  onContinue: () => void;
};

export function WizardStepDomain({
  selectedDomain,
  safetyMessage,
  loading,
  promptText,
  error,
  onPromptChange,
  onSelectDomain,
  onContinue,
}: Props) {
  return (
    <section className="rounded-[28px] border border-border bg-card/95 p-5 shadow-panel dark:shadow-panel-dark">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Step 1 of 4</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">What area of your life do you most want to improve?</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Start with your own words. Then pick the domain that fits best so Coach can suggest goals that are actually
            doable.
          </p>
        </div>
      </div>

      {safetyMessage ? (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
          {safetyMessage}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-medium text-foreground">Your focus area</span>
        <textarea
          className={`${inputBase} min-h-32 resize-y`}
          placeholder="Example: I want my work rhythm to feel lighter and more consistent."
          value={promptText}
          onChange={(event) => onPromptChange(event.target.value)}
        />
      </label>

      <div className="mt-5">
        <p className="text-sm font-medium text-foreground">Domain suggestion pills</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {LIFE_DOMAINS.map((domain) => {
            const active = selectedDomain === domain.id;
            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => onSelectDomain(domain.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "border-moss bg-moss text-moss-fg"
                    : "border-border bg-background text-muted-foreground hover:border-moss/40 hover:text-foreground"
                }`}
              >
                {domain.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-moss-fg transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Designing goals..." : "Continue to goal ideas"}
        </button>
      </div>
    </section>
  );
}
