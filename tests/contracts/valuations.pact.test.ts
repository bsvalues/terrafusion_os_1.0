import path from 'node:path';
import { Pact } from '@pact-foundation/pact';
import fetch from 'node-fetch';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';

const provider = new Pact({
  consumer: 'frontend-app',
  provider: 'backend-api',
  log: path.resolve(process.cwd(), 'pact/logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pact/pacts'),
  logLevel: 'warn',
});

describe('Contract: valuations', () => {
  beforeAll(() =>
    provider.setup().then(() =>
      provider.addInteraction({
        state: 'valuation exists',
        uponReceiving: 'a get valuation request',
        withRequest: { method: 'GET', path: '/api/valuations/val-1' },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: { id: 'val-1', value: 412345, currency: 'USD' },
        },
      })
    )
  );

  afterAll(() => provider.finalize());

  it('validates API contract', async () => {
    const res = await fetch(`${provider.mockService.baseUrl}/api/valuations/val-1`);
    const body = await res.json();
    expect(body).toMatchObject({ id: 'val-1', value: expect.any(Number) });
    await provider.verify();
  });
});