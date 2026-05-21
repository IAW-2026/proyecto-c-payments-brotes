import { StatusBadge, PayoutStatus } from "@/components/ui/StatusBadge";

interface PayoutCardProps {
  payoutId: string;
  paymentId: string;
  amount: { value: number; currency: string };
  status: PayoutStatus;
  createdAt: string;
  onClick?: () => void; // ← agregar
}

function formatAmount(value: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
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
            bg-white border border-[#E8E2D6] rounded-xl px-5 py-4
            flex items-center justify-between gap-4
            transition-shadow duration-150
            ${onClick ? "cursor-pointer hover:shadow-md hover:border-[#D9D9D4]" : ""}
          `}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-xs text-[#7BA05D] font-mono truncate">
          {payoutId}
        </span>
        <span className="text-xs text-[#A67C52] truncate">
          Pago {paymentId}
        </span>
        <span className="text-xs text-[#D9D9D4]">{formatDate(createdAt)}</span>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-base font-semibold text-[#243B27]">
          {formatAmount(amount.value, amount.currency)}
        </span>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}
