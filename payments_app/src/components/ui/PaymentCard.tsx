import { StatusBadge, BadgeStatus } from "@/components/ui/StatusBadge";
import { formatAmount, formatDate } from "@/lib/format";

interface PaymentCardProps {
  paymentId: string;
  orderId: string;
  amount: { value: number; currency: string };
  status: BadgeStatus;
  createdAt: string;
  sellerEmail?: string;
  onClick?: () => void;
}

export function PaymentCard({
  paymentId,
  orderId,
  amount,
  status,
  createdAt,
  sellerEmail,
  onClick,
}: PaymentCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      className={`
        bg-white border border-beige rounded-xl px-5 py-4
        flex items-center justify-between gap-4
        transition-shadow duration-150
        ${onClick ? "cursor-pointer hover:shadow-md hover:border-gris-piedra" : ""}
      `}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-xs text-verde-hoja font-mono truncate">
          {paymentId}
        </span>
        <span className="text-xs text-marron-tierra truncate">
          Orden {orderId}
          {sellerEmail && (
            <span className="text-xs text-marron-tierra truncate">
              {sellerEmail}
            </span>
          )}
        </span>
        <span className="text-xs text-gris-piedra">
          {formatDate(createdAt)}
        </span>
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
