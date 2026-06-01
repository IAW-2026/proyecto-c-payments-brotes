// src/lib/filters.ts
// Parsea y valida los searchParams de filtros en cada page.tsx

import type {
  FilterStatusOption,
  FilterSortOption,
  FilterOrderOption,
} from "@/components/ui/FilterBar";

const VALID_SORTS: FilterSortOption[] = ["createdAt", "amount"];
const VALID_ORDERS: FilterOrderOption[] = ["asc", "desc"];

export function parseSort(value?: string): FilterSortOption {
  return VALID_SORTS.includes(value as FilterSortOption)
    ? (value as FilterSortOption)
    : "createdAt";
}

export function parseOrder(value?: string): FilterOrderOption {
  return VALID_ORDERS.includes(value as FilterOrderOption)
    ? (value as FilterOrderOption)
    : "desc";
}

export function parsePaymentStatus(value?: string): FilterStatusOption {
  const valid: FilterStatusOption[] = [
    "all",
    "pending",
    "approved",
    "rejected",
  ];
  return valid.includes(value as FilterStatusOption)
    ? (value as FilterStatusOption)
    : "all";
}

export function parsePayoutStatus(value?: string): FilterStatusOption {
  const valid: FilterStatusOption[] = ["all", "pending", "paid"];
  return valid.includes(value as FilterStatusOption)
    ? (value as FilterStatusOption)
    : "all";
}

/** Convierte el status "all" a undefined para Prisma (sin filtro) */
export function statusForPrisma(
  status: FilterStatusOption,
): string | undefined {
  return status === "all" ? undefined : status;
}
