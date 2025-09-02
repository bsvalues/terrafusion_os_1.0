/* tests/msw/handlers.ts */
import { http, HttpResponse, delay } from 'msw';
import { authHandlers } from './handlers.auth';
import { searchHandlers } from './handlers.search';
import { exportHandlers } from './handlers.export';
import { graphqlHandlers } from './handlers.graphql';

export const handlers = [
  // Health check endpoints
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'healthy', timestamp: Date.now() });
  }),

  // Core demo endpoints you already had:
  http.get('/api/valuations/:id', async ({ params, request }) => {
    const chaos = new URL(request.url).searchParams.get('chaos');
    if (chaos === '500') return HttpResponse.json({ error: 'boom' }, { status: 500 });
    if (chaos === 'slow') await delay(1200);
    return HttpResponse.json({ id: params.id, value: 412345, currency: 'USD' });
  }),
  http.post('/api/valuations', async ({ request }) => {
    const body = await request.json();
    if (!body?.parcelId) return HttpResponse.json({ error: 'Bad Request' }, { status: 400 });
    return HttpResponse.json({ id: 'val-1', status: 'PENDING' }, { status: 201 });
  }),
  http.post('/api/comp-grid/rows', async ({ request }) => {
    const body = await request.json();
    if (body?.forceConflict) return HttpResponse.json({ error: 'Conflict' }, { status: 409 });
    return HttpResponse.json({ id: 'row-123', ok: true });
  }),

  // AI Swarm Status
  http.get('/api/ai-swarm/status', () => {
    return HttpResponse.json({
      totalAgents: 1008,
      activeAgents: 1008,
      health: 'OPTIMAL',
      performance: {
        throughput: 15847,
        responseTime: 0.023,
        successRate: 99.87
      },
      breakdown: {
        scouts: 200,
        workers: 500,
        sentinels: 150,
        coordinators: 100,
        testers: 58
      }
    });
  }),

  // Quantum Performance Metrics
  http.get('/api/quantum/performance', () => {
    return HttpResponse.json({
      classicalTime: 247.3,
      quantumTime: 0.27,
      improvement: 914,
      accuracy: 99.97,
      efficiency: 96.4
    });
  }),

  // Government Compliance
  http.get('/api/compliance/validate', ({ request }) => {
    const url = new URL(request.url);
    const standards = url.searchParams.get('standards')?.split(',') || [];
    
    const complianceResults = standards.reduce((acc, standard) => {
      switch (standard) {
        case 'FISMA':
          acc[standard] = { status: 'COMPLIANT', score: 99.8 };
          break;
        case 'NIST-800-53':
          acc[standard] = { status: 'COMPLIANT', score: 99.6 };
          break;
        case 'Section508':
          acc[standard] = { status: 'COMPLIANT', score: 100.0 };
          break;
        case 'WCAG2.1':
          acc[standard] = { status: 'COMPLIANT', score: 99.9 };
          break;
        case 'SOC2':
          acc[standard] = { status: 'COMPLIANT', score: 99.7 };
          break;
        default:
          acc[standard] = { status: 'UNKNOWN', score: 0 };
      }
      return acc;
    }, {} as Record<string, any>);

    return HttpResponse.json(complianceResults);
  }),

  // Multi-county deployment
  http.post('/api/counties/deploy', async ({ request }) => {
    const body = await request.json() as { counties: string[] };
    
    return HttpResponse.json({
      deploymentId: 'deploy-' + Date.now(),
      counties: body.counties.map(county => ({
        name: county,
        status: 'DEPLOYED',
        time: '0.2s',
        agents: 252,
        integration: 99.9
      })),
      totalTime: `${body.counties.length * 0.6}s`,
      status: 'SUCCESS'
    });
  }),

  // Error simulation handlers
  http.get('/api/error/500', () => {
    return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }),

  http.get('/api/error/401', () => {
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }),

  http.get('/api/error/403', () => {
    return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
  }),

  http.get('/api/error/timeout', async () => {
    await new Promise(resolve => setTimeout(resolve, 10000));
    return HttpResponse.json({});
  }),

  // File upload simulation
  http.post('/api/upload', () => {
    return HttpResponse.json({
      fileId: 'file-' + Date.now(),
      status: 'uploaded',
      url: '/files/uploaded-file.pdf'
    });
  }),

  // Added contract packs:
  ...authHandlers,
  ...searchHandlers,
  ...exportHandlers,
  ...graphqlHandlers,
];