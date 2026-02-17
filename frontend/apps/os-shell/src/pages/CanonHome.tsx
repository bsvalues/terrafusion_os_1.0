/**
 * TerraFusion Canon Home
 *
 * Standalone home page for TerraCanon (IDE) using the shared StandaloneHomeShell.
 * Phase 30: Launch spine — route + root landmark.
 * Phase 31: Workspace bootstrap — IDE interior layout skeleton.
 * Phase 32: Open empty workspace intent — state toggle + loaded landmark.
 * Phase 33: Workspace identity — session-stable name + id (no persistence).
 * Phase 34: Rename workspace intent — editable name (session-only, no persistence).
 *
 * Layout:
 *   terracanon-root
 *     └─ terracanon-workspace
 *          ├─ terracanon-filetree (sidebar)
 *          └─ terracanon-editor (main pane)
 *               ├─ terracanon-no-workspace (empty state, hidden when loaded)
 *               └─ terracanon-workspace-loaded (loaded state, shown after open)
 *                    ├─ terracanon-workspace-name (session identity, editable)
 *                    ├─ terracanon-workspace-id (session identity)
 *                    ├─ terracanon-rename-workspace-input (rename draft)
 *                    └─ terracanon-rename-workspace-commit (commit rename)
 *
 * State: local boolean `hasWorkspace` + useRef identity + renameDraft. No persistence, no filesystem, no LSP.
 *
 * @module pages/CanonHome
 * @see Phase 30: TerraCanon Launch Spine Contract
 * @see Phase 31: TerraCanon Workspace Bootstrap Contract
 * @see Phase 32: TerraCanon Open Empty Workspace Intent Contract
 * @see Phase 33: TerraCanon Workspace Identity Contract
 * @see Phase 34: TerraCanon Rename Workspace Intent Contract
 */

import React, { useRef, useState } from 'react';
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

interface EditorPaneProps {
  hasWorkspace: boolean;
  workspaceName: string | null;
  workspaceId: string | null;
  renameDraft: string;
  onRenameDraftChange: (value: string) => void;
  onCommitRename: () => void;
}

function EditorPane({ hasWorkspace, workspaceName, workspaceId, renameDraft, onRenameDraftChange, onCommitRename }: EditorPaneProps): React.ReactElement {
  return (
    <section
      className='canon-editor flex-1 min-h-[200px] p-4 flex items-center justify-center'
      data-testid='terracanon-editor'
    >
      {hasWorkspace ? (
        <div data-testid='terracanon-workspace-loaded'>
          <p className='text-lg mb-1 text-gray-300'>Workspace loaded</p>
          <p className='text-sm text-gray-500'>Ready to edit.</p>
          <div className='mt-2 text-xs text-gray-500'>
            <span data-testid='terracanon-workspace-name'>{workspaceName}</span>
            <span className='ml-2' data-testid='terracanon-workspace-id'>{workspaceId}</span>
          </div>
          <div className='mt-2 flex items-center gap-2'>
            <input
              className='px-2 py-1 text-xs rounded bg-gray-800 border border-gray-600 text-gray-300'
              data-testid='terracanon-rename-workspace-input'
              value={renameDraft}
              onChange={(e) => onRenameDraftChange(e.target.value)}
              placeholder='Rename workspace'
            />
            <button
              className='px-2 py-1 text-xs rounded bg-cyan-700 hover:bg-cyan-600 text-white'
              data-testid='terracanon-rename-workspace-commit'
              onClick={onCommitRename}
            >
              Rename
            </button>
          </div>
        </div>
      ) : (
        <div className='text-center text-gray-500' data-testid='terracanon-no-workspace'>
          <p className='text-lg mb-1'>No workspace loaded</p>
          <p className='text-sm'>Open a file or create a new workspace to get started.</p>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// Workspace Shell (IDE layout container)
// ============================================================================

interface CanonWorkspaceProps {
  hasWorkspace: boolean;
  workspaceName: string | null;
  workspaceId: string | null;
  renameDraft: string;
  onRenameDraftChange: (value: string) => void;
  onCommitRename: () => void;
}

function CanonWorkspace({ hasWorkspace, workspaceName, workspaceId, renameDraft, onRenameDraftChange, onCommitRename }: CanonWorkspaceProps): React.ReactElement {
  return (
    <div
      className='canon-workspace flex border border-gray-700/30 rounded-lg overflow-hidden bg-gray-900/50'
      data-testid='terracanon-workspace'
    >
      <FileTreePane />
      <EditorPane hasWorkspace={hasWorkspace} workspaceName={workspaceName} workspaceId={workspaceId} renameDraft={renameDraft} onRenameDraftChange={onRenameDraftChange} onCommitRename={onCommitRename} />
    </div>
  );
}

// ============================================================================
// Canon Content (root landmark + workspace)
// ============================================================================

let workspaceCounter = 0;

function CanonContent(): React.ReactElement {
  const [hasWorkspace, setHasWorkspace] = useState(false);
  const workspaceIdRef = useRef<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const openEmptyWorkspace = () => {
    if (!workspaceIdRef.current) {
      workspaceCounter += 1;
      workspaceIdRef.current = `canon-workspace-${workspaceCounter}`;
    }
    if (!workspaceName) {
      setWorkspaceName('Untitled Workspace');
    }
    setHasWorkspace(true);
  };

  const commitRename = () => {
    const next = renameDraft.trim();
    if (!next) return;
    setWorkspaceName(next);
  };

  return (
    <div className='canon-console' data-testid='terracanon-root'>
      <section className='canon-console__overview mb-4'>
        <h2>TerraCanon IDE</h2>
        <p>Integrated development environment for TerraFusion OS.</p>
        <button
          className='mt-2 px-3 py-1 text-sm rounded bg-cyan-700 hover:bg-cyan-600 text-white'
          data-testid='terracanon-open-empty-workspace'
          onClick={openEmptyWorkspace}
        >
          Open Empty Workspace
        </button>
      </section>
      <CanonWorkspace hasWorkspace={hasWorkspace} workspaceName={workspaceName} workspaceId={workspaceIdRef.current} renameDraft={renameDraft} onRenameDraftChange={setRenameDraft} onCommitRename={commitRename} />
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
