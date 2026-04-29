import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { hasClerkPublishableKey, isClerkConfigured } from "@/lib/clerk-auth";

export default function SignInPage() {
  if (!hasClerkPublishableKey()) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-fern/40 to-stone-100 px-4 py-12 text-center text-ink">
        <h1 className="text-lg font-semibold text-bark">Clerk is not configured</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-stone-700">
          Add <code className="rounded bg-stone-200 px-1">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code className="rounded bg-stone-200 px-1">CLERK_SECRET_KEY</code> in Vercel for{" "}
          <strong>grove-growth-together</strong>, then redeploy.
        </p>
        <Link href="/" className="mt-6 text-sm font-semibold text-moss hover:underline">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-fern/40 to-stone-100 px-4 py-12 text-ink">
      {!isClerkConfigured() ? (
        <p className="max-w-sm text-center text-sm text-bark">
          Add <strong>CLERK_SECRET_KEY</strong> in Vercel — needed for session verification after sign-in.
        </p>
      ) : null}
      <SignIn
        routing="path"
        path="/sign-in"
        forceRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "rounded-md border border-stone-300 shadow-panel",
          },
        }}
      />
    </main>
  );
}
