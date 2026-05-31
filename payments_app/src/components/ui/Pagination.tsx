import Link from "next/link";

type Props = { page: number; totalPages: number; basePath: string };

export function Pagination({ page, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-6 text-sm">
      {page > 1 ? (
        <Link href={`${basePath}?page=${page - 1}`} className="px-3 py-1.5 rounded-lg border border-verde-brote text-verde-bosque hover:bg-verde-brote transition-colors">
          ← Anterior
        </Link>
      ) : <span />}
      <span className="text-marron-tierra">Página {page} de {totalPages}</span>
      {page < totalPages ? (
        <Link href={`${basePath}?page=${page + 1}`} className="px-3 py-1.5 rounded-lg border border-verde-brote text-verde-bosque hover:bg-verde-brote transition-colors">
          Siguiente →
        </Link>
      ) : <span />}
    </div>
  );
}