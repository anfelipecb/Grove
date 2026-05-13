# v2 UX Clarity — Seniority Header, Empty State CTA, and Profile Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the v2 app self-explanatory for a brand-new user: a rich seniority header (like v1), a clear CTA when Today has no tasks, and a Profile page with name-change.

**Architecture:** Four independent changes — a redirect fix in onboarding, a PointsHeader upgrade using `getSeniorityProgress` from `@grove/core`, an empty-state CTA in DailyCard/TodayDesktop, and a new `/profile` page with a PATCH API route. Each can be committed independently.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS, Supabase (server component + API route), `@grove/core` scoring helpers, Clerk auth.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `apps/web/src/components/onboarding-flow.tsx` | Fix post-onboarding redirect → `/today` |
| Modify | `apps/web/src/components/v2/shared/points-header.tsx` | Seniority tier badge + XP progress bar |
| Modify | `apps/web/src/components/v2/today/daily-card.tsx` | Empty-state CTA card |
| Modify | `apps/web/src/components/v2/today/today-desktop.tsx` | Same empty-state CTA for desktop left column |
| Create | `apps/web/src/app/(v2)/profile/page.tsx` | Profile server component |
| Create | `apps/web/src/components/v2/profile/profile-form.tsx` | Name-change form (client) |
| Create | `apps/web/src/app/api/v2/profile/route.ts` | PATCH endpoint: update display_name |
| Modify | `apps/web/src/components/v2/layout/v2-nav.tsx` | Add Profile tab to desktop nav + mobile bar |
| Modify | `apps/web/src/middleware.ts` | Protect `/profile` route (onboarding complete) |

---

## Task 1: Fix onboarding completion redirect

**Files:**
- Modify: `apps/web/src/components/onboarding-flow.tsx` (line ~455)

- [ ] **Step 1: Change redirect from `/dashboard` to `/today`**

In `apps/web/src/components/onboarding-flow.tsx`, find:
```ts
window.location.assign("/dashboard");
```
Replace with:
```ts
window.location.assign("/today");
```
Also find the Back link near line 861:
```tsx
href="/dashboard"
```
and change to:
```tsx
href="/today"
```

- [ ] **Step 2: Verify manually**

Run: `pnpm dev` (from `apps/web/`), complete onboarding → should land on `/today`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/onboarding-flow.tsx
git commit -m "fix(onboarding): redirect to /today after completion"
```

---

## Task 2: Upgrade PointsHeader to v1-style seniority card

`getSeniorityProgress` is exported from `@grove/core` and returns:
```ts
{
  currentTier: { id: string; label: string; minXp: number };
  nextTier: { id: string; label: string; minXp: number } | null;
  progressPercent: number;   // 0–100 within current tier
  xpIntoTier: number;        // XP above current tier floor
  xpToNext: number;          // XP needed to reach next tier
}
```

**Files:**
- Modify: `apps/web/src/components/v2/shared/points-header.tsx`

- [ ] **Step 1: Replace the component**

```tsx
import { Flame } from "lucide-react";
import { getSeniorityProgress } from "@grove/core";

type PointsHeaderProps = {
  displayName: string;
  totalPoints: number;
  streak: number;
};

export function PointsHeader({ displayName, totalPoints, streak }: PointsHeaderProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const { currentTier, nextTier, progressPercent } = getSeniorityProgress(totalPoints);

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {greeting},{" "}
            <span className="font-semibold text-foreground">{displayName.split(" ")[0]}</span>
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-moss/15 px-2 py-0.5 text-xs font-semibold text-moss">
              {currentTier.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {totalPoints.toLocaleString()} XP
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1 text-sm font-medium text-orange-500">
              <Flame className="h-4 w-4" />
              {streak}
            </div>
          )}
        </div>
      </div>

      {/* Tier progress bar */}
      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-moss transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {nextTier
            ? `${nextTier.label} at ${nextTier.minXp.toLocaleString()} XP`
            : "Max tier reached — Elder 🌳"}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it renders**

Open `http://localhost:3000/today` — header should show greeting, tier badge, XP count, progress bar, "Sprout at 250 XP".

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/v2/shared/points-header.tsx
git commit -m "feat(v2): seniority tier header with XP progress bar"
```

---

## Task 3: Today empty state — CTA card

**Files:**
- Modify: `apps/web/src/components/v2/today/daily-card.tsx`
- Modify: `apps/web/src/components/v2/today/today-desktop.tsx`

- [ ] **Step 1: Replace empty state in `daily-card.tsx`**

Find the empty-state block (around line 69):
```tsx
{required.length === 0 && goal.length === 0 && (
  <p className="py-8 text-center text-sm text-muted-foreground">
    No tasks yet — head to Coach to set up your goals.
  </p>
)}
```
Replace with:
```tsx
{required.length === 0 && goal.length === 0 && (
  <div className="py-6 text-center">
    <p className="text-sm font-medium text-foreground">No tasks set up yet</p>
    <p className="mt-1 text-xs text-muted-foreground">
      The Coach will help you pick goals and turn them into daily tasks.
    </p>
    <a
      href="/coach"
      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90 transition-colors"
    >
      Start with Coach →
    </a>
  </div>
)}
```

- [ ] **Step 2: Replace empty state in `today-desktop.tsx`**

In `apps/web/src/components/v2/today/today-desktop.tsx`, find:
```tsx
{required.length === 0 && goal.length === 0 && (
  <p className="py-4 text-center text-sm text-muted-foreground">
    No tasks yet — head to Coach to set up your goals.
  </p>
)}
```
Replace with:
```tsx
{required.length === 0 && goal.length === 0 && (
  <div className="py-4 text-center">
    <p className="text-sm font-medium text-foreground">No tasks set up yet</p>
    <p className="mt-1 text-xs text-muted-foreground">
      The Coach will help you pick goals and turn them into daily tasks.
    </p>
    <a
      href="/coach"
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90 transition-colors"
    >
      Start with Coach →
    </a>
  </div>
)}
```

- [ ] **Step 3: Verify**

Open `http://localhost:3000/today` with no tasks in the DB — should see the CTA card with green button.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/v2/today/daily-card.tsx \
        apps/web/src/components/v2/today/today-desktop.tsx
