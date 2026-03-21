/**
 * Pre-load shim: registers ws from pnpm store before @microsoft/signalr loads it
 * Usage: node -r ./phase32-ws-preload.cjs ./phase32-codex-collab-smoke.cjs
 */
'use strict';

const Module = require('module');
const originalLoad = Module._load;

const PNPM_ROOT = 'C:/Users/bsval/terrafusion_os_1.0/node_modules/.pnpm';

const REDIRECTS = {
  'ws': PNPM_ROOT + '/ws@8.18.3/node_modules/ws',
  'eventsource': PNPM_ROOT + '/eventsource@2.0.2/node_modules/eventsource',
};

Module._load = function(request, parent, isMain) {
  if (REDIRECTS[request]) {
    return originalLoad(REDIRECTS[request], parent, isMain);
  }
  return originalLoad(request, parent, isMain);
};
