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

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createCanonFile, deleteCanonFile, diffCanonFiles, renameCanonFile, fetchReadFile, writeCanonFile, fetchGitStatus, fetchRecentFiles, fetchFormatFile, fetchEditorLayout, type GitStatusEntry, type EditorLayoutMode } from '../api/canonFs';
import type { CursorPosition, CanonEditorHandle } from '../canon/CanonEditor';
import { detectLanguage } from '../canon/CanonEditor';
import { BreadcrumbBar } from '../canon/BreadcrumbBar';
import { CanonNotificationHost, useCanonNotifications } from '../canon/CanonNotification';
import { ConfirmDialog } from '../canon/ConfirmDialog';
import { NewFileDialog } from '../canon/NewFileDialog';
import { RenameDialog } from '../canon/RenameDialog';
import { useEditorSettings } from '../canon/useEditorSettings';
import type { EditorSettings } from '../canon/useEditorSettings';
import CanonSettingsPanel from '../canon/CanonSettingsPanel';
import CanonFindReplacePanel from '../canon/CanonFindReplacePanel';
import { SETTING_TO_THEME } from '../canon/canonEditorTheme';

const LazyCanonEditor = React.lazy(() =>
  import('../canon/CanonEditor').then((m) => ({ default: m.CanonEditor })),
);
const LazyCanonDiffViewer = React.lazy(() =>
  import('../canon/CanonDiffViewer').then((m) => ({ default: m.CanonDiffViewer })),
);
import { CanonAgentsPanel } from '../canon/CanonAgentsPanel';
import { CanonCommandPalette, type CanonCommand } from '../canon/CanonCommandPalette';
import { CanonFileTree } from '../canon/CanonFileTree';
import { CanonModuleHost } from '../canon/CanonModuleHost';
import { CanonOutlinePanel } from '../canon/CanonOutlinePanel';
import { CanonProblemsPanel } from '../canon/CanonProblemsPanel';
import { CanonBookmarksPanel } from '../canon/CanonBookmarksPanel';
import { CanonSnippetsPanel } from '../components/canon/CanonSnippetsPanel';
import { CanonMinimapPanel } from '../components/canon/CanonMinimapPanel';
import CanonQuickOpen from '../canon/CanonQuickOpen';
import CanonGoToSymbol from '../canon/CanonGoToSymbol';
import { CanonSearchPanel } from '../canon/CanonSearchPanel';
import { CanonStatusBar } from '../canon/CanonStatusBar';
import CanonTerminal from '../canon/CanonTerminal';
import { GoToLineDialog } from '../canon/GoToLineDialog';
import { useCanonConnection } from '../canon/useCanonConnection';
import { GoldenCorpusPanel } from '../canon/GoldenCorpusPanel';
import {
    isValidWorkspace,
    parseLastClosedV2,
    serializeLastClosedV2,
    STORAGE_KEY_LAST_CLOSED,
    type Workspace,
} from '../canon/governance';
import { GateRunnerPanel, type GateRunnerHandle } from '../canon/GateRunnerPanel';
import { invokeWithPreflight } from '../canon/invokeWithPreflight';
import { BuiltinNoopModule } from '../canon/modules/BuiltinNoopModule';
import { useCanonLayout } from '../canon/useCanonLayout';
import { CommandPalette, type CommandPaletteItem } from '../components/CommandPalette';
import { StandaloneHomeShell } from '../components/standalone';
import '../styles/canon-ide.css';
import '../styles/canon.css';
import { LiquidPanel } from '../ui/materials';
import { explainContext } from '../api/explainApi';
import {
  generateCorrelationId,
  emitToolInvoked,
  emitToolSucceeded,
  emitToolFailed,
  getTraceContext,
} from '../services/terraTrace';

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
  onMoveTab?: (fromIndex: number, toIndex: number) => void;
  drafts: Record<string, string>;
  onDraftChange: (fileId: string, content: string) => void;
  onSave: (fileId: string) => void;
  onCursorChange?: (pos: CursorPosition) => void;
  editorRef?: React.Ref<CanonEditorHandle>;
  editorSettings: EditorSettings;
  activeFilePath: string | null;
  diffData: Record<string, { leftPath: string; rightPath: string; leftContent: string; rightContent: string }>;
  markers?: import('../api/canonFs').LineMarker[];
  onGotoFile?: (filePath: string, line: number) => void;
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
  onMoveTab,
  drafts,
  onDraftChange,
  onSave,
  onCursorChange,
  editorRef,
  editorSettings,
  activeFilePath,
  diffData,
  markers,
  onGotoFile,
}: EditorPaneProps): React.ReactElement {
  const activeFile = openTabs.find((f) => f.id === activeFileId);
  const isFileDirty = (file: WorkspaceFile) =>
    drafts[file.id] !== undefined && drafts[file.id] !== file.content;

  // Ctrl+S save keybinding
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeFileId) onSave(activeFileId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeFileId, onSave]);

  return (
    <section
      className='canon-editor flex-1 min-h-[200px] flex flex-col'
      data-testid='terracanon-editor'
    >
      {/* ── Tab bar ────────────────────────────────────────────── */}
      {openTabs.length > 0 && (
        <div className='canon-ide__tab-bar' data-testid='terracanon-tab-bar'>
          {openTabs.map((file, idx) => (
            <button
              key={file.id}
              className={`canon-ide__tab ${file.id === activeFileId ? 'canon-ide__tab--active' : ''} ${isFileDirty(file) ? 'canon-ide__tab--dirty' : ''}`}
              data-testid={`terracanon-tab-${file.name}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(idx));
                e.dataTransfer.effectAllowed = 'move';
                (e.currentTarget as HTMLElement).classList.add('canon-ide__tab--dragging');
              }}
              onDragEnd={(e) => {
                (e.currentTarget as HTMLElement).classList.remove('canon-ide__tab--dragging');
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                (e.currentTarget as HTMLElement).classList.add('canon-ide__tab--drop-target');
              }}
              onDragLeave={(e) => {
                (e.currentTarget as HTMLElement).classList.remove('canon-ide__tab--drop-target');
              }}
              onDrop={(e) => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).classList.remove('canon-ide__tab--drop-target');
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (!isNaN(fromIndex) && fromIndex !== idx && onMoveTab) {
                  onMoveTab(fromIndex, idx);
                }
              }}
              onClick={() => onSwitchTab(file.id)}
              onMouseDown={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  onCloseTab(file.id);
                }
              }}
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

      {/* ── Breadcrumb bar ─────────────────────────────────────── */}
      {activeFile && activeFilePath && (
        <BreadcrumbBar filePath={activeFilePath} />
      )}

      {/* ── Content area ───────────────────────────────────────── */}
      {activeFile ? (
        <div className='canon-ide__editor-surface' data-testid='terracanon-editor-content'>
          {activeFile.id.includes(':diff:') && diffData[activeFile.id] ? (
            <Suspense fallback={<div className='canon-monaco-loading'>Loading diff viewer…</div>}>
              <LazyCanonDiffViewer
                leftPath={diffData[activeFile.id].leftPath}
                rightPath={diffData[activeFile.id].rightPath}
                leftContent={diffData[activeFile.id].leftContent}
                rightContent={diffData[activeFile.id].rightContent}
              />
            </Suspense>
          ) : (
            <>
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
              <Suspense fallback={<div className='canon-monaco-loading'>Loading editor…</div>}>
                <LazyCanonEditor
                  fileName={activeFile.name}
                  value={drafts[activeFile.id] ?? activeFile.content}
                  onChange={(val) => onDraftChange(activeFile.id, val)}
                  readOnly={false}
                  onCursorChange={onCursorChange}
                  editorRef={editorRef}
                  minimap={editorSettings.minimap}
                  wordWrap={editorSettings.wordWrap}
                  fontSize={editorSettings.fontSize}
                  stickyScroll={editorSettings.stickyScroll}
                  markers={markers}
                  onGotoFile={onGotoFile}
                  themeName={SETTING_TO_THEME[editorSettings.theme] ?? 'terracanon-dark'}
                />
              </Suspense>
            </>
          )}
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
  const connection = useCanonConnection();
  const {
    settings: editorSettings,
    toggleMinimap,
    toggleWordWrap,
    toggleStickyScroll,
    increaseFontSize,
    decreaseFontSize,
    setTheme,
  } = useEditorSettings();
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

  const gateRunnerRef = useRef<GateRunnerHandle>(null);
  const [commandHistory, setCommandHistory] = useState<{ id: string; ranAt: string }[]>([]);
  const [filesByWorkspace, setFilesByWorkspace] = useState<Record<string, WorkspaceFile[]>>(() =>
    loadPersistedFiles()
  );
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sidebarTab, setSidebarTab] = useState<'explorer' | 'search' | 'outline' | 'bookmarks' | 'snippets' | 'settings'>('explorer');
  const [bottomTab, setBottomTab] = useState<'gates' | 'terminal' | 'problems'>('gates');
  const [cursorPos, setCursorPos] = useState<CursorPosition | null>(null);
  const [goToLineOpen, setGoToLineOpen] = useState(false);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [quickOpenVisible, setQuickOpenVisible] = useState(false);
  const [goToSymbolVisible, setGoToSymbolVisible] = useState(false);
  const [findReplaceVisible, setFindReplaceVisible] = useState(false);
  const [diffLeftPath, setDiffLeftPath] = useState<string | null>(null);
  const [diffData, setDiffData] = useState<Record<string, { leftPath: string; rightPath: string; leftContent: string; rightContent: string }>>({});
  const [gitStatusEntries, setGitStatusEntries] = useState<GitStatusEntry[]>([]);
  const [gitBranch, setGitBranch] = useState<string>('');
  const canonEditorRef = useRef<CanonEditorHandle | null>(null);
  const secondaryEditorRef = useRef<CanonEditorHandle | null>(null);
  const [editorLayoutMode, setEditorLayoutMode] = useState<EditorLayoutMode>('single');
  const [secondaryActiveFileId, setSecondaryActiveFileId] = useState<string | null>(null);
  const [editorMarkers, setEditorMarkers] = useState<import('../api/canonFs').LineMarker[]>([]);
  const { items: notifications, dismiss: dismissNotification, notify } = useCanonNotifications();
  const [, forceUpdate] = useState(0);
  const lastClosedRef = useRef<Workspace | null>(loadLastClosed());
  const mountedRef = useRef(false);
  const filesMountedRef = useRef(false);
  const syncingRef = useRef(false);

  const hasWorkspace = workspaces.length > 0;
  const active = hasWorkspace ? workspaces[activeIndex] : null;

  const recordHistory = useCallback((id: string) => {
    setCommandHistory((prev) => {
      const next = [{ id, ranAt: new Date().toISOString() }, ...prev.filter((h) => h.id !== id)];
      return next.slice(0, 10);
    });
  }, []);

  const openFile = useCallback((fileId: string) => {
    setOpenTabs((prev) => (prev.includes(fileId) ? prev : [...prev, fileId]));
    setActiveFileId(fileId);

    // Track in recent files (fire-and-forget). Extract filePath from fileId format "wsId:browse:path".
    const browseIdx = fileId.indexOf(':browse:');
    if (browseIdx !== -1) {
      const filePath = fileId.slice(browseIdx + ':browse:'.length);
      fetchRecentFiles('add', filePath).catch(() => {/* ignore */});
    }
  }, []);

  /** Open a file from the read-only explorer tree (fetches content from pilot runtime). */
  const handleExplorerFileSelect = useCallback(
    async (payload: { filePath: string; language: string }) => {
      // Ensure there's a workspace
      if (!active) return;
      const wsId = active.id;
      const fileId = `${wsId}:browse:${payload.filePath}`;

      // Check if already loaded
      const existing = (filesByWorkspace[wsId] ?? []).find((f) => f.id === fileId);
      if (existing) {
        openFile(fileId);
        return;
      }

      // Fetch content from the pilot runtime
      const result = await fetchReadFile(payload.filePath);
      if (result.error) {
        return;
      }

      const name = payload.filePath.split('/').pop() ?? payload.filePath;
      setFilesByWorkspace((prev) => ({
        ...prev,
        [wsId]: [...(prev[wsId] ?? []), { id: fileId, name, content: result.content }],
      }));
      openFile(fileId);
    },
    [active, filesByWorkspace, openFile],
  );

  /** Open a file from search results (reuses explorer flow). */
  const handleSearchFileSelect = useCallback(
    (filePath: string, _line?: number) => {
      void handleExplorerFileSelect({ filePath, language: 'plaintext' });
    },
    [handleExplorerFileSelect],
  );

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

  const moveTab = useCallback((fromIndex: number, toIndex: number) => {
    setOpenTabs((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) return prev;
      if (fromIndex === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
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

      // If this is a browse file, persist to disk via the pilot runtime
      const browseMarker = ':browse:';
      if (fileId.includes(browseMarker)) {
        const filePath = fileId.slice(fileId.indexOf(browseMarker) + browseMarker.length);
        void writeCanonFile(filePath, draftContent).then((result) => {
          if (result.error) {
            notify(`Save failed: ${result.error}`, 'error');
          } else {
            notify(`Saved ${filePath}`, 'success');
            refreshGitStatus();
          }
        });
      }

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
  }, [notify]);

  // Extract file path from browse file IDs (format: "wsId:browse:path/to/file")
  const activeFilePath = useMemo(() => {
    if (!activeFileId) return null;
    const browseIdx = activeFileId.indexOf(':browse:');
    if (browseIdx !== -1) return activeFileId.slice(browseIdx + ':browse:'.length);
    return null;
  }, [activeFileId]);

  /** Format the currently active file via the pilot runtime. */
  const formatActiveFile = useCallback(async () => {
    if (!activeFilePath) {
      notify('No file open to format', 'info');
      return;
    }
    const result = await fetchFormatFile({ filePath: activeFilePath });
    if (result.error) {
      notify(`Format failed: ${result.error}`, 'error');
      return;
    }
    if (!result.formatted) {
      notify(`Already formatted (${result.language})`, 'info');
      return;
    }
    // Update the editor content with the formatted result
    if (result.content != null && activeFileId) {
      setFilesByWorkspace((prev) => {
        const next = { ...prev };
        for (const [wsId, files] of Object.entries(next)) {
          const idx = files.findIndex((f) => f.id === activeFileId);
          if (idx !== -1) {
            next[wsId] = files.map((f) =>
              f.id === activeFileId ? { ...f, content: result.content! } : f
            );
            break;
          }
        }
        return next;
      });
      // Clear any draft for this file since we just synced
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[activeFileId];
        return next;
      });
    }
    notify(`Formatted ${result.language} (${result.durationMs}ms)`, 'success');
    refreshGitStatus();
  }, [activeFilePath, activeFileId, notify]);

  /** Explain the active file context via TerraPilot Muse (read-only). */
  const handleCanonExplain = useCallback(async () => {
    const { countyId } = getTraceContext();
    const correlationId = generateCorrelationId();
    const contextId = activeFilePath ?? 'canon';
    emitToolInvoked({ suite: 'os', correlationId, countyId, inputSummary: `canon.explain:${contextId}`, risk: 'read_only' });
    try {
      const result = await explainContext({
        contextType: 'TerraCanon',
        contextId,
        metadata: { filePath: activeFilePath },
      });
      emitToolSucceeded({ suite: 'os', correlationId, countyId, outputSummary: `explained:${contextId}` });
      notify(result.explanation?.slice(0, 120) ?? 'Explanation ready', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      emitToolFailed({ suite: 'os', correlationId, countyId, outputSummary: message });
      notify(`Explain failed: ${message}`, 'error');
    }
  }, [activeFilePath, notify]);

  /** Create a new file on disk and open it in the editor. */
  const handleNewFile = useCallback(
    async (filePath: string) => {
      const result = await createCanonFile(filePath, '');
      if (result.error) {
        notify(`Create failed: ${result.error}`, 'error');
        return;
      }
      notify(`Created ${filePath}`, 'success');
      refreshGitStatus();

      // Open the newly created file in the editor
      if (active) {
        const wsId = active.id;
        const fileId = `${wsId}:browse:${filePath}`;
        setFilesByWorkspace((prev) => ({
          ...prev,
          [wsId]: [...(prev[wsId] ?? []), { id: fileId, name: filePath.split('/').pop() ?? filePath, content: '' }],
        }));
        openFile(fileId);
      }
    },
    [active, notify, openFile],
  );

  /** Request deletion (opens confirmation dialog). */
  const handleDeleteRequest = useCallback((filePath: string) => {
    setDeleteTarget(filePath);
  }, []);

  /** Confirm and execute file deletion. */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const filePath = deleteTarget;
    setDeleteTarget(null);

    const result = await deleteCanonFile(filePath);
    if (result.error) {
      notify(`Delete failed: ${result.error}`, 'error');
      return;
    }
    notify(`Deleted ${filePath}`, 'success');
    refreshGitStatus();

    // Close the tab if the deleted file is open
    if (active) {
      const wsId = active.id;
      const fileId = `${wsId}:browse:${filePath}`;
      setOpenTabs((prev) => {
        const next = prev.filter((id) => id !== fileId);
        setActiveFileId((prevActive) => {
          if (prevActive !== fileId) return prevActive;
          return next.length > 0 ? next[next.length - 1] : null;
        });
        return next;
      });
      // Remove from filesByWorkspace
      setFilesByWorkspace((prev) => {
        const files = prev[wsId];
        if (!files) return prev;
        return { ...prev, [wsId]: files.filter((f) => f.id !== fileId) };
      });
      // Remove draft if any
      setDrafts((prev) => {
        if (!(fileId in prev)) return prev;
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
    }
  }, [active, deleteTarget, notify]);

  /** Request rename (opens rename dialog). */
  const handleRenameRequest = useCallback((filePath: string) => {
    setRenameTarget(filePath);
  }, []);

  /** Confirm and execute file rename. */
  const handleRenameConfirm = useCallback(async (newPath: string) => {
    if (!renameTarget) return;
    const oldPath = renameTarget;
    setRenameTarget(null);

    const result = await renameCanonFile(oldPath, newPath);
    if (result.error) {
      notify(`Rename failed: ${result.error}`, 'error');
      return;
    }
    notify(`Renamed → ${newPath}`, 'success');
    refreshGitStatus();

    // Update open tab if the renamed file was open
    if (active) {
      const wsId = active.id;
      const oldFileId = `${wsId}:browse:${oldPath}`;
      const newFileId = `${wsId}:browse:${newPath}`;

      setOpenTabs((prev) => {
        const idx = prev.indexOf(oldFileId);
        if (idx < 0) return prev;
        const next = [...prev];
        next[idx] = newFileId;
        return next;
      });

      setActiveFileId((prev) => (prev === oldFileId ? newFileId : prev));

      setFilesByWorkspace((prev) => {
        const files = prev[wsId];
        if (!files) return prev;
        return {
          ...prev,
          [wsId]: files.map((f) => {
            if (f.id !== oldFileId) return f;
            const fileName = newPath.split('/').pop() ?? newPath;
            return { ...f, id: newFileId, name: fileName, content: f.content };
          }),
        };
      });

      setDrafts((prev) => {
        if (!(oldFileId in prev)) return prev;
        const next = { ...prev, [newFileId]: prev[oldFileId] };
        delete next[oldFileId];
        return next;
      });
    }
  }, [active, renameTarget, notify]);

  /** Handle compare request: two-click flow — first click selects left, second triggers diff. */
  const handleCompareRequest = useCallback(async (filePath: string) => {
    if (!diffLeftPath) {
      setDiffLeftPath(filePath);
      notify(`Compare: selected "${filePath.split('/').pop()}" as left. Click another file to compare.`, 'info');
      return;
    }
    if (diffLeftPath === filePath) {
      setDiffLeftPath(null);
      notify('Compare cancelled — same file selected.', 'info');
      return;
    }

    const leftPath = diffLeftPath;
    const rightPath = filePath;
    setDiffLeftPath(null);

    notify('Loading diff…', 'info');
    const result = await diffCanonFiles(leftPath, rightPath);
    if (result.error) {
      notify(`Diff failed: ${result.error}`, 'error');
      return;
    }

    // Open diff in a special tab
    if (active) {
      const wsId = active.id;
      const diffTabId = `${wsId}:diff:${leftPath}↔${rightPath}`;
      const leftName = leftPath.split('/').pop() ?? leftPath;
      const rightName = rightPath.split('/').pop() ?? rightPath;

      setDiffData((prev) => ({
        ...prev,
        [diffTabId]: { leftPath, rightPath, leftContent: result.leftContent, rightContent: result.rightContent },
      }));

      setFilesByWorkspace((prev) => {
        const files = prev[wsId] ?? [];
        if (files.some((f) => f.id === diffTabId)) return prev;
        return {
          ...prev,
          [wsId]: [...files, { id: diffTabId, name: `${leftName} ↔ ${rightName}`, content: '' }],
        };
      });

      setOpenTabs((prev) => (prev.includes(diffTabId) ? prev : [...prev, diffTabId]));
      setActiveFileId(diffTabId);
      notify(`Comparing ${leftName} ↔ ${rightName}`, 'success');
    }
  }, [active, diffLeftPath, notify]);

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

  // Phase O: Fetch git status on mount and refresh helper
  const refreshGitStatus = useCallback(async () => {
    const result = await fetchGitStatus();
    if (!result.error) {
      setGitStatusEntries(result.entries);
      setGitBranch(result.branch);
    }
  }, []);

  useEffect(() => {
    refreshGitStatus();
  }, [refreshGitStatus]);

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

  const activeFiles = active ? (filesByWorkspace[active.id] ?? []) : [];
  const resolvedOpenTabs = openTabs
    .map((id) => activeFiles.find((f) => f.id === id))
    .filter((f): f is WorkspaceFile => f != null);
  const activeFileName = resolvedOpenTabs.find((f) => f.id === activeFileId)?.name ?? null;

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

  const runGovernedCommand = useCallback(() => {
    gateRunnerRef.current?.runGoverned();
  }, []);

  // ── Gate runner delegates (thin wrappers for palette/overlay) ───
  const runCanonPingCommand = useCallback(() => {
    gateRunnerRef.current?.runPing();
  }, []);
  const runCanonDoctorCommand = useCallback(() => {
    gateRunnerRef.current?.runDoctor();
  }, []);
  const runCanonGateFastCommand = useCallback(() => {
    gateRunnerRef.current?.runGateFast();
  }, []);
  const runAllChecks = useCallback(() => {
    gateRunnerRef.current?.runAll();
  }, []);

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
      },
      { id: 'new-workspace', label: 'New Workspace', group: 'Workspace', onRun: newWorkspace },
      {
        id: 'run-all',
        label: 'Run All Checks',
        group: 'Tasks',
        onRun: runAllChecks,
        disabled: gateRunnerRef.current?.isRunning,
      },
      {
        id: 'run-doctor',
        label: 'Run Canon Doctor',
        group: 'Tasks',
        onRun: runCanonDoctorCommand,
        disabled: gateRunnerRef.current?.isRunning,
      },
      {
        id: 'run-gatefast',
        label: 'Run GateFast',
        group: 'Tasks',
        onRun: runCanonGateFastCommand,
        disabled: gateRunnerRef.current?.isRunning,
      },
      {
        id: 'run-ping',
        label: 'Run Canon Ping',
        group: 'Tasks',
        onRun: runCanonPingCommand,
        disabled: gateRunnerRef.current?.isRunning,
      },
      {
        id: 'run-governed',
        label: 'Run Governed Command',
        group: 'Agents',
        onRun: runGovernedCommand,
        disabled: gateRunnerRef.current?.isRunning,
      },
      {
        id: 'search-files',
        label: 'Search in Files',
        group: 'Navigation',
        onRun: () => setSidebarTab('search'),
      },
      {
        id: 'new-file',
        label: 'New File',
        group: 'File',
        onRun: () => setNewFileOpen(true),
      },
      {
        id: 'open-terminal',
        label: 'Open Terminal',
        group: 'Navigation',
        onRun: () => setBottomTab('terminal'),
      },
      {
        id: 'go-to-line',
        label: 'Go to Line',
        group: 'Navigation',
        onRun: () => setGoToLineOpen(true),
      },
      {
        id: 'toggle-minimap',
        label: 'Toggle Minimap',
        group: 'Editor',
        onRun: toggleMinimap,
      },
      {
        id: 'toggle-word-wrap',
        label: 'Toggle Word Wrap',
        group: 'Editor',
        onRun: toggleWordWrap,
      },
      {
        id: 'increase-font-size',
        label: 'Increase Font Size',
        group: 'Editor',
        onRun: increaseFontSize,
      },
      {
        id: 'decrease-font-size',
        label: 'Decrease Font Size',
        group: 'Editor',
        onRun: decreaseFontSize,
      },
      {
        id: 'compare-files',
        label: 'Compare Files',
        group: 'File',
        onRun: () => {
          setDiffLeftPath(null);
          notify('Compare: click a file in the explorer to select the left side.', 'info');
          setSidebarTab('explorer');
        },
      },
      {
        id: 'show-outline',
        label: 'Show Outline',
        group: 'View',
        onRun: () => {
          setSidebarTab('outline');
        },
      },
      {
        id: 'show-problems',
        label: 'Show Problems',
        group: 'View',
        onRun: () => {
          setBottomTab('problems');
        },
      },
      {
        id: 'show-bookmarks',
        label: 'Show Bookmarks',
        group: 'View',
        onRun: () => {
          setSidebarTab('bookmarks');
        },
      },
      {
        id: 'quick-open',
        label: 'Quick Open (Ctrl+P)',
        group: 'Navigation',
        onRun: () => {
          setQuickOpenVisible(true);
        },
      },
      {
        id: 'go-to-symbol',
        label: 'Go to Symbol in Workspace (Ctrl+T)',
        group: 'Navigation',
        onRun: () => {
          setGoToSymbolVisible(true);
        },
      },
      {
        id: 'find-replace',
        label: 'Find & Replace (Ctrl+H)',
        group: 'Navigation',
        onRun: () => {
          setFindReplaceVisible(true);
        },
      },
      {
        id: 'format-document',
        label: 'Format Document (Shift+Alt+F)',
        group: 'Edit',
        onRun: () => {
          void formatActiveFile();
        },
      },
      {
        id: 'split-editor-right',
        label: 'Split Editor Right (Ctrl+\\)',
        group: 'View',
        onRun: () => {
          setEditorLayoutMode((prev) => prev === 'split-vertical' ? 'single' : 'split-vertical');
          void fetchEditorLayout('set', 'split-vertical');
        },
      },
      {
        id: 'split-editor-down',
        label: 'Split Editor Down',
        group: 'View',
        onRun: () => {
          setEditorLayoutMode((prev) => prev === 'split-horizontal' ? 'single' : 'split-horizontal');
          void fetchEditorLayout('set', 'split-horizontal');
        },
      },
      {
        id: 'close-split',
        label: 'Close Split Editor',
        group: 'View',
        onRun: () => {
          setEditorLayoutMode('single');
          setSecondaryActiveFileId(null);
          void fetchEditorLayout('set', 'single');
        },
      },
      {
        id: 'fold-all',
        label: 'Fold All (Ctrl+K Ctrl+0)',
        group: 'Editor',
        onRun: () => {
          canonEditorRef.current?.foldAll();
        },
      },
      {
        id: 'unfold-all',
        label: 'Unfold All (Ctrl+K Ctrl+J)',
        group: 'Editor',
        onRun: () => {
          canonEditorRef.current?.unfoldAll();
        },
      },
      {
        id: 'clear-markers',
        label: 'Clear All Markers',
        group: 'Editor',
        onRun: () => {
          setEditorMarkers([]);
          canonEditorRef.current?.clearMarkers();
        },
      },
      {
        id: 'add-cursor-above',
        label: 'Add Cursor Above (Ctrl+Alt+Up)',
        group: 'Multi-Cursor',
        onRun: () => { canonEditorRef.current?.addCursorAbove(); },
      },
      {
        id: 'add-cursor-below',
        label: 'Add Cursor Below (Ctrl+Alt+Down)',
        group: 'Multi-Cursor',
        onRun: () => { canonEditorRef.current?.addCursorBelow(); },
      },
      {
        id: 'select-next-occurrence',
        label: 'Select Next Occurrence (Ctrl+D)',
        group: 'Multi-Cursor',
        onRun: () => { canonEditorRef.current?.selectNextOccurrence(); },
      },
      {
        id: 'select-all-occurrences',
        label: 'Select All Occurrences (Ctrl+Shift+L)',
        group: 'Multi-Cursor',
        onRun: () => { canonEditorRef.current?.selectAllOccurrences(); },
      },
      {
        id: 'select-to-bracket',
        label: 'Select to Bracket (Ctrl+Shift+\\)',
        group: 'Multi-Cursor',
        onRun: () => { canonEditorRef.current?.selectToBracket(); },
      },
      {
        id: 'explain-active-file',
        label: 'Explain with Pilot (Muse)',
        group: 'AI',
        onRun: () => { void handleCanonExplain(); },
      },
    ],
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Ctrl+Shift+F → focus search panel ──────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        setSidebarTab('search');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Ctrl+N → new file dialog ───────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'n') {
        e.preventDefault();
        setNewFileOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Ctrl+P → quick open (file picker) ──────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setQuickOpenVisible(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Ctrl+T → go to symbol in workspace ─────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 't') {
        e.preventDefault();
        setGoToSymbolVisible(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Ctrl+` → toggle terminal panel ─────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setBottomTab((prev) => (prev === 'terminal' ? 'gates' : 'terminal'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Ctrl+G → go to line ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setGoToLineOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Ctrl+H → find & replace ────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setFindReplaceVisible((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Shift+Alt+F → format document ──────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.altKey && e.key === 'F') {
        e.preventDefault();
        void formatActiveFile();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [formatActiveFile]);

  // ── Ctrl+\ → toggle split editor ─────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl+Shift+\ → toggle orientation
          setEditorLayoutMode((prev) =>
            prev === 'split-vertical' ? 'split-horizontal'
            : prev === 'split-horizontal' ? 'single'
            : 'split-vertical'
          );
        } else {
          // Ctrl+\ → toggle split on/off
          setEditorLayoutMode((prev) =>
            prev === 'single' ? 'split-vertical' : 'single'
          );
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
        <span
          className={`canon-header__status canon-header__status--${connection.status}`}
          data-testid='terracanon-connection-status'
          title={connection.status === 'connected'
            ? `Connected — ${connection.toolCount} tools`
            : connection.status === 'disconnected'
              ? `Disconnected: ${connection.error ?? 'unknown'}`
              : 'Connecting…'}
        />
        <LiquidPanel variant='shell' radius='none' className='flex-1'>
          <CanonCommandPalette
            commands={paletteCommands}
            tools={connection.tools}
            onToolInvoke={(toolId) => {
              void invokeWithPreflight({ toolId, mode: 'pilot', params: {} });
            }}
          />
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
              {/* ── Explorer / Search ─ Left sidebar ─────────────────────── */}
              <LiquidPanel variant='shell' radius='none' className='canon-ide__explorer'>
                <div className='canon-ide__sidebar-tabs'>
                  <button
                    className={`canon-ide__sidebar-tab ${sidebarTab === 'explorer' ? 'canon-ide__sidebar-tab--active' : ''}`}
                    data-testid='canon-sidebar-tab-explorer'
                    onClick={() => setSidebarTab('explorer')}
                  >
                    Explorer
                  </button>
                  <button
                    className={`canon-ide__sidebar-tab ${sidebarTab === 'search' ? 'canon-ide__sidebar-tab--active' : ''}`}
                    data-testid='canon-sidebar-tab-search'
                    onClick={() => setSidebarTab('search')}
                  >
                    Search
                  </button>
                  <button
                    className={`canon-ide__sidebar-tab ${sidebarTab === 'outline' ? 'canon-ide__sidebar-tab--active' : ''}`}
                    data-testid='canon-sidebar-tab-outline'
                    onClick={() => setSidebarTab('outline')}
                  >
                    Outline
                  </button>
                  <button
                    className={`canon-ide__sidebar-tab ${sidebarTab === 'bookmarks' ? 'canon-ide__sidebar-tab--active' : ''}`}
                    data-testid='canon-sidebar-tab-bookmarks'
                    onClick={() => setSidebarTab('bookmarks')}
                  >
                    Bookmarks
                  </button>
                  <button
                    className={`canon-ide__sidebar-tab ${sidebarTab === 'snippets' ? 'canon-ide__sidebar-tab--active' : ''}`}
                    data-testid='canon-sidebar-tab-snippets'
                    onClick={() => setSidebarTab('snippets')}
                  >
                    Snippets
                  </button>
                  <button
                    className={`canon-ide__sidebar-tab ${sidebarTab === 'settings' ? 'canon-ide__sidebar-tab--active' : ''}`}
                    data-testid='canon-sidebar-tab-settings'
                    onClick={() => setSidebarTab('settings')}
                  >
                    Settings
                  </button>
                </div>

                {sidebarTab === 'explorer' && (
                  <>
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
                        disabled={gateRunnerRef.current?.isRunning}
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
                    <CanonFileTree onFileSelect={handleExplorerFileSelect} onDeleteRequest={handleDeleteRequest} onRenameRequest={handleRenameRequest} onCompareRequest={handleCompareRequest} gitStatus={gitStatusEntries} gitBranch={gitBranch} />
                  </>
                )}

                {sidebarTab === 'search' && (
                  <CanonSearchPanel onFileSelect={handleSearchFileSelect} />
                )}

                {sidebarTab === 'outline' && (
                  <CanonOutlinePanel
                    filePath={activeFilePath}
                    onGoToLine={(line) => canonEditorRef.current?.revealLine(line)}
                  />
                )}

                {sidebarTab === 'bookmarks' && (
                  <CanonBookmarksPanel
                    activeFilePath={activeFilePath}
                    activeLine={cursorPos.line}
                    onGoToFile={(filePath, line) => {
                      const wsId = workspaces[activeIndex]?.id;
                      if (!wsId) return;
                      const fileId = `${wsId}:browse:${filePath}`;
                      setOpenTabs((prev) => {
                        if (prev.includes(fileId)) return prev;
                        return [...prev, fileId];
                      });
                      setActiveFileId(fileId);
                      const wsKey = wsId;
                      if (!filesByWorkspace[wsKey]?.[fileId]) {
                        fetchReadFile(filePath).then((rf) => {
                          if (rf.error) return;
                          setFilesByWorkspace((prev) => ({
                            ...prev,
                            [wsKey]: {
                              ...prev[wsKey],
                              [fileId]: { name: filePath.split('/').pop() || filePath, content: rf.content ?? '' },
                            },
                          }));
                        });
                      }
                      setTimeout(() => {
                        canonEditorRef.current?.revealLine(line);
                      }, 200);
                    }}
                  />
                )}

                {sidebarTab === 'snippets' && (
                  <CanonSnippetsPanel
                    onInsert={(body) => {
                      canonEditorRef.current?.insertText(body);
                    }}
                  />
                )}

                {sidebarTab === 'settings' && (
                  <CanonSettingsPanel
                    onSettingsChange={(s) => {
                      if (s.minimap !== editorSettings.minimap) toggleMinimap();
                      if (s.wordWrap !== editorSettings.wordWrap) toggleWordWrap();
                      if (s.stickyScroll !== editorSettings.stickyScroll) toggleStickyScroll();
                      if (s.fontSize > editorSettings.fontSize) increaseFontSize();
                      if (s.fontSize < editorSettings.fontSize) decreaseFontSize();
                      if (s.theme && s.theme !== editorSettings.theme) setTheme(s.theme);
                    }}
                  />
                )}
              </LiquidPanel>

              {/* ── Editor ─ Center main area ──────────────────────────────── */}
              <LiquidPanel variant='infrastructure' radius='none' className='canon-ide__editor'>
                {findReplaceVisible && (
                  <CanonFindReplacePanel
                    activeFilePath={activeFilePath}
                    onOpenFile={(filePath, line) => {
                      void handleExplorerFileSelect({ filePath, language: 'plaintext' });
                      if (line) setTimeout(() => canonEditorRef.current?.revealLine(line), 200);
                    }}
                    onClose={() => setFindReplaceVisible(false)}
                  />
                )}
                <div className={`canon-split-editor canon-split-editor--${editorLayoutMode}`}>
                  <div className='canon-split-editor__pane canon-split-editor__pane--primary'>
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
                  onMoveTab={moveTab}
                  drafts={drafts}
                  onDraftChange={handleDraftChange}
                  onSave={handleSave}
                  onCursorChange={setCursorPos}
                  editorRef={canonEditorRef}
                  editorSettings={editorSettings}
                  activeFilePath={activeFilePath}
                  diffData={diffData}
                  markers={editorMarkers}
                  onGotoFile={(filePath, line) => {
                    void handleExplorerFileSelect({ filePath, language: 'plaintext' });
                    if (line) setTimeout(() => canonEditorRef.current?.revealLine(line), 200);
                  }}
                />
                  </div>
                  {editorLayoutMode !== 'single' && (
                    <>
                      <div className='canon-split-editor__divider' />
                      <div className='canon-split-editor__pane canon-split-editor__pane--secondary'>
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
                          activeFileId={secondaryActiveFileId ?? activeFileId}
                          onSwitchTab={(fileId) => setSecondaryActiveFileId(fileId)}
                          onCloseTab={(fileId) => {
                            if (secondaryActiveFileId === fileId) setSecondaryActiveFileId(null);
                          }}
                          onMoveTab={moveTab}
                          drafts={drafts}
                          onDraftChange={handleDraftChange}
                          onSave={handleSave}
                          editorRef={secondaryEditorRef}
                          editorSettings={editorSettings}
                          activeFilePath={activeFilePath}
                          diffData={diffData}
                        />
                      </div>
                    </>
                  )}
                </div>
              </LiquidPanel>

              {/* ── Minimap ─ Right auxiliary ──────────────────────────── */}
              {activeFilePath && (
                <div className='canon-ide__minimap-wrapper'>
                  <CanonMinimapPanel
                    filePath={activeFilePath}
                    onGoToLine={(line) => canonEditorRef.current?.revealLine(line)}
                  />
                </div>
              )}
            </div>
            {/* end terracanon-workspace landmark */}

            {/* ── Agents ─ Right sidebar (TerraPilot) ──────────────────── */}
            <LiquidPanel variant='shell' radius='none'>
              <CanonAgentsPanel
                workspaceId={active?.id ?? null}
                tools={connection.tools}
                connectionStatus={connection.status}
              />
              <GoldenCorpusPanel />
            </LiquidPanel>
          </div>
          {/* end canon-suiteLauncher */}

          {/* ── Tasks & Logs ─ Bottom panel ──────────────────────────── */}
          <LiquidPanel variant='infrastructure' radius='none' className='canon-ide__tasks'>
            <div className='canon-ide__bottom-tabs'>
              <button
                className={`canon-ide__bottom-tab ${bottomTab === 'gates' ? 'canon-ide__bottom-tab--active' : ''}`}
                onClick={() => setBottomTab('gates')}
              >
                Gates
              </button>
              <button
                className={`canon-ide__bottom-tab ${bottomTab === 'terminal' ? 'canon-ide__bottom-tab--active' : ''}`}
                onClick={() => setBottomTab('terminal')}
              >
                Terminal
              </button>
              <button
                className={`canon-ide__bottom-tab ${bottomTab === 'problems' ? 'canon-ide__bottom-tab--active' : ''}`}
                onClick={() => setBottomTab('problems')}
              >
                Problems
              </button>
            </div>
            {bottomTab === 'gates' && <GateRunnerPanel ref={gateRunnerRef} />}
            {bottomTab === 'terminal' && <CanonTerminal />}
            {bottomTab === 'problems' && (
              <CanonProblemsPanel
                onGoToFile={(filePath, line) => {
                  // Open the file and navigate to line
                  const wsId = workspaces[activeIndex]?.id;
                  if (!wsId) return;
                  const fileId = `${wsId}:browse:${filePath}`;
                  // Open the file tab
                  setOpenTabs((prev) => {
                    if (prev.includes(fileId)) return prev;
                    return [...prev, fileId];
                  });
                  setActiveFileId(fileId);
                  // Fetch file content if not already loaded
                  const wsKey = wsId;
                  if (!filesByWorkspace[wsKey]?.[fileId]) {
                    fetchReadFile(filePath).then((rf) => {
                      if (rf.error) return;
                      setFilesByWorkspace((prev) => ({
                        ...prev,
                        [wsKey]: {
                          ...prev[wsKey],
                          [fileId]: { name: filePath.split('/').pop() || filePath, content: rf.content ?? '' },
                        },
                      }));
                    });
                  }
                  // Navigate to line after a short delay
                  setTimeout(() => {
                    canonEditorRef.current?.revealLine(line);
                  }, 200);
                }}
              />
            )}
          </LiquidPanel>

          {/* ── Status Bar ─ Bottom info bar ──────────────────────────── */}
          <CanonStatusBar
            cursor={cursorPos}
            language={activeFileName ? detectLanguage(activeFileName) : 'plaintext'}
            fileName={activeFileName}
            connectionStatus={connection.status}
            toolCount={connection.toolCount}
            onGoToLine={() => setGoToLineOpen(true)}
            wordWrap={editorSettings.wordWrap}
            minimap={editorSettings.minimap}
            fontSize={editorSettings.fontSize}
            onToggleWordWrap={toggleWordWrap}
            onToggleMinimap={toggleMinimap}
          />
        </div>
        {/* end canon-devCockpit__inner */}
      </section>
      {/* end canon-devCockpit */}

      <GoToLineDialog
        open={goToLineOpen}
        onClose={() => setGoToLineOpen(false)}
        onGoTo={(line) => canonEditorRef.current?.revealLine(line)}
      />

      <NewFileDialog
        open={newFileOpen}
        onClose={() => setNewFileOpen(false)}
        onCreate={handleNewFile}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete File"
        message={`Are you sure you want to delete ${deleteTarget ?? ''}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <RenameDialog
        open={renameTarget !== null}
        currentPath={renameTarget ?? ''}
        onClose={() => setRenameTarget(null)}
        onRename={handleRenameConfirm}
      />

      <CanonNotificationHost items={notifications} onDismiss={dismissNotification} />

      <CanonQuickOpen
        open={quickOpenVisible}
        onClose={() => setQuickOpenVisible(false)}
        onOpenFile={(filePath) => {
          const wsId = workspaces[activeIndex]?.id;
          if (!wsId) return;
          const fileId = `${wsId}:browse:${filePath}`;
          setOpenTabs((prev) => {
            if (prev.includes(fileId)) return prev;
            return [...prev, fileId];
          });
          setActiveFileId(fileId);
          // Track in recent files (fire-and-forget)
          fetchRecentFiles('add', filePath).catch(() => {/* ignore */});
          const wsKey = wsId;
          if (!filesByWorkspace[wsKey]?.[fileId]) {
            fetchReadFile(filePath).then((rf) => {
              if (rf.error) return;
              setFilesByWorkspace((prev) => ({
                ...prev,
                [wsKey]: {
                  ...prev[wsKey],
                  [fileId]: { name: filePath.split('/').pop() || filePath, content: rf.content ?? '' },
                },
              }));
            });
          }
        }}
      />

      <CanonGoToSymbol
        open={goToSymbolVisible}
        onClose={() => setGoToSymbolVisible(false)}
        onGoToSymbol={(filePath, line) => {
          void handleExplorerFileSelect({ filePath, language: 'plaintext' });
          // After file loads, reveal the target line
          setTimeout(() => {
            canonEditorRef.current?.revealLine(line);
          }, 300);
        }}
      />

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
