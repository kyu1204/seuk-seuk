export interface PageAreaLike {
  page: number;
  signed: boolean;
}

export interface IndexedAreaLike {
  id: string;
  page: number;
  signed: boolean;
}

export function remainingByPage(areas: PageAreaLike[]): Record<number, number> {
  const result: Record<number, number> = {};
  for (const area of areas) {
    if (area.signed) continue;
    result[area.page] = (result[area.page] ?? 0) + 1;
  }
  return result;
}

export function nextUnsignedArea(
  areas: IndexedAreaLike[],
  currentPage: number
): { id: string; page: number } | null {
  const onCurrentPage = areas.find((a) => !a.signed && a.page === currentPage);
  if (onCurrentPage) return { id: onCurrentPage.id, page: onCurrentPage.page };

  const sortedPages = [...new Set(areas.map((a) => a.page))].sort((a, b) => a - b);
  for (const page of sortedPages) {
    if (page === currentPage) continue;
    const next = areas.find((a) => !a.signed && a.page === page);
    if (next) return { id: next.id, page: next.page };
  }
  return null;
}
