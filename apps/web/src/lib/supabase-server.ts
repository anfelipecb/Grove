import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isClerkConfigured } from "@/lib/clerk-auth";
import { DEMO_COOKIE_TRUST, isLocalDemoEligible } from "@/lib/demo-mode";

/**
 * Supabase client for Server Components / Route Handlers.
 * Uses Clerk session JWT with Supabase third-party auth (no custom JWT template).
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) {
    return null;
  }

  return createClient(url, publishableKey, {
    async accessToken() {
      if (!isClerkConfigured()) {
        return null;
      }
      try {
        const authState = await auth();
        return (await authState.getToken()) ?? null;
      } catch {
        return null;
      }
    },
  });
}

/**
 * Service-role client for trusted server operations (onboarding save, middleware profile reads).
 * Never import this in client code.
 */
export function createServiceSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

/**
 * When a trusted local-demo session cookie is active, prefer service-role so SSR works without Clerk JWT.
 * Never returns service-role outside NODE_ENV===development && NEXT_PUBLIC_DEMO_MODE=true.
 */
export async function createDemoAwareServerClient(): Promise<{
  client: SupabaseClient | null;
  demo: boolean;
}> {
  const demo =
    isLocalDemoEligible() && cookies().get(DEMO_COOKIE_TRUST)?.value === "1";

  if (demo) {
    const svc = createServiceSupabaseClient();
    return { client: svc, demo: true };
  }

  const userClient = await createServerSupabaseClient();
  return { client: userClient, demo: false };
}
