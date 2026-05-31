import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Sidebar() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

  return (
    <aside className="w-64 h-full bg-verde-profundo text-verde-brote flex flex-col shrink-0">
      <div className="p-5 font-bold text-base border-b border-verde-bosque text-white">
        Payments App
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {role === "buyer" && (
          <Link
            href="/payments"
            className="block px-3 py-2 rounded-lg text-sm text-verde-brote hover:bg-verde-bosque hover:text-white transition-colors"
          >
            Mis pagos
          </Link>
        )}
        {role === "seller" && (
          <Link
            href="/payouts"
            className="block px-3 py-2 rounded-lg text-sm text-verde-brote hover:bg-verde-bosque hover:text-white transition-colors"
          >
            Mis acreditaciones
          </Link>
        )}
        {role === "admin" && (
          <Link
            href="/dashboard"
            className="block px-3 py-2 rounded-lg text-sm text-verde-brote hover:bg-verde-bosque hover:text-white transition-colors"
          >
            Panel admin
          </Link>
        )}
      </nav>
    </aside>
  );
}
