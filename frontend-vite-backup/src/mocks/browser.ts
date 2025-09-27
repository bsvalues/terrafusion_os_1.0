// TerraFusion OS - MSW Browser Worker
// Government. Transcended.

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Initialize MSW worker for TerraFusion OS development
export const worker = setupWorker(...handlers);

// Enable console logging for development
if (process.env.NODE_ENV === 'development') {
  worker.events.on('request:start', ({ request }) => {
    console.log('🌐 MSW intercepted:', request.method, request.url);
  });
  
  worker.events.on('request:match', ({ request }) => {
    console.log('✅ MSW matched:', request.method, request.url);
  });
  
  worker.events.on('request:unhandled', ({ request }) => {
    console.log('⚠️  MSW unhandled:', request.method, request.url);
  });
}