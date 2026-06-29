import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "./SignOutButton";

export async function UserBar() {
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
    <div className="flex items-center justify-between py-3 px-4 bg-verde-suave border-b border-verde-brote">
      <div className="flex items-center gap-3">
        <div
          role="img"
          aria-label={`Avatar de ${displayName}`}
          className="w-8 h-8 rounded-full bg-verde-brote flex items-center justify-center text-verde-profundo font-semibold text-sm"
        >
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
      <SignOutButton />
    </div>
  );
}
