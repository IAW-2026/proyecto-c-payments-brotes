import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { PaymentList } from "@/components/ui/PaymentsList";
import { redirect } from "next/navigation";
import { isPaymentStatus } from "@/lib/validator";
import { getPaginationParams, PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";
import { FilterBar } from "@/components/ui/FilterBar";
import {
  parseSort,
  parseOrder,
  parsePaymentStatus,
  parseSearch,
  parseDateRange,
  statusForPrisma,
} from "@/lib/filters";

export default async function BuyerPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;

  const sp = await searchParams;

  const currentStatus = parsePaymentStatus(sp.status);
  const currentSort = parseSort(sp.sort);
  const currentOrder = parseOrder(sp.order);
  const currentSearch = parseSearch(sp.search);
  const currentDay = sp.day ?? "";
  const currentMonth = sp.month ?? "";
  const dateRange = parseDateRange(sp.day, sp.month);

  const { page, skip, take } = getPaginationParams({ page: sp.page });

  const andConditions: Record<string, unknown>[] = [
    {
      OR: [
        { buyer_id: userId },
        ...(userEmail ? [{ buyer_email: userEmail }] : []),
      ],
    },
    ...(statusForPrisma(currentStatus)
      ? [{ status: statusForPrisma(currentStatus) }]
      : []),
    ...(currentSearch
      ? [
          {
            OR: [
              { description: { contains: currentSearch, mode: "insensitive" as const } },
              { seller_email: { contains: currentSearch, mode: "insensitive" as const } },
            ],
          },
        ]
      : []),
    ...(dateRange ? [{ createdAt: dateRange }] : []),
  ];
  const where = { AND: andConditions };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { [currentSort]: currentOrder },
      skip,
      take,
    }),
    prisma.payment.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const serialized = payments.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    status: isPaymentStatus(p.status) ? p.status : "pending",
    seller_email: p.seller_email,
  }));

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <PageHeader
        title="Mis pagos"
        subtitle={
          total > 0
            ? `${total} pago${total !== 1 ? "s" : ""} registrado${total !== 1 ? "s" : ""}`
            : undefined
        }
      />

      <div className="mb-4">
        <FilterBar
          statusOptions={[
            { value: "all", label: "Todos" },
            { value: "pending", label: "Pendiente" },
            { value: "approved", label: "Aprobado" },
            { value: "rejected", label: "Rechazado" },
          ]}
          currentStatus={currentStatus}
          currentSort={currentSort}
          currentOrder={currentOrder}
          searchPlaceholder="Buscar por descripción o email del vendedor..."
          currentSearch={currentSearch ?? ""}
          currentDay={currentDay}
          currentMonth={currentMonth}
        />
      </div>
      <Pagination page={page} totalPages={totalPages} basePath="/payments" />
      <PaymentList payments={serialized} />
    </main>
  );
}
