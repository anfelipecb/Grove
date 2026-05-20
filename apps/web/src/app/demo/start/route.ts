import {
  DEMO_COOKIE_CLIENT_HINT,
  DEMO_COOKIE_TRUST,
  isLocalDemoEligible,
  parseDemoScenario,
} from "@/lib/demo-mode";
import { seedDemoScenario } from "@/lib/demo-seed";
import { type NextRequest, NextResponse } from "next/server";

const cookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
};

function applyDemoCookies(res: NextResponse) {
  res.cookies.set(DEMO_COOKIE_TRUST, "1", { ...cookieOptions, httpOnly: true });
  res.cookies.set(DEMO_COOKIE_CLIENT_HINT, "1", { ...cookieOptions, httpOnly: false });
}

export async function GET(request: NextRequest) {
  if (!isLocalDemoEligible()) {
    return new NextResponse(null, { status: 404 });
  }

  const scenario = parseDemoScenario(request.nextUrl.searchParams.get("scenario"));
  const seeded = await seedDemoScenario(scenario);
  if (!seeded.ok) {
    const home = new URL("/", request.url);
    home.searchParams.set("demo_error", seeded.error);
    return NextResponse.redirect(home);
  }

  const target =
    scenario === "dashboard"
      ? new URL("/today", request.url)
      : new URL("/onboarding", request.url);

  const res = NextResponse.redirect(target);
  applyDemoCookies(res);
  return res;
}
