"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Leaf, Sparkles } from "lucide-react";
import { twMerge } from "tailwind-merge";

const USER_PROMPT = "I want to exercise correctly";
const COACH_REPLY =
  "Let's make that small. One goal, two tasks you can start this week.";

const OUTPUT = {
  goal: "Steady movement habit",
  tasks: ["10-min walk after lunch", "Lay out shoes tonight"],
} as const;

type Phase = "idle" | "typing" | "thinking" | "reply" | "outputs" | "pause";

const PHASE_MS: Record<Phase, number> = {
  idle: 400,
  typing: 55,
  thinking: 900,
  reply: 1200,
  outputs: 2800,
  pause: 2200,
};

export function LandingCoachDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [typed, setTyped] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setTyped(USER_PROMPT);
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
          setTyped(USER_PROMPT.slice(0, i));
          if (i < USER_PROMPT.length) {
            timeout = setTimeout(tick, PHASE_MS.typing);
          } else {
            timeout = setTimeout(() => run("thinking"), 350);
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
  }, [reducedMotion]);

  const showUser = phase !== "idle" && typed.length > 0;
  const showThinking = phase === "thinking";
  const showReply = phase === "reply" || phase === "outputs" || phase === "pause";
  const showOutputs = phase === "outputs" || phase === "pause";

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-moss/25 blur-2xl motion-safe:animate-landing-drift"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-6 -left-4 h-24 w-24 rounded-full bg-marigold/20 blur-2xl motion-safe:animate-landing-float"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/50 p-5 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/55 dark:shadow-glass-dark sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-moss/25 bg-moss/10">
              <Sparkles className="h-4 w-4 text-moss" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">Coach</p>
              <p className="text-[11px] text-stone-600 dark:text-muted-foreground">Live preview</p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full border border-moss/20 bg-moss/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-moss motion-safe:animate-landing-grow-badge"
            aria-hidden="true"
          >
            <Leaf className="h-3 w-3" />
            Growing
          </div>
        </div>

        {/* Gemini-style gradient input — spin only the border layer */}
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
              {reducedMotion ? USER_PROMPT : typed}
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
                {typed || USER_PROMPT}
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
              <p className="text-sm leading-relaxed text-stone-700 dark:text-muted-foreground">{COACH_REPLY}</p>
            </div>
          ) : null}

          {showOutputs ? (
            <div className="space-y-2 border-t border-white/60 pt-3 motion-safe:animate-fadeIn dark:border-white/10">
              <div
                className={twMerge(
                  "rounded-xl border border-moss/25 bg-gradient-to-r from-moss/10 to-fern/40 px-3 py-2.5 transition motion-safe:duration-500",
                  showOutputs ? "motion-safe:translate-y-0 motion-safe:opacity-100" : "opacity-0",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-moss">Goal</p>
                <p className="mt-0.5 text-sm font-semibold text-bark dark:text-foreground">{OUTPUT.goal}</p>
              </div>
              <ul className="space-y-1.5">
                {OUTPUT.tasks.map((task, i) => (
                  <li
                    key={task}
                    style={{ animationDelay: reducedMotion ? "0ms" : `${i * 180 + 120}ms` }}
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
                Lands on Today
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
