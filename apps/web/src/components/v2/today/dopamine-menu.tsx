"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { surfaceSecondary } from "@/components/v2/today/surface-classes";

/** Reused by focus-session break screens (GRO-053). */
export const DOPAMINE_APPETISERS = [
  "Drink a glass of water",
  "Take 3 deep breaths",
  "Stand and stretch for 30 seconds",
  "Look out a window for 1 minute",
  "Wash your face with cool water",
  "Roll your shoulders and unclench your jaw",
] as const;

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

type MainTask = {
  id: string;
  title: string;
  completed: boolean;
};

type DopamineMenuProps = {
  mainTask: MainTask | null;
  onCompleteMain: (taskId: string) => Promise<void>;
};

type MenuItemProps = {
  label: string;
  xp?: number;
  disabled?: boolean;
  onDone: () => Promise<void>;
};

function MenuItem({ label, xp, disabled, onDone }: MenuItemProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (disabled || loading) return;
    setLoading(true);
    try {
      await onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => void handleClick()}
        className="shrink-0 text-xs font-semibold text-moss transition hover:text-moss/80 disabled:pointer-events-none disabled:opacity-40"
      >
        {loading ? "…" : "I did this →"}
      </button>
      {xp != null ? <span className="sr-only">{xp} XP</span> : null}
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

export function DopamineMenu({ mainTask, onCompleteMain }: DopamineMenuProps) {
  const [open, setOpen] = useState(true);
  const [mainDoneSession, setMainDoneSession] = useState(mainTask?.completed ?? false);

  const mainDone = mainDoneSession || Boolean(mainTask?.completed);
  const mainLabel = mainTask
    ? `Your main: ${mainTask.title}`
    : "Your main: pick one small task from your list above";

  return (
    <section className={twMerge(surfaceSecondary, "mb-4 p-3")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dopamine menu</span>
        <ChevronDown
          className={twMerge("h-4 w-4 text-muted-foreground transition", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="mt-3 space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Appetisers</p>
            <ul className="space-y-2">
              {DOPAMINE_APPETISERS.map((item) => (
                <MenuItem
                  key={item}
                  label={item}
                  xp={5}
                  onDone={async () => logDopamineXp(5, item)}
                />
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Main</p>
            <ul className="space-y-2">
              <MenuItem
                label={mainLabel}
                disabled={!mainTask || mainDone}
                onDone={async () => {
                  if (!mainTask) return;
                  await onCompleteMain(mainTask.id);
                  setMainDoneSession(true);
                }}
              />
            </ul>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sides</p>
            <ul className="space-y-2">
              {SIDES.map((item) => (
                <MenuItem key={item} label={item} xp={5} onDone={async () => logDopamineXp(5, item)} />
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Desserts</p>
            <ul className="space-y-2">
              {DESSERTS.map((item) => (
                <MenuItem
                  key={item}
                  label={item}
                  xp={10}
                  disabled={!mainDone}
                  onDone={async () => logDopamineXp(10, item)}
                />
              ))}
            </ul>
            {!mainDone ? (
              <p className="mt-1 text-[11px] text-muted-foreground">Finish your main first to unlock desserts.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
