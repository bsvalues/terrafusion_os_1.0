import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { AuthService } from "./AuthService";

/**
 * Security levels for different types of data
 */
export enum SecurityLevel {
  /**
   * Non-sensitive data that doesn't need to be encrypted.
   * Stored using AsyncStorage.
   */
  NORMAL = "normal",

  /**
   * Sensitive data that should be encrypted.
   * Stored using SecureStore.
   */
  SENSITIVE = "sensitive",

  /**
   * Highly sensitive data that should be encrypted and
   * requires biometric authentication to access.
   * Stored using SecureStore with an additional encryption layer.
   */
  VERY_SENSITIVE = "very_sensitive",
}

/**
 * Secure storage options
 */
interface SecureStorageOptions {
  /**
   * Security level for the data
   */
  securityLevel: SecurityLevel;

  /**
   * Whether to require biometric authentication
   * (only applicable for VERY_SENSITIVE data)
   */
  requireBiometrics?: boolean;

  /**
   * Reason to show for biometric authentication
   */
  biometricReason?: string;
}

/**
 * Default storage options
 */
const DEFAULT_OPTIONS: SecureStorageOptions = {
  securityLevel: SecurityLevel.NORMAL,
  requireBiometrics: false,
  biometricReason: "Authenticate to access data",
};

/**
 * SecureStorageService
 *
 * Provides encryption and secure storage for different types of data
 * with varying security levels.
 */
export class SecureStorageService {
  private static instance: SecureStorageService;
  private authService: AuthService;
  private encryptionKey: string | null = null;

