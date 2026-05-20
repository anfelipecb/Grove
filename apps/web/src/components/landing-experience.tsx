import { ArrowRight, Leaf, Sparkles, Users, CalendarDays } from "lucide-react";
import Link from "next/link";
import { LandingGrowthSection } from "@/components/landing-growth-section";

const productScenes = [
  {
    title: "Coach",
    icon: Sparkles,
    eyebrow: "Shape the goal",
    body: "Start with one messy intention. Coach helps turn it into a few goals and small repeatable tasks that feel possible to begin.",
    detail: "You do not get a blank page. You get structure, suggestions, and room to adjust.",
  },
  {
    title: "Today",
    icon: CalendarDays,
    eyebrow: "See the next move",
    body: "Your tasks live in today, not buried in a giant system. Required anchors and goal tasks sit side by side so you can start smaller and still make visible progress.",
    detail: "The point is not perfect planning. The point is knowing what to do next.",
  },
  {
    title: "Community",
    icon: Users,
    eyebrow: "Stay in motion together",
    body: "Shared goals, sessions, and group momentum help you come back after a rough week instead of drifting alone.",
    detail: "Grove treats community as fuel for follow-through, not decoration.",
  },
] as const;

const firstWeek = [
  {
    day: "Day 1",
    title: "You arrive with one honest sentence",
    body: "Something like \"I want my work rhythm to stop collapsing every few days.\" Coach turns that into a few goal options and small tasks.",
  },
  {
    day: "Day 2",
    title: "Today shows a plan you can actually enter",
    body: "A couple of required tasks keep the floor visible. Goal tasks help you move the bigger work without rebuilding the whole week each morning.",
  },
  {
    day: "Day 4",
    title: "You slip, then reopen the app without shame spiraling",
    body: "The system is still there. You adjust, finish one small thing, and the day counts because effort still counts.",
  },
  {
    day: "Day 7",
    title: "Community makes the loop stronger",
    body: "You can see shared momentum, upcoming sessions, and visible contribution, which makes follow-through feel social instead of private and brittle.",
  },
] as const;

