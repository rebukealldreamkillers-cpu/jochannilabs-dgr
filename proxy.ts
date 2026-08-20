import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isPortalRoute = createRouteMatcher(["/portal(.*)"]);
const isPublicRoute = createRouteMatcher(["/", "/inquiry", "/sign-in(.*)", "/sign-up(.*)", "/sign-out", "/api/inquiry", "/sign/(.*)", "/api/sign/(.*)", "/checkpoint/(.*)", "/api/checkpoint/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId, sessionClaims } = await auth();
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (isPortalRoute(req) && role !== "sponsor" && role !== "analyst") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
