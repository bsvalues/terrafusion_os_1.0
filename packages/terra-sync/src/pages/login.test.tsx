import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './login';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as wouter from 'wouter';

// Mock dependencies
vi.mock('wouter', async () => {
  const actual = await vi.importActual('wouter');
  return {
    ...actual,
    useLocation: vi.fn(() => ['/', vi.fn()]),
  };
});

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('Login Page', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderLoginPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Login />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the login form', () => {
    renderLoginPage();
    
    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('displays validation error with empty form submission', async () => {
    renderLoginPage();
    
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    // Mock fetch to return successful login
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, username: 'testuser' }),
    });
    
    const navigateMock = vi.fn();
    vi.spyOn(wouter, 'useLocation').mockImplementation(() => ['/', navigateMock]);
    
    renderLoginPage();
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles login error', async () => {
    // Mock fetch to return error
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Invalid username or password' }),
    });
    
    renderLoginPage();
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpassword' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
      expect(screen.getByText(/Invalid username or password/i)).toBeInTheDocument();
    });
  });

  it('navigates to register page when clicking sign up link', () => {
    const navigateMock = vi.fn();
    vi.spyOn(wouter, 'useLocation').mockImplementation(() => ['/', navigateMock]);
    
    renderLoginPage();
    
    const signUpLink = screen.getByText(/Sign up/i);
    fireEvent.click(signUpLink);
    
    expect(navigateMock).toHaveBeenCalledWith('/register');
  });
});