"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Goal, Users, Sparkles, UserCircle, LogOut, Lock } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { twMerge } from "tailwind-merge";

const tabs = [
  { href: "/today", label: "Today", icon: CalendarCheck },
  { href: "/goals", label: "Goals", icon: Goal },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/community", label: "Community", icon: Users },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Extracted so useClerk() only runs when this component mounts (i.e. when
// ClerkProvider is present). V2Nav only renders this when
// NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set, so keyless CI/local builds are safe.
function ClerkSignOutButton() {
  const { signOut } = useClerk();
  return (
    <button
      onClick={() => void signOut({ redirectUrl: "/" })}
      className="ml-auto flex items-center gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Sign out"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign out
    </button>
  );
}

type V2NavProps = {
  communityLocked?: boolean;
};

export function V2Nav({ communityLocked = false }: V2NavProps) {
  const pathname = usePathname();
  const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <>
      {/* Desktop: top nav */}
      <header className="hidden h-12 items-center gap-0 border-b border-border bg-card px-4 md:flex">
        <span className="mr-6 text-sm font-bold text-moss">Grove</span>
        {tabs.map(({ href, label, icon: Icon }) => {
          const locked = href === "/community" && communityLocked;
          return (
            <Link
              key={href}
              href={href}
              className={twMerge(
                "relative flex h-full items-center gap-1.5 border-b-2 px-4 text-sm font-medium transition-colors",
                isActive(pathname, href)
                  ? "border-moss text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
                locked && "opacity-80",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
              {locked ? (
                <Lock className="h-3 w-3 text-muted-foreground" aria-label="Locked until Sprout" />
              ) : null}
            </Link>
          );
        })}
        {clerkConfigured && <ClerkSignOutButton />}
      </header>

      {/* Mobile: bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card md:hidden">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          const locked = href === "/community" && communityLocked;
          return (
            <Link
              key={href}
              href={href}
              className={twMerge(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                active ? "text-moss" : "text-muted-foreground",
                locked && "opacity-80",
              )}
            >
              <span className="relative">
                <Icon
                  className={twMerge("h-5 w-5 shrink-0", active ? "text-moss" : "text-muted-foreground")}
                  aria-hidden="true"
                />
                {locked ? (
                  <Lock
                    className="absolute -right-1 -top-1 h-2.5 w-2.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
