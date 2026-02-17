/**
 * TerraFusion Canon Home
 *
 * Standalone home page for TerraCanon (IDE) using the shared StandaloneHomeShell.
 * Phase 30: Launch spine — route + root landmark.
 * Phase 31: Workspace bootstrap — IDE interior layout skeleton.
 * Phase 32: Open empty workspace intent — state toggle + loaded landmark.
 * Phase 33: Workspace identity — session-stable name + id (no persistence).
 * Phase 34: Rename workspace intent — editable name (session-only, no persistence).
 * Phase 35: Multi-workspace switcher — in-memory array, active index, per-workspace rename.
 * Phase 36: Close workspace intent — remove active, fallback or return to empty.
 * Phase 37: Reopen last closed workspace — undo-close via lastClosedRef.
 * Phase 38: Persistence spine — localStorage v1, schema-safe restore.
 *
 * Layout:
 *   terracanon-root
 *     └─ terracanon-workspace
 *          ├─ terracanon-filetree (sidebar)
 *          └─ terracanon-editor (main pane)
 *               ├─ terracanon-no-workspace (empty state, hidden when loaded)
 *               │    └─ terracanon-reopen-workspace (reopen, if history)
 *               └─ terracanon-workspace-loaded (loaded state, shown after open)
 *                    ├─ terracanon-workspace-name (active workspace name)
 *                    ├─ terracanon-workspace-id (active workspace id)
 *                    ├─ terracanon-rename-workspace-input (rename draft)
 *                    ├─ terracanon-rename-workspace-commit (commit rename)
 *                    ├─ terracanon-new-workspace (create additional workspace)
 *                    ├─ terracanon-close-workspace (close active workspace)
 *                    ├─ terracanon-reopen-workspace (reopen last closed)
 *                    └─ terracanon-workspace-switcher (switch active workspace)
 *                         ├─ terracanon-workspace-item-0
 *                         └─ terracanon-workspace-item-N
 *
 * State: workspaces[] array + activeIndex. Persisted to localStorage (v1 keys).
 * No filesystem, no LSP.
 *
 * @module pages/CanonHome
 * @see Phase 30: TerraCanon Launch Spine Contract
 * @see Phase 31: TerraCanon Workspace Bootstrap Contract
 * @see Phase 32: TerraCanon Open Empty Workspace Intent Contract
 * @see Phase 33: TerraCanon Workspace Identity Contract
 * @see Phase 34: TerraCanon Rename Workspace Intent Contract
 * @see Phase 35: TerraCanon Multi-Workspace Switcher Contract
 * @see Phase 36: TerraCanon Close Workspace Intent Contract
 * @see Phase 37: TerraCanon Reopen Last Closed Workspace Contract
 * @see Phase 38: TerraCanon Persistence Spine Contract
 */

import React, { useEffect, useRef, useState } from 'react';
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

interface Workspace {
  id: string;
  name: string;
}

interface EditorPaneProps {
  hasWorkspace: boolean;
  workspaceName: string | null;
  workspaceId: string | null;
  renameDraft: string;
  onRenameDraftChange: (value: string) => void;
  onCommitRename: () => void;
  workspaces: Workspace[];
  activeIndex: number;
  onNewWorkspace: () => void;
  onCloseWorkspace: () => void;
  onReopenWorkspace: () => void;
  hasClosedHistory: boolean;
  onSwitchWorkspace: (index: number) => void;
}

