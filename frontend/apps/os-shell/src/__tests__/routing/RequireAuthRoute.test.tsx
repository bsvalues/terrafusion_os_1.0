/**
 * Phase 18 — RequireAuth (AuthGuard) route guard contract tests.
 *
 * Proves:
 * - Unauthenticated users are redirected to /login
 * - Authenticated users see children
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthGuard, AuthProvider } from '../../auth/AuthProvider';
import * as authStorage from '../../auth/authStorage';

function ProtectedContent() {
  return <div data-testid='protected'>Secret Content</div>;
}

function LoginStub() {
  return <div data-testid='login-page'>Login Page</div>;
}

function validJwt() {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `header.${payload}.signature`;
}

function renderGuardedRoute(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <AuthGuard>
          <Routes>
            <Route path='/login' element={<LoginStub />} />
            <Route path='/dashboard' element={<ProtectedContent />} />
            <Route path='/' element={<div data-testid='home'>Home</div>} />
          </Routes>
        </AuthGuard>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('RequireAuth / AuthGuard route guard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    delete process.env.VITE_USE_MOCK_DATA;
    delete process.env.VITE_DEV_PREVIEW_BYPASS_AUTH;
  });

  it('unauthenticated_redirects_to_login', () => {
    // No token in storage — should redirect to /login
    renderGuardedRoute('/dashboard');

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('authenticated_renders_children', () => {
    // Pre-seed token in storage
    authStorage.setToken(validJwt());

    renderGuardedRoute('/dashboard');

    expect(screen.getByTestId('protected')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('login_page_is_accessible_without_auth', () => {
    // No token — navigating directly to /login should show login, not redirect loop
    renderGuardedRoute('/login');

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('authenticated_user_can_access_home', () => {
    authStorage.setToken(validJwt());

    renderGuardedRoute('/');

    expect(screen.getByTestId('home')).toBeInTheDocument();
  });

  it('authenticated_login_redirects_to_os_shell_home_not_canon', () => {
    authStorage.setToken(validJwt());

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <AuthGuard>
            <Routes>
              <Route path='/login' element={<LoginStub />} />
              <Route path='/' element={<div data-testid='os-shell-home'>OS Shell Home</div>} />
              <Route path='/canon' element={<div data-testid='canon-ide'>Canon IDE</div>} />
            </Routes>
          </AuthGuard>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('os-shell-home')).toBeInTheDocument();
    expect(screen.queryByTestId('canon-ide')).not.toBeInTheDocument();
  });

  it('dev_preview_mode_bypasses_login_redirect_without_token', () => {
    process.env.VITE_DEV_PREVIEW_BYPASS_AUTH = 'true';

    renderGuardedRoute('/dashboard');

    expect(screen.getByTestId('protected')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });
});
