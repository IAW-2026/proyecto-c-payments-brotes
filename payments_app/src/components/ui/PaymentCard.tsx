import { StatusBadge, BadgeStatus } from "@/components/ui/StatusBadge";
import { formatAmount, formatDate } from "@/lib/format";

interface PaymentCardProps {
  paymentId: string;
  orderId: string;
  amount: { value: number; currency: string };
  status: BadgeStatus;
  createdAt: string;
  onClick?: () => void;
}

export function PaymentCard({
  paymentId,
  orderId,
  amount,
  status,
  createdAt,
  onClick,
}: PaymentCardProps) {
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
          {paymentId}
        </span>
        <span className="text-xs text-[#A67C52] truncate">Orden {orderId}</span>
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
