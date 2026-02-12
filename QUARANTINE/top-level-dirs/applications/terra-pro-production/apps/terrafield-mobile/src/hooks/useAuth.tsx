import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { ApiService } from "../services/ApiService";
import { NotificationService } from "../services/NotificationService";

// User types
export interface User {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

// LoginCredentials type
interface LoginCredentials {
  username: string;
  password: string;
}

// RegisterData type
interface RegisterData {
  username: string;
  password: string;
  fullName?: string;
  email?: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Storage keys
const USER_STORAGE_KEY = "terrafield_user";
const TOKEN_STORAGE_KEY = "terrafield_token";

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Services
  const apiService = ApiService.getInstance();
  const notificationService = NotificationService.getInstance();

  // Initialize auth state
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        // Load user from storage
        const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

        if (userJson && storedToken) {
          const userData = JSON.parse(userJson);
          setUser(userData);
          setToken(storedToken);

          // Set token in API service
          apiService.setToken(storedToken);
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call login API
      const response = await apiService.post<{ user: User; token: string }>("/api/auth/login", {
        username,
        password,
      });

      if (response.user && response.token) {
        // Save user and token
        setUser(response.user);
        setToken(response.token);

        // Store in AsyncStorage
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.token);

        // Set token in API service
        apiService.setToken(response.token);

        // Show success notification
        notificationService.sendSystemNotification(
          "Login Successful",
          `Welcome back, ${response.user.fullName || response.user.username}!`
        );
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid username or password. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call register API
      const response = await apiService.post<{ user: User; token: string }>(
        "/api/auth/register",
        data
      );

      if (response.user && response.token) {
        // Save user and token
        setUser(response.user);
        setToken(response.token);

        // Store in AsyncStorage
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.token);

        // Set token in API service
        apiService.setToken(response.token);

        // Show success notification
        notificationService.sendSystemNotification(
          "Registration Successful",
          `Welcome to TerraField, ${response.user.fullName || response.user.username}!`
        );
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Registration failed. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API if online
      if (apiService.isConnected()) {
        await apiService.post("/api/auth/logout");
      }

      // Clear token in API service
      apiService.clearToken();

      // Clear storage
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);

      // Clear state
      setUser(null);
      setToken(null);

      // Show success notification
      notificationService.sendSystemNotification("Logout Successful", "You have been logged out.");
    } catch (error) {
      console.error("Logout error:", error);

      // Force logout even if API call fails
      apiService.clearToken();
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
      setToken(null);
    }
  };

  // Update user function
  const updateUser = async (userData: Partial<User>) => {
    if (!user) {
      throw new Error("Not authenticated");
    }

    setIsLoading(true);

    try {
      // Call update user API
      const response = await apiService.put<{ user: User }>(`/api/users/${user.id}`, userData);

      if (response.user) {
        // Update local user data
        const updatedUser = { ...user, ...response.user };
        setUser(updatedUser);

        // Update in AsyncStorage
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

        // Show success notification
        notificationService.sendSystemNotification(
          "Profile Updated",
          "Your profile information has been updated."
        );

        return;
      }

      throw new Error("Invalid response from server");
    } catch (error) {
      console.error("Update user error:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default useAuth;
