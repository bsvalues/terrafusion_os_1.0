// TerraFusion Local Agent Cockpit — preload bridge.
//
// Exposes a single, explicit namespace `window.terrafusion` to the renderer.
// The renderer has nodeIntegration:false + contextIsolation:true + sandbox:true,
// so this is the ONLY surface the page sees from main.
//
// Slice O surface:
//   - terrafusion.version()        -> string
//   - terrafusion.platform()       -> string
//   - terrafusion.daemonStart()    -> Promise<DaemonStartResult>
//   - terrafusion.daemonStop()     -> Promise<DaemonStopResult>
//   - terrafusion.daemonStatus()   -> Promise<DaemonStatusResult>
//   - terrafusion.adapterList()    -> Promise<{ adapters: { id: string }[] }>
//
// Slice P surface (streaming chat):
//   - terrafusion.adapterChat({ adapterId, request, onChunk, onEnd, onError })
//       returns { cancel(): Promise<{ cancelled: boolean }>, streamId: Promise<string> }
//     The single-stream rule is enforced in main: starting a new chat cancels
//     the previous one.

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const COCKPIT_VERSION = '0.0.1';

const CH_CHUNK = 'terrafusion:adapter:chat:chunk';
const CH_END = 'terrafusion:adapter:chat:end';
const CH_ERROR = 'terrafusion:adapter:chat:error';

contextBridge.exposeInMainWorld('terrafusion', {
  version() {
    return COCKPIT_VERSION;
  },
  platform() {
    return process.platform;
  },
  daemonStart() {
    return ipcRenderer.invoke('terrafusion:daemon:start');
  },
  daemonStop() {
    return ipcRenderer.invoke('terrafusion:daemon:stop');
  },
  daemonStatus() {
    return ipcRenderer.invoke('terrafusion:daemon:status');
  },
  adapterList() {
    return ipcRenderer.invoke('terrafusion:adapter:list');
  },
  adapterChat(opts) {
    const onChunk = (opts && typeof opts.onChunk === 'function') ? opts.onChunk : null;
    const onEnd = (opts && typeof opts.onEnd === 'function') ? opts.onEnd : null;
    const onError = (opts && typeof opts.onError === 'function') ? opts.onError : null;

    let resolvedStreamId = null;
    let teardown = null;

    const streamIdPromise = ipcRenderer
      .invoke('terrafusion:adapter:chat:start', {
        adapterId: opts && opts.adapterId,
        request: opts && opts.request,
      })
      .then((res) => {
        resolvedStreamId = res && res.streamId;
        const chunkListener = (_e, payload) => {
          if (!payload || payload.streamId !== resolvedStreamId) return;
          if (onChunk) onChunk(payload.chunk);
        };
        const endListener = (_e, payload) => {
          if (!payload || payload.streamId !== resolvedStreamId) return;
          if (onEnd) onEnd();
          if (teardown) teardown();
        };
        const errorListener = (_e, payload) => {
          if (!payload || payload.streamId !== resolvedStreamId) return;
          if (onError) onError(new Error(payload.message || 'chat error'));
          if (teardown) teardown();
        };
        ipcRenderer.on(CH_CHUNK, chunkListener);
        ipcRenderer.on(CH_END, endListener);
        ipcRenderer.on(CH_ERROR, errorListener);
        teardown = () => {
          ipcRenderer.removeListener(CH_CHUNK, chunkListener);
          ipcRenderer.removeListener(CH_END, endListener);
          ipcRenderer.removeListener(CH_ERROR, errorListener);
          teardown = null;
        };
        return resolvedStreamId;
      });

    return {
      streamId: streamIdPromise,
      async cancel() {
        const streamId = await streamIdPromise.catch(() => null);
        const result = await ipcRenderer.invoke(
          'terrafusion:adapter:chat:cancel',
          { streamId },
        );
        if (teardown) teardown();
        return result;
      },
    };
  },
});
