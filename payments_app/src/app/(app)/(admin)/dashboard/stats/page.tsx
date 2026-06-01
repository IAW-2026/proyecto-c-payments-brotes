import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { formatAmount } from "@/lib/format";
import { DashboardCharts } from "./charts";

export default async function DashboardStatsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

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

  const totalPayments = paymentStats._count;
  const approvedCount =
    paymentsByStatus.find((p) => p.status === "approved")?._count ?? 0;
  const approvalRate =
    totalPayments > 0 ? Math.round((approvedCount / totalPayments) * 100) : 0;

  const allPayments = await prisma.payment.findMany({
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const volumeByDay = new Map<string, { total: number; count: number }>();
  for (const p of allPayments) {
    const day = p.createdAt.toISOString().slice(0, 10);
    const prev = volumeByDay.get(day) ?? { total: 0, count: 0 };
    prev.total += p.amount;
    prev.count += 1;
    volumeByDay.set(day, prev);
  }
  const dailyVolume = Array.from(volumeByDay.entries()).map(([date, data]) => ({
    date,
    total: data.total,
    count: data.count,
  }));

  const topSellersRaw = await prisma.payout.groupBy({
    by: ["seller_id", "seller_email"],
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 5,
  });
  const topSellers = topSellersRaw.map((s) => ({
    seller_id: s.seller_id,
    seller_email: s.seller_email,
    total: s._sum.amount ?? 0,
  }));

  const statusCount = (
    groups: { status: string; _count: number }[],
    status: string,
  ) => groups.find((g) => g.status === status)?._count ?? 0;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-10">
      <PageHeader
        title="Panel admin"
        subtitle="Estadísticas globales del sistema"
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-verde-profundo uppercase tracking-wide">
          Pagos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total de pagos" value={totalPayments} />
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

      <DashboardCharts
        dailyVolume={dailyVolume}
        paymentsByStatus={paymentsByStatus.map((p) => ({
          status: p.status,
          count: p._count,
        }))}
        payoutsByStatus={payoutsByStatus.map((p) => ({
          status: p.status,
          count: p._count,
        }))}
        approvalRate={approvalRate}
        topSellers={topSellers}
      />
    </main>
  );
}
