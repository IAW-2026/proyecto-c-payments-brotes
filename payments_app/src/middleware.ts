import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
//protección de rutas con clerk
const isProtectedRoute = createRouteMatcher([
  "/(buyer)(.*)",
  "/(seller)(.*)",
  "/(admin)(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api")) {
    const authHeader = req.headers.get("autorization");
    const token = authHeader?.replace("Beares", "");

    if (!token || token !== process.env.SERVICE_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/", "/(api|trpc)(.*)"],
};
