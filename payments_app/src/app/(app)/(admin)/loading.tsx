// src/app/(app)/(admin)/loading.tsx
// Skeleton para /dashboard — stats cards + dos tablas paginadas

export default function AdminLoading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Título */}
      <div className="h-8 w-44 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse mb-8" />

      {/* Stats cards — 4 en fila */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Sección payments */}
      <SectionSkeleton title="Pagos recientes" rows={5} />

      {/* Sección payouts */}
      <SectionSkeleton title="Liquidaciones recientes" rows={5} />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col gap-3 animate-pulse">
      <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-7 w-28 rounded bg-gray-300 dark:bg-gray-600" />
    </div>
  );
}

function SectionSkeleton({ title, rows }: { title: string; rows: number }) {
  return (
    <div className="mb-10">
      {/* Subtítulo de sección */}
      <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-4" />

      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center justify-between gap-4 animate-pulse"
          >
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-600" />
            </div>
            <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>

      {/* Paginación */}
      <div className="flex justify-center gap-2 mt-4">
        <div className="h-9 w-20 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-9 w-9 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-9 w-20 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
  );
}
