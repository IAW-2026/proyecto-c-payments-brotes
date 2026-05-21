"use client";
import { useClerk } from "@clerk/nextjs";

export function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
      className="text-sm text-verde-bosque hover:text-verde-profundo hover:bg-verde-brote px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
    >
      Cerrar sesión
    </button>
  );
}
