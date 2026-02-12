/**
 * Property Document Hook
 *
 * Hook for managing property document synchronization.
 */

import { useState, useEffect, useCallback } from 'react';
import { ConflictResolutionManager } from '../conflict-resolution';
import { CRDTDocumentManager, SyncStatus } from '../crdt-sync';
import * as Y from 'yjs';
import * as json from 'lib0/json';
import { deepEqual, debounce } from '../utils';

/**
 * Property document state interface
 */
export interface PropertyDocState {
  /**
   * Property ID
   */
  id: string;

  /**
   * Property address
   */
  address?: string;

  /**
   * Property owner
   */
  owner?: string;

  /**
   * Property value
   */
  value?: number;

  /**
   * Last inspection date
   */
  lastInspection?: string;

  /**
   * Notes
   */
  notes?: string;

  /**
   * Property features
   */
  features?: string[];

  /**
   * Updated at timestamp
   */
  updatedAt?: number;

  /**
   * Created at timestamp
   */
  createdAt?: number;

  /**
   * Last synced at timestamp
   */
  syncedAt?: number;

  /**
   * Last modified by
   */
  modifiedBy?: string;

  /**
   * Version
   */
  version?: number;

  /**
   * Additional properties
   */
  [key: string]: any;
}

/**
 * Property document hook options interface
 */
export interface UsePropertyDocOptions {
  /**
   * Auto sync
   */
  autoSync?: boolean;

  /**
   * Auto sync interval in milliseconds
   */
  autoSyncInterval?: number;

  /**
   * User ID
   */
  userId?: string;

  /**
   * API endpoint
   */
  apiEndpoint?: string;

  /**
   * On conflict callback
   */
  onConflict?: (local: PropertyDocState, remote: PropertyDocState) => void;

  /**
   * On sync error callback
   */
  onSyncError?: (error: Error) => void;
}

/**
 * Use property document hook
 *
 * @param docId Document ID
 * @param crdtManager CRDT document manager
 * @param conflictManager Conflict resolution manager
 * @param options Options
 * @returns Hook state and functions
 */
