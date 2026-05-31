import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { PayoutList } from "@/components/ui/PayoutList";
import { redirect } from "next/navigation";
import { PayoutStatus } from "@/components/ui/StatusBadge";
import { getPaginationParams, PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";

export default async function SellerPayoutsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { page: pageParam } = await searchParams;
  const { page, skip, take } = getPaginationParams({ page: pageParam });
  const [payouts, total] = await Promise.all([
    prisma.payout.findMany({
      where: { seller_id: userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.payout.count({ where: { seller_id: userId } }),
  ]);

  function isPayoutStatus(value: string): value is PayoutStatus {
    return ["pending", "paid"].includes(value);
  }
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const serialized = payouts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    status: isPayoutStatus(p.status) ? p.status : "pending",
  }));

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <PageHeader
        title="Mis acreditaciones"
        subtitle={
          serialized.length > 0
            ? `${serialized.length} acreditación${serialized.length !== 1 ? "es" : ""} registrada${serialized.length !== 1 ? "s" : ""}`
            : undefined
        }
      />
      <Pagination page={page} totalPages={totalPages} basePath="/payouts" />
      <PayoutList payouts={serialized} />
    </main>
  );
}
