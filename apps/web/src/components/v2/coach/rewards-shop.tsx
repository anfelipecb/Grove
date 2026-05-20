"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  LIFE_DOMAINS,
  domainLevelFromPoints,
  pointsNeededToUnlockDomainLevel,
  type LifeDomainId,
} from "@grove/core";
import { DomainTag } from "@/components/v2/shared/domain-tag";

type DomainPointsPayload = { domains: { id: LifeDomainId; points: number }[] };

type RewardRow = {
  id: string;
  title: string;
  cost: number;
  domain: string | null;
  unlock_level: number | null;
};

function domainLabel(id: string | null | undefined): string {
  if (!id) return "General";
  return LIFE_DOMAINS.find((d) => d.id === id)?.label ?? id;
}

type Props = {
  spendablePoints: number;
  collapsed?: boolean;
};

export function RewardsShop({ spendablePoints, collapsed = false }: Props) {
  const router = useRouter();
  const [pointsMap, setPointsMap] = useState<Record<string, number>>({});
  const [rewards, setRewards] = useState<RewardRow[] | null>(null);
  const [spendable, setSpendable] = useState(spendablePoints);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<LifeDomainId>("learning");
  const [unlockLevel, setUnlockLevel] = useState(1);
  const [cost, setCost] = useState(15);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(!collapsed);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dp, rw] = await Promise.all([
        fetch("/api/v2/coach/domain-points"),
        fetch("/api/v2/coach/rewards"),
      ]);
      if (!dp.ok) throw new Error("Could not load domain points.");
      if (!rw.ok) throw new Error("Could not load rewards.");
      const dpJson = (await dp.json()) as DomainPointsPayload;
      const map: Record<string, number> = {};
      for (const row of dpJson.domains) {
        map[row.id] = row.points;
      }
      setPointsMap(map);
      const rj = (await rw.json()) as { rewards: RewardRow[] };
      setRewards(rj.rewards ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  useEffect(() => {
    setSpendable(spendablePoints);
  }, [spendablePoints]);

  const grouped = useMemo(() => {
    const list = rewards ?? [];
    const buckets = new Map<string, RewardRow[]>();
    for (const rw of list) {
      const key = rw.domain ?? "_general";
      const arr = buckets.get(key) ?? [];
      arr.push(rw);
      buckets.set(key, arr);
    }
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [rewards]);

  async function addReward(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/v2/coach/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          domain,
          unlock_level: unlockLevel,
          cost,
        }),
      });
      if (!res.ok) {
        const p = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(p.error ?? "Could not add reward.");
      }
      setTitle("");
      setUnlockLevel(1);
      setCost(15);
      await refresh();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed.");
    } finally {
      setAdding(false);
    }
  }

  async function redeem(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/v2/coach/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reward_id: id }),
      });
      const p = (await res.json().catch(() => ({}))) as { error?: string; spendable_points?: number };
      if (!res.ok) {
        throw new Error(p.error ?? "Redeem failed.");
      }
      if (typeof p.spendable_points === "number") {
        setSpendable(p.spendable_points);
      }
      await refresh();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redeem failed.");
    } finally {
      setBusyId(null);
    }
  }

  const rewardCount = rewards?.length ?? 0;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Your unlocks ({rewardCount})
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{spendable}</span> spendable pts
          </p>
        </div>
        <ChevronDown
          className={twMerge("h-4 w-4 shrink-0 text-muted-foreground transition", expanded && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {error ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {!expanded ? null : (
        <>
      <form
        onSubmit={addReward}
        className="rounded-3xl border border-dashed border-border bg-background/60 p-4"
      >
        <p className="text-sm font-semibold text-foreground">Add reward</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-muted-foreground">Title</span>
            <input
              className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-2 text-foreground"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              required
              maxLength={160}
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Domain</span>
            <select
              className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-2 text-foreground"
              value={domain}
              onChange={(ev) => setDomain(ev.target.value as LifeDomainId)}
            >
              {LIFE_DOMAINS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Unlock at domain level</span>
            <input
              type="number"
              min={1}
              max={99}
              className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-2 text-foreground"
              value={unlockLevel}
              onChange={(ev) => setUnlockLevel(Number(ev.target.value))}
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Cost (points)</span>
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-2 text-foreground"
              value={cost}
              onChange={(ev) => setCost(Number(ev.target.value))}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={adding}
          className="mt-4 rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-accent disabled:opacity-50"
        >
          {adding ? "Saving…" : "Save reward"}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading rewards…</p>
      ) : (
        <div className="space-y-6">
          {grouped.length === 0 ? (
            <p className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              No rewards yet. Add one above.
            </p>
          ) : null}
          {grouped.map(([key, rows]) => {
            const dom = key === "_general" ? null : key;
            return (
              <div key={key}>
                <h3 className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                  {domainLabel(dom)}
                  {dom ? <DomainTag domain={dom} /> : null}
                </h3>
                <ul className="space-y-3">
                  {rows.map((rw) => {
                    const pts = rw.domain ? (pointsMap[rw.domain] ?? 0) : 0;
                    const needLevel = (rw.unlock_level ?? 1) || 1;
                    const level = rw.domain ? domainLevelFromPoints(pts) : needLevel;
                    const unlocked = !rw.domain || level >= needLevel;
                    const ptsToUnlock = rw.domain
                      ? pointsNeededToUnlockDomainLevel(pts, needLevel)
                      : 0;
                    const canAfford = spendable >= rw.cost;
                    return (
                      <li
                        key={rw.id}
                        className={`rounded-3xl border p-4 ${
                          unlocked
                            ? "border-solid border-border bg-background/80"
                            : "border-dashed border-muted-foreground/40 bg-background/50"
                        }`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{rw.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Cost {rw.cost} pts · Unlocks at domain level {needLevel}
                            </p>
                          </div>
                          {unlocked ? (
                            <button
                              type="button"
                              disabled={!canAfford || busyId === rw.id}
                              onClick={() => void redeem(rw.id)}
                              className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-moss-fg transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {busyId === rw.id ? "Redeeming…" : "Redeem"}
                            </button>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {ptsToUnlock > 0
                                ? `Earn ${ptsToUnlock} more pts in this domain to unlock.`
                                : "Locked"}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}
