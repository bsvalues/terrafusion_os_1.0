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
    authStorage.setToken('VALID_TOKEN');

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
    authStorage.setToken('VALID_TOKEN');

    renderGuardedRoute('/');

    expect(screen.getByTestId('home')).toBeInTheDocument();
  });

  it('dev_preview_mode_bypasses_login_redirect_without_token', () => {
    process.env.VITE_DEV_PREVIEW_BYPASS_AUTH = 'true';

    renderGuardedRoute('/dashboard');

    expect(screen.getByTestId('protected')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });
});
