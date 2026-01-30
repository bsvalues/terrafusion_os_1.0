export type Session = {
  userId: string;
  countyId: string;
  role?: string;
  permissions?: string[];
  mode?: 'pilot' | 'muse';
  parcelId?: string;
};

const LS_KEY = 'tf.session.dev';

export function getSession(): Session | null {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw) as Session;
    } catch {
      // ignore
    }
  }

  const userId = import.meta.env.VITE_DEV_USER_ID as string | undefined;
  const countyId = import.meta.env.VITE_DEV_COUNTY_ID as string | undefined;

  if (!userId || !countyId) return null;

  const permissionsRaw = import.meta.env.VITE_DEV_PERMISSIONS as string | undefined;

  return {
    userId,
    countyId,
    role: (import.meta.env.VITE_DEV_ROLE as string | undefined) ?? 'dev',
    permissions: permissionsRaw
      ? permissionsRaw
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined,
    mode: (import.meta.env.VITE_DEV_MODE as 'pilot' | 'muse' | undefined) ?? 'pilot',
  };
}

export function setDevSession(session: Session): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(session));
}

export function clearDevSession(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(LS_KEY);
}
