import { StatusBadge, PayoutStatus } from "@/components/ui/StatusBadge";
import { formatAmount, formatDate } from "@/lib/format";

interface PayoutCardProps {
  payoutId: number;
  paymentId: number;
  amount: { value: number; currency: string };
  status: PayoutStatus;
  createdAt: string;
  buyerEmail?: string;
  sellerEmail?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function PayoutCard({
  payoutId,
  paymentId,
  amount,
  status,
  createdAt,
  buyerEmail,
  sellerEmail,
  onClick,
  children,
}: PayoutCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      className={`
        bg-white border border-beige rounded-xl px-5 py-4
        transition-shadow duration-150
        ${onClick ? "cursor-pointer hover:shadow-md hover:border-gris-piedra" : ""}
      `}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-sm font-semibold text-verde-profundo truncate">
            #{payoutId} — Pago #{paymentId}
          </span>
          {buyerEmail && (
            <span className="text-xs text-marron-tierra truncate">
              {buyerEmail}
            </span>
          )}
          {sellerEmail && (
            <span className="text-xs text-marron-tierra truncate">
              Vendedor: {sellerEmail}
            </span>
          )}
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
      {children}
    </div>
  );
}
