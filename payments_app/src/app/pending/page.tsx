"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
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
    else router.replace("/sign-in");
  }, [isLoaded, user, router]);

  return null;
}
