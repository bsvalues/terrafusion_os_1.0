/**
 * TerraFusion OS Desktop Store - Snap Extensions Tests
 * 
 * Tests for window snapping functionality:
 * - Snap zones (left, right, corners)
 * - Snap state management
 * - Restore from snap
 * 
 * @module stores/__tests__/desktopStore.snap.test
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

import { useDesktopStore, type SnapZone } from '../desktopStore';

// Mock viewport dimensions
const VIEWPORT = { width: 1920, height: 1080 };
const TASKBAR_HEIGHT = 48;
const USABLE_HEIGHT = VIEWPORT.height - TASKBAR_HEIGHT;

// Reset store before each test
beforeEach(() => {
  useDesktopStore.setState({
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
    snapPreview: null,
  });
});

describe('Snap Store Extensions', () => {
  describe('SnapZone Detection', () => {
    it('detects LEFT snap zone when x < 20', () => {
      const zone = useDesktopStore.getState().detectSnapZone(
        { x: 10, y: 300 },
        VIEWPORT.width,
        VIEWPORT.height
      );
      expect(zone).toBe('left');
    });

    it('detects RIGHT snap zone when x > viewport - 20', () => {
      const zone = useDesktopStore.getState().detectSnapZone(
        { x: VIEWPORT.width - 10, y: 300 },
        VIEWPORT.width,
        VIEWPORT.height
      );
      expect(zone).toBe('right');
    });

    it('detects TOP snap zone (maximize) when y < 20', () => {
      const zone = useDesktopStore.getState().detectSnapZone(
        { x: 500, y: 5 },
        VIEWPORT.width,
        VIEWPORT.height
      );
      expect(zone).toBe('top');
    });

    it('detects TOP-LEFT corner snap zone', () => {
      const zone = useDesktopStore.getState().detectSnapZone(
        { x: 10, y: 10 },
        VIEWPORT.width,
        VIEWPORT.height
      );
      expect(zone).toBe('top-left');
    });

    it('detects TOP-RIGHT corner snap zone', () => {
      const zone = useDesktopStore.getState().detectSnapZone(
        { x: VIEWPORT.width - 10, y: 10 },
        VIEWPORT.width,
        VIEWPORT.height
      );
      expect(zone).toBe('top-right');
    });

    it('detects BOTTOM-LEFT corner snap zone', () => {
      const zone = useDesktopStore.getState().detectSnapZone(
        { x: 10, y: USABLE_HEIGHT - 10 },
        VIEWPORT.width,
        VIEWPORT.height
      );
      expect(zone).toBe('bottom-left');
    });

    it('detects BOTTOM-RIGHT corner snap zone', () => {
      const zone = useDesktopStore.getState().detectSnapZone(
        { x: VIEWPORT.width - 10, y: USABLE_HEIGHT - 10 },
        VIEWPORT.width,
        VIEWPORT.height
      );
      expect(zone).toBe('bottom-right');
    });

    it('returns null when not in any snap zone', () => {
      const zone = useDesktopStore.getState().detectSnapZone(
        { x: 500, y: 300 },
        VIEWPORT.width,
        VIEWPORT.height
      );
      expect(zone).toBeNull();
    });
  });

  describe('Snap Preview State', () => {
    it('setSnapPreview sets preview zone and bounds', () => {
      act(() => {
        useDesktopStore.getState().setSnapPreview('left', VIEWPORT.width, VIEWPORT.height);
      });

      const { snapPreview } = useDesktopStore.getState();
      expect(snapPreview).not.toBeNull();
      expect(snapPreview?.zone).toBe('left');
      expect(snapPreview?.bounds).toEqual({
        x: 0,
        y: 0,
        width: VIEWPORT.width / 2,
        height: USABLE_HEIGHT,
      });
    });

    it('setSnapPreview calculates RIGHT bounds correctly', () => {
      act(() => {
        useDesktopStore.getState().setSnapPreview('right', VIEWPORT.width, VIEWPORT.height);
      });

      const { snapPreview } = useDesktopStore.getState();
      expect(snapPreview?.bounds).toEqual({
        x: VIEWPORT.width / 2,
        y: 0,
        width: VIEWPORT.width / 2,
        height: USABLE_HEIGHT,
      });
    });

    it('setSnapPreview calculates TOP (maximize) bounds correctly', () => {
      act(() => {
        useDesktopStore.getState().setSnapPreview('top', VIEWPORT.width, VIEWPORT.height);
      });

      const { snapPreview } = useDesktopStore.getState();
      expect(snapPreview?.bounds).toEqual({
        x: 0,
        y: 0,
        width: VIEWPORT.width,
        height: USABLE_HEIGHT,
      });
    });

    it('setSnapPreview calculates TOP-LEFT quarter bounds', () => {
      act(() => {
        useDesktopStore.getState().setSnapPreview('top-left', VIEWPORT.width, VIEWPORT.height);
      });

      const { snapPreview } = useDesktopStore.getState();
      expect(snapPreview?.bounds).toEqual({
        x: 0,
        y: 0,
        width: VIEWPORT.width / 2,
        height: USABLE_HEIGHT / 2,
      });
    });

    it('setSnapPreview calculates BOTTOM-RIGHT quarter bounds', () => {
      act(() => {
        useDesktopStore.getState().setSnapPreview('bottom-right', VIEWPORT.width, VIEWPORT.height);
      });

      const { snapPreview } = useDesktopStore.getState();
      expect(snapPreview?.bounds).toEqual({
        x: VIEWPORT.width / 2,
        y: USABLE_HEIGHT / 2,
        width: VIEWPORT.width / 2,
        height: USABLE_HEIGHT / 2,
      });
    });

    it('clearSnapPreview removes preview', () => {
      act(() => {
        useDesktopStore.getState().setSnapPreview('left', VIEWPORT.width, VIEWPORT.height);
      });
      expect(useDesktopStore.getState().snapPreview).not.toBeNull();

      act(() => {
        useDesktopStore.getState().clearSnapPreview();
      });
      expect(useDesktopStore.getState().snapPreview).toBeNull();
    });
  });

  describe('snapWindow Action', () => {
    beforeEach(() => {
      // Create a window to snap
      act(() => {
        useDesktopStore.getState().openWindow('test-module', 'Test Window', '📄');
      });
    });

    it('snapWindow LEFT positions window at left half', () => {
      const windowId = useDesktopStore.getState().windows[0].id;
      
      act(() => {
        useDesktopStore.getState().snapWindow(windowId, 'left', VIEWPORT.width, VIEWPORT.height);
      });

      const window = useDesktopStore.getState().windows[0];
      expect(window.position).toEqual({ x: 0, y: 0 });
      expect(window.size).toEqual({ width: VIEWPORT.width / 2, height: USABLE_HEIGHT });
      expect(window.state).toBe('snapped');
      expect(window.snapZone).toBe('left');
    });

    it('snapWindow RIGHT positions window at right half', () => {
      const windowId = useDesktopStore.getState().windows[0].id;
      
      act(() => {
        useDesktopStore.getState().snapWindow(windowId, 'right', VIEWPORT.width, VIEWPORT.height);
      });

      const window = useDesktopStore.getState().windows[0];
      expect(window.position).toEqual({ x: VIEWPORT.width / 2, y: 0 });
      expect(window.size).toEqual({ width: VIEWPORT.width / 2, height: USABLE_HEIGHT });
      expect(window.snapZone).toBe('right');
    });

    it('snapWindow TOP maximizes window', () => {
      const windowId = useDesktopStore.getState().windows[0].id;
      
      act(() => {
        useDesktopStore.getState().snapWindow(windowId, 'top', VIEWPORT.width, VIEWPORT.height);
      });

      const window = useDesktopStore.getState().windows[0];
      expect(window.state).toBe('maximized');
    });

    it('snapWindow saves previous position and size', () => {
      const windowId = useDesktopStore.getState().windows[0].id;
      const originalWindow = useDesktopStore.getState().windows[0];
      const originalPos = { ...originalWindow.position };
      const originalSize = { ...originalWindow.size };
      
      act(() => {
        useDesktopStore.getState().snapWindow(windowId, 'left', VIEWPORT.width, VIEWPORT.height);
      });

      const window = useDesktopStore.getState().windows[0];
      expect(window.previousPosition).toEqual(originalPos);
      expect(window.previousSize).toEqual(originalSize);
    });

    it('snapWindow to quarter positions correctly', () => {
      const windowId = useDesktopStore.getState().windows[0].id;
      
      act(() => {
        useDesktopStore.getState().snapWindow(windowId, 'bottom-right', VIEWPORT.width, VIEWPORT.height);
      });

      const window = useDesktopStore.getState().windows[0];
      expect(window.position).toEqual({ x: VIEWPORT.width / 2, y: USABLE_HEIGHT / 2 });
      expect(window.size).toEqual({ width: VIEWPORT.width / 2, height: USABLE_HEIGHT / 2 });
    });

    it('snapWindow clears snap preview', () => {
      const windowId = useDesktopStore.getState().windows[0].id;
      
      act(() => {
        useDesktopStore.getState().setSnapPreview('left', VIEWPORT.width, VIEWPORT.height);
      });
      expect(useDesktopStore.getState().snapPreview).not.toBeNull();
      
      act(() => {
        useDesktopStore.getState().snapWindow(windowId, 'left', VIEWPORT.width, VIEWPORT.height);
      });
      expect(useDesktopStore.getState().snapPreview).toBeNull();
    });
  });

  describe('unsnap / restoreWindow from snap', () => {
    beforeEach(() => {
      act(() => {
        useDesktopStore.getState().openWindow('test-module', 'Test Window', '📄');
      });
    });

    it('restoreWindow from snapped state restores previous position/size', () => {
      const windowId = useDesktopStore.getState().windows[0].id;
      const originalWindow = useDesktopStore.getState().windows[0];
      const originalPos = { ...originalWindow.position };
      const originalSize = { ...originalWindow.size };
      
      // Snap then restore
      act(() => {
        useDesktopStore.getState().snapWindow(windowId, 'left', VIEWPORT.width, VIEWPORT.height);
      });
      
      act(() => {
        useDesktopStore.getState().restoreWindow(windowId);
      });

      const window = useDesktopStore.getState().windows[0];
      expect(window.state).toBe('normal');
      expect(window.position).toEqual(originalPos);
      expect(window.size).toEqual(originalSize);
      expect(window.snapZone).toBeUndefined();
    });
  });

  describe('Snap with Keyboard', () => {
    beforeEach(() => {
      act(() => {
        useDesktopStore.getState().openWindow('test-module', 'Test Window', '📄');
      });
    });

    it('snapActiveWindowLeft snaps the active window left', () => {
      act(() => {
        useDesktopStore.getState().snapActiveWindowLeft(VIEWPORT.width, VIEWPORT.height);
      });

      const window = useDesktopStore.getState().windows[0];
      expect(window.snapZone).toBe('left');
    });

    it('snapActiveWindowRight snaps the active window right', () => {
      act(() => {
        useDesktopStore.getState().snapActiveWindowRight(VIEWPORT.width, VIEWPORT.height);
      });

      const window = useDesktopStore.getState().windows[0];
      expect(window.snapZone).toBe('right');
    });

    it('does nothing if no active window', () => {
      // Close all windows
      const windowId = useDesktopStore.getState().windows[0].id;
      act(() => {
        useDesktopStore.getState().closeWindow(windowId);
      });

      // This should not throw
      expect(() => {
        act(() => {
          useDesktopStore.getState().snapActiveWindowLeft(VIEWPORT.width, VIEWPORT.height);
        });
      }).not.toThrow();
    });
  });
});
