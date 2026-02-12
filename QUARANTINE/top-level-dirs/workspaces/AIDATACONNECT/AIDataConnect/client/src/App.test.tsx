import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock components
vi.mock('./pages/dashboard', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard</div>,
}));

vi.mock('./pages/login', () => ({
  default: () => <div data-testid="login-page">Login</div>,
}));

vi.mock('./pages/register', () => ({
  default: () => <div data-testid="register-page">Register</div>,
}));

vi.mock('./pages/file-explorer', () => ({
  default: () => <div data-testid="file-explorer-page">File Explorer</div>,
}));

vi.mock('./pages/data-sources', () => ({
  default: () => <div data-testid="data-sources-page">Data Sources</div>,
}));

vi.mock('./pages/pipeline-builder', () => ({
  default: () => <div data-testid="pipeline-builder-page">Pipeline Builder</div>,
}));

vi.mock('./pages/not-found', () => ({
  default: () => <div data-testid="not-found-page">Not Found</div>,
}));

vi.mock('./components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

// Mock useLocation hook from wouter
vi.mock('wouter', async () => {
  const actual = await vi.importActual('wouter');
  return {
    ...actual,
    useLocation: vi.fn(() => ['/login', vi.fn()]),
    Route: ({ path, children }: { path: string; children: React.ReactNode }) => (
      <div data-testid={`route-${path}`}>{children}</div>
    ),
    Switch: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="wouter-switch">{children}</div>
    ),
    Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
      <a href={href} data-testid={`link-${href}`}>{children}</a>
    ),
  };
});

describe('App Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderApp = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the App component', () => {
    renderApp();
    
    // Verify basic App structure is rendered
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
    expect(screen.getByTestId('wouter-switch')).toBeInTheDocument();
  });

  it('renders the login page when path is /login', async () => {
    // Mock useLocation to return /login
    const useLocationMock = vi.spyOn(require('wouter'), 'useLocation');
    useLocationMock.mockReturnValue(['/login', vi.fn()]);
    
    renderApp();
    
    // For the initial auth check
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('redirects to dashboard when authenticated and at login page', async () => {
    // Mock useLocation to return /login
    const useLocationMock = vi.spyOn(require('wouter'), 'useLocation');
    const navigateMock = vi.fn();
    useLocationMock.mockReturnValue(['/login', navigateMock]);
    
    // Mock successful authentication check
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, username: 'testuser' }),
    });
    
    renderApp();
    
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('redirects to login when unauthenticated and accessing protected route', async () => {
    // Mock useLocation to return /dashboard (protected route)
    const useLocationMock = vi.spyOn(require('wouter'), 'useLocation');
    const navigateMock = vi.fn();
    useLocationMock.mockReturnValue(['/dashboard', navigateMock]);
    
    // Mock failed authentication check
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });
    
    renderApp();
    
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login');
    });
  });

  it('renders the loading state while checking authentication', async () => {
    // Mock a slow authentication check
    (global.fetch as any).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => 
        resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, username: 'testuser' }),
        }), 
        100
      ))
    );
    
    renderApp();
    
    // Check for loading indicator before auth check completes
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('renders the ErrorBoundary when a component throws', async () => {
    // Mock a component to throw an error
    vi.mock('./pages/dashboard', () => ({
      default: () => { throw new Error('Test error'); }
    }));
    
    // Mock useLocation to return /dashboard to trigger the error
    const useLocationMock = vi.spyOn(require('wouter'), 'useLocation');
    useLocationMock.mockReturnValue(['/dashboard', vi.fn()]);
    
    // Mock successful authentication check
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, username: 'testuser' }),
    });
    
    // Suppress console errors from the intentional error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });
});