// src/lib/auth.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type Role = "buyer" | "seller" | "admin";

// Devuelve los roles del usuario (siempre como array)
export async function getUserRoles(): Promise<Role[]> {
  const user = await currentUser();
  if (!user) return [];

  const raw = user.publicMetadata?.role;

  // Soporta tanto string único como array
  if (Array.isArray(raw)) return raw as Role[];
  if (typeof raw === "string") return [raw as Role];
  return [];
}

// Devuelve true si el usuario tiene al menos uno de los roles pedidos
export async function hasRole(...roles: Role[]): Promise<boolean> {
  const userRoles = await getUserRoles();
  return roles.some((r) => userRoles.includes(r));
}

// Lanza redirect si no tiene el rol — usar en Server Components y Route Handlers
export async function requireRole(...roles: Role[]) {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const allowed = await hasRole(...roles);
  if (!allowed) redirect("/unauthorized");

  const user = await currentUser();
  return user!;
}
