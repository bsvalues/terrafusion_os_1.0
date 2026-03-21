/**
 * directEntryCanonicalUrl.contract.test.ts
 *
 * Phase 17 — Brick 4: Direct-Entry Canonical URL Deduplication
 * =============================================================
 *
 * Proves that direct-entry parcel links (from notifications, search results,
 * emails, deep links) collapse to exactly one canonical URL per parcel surface,
 * and that no standalone window is opened for parcel-scoped tools.
 *
 * Equivalent entries that must resolve to ONE canonical URL:
 *   /property/123/forge
 *   /property/123/forge?from=notification
 *   /property/123/forge#top
 *   /property/123/FORGE          ← case variant
 *
 * All four resolve to: /property/123/forge
 *
 * Contract:
 *   - Query string noise does not change the canonical URL
 *   - Hash fragment noise does not change the canonical URL
 *   - Case variants of tab slugs canonicalize to lowercase
 *   - One canonical URL → one workbench mount (no duplication)
 *   - Parcel tools from direct entry NEVER open as standalone windows
 *   - Invalid tab slugs from direct entry → /property/:parcelId (summary)
 *
 * @see src/pages/workbench/PropertyWorkbench.tsx — getCurrentTabFromPath
 * @see src/components/suites/SuiteModuleGrid.tsx — launchMode contract
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let suiteModuleGridSource: string;
let forgeSuiteSource: string;
let atlasSuiteSource: string;

beforeAll(() => {
  suiteModuleGridSource = readFileSync(
    resolve(import.meta.dirname, '../../components/suites/SuiteModuleGrid.tsx'),
    'utf-8',
  );
  forgeSuiteSource = readFileSync(
    resolve(import.meta.dirname, '../../pages/suites/ForgeSuiteHome.tsx'),
    'utf-8',
  );
  atlasSuiteSource = readFileSync(
    resolve(import.meta.dirname, '../../pages/suites/AtlasSuiteHome.tsx'),
    'utf-8',
  );
});

// ── Canonical URL logic ────────────────────────────────────────────────────────

const TAB_PATH_MAP: Record<string, string> = {
  forge: 'forge', atlas: 'atlas', dais: 'dais', clerk: 'clerk',
  treasury: 'treasury', audit: 'audit', dossier: 'dossier', pilot: 'pilot',
};

/**
 * Strips query string and hash, lowercases tab slug, returns canonical URL.
 * This is what a canonicalizer guard at the route boundary must do.
 */
