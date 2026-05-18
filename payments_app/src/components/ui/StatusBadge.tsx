type PaymentStatus = "pending" | "approved" | "rejected";

const statusConfig: Record<
  PaymentStatus,
  { label: string; classes: string; dot: string }
> = {
  pending: {
    label: "Pendiente",
    classes: "bg-[#F5F2EA] text-[#A67C52] border border-[#E8E2D6]",
    dot: "bg-[#A67C52] animate-pulse-subtle",
  },
  approved: {
    label: "Aprobado",
    classes: "bg-[#EAF3E6] text-[#4C6B3D] border border-[#CDE5C1]",
    dot: "bg-[#7BA05D]",
  },
  rejected: {
    label: "Rechazado",
    classes: "bg-[#FDF0ED] text-[#E07A5F] border border-[#F5C9BF]",
    dot: "bg-[#E07A5F]",
  },
};

interface StatusBadgeProps {
  status: PaymentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
