import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { PaymentList } from "@/components/ui/PaymentsList";
import { redirect } from "next/navigation";
//import { PaymentStatus } from "@/components/ui/PaymentsList";
import { PaymentStatus } from "@/components/ui/StatusBadge";
//import { BadgeStatus } from "@/components/ui/StatusBadge";

export default async function BuyerPaymentsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  const payments = await prisma.payment.findMany({
    where: { buyer_id: userId! },
    orderBy: { createdAt: "desc" },
  });

  function isPaymentStatus(value: string): value is PaymentStatus {
    return ["pending", "approved", "rejected"].includes(value);
  }

  const serialized = payments.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    status: isPaymentStatus(p.status) ? p.status : "pending",
  }));
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <PageHeader
        title="Mis pagos"
        subtitle={
          serialized.length > 0
            ? `${serialized.length} pago${serialized.length !== 1 ? "s" : ""} registrado${serialized.length !== 1 ? "s" : ""}`
            : undefined
        }
      />
      <PaymentList payments={serialized} />
    </main>
  );
}
