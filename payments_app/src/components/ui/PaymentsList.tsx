"use client";

import { useRouter } from "next/navigation";
import { PaymentCard } from "@/components/ui/PaymentCard";
import { EmptyState } from "@/components/ui/EmptyState";
//corregir esto, buscar donde se define correctamente PaymentStatus
export type PaymentStatus = "pending" | "approved" | "rejected";

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
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
          onClick={() => router.push(`/payments/${payment.id}`)}
        />
      ))}
    </div>
  );
}
