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
  parseSearch,
  parseDateRange,
  statusForPrisma,
} from "@/lib/filters";

export default async function SellerPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const sp = await searchParams;

  const currentStatus = parsePayoutStatus(sp.status);
  const currentSort = parseSort(sp.sort);
  const currentOrder = parseOrder(sp.order);
  const currentSearch = parseSearch(sp.search);
  const currentDay = sp.day ?? "";
  const currentMonth = sp.month ?? "";
  const dateRange = parseDateRange(sp.day, sp.month);

  const { page, skip, take } = getPaginationParams({ page: sp.page });

  const where = {
    seller_id: userId,
    ...(statusForPrisma(currentStatus) && {
      status: statusForPrisma(currentStatus),
    }),
    ...(currentSearch && {
      OR: [
        { payment_id: { contains: currentSearch, mode: "insensitive" as const } },
        { buyer_email: { contains: currentSearch, mode: "insensitive" as const } },
      ],
    }),
    ...(dateRange && { createdAt: dateRange }),
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
    buyer_email: p.buyer_email,
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
          searchPlaceholder="Buscar por ID de pago o email del comprador..."
          currentSearch={currentSearch ?? ""}
          currentDay={currentDay}
          currentMonth={currentMonth}
        />
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/payouts" />
      <PayoutList payouts={serialized} />
    </main>
  );
}
