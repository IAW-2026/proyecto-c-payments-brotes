import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Rate limiting en memoria — solo para una instancia (desarrollo/staging)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests
const RATE_WINDOW = 60_000; // 1 minuto en ms

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

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
    // Rate limit por IP
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429 },
      );
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
