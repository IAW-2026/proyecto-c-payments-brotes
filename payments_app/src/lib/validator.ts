import { PaymentStatus, PayoutStatus } from "@/components/ui/StatusBadge";

export function isPaymentStatus(value: string): value is PaymentStatus {
  return ["pending", "approved", "rejected"].includes(value);
}

export function isPayoutStatus(value: string): value is PayoutStatus {
  return ["pending", "paid"].includes(value);
}
