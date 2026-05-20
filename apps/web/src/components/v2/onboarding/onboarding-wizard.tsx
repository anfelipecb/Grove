"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { LIFE_DOMAINS, type IntakeDraft, type MemberProfileCard, type LifeDomainId } from "@grove/core";
import {
  briefingGoalsFromWizard,
  buildOnboardingDoneUrl,
  filterSuggestionsAgainstStatic,
  mergeLines as mergeLinesHelper,
  postProfileForSuggestions,
} from "@/components/v2/onboarding/onboarding-helpers";

// ── Constants ────────────────────────────────────────────────────────────────

const GOAL_CHIPS = [
  "Ship something visible",
  "Steady health habits",
  "Focused learning",
  "Show up in community",
  "Clear life admin",
  "Protect rest",
];

const FRICTION_CHIPS = [
  "Context switching",
  "Trouble starting",
  "Over-planning",
  "Shame after falling off",
  "Time estimation",
  "Meeting overload",
];

const SUPPORT_STYLES = [
  { value: "structured", label: "Structured" },
  { value: "gentle", label: "Gentle" },
  { value: "direct", label: "Direct" },
  { value: "brief", label: "Brief" },
] as const;

const DOMAIN_BAR_COLORS: Record<string, string> = {
  wellbeing: "bg-emerald-500",
  learning: "bg-blue-500",
  work_build: "bg-orange-500",
  relationships: "bg-pink-500",
  community: "bg-violet-500",
  life_admin: "bg-slate-400",
  rest_play: "bg-amber-500",
};

function equalDefaultWeights(): Record<LifeDomainId, number> {
  const n = LIFE_DOMAINS.length;
  const base = Math.floor(100 / n);
  const w = {} as Record<LifeDomainId, number>;
  let rem = 100 - base * n;
  LIFE_DOMAINS.forEach((d, i) => {
    w[d.id] = base + (i < rem ? 1 : 0);
  });
  return w;
}

/** Proportional scale to 100%; bump largest domain to fix rounding drift. */
function normalizeDomainWeights(
  weights: Record<LifeDomainId, number>,
): Record<LifeDomainId, number> {
  const total = LIFE_DOMAINS.reduce((s, d) => s + (weights[d.id] ?? 0), 0);
  if (total <= 0) return equalDefaultWeights();

  const normalized = {} as Record<LifeDomainId, number>;
  for (const d of LIFE_DOMAINS) {
    normalized[d.id] = Math.round(((weights[d.id] ?? 0) / total) * 100);
  }

  const sum = LIFE_DOMAINS.reduce((s, d) => s + normalized[d.id], 0);
  const drift = 100 - sum;
  if (drift !== 0) {
    let maxId: LifeDomainId = LIFE_DOMAINS[0].id;
    let maxVal = normalized[maxId];
    for (const d of LIFE_DOMAINS) {
      if (normalized[d.id] > maxVal) {
        maxVal = normalized[d.id];
        maxId = d.id;
      }
    }
    normalized[maxId] = Math.max(1, normalized[maxId] + drift);
  }
  return normalized;
}

function parseJson<T>(raw: string): T | null {
  try { return JSON.parse(raw) as T; } catch { return null; }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 pb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 max-w-14 rounded-full transition-colors ${
            i < current
              ? "bg-moss"
              : i === current
              ? "bg-moss/40"
              : "border border-border bg-transparent"
          }`}
        />
      ))}
    </div>
  );
}

function ChipButton({
  label,
  selected,
  onClick,
  showCheck,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  showCheck?: boolean;
}) {
  const display = showCheck && selected ? `✓ ${label}` : label;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        selected
          ? "border-moss bg-moss/10 text-moss"
          : "border-border bg-background text-muted-foreground hover:border-moss/50 hover:text-foreground"
      }`}
    >
      {display}
    </button>
  );
}

function InputBase({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/30"
    />
  );
}

