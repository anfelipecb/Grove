"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, Network, Users } from "lucide-react";
import { twMerge } from "tailwind-merge";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/onboarding", label: "Onboarding", icon: ClipboardList },
  { href: "/mycelium", label: "Mycelium", icon: Network },
];

export function NavLinks({ nowrap = false }: { nowrap?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={`flex gap-2 ${nowrap ? "flex-nowrap" : "flex-wrap"}`} data-testid="app-nav-links">
      {links.map((link) => {
        const Icon = link.icon;
        const active =
          pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));

        return (
          <Link
            key={link.href}
            href={link.href}
            className={twMerge(
              "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition",
              active
                ? "border-moss/50 bg-moss/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-moss/40 hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
