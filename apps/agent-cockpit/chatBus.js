// TerraFusion Local Agent Cockpit — chat streaming bus.
//
// Pure CommonJS, no Electron dependency. main.js wires this to ipcMain +
// webContents.send; tests can drive it directly with a fake registry and a
// captured send() function.
//
// Wire protocol (renderer ⇄ main):
//   invoke 'terrafusion:adapter:chat:start'  ({adapterId, request}) -> {streamId}
//   invoke 'terrafusion:adapter:chat:cancel' ({streamId})            -> {cancelled}
//   send   'terrafusion:adapter:chat:chunk'  ({streamId, chunk})     -> renderer
//   send   'terrafusion:adapter:chat:end'    ({streamId})            -> renderer
//   send   'terrafusion:adapter:chat:error'  ({streamId, message})   -> renderer
//
// Founder-safe invariants:
//  - Single active stream per bus. `start` while a stream is active cancels
//    the previous stream (deterministic, not racy).
//  - Cancellation uses AbortController; adapters honor `signal.aborted`.
//  - No `eval`, no dynamic require, no network code here. The bus is a pipe.

'use strict';

const { randomUUID } = require('node:crypto');

const CH_CHUNK = 'terrafusion:adapter:chat:chunk';
const CH_END = 'terrafusion:adapter:chat:end';
const CH_ERROR = 'terrafusion:adapter:chat:error';

function createChatBus(options) {
  if (!options || typeof options.getRegistry !== 'function') {
    throw new Error('createChatBus: getRegistry() is required');
  }
  if (typeof options.send !== 'function') {
    throw new Error('createChatBus: send(channel, payload) is required');
  }
  const { getRegistry, send } = options;

  /** @type {{ streamId: string, controller: AbortController } | null} */
  let active = null;

  function cancelActive() {
    if (!active) return false;
    try {
      active.controller.abort();
    } catch (_err) {
      // AbortController.abort() is safe; ignore if already aborted.
    }
    active = null;
    return true;
  }

  async function start(params) {
    const registry = getRegistry();
    if (!registry || typeof registry.get !== 'function') {
      throw new Error('chat bus has no registry — start the daemon first');
    }
    const adapterId = params && params.adapterId;
    if (typeof adapterId !== 'string' || adapterId.length === 0) {
      throw new Error('chat bus start: adapterId is required');
    }
    const adapter = registry.get(adapterId);
    if (!adapter || typeof adapter.chat !== 'function') {
      throw new Error(`chat bus start: unknown adapter '${adapterId}'`);
    }
    const request = params.request;
    if (!request || !Array.isArray(request.messages)) {
      throw new Error('chat bus start: request.messages must be an array');
    }

    // Single-stream rule: a fresh start cancels the previous.
    cancelActive();

    const streamId = randomUUID();
    const controller = new AbortController();
    active = { streamId, controller };

    // Drive the adapter on a microtask so the caller sees streamId first.
    queueMicrotask(async () => {
      try {
        for await (const chunk of adapter.chat(request, controller.signal)) {
          if (controller.signal.aborted) return;
          send(CH_CHUNK, { streamId, chunk });
        }
        if (!controller.signal.aborted) {
          send(CH_END, { streamId });
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        send(CH_ERROR, {
          streamId,
          message: err && err.message ? String(err.message) : String(err),
        });
      } finally {
        if (active && active.streamId === streamId) {
          active = null;
        }
      }
    });

    return { streamId };
  }

  function cancel(params) {
    if (!active) return { cancelled: false };
    if (params && typeof params.streamId === 'string' && params.streamId !== active.streamId) {
      return { cancelled: false };
    }
    return { cancelled: cancelActive() };
  }

  function activeStreamId() {
    return active ? active.streamId : null;
  }

  return { start, cancel, activeStreamId };
}

module.exports = {
  createChatBus,
  CHAT_CHUNK_CHANNEL: CH_CHUNK,
  CHAT_END_CHANNEL: CH_END,
  CHAT_ERROR_CHANNEL: CH_ERROR,
};
