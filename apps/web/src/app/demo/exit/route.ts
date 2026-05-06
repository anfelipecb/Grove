import { DEMO_COOKIE_CLIENT_HINT, DEMO_COOKIE_TRUST, isLocalDemoEligible } from "@/lib/demo-mode";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isLocalDemoEligible()) {
    return new NextResponse(null, { status: 404 });
  }
  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.set(DEMO_COOKIE_TRUST, "", { path: "/", maxAge: 0 });
  res.cookies.set(DEMO_COOKIE_CLIENT_HINT, "", { path: "/", maxAge: 0 });
  return res;
}
