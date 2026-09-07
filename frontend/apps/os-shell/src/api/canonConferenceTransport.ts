import { getViteEnv } from '../env/getViteEnv';
import { apiFetch } from '../lib/apiBase';

/** Keep development transport intact; the explicitly selected conference build
 * uses the authenticated same-origin API host, never a dev or remote origin. */
export function canonConferenceFetch(
  action: 'ping' | 'doctor' | 'gatefast' | 'corpus',
  legacyUrl: string,
  init: RequestInit
): Promise<Response> {
  return String(getViteEnv().VITE_WASHINGTON_CONFERENCE_LOCAL_PACKAGE) === 'true'
    ? apiFetch(`/pilot/canon/${action}`, init)
    : fetch(legacyUrl, init);
}
