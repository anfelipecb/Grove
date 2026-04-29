import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api(.*)",
]);

const requiresOnboardingComplete = createRouteMatcher([
  "/dashboard(.*)",
  "/communities(.*)",
  "/mycelium(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

async function getOnboardingStep(clerkUserId: string): Promise<number | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  const supabase = createClient(url, key);
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_step")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (!data) return null;
  return data.onboarding_step as number;
}

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  let userId: string | null = null;
  try {
    const a = await auth();
    userId = a.userId ?? null;
  } catch {
    userId = null;
  }
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  const step = await getOnboardingStep(userId);

  if (requiresOnboardingComplete(req)) {
    if (step === null || step < 5) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  if (isOnboardingRoute(req)) {
    if (step !== null && step >= 5) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!clerkEnabled) {
    return NextResponse.next();
  }
  return protectedMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
