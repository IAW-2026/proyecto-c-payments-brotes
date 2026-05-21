import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BadgeStatus } from "@/components/ui/StatusBadge";

function formatAmount(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function AdminDashboardPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  /*  const role = sessionClaims?.publicMetadata?.role as string | undefined;
  if (role !== "admin") redirect("/sign-in");
*/
  // Pagos
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalPayments = payments.length;
  const totalAmountPayments = payments.reduce((acc, p) => acc + p.amount, 0);
  const avgAmount = totalPayments > 0 ? totalAmountPayments / totalPayments : 0;

  const paymentsByStatus = {
    pending: payments.filter((p) => p.status === "pending").length,
    approved: payments.filter((p) => p.status === "approved").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
  };

  // Acreditaciones
  const payouts = await prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalPayouts = payouts.length;
  const totalAmountPayouts = payouts.reduce((acc, p) => acc + p.amount, 0);

  const payoutsByStatus = {
    pending: payouts.filter((p) => p.status === "pending").length,
    paid: payouts.filter((p) => p.status === "paid").length,
  };

  // Últimos 5 pagos
  const recentPayments = payments.slice(0, 5);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-10">
      <PageHeader title="Panel admin" subtitle="Vista general del sistema" />

      {/* Pagos */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[#243B27] uppercase tracking-wide">
          Pagos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total de pagos" value={totalPayments} />
          <StatCard
            label="Monto total procesado"
            value={formatAmount(totalAmountPayments)}
          />
          <StatCard label="Monto promedio" value={formatAmount(avgAmount)} />
          <StatCard
            label="Por estado"
            value={`${paymentsByStatus.approved} aprobados`}
            sub={`${paymentsByStatus.pending} pendientes · ${paymentsByStatus.rejected} rechazados`}
          />
        </div>
      </section>

      {/* Acreditaciones */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[#243B27] uppercase tracking-wide">
          Acreditaciones
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Total de acreditaciones" value={totalPayouts} />
          <StatCard
            label="Monto total acreditado"
            value={formatAmount(totalAmountPayouts)}
          />
          <StatCard
            label="Por estado"
            value={`${payoutsByStatus.paid} acreditados`}
            sub={`${payoutsByStatus.pending} pendientes`}
          />
        </div>
      </section>

      {/* Últimos pagos */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[#243B27] uppercase tracking-wide">
          Últimos pagos
        </h2>
        <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E2D6] text-xs text-[#A67C52]">
                <th className="text-left px-5 py-3 font-medium">ID</th>
                <th className="text-left px-5 py-3 font-medium">Descripción</th>
                <th className="text-left px-5 py-3 font-medium">Fecha</th>
                <th className="text-right px-5 py-3 font-medium">Monto</th>
                <th className="text-right px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((payment, i) => (
                <tr
                  key={payment.id}
                  className={`${i !== recentPayments.length - 1 ? "border-b border-[#E8E2D6]" : ""}`}
                >
                  <td className="px-5 py-3 font-mono text-xs text-[#7BA05D] truncate max-w-[120px]">
                    {payment.id}
                  </td>
                  <td className="px-5 py-3 text-[#243B27] truncate max-w-[160px]">
                    {payment.description ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-[#A67C52]">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-[#243B27]">
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
    </main>
  );
}
