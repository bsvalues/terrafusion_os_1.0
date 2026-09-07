import { timingSafeEqual } from 'node:crypto';

const actions = new Set(['ping', 'corpus', 'doctor', 'gatefast']);
const safeIdentity = value =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= 128 &&
  /^[A-Za-z0-9_.:@-]+$/.test(value);

/** Conference mode exposes only fixed local checks, behind the authenticated
 * API host. No filesystem, generic tool execution, or legacy Git route escapes. */
export function checkCanonConferenceRequest({ enabled, expectedToken, method, pathname, headers }) {
  if (!enabled) return { status: 0 };
  const action = pathname.startsWith('/pilot/canon/') ? pathname.slice('/pilot/canon/'.length) : '';
  if (!actions.has(action)) return { status: 404, reason: 'CANON_CONFERENCE_ROUTE_UNAVAILABLE' };
  if (method !== 'POST') return { status: 405, reason: 'CANON_CONFERENCE_POST_REQUIRED' };
  const supplied = headers['x-terrafusion-localops-host'];
  if (
    typeof expectedToken !== 'string' ||
    expectedToken.length < 32 ||
    typeof supplied !== 'string'
  ) {
    return { status: 403, reason: 'CANON_API_HOST_REQUIRED' };
  }
  const actual = Buffer.from(supplied);
  const expected = Buffer.from(expectedToken);
  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected) ||
    !safeIdentity(headers['x-terrafusion-county-id']) ||
    !safeIdentity(headers['x-terrafusion-user-id'])
  ) {
    return { status: 403, reason: 'CANON_API_HOST_REQUIRED' };
  }
  return { status: 200 };
}
