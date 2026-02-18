/**
 * Phase 50 / 50.1: Canon Layout Persistence
 *
 * Thin wrapper around core-lane layoutEnvelope.mjs for UI consumption.
 * Provides load/save with fail-closed semantics (malformed -> clear + default).
 *
 * Phase 50.1: Rewired to import from canonical core-lane contract.
 * No local envelope implementation -- uses os-platform/core/canon/layoutEnvelope.mjs.
 *
 * @module canon/layoutPersistence
 * @see Phase 50: TerraCanon Module Host + Layout Persistence
 * @see Phase 50.1: Convergence Patch
 */

// @ts-ignore -- .mjs ESM module, no TS declarations
import {
  defaultLayoutV1,
  parseLayoutEnvelopeV1,
  serializeLayoutEnvelopeV1,
} from '../../../../../os-platform/core/canon/layoutEnvelope.mjs';

export const CANON_LAYOUT_STORAGE_KEY = 'terrafusion.canon.layout.v1';

export interface PanelConfig {
  visible: boolean;
  size: number;
}

export interface LayoutV1 {
  panels: {
    leftNav: PanelConfig;
    main: PanelConfig;
    rightInspector: PanelConfig;
  };
}

export type PanelId = 'leftNav' | 'main' | 'rightInspector';

export function defaultCanonLayoutV1(): LayoutV1 {
  return defaultLayoutV1();
}

export function loadCanonLayout(storage: Storage = localStorage): LayoutV1 {
  const raw = storage.getItem(CANON_LAYOUT_STORAGE_KEY);
  if (!raw) return defaultLayoutV1();
  const env = parseLayoutEnvelopeV1(raw);
  if (!env) {
    storage.removeItem(CANON_LAYOUT_STORAGE_KEY);
    return defaultLayoutV1();
  }
  return env.layout;
}

export function saveCanonLayout(layout: LayoutV1, storage: Storage = localStorage): void {
  storage.setItem(CANON_LAYOUT_STORAGE_KEY, serializeLayoutEnvelopeV1(layout));
}
