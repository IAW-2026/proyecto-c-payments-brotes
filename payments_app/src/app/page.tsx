// app/page.tsx
import { redirect } from "next/navigation";
import { getUserRoles } from "@/lib/auth";

export default async function HomePage() {
  const roles = await getUserRoles();

  if (roles.includes("admin")) redirect("/dashboard");
  if (roles.includes("seller")) redirect("/payouts");
  if (roles.includes("buyer")) redirect("/payments");

  redirect("/sign-in");
}
