/**
 * Client-safe Clerk publishable key resolution (process.env only).
 * Do not import `@/lib/clerk-auth` from client components — it pulls server-only Clerk APIs.
 */

const DEMO_LOCAL_CLERK_PUBLISHABLE_PLACEHOLDER = "pk_test_Z3JvdmUtbG9jYWwtZGVtby1jdWEtcmVzZXJ2ZWQ";

/** Effective publishable key: env first, then dev+demo fallback (layout / SignIn hydration only). */
export function getClerkPublishableKeyEffective(): string | undefined {
  const v = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (v && v.length > 0) return v;
  if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEMO_MODE?.trim() === "true") {
    return DEMO_LOCAL_CLERK_PUBLISHABLE_PLACEHOLDER;
  }
  return undefined;
}

export function hasClerkPublishableKey(): boolean {
  return Boolean(getClerkPublishableKeyEffective());
}
