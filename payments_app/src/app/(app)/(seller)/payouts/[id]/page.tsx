import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge, PayoutStatus } from "@/components/ui/StatusBadge";
import { formatAmount, formatDateLong } from "@/lib/format";

export default async function PayoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const payout = await prisma.payout.findUnique({
    where: { id },
    include: { payment: true }, // ← trae description y buyer_id
  });

  if (!payout || payout.seller_id !== userId) notFound();

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#A67C52] mb-8">
        <Link
          href="/payouts"
          className="hover:text-[#243B27] transition-colors"
        >
          Mis acreditaciones
        </Link>
        <span className="text-[#D9D9D4]">/</span>
        <span className="text-[#243B27] font-mono truncate">{payout.id}</span>
      </nav>

      {/* Card de detalle */}
      <div className="bg-white border border-[#E8E2D6] rounded-xl px-6 py-6 flex flex-col gap-5">
        {/* Header: monto + estado */}
        <div className="flex items-start justify-between gap-4">
          <span className="text-3xl font-bold text-[#243B27]">
            {formatAmount(payout.amount, payout.currency)}
          </span>
          <StatusBadge status={payout.status as PayoutStatus} />
        </div>

        <hr className="border-[#E8E2D6]" />

        <dl className="flex flex-col gap-4">
          {payout.payment.description && (
            <div>
              <dt className="text-xs text-[#A67C52] mb-1">Descripción</dt>
              <dd className="text-sm text-[#243B27]">
                {payout.payment.description}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-[#A67C52] mb-1">Comprador</dt>
            <dd className="text-xs text-[#7BA05D] font-mono">
              {payout.payment.buyer_id}
              {/*Consultar si debería ser posible obtener el nombre del comprador o el userId
               a traves de clerk API */}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#A67C52] mb-1">ID de acreditación</dt>
            <dd className="text-xs text-[#7BA05D] font-mono">{payout.id}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#A67C52] mb-1">ID de pago</dt>
            <dd className="text-xs text-[#7BA05D] font-mono">
              {payout.payment_id}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#A67C52] mb-1">Fecha</dt>
            <dd className="text-sm text-[#243B27]">
              {formatDateLong(payout.createdAt)}
            </dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
