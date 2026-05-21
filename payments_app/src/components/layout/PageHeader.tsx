// src/components/layout/PageHeader.tsx
import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export async function PageHeader({ title, subtitle }: PageHeaderProps) {
  const user = await currentUser();
  const role = (user?.publicMetadata as { role?: string })?.role;
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : (user?.emailAddresses?.[0]?.emailAddress ?? "Usuario");

  const roleLabel: Record<string, string> = {
    buyer: "Comprador",
    seller: "Vendedor",
    admin: "Administrador",
  };

  return (
    <div className="mb-8">
      {/* Barra de usuario */}
      <div className="flex items-center justify-between py-3 px-4 mb-6 bg-verde-suave border border-verde-brote rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-verde-brote flex items-center justify-center text-verde-profundo font-semibold text-sm">
            {displayName[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-verde-profundo">
              {displayName}
            </p>
            {role && (
              <p className="text-xs text-verde-bosque">
                {roleLabel[role] ?? role}
              </p>
            )}
          </div>
        </div>
        <SignOutButton>
          <button className="text-sm text-verde-bosque hover:text-verde-profundo hover:bg-verde-brote px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
            Cerrar sesión
          </button>
        </SignOutButton>
      </div>

      {/* Título de página */}
      <h1 className="text-2xl font-semibold text-verde-profundo tracking-tight">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-verde-bosque">{subtitle}</p>}
    </div>
  );
}
