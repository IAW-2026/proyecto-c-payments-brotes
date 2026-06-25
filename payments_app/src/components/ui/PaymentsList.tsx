"use client";

import { useRouter } from "next/navigation";
import { PaymentCard } from "@/components/ui/PaymentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentStatus } from "./StatusBadge";

interface Payment {
  id: number;
  order_id: string;
  description?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  seller_email?: string | null;
}

interface PaymentListProps {
  payments: Payment[];
}

export function PaymentList({ payments }: PaymentListProps) {
  const router = useRouter();

  if (payments.length === 0) {
    return (
      <EmptyState
        title="No tenés pagos registrados"
        description="Tus pagos aparecerán acá una vez que realices una compra."
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
          sellerEmail={payment.seller_email ?? undefined}
          onClick={() => router.push(`/payments/${payment.id}`)}
        />
      ))}
    </div>
  );
}
