"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Users } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-moss/40";

const ALREADY_MEMBER_MSG = "You are already a member of this community.";

export function CommunityEntry() {
  const [joinSlug, setJoinSlug] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinPending, setJoinPending] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  async function submitJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError(null);
    setAlreadyMember(false);
    setJoinPending(true);
    try {
      const res = await fetch("/api/v2/community/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: joinSlug.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (res.status === 409 || data.error === ALREADY_MEMBER_MSG) {
          setAlreadyMember(true);
          setJoinError(null);
        } else {
          setJoinError(data.error ?? "Could not join.");
        }
        return;
      }
      window.location.assign(`${window.location.origin}/community`);
    } finally {
      setJoinPending(false);
    }
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreatePending(true);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          slug: createSlug,
          description: createDescription.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setCreateError(data.error ?? "Could not create community.");
        return;
      }
      setCreateName("");
      setCreateSlug("");
      setCreateDescription("");
      window.location.assign(`${window.location.origin}/community`);
    } finally {
      setCreatePending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-8">
      <header className="text-center space-y-2">
        <span className="text-4xl" aria-hidden>
          🌿
        </span>
        <h1 className="text-xl font-bold text-foreground">Pick one space to show up for</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Grove tracks how you contribute—join an existing group or start your own.
        </p>
      </header>

      <section className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3 bg-muted/20">
          <Users className="h-4 w-4 text-moss" />
          <h2 className="text-sm font-semibold text-foreground">Join with a slug</h2>
        </div>
        {alreadyMember ? (
          <div className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">You&apos;re already a member of this community.</p>
            <Link
              href="/community"
              className="inline-flex text-sm font-medium text-moss hover:text-moss/80"
            >
              Go to community →
            </Link>
          </div>
        ) : (
          <form className="space-y-3 p-4" onSubmit={submitJoin}>
            <p className="text-xs text-muted-foreground">
              Ask your organizer for the URL slug (letters, numbers, hyphens)—like{" "}
              <span className="font-mono text-foreground">grove-welcome</span>.
            </p>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Community slug</span>
              <input
                type="text"
                value={joinSlug}
                onChange={(e) => {
                  setJoinSlug(e.target.value);
                  setAlreadyMember(false);
                }}
                className={`${inputClass} font-mono lowercase`}
                placeholder="your-team-circle"
                disabled={joinPending}
                autoComplete="off"
              />
            </label>
            {joinError ? <p className="text-xs text-red-600 dark:text-red-400">{joinError}</p> : null}
            <button
              type="submit"
              disabled={joinPending || joinSlug.trim() === ""}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-sm font-medium text-moss-fg hover:bg-moss/90 disabled:opacity-50 transition-colors"
            >
              {joinPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Join community
            </button>
          </form>
        )}
      </section>

      <section className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border/50 px-4 py-3 bg-muted/20">
          <h2 className="text-sm font-semibold text-foreground">Create a community</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Slug is permanent—pick something memorable for your cohort.
          </p>
        </div>
        <form className="space-y-3 p-4" onSubmit={submitCreate}>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className={inputClass}
              placeholder="Build night cohort"
              disabled={createPending}
              maxLength={200}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Slug</span>
            <input
              type="text"
              value={createSlug}
              onChange={(e) => setCreateSlug(e.target.value)}
              className={`${inputClass} font-mono lowercase`}
              placeholder="build-night-cohort"
              disabled={createPending}
              autoComplete="off"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Description (optional)</span>
            <textarea
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Who this is for"
              disabled={createPending}
            />
          </label>
          {createError ? <p className="text-xs text-red-600 dark:text-red-400">{createError}</p> : null}
          <button
            type="submit"
            disabled={createPending || createName.trim() === "" || createSlug.trim() === ""}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40 disabled:opacity-50 transition-colors"
          >
            {createPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create community
          </button>
        </form>
      </section>
    </div>
  );
}
