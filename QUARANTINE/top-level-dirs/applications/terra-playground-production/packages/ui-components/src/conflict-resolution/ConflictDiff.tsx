/**
 * ConflictDiff Component
 *
 * Shows differences between local and remote versions of data.
 * Supports different diff visualization styles and data types.
 */

import React, { useMemo } from 'react';
import clsx from 'clsx';
import { ConflictDetails } from '@terrafusion/offline-sync/src/conflict-resolution';
import { ChangeType, DiffItem } from './types';

export interface ConflictDiffProps {
  /** The conflict details */
  conflict: ConflictDetails;
  /** Diff visualization style */
  diffStyle?: 'side-by-side' | 'inline';
  /** Whether to wrap text */
  wrapText?: boolean;
  /** Number of context lines to show (for text diffs) */
  contextLines?: number;
  /** Additional CSS class names */
  className?: string;
  /** Diff text mode */
  textMode?: 'text' | 'json' | 'auto';
  /** Custom diff renderer */
  customRenderer?: (local: any, remote: any) => React.ReactNode;
  /** Show visual status (icons, colors) */
  showVisualStatus?: boolean;
}

/**
 * Determine if a value is a primitive
 */
const isPrimitive = (value: any): boolean => {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
};

/**
 * Generate text diff items
 */
const generateTextDiffItems = (local: string, remote: string): DiffItem[] => {
  // Simple diff implementation
  // In a real implementation, use a proper diff algorithm
  if (local === remote) {
    return [{ type: ChangeType.UNCHANGED, value: local }];
  }

  return [
    { type: ChangeType.REMOVED, value: local },
    { type: ChangeType.ADDED, value: remote },
  ];
};

/**
 * Generate object diff items
 */
