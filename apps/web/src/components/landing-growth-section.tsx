"use client";

import { useCallback, useEffect, useState } from "react";
import { HeartPulse, RefreshCw, Users } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { LandingGrowthDemo, type GrowthBeatId } from "@/components/landing-growth-demo";

const beats: { id: GrowthBeatId; icon: typeof HeartPulse; label: string; hint: string; accent: string }[] = [
  {
    id: "start",
    icon: HeartPulse,
    label: "Starting feels heavy",
    hint: "Friction and context switching, not missing ambition.",
    accent: "from-moss/20 to-fern/50",
  },
  {
    id: "reset",
    icon: RefreshCw,
    label: "Rough days still count",
    hint: "Come back without a streak shame spiral.",
    accent: "from-marigold/25 to-fern/40",
  },
  {
    id: "together",
    icon: Users,
    label: "Community fuels follow-through",
    hint: "Not a separate tab you forget to open.",
    accent: "from-clay/15 to-moss/15",
  },
];

export function LandingGrowthSection() {
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const advanceBeat = useCallback(() => {
    setActive((i) => (i + 1) % beats.length);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /** Fallback rotation if a scenario stalls; demos also advance via onBeatComplete */
  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(advanceBeat, 28_000);
    return () => clearInterval(id);
  }, [reducedMotion, advanceBeat]);

  const activeBeat = beats[active];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/45 bg-white/30 p-6 shadow-glass backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/40 dark:shadow-glass-dark sm:p-8 lg:p-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(77,124,85,0.12),transparent_65%)]"
        aria-hidden="true"
      />

      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-moss">See it grow</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-bark dark:text-foreground sm:text-4xl">
            One messy sentence becomes tasks you can start.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-700 dark:text-muted-foreground">
            Coach shapes goals and tasks. On rough days you re-enter without shame. Community buddy time keeps you
            showing up.
          </p>

          <ul className="mt-8 space-y-3" role="tablist" aria-label="Why Grove">
            {beats.map((beat, index) => {
              const Icon = beat.icon;
              const isActive = active === index;
              return (
                <li key={beat.id}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(index)}
                    className={twMerge(
                      "group flex w-full items-start gap-4 rounded-2xl border px-4 py-3.5 text-left transition motion-safe:duration-300",
                      isActive
                        ? "border-moss/35 bg-white/70 shadow-md dark:border-moss/30 dark:bg-zinc-950/70"
                        : "border-transparent bg-white/25 hover:border-white/60 hover:bg-white/45 dark:bg-zinc-950/30 dark:hover:border-white/10",
                    )}
                  >
                    <span
                      className={twMerge(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br transition motion-safe:duration-500",
                        beat.accent,
                        isActive ? "scale-105" : "opacity-80",
                      )}
                    >
                      <Icon className="h-5 w-5 text-bark dark:text-foreground" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-bark dark:text-foreground">{beat.label}</span>
                      <span
                        className={twMerge(
                          "mt-0.5 block text-xs leading-relaxed text-stone-600 transition dark:text-muted-foreground",
                          isActive ? "motion-safe:opacity-100" : "motion-safe:opacity-70",
                        )}
                      >
                        {beat.hint}
                      </span>
                    </span>
                    <span
                      className={twMerge(
                        "ml-auto mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-moss transition motion-safe:duration-300",
                        isActive ? "scale-100 opacity-100" : "scale-75 opacity-0",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <LandingGrowthDemo
          key={activeBeat.id}
          activeBeat={activeBeat.id}
          onBeatComplete={advanceBeat}
        />
      </div>
    </section>
  );
}
