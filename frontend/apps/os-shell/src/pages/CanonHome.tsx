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
 * Phase 39: Persist lastClosed — reopen-after-refresh via localStorage.
 * Phase 40: Cross-tab sync — storage events trigger safe state reload.
 * Phase 47: Operational hardening — versioned envelope v2, cross-tab determinism.
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
 * @see Phase 39: TerraCanon Persisted Reopen Contract
 * @see Phase 40: TerraCanon Cross-Tab Sync Contract
 * @see Phase 47: TerraCanon Operational Hardening (envelope v2)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { runCanonDoctor, type CanonDoctorResponse } from '../api/canonDoctor';
import { runCanonGateFast, type CanonGateFastResponse } from '../api/canonGateFast';
import { runCanonPing, type CanonPingResponse } from '../api/canonPing';
import { CanonAgentsPanel } from '../canon/CanonAgentsPanel';
import { CanonCommandPalette, type CanonCommand } from '../canon/CanonCommandPalette';
import { CanonModuleHost } from '../canon/CanonModuleHost';
import {
    isValidWorkspace,
    parseLastClosedV2,
    serializeLastClosedV2,
    STORAGE_KEY_LAST_CLOSED,
    type Workspace,
} from '../canon/governance';
import { invokeWithPreflight, type CanonInvokeResult } from '../canon/invokeWithPreflight';
import { BuiltinNoopModule } from '../canon/modules/BuiltinNoopModule';
import { useCanonLayout } from '../canon/useCanonLayout';
import { AuditEnvelope } from '../components/AuditEnvelope';
import { CommandPalette, type CommandPaletteItem } from '../components/CommandPalette';
import { RealityBoard } from '../components/RealityBoard';
import { StandaloneHomeShell } from '../components/standalone';
import '../styles/canon-ide.css';
import '../styles/canon.css';
import { LiquidPanel } from '../ui/materials';

// ============================================================================
// Workspace File types
// ============================================================================

interface WorkspaceFile {
  id: string;
  name: string;
  content: string;
}

function seedWorkspaceFiles(workspaceId: string): WorkspaceFile[] {
  return [
    {
      id: `${workspaceId}:readme`,
      name: 'README.md',
      content:
        '# Untitled Workspace\n\nWelcome to TerraCanon.\n\nThis workspace is ready for development.',
    },
    {
      id: `${workspaceId}:config`,
      name: 'terrafusion.json',
      content: '{\n  "version": "1.0",\n  "runtime": "canon",\n  "compliance": "FISMA-HIGH"\n}',
    },
  ];
}

// ============================================================================
// File Tree Pane
// ============================================================================

interface FileTreePaneProps {
  files: WorkspaceFile[];
  activeFileId: string | null;
  onOpenFile: (fileId: string) => void;
}

