import { auth } from "@clerk/nextjs/server";

/** Publishable key only — required for ClerkProvider and hosted &lt;SignIn&gt;/&lt;SignUp&gt; UI. */
export function hasClerkPublishableKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
}

/** Both keys — required for middleware session validation and server `auth()`. */
export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() && process.env.CLERK_SECRET_KEY?.trim(),
  );
}

/**
 * Safe `auth()` for Server Components. Avoids 500s when keys are missing or Clerk rejects the session.
 */
export async function getServerUserId(): Promise<string | null> {
  if (!isClerkConfigured()) {
    return null;
  }
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}
