// app/dashboard/page.tsx
import { requireRole } from "@/lib/auth";

export default async function DashboardPage() {
  await requireRole("admin");
  return <div>Panel admin</div>;
}
