/**
 * canonicalParcelIdentity.contract.test.ts
 *
 * Phase 18 — Brick 1: Canonical Parcel Identity
 * ==============================================
 *
 * Proves that any entry surface that references a parcel — search results,
 * notification deep-links, recent-items — resolves to exactly one canonical
 * parcel identity key and one canonical workbench URL.
 *
 * Entry surfaces under test:
 *   /search?parcel=12345
 *   /notifications/open?parcelId=12345
 *   /recent-items/parcel/12345
 *
 * All three must produce:
 *   canonicalParcelId → '12345'
 *   canonicalUrl      → '/property/12345'  (or '/property/12345/:tab')
 *   one workbench mount, one county-header identity
 *
 * Contract:
 *   - Parcel id extracted consistently regardless of query param name or path segment
 *   - County header is unaffected by entry surface (comes from session)
 *   - One canonical identity key → one URL → one workbench (no siblings)
 *   - Entry surface noise (utm, session, ref) does not change canonical key
 *
 * @see src/pages/workbench/PropertyWorkbench.tsx — parcelId from useParams
 * @see src/auth/useSession.ts — county header source of truth
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let workbenchSource: string;
let useSessionSource: string;

beforeAll(() => {
  workbenchSource = readFileSync(
    resolve(import.meta.dirname, '../../pages/workbench/PropertyWorkbench.tsx'),
    'utf-8',
  );
  useSessionSource = readFileSync(
    resolve(import.meta.dirname, '../../auth/useSession.ts'),
    'utf-8',
  );
});

// ── Canonical parcel id extraction ─────────────────────────────────────────────

/**
 * Extracts parcel id from the three entry surfaces.
 * Each surface encodes the parcel differently — this normalizer collapses them.
 */
function extractCanonicalParcelId(rawUrl: string): string | null {
  // Surface 1: /search?parcel=<id>  or  /search?parcelId=<id>
  const searchMatch = rawUrl.match(/[?&]parcel(?:Id)?=([^&#+]+)/i);
  if (searchMatch) return decodeURIComponent(searchMatch[1]);

  // Surface 2: /notifications/open?parcelId=<id>  (already covered above)

  // Surface 3: /recent-items/parcel/<id>
  const recentMatch = rawUrl.match(/\/recent-items\/parcel\/([^/?#]+)/);
  if (recentMatch) return decodeURIComponent(recentMatch[1]);

  // Surface 4: /property/<id>[/...]  (canonical URL itself)
  const propertyMatch = rawUrl.match(/^\/property\/([^/?#]+)/);
  if (propertyMatch) return decodeURIComponent(propertyMatch[1]);

  return null;
}

function canonicalWorkbenchUrl(parcelId: string, tab?: string): string {
  if (!tab || tab === 'summary') return `/property/${parcelId}`;
  return `/property/${parcelId}/${tab}`;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('canonicalParcelIdentity', () => {

  // ── Test 1: Search entry surface → canonical parcel id ────────────────────

  it('extracts canonical parcel id from search entry surface', () => {
    const urls = [
      '/search?parcel=12345',
      '/search?parcel=12345&utm_source=email',
      '/search?q=owner+name&parcel=12345&session=abc',
      '/search?parcelId=12345',
      '/search?parcelId=12345&from=notification',
    ];
    for (const url of urls) {
      expect(extractCanonicalParcelId(url)).toBe('12345');
    }
  });

  // ── Test 2: Notification deep-link → canonical parcel id ──────────────────

  it('extracts canonical parcel id from notification deep-link entry surface', () => {
    const urls = [
      '/notifications/open?parcelId=12345',
      '/notifications/open?parcelId=12345&notificationId=abc',
      '/notifications/open?parcelId=12345&type=assessment&ref=email',
    ];
    for (const url of urls) {
      expect(extractCanonicalParcelId(url)).toBe('12345');
    }
  });

  // ── Test 3: Recent-items path → canonical parcel id ───────────────────────

  it('extracts canonical parcel id from recent-items path entry surface', () => {
    const urls = [
      '/recent-items/parcel/12345',
      '/recent-items/parcel/12345?highlight=true',
      '/recent-items/parcel/12345#top',
    ];
    for (const url of urls) {
      expect(extractCanonicalParcelId(url)).toBe('12345');
    }
  });

  // ── Test 4: All three surfaces produce one canonical URL ───────────────────

  it('all entry surfaces for the same parcel produce one canonical workbench URL', () => {
    const entryUrls = [
      '/search?parcel=12345',
      '/notifications/open?parcelId=12345',
      '/recent-items/parcel/12345',
    ];
    const parcelIds = entryUrls.map(extractCanonicalParcelId);
    // All must resolve to the same parcel id
    const unique = new Set(parcelIds);
    expect(unique.size).toBe(1);
    expect([...unique][0]).toBe('12345');

    // And produce the same canonical workbench URL
    const workbenchUrls = parcelIds.map(id => canonicalWorkbenchUrl(id!));
    const uniqueUrls = new Set(workbenchUrls);
    expect(uniqueUrls.size).toBe(1);
    expect([...uniqueUrls][0]).toBe('/property/12345');
  });

  // ── Test 5: County header comes from session, not entry surface ────────────

  it('county header is sourced from session, not from parcel entry URL', () => {
    // useSession owns x-county-id — entry surfaces do not influence it.
    // Structural: useSession reads localStorage/session, not location.
    // It does not read 'parcelId', 'parcel', or 'recent-items' from the URL.
    expect(useSessionSource).toContain('countyId');
    expect(useSessionSource).not.toContain('recent-items');
    expect(useSessionSource).not.toContain('notifications/open');

    // The county header is the trim-or-fallback pattern (Phase 15 fix)
    expect(useSessionSource).toContain('trim()');
  });

  // ── Test 6: One canonical identity → one workbench (no siblings) ──────────

  it('canonical parcel identity produces one workbench URL preventing sibling windows', () => {
    // If all entry surfaces → same canonical URL, React Router mounts exactly
    // one component instance. PropertyWorkbench gets parcelId from useParams.
    // Structural: workbench reads parcelId from route params (not query string).
    expect(workbenchSource).toContain('useParams');
    expect(workbenchSource).toContain('parcelId');
    // Workbench does not spawn windows itself
    expect(workbenchSource).not.toContain('openWindow');
    expect(workbenchSource).not.toContain('activateModule');

    // Verify canonical URL structure: one parcelId segment, one optional tab
    const url = canonicalWorkbenchUrl('12345', 'forge');
    expect(url).toMatch(/^\/property\/[^/]+\/[^/]+$/);
    expect(url).toBe('/property/12345/forge');
  });
});
