import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { isClerkConfigured } from "@/lib/clerk-auth";
import { hasClerkPublishableKey } from "@/lib/clerk-publishable";

export default function SignUpPage() {
  if (!hasClerkPublishableKey()) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-moss/20 to-stone-100 px-4 py-12 text-center text-ink">
        <h1 className="text-lg font-semibold text-bark">Clerk is not configured</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-stone-700">
          Add <code className="rounded bg-stone-200 px-1">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code className="rounded bg-stone-200 px-1">CLERK_SECRET_KEY</code> in the Vercel project{" "}
          <strong>grove-growth-together</strong>, then redeploy. Add{" "}
          <code className="rounded bg-stone-200 px-1">grove-azure-three.vercel.app</code> (or your production
          domain) under Clerk → configure → Domains.
        </p>
        <Link href="/" className="mt-6 text-sm font-semibold text-moss hover:underline">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-moss/20 to-stone-100 px-4 py-12 text-ink">
      {!isClerkConfigured() ? (
        <p className="max-w-sm text-center text-sm text-bark">
          Add <strong>CLERK_SECRET_KEY</strong> in Vercel as well — without it, middleware and server routes cannot
          verify sessions after sign-up.
        </p>
      ) : null}
      <SignUp
        routing="path"
        path="/sign-up"
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
