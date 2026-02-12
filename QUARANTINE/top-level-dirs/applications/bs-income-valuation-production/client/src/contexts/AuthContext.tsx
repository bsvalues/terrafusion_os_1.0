import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type User = {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: string;
};

// Auth response types
type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
  error?: string;
};

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  error?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{success: boolean, error?: string}>;
  register: (userData: RegisterData) => Promise<{success: boolean, error?: string}>;
  logout: () => Promise<void>;
  error: string | null;
};

type RegisterData = {
  username: string;
  password: string;
  email: string;
  fullName?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: {children: React.ReactNode}) => {
  // DEVELOPMENT MODE: Auto-authentication is enabled
  // This creates a mock authenticated user for development purposes
  const mockUser: User = {
    id: 1,
    username: 'devuser',
    email: 'dev@example.com',
    fullName: 'Development User',
    role: 'user'
  };
  
  const [user, setUser] = useState<User | null>(mockUser); // Always authenticated in dev mode
  const [isLoading, setIsLoading] = useState(false); // No loading in dev mode
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Authentication check disabled for development
  useEffect(() => {
    // DEV MODE: Authentication check is bypassed
    console.log('⚠️ DEVELOPMENT MODE: Authentication disabled. All users auto-authenticated.');
    
    // Store tokens for any API requests that might need them
    localStorage.setItem('accessToken', 'dev-mode-token');
    localStorage.setItem('refreshToken', 'dev-mode-refresh-token');
  }, []);
  
  // Function to refresh tokens
  const refreshTokens = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;
      
      const response = await apiRequest<TokenResponse>(
        'POST',
        '/api/auth/refresh-token', 
        {
          body: JSON.stringify({ refreshToken }),
        }
      );
      
      if (response && response.accessToken && response.refreshToken) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        await fetchCurrentUser();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Token refresh error:', err);
      clearAuthData();
      return false;
    }
  };
  
  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return null;
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return data.user;
      }
      return null;
    } catch (err) {
      console.error('Fetch user error:', err);
      return null;
    }
  };
  
  // Login function (DEV MODE: Auto login success)
  const login = async (username: string, password: string) => {
    console.log('⚠️ DEV MODE: Auto login success for:', username);
    
    // Set mock user with the provided username for some personalization
    const devModeUser: User = {
      ...mockUser,
      username: username,
      email: `${username}@example.com`
    };
    
    // Store tokens
    localStorage.setItem('accessToken', 'dev-mode-token');
    localStorage.setItem('refreshToken', 'dev-mode-refresh-token');
    
    // Set user
    setUser(devModeUser);
    
    // Reset query cache
    queryClient.invalidateQueries();
    
    return { success: true };
  };
  
  // Register function (DEV MODE: Auto register success)
  const register = async (userData: RegisterData) => {
    console.log('⚠️ DEV MODE: Auto register success for:', userData.username);
    
    // Set mock user with the provided data
    const devModeUser: User = {
      id: 1,
      username: userData.username,
      email: userData.email,
      fullName: userData.fullName,
      role: 'user'
    };
    
    // Store tokens
    localStorage.setItem('accessToken', 'dev-mode-token');
    localStorage.setItem('refreshToken', 'dev-mode-refresh-token');
    
    // Set user
    setUser(devModeUser);
    
    return { success: true };
  };
  
  // Logout function (DEV MODE: Auto logout with instant restore)
  const logout = async () => {
    console.log('⚠️ DEV MODE: Simulating logout, but will auto-restore session');
    
    // Simulate logout
    setUser(null);
    
    // Reset query cache
    queryClient.invalidateQueries();
    
    // DEV MODE: Restore the session after a brief moment to simulate logout
    setTimeout(() => {
      console.log('⚠️ DEV MODE: Auto-restoring authenticated session');
      setUser(mockUser);
    }, 3000);
  };
  
  // Clear auth data
  const clearAuthData = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };
  
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    error,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Must be a named function, not an arrow function, for component exports
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}