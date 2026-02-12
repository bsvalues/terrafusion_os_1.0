import { useState, useEffect } from 'react';

/**
 * User information interface
 */
export interface User {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  isLoggedIn: boolean;
}

/**
 * Hook for accessing the current user
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        
        // TODO: Replace with actual API call
        // For now, we'll use a consistent user for testing
        setTimeout(() => {
          const mockUser: User = {
            id: 'user_123456',
            username: 'testuser',
            displayName: 'Test User',
            isLoggedIn: true
          };
          
          setUser(mockUser);
          setLoading(false);
        }, 300);
      } catch (err) {
        setError('Failed to fetch user information');
        setLoading(false);
        console.error('Error fetching user:', err);
      }
    }
    
    fetchUser();
  }, []);

  /**
   * Updates user information
   */
  const updateUser = async (userData: Partial<User>) => {
    if (!user) return false;
    
    try {
      // TODO: Replace with actual API call
      setTimeout(() => {
        setUser({ ...user, ...userData });
      }, 300);
      
      return true;
    } catch (err) {
      console.error('Error updating user:', err);
      return false;
    }
  };

  /**
   * Logs out the current user
   */
  const logout = async () => {
    try {
      // TODO: Replace with actual API call
      setTimeout(() => {
        setUser(null);
      }, 300);
      
      return true;
    } catch (err) {
      console.error('Error logging out:', err);
      return false;
    }
  };

  return {
    user,
    loading,
    error,
    updateUser,
    logout,
  };
}