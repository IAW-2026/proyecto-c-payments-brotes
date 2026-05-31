export const PAGE_SIZE = 10;

export function getPaginationParams(searchParams: { page?: string }) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  return { page, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}
