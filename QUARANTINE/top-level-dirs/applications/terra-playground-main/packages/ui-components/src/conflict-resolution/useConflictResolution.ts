/**
 * useConflictResolution Hook
 *
 * A React hook that provides conflict resolution functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ConflictDetails,
  ConflictType,
  ResolutionStrategy,
  ConflictResolutionManager,
} from '@terrafusion/offline-sync/src/conflict-resolution';

export interface UseConflictResolutionOptions {
  /** Conflict resolution manager instance */
  conflictManager: ConflictResolutionManager;
  /** User ID for conflict resolution */
  userId: string;
  /** Document ID to filter conflicts */
  documentId?: string;
  /** Whether to auto-open the modal when conflicts are detected */
  autoOpenModal?: boolean;
  /** Whether to show notifications when conflicts are detected */
  showNotifications?: boolean;
  /** Callback when conflicts are detected */
  onConflictsDetected?: (conflicts: ConflictDetails[]) => void;
  /** Callback when conflicts are resolved */
  onConflictsResolved?: (conflicts: ConflictDetails[]) => void;
  /** Automatically resolve certain types of conflicts */
  autoResolveStrategies?: Record<ConflictType, ResolutionStrategy>;
}

export interface UseConflictResolutionResult {
  /** List of all conflicts */
  conflicts: ConflictDetails[];
  /** List of unresolved conflicts */
  unresolvedConflicts: ConflictDetails[];
  /** Whether the modal is open */
  isModalOpen: boolean;
  /** Open the modal */
  openModal: () => void;
  /** Close the modal */
  closeModal: () => void;
  /** Get conflicts for a specific document */
  getConflictsForDocument: (docId: string) => ConflictDetails[];
  /** Get unresolved conflicts for a specific document */
  getUnresolvedConflictsForDocument: (docId: string) => ConflictDetails[];
  /** Resolve a conflict */
  resolveConflict: (
    conflictId: string,
    strategy: ResolutionStrategy,
    userId: string,
    customValue?: any
  ) => Promise<boolean>;
  /** Whether conflicts are being loaded */
  loading: boolean;
  /** Whether there are any unresolved conflicts */
  hasUnresolvedConflicts: boolean;
  /** Number of unresolved conflicts */
  unresolvedCount: number;
  /** Refresh conflicts */
  refreshConflicts: () => void;
}

/**
 * useConflictResolution hook
 */
export function useConflictResolution({
  conflictManager,
  userId,
  documentId,
  autoOpenModal = true,
  showNotifications = true,
  onConflictsDetected,
  onConflictsResolved,
  autoResolveStrategies,
}: UseConflictResolutionOptions): UseConflictResolutionResult {
  // State
  const [conflicts, setConflicts] = useState<ConflictDetails[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Derived state
  const unresolvedConflicts = conflicts.filter(c => !c.resolved);
  const hasUnresolvedConflicts = unresolvedConflicts.length > 0;
  const unresolvedCount = unresolvedConflicts.length;

  // Refresh conflicts
  const refreshConflicts = useCallback(() => {
    setLoading(true);

    // Get conflicts from the manager
    let allConflicts: ConflictDetails[];

    if (documentId) {
      allConflicts = conflictManager.getConflictsForDocument(documentId);
    } else {
      allConflicts = conflictManager.getAllConflicts();
    }

    setConflicts(allConflicts);
    setLoading(false);

    // Check for new unresolved conflicts
    const newUnresolvedConflicts = allConflicts.filter(c => !c.resolved);

    if (newUnresolvedConflicts.length > 0) {
      // Auto-resolve conflicts if configured
      if (autoResolveStrategies) {
        newUnresolvedConflicts.forEach(conflict => {
          const strategy = autoResolveStrategies[conflict.type];
          if (strategy) {
            conflictManager.resolveConflict(conflict.id, strategy, userId);
          }
        });

        // Refresh again after auto-resolving
        setTimeout(refreshConflicts, 0);
      }

      // Notify
      if (onConflictsDetected) {
        onConflictsDetected(newUnresolvedConflicts);
      }

      // Show notification
      if (showNotifications) {
        // Use browser notification API if available
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Conflicts Detected', {
            body: `${newUnresolvedConflicts.length} conflicts need to be resolved.`,
          });
        }
      }

      // Auto-open modal
      if (autoOpenModal && newUnresolvedConflicts.length > 0) {
        setIsModalOpen(true);
      }
    }
  }, [
    conflictManager,
    documentId,
    autoOpenModal,
    showNotifications,
    onConflictsDetected,
    autoResolveStrategies,
    userId,
  ]);

  // Initialize
  useEffect(() => {
    refreshConflicts();

    // Listen for conflict changes
    const handleConflictDetected = () => refreshConflicts();
    const handleConflictResolved = () => {
      refreshConflicts();

      // Notify
      if (onConflictsResolved) {
        onConflictsResolved(conflicts.filter(c => c.resolved));
      }
    };

    conflictManager.on('conflict:detected', handleConflictDetected);
    conflictManager.on('conflict:resolved', handleConflictResolved);

    return () => {
      conflictManager.off('conflict:detected', handleConflictDetected);
      conflictManager.off('conflict:resolved', handleConflictResolved);
    };
  }, [conflictManager, refreshConflicts, onConflictsResolved, conflicts]);

  // Get conflicts for a document
  const getConflictsForDocument = useCallback(
    (docId: string) => {
      return conflictManager.getConflictsForDocument(docId);
    },
    [conflictManager]
  );

  // Get unresolved conflicts for a document
  const getUnresolvedConflictsForDocument = useCallback(
    (docId: string) => {
      return conflictManager.getUnresolvedConflictsForDocument(docId);
    },
    [conflictManager]
  );

  // Resolve a conflict
  const resolveConflict = useCallback(
    async (conflictId: string, strategy: ResolutionStrategy, userId: string, customValue?: any) => {
      const result = conflictManager.resolveConflict(conflictId, strategy, userId, customValue);
      refreshConflicts();
      return result;
    },
    [conflictManager, refreshConflicts]
  );

  // Open modal
  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    conflicts,
    unresolvedConflicts,
    isModalOpen,
    openModal,
    closeModal,
    getConflictsForDocument,
    getUnresolvedConflictsForDocument,
    resolveConflict,
    loading,
    hasUnresolvedConflicts,
    unresolvedCount,
    refreshConflicts,
  };
}

export default useConflictResolution;
