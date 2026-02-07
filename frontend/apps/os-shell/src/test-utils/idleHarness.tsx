/**
 * TerraFusion OS - Idle Harness for Stability Testing
 *
 * Provides a minimal Desktop route mount utility with timer/RAF spy hooks.
 * Used by idle stability tests to detect unwanted background activity.
 *
 * @module test-utils/idleHarness
 * @see Phase A TDD - UI Stabilization
 */

import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { Desktop } from '../shell/desktop/Desktop';

export interface IdleHarnessResult extends RenderResult {
  spies: {
    setInterval: jest.SpyInstance;
    clearInterval: jest.SpyInstance;
    requestAnimationFrame: jest.SpyInstance;
    cancelAnimationFrame: jest.SpyInstance;
  };
  capturedIntervalIds: ReturnType<typeof setInterval>[];
  capturedRafIds: number[];
  advanceTime: (ms: number) => void;
  cleanup: () => void;
}

/**
 * Renders the Desktop route in isolation with timer/RAF spying.
 * Uses non-breaking spies that observe but don't alter timer behavior.
 * Call cleanup() after each test to restore original implementations.
 */
export function renderDesktopRoute(): IdleHarnessResult {
  // Capture all interval and RAF IDs for later analysis
  const capturedIntervalIds: ReturnType<typeof setInterval>[] = [];
  const capturedRafIds: number[] = [];

  // Use non-breaking spies - observe but don't mock
  const setIntervalSpy = jest.spyOn(global, 'setInterval');
  const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
  const rafSpy = jest.spyOn(global, 'requestAnimationFrame');
  const cafSpy = jest.spyOn(global, 'cancelAnimationFrame');

  // Track interval IDs via the spy's mock results
  const originalSetInterval = global.setInterval;
  setIntervalSpy.mockImplementation((...args: Parameters<typeof setInterval>) => {
    const id = originalSetInterval(...args);
    capturedIntervalIds.push(id);
    return id;
  });

  // Track RAF IDs
  const originalRaf = global.requestAnimationFrame;
  rafSpy.mockImplementation((callback: FrameRequestCallback) => {
    const id = originalRaf(callback);
    capturedRafIds.push(id);
    return id;
  });

  // Render Desktop route
  const renderResult = render(
    <MemoryRouter initialEntries={['/desktop']}>
      <Routes>
        <Route path='/desktop' element={<Desktop />} />
      </Routes>
    </MemoryRouter>
  );

  // Helper to advance jest timers
  const advanceTime = (ms: number) => {
    jest.advanceTimersByTime(ms);
  };

  // Cleanup function to restore spies
  const cleanup = () => {
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
    rafSpy.mockRestore();
    cafSpy.mockRestore();
    // Note: Don't clear intervals here as Jest fake timers handle cleanup
  };

  return {
    ...renderResult,
    spies: {
      setInterval: setIntervalSpy,
      clearInterval: clearIntervalSpy,
      requestAnimationFrame: rafSpy,
      cancelAnimationFrame: cafSpy,
    },
    capturedIntervalIds,
    capturedRafIds,
    advanceTime,
    cleanup,
  };
}

/**
 * Waits for all pending state updates and DOM mutations to settle.
 * Used to ensure the component has reached its "idle" state.
 */
export async function waitForIdle(): Promise<void> {
  // Flush any pending microtasks
  await new Promise((resolve) => setTimeout(resolve, 0));
  // Flush any pending RAF callbacks
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
}

/**
 * Captures CSS computed styles for stability comparison.
 */
export function captureStyles(element: HTMLElement): Record<string, string> {
  const computed = getComputedStyle(element);
  return {
    opacity: computed.opacity,
    filter: computed.filter,
    transform: computed.transform,
    backgroundColor: computed.backgroundColor,
  };
}

/**
 * Compares two style snapshots for equality.
 */
export function stylesAreEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  return Object.keys(a).every((key) => a[key] === b[key]);
}
