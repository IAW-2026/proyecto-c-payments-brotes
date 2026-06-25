import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { AdminPaymentList } from "./AdminPaymentList";
import { AdminPayoutList } from "./AdminPayoutList";
import { getPaginationParams, PAGE_SIZE } from "@/lib/pagination";
import { isPaymentStatus, isPayoutStatus } from "@/lib/validator";
import {
  parseSort,
  parseOrder,
  parsePaymentStatus,
  parsePayoutStatus,
  parseSearch,
  parseDateRange,
  statusForPrisma,
} from "@/lib/filters";

export default async function DashboardSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const sp = await searchParams;

  const pCurrentStatus = parsePaymentStatus(sp["p_status"]);
  const pCurrentSort = parseSort(sp["p_sort"]);
  const pCurrentOrder = parseOrder(sp["p_order"]);
  const pCurrentSearch = parseSearch(sp["p_search"]);
  const pCurrentDay = sp["p_day"] ?? "";
  const pCurrentMonth = sp["p_month"] ?? "";
  const pDateRange = parseDateRange(sp["p_day"], sp["p_month"]);

  const oCurrentStatus = parsePayoutStatus(sp["o_status"]);
  const oCurrentSort = parseSort(sp["o_sort"]);
  const oCurrentOrder = parseOrder(sp["o_order"]);
  const oCurrentSearch = parseSearch(sp["o_search"]);
  const oCurrentDay = sp["o_day"] ?? "";
  const oCurrentMonth = sp["o_month"] ?? "";
  const oDateRange = parseDateRange(sp["o_day"], sp["o_month"]);

  const {
    page: pPage,
    skip: pSkip,
    take: pTake,
  } = getPaginationParams({ page: sp.paymentspage });

  const {
    page: oPage,
    skip: oSkip,
    take: oTake,
  } = getPaginationParams({ page: sp.payoutspage });

  const paymentWhere = {
    ...(statusForPrisma(pCurrentStatus) && {
      status: statusForPrisma(pCurrentStatus),
    }),
    ...(pCurrentSearch && {
      OR: [
        {
          description: {
            contains: pCurrentSearch,
            mode: "insensitive" as const,
          },
        },
        ...(isNaN(Number(pCurrentSearch))
          ? []
          : [{ id: { equals: Number(pCurrentSearch) } }]),
        {
          buyer_email: {
            contains: pCurrentSearch,
            mode: "insensitive" as const,
          },
        },
      ],
    }),
    ...(pDateRange && { createdAt: pDateRange }),
  };

  const payoutWhere = {
    ...(statusForPrisma(oCurrentStatus) && {
      status: statusForPrisma(oCurrentStatus),
    }),
    ...(oCurrentSearch && {
      OR: [
        {
          seller_email: {
            contains: oCurrentSearch,
            mode: "insensitive" as const,
          },
        },
        {
          buyer_email: {
            contains: oCurrentSearch,
            mode: "insensitive" as const,
          },
        },
      ],
    }),
    ...(oDateRange && { createdAt: oDateRange }),
  };

  const [payments, paymentTotal, payouts, payoutTotal] = await Promise.all([
    prisma.payment.findMany({
      where: paymentWhere,
      orderBy: { [pCurrentSort]: pCurrentOrder },
      skip: pSkip,
      take: pTake,
    }),
    prisma.payment.count({ where: paymentWhere }),
    prisma.payout.findMany({
      where: payoutWhere,
      orderBy: { [oCurrentSort]: oCurrentOrder },
      skip: oSkip,
      take: oTake,
    }),
    prisma.payout.count({ where: payoutWhere }),
  ]);

  const totalPaymentPages = Math.ceil(paymentTotal / PAGE_SIZE);
  const totalPayoutPages = Math.ceil(payoutTotal / PAGE_SIZE);

  const serializedPayments = payments.map((p) => ({
    id: p.id,
    order_id: p.order_id,
    description: p.description,
    amount: p.amount,
    currency: p.currency,
    status: isPaymentStatus(p.status) ? p.status : ("pending" as const),
    createdAt: p.createdAt.toISOString(),
    buyer_email: p.buyer_email,
    seller_email: p.seller_email,
  }));

  const serializedPayouts = payouts.map((p) => ({
    id: p.id,
    payment_id: p.payment_id,
    amount: p.amount,
    currency: p.currency,
    status: isPayoutStatus(p.status) ? p.status : ("pending" as const),
    createdAt: p.createdAt.toISOString(),
    buyer_email: p.buyer_email,
    seller_email: p.seller_email,
  }));

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-10">
      <PageHeader
        title="Búsqueda avanzada"
        subtitle="Buscar pagos y acreditaciones"
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-verde-profundo uppercase tracking-wide">
          Pagos
        </h2>
        <FilterBar
          statusOptions={[
            { value: "all", label: "Todos" },
            { value: "pending", label: "Pendiente" },
            { value: "approved", label: "Aprobado" },
            { value: "rejected", label: "Rechazado" },
          ]}
          currentStatus={pCurrentStatus}
          currentSort={pCurrentSort}
          currentOrder={pCurrentOrder}
          searchPlaceholder="Buscar por descripción, ID o email del comprador..."
          currentSearch={pCurrentSearch ?? ""}
          currentDay={pCurrentDay}
          currentMonth={pCurrentMonth}
          paramPrefix="p_"
        />
        <Pagination
          page={pPage}
          totalPages={totalPaymentPages}
          basePath="/dashboard/search"
          pageParam="paymentspage"
        />
        <AdminPaymentList payments={serializedPayments} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-verde-profundo uppercase tracking-wide">
          Acreditaciones
        </h2>
        <FilterBar
          statusOptions={[
            { value: "all", label: "Todas" },
            { value: "pending", label: "Pendiente" },
            { value: "paid", label: "Acreditada" },
          ]}
          currentStatus={oCurrentStatus}
          currentSort={oCurrentSort}
          currentOrder={oCurrentOrder}
          searchPlaceholder="Buscar por email del vendedor o comprador..."
          currentSearch={oCurrentSearch ?? ""}
          currentDay={oCurrentDay}
          currentMonth={oCurrentMonth}
          paramPrefix="o_"
        />
        <Pagination
          page={oPage}
          totalPages={totalPayoutPages}
          basePath="/dashboard/search"
          pageParam="payoutspage"
        />
        <AdminPayoutList payouts={serializedPayouts} />
      </section>
    </main>
  );
}
