import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/(buyer)(.*)",
  "/(seller)(.*)",
  "/(admin)(.*)",
]);

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

const routeRoleMap: { matcher: (req: NextRequest) => boolean; role: string }[] =
  [
    { matcher: createRouteMatcher(["/(buyer)(.*)"]), role: "buyer" },
    { matcher: createRouteMatcher(["/(seller)(.*)"]), role: "seller" },
    { matcher: createRouteMatcher(["/(admin)(.*)"]), role: "admin" },
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

  if (isPublicRoute(req)) return NextResponse.next();

  if (isProtectedRoute(req)) {
    // 1. Verificar autenticación
    const { userId, sessionClaims } = await auth.protect();

    // 2. Leer rol desde publicMetadata
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;

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
