import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/services/authAPI', () => ({
  __esModule: true,
  login: vi.fn(),
  getAccessPolicy: vi.fn(),
}));

// Prevent AuthProvider from calling fetchDevToken() in dev preview mode —
// that fetch hangs in jsdom and consumes the 5s test timeout.
vi.mock('@/auth/authPolicy', () => ({
  isDevPreviewMode: () => false,
  shouldForceLoginRedirect: () => true,
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

import { getAccessPolicy, login as authLogin } from '@/services/authAPI';
import { AuthProvider } from '@/auth/AuthProvider';
import LoginPage from '../LoginPage';

describe('LoginPage real auth exchange', () => {
  beforeEach(() => {
    (authLogin as vi.Mock).mockReset();
    (getAccessPolicy as vi.Mock).mockReset();
    (getAccessPolicy as vi.Mock).mockResolvedValue({
      signupMode: 'provisioned_access_only',
      publicSignupEnabled: false,
      accessRequestUrl: 'mailto:support@terrafusionmarket.com?subject=TerraFusion%20OS%20Provisioned%20Access%20Request',
      supportEmail: 'support@terrafusionmarket.com',
      message:
        'TerraFusion access is provisioned by an administrator. Public self-signup is disabled. Request provisioned access from support@terrafusionmarket.com.',
    });
    navigate.mockReset();
    localStorage.clear();
  });

  it('on success: calls authAPI.login, logs in, navigates home', async () => {
    (authLogin as vi.Mock).mockResolvedValue({ token: 'REAL_TOKEN' });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await screen.findByRole('link', { name: /request provisioned access/i });

    const u = userEvent.setup();
    await u.type(screen.getByLabelText(/email/i), 'user@gov.example.com');
    await u.type(screen.getByLabelText(/pass/i), 'password');
    await u.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authLogin).toHaveBeenCalledTimes(1);
    });
    expect(authLogin).toHaveBeenCalledWith({
      email: 'user@gov.example.com',
      password: 'password',
    });
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/');
    });
  });

  it('on failure: shows error and does not navigate', async () => {
    (authLogin as vi.Mock).mockRejectedValue(new Error('Invalid credentials'));

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await screen.findByRole('link', { name: /request provisioned access/i });

    const u = userEvent.setup();
    await u.type(screen.getByLabelText(/email/i), 'user@gov.example.com');
    await u.type(screen.getByLabelText(/pass/i), 'bad');
    await u.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid|failed|error/i)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('states that public signup is disabled and gives a provisioned-access request channel', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText(/provisioned access only/i)).toBeInTheDocument();
    expect(await screen.findByText(/request provisioned access/i)).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /request provisioned access/i })).toHaveAttribute(
      'href',
      'mailto:support@terrafusionmarket.com?subject=TerraFusion%20OS%20Provisioned%20Access%20Request',
    );
  });

  it('does not show an expired-session warning on a direct unauthenticated login visit', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: /request provisioned access/i })).toBeInTheDocument();
    expect(screen.queryByText(/your session has expired/i)).not.toBeInTheDocument();
    expect(screen.getByText(/sign in with an issued operator account/i)).toBeInTheDocument();
  });
});
