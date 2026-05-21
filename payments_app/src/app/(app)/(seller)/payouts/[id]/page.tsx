import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { PayoutList } from "@/components/ui/PayoutList";
import { redirect } from "next/navigation";
import { PayoutStatus } from "@/components/ui/StatusBadge";

export default async function SellerPayoutsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const payouts = await prisma.payout.findMany({
    where: { seller_id: userId },
    orderBy: { createdAt: "desc" },
  });

  function isPayoutStatus(value: string): value is PayoutStatus {
    return ["pending", "paid"].includes(value);
  }
  const serialized = payouts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    status: isPayoutStatus(p.status) ? p.status : "pending",
  }));

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <PageHeader
        title="Mis acreditaciones"
        subtitle={
          serialized.length > 0
            ? `${serialized.length} acreditación${serialized.length !== 1 ? "es" : ""} registrada${serialized.length !== 1 ? "s" : ""}`
            : undefined
        }
      />
      <PayoutList payouts={serialized} />
    </main>
  );
}
