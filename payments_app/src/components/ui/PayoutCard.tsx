import { StatusBadge, PayoutStatus } from "@/components/ui/StatusBadge";
import { formatAmount, formatDate } from "@/lib/format";

interface PayoutCardProps {
  payoutId: string;
  paymentId: string;
  amount: { value: number; currency: string };
  status: PayoutStatus;
  createdAt: string;
  onClick?: () => void;
}

export function PayoutCard({
  payoutId,
  paymentId,
  amount,
  status,
  createdAt,
  onClick,
}: PayoutCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-beige rounded-xl px-5 py-4
        flex items-center justify-between gap-4
        transition-shadow duration-150
        ${onClick ? "cursor-pointer hover:shadow-md hover:border-gris-piedra" : ""}
      `}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-xs text-verde-hoja font-mono truncate">
          {payoutId}
        </span>
        <span className="text-xs text-marron-tierra truncate">
          Pago {paymentId}
        </span>
        <span className="text-xs text-gris-piedra">{formatDate(createdAt)}</span>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-base font-semibold text-verde-profundo">
          {formatAmount(amount.value, amount.currency)}
        </span>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}
