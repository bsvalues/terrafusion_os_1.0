/**
 * CRDT Sync
 *
 * CRDT-based synchronization for offline data.
 */

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as json from 'lib0/json';
import { retry } from './utils';

/**
 * Sync status enumeration
 */
export enum SyncStatus {
  /**
   * Unsynced
   */
  UNSYNCED = 'unsynced',

  /**
   * Syncing
   */
  SYNCING = 'syncing',

  /**
   * Synced
   */
  SYNCED = 'synced',

  /**
   * Failed
   */
  FAILED = 'failed',

  /**
   * Conflict
   */
  CONFLICT = 'conflict',
}

/**
 * CRDT document manager interface
 */
export interface CRDTDocumentManager {
  /**
   * Create document
   *
   * @param docId Document ID
   * @returns Document
   */
  createDocument(docId: string): Promise<Y.Doc>;

  /**
   * Get document
   *
   * @param docId Document ID
   * @returns Document if found
   */
  getDocument(docId: string): Promise<Y.Doc | null>;

  /**
   * Get or create document
   *
   * @param docId Document ID
   * @returns Document
   */
  getOrCreateDocument(docId: string): Promise<Y.Doc>;

  /**
   * Delete document
   *
   * @param docId Document ID
   * @returns Whether document was deleted
   */
  deleteDocument(docId: string): Promise<boolean>;

  /**
   * Get local data
   *
   * @param doc Document
   * @returns Local data
   */
  getLocalData(doc: Y.Doc): any;

  /**
   * Update local data
   *
   * @param doc Document
   * @param data Data
   * @returns Whether data was updated
   */
  updateLocalData(doc: Y.Doc, data: any): Promise<boolean>;

  /**
   * Sync with remote
   *
   * @param doc Document
   * @param endpoint API endpoint
   * @returns Remote data
   */
  syncWithRemote(doc: Y.Doc, endpoint: string): Promise<any>;

  /**
   * Observe document
   *
   * @param doc Document
   * @param observer Observer function
   */
  observeDocument(
    doc: Y.Doc,
    observer: (event: Y.YEvent<any>, transaction: Y.Transaction) => void
  ): void;

  /**
   * Unobserve document
   *
   * @param doc Document
   * @param observer Observer function
   */
  unobserveDocument(
    doc: Y.Doc,
    observer: (event: Y.YEvent<any>, transaction: Y.Transaction) => void
  ): void;
}

/**
 * CRDT document manager implementation
 */
export class CRDTDocumentManagerImpl implements CRDTDocumentManager {
  private documents: Map<string, Y.Doc> = new Map();
  private persistences: Map<string, IndexeddbPersistence> = new Map();
  private observers: Map<string, Set<(event: Y.YEvent<any>, transaction: Y.Transaction) => void>> =
    new Map();

  /**
   * Initialize a new CRDT document manager
   */
  constructor() {}

  /**
   * Create document
   *
   * @param docId Document ID
   * @returns Document
   */
  async createDocument(docId: string): Promise<Y.Doc> {
    // Create document
    const doc = new Y.Doc();

    // Create persistence
    const persistence = new IndexeddbPersistence(docId, doc);

    // Wait for persistence to be synced
    await new Promise<void>(resolve => {
      persistence.once('synced', () => {
        resolve();
      });
    });

    // Store document and persistence
    this.documents.set(docId, doc);
    this.persistences.set(docId, persistence);
    this.observers.set(docId, new Set());

    return doc;
  }

  /**
   * Get document
   *
   * @param docId Document ID
   * @returns Document if found
   */
  async getDocument(docId: string): Promise<Y.Doc | null> {
    // Check if document exists
    if (this.documents.has(docId)) {
      return this.documents.get(docId) || null;
    }

    try {
      // Create document
      const doc = new Y.Doc();

      // Create persistence
      const persistence = new IndexeddbPersistence(docId, doc);

      // Wait for persistence to be synced
      await new Promise<void>((resolve, reject) => {
        persistence.once('synced', () => {
          resolve();
        });

        persistence.once('error', err => {
          reject(err);
        });
      });

      // Check if document has data
      const data = this.getLocalData(doc);

      if (!data || Object.keys(data).length === 0) {
        // No data, document doesn't exist
        persistence.destroy();
        return null;
      }

      // Store document and persistence
      this.documents.set(docId, doc);
      this.persistences.set(docId, persistence);
      this.observers.set(docId, new Set());

      return doc;
    } catch (err) {
      console.error('Error getting document:', err);
      return null;
    }
  }

