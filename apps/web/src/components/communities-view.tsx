"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import { CalendarCheck, Library, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { MyceliumChat } from "@/components/mycelium-chat";
import { NavLinks } from "@/components/nav-links";

export type CommunityListItem = {
  membershipId: string;
  communityId: string;
  name: string;
  slug: string;
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

const panel = "rounded-md border border-stone-300 bg-white/85 p-4 shadow-panel";

export function CommunitiesView({ communities }: { communities: CommunityListItem[] }) {
  const { getToken } = useAuth();
  const supabase = useMemo(() => createBrowserSupabaseClient(() => getToken()), [getToken]);

  const [selectedId, setSelectedId] = useState<string | null>(communities[0]?.communityId ?? null);
  const [feed, setFeed] = useState<FeedRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const selected = communities.find((c) => c.communityId === selectedId) ?? null;

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

  return (
    <main className="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 pb-4">
          <div>
            <h1 className="text-xl font-semibold text-bark">Communities</h1>
            <p className="text-sm text-stone-600">Feed, sessions, and Mycelium alongside your group.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NavLinks />
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[220px_1fr_340px]">
          <aside className={panel}>
            <div className="mb-3 flex items-center gap-2 text-moss">
              <Users className="h-4 w-4" aria-hidden="true" />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-700">Your communities</h2>
            </div>
            <ul className="space-y-2">
              {communities.length === 0 ? (
                <li className="text-sm text-stone-600">No memberships yet—complete onboarding.</li>
              ) : (
                communities.map((c) => (
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
                <p className="text-sm text-stone-600">No posts yet in this space.</p>
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
                <p className="text-sm text-stone-600">No sessions scheduled yet.</p>
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
            <MyceliumChat
              communityId={selected?.communityId}
              communityName={selected?.name ?? "Grove"}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
