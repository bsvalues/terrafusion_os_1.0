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