  /**
   * Get or create document
   *
   * @param docId Document ID
   * @returns Document
   */
  async getOrCreateDocument(docId: string): Promise<Y.Doc> {
    const doc = await this.getDocument(docId);

    if (doc) {
      return doc;
    }

    return this.createDocument(docId);
  }

  /**
   * Delete document
   *
   * @param docId Document ID
   * @returns Whether document was deleted
   */
  async deleteDocument(docId: string): Promise<boolean> {
    // Check if document exists
    if (!this.documents.has(docId)) {
      return false;
    }

    // Get document and persistence
    const doc = this.documents.get(docId);
    const persistence = this.persistences.get(docId);

    if (!doc || !persistence) {
      return false;
    }

    // Destroy document and persistence
    doc.destroy();
    persistence.destroy();

    // Remove document and persistence
    this.documents.delete(docId);
    this.persistences.delete(docId);
    this.observers.delete(docId);

    return true;
  }

  /**
   * Get local data
   *
   * @param doc Document
   * @returns Local data
   */
  getLocalData(doc: Y.Doc): any {
    // Get data map
    const dataMap = doc.getMap('data');

    // Convert to object
    const data: Record<string, any> = {};

    // Iterate over data map
    dataMap.forEach((value, key) => {
      data[key] = value;
    });

    return data;
  }

  /**
   * Update local data
   *
   * @param doc Document
   * @param data Data
   * @returns Whether data was updated
   */
  async updateLocalData(doc: Y.Doc, data: any): Promise<boolean> {
    try {
      // Get data map
      const dataMap = doc.getMap('data');

      // Update data
      doc.transact(() => {
        // Clear data map
        dataMap.clear();

        // Add new data
        for (const [key, value] of Object.entries(data)) {
          dataMap.set(key, value);
        }
      });

      return true;
    } catch (err) {
      console.error('Error updating local data:', err);
      return false;
    }
  }

  /**
   * Sync with remote
   *
   * @param doc Document
   * @param endpoint API endpoint
   * @returns Remote data
   */
  async syncWithRemote(doc: Y.Doc, endpoint: string): Promise<any> {
    try {
      // Get document ID
      const docId = doc.clientID.toString();

      // Get local data
      const localData = this.getLocalData(doc);

      // Add docId to data
      if (!localData.id) {
        localData.id = docId;
      }

      // Sync with remote
      const response = await retry(async () => {
        const res = await fetch(`${endpoint}/${docId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(localData),
        });

        if (!res.ok) {
          throw new Error(`Error syncing with remote: ${res.statusText}`);
        }

        const data = await res.json();
        return data;
      });

      return response;
    } catch (err) {
      console.error('Error syncing with remote:', err);
      throw err;
    }
  }

  /**
   * Observe document
   *
   * @param doc Document
   * @param observer Observer function
   */
  observeDocument(
    doc: Y.Doc,
    observer: (event: Y.YEvent<any>, transaction: Y.Transaction) => void
  ): void {
    // Get document ID
    const docId = doc.clientID.toString();

    // Get data map
    const dataMap = doc.getMap('data');

    // Get observers
    const observers = this.observers.get(docId) || new Set();

    // Add observer
    observers.add(observer);

    // Store observers
    this.observers.set(docId, observers);

    // Observe data map
    dataMap.observe(observer);
  }

  /**
   * Unobserve document
   *
   * @param doc Document
   * @param observer Observer function
   */
  unobserveDocument(
    doc: Y.Doc,
    observer: (event: Y.YEvent<any>, transaction: Y.Transaction) => void
  ): void {
    // Get document ID
    const docId = doc.clientID.toString();

    // Get data map
    const dataMap = doc.getMap('data');

    // Get observers
    const observers = this.observers.get(docId) || new Set();

    // Remove observer
    observers.delete(observer);

    // Store observers
    this.observers.set(docId, observers);

    // Unobserve data map
    dataMap.unobserve(observer);
  }
}
