import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { PaymentList } from "@/components/ui/PaymentsList";
import { redirect } from "next/navigation";
//import { PaymentStatus } from "@/components/ui/PaymentsList";
import { PaymentStatus } from "@/components/ui/StatusBadge";
import { getPaginationParams, PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";

export default async function BuyerPaymentsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  const { page: pageParam } = await searchParams;
  const { page, skip, take } = getPaginationParams({ page: pageParam });
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { buyer_id: userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.payment.count({ where: { buyer_id: userId } }),
  ]);

  function isPaymentStatus(value: string): value is PaymentStatus {
    return ["pending", "approved", "rejected"].includes(value);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
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
          total > 0
            ? `${total} pago${total !== 1 ? "s" : ""} registrado${total !== 1 ? "s" : ""}`
            : undefined
        }
      />
      <PaymentList payments={serialized} />
      <Pagination page={page} totalPages={totalPages} basePath="/payments" />
    </main>
  );
}
