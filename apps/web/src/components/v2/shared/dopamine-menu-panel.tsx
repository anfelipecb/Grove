"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import {
  DOPAMINE_APPETISERS,
} from "@/components/v2/today/dopamine-menu";

const SIDES = [
  "Doodle for 2 minutes",
  "Play one song you like",
  "Step outside for fresh air",
  "Send a quick voice note to someone you trust",
] as const;

const DESSERTS = [
  "You've earned: take a real break",
  "Tell someone what you did",
] as const;

type MenuItemProps = {
  label: string;
  disabled?: boolean;
  onDone: () => Promise<void>;
};

function MenuItem({ label, disabled, onDone }: MenuItemProps) {
  const [loading, setLoading] = useState(false);

  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          setLoading(true);
          void onDone().finally(() => setLoading(false));
        }}
        className="shrink-0 text-xs font-semibold text-moss transition hover:text-moss/80 disabled:pointer-events-none disabled:opacity-40"
      >
        {loading ? "…" : "I did this →"}
      </button>
    </li>
  );
}

async function logDopamineXp(xp: number, activity: string) {
  const res = await fetch("/api/v2/dopamine-reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ xp, activity }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Could not log XP.");
  }
}

type DopamineMenuPanelProps = {
  className?: string;
  /** When false, desserts stay locked (no main task completed). */
  mainDone?: boolean;
};

export function DopamineMenuPanel({ className, mainDone = false }: DopamineMenuPanelProps) {
  return (
    <div className={twMerge("space-y-3 rounded-2xl border border-border bg-background/70 p-3", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dopamine menu</p>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Appetisers</p>
        <ul className="space-y-1.5">
          {DOPAMINE_APPETISERS.map((item) => (
            <MenuItem key={item} label={item} onDone={async () => logDopamineXp(5, item)} />
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sides</p>
        <ul className="space-y-1.5">
          {SIDES.map((item) => (
            <MenuItem key={item} label={item} onDone={async () => logDopamineXp(5, item)} />
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Desserts</p>
        <ul className="space-y-1.5">
          {DESSERTS.map((item) => (
            <MenuItem
              key={item}
              label={item}
              disabled={!mainDone}
              onDone={async () => logDopamineXp(10, item)}
            />
          ))}
        </ul>
        {!mainDone ? (
          <p className="mt-1 text-[11px] text-muted-foreground">Complete a main task today to unlock desserts.</p>
        ) : null}
      </div>
    </div>
  );
}
