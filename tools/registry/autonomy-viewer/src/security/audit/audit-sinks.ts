import type { AuditLogEntry } from './audit-log.js';

export interface AuditSink {
  readonly type: 'file' | 'memory';
  readonly path?: string;
  append(entry: AuditLogEntry, line: string): void;
}

export interface MemoryAuditSink extends AuditSink {
  readonly type: 'memory';
  readonly entries: AuditLogEntry[];
  readonly lines: string[];
  clear(): void;
}

export interface FileAuditSinkOptions {
  readonly path: string;
  readonly appendFn?: (line: string) => void;
}

export interface FileAuditSink extends AuditSink {
  readonly type: 'file';
  readonly path: string;
}

export function createMemoryAuditSink(): MemoryAuditSink {
  const entries: AuditLogEntry[] = [];
  const lines: string[] = [];

  return {
    type: 'memory',
    entries,
    lines,
    append(entry: AuditLogEntry, line: string): void {
      entries.push(entry);
      lines.push(line);
    },
    clear(): void {
      entries.length = 0;
      lines.length = 0;
    },
  };
}

export function createFileAuditSink(options: FileAuditSinkOptions): FileAuditSink {
  const { path, appendFn } = options;
  const append =
    appendFn ??
    ((line: string) => {
      import('node:fs').then(fs => {
        fs.appendFileSync(path, line);
      });
    });

  return {
    type: 'file',
    path,
    append(entry: AuditLogEntry, line: string): void {
      void entry;
      append(line);
    },
  };
}
