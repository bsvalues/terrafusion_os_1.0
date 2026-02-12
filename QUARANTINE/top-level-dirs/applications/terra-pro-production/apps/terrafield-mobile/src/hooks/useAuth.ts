import { useEffect, useState, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../services/ApiService';

// User interface
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
}

// Authentication context interface
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  signUp: (userData: SignUpData) => Promise<boolean>;
}

// Sign up data interface
export interface SignUpData {
  name: string;
  username: string;
  email: string;
  password: string;
}

// Authentication context
const AuthContext = createContext<AuthContextType | null>(null);

// Storage keys
const USER_STORAGE_KEY = 'terrafield_user';

// API service
const apiService = ApiService.getInstance();

// Authentication provider
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
        
        if (userJson) {
          const loadedUser = JSON.parse(userJson);
          setUser(loadedUser);
          
          // Set API token
          if (loadedUser.token) {
            apiService.setToken(loadedUser.token);
          }
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserFromStorage();
  }, []);

  // Sign in
  const signIn = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.post('/api/auth/login', {
        username,
        password,
      });
      
      const userData = response.user;
      const token = response.token;
      
      // Save user and token
      const userToSave = { ...userData, token };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToSave));
      
      // Set API token
      apiService.setToken(token);
      
      // Set user state
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Invalid username or password');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Call logout API
      await apiService.post('/api/auth/logout');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Clear user from storage
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      
      // Clear API token
      apiService.clearToken();
      
      // Clear user state
      setUser(null);
      setIsLoading(false);
    }
  };

  // Sign up
  const signUp = async (userData: SignUpData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.post('/api/auth/register', userData);
      
      const registeredUser = response.user;
      const token = response.token;
      
      // Save user and token
      const userToSave = { ...registeredUser, token };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToSave));
      
      // Set API token
      apiService.setToken(token);
      
      // Set user state
      setUser(registeredUser);
      
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      setError('Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Auth context value
  const authContextValue: AuthContextType = {
    user,
    isLoading,
    error,
    signIn,
    signOut,
    signUp,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use authentication context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};