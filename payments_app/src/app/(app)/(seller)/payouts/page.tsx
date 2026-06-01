import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { PayoutList } from "@/components/ui/PayoutList";
import { redirect } from "next/navigation";
import { getPaginationParams, PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";
import { isPayoutStatus } from "@/lib/validator";
import { FilterBar } from "@/components/ui/FilterBar";
import {
  parseSort,
  parseOrder,
  parsePayoutStatus,
  statusForPrisma,
} from "@/lib/filters";

export default async function SellerPayoutsPage({
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

  const { page: pageParam, status, sort, order } = await searchParams;

  const currentStatus = parsePayoutStatus(status);
  const currentSort = parseSort(sort);
  const currentOrder = parseOrder(order);

  const { page, skip, take } = getPaginationParams({ page: pageParam });

  const where = {
    seller_id: userId,
    ...(statusForPrisma(currentStatus) && {
      status: statusForPrisma(currentStatus),
    }),
  };

  const [payouts, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      orderBy: { [currentSort]: currentOrder },
      skip,
      take,
    }),
    prisma.payout.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
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
          total > 0
            ? `${total} acreditación${total !== 1 ? "es" : ""} registrada${total !== 1 ? "s" : ""}`
            : undefined
        }
      />

      <div className="mb-4">
        <FilterBar
          statusOptions={[
            { value: "all", label: "Todas" },
            { value: "pending", label: "Pendiente" },
            { value: "paid", label: "Acreditada" },
          ]}
          currentStatus={currentStatus}
          currentSort={currentSort}
          currentOrder={currentOrder}
        />
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/payouts" />
      <PayoutList payouts={serialized} />
    </main>
  );
}
