import fetch from 'node-fetch';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';
import { CodeSnippet } from './codeSnippetService.js';

/**
 * Represents a shared snippet including metadata for sharing
 */
export interface SharedSnippet {
  shareId: string;
  snippet: CodeSnippet;
  expiresAt?: Date;
  accessCount: number;
  created: Date;
  shortLink: string;
  password?: string;
}

/**
 * Share options for creating a new shared snippet
 */
export interface ShareOptions {
  expiryHours?: number;
  maxAccesses?: number;
  password?: string;
  includeTags?: boolean;
  includeContext?: boolean;
}

/**
 * Service for sharing code snippets
 */
export class SnippetSharingService extends EventEmitter {
  private sharedSnippetsDir: string;
  private sharedSnippetsFile: string;
  private sharedSnippets: Map<string, SharedSnippet> = new Map();
  private initialized = false;
  private sharingServerUrl: string;

  /**
   * Constructor
   * @param serverUrl Optional server URL for snippet sharing
   * @param baseDir Optional base directory for storing shared snippets
   */
  constructor(serverUrl?: string, baseDir?: string) {
    super();

    // Default to localhost for demo/development
    this.sharingServerUrl = serverUrl || 'https://share.codeagent.dev';

    // Set up directories
    const codeagentDir = baseDir || path.join(os.homedir(), '.codeagent');
    this.sharedSnippetsDir = path.join(codeagentDir, 'shared');
    this.sharedSnippetsFile = path.join(this.sharedSnippetsDir, 'shared-snippets.json');
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Create shared snippets directory if it doesn't exist
      await fs.mkdir(this.sharedSnippetsDir, { recursive: true });

      // Try to load shared snippets from file
      try {
        const data = await fs.readFile(this.sharedSnippetsFile, 'utf-8');
        const sharedSnippetsArray = JSON.parse(data) as SharedSnippet[];

        // Populate map
        this.sharedSnippets.clear();
        sharedSnippetsArray.forEach(sharedSnippet => {
          // Convert date strings to Date objects
          sharedSnippet.created = new Date(sharedSnippet.created);
          if (sharedSnippet.expiresAt) {
            sharedSnippet.expiresAt = new Date(sharedSnippet.expiresAt);
          }
          this.sharedSnippets.set(sharedSnippet.shareId, sharedSnippet);
        });

        this.emit('loaded', { count: this.sharedSnippets.size });
      } catch (error) {
        // File doesn't exist or is invalid, create a new one
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          await this.saveSharedSnippets();
          this.emit('created', { file: this.sharedSnippetsFile });
        } else {
          throw error;
        }
      }