function FileTreePane({ files, activeFileId, onOpenFile }: FileTreePaneProps): React.ReactElement {
  return (
    <aside
      className='canon-filetree border-r border-gray-700/50 w-60 min-h-[200px] p-3'
      data-testid='terracanon-filetree'
    >
      <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>Files</h3>
      {files.length === 0 ? (
        <p className='text-gray-500 text-xs italic'>No files open</p>
      ) : (
        <div className='flex flex-col gap-0.5'>
          {files.map((file, i) => (
            <button
              key={file.id}
              className={`text-left px-2 py-0.5 text-xs rounded truncate ${
                file.id === activeFileId
                  ? 'bg-cyan-700/30 text-cyan-300'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
              data-testid={`terracanon-file-${i}`}
              onClick={() => onOpenFile(file.id)}
            >
              {file.name}
            </button>
          ))}
        </div>
      )}
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
  workspaces: Workspace[];
  activeIndex: number;
  onNewWorkspace: () => void;
  onCloseWorkspace: () => void;
  onReopenWorkspace: () => void;
  hasClosedHistory: boolean;
  onSwitchWorkspace: (index: number) => void;
  openTabs: WorkspaceFile[];
  activeFileId: string | null;
  onSwitchTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  drafts: Record<string, string>;
  onDraftChange: (fileId: string, content: string) => void;
  onSave: (fileId: string) => void;
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
  openTabs,
  activeFileId,
  onSwitchTab,
  onCloseTab,
  drafts,
  onDraftChange,
  onSave,
}: EditorPaneProps): React.ReactElement {
  const activeFile = openTabs.find((f) => f.id === activeFileId);
  const isFileDirty = (file: WorkspaceFile) =>
    drafts[file.id] !== undefined && drafts[file.id] !== file.content;
  return (
    <section
      className='canon-editor flex-1 min-h-[200px] flex flex-col'
      data-testid='terracanon-editor'
    >
      {/* ── Tab bar ────────────────────────────────────────────── */}
      {openTabs.length > 0 && (
        <div className='canon-ide__tab-bar' data-testid='terracanon-tab-bar'>
          {openTabs.map((file) => (
            <button
              key={file.id}
              className={`canon-ide__tab ${file.id === activeFileId ? 'canon-ide__tab--active' : ''} ${isFileDirty(file) ? 'canon-ide__tab--dirty' : ''}`}
              data-testid={`terracanon-tab-${file.name}`}
              onClick={() => onSwitchTab(file.id)}
            >
              <span>{isFileDirty(file) ? `● ${file.name}` : file.name}</span>
              <span
                className='canon-ide__tab-close'
                role='button'
                aria-label={`Close ${file.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(file.id);
                }}
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Content area ───────────────────────────────────────── */}
      {activeFile ? (
        <div className='canon-ide__editor-surface' data-testid='terracanon-editor-content'>
          {isFileDirty(activeFile) && (
            <div className='canon-ide__editor-toolbar'>
              <button
                className='px-2 py-0.5 text-xs rounded bg-cyan-700 hover:bg-cyan-600 text-white'
                data-testid='terracanon-save'
                onClick={() => onSave(activeFile.id)}
              >
                Save
              </button>
            </div>
          )}
          <textarea
            className='canon-ide__editor-textarea'
            data-testid='terracanon-editor-textarea'
            value={drafts[activeFile.id] ?? activeFile.content}
            onChange={(e) => onDraftChange(activeFile.id, e.target.value)}
          />
        </div>
      ) : hasWorkspace ? (
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
// Workspace Shell — structural landmark preserved for test compatibility
// ============================================================================

// CanonWorkspace is now layout-only: display:contents lets children participate
// in the parent IDE grid while preserving data-testid='terracanon-workspace'
// for phase 30-47 test contracts.

type RunAllStepId = 'doctor' | 'gatefast' | 'ping';
type RunAllStepStatus = 'idle' | 'running' | 'pass' | 'fail';

interface RunAllStepState {
  id: RunAllStepId;
  label: string;
  status: RunAllStepStatus;
  ts?: string;
  error?: string;
}

function buildInitialRunAllSteps(): RunAllStepState[] {
  return [
    { id: 'doctor', label: 'Canon Doctor', status: 'idle' },
    { id: 'gatefast', label: 'GateFast', status: 'idle' },
    { id: 'ping', label: 'Canon Ping', status: 'idle' },
  ];
}

// ============================================================================
// Canon Content (root landmark + IDE shell)
// ============================================================================

const STORAGE_KEY_WORKSPACES = 'tf.canon.workspaces.v1';
const STORAGE_KEY_ACTIVE = 'tf.canon.activeIndex.v1';
const STORAGE_KEY_FILES = 'tf.canon.files.v1';
// STORAGE_KEY_LAST_CLOSED imported from @/canon/governance (barrel)

function isValidWorkspaceArray(data: unknown): data is Workspace[] {
  if (!Array.isArray(data)) return false;
  return data.every(isValidWorkspace);
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

function isValidFileArray(data: unknown): data is WorkspaceFile[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (f) =>
      typeof f === 'object' &&
      f !== null &&
      typeof (f as WorkspaceFile).id === 'string' &&
      typeof (f as WorkspaceFile).name === 'string' &&
      typeof (f as WorkspaceFile).content === 'string'
  );
}

function loadPersistedFiles(): Record<string, WorkspaceFile[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FILES);
    if (raw === null) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const result: Record<string, WorkspaceFile[]> = {};
    for (const [wsId, files] of Object.entries(parsed)) {
      if (isValidFileArray(files)) result[wsId] = files;
    }
    return result;
  } catch {
    return {};
  }
}

function persistFiles(filesByWorkspace: Record<string, WorkspaceFile[]>): void {
  localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(filesByWorkspace));
}

// isValidWorkspace imported from @/canon/governance (Phase 41 dedup, Phase 47 barrel)

/**
 * Phase 47: Load lastClosed from localStorage with versioned envelope.
 *
 * Priority: v2 envelope → v1 bare workspace (upgrade path) → fail-closed.
 * Any unknown shape clears the key (fail-closed, no crash).
 */
function loadLastClosed(): Workspace | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_CLOSED);
    if (raw === null) return null;

    // Phase 47: Try v2 envelope first
    const v2 = parseLastClosedV2(raw);
    if (v2) return v2.workspace;

    // Fallback: v1 bare workspace shape (upgrade path — next write will use v2)
    const parsed = JSON.parse(raw);
    if (isValidWorkspace(parsed)) return parsed;

    // Unknown shape → fail-closed: clear key, return null
    localStorage.removeItem(STORAGE_KEY_LAST_CLOSED);
    return null;
  } catch {
    localStorage.removeItem(STORAGE_KEY_LAST_CLOSED);
    return null;
  }
}

let workspaceCounter = 0;

function CanonContent(): React.ReactElement {
  const [layout] = useCanonLayout();
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
  const [commandResult, setCommandResult] = useState<CanonInvokeResult | null>(null);
  const [commandRunning, setCommandRunning] = useState(false);
  const [pingEcho, setPingEcho] = useState('hello');
  const [pingRunning, setPingRunning] = useState(false);
  const [pingResult, setPingResult] = useState<CanonPingResponse | null>(null);
  const [doctorRunning, setDoctorRunning] = useState(false);
  const [doctorResult, setDoctorResult] = useState<CanonDoctorResponse | null>(null);
  const [gateFastRunning, setGateFastRunning] = useState(false);
  const [gateFastResult, setGateFastResult] = useState<CanonGateFastResponse | null>(null);
  const [runAllActive, setRunAllActive] = useState(false);
  const [runAllSteps, setRunAllSteps] = useState<RunAllStepState[]>(() =>
    buildInitialRunAllSteps()
  );
  const [commandHistory, setCommandHistory] = useState<{ id: string; ranAt: string }[]>([]);
  const [filesByWorkspace, setFilesByWorkspace] = useState<Record<string, WorkspaceFile[]>>(() =>
    loadPersistedFiles()
  );
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [, forceUpdate] = useState(0);
  const lastClosedRef = useRef<Workspace | null>(loadLastClosed());
  const mountedRef = useRef(false);
  const filesMountedRef = useRef(false);
  const syncingRef = useRef(false);

  const setRunAllStep = useCallback((id: RunAllStepId, patch: Partial<RunAllStepState>) => {
    setRunAllSteps((prev) => prev.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  }, []);

  const resetRunAll = useCallback(() => {
    setRunAllSteps(buildInitialRunAllSteps());
  }, []);

  const recordHistory = useCallback((id: string) => {
    setCommandHistory((prev) => {
      const next = [{ id, ranAt: new Date().toISOString() }, ...prev.filter((h) => h.id !== id)];
      return next.slice(0, 10);
    });
  }, []);

  const openFile = useCallback((fileId: string) => {
    setOpenTabs((prev) => (prev.includes(fileId) ? prev : [...prev, fileId]));
    setActiveFileId(fileId);
  }, []);

  const switchTab = useCallback((fileId: string) => {
    setActiveFileId(fileId);
  }, []);

  const closeTab = useCallback((fileId: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((id) => id !== fileId);
      setActiveFileId((prevActive) => {
        if (prevActive !== fileId) return prevActive;
        return next.length > 0 ? next[next.length - 1] : null;
      });
      return next;
    });
  }, []);

  const handleDraftChange = useCallback((fileId: string, content: string) => {
    setDrafts((prev) => ({ ...prev, [fileId]: content }));
  }, []);

  const handleSave = useCallback((fileId: string) => {
    setDrafts((prev) => {
      const draftContent = prev[fileId];
      if (draftContent === undefined) return prev;
      // Write draft into filesByWorkspace
      setFilesByWorkspace((prevFiles) => {
        const next = { ...prevFiles };
        for (const [wsId, files] of Object.entries(next)) {
          const idx = files.findIndex((f) => f.id === fileId);
          if (idx !== -1) {
            next[wsId] = files.map((f) =>
              f.id === fileId ? { ...f, content: draftContent } : f
            );
            break;
          }
        }
        return next;
      });
      // Remove draft entry
      const nextDrafts = { ...prev };
      delete nextDrafts[fileId];
      return nextDrafts;
    });
  }, []);

  // Persist on state change (skip initial mount and cross-tab sync writes)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (syncingRef.current) {
      syncingRef.current = false;
      return;
    }
    persistState(workspaces, activeIndex);
  }, [workspaces, activeIndex]);

  // Persist files on change (skip initial mount)
  useEffect(() => {
    if (!filesMountedRef.current) {
      filesMountedRef.current = true;
      return;
    }
    persistFiles(filesByWorkspace);
  }, [filesByWorkspace]);

  // Phase 40 + 47: Cross-tab sync — reload state when another tab writes to localStorage
  const handleStorageEvent = useCallback((e: StorageEvent) => {
    if (e.storageArea !== localStorage) return;

    if (e.key === STORAGE_KEY_WORKSPACES || e.key === STORAGE_KEY_ACTIVE) {
      const reloaded = loadPersistedState();
      if (reloaded) {
        // Reconcile workspaceCounter from reloaded IDs
        const maxId = reloaded.workspaces.reduce((max, ws) => {
          const match = ws.id.match(/^canon-workspace-(\d+)$/);
          return match ? Math.max(max, Number(match[1])) : max;
        }, 0);
        if (maxId > workspaceCounter) workspaceCounter = maxId;

        syncingRef.current = true;
        setWorkspaces(reloaded.workspaces);
        setActiveIndex(reloaded.activeIndex);
        setRenameDraft('');
      }
      // Malformed → ignore, keep current state (fail-closed)
    }

    // Phase 47: Cross-tab lastClosed sync via envelope v2
    if (e.key === STORAGE_KEY_LAST_CLOSED) {
      if (e.newValue === null) {
        // Another tab consumed the lastClosed (reopen or clear)
        lastClosedRef.current = null;
        forceUpdate((n) => n + 1);
      } else {
        // Phase 47: Parse via v2 envelope for cross-tab determinism
        const v2 = parseLastClosedV2(e.newValue);
        if (v2) {
          lastClosedRef.current = v2.workspace;
          forceUpdate((n) => n + 1);
        }
        // Malformed or non-v2 → ignore (fail-closed, no crash)
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [handleStorageEvent]);

  const hasWorkspace = workspaces.length > 0;
  const active = hasWorkspace ? workspaces[activeIndex] : null;
  const activeFiles = active ? (filesByWorkspace[active.id] ?? []) : [];
  const resolvedOpenTabs = openTabs
    .map((id) => activeFiles.find((f) => f.id === id))
    .filter((f): f is WorkspaceFile => f != null);

  const openEmptyWorkspace = () => {
    if (workspaces.length === 0) {
      workspaceCounter += 1;
      const wsId = `canon-workspace-${workspaceCounter}`;
      const ws: Workspace = { id: wsId, name: 'Untitled Workspace' };
      setWorkspaces([ws]);
      setActiveIndex(0);
      setRenameDraft('');
      setFilesByWorkspace((prev) => ({ ...prev, [wsId]: seedWorkspaceFiles(wsId) }));
      setOpenTabs([]);
      setActiveFileId(null);
    }
  };

  const newWorkspace = () => {
    workspaceCounter += 1;
    const wsId = `canon-workspace-${workspaceCounter}`;
    const ws: Workspace = { id: wsId, name: 'Untitled Workspace' };
    setWorkspaces((prev) => [...prev, ws]);
    setActiveIndex(workspaces.length);
    setRenameDraft('');
    setFilesByWorkspace((prev) => ({ ...prev, [wsId]: seedWorkspaceFiles(wsId) }));
    setOpenTabs([]);
    setActiveFileId(null);
  };

  const switchWorkspace = (index: number) => {
    if (index >= 0 && index < workspaces.length) {
      setActiveIndex(index);
      setRenameDraft('');
      setOpenTabs([]);
      setActiveFileId(null);
    }
  };

  const closeWorkspace = () => {
    if (workspaces.length === 0) return;
    const closed = workspaces[activeIndex];
    lastClosedRef.current = closed;
    // Phase 47: Serialize as v2 envelope (deterministic, upgrade-safe)
    localStorage.setItem(STORAGE_KEY_LAST_CLOSED, serializeLastClosedV2(closed));
    const next = workspaces.filter((_, i) => i !== activeIndex);
    setWorkspaces(next);
    setActiveIndex(next.length === 0 ? 0 : Math.min(activeIndex, next.length - 1));
    setRenameDraft('');
    // Keep files in localStorage (persist through close/reopen)
    setOpenTabs([]);
    setActiveFileId(null);
  };

  const reopenLastClosed = () => {
    const ws = lastClosedRef.current;
    if (!ws) return;
    lastClosedRef.current = null;
    localStorage.removeItem(STORAGE_KEY_LAST_CLOSED);
    setWorkspaces((prev) => [...prev, ws]);
    setActiveIndex(workspaces.length); // new last index
    setRenameDraft('');
    // Restore files: if persisted copy exists use it, otherwise seed fresh
    setFilesByWorkspace((prev) => {
      if (prev[ws.id] && prev[ws.id].length > 0) return prev;
      return { ...prev, [ws.id]: seedWorkspaceFiles(ws.id) };
    });
    setOpenTabs([]);
    setActiveFileId(null);
  };

  const hasClosedHistory = lastClosedRef.current !== null;

  const commitRename = () => {
    const next = renameDraft.trim();
    if (!next) return;
    setWorkspaces((prev) => prev.map((ws, i) => (i === activeIndex ? { ...ws, name: next } : ws)));
  };

  const runGovernedCommand = async () => {
    setCommandRunning(true);
    try {
      const outcome = await invokeWithPreflight({
        toolId: 'summarize_dossier',
        mode: 'muse',
        params: {
          dossierId: active?.id ?? 'canon-workspace',
        },
      });
      setCommandResult(outcome);
    } finally {
      setCommandRunning(false);
    }
  };

  const runCanonPingCommand = async () => {
    setPingRunning(true);
    try {
      const response = await runCanonPing(pingEcho);
      setPingResult(response);
    } finally {
      setPingRunning(false);
    }
  };

  const runCanonDoctorCommand = async () => {
    setDoctorRunning(true);
    try {
      const response = await runCanonDoctor();
      setDoctorResult(response);
    } finally {
      setDoctorRunning(false);
    }
  };

  const runCanonGateFastCommand = async () => {
    setGateFastRunning(true);
    try {
      const response = await runCanonGateFast();
      setGateFastResult(response);
    } finally {
      setGateFastRunning(false);
    }
  };

  const runAllChecks = async () => {
    if (runAllActive) return;

    const now = () => new Date().toISOString();
    setRunAllActive(true);
    resetRunAll();

    try {
      setRunAllStep('doctor', { status: 'running', ts: undefined, error: undefined });
      const doctor = await runCanonDoctor();
      setDoctorResult(doctor);
      if (!doctor.overallOk) {
        setRunAllStep('doctor', {
          status: 'fail',
          ts: doctor.startedAt || now(),
          error: doctor.error || 'Doctor failed',
        });
        return;
      }
      setRunAllStep('doctor', { status: 'pass', ts: doctor.startedAt || now() });

      setRunAllStep('gatefast', { status: 'running', ts: undefined, error: undefined });
      const gateFast = await runCanonGateFast();
      setGateFastResult(gateFast);
      if (!gateFast.overallOk) {
        setRunAllStep('gatefast', {
          status: 'fail',
          ts: gateFast.startedAt || now(),
          error: gateFast.error || 'GateFast failed',
        });
        return;
      }
      setRunAllStep('gatefast', { status: 'pass', ts: gateFast.startedAt || now() });

      setRunAllStep('ping', { status: 'running', ts: undefined, error: undefined });
      const ping = await runCanonPing(pingEcho);
      setPingResult(ping);
      if (!ping.overallOk) {
        setRunAllStep('ping', {
          status: 'fail',
          ts: ping.startedAt || now(),
          error: ping.error || 'Ping failed',
        });
        return;
      }
      setRunAllStep('ping', { status: 'pass', ts: ping.startedAt || now() });
    } finally {
      setRunAllActive(false);
    }
  };

  // ── Ctrl+K overlay commands ────────────────────────────────────
  const overlayCommands: CommandPaletteItem[] = useMemo(
    () => [
      {
        id: 'run-all',
        title: 'Run All Canon Tasks',
        subtitle: 'Doctor → Gatefast → Ping (sequential pipeline)',
        keywords: ['all', 'pipeline', 'ci', 'check'],
        run: runAllChecks,
      },
      {
        id: 'doctor',
        title: 'Run Doctor',
        subtitle: 'Diagnostics + environment check',
        keywords: ['health', 'diagnose'],
        run: runCanonDoctorCommand,
      },
      {
        id: 'gatefast',
        title: 'Run Gatefast',
        subtitle: 'Fast gate validation',
        keywords: ['gate', 'validate'],
        run: runCanonGateFastCommand,
      },
      {
        id: 'ping',
        title: 'Ping Runtime',
        subtitle: 'Reachability check',
        keywords: ['network', 'health'],
        run: runCanonPingCommand,
      },
      {
        id: 'governed-command',
        title: 'Run Governed Command',
        subtitle: 'Policy-wrapped command execution',
        keywords: ['policy', 'governance'],
        run: runGovernedCommand,
      },
    ],
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Recent items for Ctrl+K palette (derived from history) ─────
  const recentOverlayItems: CommandPaletteItem[] = useMemo(() => {
    return commandHistory
      .map((h) => {
        const original = overlayCommands.find((c) => c.id === h.id);
        if (!original) return null;
        return { ...original, subtitle: `Last run: ${h.ranAt.replace('T', ' ').slice(0, 19)}` };
      })
      .filter((x): x is CommandPaletteItem => x !== null);
  }, [commandHistory, overlayCommands]);

  // ── Command palette commands ────────────────────────────────────
  const paletteCommands: CanonCommand[] = useMemo(
    () => [
      {
        id: 'open-workspace',
        label: 'Open Empty Workspace',
        group: 'Workspace',
        onRun: openEmptyWorkspace,
        disabled: runAllActive,
      },
      { id: 'new-workspace', label: 'New Workspace', group: 'Workspace', onRun: newWorkspace },
      {
        id: 'run-all',
        label: 'Run All Checks',
        group: 'Tasks',
        onRun: runAllChecks,
        disabled: runAllActive,
      },
      {
        id: 'run-doctor',
        label: 'Run Canon Doctor',
        group: 'Tasks',
        onRun: runCanonDoctorCommand,
        disabled: doctorRunning || runAllActive,
      },
      {
        id: 'run-gatefast',
        label: 'Run GateFast',
        group: 'Tasks',
        onRun: runCanonGateFastCommand,
        disabled: gateFastRunning || runAllActive,
      },
      {
        id: 'run-ping',
        label: 'Run Canon Ping',
        group: 'Tasks',
        onRun: runCanonPingCommand,
        disabled: pingRunning || runAllActive,
      },
      {
        id: 'run-governed',
        label: 'Run Governed Command',
        group: 'Agents',
        onRun: runGovernedCommand,
        disabled: commandRunning || runAllActive,
      },
    ],
    [runAllActive, doctorRunning, gateFastRunning, pingRunning, commandRunning] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className='canon-shell' data-testid='terracanon-root'>
      <CommandPalette
        items={overlayCommands}
        recentItems={recentOverlayItems}
        onCommandRun={recordHistory}
      />
      <div className='canon-ide__hidden' data-testid='terracanon-layout-version'>
        v1:{layout.leftPaneWidth}:{layout.rightPaneWidth}:{layout.inspectorOpen ? '1' : '0'}
      </div>

      {/* ── Header ─ branding + command palette ────────────────────── */}
      <header className='canon-header' data-testid='canon-header'>
        <span className='canon-header__title'>TerraCanon</span>
        <LiquidPanel variant='shell' radius='none' className='flex-1'>
          <CanonCommandPalette commands={paletteCommands} />
        </LiquidPanel>
        <kbd className='canon-header__shortcut'>Ctrl+K</kbd>
      </header>

      {/* ── Dev Cockpit ─ primary surface ─────────────────────────── */}
      <section className='canon-devCockpit' data-testid='canon-devCockpit'>
        <div className='canon-devCockpit__inner canon-ide'>
          {/* ── Suite Launcher (workspace panels) ────────────────────── */}
          <div style={{ display: 'contents' }} data-testid='canon-suiteLauncher'>
            {/* ── Structural landmark for test compat (display:contents) ── */}
            <div style={{ display: 'contents' }} data-testid='terracanon-workspace'>
              {/* ── Explorer ─ Left sidebar ────────────────────────────────── */}
              <LiquidPanel variant='shell' radius='none' className='canon-ide__explorer'>
                <div className='canon-ide__explorer-header'>Explorer</div>

                <div className='canon-ide__explorer-section'>
                  <h4>Workspaces</h4>
                  {workspaces.length === 0 ? (
                    <p className='text-gray-500 text-xs italic'>No workspaces open</p>
                  ) : (
                    <div className='flex flex-col gap-0.5'>
                      {workspaces.map((ws, i) => (
                        <button
                          key={ws.id}
                          className={`text-left px-2 py-0.5 text-xs rounded truncate ${
                            i === activeIndex
                              ? 'bg-cyan-700/30 text-cyan-300'
                              : 'text-gray-400 hover:bg-gray-800'
                          }`}
                          data-testid={`terracanon-explorer-ws-${i}`}
                          onClick={() => switchWorkspace(i)}
                        >
                          {ws.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className='flex flex-col gap-1 mt-2'>
                  <button
                    className='px-2 py-1 text-xs rounded bg-cyan-700 hover:bg-cyan-600 text-white'
                    data-testid='terracanon-open-empty-workspace'
                    onClick={openEmptyWorkspace}
                    disabled={runAllActive}
                  >
                    + Open Workspace
                  </button>
                  {hasClosedHistory && (
                    <button
                      className='px-2 py-1 text-xs rounded bg-yellow-700 hover:bg-yellow-600 text-white'
                      data-testid='terracanon-explorer-reopen'
                      onClick={reopenLastClosed}
                    >
                      ↩ Reopen Last
                    </button>
                  )}
                </div>

                <FileTreePane
                  files={activeFiles}
                  activeFileId={activeFileId}
                  onOpenFile={openFile}
                />
              </LiquidPanel>

              {/* ── Editor ─ Center main area ──────────────────────────────── */}
              <LiquidPanel variant='infrastructure' radius='none' className='canon-ide__editor'>
                <EditorPane
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
                  openTabs={resolvedOpenTabs}
                  activeFileId={activeFileId}
                  onSwitchTab={switchTab}
                  onCloseTab={closeTab}
                  drafts={drafts}
                  onDraftChange={handleDraftChange}
                  onSave={handleSave}
                />
              </LiquidPanel>
            </div>
            {/* end terracanon-workspace landmark */}

            {/* ── Agents ─ Right sidebar (TerraPilot) ──────────────────── */}
            <LiquidPanel variant='shell' radius='none'>
              <CanonAgentsPanel workspaceId={active?.id ?? null} />
            </LiquidPanel>
          </div>
          {/* end canon-suiteLauncher */}

          {/* ── Tasks & Logs ─ Bottom panel ──────────────────────────── */}
          <LiquidPanel variant='infrastructure' radius='none' className='canon-ide__tasks'>
            <section data-testid='terracanon-safety-dashboard'>
              <div className='canon-ide__tasks-toolbar'>
                <span className='text-xs font-semibold text-gray-300 uppercase tracking-wider'>
                  Tasks
                </span>
                <button
                  className='px-3 py-1 text-xs rounded bg-teal-700 hover:bg-teal-600 text-white disabled:opacity-50'
                  data-testid='terracanon-run-all'
                  onClick={runAllChecks}
                  disabled={runAllActive}
                >
                  {runAllActive ? 'Running…' : 'Run All'}
                </button>
                <button
                  className='px-3 py-1 text-xs rounded bg-sky-700 hover:bg-sky-600 text-white disabled:opacity-50'
                  data-testid='terracanon-run-canon-doctor'
                  onClick={runCanonDoctorCommand}
                  disabled={doctorRunning || runAllActive}
                >
                  {doctorRunning ? 'Doctor…' : 'Doctor'}
                </button>
                <button
                  className='px-3 py-1 text-xs rounded bg-violet-700 hover:bg-violet-600 text-white disabled:opacity-50'
                  data-testid='terracanon-run-canon-gatefast'
                  onClick={runCanonGateFastCommand}
                  disabled={gateFastRunning || runAllActive}
                >
                  {gateFastRunning ? 'GateFast…' : 'GateFast'}
                </button>
                <input
                  className='px-2 py-1 text-xs rounded bg-gray-800 border border-gray-600 text-gray-300'
                  data-testid='terracanon-canon-ping-echo'
                  value={pingEcho}
                  onChange={(event) => setPingEcho(event.target.value)}
                  placeholder='Echo'
                  disabled={runAllActive}
                />
                <button
                  className='px-3 py-1 text-xs rounded bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-50'
                  data-testid='terracanon-run-canon-ping'
                  onClick={runCanonPingCommand}
                  disabled={pingRunning || runAllActive}
                >
                  {pingRunning ? 'Ping…' : 'Ping'}
                </button>
                <button
                  className='px-3 py-1 text-xs rounded bg-indigo-700 hover:bg-indigo-600 text-white disabled:opacity-50'
                  data-testid='terracanon-run-governed-command'
                  onClick={runGovernedCommand}
                  disabled={commandRunning || runAllActive}
                >
                  {commandRunning ? 'Running…' : 'Governed Cmd'}
                </button>
              </div>

              {/* ── Log output area ──────────────────────────────────────── */}
              <div className='canon-ide__tasks-log'>
                <div className='text-xs text-gray-300' data-testid='terracanon-run-all-status'>
                  {runAllSteps.map((step) => (
                    <div key={step.id} data-testid={`terracanon-run-all-step-${step.id}`}>
                      <span>{step.label}</span> <span>{step.status.toUpperCase()}</span>
                      {step.ts ? <span> — {step.ts}</span> : null}
                      {step.status === 'fail' && step.error ? (
                        <div data-testid={`terracanon-run-all-step-${step.id}-error`}>
                          {step.error}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* ── Run All rollup badge ──────────────────────────────── */}
                {(() => {
                  const hasRun = runAllSteps.some((s) => s.status !== 'idle');
                  if (!hasRun) return null;
                  const allPass = runAllSteps.every((s) => s.status === 'pass');
                  const anyFail = runAllSteps.some((s) => s.status === 'fail');
                  const anyRunning = runAllSteps.some((s) => s.status === 'running');
                  const overallOk = allPass && !anyFail && !anyRunning;
                  const firstFailStep = runAllSteps.find((s) => s.status === 'fail');
                  return (
                    <div data-testid='terracanon-run-all-rollup' className='mt-1'>
                      <AuditEnvelope
                        data={{
                          toolId: 'run-all-pipeline',
                          startedAt: runAllSteps[0]?.ts ?? new Date().toISOString(),
                          overallOk,
                          error: anyRunning
                            ? 'Pipeline running…'
                            : firstFailStep
                              ? `Failed at: ${firstFailStep.label}`
                              : undefined,
                        }}
                      />
                    </div>
                  );
                })()}

                {doctorResult && (
                  <div
                    className='mt-2 text-xs text-gray-300'
                    data-testid='terracanon-canon-doctor-result'
                  >
                    <AuditEnvelope
                      data={{
                        toolId: doctorResult.tool,
                        startedAt: doctorResult.startedAt,
                        overallOk: doctorResult.overallOk,
                        error: doctorResult.error,
                      }}
                    />
                    <div data-testid='terracanon-canon-doctor-status'>
                      Doctor: {doctorResult.overallOk ? 'PASS' : 'FAIL'}
                    </div>
                    <div data-testid='terracanon-canon-doctor-started'>
                      startedAt: {doctorResult.startedAt}
                    </div>
                    {!doctorResult.overallOk && (
                      <>
                        <div data-testid='terracanon-canon-doctor-error'>
                          {doctorResult.error || 'canon doctor failed'}
                        </div>
                        {(doctorResult.stderr ||
                          doctorResult.rawStdout ||
                          doctorResult.rawStderr) && (
                          <details className='mt-1' data-testid='terracanon-canon-doctor-details'>
                            <summary>Details</summary>
                            <pre className='mt-1 whitespace-pre-wrap break-all text-[11px] text-gray-400'>
                              {doctorResult.stderr ||
                                doctorResult.rawStderr ||
                                doctorResult.rawStdout}
                            </pre>
                          </details>
                        )}
                      </>
                    )}
                  </div>
                )}

                {gateFastResult && (
                  <div
                    className='mt-2 text-xs text-gray-300'
                    data-testid='terracanon-canon-gatefast-result'
                  >
                    <AuditEnvelope
                      data={{
                        toolId: gateFastResult.tool,
                        startedAt: gateFastResult.startedAt,
                        overallOk: gateFastResult.overallOk,
                        error: gateFastResult.error,
                      }}
                    />
                    <div data-testid='terracanon-canon-gatefast-status'>
                      GateFast: {gateFastResult.overallOk ? 'PASS' : 'FAIL'}
                    </div>
                    <div data-testid='terracanon-canon-gatefast-started'>
                      startedAt: {gateFastResult.startedAt}
                    </div>
                    {!gateFastResult.overallOk && (
                      <>
                        <div data-testid='terracanon-canon-gatefast-error'>
                          {gateFastResult.error || 'gatefast failed'}
                        </div>
                        {(gateFastResult.stderr ||
                          gateFastResult.rawStdout ||
                          gateFastResult.rawStderr) && (
                          <details className='mt-1' data-testid='terracanon-canon-gatefast-details'>
                            <summary>Details</summary>
                            <pre className='mt-1 whitespace-pre-wrap break-all text-[11px] text-gray-400'>
                              {gateFastResult.stderr ||
                                gateFastResult.rawStderr ||
                                gateFastResult.rawStdout}
                            </pre>
                          </details>
                        )}
                      </>
                    )}
                  </div>
                )}

                {pingResult && (
                  <div
                    className='mt-2 text-xs text-gray-300'
                    data-testid='terracanon-canon-ping-result'
                  >
                    <AuditEnvelope
                      data={{
                        toolId: pingResult.tool,
                        startedAt: pingResult.startedAt,
                        overallOk: pingResult.overallOk,
                        error: pingResult.error,
                      }}
                    />
                    {pingResult.overallOk && pingResult.normalized ? (
                      <>
                        <div data-testid='terracanon-canon-ping-ok'>
                          ok: {String(pingResult.normalized.ok)}
                        </div>
                        <div data-testid='terracanon-canon-ping-ts'>
                          ts: {pingResult.normalized.ts}
                        </div>
                        <div data-testid='terracanon-canon-ping-echo-value'>
                          echo: {pingResult.normalized.echo}
                        </div>
                        <div data-testid='terracanon-canon-ping-tool-id'>
                          toolId: {pingResult.normalized.toolId}
                        </div>
                        <div data-testid='terracanon-canon-ping-input-count'>
                          inputCount: {pingResult.normalized.inputCount}
                        </div>
                      </>
                    ) : (
                      <>
                        <div data-testid='terracanon-canon-ping-error'>
                          {pingResult.error || 'canon ping failed'}
                        </div>
                        {(pingResult.stderr || pingResult.rawStdout || pingResult.rawStderr) && (
                          <details
                            className='mt-1'
                            data-testid='terracanon-canon-ping-error-details'
                          >
                            <summary>Details</summary>
                            <pre className='mt-1 whitespace-pre-wrap break-all text-[11px] text-gray-400'>
                              {pingResult.stderr || pingResult.rawStderr || pingResult.rawStdout}
                            </pre>
                          </details>
                        )}
                      </>
                    )}
                  </div>
                )}

                {commandResult && (
                  <div
                    className='mt-2 text-xs text-gray-300'
                    data-testid='terracanon-command-result'
                  >
                    <AuditEnvelope
                      data={{
                        toolId: 'governed-command',
                        startedAt: new Date().toISOString(),
                        overallOk: commandResult.status === 'ok',
                        correlationId: commandResult.correlationId,
                        error: commandResult.status === 'denied' ? commandResult.reason : undefined,
                      }}
                    />
                    <div data-testid='terracanon-command-correlation'>
                      {commandResult.correlationId}
                    </div>
                    {commandResult.status === 'denied' && (
                      <div data-testid='terracanon-command-deny-reason'>{commandResult.reason}</div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <RealityBoard />
          </LiquidPanel>
        </div>
        {/* end canon-devCockpit__inner */}
      </section>
      {/* end canon-devCockpit */}

      <div className='canon-ide__hidden'>
        <CanonModuleHost module={BuiltinNoopModule} workspaceId={active?.id ?? null} />
      </div>
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
