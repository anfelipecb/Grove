import { getServerUserId } from "@/lib/clerk-auth";
import { ArrowRight, Leaf, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await getServerUserId();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-fern/35 via-stone-50 to-white text-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6 lg:gap-24 lg:px-8 lg:py-16">
        <header className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-bark text-white shadow-panel">
              <Leaf className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-moss">Grove</p>
              <p className="text-xs text-stone-600">Grow together</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sign-in"
              className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-bark transition hover:border-moss hover:text-moss"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-md bg-bark px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
            >
              Get started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-bark sm:text-5xl">
              ADHD-aware accountability that keeps you connected—not alone.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-700">
              Grove pairs a private growth loop with real community coordination: goals, friction-aware XP, and
              Mycelium—your coach for plans, check-ins, and participation nudges.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-md bg-moss px-5 py-3 text-sm font-semibold text-white shadow-panel transition hover:bg-bark"
              >
                Start your grove
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-bark transition hover:border-moss"
              >
                I already have an account
              </Link>
            </div>
          </div>
          <div className="rounded-md border border-stone-300 bg-white/90 p-6 shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-wide text-moss">What you get</p>
            <ul className="mt-4 space-y-4 text-sm leading-6 text-stone-700">
              <li>
                <span className="font-semibold text-bark">Onboarding that fits.</span> A guided first session +
                optional private focus context—never a vibe check disguised as help.
              </li>
              <li>
                <span className="font-semibold text-bark">XP that respects resistance.</span> You confirm effort,
                urgency, and community contribution—not an opaque score.
              </li>
              <li>
                <span className="font-semibold text-bark">Community as the loop.</span> Sessions, commitments, and a
                feed that rewards showing back up—even after a hard week.
              </li>
            </ul>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-md border border-stone-300 bg-white/85 p-5 shadow-panel">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-marigold/25 text-bark">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-bark">Mycelium coach</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              Suggests domain balance, surfaces next actions from your intake, and keeps plans small enough to start.
            </p>
          </article>
          <article className="rounded-md border border-stone-300 bg-white/85 p-5 shadow-panel">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-fern/50 text-bark">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-bark">Community pane</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              See commitments and feed activity; ask Mycelium in the side chat what needs doing—without losing the
              thread.
            </p>
          </article>
          <article className="rounded-md border border-stone-300 bg-white/85 p-5 shadow-panel">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-clay/20 text-bark">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-bark">Privacy by default</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              Focus disclosures stay private. Public support preferences are opt-in. Crisis language routes to
              escalation resources—not pretend therapy.
            </p>
          </article>
        </section>

        <footer className="border-t border-stone-200 pt-8 text-center text-xs text-stone-500">
          <p>Grove — personal follow-through and community participation, together.</p>
        </footer>
      </div>
    </main>
  );
}
