export default function AdminLoading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="h-8 w-44 rounded-md bg-verde-brote animate-pulse mb-8" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <SectionSkeleton rows={5} />
      <SectionSkeleton rows={5} />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-beige bg-white p-4 flex flex-col gap-3 animate-pulse">
      <div className="h-3 w-20 rounded bg-verde-brote" />
      <div className="h-7 w-28 rounded bg-verde-hoja" />
    </div>
  );
}

function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <div className="mb-10">
      <div className="h-5 w-40 rounded bg-verde-brote animate-pulse mb-4" />

      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-beige bg-white p-4 flex items-center justify-between gap-4 animate-pulse"
          >
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-4 w-32 rounded bg-verde-brote" />
              <div className="h-3 w-24 rounded bg-verde-suave" />
            </div>
            <div className="h-5 w-20 rounded bg-verde-brote" />
            <div className="h-6 w-16 rounded-full bg-verde-brote" />
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <div className="h-9 w-20 rounded-md bg-verde-brote animate-pulse" />
        <div className="h-9 w-9 rounded-md bg-verde-brote animate-pulse" />
        <div className="h-9 w-20 rounded-md bg-verde-brote animate-pulse" />
      </div>
    </div>
  );
}
