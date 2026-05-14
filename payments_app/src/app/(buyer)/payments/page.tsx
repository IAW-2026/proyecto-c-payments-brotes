// app/(buyer)/payments/page.tsx
import { requireRole } from "@/lib/auth";

export default async function PaymentsPage() {
  await requireRole("buyer", "admin");
  return <div>Historial de pagos</div>;
}
