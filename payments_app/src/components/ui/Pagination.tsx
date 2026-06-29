"use client";

import { useSearchParams } from "next/navigation";

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  pageParam?: string;
};

export function Pagination({
  page,
  totalPages,
  basePath,
  pageParam = "page",
}: Props) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function buildHref(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(pageParam, String(targetPage));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between mt-6 text-sm">
      {page > 1 ? (
        <a
          href={buildHref(page - 1)}
          aria-label="Ir a página anterior"
          className="px-3 py-1.5 rounded-lg border border-verde-brote text-verde-bosque hover:bg-verde-brote transition-colors"
        >
          ← Anterior
        </a>
      ) : (
        <span />
      )}
      <span className="text-marron-tierra">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <a
          href={buildHref(page + 1)}
          aria-label="Ir a página siguiente"
          className="px-3 py-1.5 rounded-lg border border-verde-brote text-verde-bosque hover:bg-verde-brote transition-colors"
        >
          Siguiente →
        </a>
      ) : (
        <span />
      )}
    </div>
  );
}
