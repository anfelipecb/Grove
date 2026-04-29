"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardList, ShieldCheck, Sparkles } from "lucide-react";
import type { IntakeDraft, MemberProfileCard } from "@grove/core";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import { AppHeaderToolbar } from "@/components/app-header-toolbar";

const inputBase =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-moss/20 transition focus:border-moss focus:ring-4";

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

export function OnboardingFlow() {
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

  const toggleChip = useCallback((list: string[], value: string, setter: (v: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((x) => x !== value));
    } else {
      setter([...list, value]);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in?redirect_url=/onboarding");
    }
  }, [isLoaded, isSignedIn, router]);

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

  if (!isLoaded || !isSignedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center text-stone-600">
        <p className="text-sm">Loading…</p>
      </main>
    );
  }

  const totalSteps = 5;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  return (
    <main className="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="sticky top-0 z-30 -mx-4 border-b border-stone-200/80 bg-stone-50/85 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-moss">
                <ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />
                Grove onboarding
              </div>
              <h1 className="mt-2 text-2xl font-semibold">Grow together—starting with what matters to you.</h1>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
                <div className="h-full bg-moss transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-stone-600">
                Step {step + 1} of {totalSteps}
              </p>
            </div>
            <AppHeaderToolbar
              userButtonAppearance={{
                elements: {
                  userButtonAvatarBox: "h-9 w-9 ring-2 ring-moss/25 ring-offset-1 ring-offset-white",
                  userButtonBox: "flex-row-reverse",
                },
              }}
            />
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-md border border-stone-300 bg-white/85 p-4 shadow-panel">
            {step === 0 && (
              <div className="grid gap-4">
                <p className="text-sm leading-6 text-stone-700">
                  Welcome. Grove pairs a private growth loop with community coordination. We&apos;ll keep this practical:
                  concrete next actions, not a personality quiz.
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
                <div className="flex flex-wrap gap-2">
                  {GOAL_CHIPS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleChip(goalChips, c, setGoalChips)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        goalChips.includes(c)
                          ? "border-moss bg-moss/15 text-bark"
                          : "border-stone-300 bg-white text-stone-700 hover:border-moss"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <Field label="Add your own (optional)">
                  <textarea
                    className={inputBase}
                    rows={4}
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
                <div className="flex flex-wrap gap-2">
                  {FRICTION_CHIPS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleChip(frictionChips, c, setFrictionChips)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        frictionChips.includes(c)
                          ? "border-clay bg-clay/15 text-bark"
                          : "border-stone-300 bg-white text-stone-700 hover:border-moss"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <Field label="Say more (optional)">
                  <textarea
                    className={inputBase}
                    rows={4}
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
                className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-bark disabled:opacity-40"
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
                  {loading ? "Saving…" : "Finish & open Grove"}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-md border border-stone-300 bg-white/85 p-4 shadow-panel">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-moss">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Preview
            </div>
            {safetyMessage ? (
              <p className="rounded-md border border-clay bg-clay/10 p-4 text-sm leading-6 text-bark">{safetyMessage}</p>
            ) : profile ? (
              <ProfileCard profile={profile} />
            ) : (
              <div className="flex min-h-72 flex-col justify-center rounded-md border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm leading-6 text-stone-600">
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
          <li key={item} className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
