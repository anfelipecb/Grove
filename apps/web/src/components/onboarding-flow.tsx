"use client";

import { useState } from "react";
import { ArrowRight, ClipboardList, ShieldCheck, Sparkles } from "lucide-react";
import type { IntakeDraft, MemberProfileCard } from "@grove/core";
import { NavLinks } from "@/components/nav-links";

const inputBase =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-moss/20 transition focus:border-moss focus:ring-4";

export function OnboardingFlow() {
  const [intake, setIntake] = useState<IntakeDraft>({
    name: "",
    goals: "Build Grove\nStay consistent with exercise\nHelp AgentsForGood coordinate",
    friction: "Context switching\nLosing track after meetings\nOver-planning instead of starting",
    supportStyle: "structured",
    communityInterest: "I want a group that remembers commitments and makes it easier to rejoin after falling behind.",
    focusDisclosure: "",
  });
  const [profile, setProfile] = useState<MemberProfileCard | null>(null);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setSafetyMessage(null);
    const response = await fetch("/api/ai/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intake),
    });
    const payload = (await response.json()) as {
      profile?: MemberProfileCard;
      safety?: boolean;
      message?: string;
    };
    setLoading(false);

    if (payload.safety) {
      setSafetyMessage(payload.message ?? "Grove cannot safely handle this as a coaching request.");
      return;
    }

    setProfile(payload.profile ?? null);
  }

  return (
    <main className="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-stone-300 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-moss">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Grove onboarding
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Turn intentions into a support profile.</h1>
          </div>
          <NavLinks />
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-md border border-stone-300 bg-white/85 p-4 shadow-panel">
            <div className="grid gap-4">
              <Field label="Name">
                <input
                  className={inputBase}
                  value={intake.name}
                  onChange={(event) => setIntake({ ...intake, name: event.target.value })}
                  placeholder="What should Grove call you?"
                />
              </Field>
              <Field label="Goals">
                <textarea
                  className={inputBase}
                  rows={4}
                  value={intake.goals}
                  onChange={(event) => setIntake({ ...intake, goals: event.target.value })}
                />
              </Field>
              <Field label="Friction">
                <textarea
                  className={inputBase}
                  rows={4}
                  value={intake.friction}
                  onChange={(event) => setIntake({ ...intake, friction: event.target.value })}
                />
              </Field>
              <Field label="Support style">
                <select
                  className={inputBase}
                  value={intake.supportStyle}
                  onChange={(event) =>
                    setIntake({ ...intake, supportStyle: event.target.value as IntakeDraft["supportStyle"] })
                  }
                >
                  <option value="brief">Brief</option>
                  <option value="structured">Structured</option>
                  <option value="gentle">Gentle</option>
                  <option value="direct">Direct</option>
                </select>
              </Field>
              <Field label="Community participation">
                <textarea
                  className={inputBase}
                  rows={3}
                  value={intake.communityInterest}
                  onChange={(event) => setIntake({ ...intake, communityInterest: event.target.value })}
                />
              </Field>
              <Field label="Optional private focus context">
                <textarea
                  className={inputBase}
                  rows={3}
                  value={intake.focusDisclosure}
                  onChange={(event) => setIntake({ ...intake, focusDisclosure: event.target.value })}
                  placeholder="Private by default. Used only to adapt planning and nudges."
                />
              </Field>
              <button
                type="button"
                onClick={submit}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-bark px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {loading ? "Generating..." : "Generate profile"}
              </button>
            </div>
          </div>

          <div className="rounded-md border border-stone-300 bg-white/85 p-4 shadow-panel">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-moss">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Private profile card
            </div>
            {safetyMessage ? (
              <p className="rounded-md border border-clay bg-clay/10 p-4 text-sm leading-6 text-bark">
                {safetyMessage}
              </p>
            ) : profile ? (
              <ProfileCard profile={profile} />
            ) : (
              <div className="flex min-h-72 items-center justify-center rounded-md border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm leading-6 text-stone-600">
                Your profile will appear here. It should produce concrete next actions, not a vague personality label.
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

