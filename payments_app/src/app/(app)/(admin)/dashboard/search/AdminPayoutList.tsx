"use client";

import { PayoutCard } from "@/components/ui/PayoutCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AdminPayoutActions } from "./AdminPayoutActions";
import type { PayoutStatus } from "@/components/ui/StatusBadge";

interface Payout {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  createdAt: string;
  buyer_email?: string | null;
}

export function AdminPayoutList({ payouts }: { payouts: Payout[] }) {
  if (payouts.length === 0) {
    return (
      <EmptyState
        title="No se encontraron acreditaciones"
        description="No hay acreditaciones que coincidan con los filtros aplicados."
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
        >
          <AdminPayoutActions payoutId={payout.id} status={payout.status} />
        </PayoutCard>
      ))}
    </div>
  );
}
