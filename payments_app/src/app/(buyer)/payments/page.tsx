import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { PaymentCard } from "@/components/ui/PaymentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { redirect } from "next/navigation";

export default async function BuyerPaymentsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  const payments = await prisma.payment.findMany({
    where: { buyer_id: userId! },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <PageHeader
        title="Mis pagos"
        subtitle={
          payments.length > 0
            ? `${payments.length} pago${payments.length !== 1 ? "s" : ""} registrado${payments.length !== 1 ? "s" : ""}`
            : undefined
        }
      />

      {payments.length === 0 ? (
        <EmptyState
          title="No tenés pagos registrados"
          description="Tus pagos aparecerán acá una vez que realices una compra."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((payment) => (
            <PaymentCard
              key={payment.id}
              paymentId={payment.id}
              orderId={payment.order_id}
              amount={{ value: payment.amount, currency: payment.currency }}
              status={payment.status as "pending" | "approved" | "rejected"}
              createdAt={payment.createdAt.toISOString()}
            />
          ))}
        </div>
      )}
    </main>
  );
}
