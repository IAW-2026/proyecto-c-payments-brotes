"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export type FilterStatusOption =
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "paid";
export type FilterSortOption = "createdAt" | "amount";
export type FilterOrderOption = "asc" | "desc";

export interface FilterBarProps {
  /** Qué opciones de status mostrar según el contexto */
  statusOptions: { value: FilterStatusOption; label: string }[];
  currentStatus: FilterStatusOption;
  currentSort: FilterSortOption;
  currentOrder: FilterOrderOption;
  paramPrefix?: string;
}

export function FilterBar({
  statusOptions,
  currentStatus,
  currentSort,
  currentOrder,
  paramPrefix = "",
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      //params.set(key, value);
      params.set(`${paramPrefix}${key}`, value);
      // Volver a página 1 cuando cambia un filtro
      params.delete("page");
      params.delete("paymentsPage");
      params.delete("payoutsPage");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, paramPrefix],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-marron-tierra whitespace-nowrap">
          Estado
        </label>
        <select
          value={currentStatus}
          onChange={(e) => updateParam("status", e.target.value)}
          className="text-sm rounded-lg border border-beige bg-white text-verde-profundo px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-verde-hoja cursor-pointer"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Ordenar por */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-marron-tierra whitespace-nowrap">
          Ordenar por
        </label>
        <select
          value={currentSort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="text-sm rounded-lg border border-beige bg-white text-verde-profundo px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-verde-hoja cursor-pointer"
        >
          <option value="createdAt">Fecha</option>
          <option value="amount">Monto</option>
        </select>
      </div>

      {/* Dirección */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-marron-tierra whitespace-nowrap">
          Dirección
        </label>
        <select
          value={currentOrder}
          onChange={(e) => updateParam("order", e.target.value)}
          className="text-sm rounded-lg border border-beige bg-white text-verde-profundo px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-verde-hoja cursor-pointer"
        >
          <option value="desc">Más reciente / Mayor</option>
          <option value="asc">Más antiguo / Menor</option>
        </select>
      </div>

      {/* Reset — solo si hay algún filtro activo */}
      {(currentStatus !== "all" ||
        currentSort !== "createdAt" ||
        currentOrder !== "desc") && (
        <button
          onClick={() => router.replace(pathname, { scroll: false })}
          className="text-xs text-marron-tierra underline underline-offset-2 hover:text-verde-profundo transition-colors ml-1"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
