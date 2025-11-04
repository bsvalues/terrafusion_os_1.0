import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import jwtDecode from "jwt-decode";

// The API URL for authentication
// In a real app, this would come from a config file
const API_URL = "https://appraisalcore.replit.app";

/**
 * User model
 */
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
}

/**
 * JWT token structure
 */
interface JWTPayload {
  sub: string; // user ID
  username: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
}

/**
 * Authentication tokens
 */
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Authentication result
 */
interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Biometric authentication options
 */
export enum BiometricPreference {
  REQUIRED = "required",
  OPTIONAL = "optional",
  DISABLED = "disabled",
}

/**
 * Authentication service
 * Handles user authentication, session management, and biometric security
 */
export class AuthService {
  private static instance: AuthService;
  private tokens: AuthTokens | null = null;
  private currentUser: User | null = null;
  private biometricPreference: BiometricPreference = BiometricPreference.OPTIONAL;
  private biometricsAvailable: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;

  // Storage keys
  private readonly TOKENS_KEY = "terrafield:auth:tokens";
  private readonly USER_KEY = "terrafield:auth:user";
  private readonly BIOMETRIC_PREF_KEY = "terrafield:auth:biometric_pref";

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Initialize biometric check
    this.checkBiometricAvailability();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize the auth service
   * Loads saved tokens and user data from secure storage
   */
  public async initialize(): Promise<boolean> {
    try {
      // Load biometric preference
      const prefValue = await AsyncStorage.getItem(this.BIOMETRIC_PREF_KEY);
      if (prefValue) {
        this.biometricPreference = prefValue as BiometricPreference;
      }

      // Load tokens from secure storage
      const tokensJson = await SecureStore.getItemAsync(this.TOKENS_KEY);
      if (tokensJson) {
        this.tokens = JSON.parse(tokensJson) as AuthTokens;

        // Check if tokens are expired
        if (this.tokens.expiresAt < Date.now()) {
          // Try to refresh the token
          return await this.refreshTokens();
        }

        // Load user data
        const userJson = await SecureStore.getItemAsync(this.USER_KEY);
        if (userJson) {
          this.currentUser = JSON.parse(userJson) as User;
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error initializing auth service:", error);
      return false;
    }
  }

  /**
   * Check if biometric authentication is available on the device
   */
  private async checkBiometricAvailability(): Promise<void> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      this.biometricsAvailable = compatible && enrolled;

      if (!this.biometricsAvailable && this.biometricPreference === BiometricPreference.REQUIRED) {
        // If biometrics are required but not available, downgrade to optional
        this.biometricPreference = BiometricPreference.OPTIONAL;
        await AsyncStorage.setItem(this.BIOMETRIC_PREF_KEY, this.biometricPreference);
      }
    } catch (error) {
      console.error("Error checking biometric availability:", error);
      this.biometricsAvailable = false;
    }
  }

