"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SignOutButton } from "@/components/layout/SignOutButton";

export default function PendingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }

    const role = user.publicMetadata?.role as string | undefined;

    if (role === "admin") router.replace("/dashboard");
    else if (role === "seller") router.replace("/payouts");
    else if (role === "buyer") router.replace("/payments");
    // si no tiene rol, se queda en /pending y ve el mensaje
  }, [isLoaded, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-verde-suave">
      <div className="text-center space-y-4 p-8 bg-white rounded-2xl shadow-sm max-w-md">
        <h1 className="text-xl font-semibold text-verde-profundo">
          Sin acceso
        </h1>
        <p className="text-sm text-verde-bosque">
          Tu cuenta no tiene un rol asignado. Contactá al administrador para que
          te asigne uno.
        </p>
        <SignOutButton />
      </div>
    </div>
  );
}
