// Terrafusion OS Protocol Definitions
// Phase 1/2: Minimal message contracts for OS core channel

export namespace OSProtocol {
  export enum MessageType {
    AUTH_INIT = 'auth.init',
    AUTH_SUCCESS = 'auth.success',
    AUTH_FAILURE = 'auth.failure',
    HEARTBEAT = 'heartbeat',
    MODULE_LOAD = 'module.load',
    MODULE_EVENT = 'module.event',
    AUDIT_LOG = 'audit.log',
    COUNTY_CONTEXT = 'county.context',
  }

  export interface BaseMessage {
    id: string;
    type: MessageType;
    timestamp: number; // epoch ms
    sessionId?: string;
  }

  export interface EncryptedCredentials {
    // Placeholder for future SecureVault envelope
    algorithm: 'AES-256-GCM' | string;
    ciphertext: string;
    iv: string;
    tag?: string;
  }

  export interface AuthMessage extends BaseMessage {
    countyId: 'benton';
    legacySystem: 'PACS_9.0';
    credentials?: EncryptedCredentials | null;
  }

  export interface HeartbeatMessage extends BaseMessage {
    payload?: Record<string, unknown>;
  }

  export interface AuditLogMessage extends BaseMessage {
    level?: 'info' | 'warn' | 'error';
    message: string;
    data?: Record<string, unknown>;
  }
}
