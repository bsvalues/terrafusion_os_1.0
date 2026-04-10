import { QueryClient } from '@tanstack/react-query';
import { getDevToken } from './devAuth';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
      refetchOnWindowFocus: false,
      // Default fetcher: treats the first queryKey element as a URL path.
      // Enables useQuery({ queryKey: ['/cost-matrices'] }) without an explicit queryFn.
      queryFn: async ({ queryKey }) => {
        const path = queryKey[0] as string;
        return apiRequest(path);
      },
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Typed fetch wrapper used by terrabuild API calls.
 * Mirrors the Replit-standard apiRequest pattern.
 */
export async function apiRequest(url: string, options?: RequestInit): Promise<any> {
  const token = await getDevToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Request failed: ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`);
  }

  // Some endpoints return 204 No Content
  if (response.status === 204) return null;

  return response.json();
}
