"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarRange,
  Check,
  Leaf,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

export type GrowthBeatId = "start" | "reset" | "together";

type Phase = "idle" | "typing" | "thinking" | "reply" | "outputs" | "pause";

/** Slower pacing for landing readability */
const PHASE_MS: Record<Phase, number> = {
  idle: 700,
  typing: 78,
  thinking: 1500,
  reply: 2000,
  outputs: 4800,
  pause: 3800,
};

const COACH_SCENARIOS = {
  start: {
    label: "Coach",
    sublabel: "Live preview",
    badge: "Growing",
    badgeIcon: Leaf,
    userPrompt: "I want to exercise correctly",
    coachReply: "Let's make that small. One goal, two tasks you can start this week.",
    goal: "Steady movement habit",
    tasks: ["10-min walk after lunch", "Lay out shoes tonight"],
    footer: "Lands on Today",
  },
  reset: {
    label: "Coach",
    sublabel: "Rough day re-entry",
    badge: "Still counts",
    badgeIcon: RefreshCw,
    userPrompt: "I fell off for a few days. I don't want to start over.",
    coachReply: "No streak reset. Log one honest win, then one small task for today.",
    goal: "Gentle restart",
    tasks: ["Log what you did manage", "5-minute reset: clear one surface"],
    footer: "Back on Today — no penalty",
  },
} as const;

const BUDDY_SCENARIO = {
  inviteeEmail: "alex@grove.app",
  activity: "Gym — squats and cardio",
  goalContext: "Stay consistent together",
  slots: [
    { day: "Wed", time: "6:00 pm", note: "You both have this window free." },
    { day: "Fri", time: "7:30 am", note: "Based on your schedule." },
  ],
} as const;

type BuddyPhase = "idle" | "form" | "finding" | "slots" | "sent" | "pause";

const BUDDY_MS: Record<BuddyPhase, number> = {
  idle: 700,
  form: 3200,
  finding: 2200,
  slots: 5200,
  sent: 3800,
  pause: 3200,
};

type LandingGrowthDemoProps = {
  activeBeat: GrowthBeatId;
  onBeatComplete?: () => void;
};

