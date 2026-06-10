import type { WorkbenchTabSlug } from '../contracts/workbench';

type WorkbenchTabIntent = WorkbenchTabSlug | string | null | undefined;

const CANONICAL_WORKBENCH_TABS = new Set([
  'summary',
  'forge',
  'atlas',
  'dais',
  'dossier',
  'pilot',
]);

function normalizeTab(tabId: WorkbenchTabIntent): string | null {
  if (!tabId) return null;
  const normalized = String(tabId).trim().toLowerCase();
  if (!normalized || normalized === 'summary') return null;
  return CANONICAL_WORKBENCH_TABS.has(normalized) ? normalized : null;
}

export function buildCanonicalWorkbenchRoute(
  parcelId?: string | null,
  tabId?: WorkbenchTabIntent,
): string {
  const normalizedTab = normalizeTab(tabId);
  const normalizedParcel = parcelId?.trim();

  if (!normalizedParcel) {
    return normalizedTab
      ? `/property/search?openTab=${encodeURIComponent(normalizedTab)}`
      : '/property';
  }

  const base = `/property/${encodeURIComponent(normalizedParcel)}`;
  return normalizedTab ? `${base}/${normalizedTab}` : base;
}

export function navigateToCanonicalWorkbenchRoute(
  parcelId?: string | null,
  tabId?: WorkbenchTabIntent,
): string {
  const route = buildCanonicalWorkbenchRoute(parcelId, tabId);
  window.history.pushState({}, '', route);
  window.dispatchEvent(new PopStateEvent('popstate'));
  return route;
}
