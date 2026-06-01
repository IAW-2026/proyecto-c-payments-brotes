"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

export type FilterStatusOption =
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "paid";
export type FilterSortOption = "createdAt" | "amount";
export type FilterOrderOption = "asc" | "desc";

export interface FilterBarProps {
  statusOptions: { value: FilterStatusOption; label: string }[];
  currentStatus: FilterStatusOption;
  currentSort: FilterSortOption;
  currentOrder: FilterOrderOption;
  /** Placeholder del input de búsqueda, ej: "Buscar por descripción" */
  searchPlaceholder?: string;
  currentSearch?: string;
  currentDay?: string;
  currentMonth?: string;
  paramPrefix?: string;
}

export function FilterBar({
  statusOptions,
  currentStatus,
  currentSort,
  currentOrder,
  searchPlaceholder = "Buscar...",
  currentSearch = "",
  currentDay = "",
  currentMonth = "",
  paramPrefix = "",
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estado local del input de texto para no hacer un replace por cada tecla
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Sincronizar si el Server Component cambia currentSearch (ej: limpiar filtros)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const p = paramPrefix;

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(`${p}${key}`, value);
      } else {
        params.delete(`${p}${key}`);
      }
      params.delete("page");
      params.delete("paymentspage");
      params.delete("payoutspage");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, p],
  );

  /** Cuando cambia el input de fecha de día, limpia el mes y viceversa */
  const updateDay = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(`${p}day`, value);
      } else {
        params.delete(`${p}day`);
      }
      // Si hay día, limpiar mes
      params.delete(`${p}month`);
      params.delete("page");
      params.delete("paymentspage");
      params.delete("payoutspage");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, p],
  );

  const updateMonth = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(`${p}month`, value);
      } else {
        params.delete(`${p}month`);
      }
      // Si hay mes, limpiar día
      params.delete(`${p}day`);
      params.delete("page");
      params.delete("paymentspage");
      params.delete("payoutspage");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, p],
  );

  /** Commit del input de texto: solo navega al hacer Enter o blur */
  const commitSearch = useCallback(
    (value: string) => {
      updateParam("search", value.trim());
    },
    [updateParam],
  );

  const hasActiveFilters =
    currentStatus !== "all" ||
    currentSort !== "createdAt" ||
    currentOrder !== "desc" ||
    !!currentSearch ||
    !!currentDay ||
    !!currentMonth;

  return (
    <div className="flex flex-col gap-3">
      {/* Fila 1: búsqueda de texto */}
      {searchPlaceholder && (
        <input
          type="text"
          value={searchInput}
          placeholder={searchPlaceholder}
          onChange={(e) => setSearchInput(e.target.value)}
          onBlur={(e) => commitSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitSearch(searchInput);
          }}
          className="w-full text-sm rounded-lg border border-beige bg-white text-verde-profundo px-3 py-1.5 placeholder:text-marron-tierra/50 focus:outline-none focus:ring-2 focus:ring-verde-hoja"
        />
      )}

      {/* Fila 2: filtros de select + fechas */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Estado */}
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

        {/* Ord. */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-marron-tierra whitespace-nowrap">
            Ord.
          </label>
          <select
            value={currentOrder}
            onChange={(e) => updateParam("order", e.target.value)}
            className="text-sm rounded-lg border border-beige bg-white text-verde-profundo px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-verde-hoja cursor-pointer"
          >
            <option value="desc">Mayor / Más reciente</option>
            <option value="asc">Menor / Más antiguo</option>
          </select>
        </div>

        {/* Día exacto */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-marron-tierra whitespace-nowrap">
            Día
          </label>
          <input
            type="date"
            value={currentDay}
            onChange={(e) => updateDay(e.target.value)}
            className="text-sm rounded-lg border border-beige bg-white text-verde-profundo px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-verde-hoja cursor-pointer"
          />
        </div>

        {/* Mes exacto */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-marron-tierra whitespace-nowrap">
            Mes
          </label>
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => updateMonth(e.target.value)}
            className="text-sm rounded-lg border border-beige bg-white text-verde-profundo px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-verde-hoja cursor-pointer"
          />
        </div>

        {/* Limpiar */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchInput("");
              router.replace(pathname, { scroll: false });
            }}
            className="text-xs text-marron-tierra underline underline-offset-2 hover:text-verde-profundo transition-colors ml-1"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
