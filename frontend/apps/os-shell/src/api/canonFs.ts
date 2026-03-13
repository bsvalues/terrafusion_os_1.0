import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

// ── Golden Corpus ────────────────────────────────────────────────

export interface CorpusArtifact {
  name: string;
  sha256: string;
  bytes: number;
}

export interface CorpusStatusResponse {
  ok: boolean;
  ts: string;
  version?: string;
  releaseTag?: string;
  artifactCount: number;
  artifacts: CorpusArtifact[];
  ledgerHeadSha256?: string;
  sequenceNumber?: number;
  error?: string;
}

export async function fetchCorpusStatus(): Promise<CorpusStatusResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/corpus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    return (await res.json()) as CorpusStatusResponse;
  } catch (err) {
    return {
      ok: false,
      ts: new Date().toISOString(),
      artifactCount: 0,
      artifacts: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── File System ──────────────────────────────────────────────────

export interface DirEntry {
  name: string;
  type: 'file' | 'directory';
  size?: number;
}

export interface ListDirResponse {
  dirPath: string;
  entries: DirEntry[];
  error?: string;
}

export interface ReadFileResponse {
  filePath: string;
  content: string;
  size: number;
  language: string;
  error?: string;
}

export async function fetchListDir(dirPath: string): Promise<ListDirResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/ls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dirPath }),
    });
    if (res.status === 403) {
      const body = await res.json() as { message?: string };
      return { dirPath, entries: [], error: body.message || 'Forbidden' };
    }
    return (await res.json()) as ListDirResponse;
  } catch (err) {
    return {
      dirPath,
      entries: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchReadFile(filePath: string): Promise<ReadFileResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
    if (res.status === 403) {
      const body = await res.json() as { message?: string };
      return { filePath, content: '', size: 0, language: 'plaintext', error: body.message || 'Forbidden' };
    }
    return (await res.json()) as ReadFileResponse;
  } catch (err) {
    return {
      filePath,
      content: '',
      size: 0,
      language: 'plaintext',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Write File ───────────────────────────────────────────────────

export interface WriteFileResponse {
  filePath: string;
  size: number;
  writtenAt: string;
  error?: string;
}

export async function writeCanonFile(filePath: string, content: string): Promise<WriteFileResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, content }),
    });
    if (res.status === 403) {
      const body = await res.json() as { message?: string };
      return { filePath, size: 0, writtenAt: '', error: body.message || 'Forbidden' };
    }
    if (res.status === 413) {
      const body = await res.json() as { message?: string };
      return { filePath, size: 0, writtenAt: '', error: body.message || 'File too large' };
    }
    return (await res.json()) as WriteFileResponse;
  } catch (err) {
    return {
      filePath,
      size: 0,
      writtenAt: '',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Search Files ─────────────────────────────────────────────────

export interface CreateFileResponse {
  filePath: string;
  size: number;
  createdAt: string;
  error?: string;
}

export async function createCanonFile(filePath: string, content: string = ''): Promise<CreateFileResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, content }),
    });
    if (res.status === 403) {
      const body = await res.json() as { message?: string };
      return { filePath, size: 0, createdAt: '', error: body.message || 'Forbidden' };
    }
    if (res.status === 409) {
      const body = await res.json() as { message?: string };
      return { filePath, size: 0, createdAt: '', error: body.message || 'File already exists' };
    }
    if (res.status === 413) {
      const body = await res.json() as { message?: string };
      return { filePath, size: 0, createdAt: '', error: body.message || 'File too large' };
    }
    return (await res.json()) as CreateFileResponse;
  } catch (err) {
    return {
      filePath,
      size: 0,
      createdAt: '',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Delete File ──────────────────────────────────────────────────

export interface DeleteFileResponse {
  filePath: string;
  deletedAt: string;
  error?: string;
}

export async function deleteCanonFile(filePath: string): Promise<DeleteFileResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
    if (res.status === 403) {
      const body = await res.json() as { message?: string };
      return { filePath, deletedAt: '', error: body.message || 'Forbidden' };
    }
    if (res.status === 404) {
      const body = await res.json() as { message?: string };
      return { filePath, deletedAt: '', error: body.message || 'File not found' };
    }
    if (res.status === 400) {
      const body = await res.json() as { message?: string };
      return { filePath, deletedAt: '', error: body.message || 'Bad request' };
    }
    return (await res.json()) as DeleteFileResponse;
  } catch (err) {
    return {
      filePath,
      deletedAt: '',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Rename/Move File ─────────────────────────────────────────────

export interface RenameFileResponse {
  oldPath: string;
  newPath: string;
  renamedAt: string;
  error?: string;
}

export async function renameCanonFile(oldPath: string, newPath: string): Promise<RenameFileResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newPath }),
    });
    if (res.status === 403) {
      const body = await res.json() as { message?: string };
      return { oldPath, newPath, renamedAt: '', error: body.message || 'Forbidden' };
    }
    if (res.status === 404) {
      const body = await res.json() as { message?: string };
      return { oldPath, newPath, renamedAt: '', error: body.message || 'Source not found' };
    }
    if (res.status === 409) {
      const body = await res.json() as { message?: string };
      return { oldPath, newPath, renamedAt: '', error: body.message || 'Destination already exists' };
    }
    if (res.status === 400) {
      const body = await res.json() as { message?: string };
      return { oldPath, newPath, renamedAt: '', error: body.message || 'Bad request' };
    }
    return (await res.json()) as RenameFileResponse;
  } catch (err) {
    return {
      oldPath,
      newPath,
      renamedAt: '',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Search Files (continued) ─────────────────────────────────────

export interface SearchMatch {
  filePath: string;
  line: number;
  column: number;
  text: string;
}

export interface SearchFilesResponse {
  query: string;
  matches: SearchMatch[];
  totalMatches: number;
  truncated: boolean;
  error?: string;
}

export async function searchCanonFiles(
  query: string,
  options?: { path?: string; isRegex?: boolean; maxResults?: number },
): Promise<SearchFilesResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...options }),
    });
    if (res.status === 400) {
      const body = await res.json() as { message?: string };
      return { query, matches: [], totalMatches: 0, truncated: false, error: body.message || 'Bad request' };
    }
    if (res.status === 403) {
      const body = await res.json() as { message?: string };
      return { query, matches: [], totalMatches: 0, truncated: false, error: body.message || 'Forbidden' };
    }
    return (await res.json()) as SearchFilesResponse;
  } catch (err) {
    return {
      query,
      matches: [],
      totalMatches: 0,
      truncated: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Terminal Exec ────────────────────────────────────────────────

export interface TerminalExecResponse {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  error?: string;
}

export async function execCanonCommand(command: string): Promise<TerminalExecResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });
    if (res.status === 403) {
      const body = await res.json() as { message?: string };
      return { command, exitCode: 1, stdout: '', stderr: '', durationMs: 0, error: body.message || 'Forbidden' };
    }
    return (await res.json()) as TerminalExecResponse;
  } catch (err) {
    return {
      command,
      exitCode: 1,
      stdout: '',
      stderr: '',
      durationMs: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Diff/Compare Files ───────────────────────────────────────────

export interface DiffFilesResponse {
  leftPath: string;
  rightPath: string;
  leftContent: string;
  rightContent: string;
  leftSize: number;
  rightSize: number;
  error?: string;
}

export async function diffCanonFiles(leftPath: string, rightPath: string): Promise<DiffFilesResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/diff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leftPath, rightPath }),
    });
    if (res.status === 403) {
      const body = await res.json() as { message?: string };
      return { leftPath, rightPath, leftContent: '', rightContent: '', leftSize: 0, rightSize: 0, error: body.message || 'Forbidden' };
    }
    if (res.status === 404) {
      const body = await res.json() as { message?: string };
      return { leftPath, rightPath, leftContent: '', rightContent: '', leftSize: 0, rightSize: 0, error: body.message || 'File not found' };
    }
    if (res.status === 413) {
      const body = await res.json() as { message?: string };
      return { leftPath, rightPath, leftContent: '', rightContent: '', leftSize: 0, rightSize: 0, error: body.message || 'File too large' };
    }
    return (await res.json()) as DiffFilesResponse;
  } catch (err) {
    return {
      leftPath,
      rightPath,
      leftContent: '',
      rightContent: '',
      leftSize: 0,
      rightSize: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Git Status ───────────────────────────────────────────────────

export interface GitStatusEntry {
  filePath: string;
  status: string;
}

export interface GitStatusResponse {
  entries: GitStatusEntry[];
  branch: string;
  error?: string;
}

export async function fetchGitStatus(scopePath?: string): Promise<GitStatusResponse> {
  try {
    const body: Record<string, string> = {};
    if (scopePath) body.path = scopePath;
    const res = await fetch(`${API_BASE_URL}/pilot/canon/git-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 403) {
      const data = await res.json() as { message?: string };
      return { entries: [], branch: 'unknown', error: data.message || 'Forbidden' };
    }
    return (await res.json()) as GitStatusResponse;
  } catch (err) {
    return {
      entries: [],
      branch: 'unknown',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── File Outline ─────────────────────────────────────────────────

export interface OutlineSymbol {
  name: string;
  kind: string;
  line: number;
  endLine?: number;
  children?: OutlineSymbol[];
}

export interface FileOutlineResponse {
  filePath: string;
  symbols: OutlineSymbol[];
  language: string;
  error?: string;
}

export async function fetchFileOutline(filePath: string): Promise<FileOutlineResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/outline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
    if (res.status === 403) {
      const data = await res.json() as { message?: string };
      return { filePath, symbols: [], language: 'unknown', error: data.message || 'Forbidden' };
    }
    if (res.status === 404) {
      const data = await res.json() as { message?: string };
      return { filePath, symbols: [], language: 'unknown', error: data.message || 'File not found' };
    }
    if (res.status === 400) {
      const data = await res.json() as { message?: string };
      return { filePath, symbols: [], language: 'unknown', error: data.message || 'Bad request' };
    }
    if (res.status === 413) {
      const data = await res.json() as { message?: string };
      return { filePath, symbols: [], language: 'unknown', error: data.message || 'File too large' };
    }
    return (await res.json()) as FileOutlineResponse;
  } catch (err) {
    return {
      filePath,
      symbols: [],
      language: 'unknown',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/* ── Diagnostics ─────────────────────────────────────────────── */

export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  code?: string;
}

export interface DiagnosticsResponse {
  diagnostics: Diagnostic[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  durationMs: number;
  exitCode?: number;
  scope?: string;
  error?: string;
}

export async function fetchDiagnostics(scope?: string): Promise<DiagnosticsResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/diagnostics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: scope || 'typecheck' }),
    });
    if (!res.ok) {
      const data = await res.json() as { message?: string };
      return {
        diagnostics: [],
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        durationMs: 0,
        error: data.message || `HTTP ${res.status}`,
      };
    }
    return (await res.json()) as DiagnosticsResponse;
  } catch (err) {
    return {
      diagnostics: [],
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      durationMs: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/* ── Bookmarks ───────────────────────────────────────────────── */

export interface Bookmark {
  filePath: string;
  line: number;
  label: string;
  createdAt: string;
}

export interface BookmarksResponse {
  bookmarks: Bookmark[];
  action: string;
  error?: string;
}

export async function fetchBookmarks(
  action: 'add' | 'remove' | 'list' | 'clear',
  opts?: { filePath?: string; line?: number; label?: string },
): Promise<BookmarksResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...opts }),
    });
    if (!res.ok) {
      const data = await res.json() as { message?: string };
      return { bookmarks: [], action, error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as BookmarksResponse;
  } catch (err) {
    return {
      bookmarks: [],
      action,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/* ── File Index (Quick Open) ────────────────────────────────── */

export interface FileIndexEntry {
  path: string;
  name: string;
  size: number;
}

export interface FileIndexResponse {
  files: FileIndexEntry[];
  totalFiles: number;
  scope: string;
  error?: string;
}

export async function fetchFileIndex(scope?: string): Promise<FileIndexResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/file-index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: scope ?? '' }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { files: [], totalFiles: 0, scope: scope ?? 'all', error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as FileIndexResponse;
  } catch (err) {
    return {
      files: [],
      totalFiles: 0,
      scope: scope ?? 'all',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/* ── Recent Files ───────────────────────────────────────────── */

export interface RecentFileEntry {
  filePath: string;
  name: string;
  openedAt: string;
}

export interface RecentFilesResponse {
  files: RecentFileEntry[];
  action: string;
  error?: string;
}

export async function fetchRecentFiles(
  action: 'add' | 'list' | 'clear',
  filePath?: string,
): Promise<RecentFilesResponse> {
  try {
    const body: Record<string, string> = { action };
    if (filePath) body.filePath = filePath;
    const res = await fetch(`${API_BASE_URL}/pilot/canon/recent-files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { files: [], action, error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as RecentFilesResponse;
  } catch (err) {
    return {
      files: [],
      action,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/* ── Symbol Search ─────────────────────────────────────────── */

export interface SymbolMatch {
  filePath: string;
  name: string;
  kind: string;
  line: number;
  containerName?: string;
}

export interface SymbolSearchResponse {
  symbols: SymbolMatch[];
  query: string;
  totalFiles: number;
  error?: string;
}

export async function fetchSymbolSearch(
  query: string,
  maxResults?: number,
): Promise<SymbolSearchResponse> {
  try {
    const body: Record<string, unknown> = { query };
    if (maxResults != null) body.maxResults = maxResults;
    const res = await fetch(`${API_BASE_URL}/pilot/canon/symbol-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { symbols: [], query, totalFiles: 0, error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as SymbolSearchResponse;
  } catch (err) {
    return {
      symbols: [],
      query,
      totalFiles: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Snippets ──────────────────────────────────────────────────────────────

export interface CanonSnippet {
  id: string;
  name: string;
  language: string;
  prefix: string;
  body: string;
  description: string;
}

export interface SnippetsResponse {
  snippets: CanonSnippet[];
  inserted?: string;
  error?: string;
}

export async function fetchSnippets(
  action: 'create' | 'list' | 'delete' | 'insert',
  params?: Partial<CanonSnippet>,
): Promise<SnippetsResponse> {
  try {
    const body: Record<string, unknown> = { action, ...params };
    const res = await fetch(`${API_BASE_URL}/pilot/canon/snippets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { snippets: [], error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as SnippetsResponse;
  } catch (err) {
    return {
      snippets: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Minimap ───────────────────────────────────────────────────────────────

export interface MinimapSection {
  startLine: number;
  endLine: number;
  label: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'import' | 'export' | 'comment' | 'block';
  depth: number;
}

export interface MinimapResponse {
  filePath: string;
  totalLines: number;
  sections: MinimapSection[];
  symbolDensity: number[];
  error?: string;
}

export async function fetchMinimap(filePath: string): Promise<MinimapResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pilot/canon/minimap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { filePath, totalLines: 0, sections: [], symbolDensity: [], error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as MinimapResponse;
  } catch (err) {
    return {
      filePath,
      totalLines: 0,
      sections: [],
      symbolDensity: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Editor Settings ─────────────────────────────────────────────────
export interface EditorSettingsData {
  minimap: boolean;
  wordWrap: boolean;
  fontSize: number;
  tabSize: number;
  theme: string;
  lineNumbers: boolean;
  autoSave: boolean;
  bracketPairColorization: boolean;
  stickyScroll: boolean;
}

export interface EditorSettingsResponse {
  settings: EditorSettingsData;
  persisted: boolean;
  error?: string;
}

const EDITOR_SETTINGS_DEFAULTS: EditorSettingsData = {
  minimap: true,
  wordWrap: true,
  fontSize: 12,
  tabSize: 2,
  theme: 'dark',
  lineNumbers: true,
  autoSave: true,
  bracketPairColorization: true,
  stickyScroll: true,
};

export async function fetchEditorSettings(
  action: 'get' | 'set' | 'reset',
  settings?: Partial<EditorSettingsData>,
): Promise<EditorSettingsResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/editor-settings`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ action, settings }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { settings: EDITOR_SETTINGS_DEFAULTS, persisted: false, error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as EditorSettingsResponse;
  } catch (err) {
    return {
      settings: EDITOR_SETTINGS_DEFAULTS,
      persisted: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Find & Replace ──────────────────────────────────────────────────
export interface FindReplaceMatch {
  filePath: string;
  line: number;
  column: number;
  lineText: string;
  matchText: string;
}

export interface FindReplaceResponse {
  matches: FindReplaceMatch[];
  totalMatches: number;
  filesSearched: number;
  replacementsApplied?: number;
  error?: string;
}

export interface FindReplaceParams {
  action: 'find' | 'replace' | 'replaceAll';
  query: string;
  replacement?: string;
  isRegex?: boolean;
  caseSensitive?: boolean;
  filePath?: string;
}

export async function fetchFindReplace(params: FindReplaceParams): Promise<FindReplaceResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/find-replace`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { matches: [], totalMatches: 0, filesSearched: 0, error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as FindReplaceResponse;
  } catch (err) {
    return {
      matches: [],
      totalMatches: 0,
      filesSearched: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/* ── Format File ───────────────────────────────────────────────── */

export interface FormatFileResponse {
  filePath: string;
  formatted: boolean;
  originalSize: number;
  formattedSize: number;
  language: string;
  durationMs: number;
  content?: string;
  error?: string;
}

export interface FormatFileParams {
  filePath: string;
  tabSize?: number;
  useTabs?: boolean;
  insertFinalNewline?: boolean;
}

export async function fetchFormatFile(params: FormatFileParams): Promise<FormatFileResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/format-file`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return {
        filePath: params.filePath,
        formatted: false,
        originalSize: 0,
        formattedSize: 0,
        language: 'unknown',
        durationMs: 0,
        error: data.message || `HTTP ${res.status}`,
      };
    }
    return (await res.json()) as FormatFileResponse;
  } catch (err) {
    return {
      filePath: params.filePath,
      formatted: false,
      originalSize: 0,
      formattedSize: 0,
      language: 'unknown',
      durationMs: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/* ── Editor Layout ─────────────────────────────────────────────── */

export type EditorLayoutMode = 'single' | 'split-vertical' | 'split-horizontal';

export interface EditorLayoutResponse {
  mode: EditorLayoutMode;
  panes: number;
  error?: string;
}

export async function fetchEditorLayout(
  action: 'get' | 'set',
  mode?: EditorLayoutMode,
): Promise<EditorLayoutResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/editor-layout`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ action, mode }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { mode: 'single', panes: 1, error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as EditorLayoutResponse;
  } catch (err) {
    return { mode: 'single', panes: 1, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Folding Ranges ───────────────────────────────────────────────

export interface FoldingRange {
  startLine: number;
  endLine: number;
  kind: 'region' | 'imports' | 'comment';
}

export interface FoldingRangesResponse {
  filePath: string;
  ranges: FoldingRange[];
  language: string;
  error?: string;
}

export async function fetchFoldingRanges(
  filePath: string,
  content?: string,
): Promise<FoldingRangesResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/folding-ranges`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ filePath, _content: content }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { filePath, ranges: [], language: 'plaintext', error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as FoldingRangesResponse;
  } catch (err) {
    return { filePath, ranges: [], language: 'plaintext', error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Line Markers ─────────────────────────────────────────────────

export type MarkerSeverity = 'error' | 'warning' | 'info' | 'hint';
export type MarkerKind = 'diagnostic' | 'bookmark' | 'modified';

export interface LineMarker {
  id: string;
  line: number;
  endLine?: number;
  column?: number;
  endColumn?: number;
  severity: MarkerSeverity;
  kind: MarkerKind;
  message: string;
  source?: string;
}

export interface LineMarkersResponse {
  filePath: string;
  markers: LineMarker[];
  count: number;
  error?: string;
}

export async function fetchLineMarkers(
  action: 'list' | 'set' | 'clear',
  filePath: string,
  markers?: LineMarker[],
): Promise<LineMarkersResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/line-markers`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ action, filePath, markers }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { filePath, markers: [], count: 0, error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as LineMarkersResponse;
  } catch (err) {
    return { filePath, markers: [], count: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Hover Info ───────────────────────────────────────────────────

export interface HoverSymbolInfo {
  name: string;
  kind: string;
  type?: string;
  description?: string;
  parameters?: string[];
  filePath?: string;
  line?: number;
}

export interface HoverInfoResponse {
  filePath: string;
  line: number;
  column: number;
  symbol: HoverSymbolInfo | null;
  markdown: string;
  error?: string;
}

export async function fetchHoverInfo(
  filePath: string,
  line: number,
  column: number,
  content?: string,
): Promise<HoverInfoResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/hover-info`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ filePath, line, column, content }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { filePath, line, column, symbol: null, markdown: '', error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as HoverInfoResponse;
  } catch (err) {
    return { filePath, line, column, symbol: null, markdown: '', error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Goto Definition ──────────────────────────────────────────────

export interface DefinitionLocation {
  filePath: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  kind: string;
  preview?: string;
}

export interface GotoDefinitionResponse {
  filePath: string;
  line: number;
  column: number;
  definitions: DefinitionLocation[];
  error?: string;
}

export async function fetchGotoDefinition(
  filePath: string,
  line: number,
  column: number,
  content?: string,
  symbol?: string,
): Promise<GotoDefinitionResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/goto-definition`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ filePath, line, column, content, symbol }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { filePath, line, column, definitions: [], error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as GotoDefinitionResponse;
  } catch (err) {
    return { filePath, line, column, definitions: [], error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Completions ──────────────────────────────────────────────────

export type CompletionKind =
  | 'function'
  | 'class'
  | 'interface'
  | 'variable'
  | 'constant'
  | 'type'
  | 'enum'
  | 'keyword'
  | 'snippet'
  | 'property';

export interface CompletionItem {
  label: string;
  kind: CompletionKind;
  detail?: string;
  insertText: string;
  sortText?: string;
}

export interface CompletionsResponse {
  filePath: string;
  line: number;
  column: number;
  items: CompletionItem[];
  error?: string;
}

export async function fetchCompletions(
  filePath: string,
  line: number,
  column: number,
  content?: string,
  triggerCharacter?: string,
): Promise<CompletionsResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/completions`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ filePath, line, column, content, triggerCharacter }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { filePath, line, column, items: [], error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as CompletionsResponse;
  } catch (err) {
    return { filePath, line, column, items: [], error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Editor Themes ────────────────────────────────────────────────

export type CanonThemeId = 'terracanon-dark' | 'terracanon-light' | 'terracanon-high-contrast';

export interface CanonThemeInfo {
  id: CanonThemeId;
  displayName: string;
  base: 'vs-dark' | 'vs' | 'hc-black';
}

export interface EditorThemesResponse {
  action: string;
  active: CanonThemeId;
  themes: CanonThemeInfo[];
  error?: string;
}

export async function fetchEditorThemes(
  action: 'list' | 'get' | 'set',
  themeId?: string,
): Promise<EditorThemesResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/editor-themes`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ action, themeId }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { action, active: 'terracanon-dark', themes: [], error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as EditorThemesResponse;
  } catch (err) {
    return { action, active: 'terracanon-dark', themes: [], error: err instanceof Error ? err.message : String(err) };
  }
}

/* ── Code Actions / Quick Fixes ────────────────────────────────── */

export type CodeActionKind = 'quickfix' | 'refactor' | 'refactor.extract' | 'source';

export interface CanonCodeAction {
  title: string;
  kind: CodeActionKind;
  edit?: {
    filePath: string;
    range: { startLine: number; startColumn: number; endLine: number; endColumn: number };
    newText: string;
  };
  isPreferred?: boolean;
}

export interface CodeActionsResponse {
  actions: CanonCodeAction[];
  filePath: string;
  error?: string;
}

export async function fetchCodeActions(
  filePath: string,
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number,
  content: string,
): Promise<CodeActionsResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/code-actions`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ filePath, startLine, startColumn, endLine, endColumn, content }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { actions: [], filePath, error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as CodeActionsResponse;
  } catch (err) {
    return { actions: [], filePath, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Find References ─────────────────────────────────────────

export interface ReferenceLocation {
  filePath: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  context: string;
  isDeclaration: boolean;
}

export interface FindReferencesResponse {
  references: ReferenceLocation[];
  symbol: string;
  filePath: string;
  error?: string;
}

export async function fetchFindReferences(
  filePath: string,
  line: number,
  column: number,
  content: string,
  includeDeclaration: boolean = true,
): Promise<FindReferencesResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/find-references`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ filePath, line, column, content, includeDeclaration }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { references: [], symbol: '', filePath, error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as FindReferencesResponse;
  } catch (err) {
    return { references: [], symbol: '', filePath, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Rename Symbol ───────────────────────────────────────────

export interface RenameEdit {
  filePath: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  newText: string;
}

export interface RenameSymbolResponse {
  edits: RenameEdit[];
  oldName: string;
  newName: string;
  filePath: string;
  error?: string;
}

export async function fetchRenameSymbol(
  filePath: string,
  line: number,
  column: number,
  newName: string,
  content: string,
): Promise<RenameSymbolResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/rename-symbol`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ filePath, line, column, newName, content }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { edits: [], oldName: '', newName, filePath, error: data.message || `HTTP ${res.status}` };
    }
    return (await res.json()) as RenameSymbolResponse;
  } catch (err) {
    return { edits: [], oldName: '', newName, filePath, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Signature Help types ────────────────────────────────────
export interface SignatureParameter {
  label: string;
  documentation?: string;
}

export interface SignatureInfo {
  label: string;
  documentation?: string;
  parameters: SignatureParameter[];
}

export interface SignatureHelpResponse {
  signatures: SignatureInfo[];
  activeSignature: number;
  activeParameter: number;
  error?: string;
}

export async function fetchSignatureHelp(
  filePath: string,
  line: number,
  column: number,
  content: string,
): Promise<SignatureHelpResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/signature-help`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ filePath, line, column, content }),
    });
    if (!res.ok) {
      return { signatures: [], activeSignature: 0, activeParameter: 0, error: `HTTP ${res.status}` };
    }
    return (await res.json()) as SignatureHelpResponse;
  } catch (err) {
    return { signatures: [], activeSignature: 0, activeParameter: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Document Highlights types ───────────────────────────────
export interface DocumentHighlightItem {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  kind: 'read' | 'write' | 'text';
}

export interface DocumentHighlightsResponse {
  highlights: DocumentHighlightItem[];
  symbol: string;
  error?: string;
}

export async function fetchDocumentHighlights(
  filePath: string,
  line: number,
  column: number,
  content: string,
): Promise<DocumentHighlightsResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/document-highlights`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ filePath, line, column, content }),
    });
    if (!res.ok) {
      return { highlights: [], symbol: '', error: `HTTP ${res.status}` };
    }
    return (await res.json()) as DocumentHighlightsResponse;
  } catch (err) {
    return { highlights: [], symbol: '', error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Git Diff types ──────────────────────────────────────────
export interface DiffLineChange {
  line: number;
  type: 'added' | 'deleted' | 'modified';
}

export interface GitDiffResponse {
  changes: DiffLineChange[];
  filePath: string;
  linesAdded: number;
  linesDeleted: number;
  linesModified: number;
  error?: string;
}

export async function fetchGitDiff(
  filePath: string,
  content: string,
  originalContent: string,
): Promise<GitDiffResponse> {
  try {
    const res = await fetch(`${PILOT_BASE}/canon/git-diff`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ filePath, content, originalContent }),
    });
    if (!res.ok) {
      return { changes: [], filePath, linesAdded: 0, linesDeleted: 0, linesModified: 0, error: `HTTP ${res.status}` };
    }
    return (await res.json()) as GitDiffResponse;
  } catch (err) {
    return { changes: [], filePath, linesAdded: 0, linesDeleted: 0, linesModified: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
