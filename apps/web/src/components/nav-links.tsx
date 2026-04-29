import Link from "next/link";
import { ClipboardList, LayoutDashboard, Network, Users } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/onboarding", label: "Onboarding", icon: ClipboardList },
  { href: "/mycelium", label: "Mycelium", icon: Network },
];

export function NavLinks({ nowrap = false }: { nowrap?: boolean }) {
  return (
    <nav className={`flex gap-2 ${nowrap ? "flex-nowrap" : "flex-wrap"}`} data-testid="app-nav-links">
      {links.map((link) => {
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-bark transition hover:border-moss hover:text-moss"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
