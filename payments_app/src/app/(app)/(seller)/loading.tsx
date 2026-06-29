export default function SellerLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="h-8 w-36 rounded-md bg-verde-brote animate-pulse mb-6" />

      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <PayoutCardSkeleton key={i} />
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-8">
        <div className="h-9 w-20 rounded-md bg-verde-brote animate-pulse" />
        <div className="h-9 w-9 rounded-md bg-verde-brote animate-pulse" />
        <div className="h-9 w-20 rounded-md bg-verde-brote animate-pulse" />
      </div>
    </div>
  );
}

function PayoutCardSkeleton() {
  return (
    <div className="rounded-xl border border-beige bg-white p-4 flex items-center justify-between gap-4 animate-pulse">
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 w-36 rounded bg-verde-brote" />
        <div className="h-3 w-24 rounded bg-verde-suave" />
      </div>
      <div className="h-5 w-20 rounded bg-verde-brote" />
      <div className="h-6 w-16 rounded-full bg-verde-brote" />
    </div>
  );
}
