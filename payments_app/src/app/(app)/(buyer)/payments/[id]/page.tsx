import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { BadgeStatus, StatusBadge } from "@/components/ui/StatusBadge";
import { PaymentStatusWatcher } from "@/components/ui/PaymentStatusWatcher";
import { formatAmount, formatDateLong } from "@/lib/format";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
  });

  // No existe o no pertenece al buyer autenticado
  if (!payment || payment.buyer_id !== userId) notFound();

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-marron-tierra mb-8">
        <Link
          href="/payments"
          className="hover:text-verde-profundo transition-colors"
        >
          Mis pagos
        </Link>
        <span className="text-gris-piedra">/</span>
        <span className="text-verde-profundo font-mono truncate">{payment.id}</span>
      </nav>

      {/* Card de detalle */}
      <div className="bg-white border border-beige rounded-xl px-6 py-6 flex flex-col gap-5">
        {/* Header: monto + estado */}
        <div className="flex items-start justify-between gap-4">
          <span className="text-3xl font-bold text-verde-profundo">
            {formatAmount(payment.amount, payment.currency)}
          </span>
          <StatusBadge status={payment.status as BadgeStatus} />
        </div>

        <hr className="border-beige" />

        {/* Datos */}
        <dl className="flex flex-col gap-4">
          {payment.description && (
            <div>
              <dt className="text-xs text-marron-tierra mb-1">Descripción</dt>
              <dd className="text-sm text-verde-profundo">{payment.description}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-marron-tierra mb-1">ID de pago</dt>
            <dd className="text-sm text-verde-hoja font-mono break-all">{payment.id}</dd>
          </div>
          <div>
            <dt className="text-xs text-marron-tierra mb-1">ID de orden</dt>
            <dd className="text-sm text-verde-hoja font-mono break-all">
              {payment.order_id}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-marron-tierra mb-1">Fecha</dt>
            <dd className="text-sm text-verde-profundo">
              {formatDateLong(payment.createdAt)}
            </dd>
          </div>
        </dl>

        {payment.status === "pending" && payment.mp_init_point && (
          <div className="flex flex-col gap-4">
            <hr className="border-beige" />
            <a
              href={payment.mp_init_point}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-2.5 px-4 bg-verde-profundo text-white text-sm font-medium rounded-lg hover:bg-verde-oscuro transition-colors"
            >
              Continuar pago en Mercado Pago →
            </a>
          </div>
        )}
      </div>

      {payment.status === "pending" && (
        <PaymentStatusWatcher paymentId={payment.id} />
      )}
    </main>
  );
}
