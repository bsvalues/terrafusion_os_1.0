import api from './api';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResult = { token: string };

export type AccessPolicy = {
  signupMode: string;
  publicSignupEnabled: boolean;
  message: string;
};

const LOGIN_PATH = '/auth/login';
const ACCESS_POLICY_PATH = '/auth/access-policy';

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
    const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
    if (status === 401 || status === 403) {
      throw new Error(typeof message === 'string' && message ? message : 'Invalid credentials');
    }
    throw new Error('Network error');
  }
}

export async function getAccessPolicy(): Promise<AccessPolicy> {
  try {
    const res = await api.get(ACCESS_POLICY_PATH);
    const data = res?.data as Partial<AccessPolicy> | undefined;
    return {
      signupMode: data?.signupMode ?? 'provisioned_access_only',
      publicSignupEnabled: data?.publicSignupEnabled === true,
      message:
        data?.message ??
        'TerraFusion access is provisioned by an administrator. Public self-signup and public access requests are disabled.',
    };
  } catch {
    return {
      signupMode: 'provisioned_access_only',
      publicSignupEnabled: false,
      message:
        'TerraFusion access is provisioned by an administrator. Public self-signup and public access requests are disabled.',
    };
  }
}
