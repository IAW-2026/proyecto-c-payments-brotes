// src/lib/filters.ts
import type {
  FilterStatusOption,
  FilterSortOption,
  FilterOrderOption,
} from "../components/ui/FilterBar";

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

/** Parsea un string de búsqueda de texto, devuelve undefined si está vacío */
export function parseSearch(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Parsea una fecha exacta YYYY-MM-DD.
 * Devuelve { gte, lte } cubriendo todo el día en UTC, o undefined si inválida.
 */
export function parseDayFilter(
  value?: string,
): { gte: Date; lte: Date } | undefined {
  if (!value) return undefined;
  // Esperamos formato YYYY-MM-DD
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const gte = new Date(`${value}T00:00:00.000Z`);
  const lte = new Date(`${value}T23:59:59.999Z`);
  if (isNaN(gte.getTime())) return undefined;
  return { gte, lte };
}

/**
 * Parsea un mes exacto YYYY-MM.
 * Devuelve { gte, lte } cubriendo todo el mes en UTC, o undefined si inválido.
 */
export function parseMonthFilter(
  value?: string,
): { gte: Date; lte: Date } | undefined {
  if (!value) return undefined;
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return undefined;
  const [, year, month] = match;
  const gte = new Date(`${year}-${month}-01T00:00:00.000Z`);
  // Primer día del mes siguiente menos 1ms
  const next = new Date(Date.UTC(Number(year), Number(month), 1)); // mes es 0-indexed internamente
  const lte = new Date(next.getTime() - 1);
  if (isNaN(gte.getTime())) return undefined;
  return { gte, lte };
}

/**
 * Resuelve el rango de fechas a aplicar en Prisma.
 * Día tiene prioridad sobre mes si ambos están presentes.
 */
export function parseDateRange(
  day?: string,
  month?: string,
): { gte: Date; lte: Date } | undefined {
  return parseDayFilter(day) ?? parseMonthFilter(month);
}


