// src/app/(app)/(seller)/loading.tsx
// Skeleton para /payouts y /payouts/[id]

export default function SellerLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Título */}
      <div className="h-8 w-36 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse mb-6" />

      {/* Lista de payout cards */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <PayoutCardSkeleton key={i} />
        ))}
      </div>

      {/* Paginación */}
      <div className="flex justify-center gap-2 mt-8">
        <div className="h-9 w-20 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-9 w-9 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-9 w-20 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
  );
}

function PayoutCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center justify-between gap-4 animate-pulse">
      {/* Izquierda: payment id + fecha */}
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-600" />
      </div>
      {/* Centro: monto */}
      <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
      {/* Derecha: badge */}
      <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
