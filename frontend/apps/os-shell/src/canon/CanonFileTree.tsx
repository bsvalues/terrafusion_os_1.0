/**
 * CanonFileTree — read-only file explorer for TerraCanon IDE.
 *
 * Lazy-loads directories on expand. Shows files with extension icons.
 * Clicking a file calls onFileSelect with the path + language.
 * Enforced server-side allowlist — only approved paths are browsable.
 *
 * @see Phase C: File Explorer (Read-Only)
 */

import React, { useCallback, useEffect, useState } from 'react';
import { fetchListDir, type DirEntry, type GitStatusEntry } from '../api/canonFs';

/** Top-level roots visible in the explorer. */
const ROOTS = [
  { path: 'os-platform/core/pilot', label: 'pilot/' },
  { path: 'os-platform/core/types', label: 'types/' },
  { path: 'tools/registry', label: 'registry/' },
  { path: 'frontend/apps/os-shell/src/canon', label: 'canon/' },
  { path: 'golden', label: 'golden/' },
];

interface FileSelectPayload {
  filePath: string;
  language: string;
}

interface Props {
  onFileSelect?: (payload: FileSelectPayload) => void;
  onDeleteRequest?: (filePath: string) => void;
  onCompareRequest?: (filePath: string) => void;
  gitStatus?: GitStatusEntry[];
  gitBranch?: string;
}

/** Map git status to CSS class and label. */
const GIT_STATUS_MAP: Record<string, { className: string; label: string }> = {
  modified: { className: 'canon-git--modified', label: 'M' },
  added: { className: 'canon-git--added', label: 'A' },
  deleted: { className: 'canon-git--deleted', label: 'D' },
  untracked: { className: 'canon-git--untracked', label: 'U' },
  renamed: { className: 'canon-git--renamed', label: 'R' },
  copied: { className: 'canon-git--copied', label: 'C' },
  conflict: { className: 'canon-git--conflict', label: '!' },
};

interface TreeNodeState {
  loaded: boolean;
  loading: boolean;
  expanded: boolean;
  entries: DirEntry[];
  error?: string;
}

const EXT_ICONS: Record<string, string> = {
  '.ts': '🟦',
  '.tsx': '⚛️',
  '.js': '🟨',
  '.mjs': '🟨',
  '.json': '📋',
  '.css': '🎨',
  '.md': '📝',
  '.yml': '⚙️',
  '.yaml': '⚙️',
};

const EXT_LANG: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescriptreact',
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.json': 'json',
  '.css': 'css',
  '.md': 'markdown',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.html': 'html',
};

function getExtIcon(name: string): string {
  const idx = name.lastIndexOf('.');
  if (idx < 0) return '📄';
  return EXT_ICONS[name.slice(idx).toLowerCase()] || '📄';
}

function getLanguage(name: string): string {
  const idx = name.lastIndexOf('.');
  if (idx < 0) return 'plaintext';
  return EXT_LANG[name.slice(idx).toLowerCase()] || 'plaintext';
}

