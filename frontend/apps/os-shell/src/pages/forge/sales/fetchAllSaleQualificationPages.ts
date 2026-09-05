import { apiFetch } from '../../../lib/apiBase';
import type { SaleQueueItem } from './salesForgeTypes';

const MAX_PAGE_SIZE = 200;

interface SaleQualificationPage {
  total: number;
  items: SaleQueueItem[];
}

export async function fetchAllSaleQualificationPages(
  baseParams: URLSearchParams,
  headers: HeadersInit,
  signal?: AbortSignal
): Promise<SaleQueueItem[]> {
  const items: SaleQueueItem[] = [];
  let declaredTotal: number | null = null;

  for (let pageNumber = 1; ; pageNumber += 1) {
    signal?.throwIfAborted();
    const params = new URLSearchParams(baseParams);
    params.set('pageSize', String(MAX_PAGE_SIZE));
    params.set('page', String(pageNumber));

    const response = await apiFetch(`/terraforge/sale-qualification?${params}`, {
      signal,
      headers,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const page = (await response.json()) as SaleQualificationPage;
    signal?.throwIfAborted();
    if (!Number.isSafeInteger(page.total) || page.total < 0 || !Array.isArray(page.items)) {
      throw new Error('Invalid sale qualification page response');
    }
    if (page.items.length > MAX_PAGE_SIZE) {
      throw new Error('Sale qualification page exceeded the requested page size');
    }
    declaredTotal ??= page.total;
    if (page.total !== declaredTotal) {
      throw new Error('Sale qualification total changed during pagination');
    }
    items.push(...page.items);
    if (items.length >= declaredTotal) return items.slice(0, declaredTotal);
    if (page.items.length === 0) {
      throw new Error('Sale qualification pagination stopped before the declared total');
    }
  }
}
