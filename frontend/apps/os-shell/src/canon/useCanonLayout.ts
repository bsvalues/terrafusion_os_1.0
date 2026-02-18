/**
 * Phase 50 / 50.1: Canon Layout Hook
 *
 * React hook for loading, mutating, and persisting TerraCanon layout.
 * Layout is saved to localStorage via LayoutEnvelope v1 on every mutation.
 *
 * Phase 50.1: Object API { layout, setLayout, setPanelVisible } (not tuple).
 *
 * @module canon/useCanonLayout
 * @see Phase 50: TerraCanon Module Host + Layout Persistence
 * @see Phase 50.1: Convergence Patch
 */

import { useCallback, useMemo, useState } from 'react';
import {
  loadCanonLayout,
  saveCanonLayout,
  type LayoutV1,
  type PanelId,
} from './layoutPersistence';

export function useCanonLayout() {
  const [layout, setLayoutState] = useState<LayoutV1>(() => loadCanonLayout());

  const setLayout = useCallback((next: LayoutV1) => {
    setLayoutState(next);
    saveCanonLayout(next);
  }, []);

  const setPanelVisible = useCallback(
    (panel: PanelId, visible: boolean) => {
      setLayoutState((prev) => {
        const next: LayoutV1 = {
          ...prev,
          panels: {
            ...prev.panels,
            [panel]: { ...prev.panels[panel], visible },
          },
        };
        saveCanonLayout(next);
        return next;
      });
    },
    []
  );

  return useMemo(
    () => ({ layout, setLayout, setPanelVisible }),
    [layout, setLayout, setPanelVisible]
  );
}