export function LandingExperience({
  showDemoLinks = false,
  demoError = null,
}: {
  showDemoLinks?: boolean;
  demoError?: string | null;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <div
        className="pointer-events-none absolute -left-28 top-24 h-[26rem] w-[26rem] rounded-full bg-moss/20 blur-[110px] motion-safe:animate-landing-float dark:opacity-30"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-6rem] top-16 h-[30rem] w-[30rem] rounded-full bg-marigold/18 blur-[120px] motion-safe:animate-landing-float-slow dark:opacity-20"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-fern/75 blur-[90px] motion-safe:animate-landing-drift dark:bg-zinc-700/25 dark:opacity-30"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 lg:gap-24 lg:px-8 lg:py-16">
        {demoError ? (
          <p
            role="alert"
            className="rounded-2xl border border-amber-500/40 bg-amber-50/90 px-4 py-3 text-sm leading-6 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
          >
            <span className="font-semibold">Demo could not start.</span> {demoError}
          </p>
        ) : null}
        <header className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/50 bg-white/40 shadow-glass backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-glass-dark">
              <Leaf className="h-7 w-7 text-moss" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-moss">Grove</p>
              <p className="text-xs text-stone-600 dark:text-muted-foreground">For people trying to follow through without disappearing</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end lg:w-auto">
            <Link
              href="/sign-in"
              className="rounded-xl border border-white/45 bg-white/35 px-4 py-2.5 text-sm font-semibold text-bark shadow-glass backdrop-blur-md transition hover:bg-white/55 hover:shadow-lg dark:border-white/10 dark:bg-zinc-900/55 dark:text-foreground dark:shadow-glass-dark dark:hover:bg-zinc-800/75"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-bark px-4 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-moss"
            >
              Start with Coach
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {showDemoLinks ? (
              <div className="flex w-full flex-col gap-2 rounded-2xl border border-dashed border-moss/35 bg-white/40 px-3 py-2 text-xs shadow-glass backdrop-blur-md sm:min-w-[260px] sm:flex-1">
                <span className="font-semibold text-bark">Local demo, no Clerk sign-in</span>
                <div className="flex flex-wrap gap-2">
                  <Link href="/demo/start?scenario=onboarding" className="font-semibold text-moss hover:underline">
                    Onboarding
                  </Link>
                  <span className="text-stone-400" aria-hidden="true">
                    /
                  </span>
                  <Link href="/demo/start?scenario=dashboard" className="font-semibold text-moss hover:underline">
                    Dashboard
                  </Link>
                  <span className="text-stone-400" aria-hidden="true">
                    /
                  </span>
                  <Link href="/demo/exit" className="text-stone-600 hover:text-bark hover:underline">
                    Exit demo
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <section className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div className="max-w-2xl">
            <h1 className="mt-2 text-4xl font-semibold leading-[1.03] tracking-tight text-bark dark:text-foreground sm:text-5xl lg:text-[4.1rem]">
              Turn one messy intention into a few small tasks you can start today.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-700 dark:text-muted-foreground">
              Some days you know what matters and still cannot begin. Grove is ADHD-aware follow-through with Coach, Today, and Community in one loop.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-moss to-bark px-5 py-3.5 text-sm font-semibold text-white shadow-glass transition hover:shadow-lg"
              >
                Create your first goals
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-xl border border-white/50 bg-white/35 px-5 py-3.5 text-sm font-semibold text-bark shadow-glass backdrop-blur-md transition hover:bg-white/55 dark:border-white/10 dark:bg-zinc-900/55 dark:text-foreground dark:shadow-glass-dark dark:hover:bg-zinc-800/75"
              >
                I already have an account
              </Link>
            </div>

          </div>

          <aside className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-white/40 p-6 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/45 dark:shadow-glass-dark sm:p-7">
            <div
              className="pointer-events-none absolute inset-x-6 top-5 h-px bg-[linear-gradient(90deg,transparent,rgba(77,124,85,0.55),transparent)] motion-safe:animate-landing-shine bg-[length:220%_100%]"
              aria-hidden="true"
            />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-moss">Your first day in Grove</p>
            <h2 className="mt-3 text-2xl font-semibold text-bark dark:text-foreground">You should know what happens next</h2>
            <p className="mt-3 text-sm leading-6 text-stone-700 dark:text-muted-foreground">
              Sign-up should not drop you into an empty dashboard. Grove starts by helping you shape one real goal, then turns it into a handful of tasks you can enter today.
            </p>

            <div className="mt-7 space-y-4">
              {[
                {
                  step: "01",
                  title: "Tell Coach what feels stuck",
                  body: "Start with plain language, not a perfect category.",
                },
                {
                  step: "02",
                  title: "Pick a few goals and small tasks",
                  body: "Required anchors and goal tasks are suggested, then adjusted by you.",
                },
                {
                  step: "03",
                  title: "Land on Today with a plan you can enter",
                  body: "Your work is already visible, short, and easier to restart.",
                },
                {
                  step: "04",
                  title: "Use Community to stay connected",
                  body: "Shared goals and sessions make momentum easier to recover.",
                },
              ].map((item, index) => (
                <div key={item.step} className="relative pl-12">
                  {index !== 3 ? (
                    <div className="absolute left-[1.05rem] top-8 h-[calc(100%+0.9rem)] w-px bg-gradient-to-b from-moss/80 to-transparent" aria-hidden="true" />
                  ) : null}
                  <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-moss/30 bg-moss/12 text-xs font-semibold text-bark dark:text-foreground">
                    {item.step}
                  </div>
                  <div className="rounded-2xl border border-white/45 bg-white/55 px-4 py-3 dark:border-white/10 dark:bg-zinc-950/55">
                    <p className="text-sm font-semibold text-bark dark:text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-stone-700 dark:text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-moss/35 bg-moss/8 px-4 py-3 text-sm leading-6 text-stone-700 dark:text-muted-foreground">
              After sign-up, you are not asked to invent the system alone. Grove helps you make one.
            </div>
          </aside>
        </section>

        <LandingGrowthSection />

        <section className="rounded-[2rem] border border-white/45 bg-white/35 p-6 shadow-glass backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/40 dark:shadow-glass-dark sm:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-moss">How Grove works</p>
            <h2 className="mt-3 text-3xl font-semibold text-bark dark:text-foreground">Three surfaces, one loop</h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {productScenes.map((scene, index) => {
              const Icon = scene.icon;
              return (
                <article
                  key={scene.title}
                  style={{ animationDelay: `${index * 140}ms` }}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-white/50 bg-gradient-to-br from-white/65 via-white/40 to-fern/35 p-6 shadow-glass backdrop-blur-md motion-safe:animate-fadeIn motion-safe:opacity-0 transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:shadow-glass-dark"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/50 bg-white/50 text-bark shadow-sm dark:border-white/10 dark:bg-zinc-800/80 dark:text-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-moss">{scene.eyebrow}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-bark dark:text-foreground">{scene.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-700 dark:text-muted-foreground">{scene.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-moss">A better story than streaks</p>
            <h2 className="mt-3 text-3xl font-semibold text-bark dark:text-foreground">What the first week should feel like</h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-stone-700 dark:text-muted-foreground">
              The point is not to become flawless in a day. The point is to make re-entry easier, so progress survives imperfect energy, rough mornings, and interrupted weeks.
            </p>
          </div>

          <div className="space-y-4">
            {firstWeek.map((item, index) => (
              <article
                key={item.day}
                style={{ animationDelay: `${index * 120}ms` }}
                className="rounded-[1.75rem] border border-white/45 bg-white/35 p-5 shadow-glass backdrop-blur-md motion-safe:animate-fadeIn motion-safe:opacity-0 dark:border-white/10 dark:bg-zinc-900/45 dark:shadow-glass-dark"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-moss/30 bg-moss/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-bark dark:text-foreground">
                    {item.day}
                  </span>
                  <h3 className="text-lg font-semibold text-bark dark:text-foreground">{item.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-700 dark:text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/45 bg-gradient-to-r from-bark via-bark to-moss p-7 text-white shadow-panel dark:shadow-panel-dark sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Why community matters</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">Grove is not solo productivity with a community tab.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">
                Personal follow-through and community participation strengthen each other. When your own system feels alive, you show up for other people more easily. When other people are visible, it is easier to return to your own work.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">The promise of Grove</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/80">
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" />
                  <span>You should understand the app before you finish the first screen.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" />
                  <span>You should leave onboarding with real goals and tasks, not a blank dashboard.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" />
                  <span>You should be able to come back after a rough day without feeling like you failed the app.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="rounded-[1.75rem] border border-white/40 bg-white/30 px-6 py-8 text-center shadow-glass backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/45 dark:shadow-glass-dark">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-moss">Start here</p>
          <h2 className="mt-3 text-3xl font-semibold text-bark dark:text-foreground">If you want a clearer way to keep going, Grove is ready.</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-stone-700 dark:text-muted-foreground">
            Shape goals with Coach, then land on Today with a plan you can enter.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl bg-moss px-5 py-3 text-sm font-semibold text-white transition hover:bg-bark"
            >
              Start with Coach
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-xl border border-white/50 bg-white/45 px-5 py-3 text-sm font-semibold text-bark transition hover:bg-white/65 dark:border-white/10 dark:bg-zinc-900/55 dark:text-foreground dark:hover:bg-zinc-800/75"
            >
              Return to Grove
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
