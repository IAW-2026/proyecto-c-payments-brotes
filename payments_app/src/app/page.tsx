import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) redirect("/sign-in");
  console.log("sessionClaims(page.tsx):", sessionClaims);
  const rawRole = sessionClaims?.metadata;
  const role = Array.isArray(rawRole)
    ? rawRole[0]
    : (rawRole as string | undefined);

  if (role === "admin") redirect("/dashboard");
  if (role === "seller") redirect("/payouts");
  if (role === "buyer") redirect("/payments");

  // Logueado pero sin rol — mostrar página de espera en vez de loop
  redirect("/pending");
}
