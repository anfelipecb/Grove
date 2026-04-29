"use client";

import { useState } from "react";
import { CalendarCheck, ClipboardCheck, Network, Sparkles } from "lucide-react";
import type { SessionSummary } from "@grove/core";
import { AppHeaderToolbar } from "@/components/app-header-toolbar";

const inputBase =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-moss/20 transition focus:border-moss focus:ring-4";

const starterNotes = `Decided: Grove v1 should treat solo goals and community participation as equal pillars.
Andres: will commit the repo scaffold and share it with AgentsForGood.
Mycelium should summarize sessions, extract commitments, and help newcomers catch up.
Next: test onboarding with one ADHD user and one community member.`;

export function MyceliumWorkbench() {
  const [title, setTitle] = useState("AgentsForGood Grove planning");
  const [notes, setNotes] = useState(starterNotes);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function summarize() {
    setLoading(true);
    setSafetyMessage(null);
    const response = await fetch("/api/ai/session-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, notes }),
    });
    const payload = (await response.json()) as {
      summary?: SessionSummary;
      safety?: boolean;
      message?: string;
    };
    setLoading(false);

    if (payload.safety) {
      setSafetyMessage(payload.message ?? "Mycelium cannot safely process these notes.");
      return;
    }

    setSummary(payload.summary ?? null);
  }

  return (
    <main className="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="space-y-4 border-b border-stone-300 pb-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-moss">
              <Network className="h-4 w-4" aria-hidden="true" />
              Mycelium
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Community memory without organizer overload.</h1>
          </div>
          <AppHeaderToolbar />
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-md border border-stone-300 bg-white/85 p-4 shadow-panel">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-moss">
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
              Session notes
            </div>
            <div className="grid gap-4">
              <input className={inputBase} value={title} onChange={(event) => setTitle(event.target.value)} />
              <textarea
                className={inputBase}
                rows={14}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
              <button
                type="button"
                onClick={summarize}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-bark px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {loading ? "Summarizing..." : "Summarize with Mycelium"}
              </button>
            </div>
          </div>

          <div className="rounded-md border border-stone-300 bg-white/85 p-4 shadow-panel">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-moss">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              Feed-ready memory
            </div>
            {safetyMessage ? (
              <p className="rounded-md border border-clay bg-clay/10 p-4 text-sm leading-6 text-bark">
                {safetyMessage}
              </p>
            ) : summary ? (
              <Summary summary={summary} />
            ) : (
              <div className="flex min-h-72 items-center justify-center rounded-md border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm leading-6 text-stone-600">
                Mycelium will produce a session summary, decisions, commitments, and newcomer context.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Summary({ summary }: { summary: SessionSummary }) {
  return (
    <article className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{summary.title}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-700">{summary.shortSummary}</p>
      </div>
      <List title="Decisions" items={summary.decisions} />
      <section>
        <h3 className="text-sm font-semibold text-bark">Commitments</h3>
        <div className="mt-2 space-y-2">
          {summary.commitments.map((commitment) => (
            <div
              key={`${commitment.ownerName}-${commitment.task}`}
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
            >
              <span className="font-semibold text-bark">{commitment.ownerName}</span>
              <span className="text-stone-700"> · {commitment.task}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="rounded-md border border-fern bg-fern/70 p-4">
        <h3 className="text-sm font-semibold text-bark">Newcomer context</h3>
        <p className="mt-2 text-sm leading-6 text-stone-700">{summary.newcomerContext}</p>
      </div>
    </article>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-bark">{title}</h3>
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

