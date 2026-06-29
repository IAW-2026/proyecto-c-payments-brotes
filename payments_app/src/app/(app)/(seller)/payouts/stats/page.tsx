import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { formatAmount } from "@/lib/format";
import { PayoutStatsCharts } from "./charts";

export default async function PayoutStatsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const myPayouts = await prisma.payout.findMany({
    where: { seller_id: userId },
    select: { amount: true, status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const totalCount = myPayouts.length;
  const totalAmount = myPayouts.reduce((sum, p) => sum + p.amount, 0);

  const byStatus = new Map<string, number>();
  const volumeByDay = new Map<string, { total: number; count: number }>();
  for (const p of myPayouts) {
    byStatus.set(p.status, (byStatus.get(p.status) ?? 0) + 1);
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

  const statusDistribution = Array.from(byStatus.entries()).map(
    ([status, count]) => ({ status, count }),
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-10">
      <PageHeader
        title="Mis estadísticas"
        subtitle="Resumen de tus acreditaciones"
      />

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total acreditaciones" value={totalCount} />
        <StatCard label="Total cobrado" value={formatAmount(totalAmount)} />
        <StatCard
          label="Promedio por acreditación"
          value={
            totalCount > 0
              ? formatAmount(totalAmount / totalCount)
              : formatAmount(0)
          }
        />
        <StatCard
          label="Por estado"
          value={`${statusDistribution.find((s) => s.status === "paid")?.count ?? 0} acreditados`}
          sub={`${statusDistribution.find((s) => s.status === "pending")?.count ?? 0} pendientes`}
        />
      </section>

      <PayoutStatsCharts
        dailyVolume={dailyVolume}
        statusDistribution={statusDistribution}
      />
    </main>
  );
}
