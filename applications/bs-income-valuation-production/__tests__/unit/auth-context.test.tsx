import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, act, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../client/src/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock localStorage
const mockLocalStorage = (function() {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Create a strongly typed mock for fetch
const mockFetchResponse = {
  ok: true,
  json: jest.fn().mockResolvedValue({ user: { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' } })
};

// Mock fetch with proper typing
global.fetch = jest.fn().mockImplementation((): Promise<Response> => 
  Promise.resolve(mockFetchResponse as unknown as Response)
);

// Create a test component that uses the auth context
function TestComponent() {
  const auth = useAuth();
  
  return (
    <div><>

      <div data-testid="auth-status">
        {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div
</>

data-testid="username">
        {auth.user?.username || 'No User'}
      </div>
      <button onClick={() => auth.logout()} data-testid="logout-button">
        Logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });
  
  test('It should auto-authenticate in development mode', async () => {
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </QueryClientProvider>
      );
    });
    
    // In development mode, we should be auto-authenticated
    expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');
    expect(screen.getByTestId('username').textContent).toBe('devuser');
    
    // Dev tokens should be stored in localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'dev-mode-token');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'dev-mode-refresh-token');
  });
  
  test('Logout should temporarily remove user but restore auto-authentication', async () => {
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </QueryClientProvider>
      );
    });
    
    // Initially authenticated
    expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');
    
    // Perform logout
    await act(async () => {
      screen.getByTestId('logout-button').click();
    });
    
    // Should be logged out initially
    expect(screen.getByTestId('auth-status').textContent).toBe('Not Authenticated');
    
    // Wait for auto-restore in dev mode (uses setTimeout internally)
    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');
    }, { timeout: 4000 });
  });
  
  test('login should set a mock user with the provided username', async () => {
    // Create a test component that calls login
    function LoginTestComponent() {
      const auth = useAuth();
      
      return (
        <div><>

          <div data-testid="username">
            {auth.user?.username || 'No User'}
          </div>
          <button
</>

            onClick={() => auth.login('customuser', 'password')} 
            data-testid="login-button"
          >
            Login
          </button>
        </div>
      );
    }
    
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LoginTestComponent />
          </AuthProvider>
        </QueryClientProvider>
      );
    });
    
    // Initially has the default dev user
    expect(screen.getByTestId('username').textContent).toBe('devuser');
    
    // Perform login with custom username
    await act(async () => {
      screen.getByTestId('login-button').click();
    });
    
    // Should change to the provided username
    expect(screen.getByTestId('username').textContent).toBe('customuser');
  });
});