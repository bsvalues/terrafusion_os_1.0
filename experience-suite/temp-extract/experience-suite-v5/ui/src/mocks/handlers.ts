// ui/src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'OK' });
  }),
  http.get('/api/modules', () => {
    return HttpResponse.json([
      { name: 'terramind', status: 'active' },
      { name: 'testing-suite', status: 'active' }
    ]);
  }),
  http.get('/api/security/csp-report/summary', () => {
    return HttpResponse.json({ count: 0 });
  })
];
