/**
 * ConflictResolutionModal Component
 *
 * A modal that combines conflict list, diff view, and action bar
 * to provide a complete conflict resolution experience.
 */

import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import {
  ConflictDetails,
  ResolutionStrategy,
} from '@terrafusion/offline-sync/src/conflict-resolution';
import { ConflictList } from './ConflictList';
import { ConflictDiff } from './ConflictDiff';
import { ConflictActionBar } from './ConflictActionBar';
import { ConflictResolutionHandler } from './types';

export interface ConflictResolutionModalProps {
  /** List of conflicts */
  conflicts: ConflictDetails[];
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** User ID for tracking who resolved the conflict */
  userId: string;
  /** Conflict resolution handler */
  onResolve: ConflictResolutionHandler;
  /** Whether the conflicts are being loaded */
  loading?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Modal title */
  title?: string;
  /** Modal subtitle */
  subtitle?: string;
  /** Auto-close when all conflicts are resolved */
  autoCloseWhenResolved?: boolean;
  /** Whether to show the diff as side-by-side or inline */
  diffStyle?: 'side-by-side' | 'inline';
  /** Custom renderer for the conflict view */
  customRenderer?: (conflict: ConflictDetails) => React.ReactNode;
  /** Initial selected conflict ID */
  initialSelectedId?: string;
}

/**
 * ConflictResolutionModal component
 */
