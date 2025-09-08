/**
 * Extremely simplified mock authentication for development.
 * This bypasses the need for actual authentication by providing a mock user and empty mutations.
 */
import { ReactNode } from "react";
import { User } from "@shared/schema";

// Simple mock user for development
const mockUser: User = {
  id: 1,
  username: "demo_user",
  password: "password123",
  fullName: "Demo User",
  email: "demo@bentoncounty.gov",
  department: "GIS Department",
  isAdmin: true,
  createdAt: new Date().toISOString() as unknown as Date 
};

// Simple mock auth functions 
export function useAuth() {
  return {
    user: mockUser,
    isLoading: false,
    error: null,
    loginMutation: {
      mutate: () => {},
      isPending: false,
    },
    logoutMutation: {
      mutate: () => {},
      isPending: false,
    },
    registerMutation: {
      mutate: () => {},
      isPending: false,
    }
  };
}

// Simplified auth provider that just passes children through
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
