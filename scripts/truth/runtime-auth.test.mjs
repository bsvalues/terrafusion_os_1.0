#!/usr/bin/env node

import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import { runtimeFetch } from './runtime-auth.mjs';

function startAuthServer() {
  const requests = [];
  const server = http.createServer((request, response) => {
    requests.push({
      url: request.url,
      authorization: request.headers.authorization ?? null,
    });

    response.setHeader('content-type', 'application/json');

    if (request.url === '/api/auth/dev-token') {
      response.end(JSON.stringify({ token: 'dev-token-for-truth-gates' }));
      return;
    }

    if (request.url === '/api/runtime/truth/db-identity') {
      if (request.headers.authorization === 'Bearer dev-token-for-truth-gates') {
        response.end(JSON.stringify({ passed: true }));
        return;
      }

      response.statusCode = 401;
      response.end(JSON.stringify({ error: 'unauthorized' }));
      return;
    }

    response.statusCode = 404;
    response.end(JSON.stringify({ error: 'not found' }));
  });

  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        requests,
        close: () => new Promise(done => server.close(done)),
      });
    });
  });
}

test('runtimeFetch retries 401 runtime probes with the development token endpoint', async () => {
  const server = await startAuthServer();

  try {
    const response = await runtimeFetch(`${server.baseUrl}/api/runtime/truth/db-identity`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.passed, true);
    assert.deepEqual(
      server.requests.map(request => request.url),
      ['/api/runtime/truth/db-identity', '/api/auth/dev-token', '/api/runtime/truth/db-identity']
    );
    assert.equal(server.requests[2].authorization, 'Bearer dev-token-for-truth-gates');
  } finally {
    await server.close();
  }
});