export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflicts,
  isOpen,
  onClose,
  userId,
  onResolve,
  loading = false,
  className,
  title = 'Resolve Conflicts',
  subtitle = 'Select a conflict to resolve',
  autoCloseWhenResolved = true,
  diffStyle = 'side-by-side',
  customRenderer,
  initialSelectedId,
}) => {
  // State
  const [selectedId, setSelectedId] = useState<string | undefined>(initialSelectedId);
  const [selectedConflict, setSelectedConflict] = useState<ConflictDetails | undefined>();
  const [customValue, setCustomValue] = useState<any>(undefined);
  const [selectedStrategy, setSelectedStrategy] = useState<ResolutionStrategy | undefined>();
  const [resolvingConflict, setResolvingConflict] = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  // Reset state when modal opens or conflicts change
  useEffect(() => {
    if (isOpen) {
      setSelectedId(initialSelectedId);
      setSelectedStrategy(undefined);
      setCustomValue(undefined);
    }
  }, [isOpen, initialSelectedId]);

  // Update selected conflict when selectedId changes
  useEffect(() => {
    if (selectedId) {
      const conflict = conflicts.find(c => c.id === selectedId);
      setSelectedConflict(conflict);

      // Initialize custom value with remote value
      if (conflict) {
        setCustomValue(conflict.remoteValue);
      }
    } else {
      setSelectedConflict(undefined);
      setCustomValue(undefined);
    }
  }, [selectedId, conflicts]);

  // Check if all conflicts are resolved
  useEffect(() => {
    if (autoCloseWhenResolved && isOpen && conflicts.length > 0) {
      const unresolvedConflicts = conflicts.filter(c => !c.resolved);
      if (unresolvedConflicts.length === 0) {
        onClose();
      }
    }
  }, [conflicts, isOpen, autoCloseWhenResolved, onClose]);

  // Handle conflict selection
  const handleConflictSelect = (id: string) => {
    setSelectedId(id);
    setSelectedStrategy(undefined);
  };

  // Handle conflict resolution
  const handleResolve = async (
    conflictId: string,
    strategy: ResolutionStrategy,
    userId: string,
    customValue?: any
  ) => {
    try {
      setResolvingConflict(true);
      setSelectedStrategy(strategy);

      // Resolve the conflict
      const success = await onResolve(conflictId, strategy, userId, customValue);

      if (success) {
        // Move to the next unresolved conflict
        const nextConflict = conflicts.find(c => !c.resolved && c.id !== conflictId);
        if (nextConflict) {
          setSelectedId(nextConflict.id);
          setSelectedStrategy(undefined);
        } else {
          setSelectedId(undefined);
          setSelectedStrategy(undefined);
        }
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
    } finally {
      setResolvingConflict(false);
    }
  };

  // Handle custom value change
  const handleCustomValueChange = (value: any) => {
    try {
      // Try to parse as JSON if it's a string
      if (typeof value === 'string') {
        try {
          const parsedValue = JSON.parse(value);
          setCustomValue(parsedValue);
        } catch (e) {
          // Not valid JSON, just use as string
          setCustomValue(value);
        }
      } else {
        setCustomValue(value);
      }
    } catch (error) {
      console.error('Error parsing custom value:', error);
    }
  };

  // If modal is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal panel */}
      <div
        className={clsx(
          'relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden',
          className
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div><>

              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
              <p
</> className="text-sm text-gray-500">{subtitle}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="grid grid-cols-[350px_1fr] h-[calc(90vh-130px)]">
          {/* Conflict list panel */}
          <div className="border-r border-gray-200 overflow-y-auto p-4">
            <ConflictList
              conflicts={conflicts}
              selectedId={selectedId}
              showResolved={showResolved}
              onConflictSelect={handleConflictSelect}
              onFilterChange={show => setShowResolved(show)}
              emptyState={
                <div className="text-center py-8">
                  <p className="text-lg font-medium text-gray-500">No conflicts found</p>
                  {loading ? (
                    <div className="mt-2 flex justify-center">
                      <svg
                        className="animate-spin h-5 w-5 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-400">All conflicts have been resolved!</p>
                  )}
                </div>
              }
            />
          </div>

          {/* Conflict details panel */}
          <div className="overflow-y-auto p-6">
            {selectedConflict ? (
              <div className="space-y-6">
                {/* Conflict info */}
                <div><>

                  <h3 className="text-lg font-medium text-gray-900 mb-2">Conflict Details</h3>
                  <div
</> className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Document ID:</span>{' '}
                      <span className="font-mono">{selectedConflict.docId}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Detected:</span>{' '}
                      <span>{new Date(selectedConflict.timestamp).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Path:</span>{' '}
                      <span className="font-mono">{selectedConflict.path || 'Root'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Type:</span>{' '}
                      <span>{selectedConflict.type}</span>
                    </div>
                  </div>
                </div>

                {/* Conflict diff */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Changes</h3>

                  {customRenderer ? (
                    customRenderer(selectedConflict)
                  ) : (
                    <ConflictDiff conflict={selectedConflict} diffStyle={diffStyle} />
                  )}
                </div>

                {/* Conflict actions */}
                <div><>

                  <h3 className="text-lg font-medium text-gray-900 mb-2">Resolve Conflict</h3>

                  <ConflictActionBar
</>
                    conflictId={selectedConflict.id}
                    userId={userId}
                    onResolve={handleResolve}
                    selectedStrategy={selectedStrategy}
                    customValue={customValue}
                    onCustomValueChange={handleCustomValueChange}
                    disabled={selectedConflict.resolved}
                    loading={resolvingConflict}
                    onSkip={() => {
                      const nextConflict = conflicts.find(
                        c => !c.resolved && c.id !== selectedConflict.id
                      );
                      if (nextConflict) {
                        setSelectedId(nextConflict.id);
                        setSelectedStrategy(undefined);
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8"><>

                  <p className="text-lg font-medium text-gray-500">
                    Select a conflict from the list to resolve
                  </p>
                  <p
</> className="mt-2 text-sm text-gray-400">
                    You can view and resolve conflicts one by one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between"><>

          <div className="text-sm text-gray-500">
            {conflicts.filter(c => !c.resolved).length} unresolved conflicts
          </div>

          <div
</>>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ConflictResolutionModal component story
 */
export default {
  title: 'Conflict Resolution/ConflictResolutionModal',
  component: ConflictResolutionModal,
  parameters: {
    docs: {
      description: {
        component: 'A modal for resolving conflicts',
      },
    },
  },
};
