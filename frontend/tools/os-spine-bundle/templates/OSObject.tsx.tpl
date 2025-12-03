/**
 * __OS_OBJECT_NAME__
 *
 * OS-level primitive (domain-neutral).
 * Wired to the intent spine via useOmniIntent.
 *
 * @see docs/os-workspace-spine-spec.md
 */

import React from 'react';
import { useOmniIntent } from '../core/state/OmniIntentContext';

export interface __OS_OBJECT_NAME__Props {
  /** Workspace context for scoping activity */
  workspaceId?: string;
}

/**
 * __OS_OBJECT_NAME__ – OS catalog primitive
 *
 * Usage via catalog:
 * ```tsx
 * const Comp = resolveOSObjectComponent('__OS_OBJECT_ID__');
 * <Comp workspaceId="home" />
 * ```
 */
export const __OS_OBJECT_NAME__: React.FC<__OS_OBJECT_NAME__Props> = ({
  workspaceId,
}) => {
  const { emitIntent } = useOmniIntent();

  const handleClick = () => {
    emitIntent('object_selected', {
      workspaceId,
      objectId: '__OS_OBJECT_ID__',
      objectType: '__OS_OBJECT_NAME__',
    });
  };

  return (
    <div
      data-testid="__OS_OBJECT_ID__"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      style={{
        padding: '8px 12px',
        borderRadius: 4,
        cursor: 'pointer',
        border: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
      }}
    >
      <strong>__OS_OBJECT_NAME__</strong>
    </div>
  );
};

export default __OS_OBJECT_NAME__;
