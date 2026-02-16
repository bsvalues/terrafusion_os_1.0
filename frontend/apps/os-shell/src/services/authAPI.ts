import api from './api';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResult = { token: string };

const LOGIN_PATH = '/auth/login';

function normalizeToken(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (typeof d.token === 'string' && d.token) return d.token;
  if (typeof d.accessToken === 'string' && d.accessToken) return d.accessToken;
  return null;
}

export async function login(req: LoginRequest): Promise<LoginResult> {
  try {
    const res = await api.post(LOGIN_PATH, req);
    const token = normalizeToken(res?.data);
    if (!token) throw new Error('Invalid login response');
    return { token };
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 401 || status === 403) throw new Error('Invalid credentials');
    throw new Error('Network error');
  }
}