function EditorPane({
  hasWorkspace,
  workspaceName,
  workspaceId,
  renameDraft,
  onRenameDraftChange,
  onCommitRename,
  workspaces,
  activeIndex,
  onNewWorkspace,
  onCloseWorkspace,
  onReopenWorkspace,
  hasClosedHistory,
  onSwitchWorkspace,
}: EditorPaneProps): React.ReactElement {
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
            <span className='ml-2' data-testid='terracanon-workspace-id'>
              {workspaceId}
            </span>
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
            <button
              className='px-2 py-1 text-xs rounded bg-cyan-700 hover:bg-cyan-600 text-white'
              data-testid='terracanon-new-workspace'
              onClick={onNewWorkspace}
            >
              New Workspace
            </button>
            <button
              className='px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600 text-white'
              data-testid='terracanon-close-workspace'
              onClick={onCloseWorkspace}
            >
              Close
            </button>
            {hasClosedHistory && (
              <button
                className='px-2 py-1 text-xs rounded bg-yellow-700 hover:bg-yellow-600 text-white'
                data-testid='terracanon-reopen-workspace'
                onClick={onReopenWorkspace}
              >
                Reopen
              </button>
            )}
          </div>
          <div className='mt-2 flex items-center gap-1' data-testid='terracanon-workspace-switcher'>
            {workspaces.map((ws, i) => (
              <button
                key={ws.id}
                className={`px-2 py-0.5 text-xs rounded ${
                  i === activeIndex
                    ? 'bg-cyan-700 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
                data-testid={`terracanon-workspace-item-${i}`}
                onClick={() => onSwitchWorkspace(i)}
              >
                {ws.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className='text-center text-gray-500' data-testid='terracanon-no-workspace'>
          <p className='text-lg mb-1'>No workspace loaded</p>
          <p className='text-sm'>Open a file or create a new workspace to get started.</p>
          {hasClosedHistory && (
            <button
              className='mt-2 px-2 py-1 text-xs rounded bg-yellow-700 hover:bg-yellow-600 text-white'
              data-testid='terracanon-reopen-workspace'
              onClick={onReopenWorkspace}
            >
              Reopen Last Closed
            </button>
          )}
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
  workspaces: Workspace[];
  activeIndex: number;
  onNewWorkspace: () => void;
  onCloseWorkspace: () => void;
  onReopenWorkspace: () => void;
  hasClosedHistory: boolean;
  onSwitchWorkspace: (index: number) => void;
}

function CanonWorkspace({
  hasWorkspace,
  workspaceName,
  workspaceId,
  renameDraft,
  onRenameDraftChange,
  onCommitRename,
  workspaces,
  activeIndex,
  onNewWorkspace,
  onCloseWorkspace,
  onReopenWorkspace,
  hasClosedHistory,
  onSwitchWorkspace,
}: CanonWorkspaceProps): React.ReactElement {
  return (
    <div
      className='canon-workspace flex border border-gray-700/30 rounded-lg overflow-hidden bg-gray-900/50'
      data-testid='terracanon-workspace'
    >
      <FileTreePane />
      <EditorPane
        hasWorkspace={hasWorkspace}
        workspaceName={workspaceName}
        workspaceId={workspaceId}
        renameDraft={renameDraft}
        onRenameDraftChange={onRenameDraftChange}
        onCommitRename={onCommitRename}
        workspaces={workspaces}
        activeIndex={activeIndex}
        onNewWorkspace={onNewWorkspace}
        onCloseWorkspace={onCloseWorkspace}
        onReopenWorkspace={onReopenWorkspace}
        hasClosedHistory={hasClosedHistory}
        onSwitchWorkspace={onSwitchWorkspace}
      />
    </div>
  );
}

// ============================================================================
// Canon Content (root landmark + workspace)
// ============================================================================

const STORAGE_KEY_WORKSPACES = 'tf.canon.workspaces.v1';
const STORAGE_KEY_ACTIVE = 'tf.canon.activeIndex.v1';

function isValidWorkspaceArray(data: unknown): data is Workspace[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Workspace).id === 'string' &&
      (item as Workspace).id.length > 0 &&
      typeof (item as Workspace).name === 'string' &&
      (item as Workspace).name.length > 0,
  );
}

function loadPersistedState(): { workspaces: Workspace[]; activeIndex: number } | null {
  try {
    const rawWs = localStorage.getItem(STORAGE_KEY_WORKSPACES);
    const rawIdx = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (rawWs === null || rawIdx === null) return null;
    const parsed = JSON.parse(rawWs);
    if (!isValidWorkspaceArray(parsed)) return null;
    const idx = Number(rawIdx);
    if (!Number.isInteger(idx) || idx < 0 || idx >= parsed.length) return null;
    return { workspaces: parsed, activeIndex: idx };
  } catch {
    return null;
  }
}

function persistState(workspaces: Workspace[], activeIndex: number): void {
  localStorage.setItem(STORAGE_KEY_WORKSPACES, JSON.stringify(workspaces));
  localStorage.setItem(STORAGE_KEY_ACTIVE, String(activeIndex));
}

let workspaceCounter = 0;

function CanonContent(): React.ReactElement {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      const maxId = persisted.workspaces.reduce((max, ws) => {
        const match = ws.id.match(/^canon-workspace-(\d+)$/);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0);
      if (maxId > workspaceCounter) workspaceCounter = maxId;
    }
    return persisted ? persisted.workspaces : [];
  });
  const [activeIndex, setActiveIndex] = useState(() => {
    const persisted = loadPersistedState();
    return persisted ? persisted.activeIndex : 0;
  });
  const [renameDraft, setRenameDraft] = useState('');
  const lastClosedRef = useRef<Workspace | null>(null);
  const mountedRef = useRef(false);

  // Persist on state change (skip initial mount to avoid double-write)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    persistState(workspaces, activeIndex);
  }, [workspaces, activeIndex]);

  const hasWorkspace = workspaces.length > 0;
  const active = hasWorkspace ? workspaces[activeIndex] : null;

  const openEmptyWorkspace = () => {
    if (workspaces.length === 0) {
      workspaceCounter += 1;
      const ws: Workspace = {
        id: `canon-workspace-${workspaceCounter}`,
        name: 'Untitled Workspace',
      };
      setWorkspaces([ws]);
      setActiveIndex(0);
      setRenameDraft('');
    }
  };

  const newWorkspace = () => {
    workspaceCounter += 1;
    const ws: Workspace = {
      id: `canon-workspace-${workspaceCounter}`,
      name: 'Untitled Workspace',
    };
    setWorkspaces((prev) => [...prev, ws]);
    setActiveIndex(workspaces.length); // will be the new last index
    setRenameDraft('');
  };

  const switchWorkspace = (index: number) => {
    if (index >= 0 && index < workspaces.length) {
      setActiveIndex(index);
      setRenameDraft('');
    }
  };

  const closeWorkspace = () => {
    if (workspaces.length === 0) return;
    lastClosedRef.current = workspaces[activeIndex];
    const next = workspaces.filter((_, i) => i !== activeIndex);
    setWorkspaces(next);
    setActiveIndex(next.length === 0 ? 0 : Math.min(activeIndex, next.length - 1));
    setRenameDraft('');
  };

  const reopenLastClosed = () => {
    const ws = lastClosedRef.current;
    if (!ws) return;
    lastClosedRef.current = null;
    setWorkspaces((prev) => [...prev, ws]);
    setActiveIndex(workspaces.length); // new last index
    setRenameDraft('');
  };

  const hasClosedHistory = lastClosedRef.current !== null;

  const commitRename = () => {
    const next = renameDraft.trim();
    if (!next) return;
    setWorkspaces((prev) => prev.map((ws, i) => (i === activeIndex ? { ...ws, name: next } : ws)));
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
      <CanonWorkspace
        hasWorkspace={hasWorkspace}
        workspaceName={active?.name ?? null}
        workspaceId={active?.id ?? null}
        renameDraft={renameDraft}
        onRenameDraftChange={setRenameDraft}
        onCommitRename={commitRename}
        workspaces={workspaces}
        activeIndex={activeIndex}
        onNewWorkspace={newWorkspace}
        onCloseWorkspace={closeWorkspace}
        onReopenWorkspace={reopenLastClosed}
        hasClosedHistory={hasClosedHistory}
        onSwitchWorkspace={switchWorkspace}
      />
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
