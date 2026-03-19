/**
 * Wave 3 — Parcel Routing Contract
 *
 * Proves that parcel-scoped modules (forge, atlas, dais) are classified
 * as 'parcel-scoped-app' hosted on 'tier0-workbench', not as standalone
 * suite-workspace apps. This enforces correct drill-through routing:
 * parcel context opens the Property Workbench, not a new suite window.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { MODULE_OBJECT_TYPES } from '../../contracts/objectPlacement';

describe('Wave 3 — Parcel Routing Contract', () => {
  it('forge (parcel-scoped) is hosted on tier0-workbench, not standalone', () => {
    const entry = MODULE_OBJECT_TYPES['forge'];
    expect(entry).toBeDefined();
    expect(entry.objectType).toBe('parcel-scoped-app');
    expect(entry.hostSurface).toBe('tier0-workbench');
  });

  it('atlas (parcel-scoped) is hosted on tier0-workbench, not standalone', () => {
    const entry = MODULE_OBJECT_TYPES['atlas'];
    expect(entry).toBeDefined();
    expect(entry.objectType).toBe('parcel-scoped-app');
    expect(entry.hostSurface).toBe('tier0-workbench');
  });

  it('dais (parcel-scoped) is hosted on tier0-workbench, not standalone', () => {
    const entry = MODULE_OBJECT_TYPES['dais'];
    expect(entry).toBeDefined();
    expect(entry.objectType).toBe('parcel-scoped-app');
    expect(entry.hostSurface).toBe('tier0-workbench');
  });
});
