/**
 * TerraFusion Canon Home
 *
 * Standalone home page for TerraCanon (IDE) using the shared StandaloneHomeShell.
 * Phase 30: Launch spine — route + root landmark.
 * Phase 31: Workspace bootstrap — IDE interior layout skeleton.
 *
 * Layout:
 *   terracanon-root
 *     └─ terracanon-workspace
 *          ├─ terracanon-filetree (sidebar)
 *          └─ terracanon-editor (main pane)
 *               └─ terracanon-no-workspace (empty state)
 *
 * No persistence, no real files, no LSP. Skeleton only.
 *
 * @module pages/CanonHome
 * @see Phase 30: TerraCanon Launch Spine Contract
 * @see Phase 31: TerraCanon Workspace Bootstrap Contract
 */

import React from 'react';
import { StandaloneHomeShell } from '../components/standalone';

// ============================================================================
// File Tree Pane (sidebar placeholder)
// ============================================================================

function FileTreePane(): React.ReactElement {
  return (
    <aside
      className='canon-filetree border-r border-gray-700/50 w-60 min-h-[200px] p-3'
      data-testid='terracanon-filetree'
    >
      <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>
        Explorer
      </h3>
      <p className='text-gray-500 text-xs italic'>No files open</p>
    </aside>
  );
}

// ============================================================================
// Editor Pane (main content area)
// ============================================================================

function EditorPane(): React.ReactElement {
  return (
    <section
      className='canon-editor flex-1 min-h-[200px] p-4 flex items-center justify-center'
      data-testid='terracanon-editor'
    >
      <div
        className='text-center text-gray-500'
        data-testid='terracanon-no-workspace'
      >
        <p className='text-lg mb-1'>No workspace loaded</p>
        <p className='text-sm'>Open a file or create a new workspace to get started.</p>
      </div>
    </section>
  );
}

// ============================================================================
// Workspace Shell (IDE layout container)
// ============================================================================

function CanonWorkspace(): React.ReactElement {
  return (
    <div
      className='canon-workspace flex border border-gray-700/30 rounded-lg overflow-hidden bg-gray-900/50'
      data-testid='terracanon-workspace'
    >
      <FileTreePane />
      <EditorPane />
    </div>
  );
}

// ============================================================================
// Canon Content (root landmark + workspace)
// ============================================================================

function CanonContent(): React.ReactElement {
  return (
    <div className='canon-console' data-testid='terracanon-root'>
      <section className='canon-console__overview mb-4'>
        <h2>TerraCanon IDE</h2>
        <p>Integrated development environment for TerraFusion OS.</p>
      </section>
      <CanonWorkspace />
    </div>
  );
}

export function CanonHome(): React.ReactElement {
  return (
    <StandaloneHomeShell
      featureId='canon'
      meta={{
        title: 'TerraCanon IDE',
        description: 'Integrated development environment for TerraFusion OS.',
        primaryActions: [
          {
            id: 'new-file',
            label: 'New File',
            intent: 'standalone',
          },
        ],
      }}
    >
      <CanonContent />
    </StandaloneHomeShell>
  );
}

export default CanonHome;
