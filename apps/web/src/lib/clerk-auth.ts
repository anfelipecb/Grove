import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import {
  DEMO_CLERK_USER_ID,
  DEMO_COOKIE_TRUST,
  isLocalDemoEligible,
} from "@/lib/demo-mode";

/** Both keys — required for middleware session validation and server `auth()`. */
export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() && process.env.CLERK_SECRET_KEY?.trim(),
  );
}

function serverTrustedDemoCookie(): boolean {
  if (!isLocalDemoEligible()) return false;
  const jar = cookies();
  return jar.get(DEMO_COOKIE_TRUST)?.value === "1";
}

/** True when SSR should treat requests as demo (dev + flag + trusted cookie). */
export function demoSessionActiveServer(): boolean {
  return serverTrustedDemoCookie();
}

/**
 * Safe `auth()` for Server Components. Avoids 500s when keys are missing or Clerk rejects the session.
 * After Clerk, resolves a synthetic demo user id when demo session cookie is trusted (local dev only).
 */
export async function getServerUserId(): Promise<string | null> {
  if (isClerkConfigured()) {
    try {
      const { userId } = await auth();
      if (userId) return userId;
    } catch {
      /* fall through — demo cookie may apply */
    }
  }

  if (serverTrustedDemoCookie()) {
    return DEMO_CLERK_USER_ID;
  }

  if (!isClerkConfigured()) {
    return null;
  }

  return null;
}
