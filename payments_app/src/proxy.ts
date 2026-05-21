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
]);

const routeRoleMap = [
  { matcher: createRouteMatcher(["/payments(.*)"]), role: "buyer" },
  { matcher: createRouteMatcher(["/payouts(.*)"]), role: "seller" },
  { matcher: createRouteMatcher(["/dashboard(.*)"]), role: "admin" },
];
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
    // 1. Verificar autenticación
    const { userId, sessionClaims } = await auth.protect();
    /*    console.log(
      "sessionClaims completo:",
      JSON.stringify(sessionClaims, null, 2),
    ); */
    // 2. Leer rol desde publicMetadata
    const userRole = (sessionClaims?.publicMetadata as { role?: string })?.role;

    // 3. Verificar que el rol coincide con la ruta
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
