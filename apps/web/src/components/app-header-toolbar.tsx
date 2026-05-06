"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { twMerge } from "tailwind-merge";
import { useAppLayer } from "@/components/app-layer-context";
import { getClerkPublishableKeyEffective } from "@/lib/clerk-publishable";
import { NavLinks } from "@/components/nav-links";

type UserButtonAppearance = NonNullable<ComponentProps<typeof UserButton>["appearance"]>;

type AppHeaderToolbarProps = {
  /** Override Clerk UserButton styling (e.g. onboarding larger avatar). */
  userButtonAppearance?: UserButtonAppearance;
  className?: string;
  /** Local dev demo session — avoid Clerk UserButton when unauthenticated. */
  demoMode?: boolean;
};

const defaultAppearance: UserButtonAppearance = {
  elements: {
    userButtonAvatarBox:
      "h-8 w-8 ring-2 ring-moss/20 ring-offset-1 ring-offset-background dark:ring-moss/35",
  },
};

const clerkPublishableKey = getClerkPublishableKeyEffective();

function LayerSegment() {
  const { layer, goPersonal, goCommunity } = useAppLayer();

  const pill = (pressed: boolean) =>
    twMerge(
      "rounded-md px-2.5 py-1.5 text-xs font-semibold transition",
      pressed
        ? "bg-card text-foreground shadow-sm ring-1 ring-border"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5"
      role="group"
      aria-label="App context"
    >
      <button
        type="button"
        onClick={goPersonal}
        className={pill(layer === "personal")}
        aria-pressed={layer === "personal"}
      >
        Personal
      </button>
      <button
        type="button"
        onClick={goCommunity}
        className={pill(layer === "community")}
        aria-pressed={layer === "community"}
      >
        Community
      </button>
    </div>
  );
}

function ThemeSegment() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-8 w-[5.5rem] shrink-0 rounded-lg border border-border bg-muted/40" aria-hidden />;
  }

  const modes = [
    { id: "system" as const, label: "Match system", Icon: Monitor },
    { id: "light" as const, label: "Light", Icon: Sun },
    { id: "dark" as const, label: "Dark", Icon: Moon },
  ];

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5"
      role="group"
      aria-label="Color theme"
    >
      {modes.map(({ id, label, Icon }) => {
        const pressed = theme === id;
        return (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={pressed}
            onClick={() => setTheme(id)}
            className={twMerge(
              "rounded-md p-1.5 transition",
              pressed
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Primary nav, layer switch, theme switch, and account control: scrollable links + fixed controls.
 */
export function AppHeaderToolbar({ userButtonAppearance, className, demoMode }: AppHeaderToolbarProps) {
  return (
    <div
      className={twMerge(
        "flex w-full min-w-0 max-w-full flex-col gap-2 rounded-xl border border-border bg-card shadow-sm dark:shadow-panel-dark sm:flex-row sm:items-stretch sm:gap-0",
        className,
      )}
      data-testid="app-header-toolbar"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2 p-1.5 sm:p-2">
        <LayerSegment />
        <ThemeSegment />
      </div>
      <div className="min-h-[2.5rem] min-w-0 flex-1 overflow-x-auto overscroll-x-contain border-border sm:border-l [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex h-full items-center px-1.5 py-1 sm:px-2">
          <NavLinks nowrap />
        </div>
      </div>
      <div
        className="flex shrink-0 items-center gap-1.5 border-border bg-muted/50 px-2.5 py-1.5 sm:border-l"
        data-testid="header-account"
      >
        <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
          {demoMode ? "Demo" : "Account"}
        </span>
        {demoMode ? (
          <Link
            href="/demo/exit"
            className="rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Exit demo
          </Link>
        ) : clerkPublishableKey ? (
          <UserButton
            afterSignOutUrl="/"
            appearance={userButtonAppearance ?? defaultAppearance}
          />
        ) : (
          <span className="rounded-full border border-dashed border-border px-2 py-1 text-xs font-medium text-muted-foreground">
            Local mode
          </span>
        )}
      </div>
    </div>
  );
}
