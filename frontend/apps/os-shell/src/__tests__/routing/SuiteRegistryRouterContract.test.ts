/**
 * Phase 23 — Suite Registry ↔ Router Contract
 *
 * Mechanical enforcement: every desktop icon route must be navigable
 * by React Router. This prevents silent drift where the manifest
 * claims a route that the router doesn't recognize.
 *
 * Strategy:
 * - Parse Router.tsx source to extract all <Route path="..."> declarations
 * - Build a tree of absolute route paths (resolving nested routes)
 * - For each desktop icon route, verify it matches a router path pattern
 *
 * @module __tests__/routing/SuiteRegistryRouterContract.test
 */

import fs from 'fs';
import path from 'path';
import { getDesktopIcons } from '../../config/desktopManifest';

const FRONTEND_SRC = path.resolve(__dirname, '../..');
const ROUTER_FILE = path.join(FRONTEND_SRC, 'Router.tsx');

// Routes intentionally not handled by React Router (external URLs, etc.)
const ALLOWLIST = new Set<string>([
  // Add external/disabled routes here with a comment explaining why.
]);

/**
 * Extract route path declarations from Router.tsx source.
 * Returns both top-level and nested (fully resolved) paths.
 *
 * Handles:
 * - <Route path='/foo' ...>         → /foo
 * - <Route path='bar' ...>          → (relative child)
 * - <Route path='/parent/:param'>   → parameterized parent
 *   <Route path='child' />          → /parent/:param/child
 *
 * Strategy: track indent-based nesting with a parent stack.
 * When a Route with children (not self-closing) is found, push it.
 * When indent decreases or </Route> is seen, pop appropriately.
 */
function extractRoutePaths(source: string): Set<string> {
  const paths = new Set<string>();
  const lines = source.split('\n');

  // Stack: { path, indent } pairs for parent routes
  const parentStack: Array<{ path: string; indent: number }> = [];

  for (const line of lines) {
    const indent = line.search(/\S/);
    if (indent < 0) continue; // blank line
    const trimmed = line.trimStart();

    // Pop parents whose indent is >= current indent (scope closed)
    // This handles both </Route> and sibling routes at same level
    while (parentStack.length > 0 && indent <= parentStack[parentStack.length - 1].indent) {
      parentStack.pop();
    }

    // Check for closing </Route> tags (explicit scope end)
    if (trimmed.startsWith('</Route')) {
      if (parentStack.length > 0) parentStack.pop();
      continue;
    }

    // Match <Route path="..." ...> or <Route path='...' ...>
    const match = /<Route\b[^>]*\bpath\s*=\s*['"]([^'"]+)['"]/.exec(trimmed);
    if (!match) continue;

    const rawPath = match[1];
    let absolutePath: string;

    if (rawPath.startsWith('/')) {
      absolutePath = rawPath;
    } else {
      // Resolve relative path against nearest parent
      const parent = parentStack.length > 0 ? parentStack[parentStack.length - 1].path : '';
      absolutePath = parent ? `${parent}/${rawPath}` : `/${rawPath}`;
    }

    paths.add(absolutePath);

    // If this Route has children (not self-closing), push as parent.
    // A self-closing Route ends with "/>" as the LAST tag close on the line.
    // We must NOT confuse inner component self-closes (e.g., element={<Foo />}>).
    // Strategy: check if the line ends with "/>" (Route self-closes) vs ">" (has children).
    const lineEndTrimmed = trimmed.replace(/\s+$/g, '');
    const isSelfClosing = lineEndTrimmed.endsWith('/>');
    if (!isSelfClosing) {
      parentStack.push({ path: absolutePath, indent });
    }
  }

  return paths;
}

/**
 * Check if a concrete route (e.g. /property/1234567890/forge) matches
 * a router pattern (e.g. /property/:parcelId/forge).
 *
 * Supports :param segments as wildcards and trailing /* splats.
 */
function routeMatches(concreteRoute: string, pattern: string): boolean {
  // Handle splat routes
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);
    const prefixSegments = prefix.split('/').filter(Boolean);
    const concreteSegments = concreteRoute.split('/').filter(Boolean);

    if (concreteSegments.length < prefixSegments.length) return false;

    return prefixSegments.every((seg, i) => {
      if (seg.startsWith(':')) return true;
      return seg === concreteSegments[i];
    });
  }

  const patternSegments = pattern.split('/').filter(Boolean);
  const concreteSegments = concreteRoute.split('/').filter(Boolean);

  if (patternSegments.length !== concreteSegments.length) return false;

  return patternSegments.every((seg, i) => {
    if (seg.startsWith(':')) return true; // param segment matches anything
    return seg === concreteSegments[i];
  });
}

describe('Phase 23 contract: desktop manifest routes ⊆ Router route table', () => {
  const icons = getDesktopIcons();
  const routerSource = fs.readFileSync(ROUTER_FILE, 'utf8');
  const routerPaths = extractRoutePaths(routerSource);

  it('desktop manifest has icons', () => {
    expect(icons.length).toBeGreaterThan(0);
  });

  it('router has route declarations', () => {
    expect(routerPaths.size).toBeGreaterThan(0);
  });

  it('every desktop icon route is navigable in Router', () => {
    const missing: string[] = [];

    for (const icon of icons) {
      const route = icon.route;
      if (!route || typeof route !== 'string') continue;

      // Skip external URLs
      if (route.startsWith('http://') || route.startsWith('https://')) continue;

      // Skip allowlisted routes
      if (ALLOWLIST.has(route)) continue;

      // Check if any router pattern matches this concrete route
      const matched = Array.from(routerPaths).some((pattern) => routeMatches(route, pattern));

      if (!matched) {
        missing.push(`${icon.id}: ${route}`);
      }
    }

    if (missing.length > 0) {
      throw new Error(
        'Desktop manifest routes NOT navigable in Router.tsx:\n' +
          missing.map((m) => `  - ${m}`).join('\n') +
          '\n\nFix: add <Route path="..."> in Router.tsx, or correct the route in desktopManifest/suiteRegistry, ' +
          'or add to ALLOWLIST if intentionally external.'
      );
    }
  });

  it.each(icons)('route for $name ($id) matches a router pattern', (icon) => {
    const route = icon.route;
    if (!route || route.startsWith('http')) return;
    if (ALLOWLIST.has(route)) return;

    const matched = Array.from(routerPaths).some((pattern) => routeMatches(route, pattern));
    expect(matched).toBe(true);
  });
});