git commit -m "feat(v2): today empty state CTA to coach"
```

---

## Task 4: Profile PATCH API route

**Files:**
- Create: `apps/web/src/app/api/v2/profile/route.ts`

- [ ] **Step 1: Create the PATCH route**

```ts
import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function PATCH(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { display_name?: string };
  const displayName = typeof body.display_name === "string" ? body.display_name.trim() : null;

  if (!displayName || displayName.length < 1 || displayName.length > 80) {
    return NextResponse.json({ error: "Name must be 1–80 characters." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("clerk_user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Test manually**

```bash
# From a logged-in browser, open devtools and run:
fetch("/api/v2/profile", {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ display_name: "Test Name" })
}).then(r => r.json()).then(console.log)
# Expected: { ok: true }
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/v2/profile/route.ts
git commit -m "feat(v2): PATCH /api/v2/profile for display_name update"
```

---

## Task 5: Profile page (server component + client form)

**Files:**
- Create: `apps/web/src/app/(v2)/profile/page.tsx`
- Create: `apps/web/src/components/v2/profile/profile-form.tsx`

- [ ] **Step 1: Create `profile-form.tsx`**

```tsx
"use client";

import { useState } from "react";

type ProfileFormProps = {
  initialName: string;
};

export function ProfileForm({ initialName }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (name.trim() === initialName) return;
    setStatus("saving");
    setError(null);

    const res = await fetch("/api/v2/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ display_name: name.trim() }),
    });

    if (res.ok) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not save.");
      setStatus("error");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Display Name
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setStatus("idle"); }}
          maxLength={80}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/40"
          placeholder="Your name"
        />
        <button
          onClick={handleSave}
          disabled={status === "saving" || name.trim() === initialName}
          className="rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-moss/90 disabled:opacity-40"
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Create `profile/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ProfileForm } from "@/components/v2/profile/profile-form";

export default async function ProfilePage() {
  const userId = await getServerUserId();
  if (!userId) redirect("/sign-in");

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase!
    .from("profiles")
    .select("display_name, spendable_points")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      <h1 className="text-lg font-bold text-foreground">Profile</h1>
      <ProfileForm initialName={profile.display_name ?? ""} />
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Points</p>
        <p className="mt-1 text-2xl font-bold text-moss">{profile.spendable_points.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">spendable points</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Open `http://localhost:3000/profile` — should show your name in an input, type a new name, hit Save, reload → name persists.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(v2\)/profile/page.tsx \
        apps/web/src/components/v2/profile/profile-form.tsx
git commit -m "feat(v2): profile page with display name editor"
```

---

## Task 6: Add Profile to nav + protect route in middleware

**Files:**
- Modify: `apps/web/src/components/v2/layout/v2-nav.tsx`
- Modify: `apps/web/src/middleware.ts`

- [ ] **Step 1: Add Profile tab to nav**

In `apps/web/src/components/v2/layout/v2-nav.tsx`, change:
```ts
import { CalendarCheck, Users, Sparkles } from "lucide-react";

const tabs = [
  { href: "/today", label: "Today", icon: CalendarCheck },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/community", label: "Community", icon: Users },
];
```
To:
```ts
import { CalendarCheck, Users, Sparkles, UserCircle } from "lucide-react";

const tabs = [
  { href: "/today", label: "Today", icon: CalendarCheck },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/community", label: "Community", icon: Users },
  { href: "/profile", label: "Profile", icon: UserCircle },
];
```

- [ ] **Step 2: Add `/profile` to middleware protection**

In `apps/web/src/middleware.ts`, add `"/profile(.*)"` to the `requiresOnboardingComplete` matcher:
```ts
const requiresOnboardingComplete = createRouteMatcher([
  "/dashboard(.*)",
  "/calendar(.*)",
  "/communities(.*)",
  "/mycelium(.*)",
  "/today(.*)",
  "/coach(.*)",
  "/community(.*)",
  "/profile(.*)",
]);
```

- [ ] **Step 3: Run typecheck**

```bash
cd /path/to/grove && pnpm typecheck
```
Expected: no errors.

- [ ] **Step 4: Verify nav**

Open the app — bottom nav (mobile) and top nav (desktop) should show Today / Coach / Community / Profile.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/v2/layout/v2-nav.tsx \
        apps/web/src/middleware.ts
git commit -m "feat(v2): add Profile tab to nav"
```

---

## Self-review

**Spec coverage:**
- Onboarding → `/today` redirect ✓ (Task 1)
- Seniority header with tier + progress bar (matching v1 screenshot) ✓ (Task 2)
- Today empty state CTA to Coach ✓ (Task 3)
- Profile page with name change ✓ (Task 4 + 5)
- Profile in nav ✓ (Task 6)

**Placeholder scan:** All steps contain concrete code. No TBDs.

**Type consistency:**
- `getSeniorityProgress` return shape used in Task 2 matches the function signature verified from `packages/core/src/scoring.ts`
- `ProfileForm` props `initialName: string` consistent with `profile.display_name ?? ""` in server component
- Nav `tabs` array typed via Lucide `LucideIcon` — no explicit type needed, TS infers from the import
