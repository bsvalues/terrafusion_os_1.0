import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  role: string;
  organizations?: Array<{
    id: number;
    name: string;
    role: string;
  }>;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: CurrentUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
}

// Create the auth context
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

// Development mode user
const devUser: CurrentUser = {
  id: 1,
  username: 'devuser',
  email: 'dev@example.com',
  displayName: 'Development User',
  role: 'admin',
  organizations: [
    {
      id: 1,
      name: 'Development Organization',
      role: 'admin'
    }
  ]
};

// Authentication provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const { toast } = useToast();
  
  // In development mode, always consider authenticated
  const isDevelopment = false; // Disabled for production use
  
  // On mount, check if the user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // In development mode, use the dev user
        if (isDevelopment) {
          setUser(devUser);
          setIsAuthenticated(true);
          return;
        }
        
        // In production, check authentication status
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        // In development mode, use the dev user even on error
        if (isDevelopment) {
          setUser(devUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };
    
    checkAuth();
  }, [isDevelopment]);
  
  // Login function
  const login = async (username: string, password: string) => {
    try {
      // In development mode, just use the dev user
      if (isDevelopment) {
        setUser(devUser);
        setIsAuthenticated(true);
        toast({
          title: 'Logged in',
          description: 'Development mode: Automatically logged in.',
          variant: 'default',
        });
        return;
      }
      
      // In production, try to log in
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setIsAuthenticated(true);
        toast({
          title: 'Logged in',
          description: 'You have been successfully logged in.',
          variant: 'default',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Login failed',
          description: error.message || 'Invalid username or password.',
          variant: 'destructive',
        });
        throw new Error(error.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      // In development mode, use the dev user even on error
      if (isDevelopment) {
        setUser(devUser);
        setIsAuthenticated(true);
        toast({
          title: 'Logged in',
          description: 'Development mode: Automatically logged in despite error.',
          variant: 'default',
        });
        return;
      }
      toast({
        title: 'Login failed',
        description: error.message || 'An error occurred while logging in.',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      // In development mode, just reset the state
      if (isDevelopment) {
        toast({
          title: 'Logged out',
          description: 'Development mode: Logout simulated.',
          variant: 'default',
        });
        // We'd normally reset state here, but in dev mode we stay logged in
        return;
      }
      
      // In production, logout properly
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        setUser(null);
        setIsAuthenticated(false);
        toast({
          title: 'Logged out',
          description: 'You have been successfully logged out.',
          variant: 'default',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Logout failed',
          description: error.message || 'Failed to log out.',
          variant: 'destructive',
        });
        throw new Error(error.message || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout failed',
        description: error.message || 'An error occurred while logging out.',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  // Register function
  const register = async (username: string, email: string, password: string) => {
    try {
      // In development mode, just use the dev user
      if (isDevelopment) {
        setUser(devUser);
        setIsAuthenticated(true);
        toast({
          title: 'Registered',
          description: 'Development mode: Automatically registered and logged in.',
          variant: 'default',
        });
        return;
      }
      
      // In production, try to register
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setIsAuthenticated(true);
        toast({
          title: 'Registered',
          description: 'You have been successfully registered and logged in.',
          variant: 'default',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Registration failed',
          description: error.message || 'Failed to register. Please try again.',
          variant: 'destructive',
        });
        throw new Error(error.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration failed',
        description: error.message || 'An error occurred while registering.',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  // Provide the auth context value
  const authContextValue: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    register,
  };
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};