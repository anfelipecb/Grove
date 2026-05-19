"use client";

const inputBase =
  "w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none ring-moss/20 transition focus:border-moss focus:ring-4";

type Props = {
  error: string | null;
  loading: boolean;
  promptText: string;
  safetyMessage: string | null;
  onContinue: () => void;
  onPromptChange: (value: string) => void;
};

export function WizardStepIntake({
  error,
  loading,
  promptText,
  safetyMessage,
  onContinue,
  onPromptChange,
}: Props) {
  const remainingChars = 400 - promptText.length;

  return (
    <section className="rounded-[28px] border border-border bg-card/95 p-5 shadow-panel dark:shadow-panel-dark">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Step 1 of 4</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            What do you want to improve in your life right now?
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Write 2 or 3 things in your own words. Coach will map them to the right domains and turn them into starter
            goals.
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
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="block text-sm font-medium text-foreground">Your intentions</span>
          <span className="text-xs font-medium text-muted-foreground">{remainingChars} characters left</span>
        </div>
        <textarea
          className={`${inputBase} min-h-36 resize-y`}
          maxLength={400}
          placeholder="Examples: I want better sleep, I keep dropping admin tasks, and I want a more consistent reading habit."
          value={promptText}
          onChange={(event) => onPromptChange(event.target.value)}
        />
      </label>

      <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
        Hint: short fragments are fine, like “sleep better,” “get back to exercising,” or “stop avoiding email.”
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-moss-fg transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Mapping intentions..." : "Continue to starter goals"}
        </button>
      </div>
    </section>
  );
}
