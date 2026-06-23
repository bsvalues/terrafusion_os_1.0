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
      message:
        'Access is issued through TerraFusion administration for authorized Washington county operators. No public signup is available.',
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

    await screen.findByText(/provisioned access only/i);

    const u = userEvent.setup();
    await u.type(screen.getByLabelText(/email/i), 'user@gov.example.com');
    await u.type(screen.getByLabelText(/pass/i), 'password');
    await u.click(screen.getByRole('button', { name: /enter terrafusion os/i }));

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

    await screen.findByText(/provisioned access only/i);

    const u = userEvent.setup();
    await u.type(screen.getByLabelText(/email/i), 'user@gov.example.com');
    await u.type(screen.getByLabelText(/pass/i), 'bad');
    await u.click(screen.getByRole('button', { name: /enter terrafusion os/i }));

    expect(await screen.findByText(/invalid|failed|error/i)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('renders the constitutional operations entry console without public request flows', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /government operations runtime/i })).toBeInTheDocument();
    expect(screen.getAllByText(/washington county operations/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/controlled production access/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/runtime authority/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/terrafusion db/i)).toBeInTheDocument();
    expect(screen.getByText(/identity model/i)).toBeInTheDocument();
    expect(screen.getAllByText(/provisioned operator/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/session model/i)).toBeInTheDocument();
    expect(screen.getByText(/audited jwt session/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /operator access/i })).toBeInTheDocument();
    expect(await screen.findByText(/authorized washington county operators/i)).toBeInTheDocument();
    expect(screen.getByText(/no public signup is available/i)).toBeInTheDocument();
    expect(screen.queryByText(/benton county runtime pilot/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /request provisioned access/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/request access/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/public access requests/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mailto/i)).not.toBeInTheDocument();
  });

  it('does not show an expired-session warning on a direct unauthenticated login visit', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/provisioned access only/i)).toBeInTheDocument();
    expect(screen.queryByText(/your session has expired/i)).not.toBeInTheDocument();
    expect(screen.getByText(/controlled production access for authorized county operators/i)).toBeInTheDocument();
  });
});
