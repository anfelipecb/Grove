"use client";

import { UserButton } from "@clerk/nextjs";
import type { ComponentProps } from "react";
import { NavLinks } from "@/components/nav-links";

type UserButtonAppearance = NonNullable<ComponentProps<typeof UserButton>["appearance"]>;

type AppHeaderToolbarProps = {
  /** Override Clerk UserButton styling (e.g. onboarding larger avatar). */
  userButtonAppearance?: UserButtonAppearance;
  className?: string;
};

const defaultAppearance: UserButtonAppearance = {
  elements: {
    userButtonAvatarBox: "h-8 w-8 ring-2 ring-moss/20 ring-offset-1 ring-offset-white",
  },
};
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

/**
 * Keeps primary nav and account control on one row: scrollable links + fixed UserButton.
 * Avoids the avatar wrapping under the first nav pill on narrow widths.
 */
export function AppHeaderToolbar({ userButtonAppearance, className }: AppHeaderToolbarProps) {
  return (
    <div
      className={`flex min-h-[2.75rem] w-full min-w-0 max-w-full items-stretch rounded-xl border border-stone-200 bg-white shadow-sm ${className ?? ""}`}
      data-testid="app-header-toolbar"
    >
      <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex h-full items-center px-1.5 py-1">
          <NavLinks nowrap />
        </div>
      </div>
      <div
        className="flex shrink-0 items-center gap-1.5 border-l border-stone-200 bg-stone-50/70 px-2.5 py-1"
        data-testid="header-account"
      >
        <span className="hidden text-xs font-medium text-stone-600 sm:inline">Account</span>
        {clerkPublishableKey ? (
          <UserButton
            afterSignOutUrl="/"
            appearance={
              userButtonAppearance ?? defaultAppearance
            }
          />
        ) : (
          <span className="rounded-full border border-dashed border-stone-300 px-2 py-1 text-xs font-medium text-stone-500">
            Local mode
          </span>
        )}
      </div>
    </div>
  );
}