function StackedDomainBar({ weights }: { weights: Record<LifeDomainId, number> }) {
  return (
    <div className="space-y-3">
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {LIFE_DOMAINS.map((d) => (
          <div
            key={d.id}
            className={DOMAIN_BAR_COLORS[d.id] ?? "bg-moss"}
            style={{ flex: `0 0 ${weights[d.id]}%` }}
            title={`${d.label} ${weights[d.id]}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {LIFE_DOMAINS.map((d) => (
          <span key={d.id} className="text-xs text-muted-foreground">
            {d.label} · {weights[d.id]}%
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export function OnboardingWizard({ assessmentMode = false }: { assessmentMode?: boolean }) {
  const router = useRouter();
  const TOTAL_STEPS = 5;

  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState<IntakeDraft>({
    name: "",
    goals: "",
    friction: "",
    supportStyle: "structured",
    communityInterest: "",
    focusDisclosure: "",
  });

  const [goalChips, setGoalChips] = useState<string[]>([]);
  const [frictionChips, setFrictionChips] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<LifeDomainId, number>>(equalDefaultWeights);
  const [weightsLoaded, setWeightsLoaded] = useState(false);

  const [suggestedGoalChips, setSuggestedGoalChips] = useState<string[]>([]);
  const [suggestedGoalLoading, setSuggestedGoalLoading] = useState(false);
  const [suggestedFrictionChips, setSuggestedFrictionChips] = useState<string[]>([]);
  const [suggestedFrictionLoading, setSuggestedFrictionLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);

  const toggleGoalChip = useCallback(
    (val: string) => setGoalChips((p) => (p.includes(val) ? p.filter((x) => x !== val) : [...p, val])),
    [],
  );

  const toggleFrictionChip = useCallback(
    (val: string) => setFrictionChips((p) => (p.includes(val) ? p.filter((x) => x !== val) : [...p, val])),
    [],
  );

  // AI: suggest goal chips on step 1
  useEffect(() => {
    if (step !== 1) return;
    const name = (intake.name ?? "").trim();
    if (!name) return;
    const ac = new AbortController();
    setSuggestedGoalLoading(true);
    (async () => {
      const draft: IntakeDraft = { name, goals: "", friction: "", supportStyle: intake.supportStyle, communityInterest: "", focusDisclosure: "" };
      try {
        const result = await postProfileForSuggestions(draft, ac.signal);
        if (ac.signal.aborted) return;
        if (result?.safety) { setSafetyMessage(result.message ?? ""); setSuggestedGoalChips([]); return; }
        setSafetyMessage(null);
        setSuggestedGoalChips(filterSuggestionsAgainstStatic(result?.profile?.firstTargets ?? [], GOAL_CHIPS));
      } catch { if (!ac.signal.aborted) setSuggestedGoalChips([]); }
      finally { if (!ac.signal.aborted) setSuggestedGoalLoading(false); }
    })();
    return () => ac.abort();
  }, [step, intake.name, intake.supportStyle]);

  // AI: suggest friction chips on step 2
  useEffect(() => {
    if (step !== 2) return;
    const name = (intake.name ?? "").trim();
    if (!name) return;
    const goalsText = mergeLinesHelper(goalChips, intake.goals);
    if (!goalsText.trim()) return;
    const ac = new AbortController();
    setSuggestedFrictionLoading(true);
    (async () => {
      const draft: IntakeDraft = { name, goals: goalsText, friction: "", supportStyle: intake.supportStyle, communityInterest: "", focusDisclosure: "" };
      try {
        const result = await postProfileForSuggestions(draft, ac.signal);
        if (ac.signal.aborted) return;
        if (result?.safety) { setSafetyMessage(result.message ?? ""); setSuggestedFrictionChips([]); return; }
        setSafetyMessage(null);
        setSuggestedFrictionChips(filterSuggestionsAgainstStatic(result?.profile?.likelyFriction ?? [], FRICTION_CHIPS));
      } catch { if (!ac.signal.aborted) setSuggestedFrictionChips([]); }
      finally { if (!ac.signal.aborted) setSuggestedFrictionLoading(false); }
    })();
    return () => ac.abort();
  }, [step, intake.name, intake.supportStyle, goalChips, intake.goals]);

  // AI: suggest domain weights on step 3
  useEffect(() => {
    if (step !== 3 || weightsLoaded) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const goalsText = mergeLinesHelper(goalChips, intake.goals);
      const frictionText = mergeLinesHelper(frictionChips, intake.friction);
      const res = await fetch("/api/ai/domain-weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: goalsText, friction: frictionText, supportStyle: intake.supportStyle }),
      });
      const payload = (await res.json()) as { weights?: Record<string, number>; safety?: boolean; message?: string };
      if (cancelled) return;
      setLoading(false);
      if (payload.safety) { setSafetyMessage(payload.message ?? ""); return; }
      if (payload.weights) {
        const next = equalDefaultWeights();
        for (const d of LIFE_DOMAINS) {
          const v = payload.weights[d.id];
          if (typeof v === "number") next[d.id] = v;
        }
        setWeights(normalizeDomainWeights(next));
      }
      setWeightsLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [step, weightsLoaded, goalChips, intake.goals, intake.friction, intake.supportStyle, frictionChips]);

  async function finishOnboarding() {
    setLoading(true);
    setSafetyMessage(null);
    setError(null);
    let redirecting = false;
    try {
      const goalsText = mergeLinesHelper(goalChips, intake.goals);
      const frictionText = mergeLinesHelper(frictionChips, intake.friction);
      const fullIntake: IntakeDraft = { ...intake, goals: goalsText, friction: frictionText };

      const profileRes = await fetch("/api/ai/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullIntake),
      });
      const profilePayload = parseJson<{ profile?: MemberProfileCard; safety?: boolean; message?: string }>(
        await profileRes.text(),
      );
      if (!profilePayload) { setError("Could not read profile response."); return; }
      if (profilePayload.safety) { setSafetyMessage(profilePayload.message ?? ""); return; }
      if (!profilePayload.profile) { setError("Could not generate profile. Try again."); return; }

      const saveRes = await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: fullIntake,
          profileCard: profilePayload.profile,
          xpDomainWeights: normalizeDomainWeights(weights),
          mode: assessmentMode ? "assessment" : "initial",
        }),
      });
      const saveBody = parseJson<{ ok?: boolean; error?: string }>(await saveRes.text());
      const briefingParams = {
        name: (intake.name ?? "").trim(),
        goals: briefingGoalsFromWizard(goalChips, goalsText),
        style: intake.supportStyle,
        weights: normalizeDomainWeights(weights),
      };

      if (saveRes.status === 401) {
        redirecting = true;
        router.push(buildOnboardingDoneUrl({ ...briefingParams, dev: true }));
        return;
      }

      if (!saveRes.ok || !saveBody?.ok) {
        setError(saveBody?.error ?? `Save failed (${saveRes.status}). Try again.`);
        return;
      }
      redirecting = true;
      router.push(buildOnboardingDoneUrl(briefingParams));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      if (!redirecting) setLoading(false);
    }
  }

  const canAdvance =
    (step === 0 && (intake.name ?? "").trim().length > 0) ||
    (step === 1 && (goalChips.length > 0 || intake.goals.trim().length > 0)) ||
    (step === 2 && (frictionChips.length > 0 || intake.friction.trim().length > 0)) ||
    (step === 3 && (weightsLoaded || !loading)) ||
    step === 4;

  const primaryCtaLabel =
    loading
      ? "Saving…"
      : step === TOTAL_STEPS - 1
      ? "Finish setup"
      : step === 3
      ? "Looks good →"
      : "Continue";

  function advanceStep() {
    if (step < TOTAL_STEPS - 1) {
      if (step < 3) setWeightsLoaded(false);
      setStep((s) => s + 1);
    } else {
      void finishOnboarding();
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start bg-background px-4 pt-12 pb-24">
      <div className="fixed top-0 inset-x-0 h-1 bg-gradient-to-r from-moss/40 via-moss to-moss/40" aria-hidden />

      <div className="mb-8 flex items-center gap-2">
        <span className="text-xl font-bold text-moss">Grove</span>
        <Sparkles className="h-4 w-4 text-moss/60" />
      </div>

      <div className="w-full max-w-md">
        <StepProgressBar current={step} total={TOTAL_STEPS} />

        {safetyMessage && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-200">
            {safetyMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Welcome to Grove</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {assessmentMode
                  ? "Recalibrate your profile — nothing is a fresh start."
                  : "A private growth loop with community support. Let's get you set up in 5 steps."}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                What should we call you?
              </label>
              <InputBase
                value={intake.name ?? ""}
                onChange={(v) => setIntake({ ...intake, name: v })}
                placeholder="Name or nickname"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <h1 className="text-xl font-bold text-foreground">What are you working on right now?</h1>
                {goalChips.length > 0 && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {goalChips.length} selected
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick 2 or 3 things — most people come with more than one.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              {(suggestedGoalLoading || suggestedGoalChips.length > 0) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Suggested for you
                  </p>
                  {suggestedGoalLoading ? (
                    <p className="text-xs text-muted-foreground animate-pulse">Generating suggestions…</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {suggestedGoalChips.map((c) => (
                        <ChipButton key={c} label={c} selected={goalChips.includes(c)} showCheck onClick={() => toggleGoalChip(c)} />
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Common goals
                </p>
                <div className="flex flex-wrap gap-2">
                  {GOAL_CHIPS.map((c) => (
                    <ChipButton key={c} label={c} selected={goalChips.includes(c)} showCheck onClick={() => toggleGoalChip(c)} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Add specifics (optional)
                </label>
                <textarea
                  value={intake.goals}
                  onChange={(e) => setIntake({ ...intake, goals: e.target.value })}
                  placeholder="One line per intention"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/30 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">What slows you down?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick what resonates — Grove adapts nudges to your friction patterns.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              {(suggestedFrictionLoading || suggestedFrictionChips.length > 0) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Suggested for you
                  </p>
                  {suggestedFrictionLoading ? (
                    <p className="text-xs text-muted-foreground animate-pulse">Generating suggestions…</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {suggestedFrictionChips.map((c) => (
                        <ChipButton key={c} label={c} selected={frictionChips.includes(c)} onClick={() => toggleFrictionChip(c)} />
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Common friction
                </p>
                <div className="flex flex-wrap gap-2">
                  {FRICTION_CHIPS.map((c) => (
                    <ChipButton key={c} label={c} selected={frictionChips.includes(c)} onClick={() => toggleFrictionChip(c)} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Say more (optional)
                </label>
                <textarea
                  value={intake.friction}
                  onChange={(e) => setIntake({ ...intake, friction: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/30 resize-none"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Coaching style
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUPPORT_STYLES.map((s) => (
                    <ChipButton
                      key={s.value}
                      label={s.label}
                      selected={intake.supportStyle === s.value}
                      onClick={() => setIntake({ ...intake, supportStyle: s.value })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Balance your focus areas</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Mycelium calibrated these from your goals. Adjust later in your profile.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              {loading && !weightsLoaded ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 w-full rounded-full bg-muted" />
                  <p className="text-xs text-muted-foreground text-center">Calibrating…</p>
                </div>
              ) : (
                <StackedDomainBar weights={weights} />
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Almost there</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Two optional fields — skip them if you prefer. Both are private by default.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Who do you want to grow with?
                </label>
                <textarea
                  value={intake.communityInterest}
                  onChange={(e) => setIntake({ ...intake, communityInterest: e.target.value })}
                  placeholder="e.g. builders shipping side projects, parents staying consistent, students finishing degrees"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/30 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Anything else Mycelium should know?
                </label>
                <textarea
                  value={intake.focusDisclosure}
                  onChange={(e) => setIntake({ ...intake, focusDisclosure: e.target.value })}
                  placeholder="e.g. I have ADHD, I work nights, I have a big deadline in 3 weeks — Mycelium uses this to adjust its suggestions"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/30 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => { setStep((s) => Math.max(0, s - 1)); if (step <= 3) setWeightsLoaded(false); }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="button"
            disabled={!canAdvance || loading}
            onClick={advanceStep}
            className="flex-1 rounded-xl bg-moss px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-moss/90 disabled:opacity-40"
          >
            {primaryCtaLabel}
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
      </div>
    </div>
  );
}
