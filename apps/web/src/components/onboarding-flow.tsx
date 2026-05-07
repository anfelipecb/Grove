"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardList, ShieldCheck, Sparkles } from "lucide-react";
import type { IntakeDraft, MemberProfileCard, MyceliumCalibrationPlan } from "@grove/core";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import { AppHeaderToolbar } from "@/components/app-header-toolbar";
import {
  CHIP_DISPLAY_MAX,
  filterSuggestionsAgainstStatic,
  normalizeChipLabel,
  postProfileForSuggestions,
} from "@/components/onboarding-suggestions";

const inputBase =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none ring-moss/20 transition focus:border-moss focus:ring-4";

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

function mergeLines(chips: string[], text: string): string {
  const fromText = text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const set = new Set([...chips, ...fromText]);
  return [...set].join("\n");
}

export function OnboardingFlow({
  assessmentMode = false,
  demoMode = false,
}: {
  assessmentMode?: boolean;
  demoMode?: boolean;
}) {
  return <OnboardingFlowInner assessmentMode={assessmentMode} demoMode={demoMode} />;
}

export function OnboardingFlowInner({ assessmentMode, demoMode }: { assessmentMode: boolean; demoMode: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const errorBoxRef = useRef<HTMLDivElement>(null);
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
  const [profile, setProfile] = useState<MemberProfileCard | null>(null);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedGoalChips, setSuggestedGoalChips] = useState<string[]>([]);
  const [suggestedGoalLoading, setSuggestedGoalLoading] = useState(false);
  const [suggestedFrictionChips, setSuggestedFrictionChips] = useState<string[]>([]);
  const [suggestedFrictionLoading, setSuggestedFrictionLoading] = useState(false);
  const [calPlan, setCalPlan] = useState<MyceliumCalibrationPlan | null>(null);
  const [calLoading, setCalLoading] = useState(false);
  const [calError, setCalError] = useState<string | null>(null);
  const [calNotice, setCalNotice] = useState<string | null>(null);
  const [pickedCalibGoals, setPickedCalibGoals] = useState<string[]>([]);
  const [pickedCalibRewards, setPickedCalibRewards] = useState<number[]>([]);


  const toggleChip = useCallback((list: string[], value: string, setter: (v: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((x) => x !== value));
    } else {
      setter([...list, value]);
    }
  }, []);

  useEffect(() => {
    if (demoMode) return;
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in?redirect_url=/onboarding");
    }
  }, [demoMode, isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (error && errorBoxRef.current) {
      errorBoxRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [error]);

  useEffect(() => {
    if (step !== 3 || weightsLoaded) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const goalsText = mergeLines(goalChips, intake.goals);
      const frictionText = mergeLines(frictionChips, intake.friction);
      const res = await fetch("/api/ai/domain-weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goals: goalsText,
          friction: frictionText,
          supportStyle: intake.supportStyle,
        }),
      });
      const payload = (await res.json()) as {
        weights?: Record<string, number>;
        safety?: boolean;
        message?: string;
      };
      if (cancelled) return;
      setLoading(false);
      if (payload.safety) {
        setSafetyMessage(payload.message ?? "Grove cannot safely continue this as a coaching request.");
        return;
      }
      if (payload.weights) {
        const next = equalDefaultWeights();
        for (const d of LIFE_DOMAINS) {
          const v = payload.weights[d.id];
          if (typeof v === "number") next[d.id] = v;
        }
        setWeights(next);
      }
      setWeightsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [step, weightsLoaded, goalChips, intake.goals, intake.friction, intake.supportStyle, frictionChips]);

  useEffect(() => {
    if (step !== 1) return;
    const name = (intake.name ?? "").trim();
    if (!name) return;
    const ac = new AbortController();
    setSuggestedGoalLoading(true);
    (async () => {
      const draft: IntakeDraft = {
        name,
        goals: "",
        friction: "",
        supportStyle: intake.supportStyle,
        communityInterest: "",
        focusDisclosure: intake.focusDisclosure,
      };
      try {
        const result = await postProfileForSuggestions(draft, ac.signal);
        if (ac.signal.aborted) return;
        if (result?.safety) {
          setSafetyMessage(result.message ?? "Grove cannot safely continue this as a coaching request.");
          setSuggestedGoalChips([]);
          return;
        }
        setSafetyMessage(null);
        const list = result?.profile?.firstTargets ?? [];
        setSuggestedGoalChips(filterSuggestionsAgainstStatic(list, GOAL_CHIPS));
      } catch {
        if (ac.signal.aborted) return;
        setSuggestedGoalChips([]);
      } finally {
        if (!ac.signal.aborted) setSuggestedGoalLoading(false);
      }
    })();
    return () => ac.abort();
  }, [step, intake.name, intake.supportStyle, intake.focusDisclosure]);

  useEffect(() => {
    if (step !== 2) return;
    const name = (intake.name ?? "").trim();
    if (!name) return;
    const goalsText = mergeLines(goalChips, intake.goals);
    if (!goalsText.trim()) return;
    const ac = new AbortController();
    setSuggestedFrictionLoading(true);
    (async () => {
      const draft: IntakeDraft = {
        name,
        goals: goalsText,
        friction: "",
        supportStyle: intake.supportStyle,
        communityInterest: "",
        focusDisclosure: intake.focusDisclosure,
      };
      try {
        const result = await postProfileForSuggestions(draft, ac.signal);
        if (ac.signal.aborted) return;
        if (result?.safety) {
          setSafetyMessage(result.message ?? "Grove cannot safely continue this as a coaching request.");
          setSuggestedFrictionChips([]);
          return;
        }
        setSafetyMessage(null);
        const list = result?.profile?.likelyFriction ?? [];
        setSuggestedFrictionChips(filterSuggestionsAgainstStatic(list, FRICTION_CHIPS));
      } catch {
        if (ac.signal.aborted) return;
        setSuggestedFrictionChips([]);
      } finally {
        if (!ac.signal.aborted) setSuggestedFrictionLoading(false);
      }
    })();
    return () => ac.abort();
  }, [step, intake.name, intake.supportStyle, intake.focusDisclosure, goalChips, intake.goals]);

  async function runCalibrationPack() {
    setCalLoading(true);
    setCalError(null);
    setCalNotice(null);
    try {
      const goalsText = mergeLines(goalChips, intake.goals);
      const frictionText = mergeLines(frictionChips, intake.friction);
      const draft: IntakeDraft = {
        ...intake,
        goals: goalsText,
        friction: frictionText,
      };
      const res = await fetch("/api/ai/mycelium-calibrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake: draft, xpDomainWeights: weights }),
      });
      const payload = parseJson<{ plan?: MyceliumCalibrationPlan; safety?: boolean; message?: string; error?: string }>(
        await res.text(),
      );
      if (!payload) {
        setCalError("Calibration response was unreadable.");
        return;
      }
      if ("safety" in payload && payload.safety) {
        setSafetyMessage(payload.message ?? "");
        return;
      }
      if (!res.ok) {
        setCalError(payload.error ?? `Calibration failed (${res.status}).`);
        return;
      }
      if (!payload.plan) {
        setCalError("No calibration plan returned.");
        return;
      }
      setCalPlan(payload.plan);
      setPickedCalibGoals([]);
      setPickedCalibRewards([]);
    } catch (e) {
      setCalError(e instanceof Error ? e.message : "Calibration failed.");
    } finally {
      setCalLoading(false);
    }
  }

  function toggleCalibGoal(title: string) {
    setPickedCalibGoals((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  }

  function toggleCalibReward(idx: number) {
    setPickedCalibRewards((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  }

  async function persistAdoptedRewards() {
    if (!calPlan) return;
    const rewards = calPlan.suggestedRewards
      .map((r, idx) =>
        pickedCalibRewards.includes(idx)
          ? { title: r.title, cost: r.cost, visibility: (r.visibility ?? "private") as "private" | "community" }
          : null,
      )
      .filter(Boolean) as { title: string; cost: number; visibility: "private" | "community" }[];
    if (!rewards.length) {
      setCalError("Select at least one reward to save.");
      return;
    }
    setCalLoading(true);
    setCalError(null);
    setCalNotice(null);
    try {
      const res = await fetch("/api/onboarding/adopt-calibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true, rewards }),
      });
      const raw = await res.text();
      const j = parseJson<{ ok?: boolean; error?: string; rewardsInserted?: string[] }>(raw);
      if (!res.ok) {
        setCalError(j?.error ?? raw.slice(0, 240));
        return;
      }
      setCalNotice(`Saved rewards: ${(j?.rewardsInserted ?? []).join(", ") || "ok"}`);
    } catch (e) {
      setCalError(e instanceof Error ? e.message : "Reward save failed.");
    } finally {
      setCalLoading(false);
    }
  }

  async function persistAdoptedExtraGoals() {
    if (!calPlan) return;
    const fallbackDomain =
      ([...Object.entries(weights)] as [LifeDomainId, number][])
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => k)[0] ?? "learning";
    const selected = calPlan.balancedGoals.filter((g) => pickedCalibGoals.includes(g.title));
    if (!selected.length) {
      setCalError("Select at least one suggested goal row to insert.");
      return;
    }
    const additionalGoals = selected.map((g) => ({
      title: g.title,
      domain: (g.domain ?? fallbackDomain) as LifeDomainId,
    }));
    setCalLoading(true);
    setCalError(null);
    setCalNotice(null);
    try {
      const res = await fetch("/api/onboarding/adopt-calibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true, additionalGoals }),
      });
      const raw = await res.text();
      const j = parseJson<{ ok?: boolean; error?: string; goalsInserted?: string[] }>(raw);
      if (!res.ok) {
        setCalError(j?.error ?? raw.slice(0, 240));
        return;
      }
      setCalNotice(`Added goals to Grove: ${(j?.goalsInserted ?? []).join(", ") || "ok"}`);
    } catch (e) {
      setCalError(e instanceof Error ? e.message : "Goal save failed.");
    } finally {
      setCalLoading(false);
    }
  }

  function applyCalibrationTitlesToChips() {
    if (!calPlan) return;
    const titles = pickedCalibGoals.length
      ? pickedCalibGoals
      : calPlan.balancedGoals.map((g) => g.title);
    const uniq = [...new Set(titles)];
    setGoalChips((prev) => [...new Set([...uniq, ...prev])]);
    setCalNotice("Applied suggestions to goal chips — finish onboarding to weave them through your profile.");
  }


    function parseJson<T>(raw: string): T | null {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async function finishOnboarding() {
    setLoading(true);
    setSafetyMessage(null);
    setError(null);
    let redirecting = false;
    try {
      const goalsText = mergeLines(goalChips, intake.goals);
      const frictionText = mergeLines(frictionChips, intake.friction);
      const fullIntake: IntakeDraft = {
        ...intake,
        goals: goalsText,
        friction: frictionText,
      };
      const profileRes = await fetch("/api/ai/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullIntake),
      });
      const profileRaw = await profileRes.text();
      const profilePayload = parseJson<{
        profile?: MemberProfileCard;
        safety?: boolean;
        message?: string;
      }>(profileRaw);
      if (!profilePayload) {
        setError(
          profileRes.ok
            ? "Could not read profile response."
            : `Profile request failed (${profileRes.status}). ${profileRaw.slice(0, 180)}`,
        );
        return;
      }
      if ("safety" in profilePayload && profilePayload.safety) {
        setSafetyMessage(profilePayload.message ?? "");
        return;
      }
      const profileCard = profilePayload.profile ?? null;
      if (!profileCard) {
        setError("Could not generate profile. Try again.");
        return;
      }
      setProfile(profileCard);
      const saveRes = await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: fullIntake,
          profileCard,
          xpDomainWeights: weights,
          mode: assessmentMode ? "assessment" : "initial",
        }),
      });
      const saveRaw = await saveRes.text();
      const saveBody = parseJson<{ ok?: boolean; error?: string }>(saveRaw);
      if (!saveRes.ok) {
        const fallback = saveRaw.trim() ? saveRaw.slice(0, 240) : `Save failed (${saveRes.status})`;
        setError(saveBody?.error ?? fallback);
        return;
      }
      if (!saveBody?.ok) {
        setError(saveBody?.error ?? "Save did not complete. Try again.");
        return;
      }
      redirecting = true;
      window.location.assign("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      if (!redirecting) setLoading(false);
    }
  }

  if (!isLoaded || (!demoMode && !isSignedIn)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <p className="text-sm">Loading…</p>
      </main>
    );
  }

  const totalSteps = 5;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="sticky top-0 z-30 -mx-4 border-b border-border bg-background/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-moss">
                <ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />
                {assessmentMode ? "Grove onboarding reassessment" : "Grove onboarding"}
              </div>
              <h1 className="mt-2 text-2xl font-semibold">
                {assessmentMode ? "Recalibrate what matters and keep moving." : "Grow together—starting with what matters to you."}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-700">
                {assessmentMode
                  ? "Use this to adjust your goals, friction signals, and support style if the first pass no longer fits. You can also open Mycelium for a short calibration chat."
                  : "We’ll keep this practical: concrete next actions, not a personality quiz."}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-moss transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-stone-600">
                Step {step + 1} of {totalSteps}
              </p>
            </div>
            <AppHeaderToolbar
              demoMode={demoMode}
              userButtonAppearance={{
                elements: {
                  userButtonAvatarBox: "h-9 w-9 ring-2 ring-moss/25 ring-offset-1 ring-offset-background",
                  userButtonBox: "flex-row-reverse",
                },
              }}
            />
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-md border border-border bg-card/90 p-4 shadow-panel dark:shadow-panel-dark">
            {step === 0 && (
              <div className="grid gap-4">
                <p className="text-sm leading-6 text-stone-700">
                  Welcome. Grove pairs a private growth loop with community coordination.
                  {assessmentMode
                    ? " This pass is for recalibration, not a fresh sign-up."
                    : " We’ll keep this practical: concrete next actions, not a personality quiz."}
                </p>
                <Field label="What should we call you?">
                  <input
                    className={inputBase}
                    value={intake.name ?? ""}
                    onChange={(e) => setIntake({ ...intake, name: e.target.value })}
                    placeholder="Name or nickname"
                  />
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4">
                <p className="text-sm font-medium text-bark">What do you want to grow over the next few weeks?</p>
                <p className="text-sm leading-6 text-stone-700">
                  Tap anything that fits—Mycelium also suggests a few based on your name. You can add a line or two
                  later if you want.
                </p>
                {(suggestedGoalLoading || suggestedGoalChips.length > 0) && (
                  <div className="grid gap-2">
                    <ChipSubheading>Suggested for you</ChipSubheading>
                    {suggestedGoalLoading ? (
                      <p className="text-sm text-stone-600">Loading suggestions…</p>
                    ) : (
                      <OnboardingChipButtons
                        labels={suggestedGoalChips}
                        selected={goalChips}
                        variant="goal"
                        onToggle={(c) => toggleChip(goalChips, c, setGoalChips)}
                      />
                    )}
                  </div>
                )}
                <div className="grid gap-2">
                  <ChipSubheading>Common options</ChipSubheading>
                  <OnboardingChipButtons
                    labels={GOAL_CHIPS}
                    selected={goalChips}
                    variant="goal"
                    onToggle={(c) => toggleChip(goalChips, c, setGoalChips)}
                  />
                </div>
                <Field label="Add specifics (optional)">
                  <textarea
                    className={inputBase}
                    rows={3}
                    value={intake.goals}
                    onChange={(e) => setIntake({ ...intake, goals: e.target.value })}
                    placeholder="One line per intention"
                  />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4">
                <p className="text-sm font-medium text-bark">What usually slows you down?</p>
                <p className="text-sm leading-6 text-stone-700">
                  Pick what resonates—we&apos;ll suggest patterns based on what you want to grow. Details are optional.
                </p>
                {(suggestedFrictionLoading || suggestedFrictionChips.length > 0) && (
                  <div className="grid gap-2">
                    <ChipSubheading>Suggested for you</ChipSubheading>
                    {suggestedFrictionLoading ? (
                      <p className="text-sm text-stone-600">Loading suggestions…</p>
                    ) : (
                      <OnboardingChipButtons
                        labels={suggestedFrictionChips}
                        selected={frictionChips}
                        variant="friction"
                        onToggle={(c) => toggleChip(frictionChips, c, setFrictionChips)}
                      />
                    )}
                  </div>
                )}
                <div className="grid gap-2">
                  <ChipSubheading>Common options</ChipSubheading>
                  <OnboardingChipButtons
                    labels={FRICTION_CHIPS}
                    selected={frictionChips}
                    variant="friction"
                    onToggle={(c) => toggleChip(frictionChips, c, setFrictionChips)}
                  />
                </div>
                <Field label="Say more (optional)">
                  <textarea
                    className={inputBase}
                    rows={3}
                    value={intake.friction}
                    onChange={(e) => setIntake({ ...intake, friction: e.target.value })}
                  />
                </Field>
                <Field label="Support style">
                  <select
                    className={inputBase}
                    value={intake.supportStyle}
                    onChange={(e) =>
                      setIntake({ ...intake, supportStyle: e.target.value as IntakeDraft["supportStyle"] })
                    }
                  >
                    <option value="brief">Brief</option>
                    <option value="structured">Structured</option>
                    <option value="gentle">Gentle</option>
                    <option value="direct">Direct</option>
                  </select>
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4">
                <p className="text-sm leading-6 text-stone-700">
                  Mycelium suggests how to balance attention across life domains. Tune the sliders—this is advisory, not
                  a rule.
                </p>
                {loading && !weightsLoaded ? (
                  <p className="text-sm text-stone-600">Calibrating weights…</p>
                ) : (
                  LIFE_DOMAINS.map((d) => (
                    <label key={d.id} className="grid gap-1">
                      <span className="text-xs font-semibold text-stone-700">{d.label}</span>
                      <input
                        type="range"
                        min={1}
                        max={40}
                        value={weights[d.id]}
                        onChange={(e) =>
                          setWeights((w) => ({ ...w, [d.id]: Number.parseInt(e.target.value, 10) }))
                        }
                        className="w-full accent-moss"
                      />
                    </label>
                  ))
                )}
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-4">
                <Field label="Community participation">
                  <textarea
                    className={inputBase}
                    rows={3}
                    value={intake.communityInterest}
                    onChange={(e) => setIntake({ ...intake, communityInterest: e.target.value })}
                    placeholder="What kind of group helps you stay engaged?"
                  />
                </Field>
                <Field label="Optional private focus context">
                  <textarea
                    className={inputBase}
                    rows={3}
                    value={intake.focusDisclosure}
                    onChange={(e) => setIntake({ ...intake, focusDisclosure: e.target.value })}
                    placeholder="Private by default. Used only to adapt planning and nudges."
                  />
                </Field>
              </div>
            )}

            {error ? (
              <div
                ref={errorBoxRef}
                role="alert"
                className="rounded-md border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-800"
              >
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => {
                  setStep((s) => Math.max(0, s - 1));
                  if (step <= 3) setWeightsLoaded(false);
                }}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-bark disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </button>
              {step < 4 ? (
                <button
                  type="button"
                  disabled={
                    (step === 0 && !(intake.name ?? "").trim()) ||
                    (step === 1 && !goalChips.length && !intake.goals.trim()) ||
                    (step === 2 && !frictionChips.length && !intake.friction.trim()) ||
                    (step === 3 && loading && !weightsLoaded)
                  }
                  onClick={() => {
                    if (step === 2) setWeightsLoaded(false);
                    setStep((s) => s + 1);
                  }}
                  className="inline-flex items-center gap-2 rounded-md bg-bark px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-40"
                >
                  Next
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading || !(intake.communityInterest ?? "").trim()}
                  onClick={finishOnboarding}
                  className="inline-flex items-center gap-2 rounded-md bg-bark px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-40"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {loading ? "Saving…" : assessmentMode ? "Save recalibration" : "Finish & open Grove"}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-md border border-border bg-card/90 p-4 shadow-panel dark:shadow-panel-dark">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-moss">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Preview
            </div>
            {safetyMessage ? (
              <p className="rounded-md border border-clay bg-clay/10 p-4 text-sm leading-6 text-bark">{safetyMessage}</p>
            ) : profile ? (
              <div className="grid gap-3">
                <ProfileCard profile={profile} />
                {assessmentMode ? (
                  <div className="rounded-md border border-border bg-muted p-4">
                    <p className="text-sm font-medium text-bark">Need a second pass?</p>
                    <p className="mt-1 text-sm leading-6 text-stone-700">
                      Open Mycelium to talk through what changed, then come back and save the adjusted onboarding.
                    </p>
                    <div className="mt-4 rounded-md border border-border bg-muted/40 p-3">
                      <p className="text-sm font-medium text-bark">Mycelium calibration pack</p>
                      <p className="mt-1 text-xs leading-5 text-stone-700">
                        Structured suggestions (goals outline, rewards, summary). Saves only happen when you click the
                        explicit buttons below.
                      </p>
                      <button
                        type="button"
                        disabled={calLoading || !(intake.goals.trim() || goalChips.length)}
                        onClick={() => void runCalibrationPack()}
                        className="mt-3 inline-flex items-center rounded-md bg-bark px-3 py-1.5 text-xs font-semibold text-white hover:bg-moss disabled:opacity-40"
                      >
                        {calLoading ? "Generating…" : "Generate calibration suggestions"}
                      </button>
                      {calError ? <p className="mt-2 text-xs text-red-700">{calError}</p> : null}
                      {calNotice ? <p className="mt-2 text-xs text-moss">{calNotice}</p> : null}
                      {calPlan ? (
                        <div className="mt-3 space-y-3 text-xs leading-5 text-stone-800">
                          <section>
                            <p className="font-semibold text-bark">Summary</p>
                            <p>{calPlan.summary}</p>
                          </section>
                          {calPlan.whatChangedBullets?.length ? (
                            <section>
                              <p className="font-semibold text-bark">What calibration shifted</p>
                              <ul className="list-disc pl-5">
                                {calPlan.whatChangedBullets.map((b) => (
                                  <li key={b}>{b}</li>
                                ))}
                              </ul>
                            </section>
                          ) : null}
                          <section>
                            <p className="font-semibold text-bark">Next stretch outline</p>
                            <p className="whitespace-pre-wrap">{calPlan.planOutline}</p>
                          </section>
                          <section>
                            <p className="font-semibold text-bark">Balanced goals — select rows</p>
                            <ul className="mt-1 space-y-1">
                              {calPlan.balancedGoals.map((g) => (
                                <li key={g.title}>
                                  <label className="flex cursor-pointer gap-2">
                                    <input
                                      type="checkbox"
                                      checked={pickedCalibGoals.includes(g.title)}
                                      onChange={() => toggleCalibGoal(g.title)}
                                    />
                                    <span>{g.domain ? `${g.domain} · ` : ""}{g.title}</span>
                                  </label>
                                  {g.rationale ? <p className="pl-6 text-muted-foreground">{g.rationale}</p> : null}
                                </li>
                              ))}
                            </ul>
                            <button
                              type="button"
                              className="mt-2 mr-2 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold text-bark hover:border-moss"
                              onClick={applyCalibrationTitlesToChips}
                            >
                              Apply selected titles to chips
                            </button>
                            <button
                              type="button"
                              disabled={calLoading || !pickedCalibGoals.length}
                              onClick={() => void persistAdoptedExtraGoals()}
                              className="mt-2 rounded-md border border-moss/40 bg-moss/10 px-2 py-1 text-[11px] font-semibold text-bark hover:bg-moss/20 disabled:opacity-40"
                            >
                              Create selected goals in Grove now
                            </button>
                          </section>
                          {calPlan.suggestedRewards.length ? (
                            <section>
                              <p className="font-semibold text-bark">Suggested rewards — select rows</p>
                              <ul className="mt-1 space-y-1">
                                {calPlan.suggestedRewards.map((r, idx) => (
                                  <li key={r.title}>
                                    <label className="flex cursor-pointer gap-2">
                                      <input
                                        type="checkbox"
                                        checked={pickedCalibRewards.includes(idx)}
                                        onChange={() => toggleCalibReward(idx)}
                                      />
                                      <span>
                                        {r.title} · {r.cost} pts{r.visibility ? ` (${r.visibility})` : ""}
                                      </span>
                                    </label>
                                  </li>
                                ))}
                              </ul>
                              <button
                                type="button"
                                disabled={calLoading || !pickedCalibRewards.length}
                                onClick={() => void persistAdoptedRewards()}
                                className="mt-2 rounded-md bg-bark px-2 py-1 text-[11px] font-semibold text-white hover:bg-moss disabled:opacity-40"
                              >
                                Save selected rewards
                              </button>
                            </section>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href="/communities"
                        className="inline-flex items-center justify-center rounded-md bg-bark px-3 py-2 text-sm font-semibold text-white transition hover:bg-moss"
                      >
                        Talk to Mycelium
                      </Link>
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-bark transition hover:border-moss"
                      >
                        Back to dashboard
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex min-h-72 flex-col justify-center rounded-md border border-dashed border-border bg-muted p-6 text-center text-sm leading-6 text-muted-foreground">
                <p>
                  When you finish, Mycelium will draft a profile card here: next actions, likely friction, and a
                  community entry point—grounded in what you entered.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ChipSubheading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>
  );
}

type ChipVariant = "goal" | "friction";

function OnboardingChipButtons({
  labels,
  selected,
  variant,
  onToggle,
}: {
  labels: string[];
  selected: string[];
  variant: ChipVariant;
  onToggle: (value: string) => void;
}) {
  const active =
    variant === "goal"
      ? "border-moss bg-moss/15 text-bark"
      : "border-clay bg-clay/15 text-bark";
  const idle = "border-border bg-card text-muted-foreground hover:border-moss";
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((c) => (
        <button
          key={c}
          type="button"
          title={c.length > CHIP_DISPLAY_MAX ? c : undefined}
          onClick={() => onToggle(c)}
          className={`max-w-[min(100%,18rem)] truncate rounded-full border px-3 py-1.5 text-left text-xs font-medium transition ${
            selected.includes(c) ? active : idle
          }`}
        >
          {normalizeChipLabel(c)}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function ProfileCard({ profile }: { profile: MemberProfileCard }) {
  return (
    <article className="space-y-4">
      <p className="text-sm leading-6 text-stone-700">{profile.summary}</p>
      <Section title="First targets" items={profile.firstTargets} />
      <Section title="Likely friction" items={profile.likelyFriction} />
      <Section title="Nudge guidelines" items={profile.nudgeGuidelines} />
      <div className="rounded-md border border-fern bg-fern/70 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-bark">
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          Community entry point
        </div>
        <p className="mt-2 text-sm leading-6 text-stone-700">{profile.communityEntryPoint}</p>
      </div>
    </article>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-bark">{title}</h2>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
