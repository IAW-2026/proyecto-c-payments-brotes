import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
//protección de rutas con clerk
const isProtectedRoute = createRouteMatcher([
  "/(buyer)(.*)",
  "/(seller)(.*)",
  "/(admin)(.*)",
  "/api/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/", "/(api|trpc)(.*)"],
};
