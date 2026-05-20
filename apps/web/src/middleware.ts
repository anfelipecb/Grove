import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";
import {
  DEMO_CLERK_USER_ID,
  hasTrustedDemoCookie,
  isLocalDemoEligible,
} from "@/lib/demo-mode";
import { fetchProfileOnboardingStep } from "@/lib/profile-onboarding-step";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api(.*)",
  "/demo/start(.*)",
  "/demo/exit(.*)",
  "/dev/(.*)",
]);

const requiresOnboardingComplete = createRouteMatcher([
  "/dashboard(.*)",
  "/calendar(.*)",
  "/communities(.*)",
  "/mycelium(.*)",
  "/today(.*)",
  "/coach(.*)",
  "/community(.*)",
  "/profile(.*)",
]);

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const demoBypass =
    isLocalDemoEligible() && hasTrustedDemoCookie((name) => req.cookies.get(name)?.value ?? undefined);

  if (demoBypass) {
    const step = await fetchProfileOnboardingStep(DEMO_CLERK_USER_ID, async () => null);

    if (requiresOnboardingComplete(req)) {
      if (step === null || step < 5) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
    }

    return NextResponse.next();
  }

  let userId: string | null = null;
  let getToken: (() => Promise<string | null>) | null = null;
  try {
    const a = await auth();
    userId = a.userId ?? null;
    getToken = () => a.getToken();
  } catch {
    userId = null;
    getToken = null;
  }
  if (!userId || !getToken) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  const step = await fetchProfileOnboardingStep(userId, getToken);

  if (requiresOnboardingComplete(req)) {
    if (step === null || step < 5) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
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
