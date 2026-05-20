import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) redirect("/sign-in");

  const metadata = sessionClaims?.publicMetadata as
    | { role?: string }
    | undefined;
  const role = metadata?.role;

  if (role === "admin") redirect("/dashboard");
  if (role === "seller") redirect("/payouts");
  if (role === "buyer") redirect("/payments");

  // Logueado pero sin rol — mostrar página de espera en vez de loop
  redirect("/pending");
}