function formatSize(bytes: number | undefined): string {
  if (bytes === undefined) return '';
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

/** Single recursive directory node. */
function DirNode({
  dirPath,
  label,
  depth,
  onFileSelect,
  onDeleteRequest,
  onRenameRequest,
  onCompareRequest,
  gitStatusMap,
}: {
  dirPath: string;
  label: string;
  depth: number;
  onFileSelect?: (payload: FileSelectPayload) => void;
  onDeleteRequest?: (filePath: string) => void;
  onRenameRequest?: (filePath: string) => void;
  onCompareRequest?: (filePath: string) => void;
  gitStatusMap?: Map<string, string>;
}) {
  const [state, setState] = useState<TreeNodeState>({
    loaded: false,
    loading: false,
    expanded: false,
    entries: [],
  });

  const toggle = useCallback(async () => {
    if (state.expanded) {
      setState(prev => ({ ...prev, expanded: false }));
      return;
    }
    if (!state.loaded) {
      setState(prev => ({ ...prev, loading: true, expanded: true }));
      const result = await fetchListDir(dirPath);
      setState({
        loaded: true,
        loading: false,
        expanded: true,
        entries: result.entries,
        error: result.error,
      });
    } else {
      setState(prev => ({ ...prev, expanded: true }));
    }
  }, [dirPath, state.expanded, state.loaded]);

  return (
    <div>
      <div
        className='canon-filetree__node canon-filetree__dir'
        onClick={toggle}
        style={{
          paddingLeft: `${depth * 1}rem`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: `0.125rem 0.25rem 0.125rem ${depth * 1}rem`,
        }}
        title={dirPath}
      >
        <span style={{ fontSize: '0.7rem', width: '0.75rem', textAlign: 'center' }}>
          {state.loading ? '⟳' : state.expanded ? '▼' : '▶'}
        </span>
        <span className='text-xs text-gray-300'>📁 {label}</span>
      </div>

      {state.expanded && state.error && (
        <div
          className='text-xs text-red-400'
          style={{ paddingLeft: `${(depth + 1) * 1}rem`, padding: `0.125rem 0.25rem 0.125rem ${(depth + 1) * 1}rem` }}
        >
          {state.error}
        </div>
      )}

      {state.expanded &&
        state.entries.map(entry =>
          entry.type === 'directory' ? (
            <DirNode
              key={entry.name}
              dirPath={`${dirPath}/${entry.name}`}
              label={`${entry.name}/`}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              onDeleteRequest={onDeleteRequest}
              onRenameRequest={onRenameRequest}
              onCompareRequest={onCompareRequest}
              gitStatusMap={gitStatusMap}
            />
          ) : (
            <div
              key={entry.name}
              className='canon-filetree__node canon-filetree__file'
              onClick={() =>
                onFileSelect?.({
                  filePath: `${dirPath}/${entry.name}`,
                  language: getLanguage(entry.name),
                })
              }
              style={{
                paddingLeft: `${(depth + 1) * 1}rem`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.25rem',
                padding: `0.125rem 0.5rem 0.125rem ${(depth + 1) * 1}rem`,
              }}
              title={`${dirPath}/${entry.name}`}
            >
              <span className='text-xs text-gray-400'>
                {getExtIcon(entry.name)} {entry.name}
                {(() => {
                  const fullPath = `${dirPath}/${entry.name}`;
                  const status = gitStatusMap?.get(fullPath);
                  if (!status) return null;
                  const info = GIT_STATUS_MAP[status];
                  if (!info) return null;
                  return <span className={`canon-git-badge ${info.className}`} title={`git: ${status}`}>{info.label}</span>;
                })()}
              </span>
              <span className='canon-filetree__file-actions'>
                {entry.size !== undefined && (
                  <span className='text-xs text-gray-600' style={{ fontSize: '0.6rem', fontFamily: 'monospace' }}>
                    {formatSize(entry.size)}
                  </span>
                )}
                {onDeleteRequest && (
                  <button
                    className='canon-filetree__delete-btn'
                    title={`Delete ${entry.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRequest(`${dirPath}/${entry.name}`);
                    }}
                  >
                    ✕
                  </button>
                )}
                {onRenameRequest && (
                  <button
                    className='canon-filetree__rename-btn'
                    title={`Rename ${entry.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenameRequest(`${dirPath}/${entry.name}`);
                    }}
                  >
                    ✎
                  </button>
                )}
                {onCompareRequest && (
                  <button
                    className='canon-filetree__compare-btn'
                    title={`Compare ${entry.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompareRequest(`${dirPath}/${entry.name}`);
                    }}
                  >
                    ⇔
                  </button>
                )}
              </span>
            </div>
          ),
        )}
    </div>
  );
}

export function CanonFileTree({ onFileSelect, onDeleteRequest, onRenameRequest, onCompareRequest, gitStatus, gitBranch }: Props): React.ReactElement {
  // Build a lookup map from filePath → status for O(1) lookups in tree nodes
  const gitStatusMap = React.useMemo(() => {
    if (!gitStatus || gitStatus.length === 0) return undefined;
    const map = new Map<string, string>();
    for (const entry of gitStatus) {
      map.set(entry.filePath, entry.status);
    }
    return map;
  }, [gitStatus]);

  return (
    <div className='canon-filetree' data-testid='canon-file-tree'>
      <div
        className='text-xs font-semibold text-gray-300 uppercase tracking-wider'
        style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid hsl(var(--tf-text) / 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>Explorer</span>
        {gitBranch && (
          <span className='canon-git-branch' title={`Branch: ${gitBranch}`}>⎇ {gitBranch}</span>
        )}
      </div>
      {ROOTS.map(root => (
        <DirNode
          key={root.path}
          dirPath={root.path}
          label={root.label}
          depth={0}
          onFileSelect={onFileSelect}
          onDeleteRequest={onDeleteRequest}
          onRenameRequest={onRenameRequest}
          onCompareRequest={onCompareRequest}
          gitStatusMap={gitStatusMap}
        />
      ))}
    </div>
  );
}
