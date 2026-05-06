"use client";

import { useAuth } from "@clerk/nextjs";
import { CalendarCheck, Library, Pencil, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { AppHeaderToolbar } from "@/components/app-header-toolbar";
import { MyceliumChat } from "@/components/mycelium-chat";

export type MembershipRole = "owner" | "organizer" | "member";

export type CommunityListItem = {
  membershipId: string;
  communityId: string;
  name: string;
  slug: string;
  description: string | null;
  role: MembershipRole;
};

type FeedRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  created_at: string;
};

type SessionRow = {
  id: string;
  title: string;
  starts_at: string | null;
  agenda: string | null;
};

const panel =
  "rounded-md border border-border bg-card/90 p-4 shadow-panel dark:border-border dark:bg-card dark:shadow-panel-dark";

function canManageCommunity(role: MembershipRole): boolean {
  return role === "owner" || role === "organizer";
}

export function CommunitiesView({
  communities,
  profileId,
  demoMode = false,
}: {
  communities: CommunityListItem[];
  profileId: string;
  demoMode?: boolean;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const supabase = useMemo(
    () => (demoMode ? null : createBrowserSupabaseClient(() => getToken())),
    [demoMode, getToken],
  );

  /** Merged with server props; optimistic row after create so the sidebar updates before RSC refresh. */
  const [communityList, setCommunityList] = useState(communities);
  useEffect(() => {
    setCommunityList(communities);
  }, [communities]);

  const [selectedId, setSelectedId] = useState<string | null>(communities[0]?.communityId ?? null);
  const [feed, setFeed] = useState<FeedRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  const [manageName, setManageName] = useState("");
  const [manageDescription, setManageDescription] = useState("");
  const [manageError, setManageError] = useState<string | null>(null);
  const [managePending, setManagePending] = useState(false);

  useEffect(() => {
    const ids = new Set(communityList.map((c) => c.communityId));
    if (selectedId && !ids.has(selectedId)) {
      setSelectedId(communityList[0]?.communityId ?? null);
    }
  }, [communityList, selectedId]);

  const selected = communityList.find((c) => c.communityId === selectedId) ?? null;
  const canManage = selected ? canManageCommunity(selected.role) : false;

  useEffect(() => {
    if (manageOpen && selected) {
      setManageName(selected.name);
      setManageDescription(selected.description ?? "");
      setManageError(null);
    }
  }, [manageOpen, selected]);

  const refresh = useCallback(async () => {
    if (!supabase || !selectedId) {
      setFeed([]);
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [f, s] = await Promise.all([
      supabase
        .from("feed_posts")
        .select("id, kind, title, body, created_at")
        .eq("community_id", selectedId)
        .order("created_at", { ascending: false })
        .limit(24),
      supabase
        .from("sessions")
        .select("id, title, starts_at, agenda")
        .eq("community_id", selectedId)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);
    setFeed((f.data as FeedRow[]) ?? []);
    setSessions((s.data as SessionRow[]) ?? []);
    setLoading(false);
  }, [supabase, selectedId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function submitCreate() {
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
      const data = (await res.json()) as {
        error?: string;
        membershipId?: string;
        community?: { id: string; name: string; slug: string; description: string | null };
      };
      if (!res.ok) {
        setCreateError(data.error ?? "Could not create community.");
        return;
      }
      const com = data.community;
      const membershipId = data.membershipId;
      setCreateOpen(false);
      setCreateName("");
      setCreateSlug("");
      setCreateDescription("");
      if (com?.id && membershipId) {
        setCommunityList((prev) => {
          if (prev.some((c) => c.communityId === com.id)) return prev;
          return [
            ...prev,
            {
              membershipId,
              communityId: com.id,
              name: com.name,
              slug: com.slug,
              description: com.description ?? null,
              role: "owner" as const,
            },
          ];
        });
        setSelectedId(com.id);
      }
      router.refresh();
    } finally {
      setCreatePending(false);
    }
  }

  async function submitManage() {
    if (!selected) return;
    setManageError(null);
    setManagePending(true);
    try {
      const res = await fetch(`/api/communities/${selected.communityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manageName.trim(),
          description: manageDescription.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setManageError(data.error ?? "Could not save changes.");
        return;
      }
      setManageOpen(false);
      router.refresh();
    } finally {
      setManagePending(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8" data-profile-id={profileId}>
      {createOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-bark/40 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !createPending) setCreateOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-labelledby="create-community-title"
            className={`${panel} z-50 w-full max-w-md`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="create-community-title" className="text-lg font-semibold text-bark">
              Create community
            </h2>
            <p className="mt-1 text-xs text-stone-600">
              URL slug is permanent—pick something memorable for your cohort (letters, numbers, hyphens).
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-stone-700">
                Name
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  placeholder="Build night cohort"
                  disabled={createPending}
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Slug
                <input
                  type="text"
                  value={createSlug}
                  onChange={(e) => setCreateSlug(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm lowercase"
                  placeholder="build-night-east"
                  autoCapitalize="off"
                  spellCheck={false}
                  disabled={createPending}
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Description (optional)
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="mt-1 min-h-[88px] w-full resize-y rounded-md border border-stone-300 px-3 py-2 text-sm"
                  disabled={createPending}
                />
              </label>
            </div>
            {createError ? <p className="mt-3 text-sm text-red-700">{createError}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                disabled={createPending}
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md border border-moss bg-moss px-3 py-2 text-sm font-semibold text-white hover:bg-moss/90 disabled:opacity-60"
                disabled={createPending}
                onClick={() => void submitCreate()}
              >
                {createPending ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {manageOpen && selected ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-bark/40 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !managePending) setManageOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-labelledby="manage-community-title"
            className={`${panel} z-50 w-full max-w-md`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="manage-community-title" className="text-lg font-semibold text-bark">
              Manage community
            </h2>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-stone-700">
                Name
                <input
                  type="text"
                  value={manageName}
                  onChange={(e) => setManageName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  disabled={managePending}
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Description
                <textarea
                  value={manageDescription}
                  onChange={(e) => setManageDescription(e.target.value)}
                  className="mt-1 min-h-[88px] w-full resize-y rounded-md border border-stone-300 px-3 py-2 text-sm"
                  disabled={managePending}
                />
              </label>
              <label className="block text-sm font-medium text-stone-500">
                URL slug (read-only)
                <input
                  type="text"
                  readOnly
                  value={selected.slug}
                  className="mt-1 w-full cursor-not-allowed rounded-md border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm text-stone-600"
                />
              </label>
            </div>
            {manageError ? <p className="mt-3 text-sm text-red-700">{manageError}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                disabled={managePending}
                onClick={() => setManageOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md border border-moss bg-moss px-3 py-2 text-sm font-semibold text-white hover:bg-moss/90 disabled:opacity-60"
                disabled={managePending}
                onClick={() => void submitManage()}
              >
                {managePending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <header className="space-y-4 border-b border-border pb-4">
          <div>
            <h1 className="text-xl font-semibold text-bark">Communities</h1>
            <p className="text-sm text-stone-600">Feed, sessions, and Mycelium alongside your group.</p>
          </div>
          <AppHeaderToolbar demoMode={demoMode} />
        </header>

        <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[220px_1fr_340px]">
          <aside className={panel}>
            <div className="mb-3 flex items-center justify-between gap-2 text-moss">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-700">Your communities</h2>
              </span>
            </div>
            <button
              type="button"
              disabled={demoMode || createPending}
              title={
                demoMode
                  ? "In local demo, community APIs expect a Clerk JWT. Use onboarding + dashboard demos, or sign in."
                  : undefined
              }
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-md border border-moss bg-moss px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-moss/90 disabled:opacity-50"
              onClick={() => {
                setCreateError(null);
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create community
            </button>
            <ul className="space-y-2">
              {communityList.length === 0 ? (
                <li className="text-sm text-stone-600">
                  <p>You are not in any communities yet.</p>
                  <p className="mt-2 font-medium text-bark">Start a space</p>
                  <p className="mt-1 text-stone-600">
                    Builders and organizers can create a community here. Onboarding joins you to Grove Welcome when
                    you finish setup.
                  </p>
                </li>
              ) : (
                communityList.map((c) => (
                  <li key={c.communityId}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.communityId)}
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm font-medium transition ${
                        selectedId === c.communityId
                          ? "border-moss bg-moss/10 text-bark"
                          : "border-stone-300 bg-white text-stone-700 hover:border-moss"
                      }`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))
              )}
            </ul>
            {selected && canManage ? (
              <button
                type="button"
                disabled={demoMode}
                title={
                  demoMode
                    ? "Manage community in local demo requires a Clerk JWT for API routes."
                    : undefined
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
                onClick={() => setManageOpen(true)}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Manage selected
              </button>
            ) : null}
          </aside>

          <section className="grid gap-4 lg:grid-cols-1">
            <div className={panel}>
              <div className="mb-3 flex items-center gap-2 text-moss">
                <Library className="h-4 w-4" aria-hidden="true" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-700">Feed</h2>
              </div>
              {loading ? (
                <p className="text-sm text-stone-600">Loading…</p>
              ) : feed.length === 0 ? (
                <p className="text-sm text-stone-600">
                  {demoMode
                    ? "Local demo: live feed posts need a Clerk-signed Supabase session in the browser. Memberships and layout still match production contracts."
                    : "No posts yet in this space."}
                </p>
              ) : (
                <ul className="space-y-3">
                  {feed.map((post) => (
                    <li key={post.id} className="rounded-md border border-stone-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-moss">{post.kind}</span>
                        <time className="text-xs text-stone-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </time>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold">{post.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-stone-700">{post.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={panel}>
              <div className="mb-3 flex items-center gap-2 text-moss">
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-700">Sessions</h2>
              </div>
              {sessions.length === 0 ? (
                <p className="text-sm text-stone-600">
                  {demoMode
                    ? "Local demo: session list loads when the browser has a Supabase JWT from Clerk."
                    : "No sessions scheduled yet."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {sessions.map((s) => (
                    <li key={s.id} className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm">
                      <div className="font-medium">{s.title}</div>
                      {s.starts_at ? (
                        <div className="text-xs text-stone-600">{new Date(s.starts_at).toLocaleString()}</div>
                      ) : null}
                      {s.agenda ? <div className="mt-1 text-xs text-stone-600">{s.agenda}</div> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <aside className={`${panel} flex min-h-[420px] flex-col gap-3`}>
            <MyceliumChat communityId={selected?.communityId} communityName={selected?.name ?? "Grove"} />
          </aside>
        </div>
      </div>
    </main>
  );
}
