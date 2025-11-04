/**
 * ConflictList Component
 *
 * A list of conflicts with filtering and sorting options.
 */

import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { ConflictDetails, ConflictType } from '@terrafusion/offline-sync/src/conflict-resolution';
import { ConflictCard } from './ConflictCard';
import { ConflictTypeInfo } from './types';

export interface ConflictListProps {
  /** List of conflicts */
  conflicts: ConflictDetails[];
  /** Selected conflict ID */
  selectedId?: string;
  /** Whether to show resolved conflicts */
  showResolved?: boolean;
  /** Filter by conflict type */
  filterType?: ConflictType | null;
  /** Filter by document ID */
  filterDocId?: string | null;
  /** Sort function */
  sortFn?: (a: ConflictDetails, b: ConflictDetails) => number;
  /** Selection change handler */
  onConflictSelect?: (id: string) => void;
  /** Filter change handler */
  onFilterChange?: (showResolved: boolean, type: ConflictType | null, docId: string | null) => void;
  /** Additional CSS class names */
  className?: string;
  /** Custom empty state */
  emptyState?: React.ReactNode;
  /** Conflict type information */
  conflictTypes?: Record<ConflictType, ConflictTypeInfo>;
}

/**
 * Default sort function (newest first)
 */
const defaultSortFn = (a: ConflictDetails, b: ConflictDetails): number => {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
};

/**
 * ConflictList component
 */
export const ConflictList: React.FC<ConflictListProps> = ({
  conflicts,
  selectedId,
  showResolved = false,
  filterType = null,
  filterDocId = null,
  sortFn = defaultSortFn,
  onConflictSelect,
  onFilterChange,
  className,
  emptyState,
  conflictTypes,
}) => {
  // Internal state for filters if not controlled
  const [internalShowResolved, setInternalShowResolved] = useState(showResolved);
  const [internalFilterType, setInternalFilterType] = useState<ConflictType | null>(filterType);
  const [internalFilterDocId, setInternalFilterDocId] = useState<string | null>(filterDocId);

  // Use controlled or uncontrolled values
  const effectiveShowResolved = onFilterChange ? showResolved : internalShowResolved;
  const effectiveFilterType = onFilterChange ? filterType : internalFilterType;
  const effectiveFilterDocId = onFilterChange ? filterDocId : internalFilterDocId;

  // Filter handler
  const handleFilterChange = (
    newShowResolved: boolean = effectiveShowResolved,
    newFilterType: ConflictType | null = effectiveFilterType,
    newFilterDocId: string | null = effectiveFilterDocId
  ) => {
    if (onFilterChange) {
      onFilterChange(newShowResolved, newFilterType, newFilterDocId);
    } else {
      setInternalShowResolved(newShowResolved);
      setInternalFilterType(newFilterType);
      setInternalFilterDocId(newFilterDocId);
    }
  };

  // Get unique document IDs for filter dropdown
  const documentIds = useMemo(() => {
    return Array.from(new Set(conflicts.map(c => c.docId))).sort();
  }, [conflicts]);

  // Get conflict type counts
  const typeCounts = useMemo(() => {
    const counts: Record<ConflictType, number> = {
      [ConflictType.VALUE]: 0,
      [ConflictType.STRUCTURE]: 0,
      [ConflictType.DELETION]: 0,
      [ConflictType.EXISTENCE]: 0,
      [ConflictType.DEPENDENCY]: 0,
      [ConflictType.VERSION]: 0,
      [ConflictType.SCHEMA]: 0,
      [ConflictType.OTHER]: 0,
    };

    conflicts.forEach(conflict => {
      if (!effectiveShowResolved && conflict.resolved) return;
      counts[conflict.type] = (counts[conflict.type] || 0) + 1;
    });

    return counts;
  }, [conflicts, effectiveShowResolved]);

  // Filter conflicts
  const filteredConflicts = useMemo(() => {
    return conflicts
      .filter(conflict => {
        // Filter by resolved status
        if (!effectiveShowResolved && conflict.resolved) {
          return false;
        }

        // Filter by type
        if (effectiveFilterType && conflict.type !== effectiveFilterType) {
          return false;
        }

        // Filter by document ID
        if (effectiveFilterDocId && conflict.docId !== effectiveFilterDocId) {
          return false;
        }

        return true;
      })
      .sort(sortFn);
  }, [conflicts, effectiveShowResolved, effectiveFilterType, effectiveFilterDocId, sortFn]);

  // Handle conflict selection
  const handleConflictSelect = (id: string) => {
    if (onConflictSelect) {
      onConflictSelect(id);
    }
  };

  return (
    <div className={clsx('conflict-list', className)}>
      {/* Filter controls */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4">
          {/* Show resolved toggle */}
          <div>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={effectiveShowResolved}
                onChange={e => handleFilterChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Show resolved</span>
            </label>
          </div>

          {/* Filter by type */}
          <div>
            <label className="block text-sm"><>

              <span className="text-gray-700">Type:</span>
              <select
</>
                value={effectiveFilterType || ''}
                onChange={e =>
                  handleFilterChange(
                    effectiveShowResolved,
                    e.target.value ? (e.target.value as ConflictType) : null
                  )
                }
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All types</option>
                {Object.values(ConflictType).map(type => (
                  <option key={type} value={type}>
                    {type} ({typeCounts[type] || 0})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Filter by document */}
          <div>
            <label className="block text-sm"><>

              <span className="text-gray-700">Document:</span>
              <select
</>
                value={effectiveFilterDocId || ''}
                onChange={e =>
                  handleFilterChange(
                    effectiveShowResolved,
                    effectiveFilterType,
                    e.target.value || null
                  )
                }
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All documents</option>
                {documentIds.map(docId => (
                  <option key={docId} value={docId}>
                    {docId}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Conflict count */}
      <div className="mb-4">
        <span className="text-sm text-gray-500">
          Showing {filteredConflicts.length} of {conflicts.length} conflicts
        </span>
      </div>

      {/* Conflict list */}
      {filteredConflicts.length > 0 ? (
        <div className="space-y-4">
          {filteredConflicts.map(conflict => (
            <ConflictCard
              key={conflict.id}
              conflict={conflict}
              selected={selectedId === conflict.id}
              onClick={() => handleConflictSelect(conflict.id)}
              conflictTypes={conflictTypes}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 px-4 border border-gray-200 rounded-lg bg-gray-50">
          {emptyState || (
            <div className="text-gray-500"><>

              <p className="text-lg font-medium">No conflicts found</p>
              <p
</> className="text-sm">Adjust your filters to see more conflicts</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * ConflictList component story
 */
export default {
  title: 'Conflict Resolution/ConflictList',
  component: ConflictList,
  parameters: {
    docs: {
      description: {
        component: 'A list of conflicts with filtering and sorting options',
      },
    },
  },
};
