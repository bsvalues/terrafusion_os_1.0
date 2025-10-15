import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from './register';
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

describe('Register Page', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderRegisterPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Register />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the register form', () => {
    renderRegisterPage();
    
    expect(screen.getByRole('heading', { name: /Create an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  it('displays validation errors with empty form submission', async () => {
    renderRegisterPage();
    
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
  });

  it('displays validation error with short password', async () => {
    renderRegisterPage();
    
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'pass' } });
    
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('handles successful registration', async () => {
    // Mock fetch to return successful registration
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, username: 'newuser' }),
    });
    
    const navigateMock = vi.fn();
    vi.spyOn(wouter, 'useLocation').mockImplementation(() => ['/', navigateMock]);
    
    renderRegisterPage();
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', expect.any(Object));
      expect(navigateMock).toHaveBeenCalledWith('/login');
    });
  });

  it('handles registration error', async () => {
    // Mock fetch to return error
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ message: 'Username already exists' }),
    });
    
    renderRegisterPage();
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'existinguser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', expect.any(Object));
      expect(screen.getByText(/Username already exists/i)).toBeInTheDocument();
    });
  });

  it('navigates to login page when clicking sign in link', () => {
    const navigateMock = vi.fn();
    vi.spyOn(wouter, 'useLocation').mockImplementation(() => ['/', navigateMock]);
    
    renderRegisterPage();
    
    const signInLink = screen.getByText(/Sign in/i);
    fireEvent.click(signInLink);
    
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
});