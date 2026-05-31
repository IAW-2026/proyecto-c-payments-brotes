import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
/*
const isProtectedRoute = createRouteMatcher([
  "/(buyer)(.*)",
  "/(seller)(.*)",
  "/(admin)(.*)",
]);
 */
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
/*
const routeRoleMap: { matcher: (req: NextRequest) => boolean; role: string }[] =
  [
    { matcher: createRouteMatcher(["/(buyer)(.*)"]), role: "buyer" },
    { matcher: createRouteMatcher(["/(seller)(.*)"]), role: "seller" },
    { matcher: createRouteMatcher(["/(admin)(.*)"]), role: "admin" },
    ]; */
const isProtectedRoute = createRouteMatcher([
  "/payments(.*)",
  "/payouts(.*)",
  "/dashboard(.*)",
  "/test(.*)",
]);

const routeRoleMap = [
  { matcher: createRouteMatcher(["/payments(.*)"]), role: "buyer" },
  { matcher: createRouteMatcher(["/payouts(.*)"]), role: "seller" },
  { matcher: createRouteMatcher(["/dashboard(.*)"]), role: "admin" },
  //solo para mostrar flujo:
  { matcher: createRouteMatcher(["/test(.*)"]), role: "buyer" },
];
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) {
    if (pathname.startsWith("/api/webhooks")) {
      return NextResponse.next();
    }
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || token !== process.env.SERVICE_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (isPublicRoute(req)) return NextResponse.next();
  if (isProtectedRoute(req)) {
    const { sessionClaims } = await auth.protect();
    const rawRole = sessionClaims?.metadata;
    const userRole = Array.isArray(rawRole)
      ? rawRole[0]
      : (rawRole as string | undefined);

    // Verificar que el rol coincide con la ruta
    const requiredRole = routeRoleMap.find(({ matcher }) => matcher(req))?.role;

    if (requiredRole && userRole !== requiredRole) {
      const pendingUrl = new URL("/pending", req.url);
      return NextResponse.redirect(pendingUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/(.*)",
  ],
};
