import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface CredentialEntry {
  id: string;
  name: string;
  type: 'api_key' | 'certificate' | 'password' | 'token';
  environment: 'production' | 'staging' | 'development';
  expiresAt: Date;
  lastRotated: Date;
  rotationInterval: number; // days
  autoRotate: boolean;
  status: 'active' | 'expired' | 'rotating' | 'failed';
}

export interface RotationSchedule {
  credentialId: string;
  scheduledFor: Date;
  type: 'automatic' | 'manual';
  priority: 'high' | 'medium' | 'low';
}

export class CredentialRotationService extends EventEmitter {
  private credentials: Map<string, CredentialEntry> = new Map();
  private rotationSchedule: Map<string, RotationSchedule> = new Map();
  private rotationTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeCredentials();
    this.startRotationScheduler();
    console.log('[CredentialRotation] Credential rotation service initialized');
  }

  private initializeCredentials(): void {
    const sampleCredentials: CredentialEntry[] = [
      {
        id: 'api-key-gis',
        name: 'GIS API Key',
        type: 'api_key',
        environment: 'production',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        lastRotated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        rotationInterval: 90,
        autoRotate: true,
        status: 'active'
      },
      {
        id: 'cert-ssl-wildcard',
        name: 'SSL Wildcard Certificate',
        type: 'certificate',
        environment: 'production',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        lastRotated: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
        rotationInterval: 365,
        autoRotate: false,
        status: 'active'
      },
      {
        id: 'token-state-db',
        name: 'State Database Token',
        type: 'token',
        environment: 'production',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        lastRotated: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        rotationInterval: 30,
        autoRotate: true,
        status: 'active'
      }
    ];

    sampleCredentials.forEach(cred => {
      this.credentials.set(cred.id, cred);
    });

    console.log(`[CredentialRotation] Initialized ${sampleCredentials.length} credentials`);
  }

  private startRotationScheduler(): void {
    this.rotationTimer = setInterval(() => {
      this.checkRotationSchedule();
    }, 60 * 60 * 1000); // Check every hour

    console.log('[CredentialRotation] Rotation scheduler started');
  }

  private async checkRotationSchedule(): Promise<void> {
    const now = new Date();
    
    for (const credential of this.credentials.values()) {
      if (this.needsRotation(credential, now)) {
        await this.scheduleRotation(credential.id, 'automatic');
      }
    }
  }

  private needsRotation(credential: CredentialEntry, now: Date): boolean {
    if (!credential.autoRotate) return false;
    
    const daysSinceRotation = Math.floor((now.getTime() - credential.lastRotated.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilExpiry = Math.floor((credential.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Rotate if 80% of rotation interval has passed or within 7 days of expiry
    return daysSinceRotation >= (credential.rotationInterval * 0.8) || daysUntilExpiry <= 7;
  }

  async scheduleRotation(credentialId: string, type: 'automatic' | 'manual' = 'manual'): Promise<string> {
    const credential = this.credentials.get(credentialId);
    if (!credential) {
      throw new Error(`Credential not found: ${credentialId}`);
    }

    const scheduleId = `rotation-${Date.now()}`;
    const scheduledFor = type === 'automatic' ? new Date(Date.now() + 60000) : new Date(); // 1 minute delay for auto
    
    const schedule: RotationSchedule = {
      credentialId,
      scheduledFor,
      type,
      priority: this.calculatePriority(credential)
    };

    this.rotationSchedule.set(scheduleId, schedule);
    
    console.log(`[CredentialRotation] Scheduled ${type} rotation for ${credential.name}`);
    this.emit('rotation_scheduled', { credentialId, scheduleId, type });

    // Execute rotation if scheduled for now
    if (scheduledFor.getTime() <= Date.now()) {
      setImmediate(() => this.executeRotation(credentialId));
    }

    return scheduleId;
  }

  private calculatePriority(credential: CredentialEntry): 'high' | 'medium' | 'low' {
    const daysUntilExpiry = Math.floor((credential.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 7 || credential.environment === 'production') {
      return 'high';
    } else if (daysUntilExpiry <= 30) {
      return 'medium';
    }
    return 'low';
  }

  private async executeRotation(credentialId: string): Promise<void> {
    const credential = this.credentials.get(credentialId);
    if (!credential) return;

    try {
      credential.status = 'rotating';
      console.log(`[CredentialRotation] Starting rotation for ${credential.name}`);
      this.emit('rotation_started', credential);

      const newCredential = await this.rotateCredential(credential);
      
      credential.lastRotated = new Date();
      credential.expiresAt = newCredential.expiresAt;
      credential.status = 'active';

      console.log(`[CredentialRotation] Successfully rotated ${credential.name}`);
      this.emit('rotation_completed', credential);

    } catch (error) {
      credential.status = 'failed';
      console.error(`[CredentialRotation] Failed to rotate ${credential.name}:`, error);
      this.emit('rotation_failed', { credential, error });
    }
  }

  private async rotateCredential(credential: CredentialEntry): Promise<{ expiresAt: Date }> {
    // Simulate credential rotation based on type
    switch (credential.type) {
      case 'api_key':
        return this.rotateApiKey(credential);
      case 'certificate':
        return this.rotateCertificate(credential);
      case 'token':
        return this.rotateToken(credential);
      case 'password':
        return this.rotatePassword(credential);
      default:
        throw new Error(`Unsupported credential type: ${credential.type}`);
    }
  }

  private async rotateApiKey(credential: CredentialEntry): Promise<{ expiresAt: Date }> {
    console.log(`[CredentialRotation] Rotating API key for ${credential.name}`);
    
    // Generate new API key
    const newKey = 'sk-' + crypto.randomBytes(32).toString('hex');
    
    // Simulate API call to update key
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      expiresAt: new Date(Date.now() + credential.rotationInterval * 24 * 60 * 60 * 1000)
    };
  }

  private async rotateCertificate(credential: CredentialEntry): Promise<{ expiresAt: Date }> {
    console.log(`[CredentialRotation] Rotating certificate for ${credential.name}`);
    
    // Generate new certificate
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return {
      expiresAt: new Date(Date.now() + credential.rotationInterval * 24 * 60 * 60 * 1000)
    };
  }

  private async rotateToken(credential: CredentialEntry): Promise<{ expiresAt: Date }> {
    console.log(`[CredentialRotation] Rotating token for ${credential.name}`);
    
    // Generate new token
    const newToken = crypto.randomBytes(64).toString('base64');
    
    // Simulate token refresh API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      expiresAt: new Date(Date.now() + credential.rotationInterval * 24 * 60 * 60 * 1000)
    };
  }

  private async rotatePassword(credential: CredentialEntry): Promise<{ expiresAt: Date }> {
    console.log(`[CredentialRotation] Rotating password for ${credential.name}`);
    
    // Generate secure password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let newPassword = '';
    for (let i = 0; i < 16; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Simulate password update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      expiresAt: new Date(Date.now() + credential.rotationInterval * 24 * 60 * 60 * 1000)
    };
  }

  getAllCredentials(): CredentialEntry[] {
    return Array.from(this.credentials.values());
  }

  getCredential(credentialId: string): CredentialEntry | null {
    return this.credentials.get(credentialId) || null;
  }

  getExpiringCredentials(days: number = 30): CredentialEntry[] {
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    return Array.from(this.credentials.values()).filter(
      cred => cred.expiresAt <= cutoff
    );
  }

  getRotationHistory(): any[] {
    // In real implementation, this would query a log database
    return Array.from(this.credentials.values()).map(cred => ({
      credentialId: cred.id,
      name: cred.name,
      lastRotated: cred.lastRotated,
      nextRotation: new Date(cred.lastRotated.getTime() + cred.rotationInterval * 24 * 60 * 60 * 1000),
      status: cred.status
    }));
  }

  async addCredential(credential: Omit<CredentialEntry, 'id' | 'lastRotated' | 'status'>): Promise<CredentialEntry> {
    const newCredential: CredentialEntry = {
      ...credential,
      id: `cred-${Date.now()}`,
      lastRotated: new Date(),
      status: 'active'
    };

    this.credentials.set(newCredential.id, newCredential);
    
    console.log(`[CredentialRotation] Added new credential: ${newCredential.name}`);
    this.emit('credential_added', newCredential);
    
    return newCredential;
  }

  async updateCredential(credentialId: string, updates: Partial<CredentialEntry>): Promise<CredentialEntry | null> {
    const credential = this.credentials.get(credentialId);
    if (!credential) return null;

    const updatedCredential = { ...credential, ...updates };
    this.credentials.set(credentialId, updatedCredential);
    
    console.log(`[CredentialRotation] Updated credential: ${updatedCredential.name}`);
    this.emit('credential_updated', updatedCredential);
    
    return updatedCredential;
  }

  async removeCredential(credentialId: string): Promise<boolean> {
    const credential = this.credentials.get(credentialId);
    if (!credential) return false;

    this.credentials.delete(credentialId);
    
    console.log(`[CredentialRotation] Removed credential: ${credential.name}`);
    this.emit('credential_removed', { credentialId, name: credential.name });
    
    return true;
  }

  getRotationSummary(): {
    totalCredentials: number;
    activeCredentials: number;
    expiringCredentials: number;
    failedRotations: number;
    nextRotation?: Date;
  } {
    const credentials = Array.from(this.credentials.values());
    const expiring = this.getExpiringCredentials(30);
    const failed = credentials.filter(c => c.status === 'failed');
    
    const nextRotations = credentials
      .filter(c => c.autoRotate)
      .map(c => new Date(c.lastRotated.getTime() + c.rotationInterval * 24 * 60 * 60 * 1000))
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      totalCredentials: credentials.length,
      activeCredentials: credentials.filter(c => c.status === 'active').length,
      expiringCredentials: expiring.length,
      failedRotations: failed.length,
      nextRotation: nextRotations[0]
    };
  }

  stop(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
    console.log('[CredentialRotation] Credential rotation service stopped');
  }
}

// Export singleton instance
export const credentialRotationService = new CredentialRotationService();