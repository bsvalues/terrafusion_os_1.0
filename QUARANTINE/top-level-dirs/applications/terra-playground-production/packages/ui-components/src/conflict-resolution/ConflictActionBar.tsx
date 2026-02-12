/**
 * ConflictActionBar Component
 *
 * Provides action buttons for resolving conflicts:
 * - Accept local version
 * - Accept remote version
 * - Custom merge
 * - Skip/defer resolution
 */

import React from 'react';
import clsx from 'clsx';
import { ResolutionStrategy } from '@terrafusion/offline-sync/src/conflict-resolution';
import { ConflictResolutionHandler, ResolutionOption } from './types';

export interface ConflictActionBarProps {
  /** Conflict ID */
  conflictId: string;
  /** User ID for tracking who resolved the conflict */
  userId: string;
  /** Conflict resolution handler */
  onResolve: ConflictResolutionHandler;
  /** Skip handler */
  onSkip?: () => void;
  /** Currently selected strategy */
  selectedStrategy?: ResolutionStrategy;
  /** Custom value when using custom strategy */
  customValue?: any;
  /** Handler for custom value changes */
  onCustomValueChange?: (value: any) => void;
  /** Whether the actions are disabled */
  disabled?: boolean;
  /** Available resolution strategies */
  availableStrategies?: ResolutionOption[];
  /** Additional CSS class names */
  className?: string;
  /** Variant */
  variant?: 'default' | 'compact' | 'expanded';
  /** Custom editor for custom value */
  customEditor?: React.ReactNode;
  /** Whether to show a loading indicator */
  loading?: boolean;
  /** Whether to show labels on buttons */
  showLabels?: boolean;
}

/**
 * Default resolution options
 */
const DEFAULT_RESOLUTION_OPTIONS: ResolutionOption[] = [
  {
    id: ResolutionStrategy.TAKE_LOCAL,
    label: 'Keep Local',
    description: 'Use your local version and discard remote changes',
  },
  {
    id: ResolutionStrategy.TAKE_REMOTE,
    label: 'Accept Remote',
    description: 'Use the remote version and discard your local changes',
  },
  {
    id: ResolutionStrategy.TAKE_NEWER,
    label: 'Keep Newer',
    description: 'Use the version with the most recent timestamp',
  },
  {
    id: ResolutionStrategy.MERGE,
    label: 'Auto Merge',
    description: 'Automatically merge changes when possible',
  },
  {
    id: ResolutionStrategy.CUSTOM,
    label: 'Custom Merge',
    description: 'Manually edit and create a custom merged version',
  },
];

/**
 * ConflictActionBar component
 */
export const ConflictActionBar: React.FC<ConflictActionBarProps> = ({
  conflictId,
  userId,
  onResolve,
  onSkip,
  selectedStrategy,
  customValue,
  onCustomValueChange,
  disabled = false,
  availableStrategies = DEFAULT_RESOLUTION_OPTIONS,
  className,
  variant = 'default',
  customEditor,
  loading = false,
  showLabels = true,
}) => {
  // Handle resolution
  const handleResolve = async (strategy: ResolutionStrategy) => {
    try {
      if (strategy === ResolutionStrategy.CUSTOM && !customValue) {
        // Don't proceed with custom resolution if no value provided
        return;
      }

      await onResolve(
        conflictId,
        strategy,
        userId,
        strategy === ResolutionStrategy.CUSTOM ? customValue : undefined
      );
    } catch (error) {
      console.error('Error resolving conflict:', error);
    }
  };

  // Filter available strategies based on variant
  const strategies = availableStrategies.filter(strategy => {
    if (variant === 'compact') {
      // In compact mode, only show basic options
      return [
        ResolutionStrategy.TAKE_LOCAL,
        ResolutionStrategy.TAKE_REMOTE,
        ResolutionStrategy.CUSTOM,
      ].includes(strategy.id);
    }
    return true;
  });

  return (
    <div
      className={clsx(
        'conflict-action-bar p-4 border border-gray-200 rounded-lg',
        variant === 'expanded' ? 'space-y-4' : 'flex items-center justify-between flex-wrap gap-2',
        className
      )}
    >
      {/* Strategy buttons */}
      <div className={clsx(variant === 'expanded' ? 'space-y-2' : 'flex flex-wrap gap-2')}>
        {strategies.map(strategy => (
          <button
            key={strategy.id}
            type="button"
            onClick={() => handleResolve(strategy.id)}
            disabled={
              disabled || loading || (strategy.id === ResolutionStrategy.CUSTOM && !customValue)
            }
            className={clsx(
              'py-2 px-4 rounded-md font-medium transition-colors',
              variant === 'expanded' ? 'w-full flex items-center' : '',
              strategy.id === selectedStrategy
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            title={strategy.description}
          >
            {strategy.icon && <span className="mr-2">{strategy.icon}</span>}
            {showLabels && strategy.label}
          </button>
        ))}
      </div>

      {/* Skip button */}
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled || loading}
          className={clsx(
            'py-2 px-4 rounded-md font-medium transition-colors',
            'bg-gray-50 text-gray-500 hover:bg-gray-100',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title="Skip this conflict for now"
        >
          {showLabels && 'Skip'}
        </button>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center text-blue-500">
          <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            /><>

            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span
</>>Resolving...</span>
        </div>
      )}

      {/* Custom editor */}
      {selectedStrategy === ResolutionStrategy.CUSTOM && (
        <div className="mt-4 w-full">
          {customEditor || (
            <div className="space-y-2"><>

              <label className="block text-sm font-medium text-gray-700">Custom Value</label>
              <textarea
</>
                value={
                  typeof customValue === 'string'
                    ? customValue
                    : JSON.stringify(customValue, null, 2)
                }
                onChange={e => onCustomValueChange && onCustomValueChange(e.target.value)}
                disabled={disabled || loading}
                className={clsx(
                  'w-full min-h-[100px] p-2 border border-gray-300 rounded-md font-mono text-sm',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                placeholder="Enter or edit the custom value here..."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * ConflictActionBar component story
 */
export default {
  title: 'Conflict Resolution/ConflictActionBar',
  component: ConflictActionBar,
  parameters: {
    docs: {
      description: {
        component: 'Provides action buttons for resolving conflicts',
      },
    },
  },
};
