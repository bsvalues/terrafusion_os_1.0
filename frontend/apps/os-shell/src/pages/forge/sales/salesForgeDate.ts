const CANONICAL_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function formatSaleDate(
  iso: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!iso) return '—';
  const dateOnly = CANONICAL_DATE_ONLY.test(iso);
  const date = new Date(dateOnly ? `${iso}T00:00:00.000Z` : iso);
  if (!Number.isFinite(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    ...options,
    ...(dateOnly ? { timeZone: 'UTC' } : {}),
  });
}
