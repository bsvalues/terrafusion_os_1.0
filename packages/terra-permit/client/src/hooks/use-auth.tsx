import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  organizationId: number;
  organizationName: string;
  organizationSlug: string;
  role: string;
}

interface AuthContextType {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<CurrentUser | null>;
}

interface RegisterData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionID, setSessionID] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Mock user for development mode
  const mockUser: CurrentUser = {
    id: 1,
    username: "testuser",
    email: "testuser@example.com",
    firstName: "Test",
    lastName: "User",
    organizationId: 1,
    organizationName: "Test Organization",
    organizationSlug: "test-org",
    role: "admin"
  };

  // In production mode, use normal authentication
  const isDevelopment = false; // Disabled for production use

  useEffect(() => {
    if (isDevelopment) {
      // Use mock user in development mode
      setUser(mockUser);
      setIsLoading(false);
    } else {
      // Normal authentication in production
      refreshUser().finally(() => setIsLoading(false));
    }
  }, []);

  // Extract session ID from cookie for debugging and tracking changes
  const extractSessionId = (): string | null => {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('permits.app.sid='));
    return sessionCookie ? sessionCookie.trim().split('=')[1] : null;
  };
  
  // Check if we need to refresh the page due to session changes
  useEffect(() => {
    const currentSessionId = extractSessionId();
    console.log('Auth: Current session ID:', currentSessionId);
    
    // Initialize session ID on first render
    if (sessionID === null && currentSessionId) {
      setSessionID(currentSessionId);
    }
    
    // If we have a previous session ID and it changes, we might need to reload
    if (sessionID && currentSessionId && sessionID !== currentSessionId) {
      console.log('Auth: Session ID changed from', sessionID, 'to', currentSessionId);
      
      // If the user was logged in before but session changed, consider page reload
      if (user) {
        console.log('Auth: Session ID changed while user was logged in, refreshing state...');
        refreshUser();
      }
    }
  }, [sessionID, user]);
  
  async function refreshUser(): Promise<CurrentUser | null> {
    try {
      console.log('Auth: Refreshing user profile...');
      
      // Check for session ID changes
      const currentSessionId = extractSessionId();
      if (currentSessionId !== sessionID) {
        console.log('Auth: Session ID changed during refresh:', 
                    { previous: sessionID, current: currentSessionId });
        if (currentSessionId) {
          setSessionID(currentSessionId);
        }
      }
      
      // Get auth token from session storage for explicit inclusion
      const authToken = sessionStorage.getItem('x-auth-token');
      console.log('Auth: Using auth token for profile refresh:', authToken ? `${authToken.substring(0, 10)}...` : 'none');
      
      // Create headers with auth token if available
      const headers: Record<string, string> = {};
      if (authToken) {
        headers["X-Auth-Token"] = authToken;
      }
      
      // Explicitly include credentials and auth token in the request
      const data = await apiRequest<CurrentUser>({
        url: "/api/auth/me",
        method: "GET",
        credentials: "include",
        headers: headers
      });
      
      console.log('Auth: User profile refreshed successfully:', data);
      setUser(data);
      
      // If we have a non-secure cookie tracker for compatibility
      if (document.cookie.includes('x-logged-in=true')) {
        console.log('Auth: Found logged-in tracker cookie');
      }
      
      // Check if the state of stored auth token matches our current user
      // This ensures consistency between token and user state
      const storedAuthToken = sessionStorage.getItem('x-auth-token');
      if (!storedAuthToken && data) {
        console.warn('Auth: User is authenticated but no auth token in storage');
      }
      
      return data;
    } catch (error) {
      console.error('Auth: Failed to refresh user profile:', error);
      
      // Check if we have our non-secure cookie indicator but session is missing
      if (document.cookie.includes('x-logged-in=true')) {
        console.log('Auth: Found logged-in tracker cookie despite session error - possible session cookie issue');
        
        // We have the login cookie but not the session - consider page reload
        if (!sessionID) {
          console.log('Auth: Detected login cookie without session, consider reloading page');
        }
      }
      
      // Check if we have a token but got an auth error
      const authToken = sessionStorage.getItem('x-auth-token');
      if (authToken) {
        // Track auth error count to prevent infinite loops
        let authErrorCount = parseInt(localStorage.getItem('auth-error-count') || '0');
        authErrorCount++;
        localStorage.setItem('auth-error-count', authErrorCount.toString());
        
        console.log(`Auth: Auth token exists but request failed (error count: ${authErrorCount})`);
        
        // If we've had too many errors with this token, clear it
        if (authErrorCount > 3) {
          console.log('Auth: Too many auth failures with token, clearing token');
          sessionStorage.removeItem('x-auth-token');
          localStorage.removeItem('auth-error-count');
        }
      }
      
      // Don't immediately set user to null on first error
      // This prevents flickering/logout on transient errors
      if (user) {
        // If we have too many failures, then do clear the user
        const authErrorCount = parseInt(localStorage.getItem('auth-error-count') || '0');
        if (authErrorCount > 3) {
          console.log('Auth: Too many auth failures, clearing user state');
          setUser(null);
          return null;
        }
        
        console.log('Auth: Keeping existing user state despite refresh error');
        return user; // Return existing user if we already have one
      }
      
      setUser(null);
      return null;
    }
  }

  async function login(username: string, password: string) {
    setIsLoading(true);
    try {
      console.log('Auth: Attempting login...');
      
      // Add credentials explicitly to ensure cookies are sent with request
      const loginResponse = await apiRequest({
        url: "/api/auth/login",
        method: "POST",
        body: { username, password },
        credentials: "include" 
      });
      console.log('Auth: Login API response received:', loginResponse);
      
      // Extract auth token from response
      const authToken = loginResponse.authToken || 
                        (loginResponse.headers && loginResponse.headers['x-auth-token']) || 
                        null;
      
      if (authToken) {
        console.log('Auth: Auth token extracted from response:', authToken.substring(0, 10) + '...');
        // Store the auth token in sessionStorage for future requests
        sessionStorage.setItem('x-auth-token', authToken);
      } else {
        console.warn('Auth: No auth token found in login response');
      }
      
      // Check for x-logged-in cookie to track login state
      const hasLoginCookie = document.cookie.includes('x-logged-in=true');
      console.log('Auth: Login cookie present:', hasLoginCookie);
      
      // Extract and set user data directly from login response
      if (loginResponse.user) {
        console.log('Auth: User data found in login response');
        
        // Format user data to match CurrentUser interface
        const userData: CurrentUser = {
          id: loginResponse.user.id,
          username: loginResponse.user.username,
          email: loginResponse.user.email,
          firstName: loginResponse.user.firstName || undefined,
          lastName: loginResponse.user.lastName || undefined,
          avatarUrl: loginResponse.user.avatarUrl || undefined,
          organizationId: loginResponse.organization.id,
          organizationName: loginResponse.organization.name,
          organizationSlug: loginResponse.organization.slug,
          role: loginResponse.role
        };
        
        setUser(userData);
        
        console.log('Auth: Login successful');
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/");
        return;
      }
      
      // Fallback: If user data not in login response, fetch it from /api/auth/me
      console.log('Auth: User data not in login response, fetching from /api/auth/me');
      
      // Create headers with auth token
      const headers: Record<string, string> = {};
      if (authToken) {
        headers["X-Auth-Token"] = authToken;
      }
      
      // Fetch user data
      const userData = await apiRequest<CurrentUser>({
        url: "/api/auth/me",
        method: "GET",
        credentials: "include",
        headers: headers
      });
      
      if (userData) {
        console.log('Auth: User profile fetch successful');
        setUser(userData);
        
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/");
      } else {
        throw new Error('Login succeeded but user data could not be retrieved. Please try again.');
      }
    } catch (error: any) {
      console.error('Auth: Login failed:', error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function register(userData: RegisterData) {
    setIsLoading(true);
    try {
      await apiRequest({
        url: "/api/auth/register",
        method: "POST",
        body: userData,
      });
      await refreshUser();
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    try {
      console.log('Auth: Logging out...');
      
      // Make logout request
      await apiRequest({
        url: "/api/auth/logout",
        method: "POST",
      });
      
      // Clear user state
      setUser(null);
      
      // Clear auth token from session storage
      console.log('Auth: Clearing auth token from storage');
      sessionStorage.removeItem('x-auth-token');
      
      // Reset error tracking
      localStorage.removeItem('auth-error-count');
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      
      // Navigate to login page
      navigate("/auth");
    } catch (error: any) {
      console.error('Auth: Logout failed:', error);
      
      // Even if server-side logout fails, clear local state
      setUser(null);
      sessionStorage.removeItem('x-auth-token');
      localStorage.removeItem('auth-error-count');
      
      toast({
        title: "Logout failed",
        description: error.message || "Could not log out properly, but you've been logged out locally",
        variant: "destructive",
      });
      
      // Still navigate to login page
      navigate("/auth");
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Note: ProtectedRoute component is now defined in its own file
// at client/src/components/ProtectedRoute.tsx