      this.initialized = true;
    } catch (error) {
      this.emit('error', {
        message: `Failed to initialize snippet sharing service: ${(error as Error).message}`,
      });
      throw error;
    }
  }

  /**
   * Share a snippet
   * @param snippet The snippet to share
   * @param options Sharing options
   */
  async shareSnippet(snippet: CodeSnippet, options: ShareOptions = {}): Promise<SharedSnippet> {
    await this.ensureInitialized();

    // Create shared snippet object
    const shareId = this.generateShareId();
    const now = new Date();

    // Calculate expiry date if specified
    let expiresAt: Date | undefined = undefined;
    if (options.expiryHours && options.expiryHours > 0) {
      expiresAt = new Date(now.getTime() + options.expiryHours * 60 * 60 * 1000);
    }

    // Process snippet for sharing (removing certain fields if needed)
    const snippetToShare = { ...snippet };

    // Remove tags if specified
    if (options.includeTags === false) {
      snippetToShare.tags = [];
    }

    // Remove context if specified
    if (options.includeContext === false) {
      snippetToShare.context = [];
    }

    // Generate password hash if password is provided
    let passwordHash: string | undefined = undefined;
    if (options.password) {
      passwordHash = this.hashPassword(options.password);
    }

    // Create short link
    const shortLink = `${this.sharingServerUrl}/${shareId}`;

    const sharedSnippet: SharedSnippet = {
      shareId,
      snippet: snippetToShare,
      expiresAt,
      accessCount: 0,
      created: now,
      shortLink,
      password: passwordHash,
    };

    // Add to map and save
    this.sharedSnippets.set(shareId, sharedSnippet);
    await this.saveSharedSnippets();

    this.emit('shared', { shareId, shortLink });

    return sharedSnippet;
  }

  /**
   * Get a shared snippet by ID
   */
  async getSharedSnippet(shareId: string, password?: string): Promise<SharedSnippet | null> {
    await this.ensureInitialized();

    const sharedSnippet = this.sharedSnippets.get(shareId);
    if (!sharedSnippet) {
      return null;
    }

    // Check if expired
    if (sharedSnippet.expiresAt && sharedSnippet.expiresAt < new Date()) {
      return null;
    }

    // Check password if set
    if (sharedSnippet.password) {
      if (!password) {
        this.emit('error', { message: 'Password required to access this snippet' });
        return null;
      }

      const passwordHash = this.hashPassword(password);
      if (passwordHash !== sharedSnippet.password) {
        this.emit('error', { message: 'Incorrect password' });
        return null;
      }
    }

    // Increment access count
    sharedSnippet.accessCount++;
    await this.saveSharedSnippets();

    this.emit('accessed', { shareId, accessCount: sharedSnippet.accessCount });

    return sharedSnippet;
  }

  /**
   * List all shared snippets
   */
  async listSharedSnippets(): Promise<SharedSnippet[]> {
    await this.ensureInitialized();

    // Return a sorted list (newest first)
    return Array.from(this.sharedSnippets.values()).sort(
      (a, b) => b.created.getTime() - a.created.getTime()
    );
  }

  /**
   * Revoke a shared snippet
   */
  async revokeSharedSnippet(shareId: string): Promise<boolean> {
    await this.ensureInitialized();

    const hasSharedSnippet = this.sharedSnippets.has(shareId);
    if (!hasSharedSnippet) {
      return false;
    }

    this.sharedSnippets.delete(shareId);
    await this.saveSharedSnippets();

    this.emit('revoked', { shareId });

    return true;
  }

  /**
   * Clean up expired shared snippets
   */
  async cleanupExpiredSnippets(): Promise<number> {
    await this.ensureInitialized();

    const now = new Date();
    let count = 0;

    for (const [shareId, sharedSnippet] of this.sharedSnippets.entries()) {
      if (sharedSnippet.expiresAt && sharedSnippet.expiresAt < now) {
        this.sharedSnippets.delete(shareId);
        count++;
      }
    }

    if (count > 0) {
      await this.saveSharedSnippets();
      this.emit('cleaned', { count });
    }

    return count;
  }

  /**
   * Upload a shared snippet to the sharing server
   * In a real implementation, this would communicate with an actual API
   * For demo purposes, we're simulating the upload
   */
  async uploadSharedSnippet(shareId: string): Promise<{ url: string }> {
    await this.ensureInitialized();

    const sharedSnippet = this.sharedSnippets.get(shareId);
    if (!sharedSnippet) {
      throw new Error(`Shared snippet with ID ${shareId} not found`);
    }

    try {
      // In a real implementation, this would make an API call
      // For demo purposes, we're just simulating the upload

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate a URL for accessing the snippet
      const accessUrl = `${this.sharingServerUrl}/${shareId}`;

      this.emit('uploaded', { shareId, url: accessUrl });

      return { url: accessUrl };
    } catch (error) {
      this.emit('error', {
        message: `Failed to upload shared snippet: ${(error as Error).message}`,
      });
      throw error;
    }
  }

  /**
   * Get snippet sharing statistics
   */
  async getShareStats(): Promise<{
    totalShares: number;
    activeShares: number;
    totalAccesses: number;
    passwordProtected: number;
  }> {
    await this.ensureInitialized();

    const now = new Date();
    let totalAccesses = 0;
    let passwordProtected = 0;
    let activeShares = 0;

    for (const sharedSnippet of this.sharedSnippets.values()) {
      totalAccesses += sharedSnippet.accessCount;

      if (sharedSnippet.password) {
        passwordProtected++;
      }

      if (!sharedSnippet.expiresAt || sharedSnippet.expiresAt >= now) {
        activeShares++;
      }
    }

    return {
      totalShares: this.sharedSnippets.size,
      activeShares,
      totalAccesses,
      passwordProtected,
    };
  }

  /**
   * Generate QR code for a shared snippet
   * Returns path to the generated QR code image
   */
  async generateQrCode(shareId: string): Promise<string> {
    await this.ensureInitialized();

    const sharedSnippet = this.sharedSnippets.get(shareId);
    if (!sharedSnippet) {
      throw new Error(`Shared snippet with ID ${shareId} not found`);
    }

    try {
      // Import qrcode dynamically to avoid issues with import in non-browser environments
      const QRCode = (await import('qrcode')).default;

      // Create QR code for the URL
      const qrCodePath = path.join(this.sharedSnippetsDir, `${shareId}-qrcode.png`);
      await QRCode.toFile(qrCodePath, sharedSnippet.shortLink, {
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 300,
      });

      this.emit('qrCodeGenerated', { shareId, path: qrCodePath });

      return qrCodePath;
    } catch (error) {
      this.emit('error', { message: `Failed to generate QR code: ${(error as Error).message}` });
      throw error;
    }
  }

  /**
   * Save shared snippets to file
   */
  private async saveSharedSnippets(): Promise<void> {
    const sharedSnippetsArray = Array.from(this.sharedSnippets.values());
    await fs.writeFile(
      this.sharedSnippetsFile,
      JSON.stringify(sharedSnippetsArray, null, 2),
      'utf-8'
    );
  }

  /**
   * Generate a unique share ID
   */
  private generateShareId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Hash a password for secure storage
   */
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}
