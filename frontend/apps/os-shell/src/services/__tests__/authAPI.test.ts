import { vi, describe, it, expect, beforeEach } from 'vitest';
import { login } from '../authAPI';

vi.mock('../api', () => {
  const post = vi.fn();
  return { __esModule: true, default: { post } };
});

import api from '../api';

describe('authAPI.login', () => {
  beforeEach(() => (api.post as vi.Mock).mockReset());

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

  it('throws deterministic error on network/unknown', async () => {
    (api.post as vi.Mock).mockRejectedValue(new Error('network down'));
    await expect(login({ email: 'u@gov.', password: 'p' })).rejects.toThrow(/network/i);
  });
});
