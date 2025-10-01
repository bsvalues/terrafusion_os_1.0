// ui/src/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/health', (_req, res, ctx) => res(ctx.status(200), ctx.json({ status: 'OK' }))),
  rest.get('/api/modules', (_req, res, ctx) => res(ctx.status(200), ctx.json([
    { name: 'terramind', status: 'active' },
    { name: 'testing-suite', status: 'active' }
  ]))),
  rest.get('/api/security/csp-report/summary', (_req, res, ctx) => res(ctx.json({ count: 0 })))
];
