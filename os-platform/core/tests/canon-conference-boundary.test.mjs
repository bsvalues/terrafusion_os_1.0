import test from 'node:test';
import assert from 'node:assert/strict';

// This boundary must reject direct/unauthenticated requests before any handler
// or subprocess executes. A missing guard is a missing product boundary.
const boundary = await import('../pilot/canon-conference-boundary.mjs').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});
const token = 'test-only-internal-host-token-0123456789';
const headers = {
  'x-terrafusion-localops-host': token,
  'x-terrafusion-county-id': 'b7c9fef3-cf48-45f4-967f-d3b9d265876d',
  'x-terrafusion-user-id': 'conference-test',
};
const check = (overrides = {}) => {
  assert.equal(
    typeof boundary.checkCanonConferenceRequest,
    'function',
    'Conference requests require a dispatch guard'
  );
  return boundary.checkCanonConferenceRequest({
    enabled: true,
    expectedToken: token,
    method: 'POST',
    pathname: '/pilot/canon/ping',
    headers,
    ...overrides,
  });
};
test('conference guard admits fixed authenticated local actions', () => {
  for (const action of ['ping', 'corpus', 'doctor', 'gatefast']) {
    assert.equal(check({ pathname: `/pilot/canon/${action}` }).status, 200);
  }
});
test('conference guard rejects missing or forged internal credentials', () => {
  for (const supplied of ['', 'wrong', [token]]) {
    assert.equal(
      check({ headers: { ...headers, 'x-terrafusion-localops-host': supplied } }).status,
      403
    );
  }
  assert.equal(check({ expectedToken: '' }).status, 403);
});
test('conference guard requires trusted identity context', () => {
  assert.equal(check({ headers: { ...headers, 'x-terrafusion-county-id': '' } }).status, 403);
  assert.equal(
    check({ headers: { ...headers, 'x-terrafusion-user-id': 'bad\r\nheader' } }).status,
    403
  );
});
test('conference guard refuses generic execution, filesystem and legacy git routes', () => {
  for (const pathname of [
    '/pilot/invoke',
    '/pilot/canon/write',
    '/pilot/canon/read',
    '/pilot/canon/git-status',
    '/pilot/health',
    '/pilot/canon/ping/',
  ]) {
    assert.equal(check({ pathname }).status, 404);
  }
  assert.equal(check({ method: 'GET' }).status, 405);
});
test('non-conference development mode is not silently changed', () => {
  assert.equal(check({ enabled: false }).status, 0);
});
