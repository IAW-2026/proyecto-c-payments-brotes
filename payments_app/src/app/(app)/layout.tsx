// app/(app)/layout.tsx
import { auth } from "@clerk/nextjs/server";
import { UserBar } from "@/components/layout/UserBar";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionClaims } = await auth();
  const userRole = sessionClaims?.metadata as string[] | undefined;
  const role = userRole?.[0];

  const buyerAppUrl = process.env.BUYER_APP_URL ?? "";
  const sellerAppUrl = process.env.SELLER_APP_URL ?? "";

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar role={role} buyerAppUrl={buyerAppUrl} sellerAppUrl={sellerAppUrl} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <UserBar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
