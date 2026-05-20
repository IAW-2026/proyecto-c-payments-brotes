import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/(buyer)(.*)",
  "/(seller)(.*)",
  "/(admin)(.*)",
]);

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || token !== process.env.SERVICE_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (isPublicRoute(req)) return NextResponse.next();

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/(.*)",
  ],
};
