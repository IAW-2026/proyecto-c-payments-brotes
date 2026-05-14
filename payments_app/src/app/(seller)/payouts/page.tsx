// app/(seller)/payouts/page.tsx
import { requireRole } from "@/lib/auth";

export default async function PayoutsPage() {
  await requireRole("seller", "admin");
  return <div>Acreditaciones</div>;
}
