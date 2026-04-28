import type { OllamaTransport, OllamaTransportResponse } from './ollamaAdapter.js';

export type RemoteTransport = OllamaTransport;
export type RemoteTransportResponse = OllamaTransportResponse;

export const REMOTE_ENABLE_ENV = 'TF_LOCAL_AGENT_ALLOW_REMOTE';

/**
 * Asserts that remote (non-local) model adapters are explicitly enabled.
 * Throws unless `TF_LOCAL_AGENT_ALLOW_REMOTE=1` is set in the supplied env.
 */
export function assertRemoteEnabled(env: NodeJS.ProcessEnv = process.env): void {
  if (env[REMOTE_ENABLE_ENV] !== '1') {
    throw new Error(
      `remote model adapters are disabled. Set ${REMOTE_ENABLE_ENV}=1 to opt in.`,
    );
  }
}

export function assertApiKey(apiKey: string | undefined, providerLabel: string): asserts apiKey is string {
  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error(`${providerLabel} adapter requires a non-empty apiKey`);
  }
}

/**
 * Iterates SSE events from an async iterable of string pieces.
 *
 * Each yielded value is `{ event, data }` where `event` is the optional event
 * name (default 'message') and `data` is the concatenated payload (newlines
 * preserved between multiple `data:` lines per SSE spec).
 */
export async function* iterateSseEvents(
  body: AsyncIterable<string>,
  signal?: AbortSignal,
): AsyncIterable<{ event: string; data: string }> {
  let buffer = '';
  let eventName = 'message';
  let dataLines: string[] = [];

  function flush(): { event: string; data: string } | null {
    if (dataLines.length === 0 && eventName === 'message') return null;
    const out = { event: eventName, data: dataLines.join('\n') };
    eventName = 'message';
    dataLines = [];
    return out;
  }

  for await (const piece of body) {
    if (signal?.aborted) return;
    buffer += piece;
    let nl = buffer.indexOf('\n');
    while (nl !== -1) {
      const rawLine = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      nl = buffer.indexOf('\n');
      const line = rawLine.replace(/\r$/, '');
      if (line === '') {
        const evt = flush();
        if (evt) yield evt;
        continue;
      }
      if (line.startsWith(':')) continue; // comment
      const colon = line.indexOf(':');
      const field = colon === -1 ? line : line.slice(0, colon);
      const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '');
      if (field === 'event') eventName = value;
      else if (field === 'data') dataLines.push(value);
    }
  }
  const evt = flush();
  if (evt) yield evt;
}
