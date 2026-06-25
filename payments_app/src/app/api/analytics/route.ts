import { NextRequest, NextResponse } from "next/server";
import { verifyServiceApiKey } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getBuyerName } from "@/services/buyerService";
import { getSellerName } from "@/services/sellerService";

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dec",
];

const STATUS_MAP: Record<string, string> = {
  pending: "pendiente",
  approved: "confirmado",
  rejected: "cancelado",
};

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const authError = verifyServiceApiKey(req);
  if (authError) return authError;

  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // ── Meses (últimos 8) ────────────────────────────────────────────────────
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
      payments,
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
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          order_id: true,
          amount: true,
          status: true,
          createdAt: true,
          buyer_email: true,
          seller_email: true,
          buyer_internal_id: true,
          seller_internal_id: true,
        },
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

    // ── Ingresos por mes ──────────────────────────────────────────────────────
    const incomesByMonth = new Map<string, number>();
    for (const p of monthlyPayments) {
      incomesByMonth.set(
        getMonthKey(p.createdAt),
        (incomesByMonth.get(getMonthKey(p.createdAt)) ?? 0) + p.amount,
      );
    }

    const ingresosUltimosMeses = months.map((m, index) => {
      const ingresos = Math.round(incomesByMonth.get(m.key) ?? 0);

      let meta = 0;
      if (index >= 3) {
        const prevIncomes = [index - 1, index - 2, index - 3].map((idx) =>
          incomesByMonth.get(months[idx].key) ?? 0,
        );
        meta = Math.round((prevIncomes.reduce((a, b) => a + b, 0) / 3) * 1.05);
      }

      return { mes: m.label, ingresos, meta };
    });

    // ── Últimas transacciones con nombres ────────────────────────────────────
    const ultimasTransacciones = await Promise.all(
      payments.map(async (p) => {
        const estado = STATUS_MAP[p.status] ?? p.status;
        const fecha = p.createdAt.toISOString().split("T")[0];

        let compradorNombre = p.buyer_email ?? "Comprador";
        let vendedorNombre = p.seller_email ?? "Vendedor";

        const nombrePromises: Promise<void>[] = [];

        if (p.buyer_internal_id) {
          nombrePromises.push(
            (async () => {
              try {
                const name = await getBuyerName(p.buyer_internal_id!);
                if (name) compradorNombre = name;
              } catch {
                /* ignorar */
              }
            })(),
          );
        }

        if (p.seller_internal_id) {
          nombrePromises.push(
            (async () => {
              try {
                const name = await getSellerName(p.seller_internal_id!);
                if (name) vendedorNombre = name;
              } catch {
                /* ignorar */
              }
            })(),
          );
        }

        await Promise.all(nombrePromises);

        // Formatear email como nombre si no se obtuvo nombre real
        if (!p.buyer_internal_id && compradorNombre.includes("@")) {
          compradorNombre = compradorNombre.split("@")[0]
            .split(".")
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" ");
        }
        if (!p.seller_internal_id && vendedorNombre.includes("@")) {
          vendedorNombre = vendedorNombre.split("@")[0]
            .split(".")
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" ");
        }

        return {
          id: p.order_id ?? p.id,
          compradorNombre,
          vendedorNombre,
          monto: p.amount,
          estado,
          fecha,
          metodoPago: "MercadoPago",
        };
      }),
    );

    return NextResponse.json({
      ingresosConfirmados,
      ingresosUltimosMeses,
      ticketPromedio,
      tasaCancelacion,
      ingresosPendientes,
      metodosPago: [{ metodo: "MercadoPago", porcentaje: 100 }],
      ultimasTransacciones,
    });
  } catch (error) {
    console.error("[GET /api/analytics]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
