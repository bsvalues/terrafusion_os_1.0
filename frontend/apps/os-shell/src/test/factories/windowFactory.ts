/**
 * TerraFusion OS - Window Test Factory
 *
 * Provides complete window objects for tests, preventing "undefined property" errors
 * from incomplete mock data.
 *
 * @module test/factories/windowFactory
 */

export interface TestWindow {
  id: string;
  title: string;
  icon: string;
  moduleId: string;
  desktopId: string;
  zIndex: number;
  state: 'normal' | 'minimized' | 'maximized';
  position: { x: number; y: number };
  size: { width: number; height: number };
  previousPosition?: { x: number; y: number };
  previousSize?: { width: number; height: number };
  snapZone?: 'left' | 'right' | 'top' | 'center' | null;
}

/**
 * Creates a complete window object with all required fields for tests
 *
 * @param overrides - Partial window properties to override defaults
 * @returns Complete window object safe for all UI components
 *
 * @example
 * ```ts
 * const win = makeWindow({ id: 'win-2', zIndex: 20 });
 * const minimized = makeWindow({ id: 'win-3', state: 'minimized' });
 * const desktop2 = makeWindow({ desktopId: 'desktop-2' });
 * ```
 */
export function makeWindow(overrides: Partial<TestWindow> = {}): TestWindow {
  return {
    id: 'win-1',
    title: 'CostForge',
    icon: '💎',
    moduleId: 'costforge',
    desktopId: 'desktop-1',
    zIndex: 10,
    state: 'normal',
    position: { x: 100, y: 100 },
    size: { width: 800, height: 600 },
    ...overrides,
  };
}

/**
 * Creates multiple windows with sequential IDs
 *
 * @param count - Number of windows to create
 * @param baseOverrides - Base overrides applied to all windows
 * @returns Array of complete window objects
 *
 * @example
 * ```ts
 * const windows = makeWindows(3); // win-1, win-2, win-3
 * const desktop2Windows = makeWindows(2, { desktopId: 'desktop-2' });
 * ```
 */
export function makeWindows(count: number, baseOverrides: Partial<TestWindow> = {}): TestWindow[] {
  return Array.from({ length: count }, (_, i) =>
    makeWindow({
      id: `win-${i + 1}`,
      zIndex: 100 - i * 10, // Descending zIndex
      title: `Window ${i + 1}`,
      ...baseOverrides,
    })
  );
}