const generateObjectDiffItems = (local: any, remote: any, path: string = ''): DiffItem[] => {
  const items: DiffItem[] = [];

  // Handle null/undefined
  if (local === null || local === undefined || remote === null || remote === undefined) {
    if (local === remote) {
      items.push({ type: ChangeType.UNCHANGED, value: local, path });
    } else {
      if (local !== null && local !== undefined) {
        items.push({ type: ChangeType.REMOVED, value: local, path });
      }
      if (remote !== null && remote !== undefined) {
        items.push({ type: ChangeType.ADDED, value: remote, path });
      }
    }
    return items;
  }

  // Handle different types
  if (typeof local !== typeof remote) {
    items.push({ type: ChangeType.REMOVED, value: local, path });
    items.push({ type: ChangeType.ADDED, value: remote, path });
    return items;
  }

  // Handle arrays
  if (Array.isArray(local) && Array.isArray(remote)) {
    if (local.length === 0 && remote.length === 0) {
      items.push({ type: ChangeType.UNCHANGED, value: [], path });
      return items;
    }

    // Simple array diff - future improvement could use LCS or similar
    if (local.length !== remote.length) {
      items.push({ type: ChangeType.REMOVED, value: local, path });
      items.push({ type: ChangeType.ADDED, value: remote, path });
      return items;
    }

    // Compare each element
    for (let i = 0; i < local.length; i++) {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`;
      const elementDiff = generateObjectDiffItems(local[i], remote[i], itemPath);
      items.push(...elementDiff);
    }

    return items;
  }

  // Handle objects
  if (typeof local === 'object' && typeof remote === 'object') {
    const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const key of allKeys) {
      const itemPath = path ? `${path}.${key}` : key;

      if (!(key in local)) {
        items.push({ type: ChangeType.ADDED, value: remote[key], path: itemPath });
      } else if (!(key in remote)) {
        items.push({ type: ChangeType.REMOVED, value: local[key], path: itemPath });
      } else {
        const valueDiff = generateObjectDiffItems(local[key], remote[key], itemPath);
        items.push(...valueDiff);
      }
    }

    return items;
  }

  // Handle primitives
  if (local === remote) {
    items.push({ type: ChangeType.UNCHANGED, value: local, path });
  } else {
    items.push({ type: ChangeType.REMOVED, value: local, path });
    items.push({ type: ChangeType.ADDED, value: remote, path });
  }

  return items;
};

/**
 * Format a value for display
 */
const formatValue = (value: any, textMode: 'text' | 'json' | 'auto'): string => {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (textMode === 'json' || (textMode === 'auto' && typeof value === 'object')) {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
};

/**
 * Render a diff item
 */
const renderDiffItem = (
  item: DiffItem,
  index: number,
  showVisualStatus: boolean
): React.ReactNode => {
  const colorClasses = {
    [ChangeType.ADDED]: 'bg-green-50 text-green-800 border-l-4 border-green-500',
    [ChangeType.REMOVED]: 'bg-red-50 text-red-800 border-l-4 border-red-500',
    [ChangeType.UNCHANGED]: 'bg-gray-50 text-gray-800',
    [ChangeType.MODIFIED]: 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500',
  };

  const iconClasses = {
    [ChangeType.ADDED]: 'text-green-500',
    [ChangeType.REMOVED]: 'text-red-500',
    [ChangeType.UNCHANGED]: 'text-gray-400',
    [ChangeType.MODIFIED]: 'text-yellow-500',
  };

  const icons = {
    [ChangeType.ADDED]: '+',
    [ChangeType.REMOVED]: '-',
    [ChangeType.UNCHANGED]: ' ',
    [ChangeType.MODIFIED]: '~',
  };

  return (
    <div
      key={`diff-item-${index}`}
      className={clsx('py-1 px-2 font-mono text-sm', colorClasses[item.type])}
    >
      {showVisualStatus && (
        <span className={clsx('inline-block w-4 mr-2', iconClasses[item.type])}>
          {icons[item.type]}
        </span>
      )}

      {item.path && <span className="font-bold mr-2">{item.path}: </span>}

      <span className="whitespace-pre-wrap">
        {typeof item.value === 'object' ? JSON.stringify(item.value, null, 2) : String(item.value)}
      </span>
    </div>
  );
};

/**
 * ConflictDiff component
 */
export const ConflictDiff: React.FC<ConflictDiffProps> = ({
  conflict,
  diffStyle = 'side-by-side',
  wrapText = true,
  contextLines = 3,
  className,
  textMode = 'auto',
  customRenderer,
  showVisualStatus = true,
}) => {
  // Use custom renderer if provided
  if (customRenderer) {
    return (
      <div className={clsx('conflict-diff', className)}>
        {customRenderer(conflict.localValue, conflict.remoteValue)}
      </div>
    );
  }

  // Generate diff items based on data type
  const diffItems = useMemo(() => {
    const { localValue, remoteValue } = conflict;

    // Handle string diffs
    if (typeof localValue === 'string' && typeof remoteValue === 'string') {
      return generateTextDiffItems(localValue, remoteValue);
    }

    // Handle object diffs
    return generateObjectDiffItems(localValue, remoteValue);
  }, [conflict]);

  // Render side-by-side diff
  if (diffStyle === 'side-by-side') {
    return (
      <div className={clsx('conflict-diff grid grid-cols-2 gap-4', className)}>
        <div className="local-changes"><>

          <div className="p-2 bg-gray-100 font-medium text-gray-700 rounded-t-lg border border-gray-200">
            Local Changes
          </div>
          <div
</>
            className={clsx(
              'border border-t-0 border-gray-200 rounded-b-lg overflow-auto p-2',
              !wrapText && 'whitespace-pre'
            )}
          >
            <pre className="text-sm font-mono">{formatValue(conflict.localValue, textMode)}</pre>
          </div>
        </div>

        <div className="remote-changes"><>

          <div className="p-2 bg-gray-100 font-medium text-gray-700 rounded-t-lg border border-gray-200">
            Remote Changes
          </div>
          <div
</>
            className={clsx(
              'border border-t-0 border-gray-200 rounded-b-lg overflow-auto p-2',
              !wrapText && 'whitespace-pre'
            )}
          >
            <pre className="text-sm font-mono">{formatValue(conflict.remoteValue, textMode)}</pre>
          </div>
        </div>
      </div>
    );
  }

  // Render inline diff
  return (
    <div className={clsx('conflict-diff', className)}><>

      <div className="p-2 bg-gray-100 font-medium text-gray-700 rounded-t-lg border border-gray-200">
        Changes
      </div>
      <div
</>
        className={clsx(
          'border border-t-0 border-gray-200 rounded-b-lg overflow-auto',
          !wrapText && 'whitespace-pre'
        )}
      >
        {diffItems.map((item /* , index */) => renderDiffItem(item, index, showVisualStatus))}
      </div>
    </div>
  );
};

/**
 * ConflictDiff component story
 */
export default {
  title: 'Conflict Resolution/ConflictDiff',
  component: ConflictDiff,
  parameters: {
    docs: {
      description: {
        component: 'Shows differences between local and remote versions of data',
      },
    },
  },
};
