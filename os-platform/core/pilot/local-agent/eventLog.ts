import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { redactPayload, type RedactValue } from './redact.js';

export interface LocalAgentEvent {
  ts: number;
  type: string;
  payload: Record<string, unknown>;
}

export function terrafusionDir(repoRoot: string): string {
  return resolve(repoRoot, '.terrafusion');
}

export function terrafusionPath(repoRoot: string, ...segments: string[]): string {
  return resolve(terrafusionDir(repoRoot), ...segments);
}

export function appendLocalAgentEvent(
  repoRoot: string,
  type: string,
  payload: Record<string, unknown>,
): void {
  const directory = terrafusionDir(repoRoot);
  mkdirSync(directory, { recursive: true });

  const redacted = redactPayload(payload as Record<string, RedactValue>);

  const event: LocalAgentEvent = {
    ts: Math.floor(Date.now() / 1000),
    type,
    payload: redacted.value,
  };

  appendFileSync(
    terrafusionPath(repoRoot, 'agent-events.jsonl'),
    `${JSON.stringify(event)}\n`,
    'utf8',
  );
}