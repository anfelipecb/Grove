/**
 * Local-only demo auth (GRO-007).
 * NEVER enable demo auth unless NODE_ENV===development AND NEXT_PUBLIC_DEMO_MODE==='true' AND trusted cookie.
 */

export const DEMO_CLERK_USER_ID = "user_demo_grove_local";

/** Trusted session flag (httpOnly — server-validated only). */
export const DEMO_COOKIE_TRUST = "grove_demo";

/** Client-readable marker (skip Clerk-only redirects — server still verifies trust cookie). */
export const DEMO_COOKIE_CLIENT_HINT = "grove_demo_client";

export type DemoScenario = "onboarding" | "dashboard";

export function demoModeGloballyRequested(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE?.trim() === "true";
}

/** Server + middleware: demo features allowed only in local dev builds. */
export function isLocalDemoEligible(): boolean {
  return process.env.NODE_ENV === "development" && demoModeGloballyRequested();
}

/** Request cookies carry trusted demo marker (middleware / ApiRequest). */
export function hasTrustedDemoCookie(getCookie: (name: string) => string | undefined): boolean {
  return getCookie(DEMO_COOKIE_TRUST) === "1";
}

export function parseDemoScenario(raw: string | null): DemoScenario {
  return raw === "dashboard" ? "dashboard" : "onboarding";
}

/** Landing/sign-in hints: env-only (trusted cookies still required for SSR demo). */
export function shouldShowDemoPublicEntry(): boolean {
  return isLocalDemoEligible();
}
