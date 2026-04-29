import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isClerkConfigured } from "@/lib/clerk-auth";

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