export const usePropertyDoc = (
  docId: string,
  crdtManager: CRDTDocumentManager,
  conflictManager: ConflictResolutionManager,
  options: UsePropertyDocOptions = {}
) => {
  // Default options
  const {
    autoSync = true,
    autoSyncInterval = 30000, // 30 seconds
    userId = 'anonymous',
    apiEndpoint = '/api/sync',
    onConflict,
    onSyncError,
  } = options;

  // Local state
  const [local, setLocal] = useState<PropertyDocState>({ id: docId });

  // Remote state
  const [remote, setRemote] = useState<PropertyDocState | null>(null);

  // Shared state (merged)
  const [shared, setShared] = useState<PropertyDocState>({ id: docId });

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Error state
  const [error, setError] = useState<Error | null>(null);

  // Sync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.UNSYNCED);

  // Has conflict
  const [hasConflict, setHasConflict] = useState<boolean>(false);

  // Auto sync interval
  const [autoSyncId, setAutoSyncId] = useState<NodeJS.Timeout | null>(null);

  // Document instance
  const [doc, setDoc] = useState<Y.Doc | null>(null);

  // Initialize document
  useEffect(() => {
    const initDoc = async () => {
      try {
        setIsLoading(true);

        // Get or create document
        const document = await crdtManager.getOrCreateDocument(docId);

        // Set document
        setDoc(document);

        // Get local data
        const localData = crdtManager.getLocalData(document);

        // Set local state
        setLocal({
          ...localData,
          id: docId,
        });

        // Set shared state
        setShared({
          ...localData,
          id: docId,
        });

        // Set loading state
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing document:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    initDoc();

    // Cleanup
    return () => {
      if (autoSyncId) {
        clearInterval(autoSyncId);
      }
    };
  }, [docId, crdtManager]);

  // Set up observers
  useEffect(() => {
    if (!doc) return;

    const observer = (event: Y.YEvent<any>, transaction: Y.Transaction) => {
      // Skip if transaction was remote
      if (transaction.local) {
        const data = crdtManager.getLocalData(doc);

        // Only update if data has changed
        if (!deepEqual(data, local)) {
          setLocal({
            ...data,
            id: docId,
          });

          setShared({
            ...data,
            id: docId,
          });

          // Set sync status
          setSyncStatus(SyncStatus.UNSYNCED);
        }
      }
    };

    // Observe document
    crdtManager.observeDocument(doc, observer);

    // Cleanup
    return () => {
      crdtManager.unobserveDocument(doc, observer);
    };
  }, [doc, docId, crdtManager, local]);

  // Set up auto sync
  useEffect(() => {
    if (!autoSync || !doc) return;

    // Set up auto sync interval
    const interval = setInterval(() => {
      // Only sync if we have a document and we're not already syncing
      if (doc && syncStatus !== SyncStatus.SYNCING) {
        syncWithRemote();
      }
    }, autoSyncInterval);

    // Set interval ID
    setAutoSyncId(interval);

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, [autoSync, autoSyncInterval, doc, syncStatus]);

  // Sync with remote
  const syncWithRemote = useCallback(async () => {
    if (!doc) return;

    try {
      // Set sync status
      setSyncStatus(SyncStatus.SYNCING);

      // Get remote data
      const remoteData = await crdtManager.syncWithRemote(doc, apiEndpoint);

      // Check for conflict
      if (remoteData && !deepEqual(remoteData, local)) {
        setRemote(remoteData as PropertyDocState);

        // Detect conflict
        const conflict = conflictManager.detectConflict(docId, local, remoteData, userId);

        if (conflict) {
          // Set conflict state
          setHasConflict(true);
          setSyncStatus(SyncStatus.CONFLICT);

          // Call onConflict callback
          if (onConflict) {
            onConflict(local, remoteData as PropertyDocState);
          }

          return;
        }
      }

      // No conflict, update local data
      if (remoteData) {
        // Update local data
        crdtManager.updateLocalData(doc, remoteData);

        // Set shared state
        setShared({
          ...remoteData,
          id: docId,
        });
      }

      // Set sync status
      setSyncStatus(SyncStatus.SYNCED);
    } catch (err) {
      console.error('Error syncing with remote:', err);
      setError(err as Error);
      setSyncStatus(SyncStatus.FAILED);

      // Call onSyncError callback
      if (onSyncError) {
        onSyncError(err as Error);
      }
    }
  }, [
    doc,
    docId,
    crdtManager,
    apiEndpoint,
    local,
    conflictManager,
    userId,
    onConflict,
    onSyncError,
  ]);

  // Update local data
  const updateLocal = useCallback(
    async (data: Partial<PropertyDocState>) => {
      if (!doc) return;

      try {
        // Merge data
        const newData = {
          ...local,
          ...data,
          id: docId, // Ensure ID doesn't change
          updatedAt: Date.now(),
          modifiedBy: userId,
          version: (local.version || 0) + 1,
        };

        // Update local data
        await crdtManager.updateLocalData(doc, newData);

        // Set sync status
        setSyncStatus(SyncStatus.UNSYNCED);

        return newData;
      } catch (err) {
        console.error('Error updating local data:', err);
        setError(err as Error);
        return null;
      }
    },
    [doc, docId, crdtManager, local, userId]
  );

  // Resolve conflict
  const resolveConflict = useCallback(
    async (resolvedData: PropertyDocState) => {
      if (!doc || !remote) return;

      try {
        // Update local data
        await crdtManager.updateLocalData(doc, resolvedData);

        // Reset conflict state
        setHasConflict(false);
        setRemote(null);

        // Set sync status
        setSyncStatus(SyncStatus.SYNCED);

        // Set shared state
        setShared({
          ...resolvedData,
          id: docId,
        });

        return resolvedData;
      } catch (err) {
        console.error('Error resolving conflict:', err);
        setError(err as Error);
        return null;
      }
    },
    [doc, docId, crdtManager, remote]
  );

  // Reset error
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Debounced update
  const debouncedUpdate = useCallback(
    debounce((data: Partial<PropertyDocState>) => updateLocal(data), 500),
    [updateLocal]
  );

  return {
    local,
    remote,
    shared,
    isLoading,
    error,
    syncStatus,
    hasConflict,
    updateLocal,
    debouncedUpdate,
    syncWithRemote,
    resolveConflict,
    resetError,
  };
};