function DemoShell({
  label,
  sublabel,
  badge,
  badgeIcon: BadgeIcon,
  accentClass,
  children,
}: {
  label: string;
  sublabel: string;
  badge: string;
  badgeIcon: typeof Leaf;
  accentClass: string;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <div
        className={twMerge(
          "pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full blur-2xl motion-safe:animate-landing-drift",
          accentClass,
        )}
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/50 p-5 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/55 dark:shadow-glass-dark sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-moss/25 bg-moss/10">
              <BadgeIcon className="h-4 w-4 text-moss" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">{label}</p>
              <p className="text-[11px] text-stone-600 dark:text-muted-foreground">{sublabel}</p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full border border-moss/20 bg-moss/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-moss motion-safe:animate-landing-grow-badge"
            aria-hidden="true"
          >
            <BadgeIcon className="h-3 w-3" />
            {badge}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function CoachBeatDemo({
  beat,
  reducedMotion,
  onComplete,
}: {
  beat: "start" | "reset";
  reducedMotion: boolean;
  onComplete?: () => void;
}) {
  const scenario = COACH_SCENARIOS[beat];
  const [phase, setPhase] = useState<Phase>("idle");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    setPhase("idle");
    setTyped("");
  }, [beat]);

  useEffect(() => {
    if (reducedMotion) {
      setTyped(scenario.userPrompt);
      setPhase("outputs");
      return;
    }

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const run = (next: Phase) => {
      if (cancelled) return;
      setPhase(next);

      if (next === "typing") {
        setTyped("");
        let i = 0;
        const tick = () => {
          if (cancelled) return;
          i += 1;
          setTyped(scenario.userPrompt.slice(0, i));
          if (i < scenario.userPrompt.length) {
            timeout = setTimeout(tick, PHASE_MS.typing);
          } else {
            timeout = setTimeout(() => run("thinking"), 500);
          }
        };
        timeout = setTimeout(tick, PHASE_MS.idle);
        return;
      }
      if (next === "thinking") {
        timeout = setTimeout(() => run("reply"), PHASE_MS.thinking);
        return;
      }
      if (next === "reply") {
        timeout = setTimeout(() => run("outputs"), PHASE_MS.reply);
        return;
      }
      if (next === "outputs") {
        timeout = setTimeout(() => run("pause"), PHASE_MS.outputs);
        return;
      }
      if (next === "pause") {
        onComplete?.();
        timeout = setTimeout(() => run("typing"), PHASE_MS.pause);
        return;
      }
      timeout = setTimeout(() => run("typing"), PHASE_MS.idle);
    };

    run("idle");
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [beat, reducedMotion, scenario.userPrompt, onComplete]);

  const showThinking = phase === "thinking";
  const showReply = phase === "reply" || phase === "outputs" || phase === "pause";
  const showOutputs = phase === "outputs" || phase === "pause";
  const showUser = phase !== "idle" && typed.length > 0;

  return (
    <DemoShell
      label={scenario.label}
      sublabel={scenario.sublabel}
      badge={scenario.badge}
      badgeIcon={scenario.badgeIcon}
      accentClass={beat === "reset" ? "bg-marigold/20" : "bg-moss/25"}
    >
      <div className="relative overflow-hidden rounded-2xl p-[2px]">
        <div
          className="landing-gradient-ring-bg pointer-events-none absolute inset-[-50%] motion-safe:animate-landing-ring-spin"
          aria-hidden="true"
        />
        <div className="relative rounded-[calc(1rem-2px)] bg-white px-4 py-3 dark:bg-zinc-950">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-muted-foreground">
            You
          </p>
          <p className="mt-1 min-h-[1.5rem] text-sm font-medium text-bark dark:text-foreground">
            {reducedMotion ? scenario.userPrompt : typed}
            {phase === "typing" && !reducedMotion ? (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-moss align-middle" aria-hidden="true" />
            ) : null}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3" aria-live="polite">
        {showUser ? (
          <div className="flex justify-end motion-safe:animate-fadeIn">
            <p className="max-w-[85%] rounded-2xl rounded-br-md bg-bark/90 px-3.5 py-2 text-sm text-white">
              {typed || scenario.userPrompt}
            </p>
          </div>
        ) : null}

        {showThinking ? (
          <div className="flex items-center gap-2 text-sm text-stone-600 motion-safe:animate-fadeIn dark:text-muted-foreground">
            <span className="flex gap-1" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full bg-moss/60 motion-safe:animate-landing-dot" />
              <span className="h-1.5 w-1.5 rounded-full bg-moss/60 motion-safe:animate-landing-dot [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-moss/60 motion-safe:animate-landing-dot [animation-delay:240ms]" />
            </span>
            Coach is shaping your next step
          </div>
        ) : null}

        {showReply ? (
          <div className="flex gap-2 motion-safe:animate-fadeIn">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-moss/12">
              <Sparkles className="h-3.5 w-3.5 text-moss" aria-hidden="true" />
            </div>
            <p className="text-sm leading-relaxed text-stone-700 dark:text-muted-foreground">{scenario.coachReply}</p>
          </div>
        ) : null}

        {showOutputs ? (
          <div className="space-y-2 border-t border-white/60 pt-3 motion-safe:animate-fadeIn dark:border-white/10">
            <div className="rounded-xl border border-moss/25 bg-gradient-to-r from-moss/10 to-fern/40 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-moss">Goal</p>
              <p className="mt-0.5 text-sm font-semibold text-bark dark:text-foreground">{scenario.goal}</p>
            </div>
            <ul className="space-y-1.5">
              {scenario.tasks.map((task, i) => (
                <li
                  key={task}
                  style={{ animationDelay: reducedMotion ? "0ms" : `${i * 220 + 160}ms` }}
                  className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-bark motion-safe:animate-fadeIn dark:border-white/10 dark:bg-zinc-950/70 dark:text-foreground"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-moss/15 text-moss">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  {task}
                </li>
              ))}
            </ul>
            <p className="flex items-center gap-1 text-xs font-medium text-moss">
              {scenario.footer}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </p>
          </div>
        ) : null}
      </div>
    </DemoShell>
  );
}

function CommunityBuddyDemo({
  reducedMotion,
  onComplete,
}: {
  reducedMotion: boolean;
  onComplete?: () => void;
}) {
  const [phase, setPhase] = useState<BuddyPhase>("idle");
  const [formFill, setFormFill] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(0);

  useEffect(() => {
    setPhase("idle");
    setFormFill(0);
    setSelectedSlot(0);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setPhase("sent");
      setFormFill(3);
      setSelectedSlot(0);
      return;
    }

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const run = (next: BuddyPhase) => {
      if (cancelled) return;
      setPhase(next);

      if (next === "form") {
        setFormFill(0);
        const steps = [1, 2, 3] as const;
        let step = 0;
        const fillTick = () => {
          if (cancelled) return;
          step += 1;
          setFormFill(steps[step - 1] ?? 3);
          if (step < steps.length) {
            timeout = setTimeout(fillTick, 900);
          } else {
            timeout = setTimeout(() => run("finding"), 600);
          }
        };
        timeout = setTimeout(fillTick, BUDDY_MS.idle);
        return;
      }
      if (next === "finding") {
        timeout = setTimeout(() => run("slots"), BUDDY_MS.finding);
        return;
      }
      if (next === "slots") {
        setSelectedSlot(0);
        timeout = setTimeout(() => {
          if (!cancelled) setSelectedSlot(1);
        }, 1400);
        timeout = setTimeout(() => run("sent"), BUDDY_MS.slots);
        return;
      }
      if (next === "sent") {
        onComplete?.();
        timeout = setTimeout(() => run("form"), BUDDY_MS.sent + BUDDY_MS.pause);
        return;
      }
      timeout = setTimeout(() => run("form"), BUDDY_MS.idle);
    };

    run("idle");
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [reducedMotion, onComplete]);

  const showForm = phase === "form" || phase === "finding" || phase === "slots" || phase === "sent";
  const showFinding = phase === "finding";
  const showSlots = phase === "slots" || phase === "sent";
  const showSent = phase === "sent";

  return (
    <DemoShell
      label="Community"
      sublabel="Buddy coordination"
      badge="Together"
      badgeIcon={Users}
      accentClass="bg-clay/15"
    >
      <div className="space-y-3" aria-live="polite">
        {showForm ? (
          <div className="space-y-2 motion-safe:animate-fadeIn">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-muted-foreground">
              Buddy up for gym
            </p>
            <div
              className={twMerge(
                "rounded-xl border px-3 py-2 text-sm transition-colors motion-safe:duration-500",
                formFill >= 1
                  ? "border-moss/30 bg-white/80 text-foreground dark:bg-zinc-950/80"
                  : "border-border/60 bg-white/40 text-muted-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-moss" aria-hidden="true" />
                {formFill >= 1 ? BUDDY_SCENARIO.inviteeEmail : "Friend's email"}
              </span>
            </div>
            <div
              className={twMerge(
                "rounded-xl border px-3 py-2 text-sm transition-colors motion-safe:duration-500",
                formFill >= 2
                  ? "border-moss/30 bg-white/80 text-foreground dark:bg-zinc-950/80"
                  : "border-border/60 bg-white/40 text-muted-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                <CalendarRange className="h-3.5 w-3.5 shrink-0 text-moss" aria-hidden="true" />
                {formFill >= 2 ? BUDDY_SCENARIO.activity : "What are you doing together?"}
              </span>
            </div>
            {formFill >= 3 ? (
              <p className="text-xs text-muted-foreground motion-safe:animate-fadeIn">{BUDDY_SCENARIO.goalContext}</p>
            ) : null}
          </div>
        ) : null}

        {showFinding ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-moss/30 bg-moss/5 px-3 py-2.5 text-sm text-muted-foreground motion-safe:animate-fadeIn">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-moss" aria-hidden="true" />
            Finding times you both have free…
          </div>
        ) : null}

        {showSlots ? (
          <div className="space-y-2 motion-safe:animate-fadeIn">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-moss">Suggested windows</p>
            {BUDDY_SCENARIO.slots.map((slot, i) => (
              <button
                key={slot.day + slot.time}
                type="button"
                tabIndex={-1}
                className={twMerge(
                  "flex w-full flex-col rounded-xl border px-3 py-2.5 text-left text-sm transition motion-safe:duration-500",
                  selectedSlot === i && showSent
                    ? "border-moss bg-moss/10 text-foreground"
                    : selectedSlot === i
                      ? "border-moss/50 bg-white/70 text-foreground dark:bg-zinc-950/70"
                      : "border-white/60 bg-white/50 text-bark dark:border-white/10 dark:bg-zinc-950/50",
                )}
              >
                <span className="font-semibold">
                  {slot.day} · {slot.time}
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground">{slot.note}</span>
              </button>
            ))}
          </div>
        ) : null}

        {showSent ? (
          <div className="rounded-xl border border-moss/25 bg-gradient-to-r from-moss/10 to-clay/10 px-3 py-2.5 motion-safe:animate-fadeIn">
            <p className="text-sm font-semibold text-foreground">Invite sent to Alex</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gym session lands on both calendars when they accept.
            </p>
            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-moss">
              Shows on Community + Today
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </p>
          </div>
        ) : null}
      </div>
    </DemoShell>
  );
}

export function LandingGrowthDemo({ activeBeat, onBeatComplete }: LandingGrowthDemoProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (activeBeat === "together") {
    return <CommunityBuddyDemo reducedMotion={reducedMotion} onComplete={onBeatComplete} />;
  }

  return (
    <CoachBeatDemo
      beat={activeBeat}
      reducedMotion={reducedMotion}
      onComplete={onBeatComplete}
    />
  );
}

/** @deprecated Use LandingGrowthDemo — kept for imports during transition */
export function LandingCoachDemo() {
  return <LandingGrowthDemo activeBeat="start" />;
}