  // Prefix for keys in storage
  private readonly STORAGE_PREFIX = "terrafield:secure:";
  private readonly ENCRYPTION_KEY_KEY = "terrafield:secure:encryption_key";

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.authService = AuthService.getInstance();
    this.generateEncryptionKey();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  /**
   * Generate an encryption key for very sensitive data
   */
  private async generateEncryptionKey(): Promise<void> {
    try {
      // Try to retrieve an existing key
      const storedKey = await SecureStore.getItemAsync(this.ENCRYPTION_KEY_KEY);

      if (storedKey) {
        this.encryptionKey = storedKey;
      } else {
        // Generate a new random key
        const randomBytes = await Crypto.getRandomBytesAsync(32);
        const key = Array.from(randomBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        // Store the key in secure storage
        await SecureStore.setItemAsync(this.ENCRYPTION_KEY_KEY, key);

        this.encryptionKey = key;
      }
    } catch (error) {
      console.error("Error generating encryption key:", error);
    }
  }

  /**
   * Store data securely
   */
  public async storeData<T>(
    key: string,
    data: T,
    options: Partial<SecureStorageOptions> = {}
  ): Promise<boolean> {
    try {
      const fullOptions: SecureStorageOptions = { ...DEFAULT_OPTIONS, ...options };
      const storageKey = this.STORAGE_PREFIX + key;

      // Convert data to string
      const dataString = JSON.stringify(data);

      // Store based on security level
      switch (fullOptions.securityLevel) {
        case SecurityLevel.NORMAL:
          // Store in AsyncStorage
          await AsyncStorage.setItem(storageKey, dataString);
          break;

        case SecurityLevel.SENSITIVE:
          // Store in SecureStore
          await SecureStore.setItemAsync(storageKey, dataString);
          break;

        case SecurityLevel.VERY_SENSITIVE:
          // Encrypt and store in SecureStore
          if (!this.encryptionKey) {
            await this.generateEncryptionKey();
          }

          if (!this.encryptionKey) {
            throw new Error("Failed to generate encryption key");
          }

          // Encrypt the data
          const encryptedData = await this.encrypt(dataString, this.encryptionKey);

          // Store the encrypted data
          await SecureStore.setItemAsync(storageKey, encryptedData);

          // Also store metadata about biometric requirement
          if (fullOptions.requireBiometrics) {
            await AsyncStorage.setItem(
              `${storageKey}:biometric`,
              JSON.stringify({
                required: true,
                reason: fullOptions.biometricReason || DEFAULT_OPTIONS.biometricReason,
              })
            );
          }
          break;
      }

      return true;
    } catch (error) {
      console.error("Error storing secure data:", error);
      return false;
    }
  }

  /**
   * Retrieve data securely
   */
  public async getData<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      const storageKey = this.STORAGE_PREFIX + key;

      // First check if this is a biometric-protected key
      const biometricData = await AsyncStorage.getItem(`${storageKey}:biometric`);

      if (biometricData) {
        const { required, reason } = JSON.parse(biometricData);

        if (required) {
          // Authenticate with biometrics
          const authenticated = await this.authService.authenticateWithBiometrics(reason);

          if (!authenticated) {
            console.warn("Biometric authentication failed");
            return defaultValue;
          }
        }
      }

      // Try to get from SecureStore first (for SENSITIVE and VERY_SENSITIVE)
      let dataString = await SecureStore.getItemAsync(storageKey);

      // If not found in SecureStore, try AsyncStorage (for NORMAL)
      if (!dataString) {
        dataString = await AsyncStorage.getItem(storageKey);
      }

      // If still not found, return default value
      if (!dataString) {
        return defaultValue;
      }

      // Check if the data is encrypted (for VERY_SENSITIVE)
      if (dataString.startsWith("encrypted:")) {
        if (!this.encryptionKey) {
          throw new Error("Encryption key not available");
        }

        // Decrypt the data
        const encryptedData = dataString.substring(10);
        dataString = await this.decrypt(encryptedData, this.encryptionKey);
      }

      // Parse and return the data
      return JSON.parse(dataString) as T;
    } catch (error) {
      console.error("Error retrieving secure data:", error);
      return defaultValue;
    }
  }

  /**
   * Remove data from storage
   */
  public async removeData(key: string): Promise<boolean> {
    try {
      const storageKey = this.STORAGE_PREFIX + key;

      // Remove from both storage types to be safe
      await SecureStore.deleteItemAsync(storageKey);
      await AsyncStorage.removeItem(storageKey);

      // Also remove any biometric metadata
      await AsyncStorage.removeItem(`${storageKey}:biometric`);

      return true;
    } catch (error) {
      console.error("Error removing secure data:", error);
      return false;
    }
  }

  /**
   * Encrypt data with a key
   */
  private async encrypt(data: string, key: string): Promise<string> {
    try {
      // Generate a random initialization vector (IV)
      const ivBytes = await Crypto.getRandomBytesAsync(16);
      const iv = Array.from(ivBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // In a real app, we would use AES encryption here
      // For this example, we'll use a simple XOR cipher with the key and IV
      const keyBytes = Buffer.from(key);
      const ivBuffer = Buffer.from(iv, "hex");
      const dataBytes = Buffer.from(data);

      // XOR the data with the key and IV
      const encryptedBytes = Buffer.alloc(dataBytes.length);
      for (let i = 0; i < dataBytes.length; i++) {
        encryptedBytes[i] =
          dataBytes[i] ^ keyBytes[i % keyBytes.length] ^ ivBuffer[i % ivBuffer.length];
      }

      // Convert to base64 and prepend with the IV
      const encryptedBase64 = encryptedBytes.toString("base64");

      // Return the encrypted data with a prefix to identify it
      return `encrypted:${iv}:${encryptedBase64}`;
    } catch (error) {
      console.error("Encryption error:", error);
      throw error;
    }
  }

  /**
   * Decrypt data with a key
   */
  private async decrypt(encryptedData: string, key: string): Promise<string> {
    try {
      // Split the encrypted data into IV and ciphertext
      const parts = encryptedData.split(":");
      if (parts.length !== 2) {
        throw new Error("Invalid encrypted data format");
      }

      const [iv, encryptedBase64] = parts;

      // Convert from base64
      const encryptedBytes = Buffer.from(encryptedBase64, "base64");
      const keyBytes = Buffer.from(key);
      const ivBuffer = Buffer.from(iv, "hex");

      // XOR the data with the key and IV to decrypt
      const decryptedBytes = Buffer.alloc(encryptedBytes.length);
      for (let i = 0; i < encryptedBytes.length; i++) {
        decryptedBytes[i] =
          encryptedBytes[i] ^ keyBytes[i % keyBytes.length] ^ ivBuffer[i % ivBuffer.length];
      }

      // Convert back to string
      return decryptedBytes.toString();
    } catch (error) {
      console.error("Decryption error:", error);
      throw error;
    }
  }
}
