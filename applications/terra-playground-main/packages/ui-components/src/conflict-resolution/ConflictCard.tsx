/**
 * ConflictCard Component
 *
 * A card that displays information about a single conflict,
 * including its type, path, and a preview of the conflicting values.
 */

import React from 'react';
import clsx from 'clsx';
import { ConflictDetails, ConflictType } from '@terrafusion/offline-sync/src/conflict-resolution';
import { ConflictTypeInfo } from './types';

export interface ConflictCardProps {
  /** The conflict details */
  conflict: ConflictDetails;
  /** Whether the card is selected */
  selected?: boolean;
  /** Whether to show the full path */
  showFullPath?: boolean;
  /** Whether to show preview of values */
  showPreview?: boolean;
  /** Maximum preview length */
  previewLength?: number;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS class names */
  className?: string;
  /** Information about conflict types */
  conflictTypes?: Record<ConflictType, ConflictTypeInfo>;
}

/**
 * Default conflict type information
 */
const DEFAULT_CONFLICT_TYPES: Record<ConflictType, ConflictTypeInfo> = {
  [ConflictType.VALUE]: {
    type: ConflictType.VALUE,
    label: 'Value Conflict',
    description: 'Different values for the same field',
    color: 'bg-amber-100 text-amber-800',
  },
  [ConflictType.STRUCTURE]: {
    type: ConflictType.STRUCTURE,
    label: 'Structure Conflict',
    description: 'Different data structures',
    color: 'bg-red-100 text-red-800',
  },
  [ConflictType.DELETION]: {
    type: ConflictType.DELETION,
    label: 'Deletion Conflict',
    description: 'Item deleted in one version',
    color: 'bg-red-100 text-red-800',
  },
  [ConflictType.EXISTENCE]: {
    type: ConflictType.EXISTENCE,
    label: 'Existence Conflict',
    description: 'Item exists in only one version',
    color: 'bg-blue-100 text-blue-800',
  },
  [ConflictType.DEPENDENCY]: {
    type: ConflictType.DEPENDENCY,
    label: 'Dependency Conflict',
    description: 'Conflicts in dependent entities',
    color: 'bg-purple-100 text-purple-800',
  },
  [ConflictType.VERSION]: {
    type: ConflictType.VERSION,
    label: 'Version Conflict',
    description: 'Different versions of the same entity',
    color: 'bg-gray-100 text-gray-800',
  },
  [ConflictType.SCHEMA]: {
    type: ConflictType.SCHEMA,
    label: 'Schema Conflict',
    description: 'Incompatible schema changes',
    color: 'bg-orange-100 text-orange-800',
  },
  [ConflictType.OTHER]: {
    type: ConflictType.OTHER,
    label: 'Other Conflict',
    description: 'Unspecified conflict type',
    color: 'bg-gray-100 text-gray-800',
  },
};

/**
 * Format a value for display
 */
const formatValue = (value: any, maxLength: number = 50): string => {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'object') {
    const json = JSON.stringify(value);
    return json.length > maxLength ? `${json.substring(0, maxLength)}...` : json;
  }

  const str = String(value);
  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
};

/**
 * Format a path for display
 */
const formatPath = (path: string, showFull: boolean = false): string => {
  if (showFull) return path;

  const parts = path.split('.');
  if (parts.length <= 2) return path;

  return `...${parts.slice(-2).join('.')}`;
};

/**
 * ConflictCard component
 */
export const ConflictCard: React.FC<ConflictCardProps> = ({
  conflict,
  selected = false,
  showFullPath = false,
  showPreview = true,
  previewLength = 50,
  onClick,
  className,
  conflictTypes = DEFAULT_CONFLICT_TYPES,
}) => {
  const typeInfo = conflictTypes[conflict.type] || DEFAULT_CONFLICT_TYPES[ConflictType.OTHER];

  return (
    <div
      className={clsx(
        'border rounded-lg p-4 mb-4 cursor-pointer transition-all',
        selected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-blue-300',
        className
      )}
      onClick={onClick}
      aria-selected={selected}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
<>
          <span
            className={clsx('inline-block px-2 py-1 text-xs font-medium rounded', typeInfo.color)}
          >
            {typeInfo.label}
          </span>

          <span
</> className="ml-2 text-sm text-gray-500">
            {new Date(conflict.timestamp).toLocaleString()}
          </span>
        </div>

        {conflict.resolved && (
          <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
            Resolved
          </span>
        )}
      </div>

      <div className="mb-2">
<>
        <div className="text-sm font-medium text-gray-700">Path:</div>
        <div
</> className="text-sm font-mono">
          {conflict.path ? formatPath(conflict.path, showFullPath) : 'Root Object'}
        </div>
      </div>

      {showPreview && (
        <div className="grid grid-cols-2 gap-4">
          <div>
<>
            <div className="text-sm font-medium text-gray-700">Local:</div>
            <div
</> className="text-sm font-mono bg-gray-50 p-2 rounded overflow-hidden text-ellipsis">
              {formatValue(conflict.localValue, previewLength)}
            </div>
          </div>

          <div>
<>
            <div className="text-sm font-medium text-gray-700">Remote:</div>
            <div
</> className="text-sm font-mono bg-gray-50 p-2 rounded overflow-hidden text-ellipsis">
              {formatValue(conflict.remoteValue, previewLength)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ConflictCard component story
 */
export default {
  title: 'Conflict Resolution/ConflictCard',
  component: ConflictCard,
  parameters: {
    docs: {
      description: {
        component: 'A card that displays information about a single conflict',
      },
    },
  },
};
