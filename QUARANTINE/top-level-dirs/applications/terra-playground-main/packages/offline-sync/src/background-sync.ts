/**
 * Background Sync Manager
 *
 * Manages background synchronization of offline changes.
 */

import { EventEmitter } from 'events';
import { CRDTDocumentManager, SyncStatus } from './crdt-sync';
import { ConflictResolutionManager } from './conflict-resolution';

/**
 * Sync operation result
 */
export interface SyncResult {
  /** Success status */
  success: boolean;
  /** Document ID */
  docId: string;
  /** Error if any */
  error?: Error;
  /** Status message */
  message?: string;
  /** Sync timestamp */
  timestamp: number;
}

/**
 * Sync queue item
 */
export interface SyncQueueItem {
  /** Document ID */
  docId: string;
  /** Last attempt timestamp */
  lastAttempt?: number;
  /** Number of attempts */
  attempts: number;
  /** Whether the sync is in progress */
  inProgress: boolean;
  /** Priority (higher number = higher priority) */
  priority: number;
  /** Custom metadata */
  [key: string]: any;
}

/**
 * Background sync manager
 */
export class BackgroundSyncManager extends EventEmitter {
  private crdtManager: CRDTDocumentManager;
  private conflictManager: ConflictResolutionManager;
  private syncQueue: Map<string, SyncQueueItem> = new Map();
  private syncInterval: number;
  private maxRetries: number;
  private apiEndpoint: string;
  private isRunning: boolean = false;
  private intervalId: any = null;

  /**
   * Initialize a new background sync manager
   *
   * @param crdtManager CRDT document manager
   * @param conflictManager Conflict resolution manager
   * @param options Sync options
   */
  constructor(
    crdtManager: CRDTDocumentManager,
    conflictManager: ConflictResolutionManager,
    options: {
      syncInterval?: number;
      maxRetries?: number;
      apiEndpoint?: string;
    } = {}
  ) {
    super();
    this.crdtManager = crdtManager;
    this.conflictManager = conflictManager;
    this.syncInterval = options.syncInterval || 30000; // Default 30 seconds
    this.maxRetries = options.maxRetries || 5;
    this.apiEndpoint = options.apiEndpoint || '/api/sync';

    // Listen for document changes
    this.crdtManager.on('document:updated', ({ docId }) => {
      this.addToSyncQueue(docId);
    });
  }

  /**
   * Check if online
   *
   * @returns Whether the device is online
   */
  private isOnline(): boolean {
    // Check if the browser is online
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }

