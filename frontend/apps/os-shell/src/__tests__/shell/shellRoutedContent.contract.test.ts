/**
 * Phase 31 — Shell Routed-Content Container Contract
 *
 * Static analysis contract proving the Desktop "persistent chrome" is correctly
 * structured so that non-home routes render inside a stable, scrollable container.
 *
 * Enforces:
 *   1. Desktop.tsx has exactly one `shell-routed-content` testid (unique anchor)
 *   2. The container uses `overflow-auto` (pages can scroll without body scroll)
 *   3. The container uses absolute positioning with taskbar offsets (top-12 bottom-12)
 *   4. `shell-routed-content` is in the isHome ELSE branch (home stays clean)
 *   5. `isHome` is derived from `pathname === '/'` (canonical home detection)
 *   6. Desktop wraps routed content with `<Outlet />` (React Router contract)
 *   7. Router declares all five OS suite routes
 *   8. Router declares the `/property` PropertySearch entry route
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../..');

function readSrc(rel: string): string {
  return fs.readFileSync(path.join(SRC, rel), 'utf-8');
}

describe('Phase 31: Shell Routed-Content Container Contract', () => {
  describe('Desktop.tsx — container structure', () => {
    const desktop = readSrc('shell/desktop/Desktop.tsx');

    it('has exactly one shell-routed-content testid', () => {
      const occurrences = (desktop.match(/shell-routed-content/g) ?? []).length;
      expect(occurrences).toBe(1);
    });

    it('shell-routed-content container uses overflow-auto for page scrolling', () => {
      // The container must allow inner pages to scroll without body scroll
      expect(desktop).toContain('overflow-auto');
    });

    it('shell-routed-content container has taskbar-aware positioning (top-12 bottom-12)', () => {
      // top-12 = above taskbar, bottom-12 = above taskbar — leaves shell chrome visible
      expect(desktop).toMatch(/top-12/);
      expect(desktop).toMatch(/bottom-12/);
    });

    it('shell-routed-content is in the isHome else branch (home route stays clean)', () => {
      // The testid must appear AFTER the isHome conditional, not before or outside it
      const homeIdx = desktop.indexOf('isHome ?');
      const containerIdx = desktop.indexOf('shell-routed-content');
      expect(homeIdx).toBeGreaterThan(-1);
      expect(containerIdx).toBeGreaterThan(homeIdx);
    });

    it('isHome is derived from pathname === "/" (canonical home check)', () => {
      expect(desktop).toContain("pathname === '/'");
    });

    it('Desktop renders <Outlet /> for nested route content', () => {
      // React Router contract: routed content arrives via Outlet
      expect(desktop).toMatch(/<Outlet\s*\/?>/);
    });
  });

  describe('Router.tsx — OS suite route declarations', () => {
    const router = readSrc('Router.tsx');

    it.each(['/forge', '/atlas', '/dais', '/dossier', '/gpt'])(
      'declares OS suite route "%s"',
      (route) => {
        const segment = route.replace('/', '');
        // Router must declare the path segment as a Route path
        expect(router).toMatch(new RegExp(`path=['"]${segment}['"]`));
      }
    );

    it('declares /property PropertySearch entry route', () => {
      expect(router).toMatch(/path=['"]property['"]/);
    });
  });
});
