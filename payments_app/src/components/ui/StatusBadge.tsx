export type PaymentStatus = "pending" | "approved" | "rejected";
export type PayoutStatus = "pending" | "paid";
export type BadgeStatus = PaymentStatus | PayoutStatus;

const statusConfig: Record<
  BadgeStatus,
  { label: string; classes: string; dot: string }
> = {
  pending: {
    label: "Pendiente",
    classes: "bg-arena text-marron-tierra border border-beige",
    dot: "bg-marron-tierra animate-pulse-subtle",
  },
  approved: {
    label: "Aprobado",
    classes: "bg-verde-suave text-verde-bosque border border-verde-brote",
    dot: "bg-verde-hoja",
  },
  rejected: {
    label: "Rechazado",
    classes: "bg-[#FDF0ED] text-terracota border border-[#F5C9BF]",
    dot: "bg-terracota",
  },
  paid: {
    label: "Acreditado",
    classes: "bg-[#E6F0FA] text-[#2E6EA6] border border-[#B9D6F0]",
    dot: "bg-[#2E6EA6]",
  },
};

interface StatusBadgeProps {
  status: BadgeStatus;
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
