"use client";

import { useRouter } from "next/navigation";
import { PayoutCard } from "@/components/ui/PayoutCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PayoutStatus } from "@/components/ui/StatusBadge";

interface Payout {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  createdAt: string;
  buyer_email?: string | null;
}

interface PayoutListProps {
  payouts: Payout[];
}

export function PayoutList({ payouts }: PayoutListProps) {
  const router = useRouter();
  if (payouts.length === 0) {
    return (
      <EmptyState
        title="No tenés acreditaciones registradas"
        description="Tus acreditaciones aparecerán acá una vez que se apruebe un pago."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {payouts.map((payout) => (
        <PayoutCard
          key={payout.id}
          payoutId={payout.id}
          paymentId={payout.payment_id}
          amount={{ value: payout.amount, currency: payout.currency }}
          status={payout.status}
          createdAt={payout.createdAt}
          buyerEmail={payout.buyer_email ?? undefined}
          onClick={() => router.push(`/payouts/${payout.id}`)}
        />
      ))}
    </div>
  );
}