    return true; // Assume online in non-browser environments
  }

  /**
   * Add a document to the sync queue
   *
   * @param docId Document ID
   * @param priority Sync priority
   */
  addToSyncQueue(docId: string, priority: number = 1): void {
    const existingItem = this.syncQueue.get(docId);

    if (existingItem) {
      // Update priority if higher
      if (priority > existingItem.priority) {
        existingItem.priority = priority;
      }

      this.syncQueue.set(docId, existingItem);
    } else {
      // Add new item
      this.syncQueue.set(docId, {
        docId,
        attempts: 0,
        inProgress: false,
        priority,
      });

      // Update document metadata
      const metadata = this.crdtManager.getDocumentMetadata(docId);

      if (metadata) {
        metadata.syncStatus = SyncStatus.UNSYNCED;
        this.crdtManager.updateDocumentMetadata(docId, metadata).catch(error => {
          console.error('Error updating document metadata:', error);
        });
      }

      // Emit event
      this.emit('queue:added', { docId, priority });
    }

    // Start sync if not already running
    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Remove a document from the sync queue
   *
   * @param docId Document ID
   */
  removeFromSyncQueue(docId: string): void {
    this.syncQueue.delete(docId);

    // Emit event
    this.emit('queue:removed', { docId });
  }

  /**
   * Get the next document to sync
   *
   * @returns The next sync queue item or null if none
   */
  private getNextSyncItem(): SyncQueueItem | null {
    if (this.syncQueue.size === 0) {
      return null;
    }

    // Get highest priority items
    const items = Array.from(this.syncQueue.values())
      .filter(item => !item.inProgress && item.attempts < this.maxRetries)
      .sort((a, b) => {
        // Sort by priority (higher first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }

        // Then by attempts (fewer first)
        if (a.attempts !== b.attempts) {
          return a.attempts - b.attempts;
        }

        // Then by last attempt (older first)
        if (a.lastAttempt && b.lastAttempt) {
          return a.lastAttempt - b.lastAttempt;
        }

        return 0;
      });

    return items.length > 0 ? items[0] : null;
  }

  /**
   * Mark a sync as complete
   *
   * @param docId Document ID
   * @param success Whether the sync was successful
   * @param error Error if any
   */
  private markSyncComplete(docId: string, success: boolean, error?: Error): void {
    const item = this.syncQueue.get(docId);

    if (!item) {
      return;
    }

    if (success) {
      // Sync successful - remove from queue
      this.syncQueue.delete(docId);

      // Update document metadata
      const metadata = this.crdtManager.getDocumentMetadata(docId);

      if (metadata) {
        metadata.syncStatus = SyncStatus.SYNCED;
        metadata.lastSynced = Date.now();

        this.crdtManager.updateDocumentMetadata(docId, metadata).catch(error => {
          console.error('Error updating document metadata:', error);
        });
      }

      // Emit event
      this.emit('sync:complete', {
        success: true,
        docId,
        timestamp: Date.now(),
      });
    } else {
      // Sync failed - update attempt count
      item.attempts++;
      item.lastAttempt = Date.now();
      item.inProgress = false;

      this.syncQueue.set(docId, item);

      // Update document metadata
      const metadata = this.crdtManager.getDocumentMetadata(docId);

      if (metadata) {
        metadata.syncStatus = SyncStatus.FAILED;

        this.crdtManager.updateDocumentMetadata(docId, metadata).catch(error => {
          console.error('Error updating document metadata:', error);
        });
      }

      // Emit event
      this.emit('sync:failed', {
        success: false,
        docId,
        error,
        timestamp: Date.now(),
      });

      // If max retries reached, emit event
      if (item.attempts >= this.maxRetries) {
        this.emit('sync:max-retries', { docId, attempts: item.attempts });
      }
    }
  }

  /**
   * Sync a document
   *
   * @param docId Document ID
   * @returns Sync result
   */
  private async syncDocument(docId: string): Promise<SyncResult> {
    try {
      // Get the document updates
      const updates = this.crdtManager.getUpdates(docId);

      if (!updates) {
        throw new Error(`No updates available for document: ${docId}`);
      }

      // Mark as in progress
      const item = this.syncQueue.get(docId);

      if (item) {
        item.inProgress = true;
        this.syncQueue.set(docId, item);
      }

      // Update document metadata
      const metadata = this.crdtManager.getDocumentMetadata(docId);

      if (metadata) {
        metadata.syncStatus = SyncStatus.SYNCING;

        await this.crdtManager.updateDocumentMetadata(docId, metadata);
      }

      // Emit event
      this.emit('sync:started', { docId });

      // Send updates to server
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Document-ID': docId,
        },
        body: updates,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      // Get remote updates if any
      const remoteUpdates = await response.arrayBuffer();

      if (remoteUpdates.byteLength > 0) {
        // Apply remote updates
        await this.crdtManager.applyUpdates(docId, new Uint8Array(remoteUpdates));

        // Check for conflicts
        // (Typically handled by the CRDT system or conflict manager)
      }

      // Mark as complete
      this.markSyncComplete(docId, true);

      return {
        success: true,
        docId,
        message: 'Sync successful',
        timestamp: Date.now(),
      };
    } catch (error) {
      // Mark as failed
      this.markSyncComplete(docId, false, error as Error);

      return {
        success: false,
        docId,
        error: error as Error,
        message: `Sync failed: ${(error as Error).message}`,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Process the sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline()) {
      // Skip if offline
      return;
    }

    const item = this.getNextSyncItem();

    if (!item) {
      // No items to sync
      return;
    }

    await this.syncDocument(item.docId);

    // Process next item if available
    if (this.syncQueue.size > 0) {
      await this.processSyncQueue();
    }
  }

  /**
   * Start the sync manager
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Process queue immediately
    this.processSyncQueue().catch(error => {
      console.error('Error processing sync queue:', error);
    });

    // Set up interval
    this.intervalId = setInterval(() => {
      this.processSyncQueue().catch(error => {
        console.error('Error processing sync queue:', error);
      });
    }, this.syncInterval);

    // Listen for online events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onOnline);
    }

    // Emit event
    this.emit('started');
  }

  /**
   * Stop the sync manager
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onOnline);
    }

    // Emit event
    this.emit('stopped');
  }

  /**
   * Handle online event
   */
  private onOnline = (): void => {
    // Process queue when device comes online
    this.processSyncQueue().catch(error => {
      console.error('Error processing sync queue:', error);
    });
  };

  /**
   * Register a service worker for background sync
   *
   * @param serviceWorkerUrl Service worker URL
   */
  async registerServiceWorker(serviceWorkerUrl: string): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this environment');
    }

    try {
      const registration = await navigator.serviceWorker.register(serviceWorkerUrl);

      this.emit('service-worker:registered', { registration });

      // Check if background sync is supported
      if ('sync' in registration) {
        this.emit('background-sync:supported');
      }
    } catch (error) {
      console.error('Service worker registration failed:', error);
      throw new Error(`Failed to register service worker: ${(error as Error).message}`);
    }
  }

  /**
   * Schedule a background sync
   *
   * @param tag Sync tag
   */
  async scheduleBackgroundSync(tag: string = 'terra-fusion-sync'): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this environment');
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      if ('sync' in registration) {
        await (registration as any).sync.register(tag);

        this.emit('background-sync:scheduled', { tag });
      } else {
        throw new Error('Background Sync API is not supported in this browser');
      }
    } catch (error) {
      console.error('Failed to schedule background sync:', error);
      throw new Error(`Failed to schedule background sync: ${(error as Error).message}`);
    }
  }

  /**
   * Get the sync queue
   *
   * @returns Array of sync queue items
   */
  getSyncQueue(): SyncQueueItem[] {
    return Array.from(this.syncQueue.values());
  }

  /**
   * Clear the sync queue
   */
  clearSyncQueue(): void {
    this.syncQueue.clear();

    // Emit event
    this.emit('queue:cleared');
  }
}

export default BackgroundSyncManager;
