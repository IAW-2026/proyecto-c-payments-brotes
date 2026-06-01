import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge, BadgeStatus } from "@/components/ui/StatusBadge";
import { getPaginationParams, PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";
import { formatAmount, formatDate } from "@/lib/format";
import { FilterBar } from "@/components/ui/FilterBar";
import {
  parseSort,
  parseOrder,
  parsePaymentStatus,
  parsePayoutStatus,
  parseSearch,
  parseDateRange,
  statusForPrisma,
} from "@/lib/filters";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const sp = await searchParams;

  // Filtros tabla pagos (prefijo p_)
  const pCurrentStatus = parsePaymentStatus(sp["p_status"]);
  const pCurrentSort = parseSort(sp["p_sort"]);
  const pCurrentOrder = parseOrder(sp["p_order"]);
  const pCurrentSearch = parseSearch(sp["p_search"]);
  const pCurrentDay = sp["p_day"] ?? "";
  const pCurrentMonth = sp["p_month"] ?? "";
  const pDateRange = parseDateRange(sp["p_day"], sp["p_month"]);

  // Filtros tabla acreditaciones (prefijo o_)
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
        { id: { contains: pCurrentSearch, mode: "insensitive" as const } },
      ],
    }),
    ...(pDateRange && { createdAt: pDateRange }),
  };

  const payoutWhere = {
    ...(statusForPrisma(oCurrentStatus) && {
      status: statusForPrisma(oCurrentStatus),
    }),
    ...(oCurrentSearch && {
      seller_email: { contains: oCurrentSearch, mode: "insensitive" as const },
    }),
    ...(oDateRange && { createdAt: oDateRange }),
  };

  // Stats globales — sin filtros
  const [paymentStats, paymentsByStatus, payoutStats, payoutsByStatus] =
    await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        _avg: { amount: true },
        _count: true,
      }),
      prisma.payment.groupBy({ by: ["status"], _count: true }),
      prisma.payout.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.payout.groupBy({ by: ["status"], _count: true }),
    ]);

  const statusCount = (
    groups: { status: string; _count: number }[],
    status: string,
  ) => groups.find((g) => g.status === status)?._count ?? 0;

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

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-10">
      <PageHeader title="Panel admin" subtitle="Vista general del sistema" />

      {/* Stats pagos */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-verde-profundo uppercase tracking-wide">
          Pagos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total de pagos" value={paymentStats._count} />
          <StatCard
            label="Monto total"
            value={formatAmount(paymentStats._sum.amount ?? 0)}
          />
          <StatCard
            label="Monto promedio"
            value={formatAmount(paymentStats._avg.amount ?? 0)}
          />
          <StatCard
            label="Por estado"
            value={`${statusCount(paymentsByStatus, "approved")} aprobados`}
            sub={`${statusCount(paymentsByStatus, "pending")} pendientes · ${statusCount(paymentsByStatus, "rejected")} rechazados`}
          />
        </div>
      </section>

      {/* Stats acreditaciones */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-verde-profundo uppercase tracking-wide">
          Acreditaciones
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="Total de acreditaciones"
            value={payoutStats._count}
          />
          <StatCard
            label="Monto total acreditado"
            value={formatAmount(payoutStats._sum.amount ?? 0)}
          />
          <StatCard
            label="Por estado"
            value={`${statusCount(payoutsByStatus, "paid")} acreditados`}
            sub={`${statusCount(payoutsByStatus, "pending")} pendientes`}
          />
        </div>
      </section>

      {/* Tabla pagos */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-verde-profundo uppercase tracking-wide">
          Todos los pagos
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
          searchPlaceholder="Buscar por descripción o ID..."
          currentSearch={pCurrentSearch ?? ""}
          currentDay={pCurrentDay}
          currentMonth={pCurrentMonth}
          paramPrefix="p_"
        />
        <Pagination
          page={pPage}
          totalPages={totalPaymentPages}
          basePath="/dashboard"
          pageParam="paymentsPage"
        />
        <div className="bg-white border border-beige rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-beige text-xs text-marron-tierra">
                <th className="text-left px-5 py-3 font-medium">ID</th>
                <th className="text-left px-5 py-3 font-medium">Descripción</th>
                <th className="text-left px-5 py-3 font-medium">Fecha</th>
                <th className="text-right px-5 py-3 font-medium">Monto</th>
                <th className="text-right px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, i) => (
                <tr
                  key={payment.id}
                  className={
                    i !== payments.length - 1 ? "border-b border-beige" : ""
                  }
                >
                  <td className="px-5 py-3 font-mono text-xs text-verde-hoja truncate max-w-30">
                    {payment.id}
                  </td>
                  <td className="px-5 py-3 text-verde-profundo truncate max-w-40">
                    {payment.description ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-marron-tierra">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-verde-profundo">
                    {formatAmount(payment.amount)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <StatusBadge status={payment.status as BadgeStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tabla acreditaciones */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-verde-profundo uppercase tracking-wide">
          Todas las acreditaciones
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
          searchPlaceholder="Buscar por email del seller..."
          currentSearch={oCurrentSearch ?? ""}
          currentDay={oCurrentDay}
          currentMonth={oCurrentMonth}
          paramPrefix="o_"
        />
        <Pagination
          page={oPage}
          totalPages={totalPayoutPages}
          basePath="/dashboard"
          pageParam="payoutsPage"
        />
        <div className="bg-white border border-beige rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-beige text-xs text-marron-tierra">
                <th className="text-left px-5 py-3 font-medium">ID</th>
                <th className="text-left px-5 py-3 font-medium">Seller</th>
                <th className="text-left px-5 py-3 font-medium">Fecha</th>
                <th className="text-right px-5 py-3 font-medium">Monto</th>
                <th className="text-right px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout, i) => (
                <tr
                  key={payout.id}
                  className={
                    i !== payouts.length - 1 ? "border-b border-beige" : ""
                  }
                >
                  <td className="px-5 py-3 font-mono text-xs text-verde-hoja truncate max-w-30">
                    {payout.id}
                  </td>
                  <td className="px-5 py-3 text-verde-profundo truncate max-w-40">
                    {payout.seller_email ?? payout.seller_id}
                  </td>
                  <td className="px-5 py-3 text-marron-tierra">
                    {formatDate(payout.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-verde-profundo">
                    {formatAmount(payout.amount)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <StatusBadge status={payout.status as BadgeStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
