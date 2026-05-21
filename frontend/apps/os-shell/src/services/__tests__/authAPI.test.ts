import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getAccessPolicy, login } from '../authAPI';

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

import api from '../api';

describe('authAPI.login', () => {
  beforeEach(() => {
    (api.get as vi.Mock).mockReset();
    (api.post as vi.Mock).mockReset();
  });

  it('returns normalized token on success (token field)', async () => {
    (api.post as vi.Mock).mockResolvedValue({ data: { token: 'T' } });
    await expect(login({ email: 'u@gov.us', password: 'p' })).resolves.toEqual({ token: 'T' });
  });

  it('returns normalized token on success (accessToken field)', async () => {
    (api.post as vi.Mock).mockResolvedValue({ data: { accessToken: 'A' } });
    await expect(login({ email: 'u@gov.us', password: 'p' })).resolves.toEqual({ token: 'A' });
  });

  it('throws deterministic error on 401/403', async () => {
    (api.post as vi.Mock).mockRejectedValue({ response: { status: 401 } });
    await expect(login({ email: 'u@gov.us', password: 'bad' })).rejects.toThrow(/invalid/i);
  });

  it('surfaces unprovisioned account message from backend', async () => {
    (api.post as vi.Mock).mockRejectedValue({
      response: { status: 401, data: { message: 'Account not provisioned' } },
    });
    await expect(login({ email: 'missing@gov.us', password: 'p' })).rejects.toThrow(
      /account not provisioned/i,
    );
  });

  it('throws deterministic error on network/unknown', async () => {
    (api.post as vi.Mock).mockRejectedValue(new Error('network down'));
    await expect(login({ email: 'u@gov.', password: 'p' })).rejects.toThrow(/network/i);
  });

  it('returns explicit provisioned-access policy', async () => {
    (api.get as vi.Mock).mockResolvedValue({
      data: {
        signupMode: 'provisioned_access_only',
        publicSignupEnabled: false,
        message: 'Provisioned only',
      },
    });

    await expect(getAccessPolicy()).resolves.toEqual({
      signupMode: 'provisioned_access_only',
      publicSignupEnabled: false,
      message: 'Provisioned only',
    });
    expect(api.get).toHaveBeenCalledWith('/auth/access-policy');
  });

  it('fails closed to provisioned-access policy when policy endpoint is unavailable', async () => {
    (api.get as vi.Mock).mockRejectedValue(new Error('not deployed yet'));

    await expect(getAccessPolicy()).resolves.toEqual({
      signupMode: 'provisioned_access_only',
      publicSignupEnabled: false,
      message:
        'TerraFusion access is provisioned by an administrator. Public self-signup and public access requests are disabled.',
    });
  });
});
