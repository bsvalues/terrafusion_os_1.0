/**
 * Window Object Factory for Tests
 *
 * Provides a standardized way to create DesktopWindow objects for unit and integration tests.
 * Ensures all required properties are present with sensible defaults.
 *
 * @module test/windowFactory
 */

import { DesktopWindow, WindowState } from '../stores/desktopStore';

/**
 * Creates a mock window object for testing
 * @param overrides Partial window properties to override defaults
 * @returns Complete DesktopWindow object
 */
export const createMockWindow = (overrides?: Partial<DesktopWindow>): DesktopWindow => {
  return {
    id: `window-${Math.random().toString(36).substring(2, 9)}`,
    moduleId: 'test-module',
    title: 'Test Window',
    icon: '🧪',
    desktopId: 'desktop-1',
    position: { x: 100, y: 100 },
    size: { width: 800, height: 600 },
    state: 'normal' as WindowState,
    zIndex: 1,
    ...overrides,
  };
};

/**
 * Creates an array of mock windows
 * @param count Number of windows to create
 * @param overrides Common overrides for all windows
 * @returns Array of DesktopWindow objects
 */
export const createMockWindows = (
  count: number,
  overrides?: Partial<DesktopWindow>
): DesktopWindow[] => {
  return Array.from({ length: count }).map((_, index) =>
    createMockWindow({
      id: `window-${index + 1}`,
      title: `Window ${index + 1}`,
      zIndex: index + 1,
      ...overrides,
    })
  );
};