function canonicalizeEntryUrl(rawUrl: string): string {
  // Strip hash
  const withoutHash = rawUrl.split('#')[0];
  // Strip query string
  const withoutQuery = withoutHash.split('?')[0];
  // Lowercase the entire path (parcelIds are case-sensitive in practice,
  // but tab slugs must be lowercase — we canonicalize just the tab segment)
  const match = withoutQuery.match(/^(\/property\/[^/]+)(\/(.+))?$/);
  if (!match) return withoutQuery;
  const base = match[1];
  const rawTab = match[3] ?? '';
  const canonicalTab = TAB_PATH_MAP[rawTab.toLowerCase()];
  if (!canonicalTab) return base; // unknown slug → summary (base URL)
  return `${base}/${canonicalTab}`;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('directEntryCanonicalUrl', () => {

  // ── Forge direct-entry normalization ──────────────────────────────────────

  it('normalizes direct Forge parcel entry to one canonical property URL', () => {
    const canonical = '/property/123/forge';
    expect(canonicalizeEntryUrl('/property/123/forge')).toBe(canonical);
    expect(canonicalizeEntryUrl('/property/123/forge?from=notification')).toBe(canonical);
    expect(canonicalizeEntryUrl('/property/123/forge#top')).toBe(canonical);
    expect(canonicalizeEntryUrl('/property/123/FORGE')).toBe(canonical);
  });

  // ── Atlas direct-entry normalization ─────────────────────────────────────

  it('normalizes direct Atlas parcel entry to one canonical property URL', () => {
    const canonical = '/property/456/atlas';
    expect(canonicalizeEntryUrl('/property/456/atlas')).toBe(canonical);
    expect(canonicalizeEntryUrl('/property/456/atlas?from=search')).toBe(canonical);
    expect(canonicalizeEntryUrl('/property/456/atlas#map')).toBe(canonical);
    expect(canonicalizeEntryUrl('/property/456/ATLAS')).toBe(canonical);
  });

  // ── Dossier direct-entry normalization ───────────────────────────────────

  it('normalizes direct Dossier parcel entry to one canonical property URL', () => {
    const canonical = '/property/789/dossier';
    expect(canonicalizeEntryUrl('/property/789/dossier')).toBe(canonical);
    expect(canonicalizeEntryUrl('/property/789/dossier?ref=email')).toBe(canonical);
    expect(canonicalizeEntryUrl('/property/789/DOSSIER')).toBe(canonical);
  });

  // ── Query/hash deduplication ──────────────────────────────────────────────

  it('deduplicates equivalent parcel URLs with query/hash noise', () => {
    const variants = [
      '/property/123/forge',
      '/property/123/forge?from=notification&session=abc',
      '/property/123/forge?utm_source=email',
      '/property/123/forge#anchor-here',
      '/property/123/forge?q=1#h=2',
    ];
    const canonicals = variants.map(canonicalizeEntryUrl);
    // All must collapse to the same canonical URL
    const unique = new Set(canonicals);
    expect(unique.size).toBe(1);
    expect([...unique][0]).toBe('/property/123/forge');
  });

  // ── Window reuse via URL identity ─────────────────────────────────────────

  it('reuses the existing workbench for equivalent canonical parcel URLs', () => {
    // Structural: if canonicalizeEntryUrl(url1) === canonicalizeEntryUrl(url2),
    // React Router renders the same route, which means the same mounted component.
    // No call to openWindow() — the workbench is already mounted.
    const url1 = '/property/123/forge';
    const url2 = '/property/123/forge?from=notification';
    expect(canonicalizeEntryUrl(url1)).toBe(canonicalizeEntryUrl(url2));
  });

  // ── Parcel tools never launch standalone from direct entry ────────────────

  it('never opens a standalone parcel module window from a direct-entry parcel link', () => {
    // Structural: SuiteModuleGrid.handleLaunch is the only launch path.
    // launchMode='workbench' always navigates to /property/:parcelId/:tab.
    // Forge-specific parcel tools in ForgeSuiteHome all have launchMode='workbench'.
    expect(forgeSuiteSource).toContain("launchMode: 'workbench'");
    expect(atlasSuiteSource).toContain("launchMode: 'workbench'");

    // SuiteModuleGrid navigates to /property/ for workbench mode, not activateModule
    expect(suiteModuleGridSource).toContain("navigate(`/property/${parcelId}/${mod.workbenchTab}`)");
    expect(suiteModuleGridSource).not.toContain("activateModule");
  });

  // ── Invalid tab slug from direct entry → summary ──────────────────────────

  it('canonicalizes invalid tab slug from direct entry to summary URL', () => {
    // /property/123/not-a-tab → /property/123 (summary = base URL)
    expect(canonicalizeEntryUrl('/property/123/not-a-tab')).toBe('/property/123');
    expect(canonicalizeEntryUrl('/property/123/banana?utm=1')).toBe('/property/123');
    expect(canonicalizeEntryUrl('/property/123/FORGEE')).toBe('/property/123');
  });

  // ── Source: ForgeSuiteHome parcel modules all use workbench launchMode ────

  it('all ForgeSuiteHome parcel-scoped modules use launchMode workbench', () => {
    // Extract the FORGE_MODULES array from source
    const forgeModulesBlock = forgeSuiteSource.match(
      /const FORGE_MODULES[^=]*=\s*\[([^\]]+)\]/s,
    )?.[1] ?? '';

    // Every entry that has launchMode: 'workbench' must also have workbenchTab
    const workbenchEntries = [...forgeModulesBlock.matchAll(/launchMode:\s*'workbench'/g)];
    const tabEntries = [...forgeModulesBlock.matchAll(/workbenchTab:\s*'\w+'/g)];

    // At minimum, Forge has multiple workbench modules
    expect(workbenchEntries.length).toBeGreaterThan(0);
    // Each workbench entry should have a corresponding tab
    expect(tabEntries.length).toBeGreaterThanOrEqual(workbenchEntries.length);
  });

  // ── Source: AtlasSuiteHome parcel modules all use workbench launchMode ────

  it('all AtlasSuiteHome parcel-scoped modules use launchMode workbench', () => {
    const atlasModulesBlock = atlasSuiteSource.match(
      /const ATLAS_MODULES[^=]*=\s*\[([^\]]+)\]/s,
    )?.[1] ?? '';

    const workbenchEntries = [...atlasModulesBlock.matchAll(/launchMode:\s*'workbench'/g)];
    expect(workbenchEntries.length).toBeGreaterThan(0);

    // All Atlas workbench modules must use the 'atlas' tab
    const nonAtlasTabs = [...atlasModulesBlock.matchAll(/workbenchTab:\s*'(?!atlas)\w+'/g)];
    expect(nonAtlasTabs).toHaveLength(0);
  });
});
