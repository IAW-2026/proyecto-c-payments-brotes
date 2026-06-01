import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { PaymentList } from "@/components/ui/PaymentsList";
import { redirect } from "next/navigation";
import { isPaymentStatus } from "@/lib/validator";
import { getPaginationParams, PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";
import { FilterBar } from "@/components/ui/FilterBar";
import {
  parseSort,
  parseOrder,
  parsePaymentStatus,
  statusForPrisma,
} from "@/lib/filters";

export default async function BuyerPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    sort?: string;
    order?: string;
  }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const sp = await searchParams;
  const pageParam = sp.page;
  const status = sp.status;
  const sort = sp.sort;
  const order = sp.order;

  const currentStatus = parsePaymentStatus(status);
  const currentSort = parseSort(sort);
  const currentOrder = parseOrder(order);

  const { page, skip, take } = getPaginationParams({ page: pageParam });

  const where = {
    buyer_id: userId,
    ...(statusForPrisma(currentStatus) && {
      status: statusForPrisma(currentStatus),
    }),
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { [currentSort]: currentOrder },
      skip,
      take,
    }),
    prisma.payment.count({ where }),
  ]);

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

      <div className="mb-4">
        <FilterBar
          statusOptions={[
            { value: "all", label: "Todos" },
            { value: "pending", label: "Pendiente" },
            { value: "approved", label: "Aprobado" },
            { value: "rejected", label: "Rechazado" },
          ]}
          currentStatus={currentStatus}
          currentSort={currentSort}
          currentOrder={currentOrder}
        />
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/payments" />
      <PaymentList payments={serialized} />
    </main>
  );
}
