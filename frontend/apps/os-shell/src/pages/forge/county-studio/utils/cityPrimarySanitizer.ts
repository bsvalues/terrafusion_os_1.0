const CITY_PRIMARY_KEYS = new Set(['city', 'cityName', 'selectedCity', 'municipality']);

export function stripCityPrimaryKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripCityPrimaryKeys) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key, item]) => !CITY_PRIMARY_KEYS.has(key) && !(key === 'rollupScope' && item === 'city'))
        .map(([key, item]) => [key, stripCityPrimaryKeys(item)]),
    ) as T;
  }
  return value;
}

export function sanitizeCountyStudioHandoffQuery(raw: string | null): string | null {
  if (!raw) return null;
  const params = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);

  for (const key of CITY_PRIMARY_KEYS) {
    params.delete(key);
  }
  if (params.get('rollupScope') === 'city') {
    params.delete('rollupScope');
  }

  const query = params.toString();
  return query ? `?${query}` : null;
}
