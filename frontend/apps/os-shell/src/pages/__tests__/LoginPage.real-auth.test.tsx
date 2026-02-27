import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

jest.mock('@/services/authAPI', () => ({ __esModule: true, login: jest.fn() }));

const navigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

import { login as authLogin } from '@/services/authAPI';
import { AuthProvider } from '@/auth/AuthProvider';
import LoginPage from '../LoginPage';

describe('LoginPage real auth exchange', () => {
  beforeEach(() => {
    (authLogin as jest.Mock).mockReset();
    navigate.mockReset();
    localStorage.clear();
  });

  it('on success: calls authAPI.login, logs in, navigates home', async () => {
    (authLogin as jest.Mock).mockResolvedValue({ token: 'REAL_TOKEN' });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

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
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('on failure: shows error and does not navigate', async () => {
    (authLogin as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    const u = userEvent.setup();
    await u.type(screen.getByLabelText(/email/i), 'user@gov.example.com');
    await u.type(screen.getByLabelText(/pass/i), 'bad');
    await u.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid|failed|error/i)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
