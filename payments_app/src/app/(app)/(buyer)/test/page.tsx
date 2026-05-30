import { auth, clerkClient } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { TestForm } from "./TestForm";

export default async function TestPage() {
  const { userId } = await auth();

  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({ limit: 100 });
  const sellers = users
    .filter((u) =>
      (u.publicMetadata as { role?: string[] })?.role?.includes("seller"),
    )
    .map((u) => ({
      id: u.id,
      email: u.emailAddresses[0]?.emailAddress ?? "",
      name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.id,
    }));
  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <PageHeader
        title="Simulador de pago"
        subtitle="Solo para pruebas — no usar en producción"
      />
      <TestForm buyerId={userId!} sellers={sellers} />
    </main>
  );
}
