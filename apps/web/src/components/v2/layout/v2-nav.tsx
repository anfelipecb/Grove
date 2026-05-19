"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Users, Sparkles, UserCircle, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { twMerge } from "tailwind-merge";

const tabs = [
  { href: "/today", label: "Today", icon: CalendarCheck },
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

export function V2Nav() {
  const pathname = usePathname();
  const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <>
      {/* Desktop: top nav */}
      <header className="hidden h-12 items-center gap-0 border-b border-border bg-card px-4 md:flex">
        <span className="mr-6 text-sm font-bold text-moss">Grove</span>
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={twMerge(
              "flex h-full items-center gap-1.5 border-b-2 px-4 text-sm font-medium transition-colors",
              isActive(pathname, href)
                ? "border-moss text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </Link>
        ))}
        {clerkConfigured && <ClerkSignOutButton />}
      </header>

      {/* Mobile: bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card md:hidden">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={twMerge(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
                active ? "text-moss" : "text-muted-foreground",
              )}
            >
              <Icon
                className={twMerge("h-5 w-5 shrink-0", active ? "text-moss" : "text-muted-foreground")}
                aria-hidden="true"
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
