"use client";

import { ArrowRight, Leaf, Network, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const tabs = [
  {
    id: "you",
    label: "Your rhythm",
    icon: Leaf,
    headline: "Goals that respect friction",
    body: "Small next actions, not a mountain of plans. XP reflects effort and resistance—you stay in control of what counts.",
  },
  {
    id: "mycelium",
    label: "Mycelium",
    icon: Sparkles,
    headline: "AI that coordinates, not preaches",
    body: "Mycelium balances life domains, surfaces commitments, and keeps nudges short and non-clinical. A coach for follow-through, not a diagnosis.",
  },
  {
    id: "together",
    label: "Together",
    icon: Users,
    headline: "Community as the growth loop",
    body: "Sessions, feed, and side chat keep you connected. Showing up after a rough week still earns something—because isolation is the silent thief.",
  },
] as const;

export function LandingExperience() {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("mycelium");
  const panel = tabs.find((t) => t.id === active) ?? tabs[1];

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <div
        className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-moss/25 blur-[100px] motion-safe:animate-landing-float dark:opacity-30"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 top-40 h-[28rem] w-[28rem] rounded-full bg-fern/80 blur-[90px] motion-safe:animate-landing-float-slow dark:bg-zinc-700/40 dark:opacity-40"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-marigold/20 blur-[80px] motion-safe:animate-landing-drift dark:opacity-25"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/10"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6 lg:gap-20 lg:px-8 lg:py-16">
        <header className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/50 bg-white/35 shadow-glass backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-glass-dark">
              <Leaf className="h-7 w-7 text-moss" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-moss">Grove</p>
              <p className="text-xs text-stone-600 dark:text-muted-foreground">Grow together</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sign-in"
              className="rounded-xl border border-white/40 bg-white/30 px-4 py-2.5 text-sm font-semibold text-bark shadow-glass backdrop-blur-md transition hover:bg-white/50 hover:shadow-lg dark:border-white/10 dark:bg-zinc-900/50 dark:text-foreground dark:shadow-glass-dark dark:hover:bg-zinc-800/70"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl border border-moss/30 bg-moss/90 px-4 py-2.5 text-sm font-semibold text-white shadow-glass backdrop-blur-sm transition hover:bg-bark dark:border-moss/40 dark:hover:bg-moss"
            >
              Get started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <section className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/25 px-3 py-1 text-xs font-medium text-bark shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/55 dark:text-foreground">
              <Network className="h-3.5 w-3.5 text-moss" aria-hidden="true" />
              Self-improvement, coordinated—not automated away
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-bark dark:text-foreground sm:text-5xl lg:text-[3.25rem]">
              ADHD-aware accountability that keeps you connected—not alone.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-700/95 dark:text-muted-foreground">
              Grove links your private growth loop with real community: goals, friction-aware XP, and Mycelium—clear,
              grounded help for plans, check-ins, and participation nudges.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-moss to-moss/85 px-5 py-3.5 text-sm font-semibold text-white shadow-glass transition hover:from-bark hover:to-bark hover:shadow-lg"
              >
                Start your grove
                <ArrowRight
                  className="h-4 w-4 transition group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-xl border border-white/50 bg-white/35 px-5 py-3.5 text-sm font-semibold text-bark shadow-glass backdrop-blur-md transition hover:bg-white/55 dark:border-white/10 dark:bg-zinc-900/55 dark:text-foreground dark:shadow-glass-dark dark:hover:bg-zinc-800/70"
              >
                I already have an account
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/50 bg-white/35 p-6 shadow-glass backdrop-blur-xl transition hover:bg-white/45 hover:shadow-xl dark:border-white/10 dark:bg-zinc-900/45 dark:shadow-glass-dark dark:hover:bg-zinc-900/55 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-moss">How it works</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isOn = active === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActive(t.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      isOn
                        ? "border-moss/50 bg-moss/15 text-bark shadow-sm dark:text-foreground"
                        : "border-white/40 bg-white/25 text-stone-700 hover:bg-white/40 dark:border-white/10 dark:bg-zinc-900/40 dark:text-muted-foreground dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div
              key={panel.id}
              className="mt-6 rounded-xl border border-white/35 bg-white/40 p-5 shadow-inner backdrop-blur-sm motion-safe:animate-fadeIn dark:border-white/10 dark:bg-zinc-950/50"
            >
              <h2 className="text-lg font-semibold text-bark dark:text-foreground">{panel.headline}</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-muted-foreground">{panel.body}</p>
            </div>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-stone-700 dark:text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-moss" />
                <span>
                  <strong className="text-bark">Intake you own.</strong> Optional private context; no vibes-only
                  coaching.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-moss" />
                <span>
                  <strong className="text-bark">Participation matters.</strong> Feed, sessions, commitments—Mycelium in
                  the margin so nothing gets lost.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Mycelium coach",
              icon: Sparkles,
              cardClass: "from-marigold/25 via-amber-50/30 to-white/40",
              text: "Domain balance and bite-sized next steps from what you actually said—not generic advice.",
            },
            {
              title: "Community pane",
              icon: Users,
              cardClass: "from-moss/15 via-fern/50 to-white/45",
              text: "Feed and chat alongside your group so follow-through stays social, not solitary.",
            },
            {
              title: "Privacy by default",
              icon: Leaf,
              cardClass: "from-stone-100/90 via-white/50 to-fern/20",
              text: "Sensitive context stays private. Public preferences are opt-in; crisis wording routes to real help.",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className={`group relative overflow-hidden rounded-2xl border border-white/45 bg-gradient-to-br ${card.cardClass} p-6 shadow-glass backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-white/60 hover:shadow-xl dark:border-white/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:shadow-glass-dark dark:hover:border-white/15`}
              >
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/50 bg-white/50 text-bark shadow-sm backdrop-blur-sm transition group-hover:scale-105 dark:border-white/10 dark:bg-zinc-800/80 dark:text-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-bark dark:text-foreground">{card.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-stone-700 dark:text-muted-foreground">{card.text}</p>
                </div>
              </article>
            );
          })}
        </section>

        <footer className="border-t border-white/30 pt-10 text-center text-xs text-stone-500 dark:border-white/10 dark:text-muted-foreground">
          <p>Grove — personal follow-through and community participation, together.</p>
        </footer>
      </div>
    </div>
  );
}