  /**
   * Get the biometric authentication types available on the device
   */
  public async getSupportedBiometricTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error("Error getting supported biometric types:", error);
      return [];
    }
  }

  /**
   * Login with username/email and password
   */
  public async login(usernameOrEmail: string, password: string): Promise<AuthResult> {
    try {
      // Make API request to login
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usernameOrEmail,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || "Login failed",
        };
      }

      const authData = await response.json();

      // Store tokens
      this.tokens = {
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        expiresAt: Date.now() + authData.expiresIn * 1000,
      };

      // Decode user data from token
      const decodedToken = jwtDecode<JWTPayload>(authData.accessToken);

      this.currentUser = {
        id: parseInt(decodedToken.sub),
        username: decodedToken.username,
        email: decodedToken.email,
        fullName: decodedToken.name,
        role: decodedToken.role,
        permissions: decodedToken.permissions,
      };

      // Save tokens and user data to secure storage
      await SecureStore.setItemAsync(this.TOKENS_KEY, JSON.stringify(this.tokens));
      await SecureStore.setItemAsync(this.USER_KEY, JSON.stringify(this.currentUser));

      return {
        success: true,
        user: this.currentUser,
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      };
    }
  }

  /**
   * Logout the current user
   */
  public async logout(): Promise<void> {
    try {
      // If we have tokens, call the logout API
      if (this.tokens) {
        try {
          // Attempt to revoke the token on the server
          await fetch(`${API_URL}/api/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.tokens.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              refreshToken: this.tokens.refreshToken,
            }),
          });
        } catch (error) {
          // Ignore server errors during logout
          console.warn("Error revoking token on server:", error);
        }
      }

      // Clear local storage
      await SecureStore.deleteItemAsync(this.TOKENS_KEY);
      await SecureStore.deleteItemAsync(this.USER_KEY);

      // Clear memory
      this.tokens = null;
      this.currentUser = null;
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, clear local state
      this.tokens = null;
      this.currentUser = null;
    }
  }

  /**
   * Check if the user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.tokens && !!this.currentUser && this.tokens.expiresAt > Date.now();
  }

  /**
   * Get the current user
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get the access token for API requests
   */
  public async getAccessToken(): Promise<string | null> {
    // Check if tokens exist
    if (!this.tokens) {
      return null;
    }

    // Check if token is expired or about to expire (within 5 minutes)
    if (this.tokens.expiresAt < Date.now() + 5 * 60 * 1000) {
      // Try to refresh the token
      const refreshed = await this.refreshTokens();
      if (!refreshed) {
        return null;
      }
    }

    return this.tokens.accessToken;
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshTokens(): Promise<boolean> {
    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Create a new refresh promise
    this.refreshPromise = (async () => {
      try {
        // Check if we have a refresh token
        if (!this.tokens || !this.tokens.refreshToken) {
          return false;
        }

        // Make API request to refresh token
        const response = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refreshToken: this.tokens.refreshToken,
          }),
        });

        if (!response.ok) {
          // If refresh fails, clear tokens and user data
          await this.logout();
          return false;
        }

        const authData = await response.json();

        // Update tokens
        this.tokens = {
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          expiresAt: Date.now() + authData.expiresIn * 1000,
        };

        // Decode user data from token
        const decodedToken = jwtDecode<JWTPayload>(authData.accessToken);

        this.currentUser = {
          id: parseInt(decodedToken.sub),
          username: decodedToken.username,
          email: decodedToken.email,
          fullName: decodedToken.name,
          role: decodedToken.role,
          permissions: decodedToken.permissions,
        };

        // Save tokens and user data to secure storage
        await SecureStore.setItemAsync(this.TOKENS_KEY, JSON.stringify(this.tokens));
        await SecureStore.setItemAsync(this.USER_KEY, JSON.stringify(this.currentUser));

        return true;
      } catch (error) {
        console.error("Token refresh error:", error);
        // If refresh fails, clear tokens and user data
        await this.logout();
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Perform biometric authentication
   */
  public async authenticateWithBiometrics(
    reason: string = "Authenticate to continue"
  ): Promise<boolean> {
    try {
      // Check if biometrics are available
      if (!this.biometricsAvailable) {
        // If biometrics are required but not available, return false
        if (this.biometricPreference === BiometricPreference.REQUIRED) {
          return false;
        }
        // If biometrics are optional or disabled, return true
        return true;
      }

      // If biometrics are disabled, return true
      if (this.biometricPreference === BiometricPreference.DISABLED) {
        return true;
      }

      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: "Use passcode",
      });

      return result.success;
    } catch (error) {
      console.error("Biometric authentication error:", error);

      // If biometrics are required, return false
      if (this.biometricPreference === BiometricPreference.REQUIRED) {
        return false;
      }

      // If biometrics are optional, return true
      return true;
    }
  }

  /**
   * Get the current biometric preference
   */
  public getBiometricPreference(): BiometricPreference {
    return this.biometricPreference;
  }

  /**
   * Set the biometric preference
   */
  public async setBiometricPreference(preference: BiometricPreference): Promise<void> {
    // If trying to set as required but biometrics aren't available, set as optional
    if (preference === BiometricPreference.REQUIRED && !this.biometricsAvailable) {
      preference = BiometricPreference.OPTIONAL;
    }

    this.biometricPreference = preference;
    await AsyncStorage.setItem(this.BIOMETRIC_PREF_KEY, preference);
  }

  /**
   * Check if biometrics are available on the device
   */
  public isBiometricsAvailable(): boolean {
    return this.biometricsAvailable;
  }

  /**
   * Check if the user has the required permission
   */
  public hasPermission(permission: string): boolean {
    return !!this.currentUser && this.currentUser.permissions.includes(permission);
  }

  /**
   * Check if the user has any of the required permissions
   */
  public hasAnyPermission(permissions: string[]): boolean {
    return !!this.currentUser && permissions.some((p) => this.currentUser!.permissions.includes(p));
  }

  /**
   * Check if the user has all of the required permissions
   */
  public hasAllPermissions(permissions: string[]): boolean {
    return (
      !!this.currentUser && permissions.every((p) => this.currentUser!.permissions.includes(p))
    );
  }
}
