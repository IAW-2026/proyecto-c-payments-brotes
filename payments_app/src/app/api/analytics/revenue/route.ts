import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(_req: NextRequest) {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // ── Calcular el rango de los últimos 8 meses ─────────────────────────────
    const months: { key: string; label: string }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      months.push({
        key: getMonthKey(d),
        label: MONTH_NAMES[d.getMonth()],
      });
    }

    const startDate = new Date(currentYear, currentMonth - 7, 1);

    // ── Consultas paralelas ──────────────────────────────────────────────────
    const [
      confirmedAgg,
      pendingAgg,
      avgAgg,
      totalCountAgg,
      rejectedCountAgg,
      monthlyPayments,
    ] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "approved" },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "pending" },
      }),
      prisma.payment.aggregate({
        _avg: { amount: true },
        where: { status: "approved" },
      }),
      prisma.payment.aggregate({
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        _count: { id: true },
        where: { status: "rejected" },
      }),
      prisma.payment.findMany({
        where: {
          status: "approved",
          createdAt: { gte: startDate },
        },
        select: { amount: true, createdAt: true },
      }),
    ]);

    const ingresosConfirmados = Math.round(confirmedAgg._sum.amount ?? 0);
    const ingresosPendientes = Math.round(pendingAgg._sum.amount ?? 0);
    const ticketPromedio = Math.round(avgAgg._avg.amount ?? 0);

    const totalCount = totalCountAgg._count.id;
    const rejectedCount = rejectedCountAgg._count.id;
    const tasaCancelacion =
      totalCount > 0
        ? Math.round((rejectedCount / totalCount) * 1000) / 10
        : 0;

    // ── Agrupar ingresos por mes ──────────────────────────────────────────────
    const incomesByMonth = new Map<string, number>();
    for (const p of monthlyPayments) {
      const key = getMonthKey(p.createdAt);
      incomesByMonth.set(key, (incomesByMonth.get(key) ?? 0) + p.amount);
    }

    // ── Construir array de ingresosUltimosMeses ──────────────────────────────
    const ingresosUltimosMeses = months.map((m, index) => {
      const ingresos = Math.round(incomesByMonth.get(m.key) ?? 0);

      let meta = 0;
      if (index >= 3) {
        const prevIncomes = [index - 1, index - 2, index - 3].map((idx) =>
          incomesByMonth.get(months[idx].key) ?? 0,
        );
        const avg = prevIncomes.reduce((a, b) => a + b, 0) / 3;
        meta = Math.round(avg * 1.05);
      }

      return { mes: m.label, ingresos, meta };
    });

    return NextResponse.json({
      ingresosConfirmados,
      ingresosUltimosMeses,
      ticketPromedio,
      tasaCancelacion,
      ingresosPendientes,
      metodosPago: [{ metodo: "MercadoPago", porcentaje: 100 }],
    });
  } catch (error) {
    console.error("[GET /api/analytics/revenue]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
