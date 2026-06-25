"use client";

import { PaymentCard } from "@/components/ui/PaymentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AdminPaymentActions } from "./AdminPaymentActions";
import type { PaymentStatus } from "@/components/ui/StatusBadge";

interface Payment {
  id: number;
  order_id: string;
  description?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  buyer_email?: string | null;
  seller_email?: string | null;
}

export function AdminPaymentList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <EmptyState
        title="No se encontraron pagos"
        description="No hay pagos que coincidan con los filtros aplicados."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {payments.map((payment) => (
        <PaymentCard
          key={payment.id}
          paymentId={payment.id}
          orderId={payment.order_id}
          amount={{ value: payment.amount, currency: payment.currency }}
          status={payment.status}
          createdAt={payment.createdAt}
          description={payment.description}
          buyerEmail={payment.buyer_email ?? undefined}
          sellerEmail={payment.seller_email ?? undefined}
        >
          <AdminPaymentActions paymentId={payment.id} status={payment.status} />
        </PaymentCard>
      ))}
    </div>
  );
}
