import React, { createContext, useState, useContext, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const defaultUser: User = {
  id: 1,
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'Administrator',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(defaultUser);

  // Mock login function
  const login = async (email: string, password: string) => {
    // In a real app, you would validate credentials against an API
    if (email && password) {
      setUser(defaultUser);
      return true;
    }
    return false;
  };

  // Mock logout function
  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
