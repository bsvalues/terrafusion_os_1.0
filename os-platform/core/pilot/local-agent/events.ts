import { existsSync, readFileSync } from 'node:fs';

import { terrafusionPath } from './eventLog.js';

export interface LocalAgentEventEntry {
  ts: number;
  type: string;
  payload: Record<string, unknown>;
}

export interface LocalAgentEventsQuery {
  tail?: number;
  type?: string;
}

export interface LocalAgentEventsResult {
  filePresent: boolean;
  totalParsed: number;
  filteredCount: number;
  entries: LocalAgentEventEntry[];
  effectiveTail: number;
  filterType: string | null;
}

const DEFAULT_TAIL = 20;
const MAX_TAIL = 200;

function clampTail(raw: number | undefined): number {
  if (raw === undefined) return DEFAULT_TAIL;
  if (!Number.isFinite(raw) || Number.isNaN(raw)) return DEFAULT_TAIL;
  const n = Math.floor(raw);
  if (n < 1) return DEFAULT_TAIL;
  if (n > MAX_TAIL) return MAX_TAIL;
  return n;
}

export class LocalAgentEvents {
  constructor(private readonly repoRoot: string) {}

  read(query: LocalAgentEventsQuery = {}): LocalAgentEventsResult {
    const tail = clampTail(query.tail);
    const filterType = query.type && query.type.trim().length > 0 ? query.type.trim() : null;
    const path = terrafusionPath(this.repoRoot, 'agent-events.jsonl');
    if (!existsSync(path)) {
      return {
        filePresent: false,
        totalParsed: 0,
        filteredCount: 0,
        entries: [],
        effectiveTail: tail,
        filterType,
      };
    }

    let text = '';
    try {
      text = readFileSync(path, 'utf8');
    } catch {
      return {
        filePresent: true,
        totalParsed: 0,
        filteredCount: 0,
        entries: [],
        effectiveTail: tail,
        filterType,
      };
    }

    const parsed: LocalAgentEventEntry[] = [];
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (
          typeof obj?.ts === 'number' &&
          typeof obj?.type === 'string' &&
          obj?.payload &&
          typeof obj.payload === 'object'
        ) {
          parsed.push({ ts: obj.ts, type: obj.type, payload: obj.payload });
        }
      } catch {
        // Skip malformed line; do not throw.
      }
    }

    const filtered = filterType ? parsed.filter(e => e.type === filterType) : parsed;
    const tailed = filtered.slice(-tail).reverse();

    return {
      filePresent: true,
      totalParsed: parsed.length,
      filteredCount: filtered.length,
      entries: tailed,
      effectiveTail: tail,
      filterType,
    };
  }
}

function compactPayload(payload: Record<string, unknown>): string {
  let s: string;
  try {
    s = JSON.stringify(payload);
  } catch {
    s = '{}';
  }
  if (s.length > 120) s = s.slice(0, 117) + '...';
  return s;
}

function isoTs(ts: number): string {
  try {
    return new Date(ts * 1000).toISOString();
  } catch {
    return String(ts);
  }
}

export function renderLocalAgentEvents(result: LocalAgentEventsResult): string {
  const lines: string[] = [];
  lines.push('TerraFusion Local Agent — events');
  lines.push('');
  if (!result.filePresent) {
    lines.push('(no events recorded)');
    return lines.join('\n');
  }
  if (result.entries.length === 0) {
    if (result.filterType) {
      lines.push('(no matching events)');
    } else {
      lines.push('(no events recorded)');
    }
    return lines.join('\n');
  }

  const header = result.filterType
    ? `Showing newest ${result.entries.length} of ${result.filteredCount} type=${result.filterType} (parsed ${result.totalParsed} total).`
    : `Showing newest ${result.entries.length} of ${result.totalParsed} parsed.`;
  lines.push(header);
  lines.push('');
  for (const entry of result.entries) {
    lines.push(`${isoTs(entry.ts)}  ${entry.type}  ${compactPayload(entry.payload)}`);
  }
  return lines.join('\n');
}

export function parseEventsArgs(args: string[]): LocalAgentEventsQuery {
  const query: LocalAgentEventsQuery = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--tail') {
      const next = args[i + 1];
      const n = Number.parseInt(next ?? '', 10);
      if (!Number.isNaN(n)) {
        query.tail = n;
        i += 1;
      }
    } else if (arg.startsWith('--tail=')) {
      const n = Number.parseInt(arg.slice('--tail='.length), 10);
      if (!Number.isNaN(n)) query.tail = n;
    } else if (arg === '--type') {
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        query.type = next;
        i += 1;
      }
    } else if (arg.startsWith('--type=')) {
      query.type = arg.slice('--type='.length);
    }
  }
  return query;
}
