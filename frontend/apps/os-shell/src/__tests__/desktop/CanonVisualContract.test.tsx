/**
 * P20 Canon Visual Contract — DOM regression tests.
 *
 * Contract 1: Canon root uses `canon-shell` class and contains exactly 3
 *             primary regions: header, devCockpit, suiteLauncher
 * Contract 2: No `.animate-pulse` exists on Canon in dev preview
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../components/standalone', () => ({
  StandaloneHomeShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../canon/CanonModuleHost', () => ({
  CanonModuleHost: () => <div data-testid='canon-module-host-stub' />,
}));

vi.mock('../../canon/useCanonLayout', () => ({
  useCanonLayout: () => [
    { leftPaneWidth: 250, rightPaneWidth: 750, inspectorOpen: false },
    vi.fn(),
  ],
}));

vi.mock('../../canon/invokeWithPreflight', () => ({
  invokeWithPreflight: vi.fn(),
}));

vi.mock('../../api/canonDoctor', () => ({ runCanonDoctor: vi.fn() }));
vi.mock('../../api/canonGateFast', () => ({ runCanonGateFast: vi.fn() }));
vi.mock('../../api/canonPing', () => ({ runCanonPing: vi.fn() }));

vi.mock('../../canon/useCanonConnection', () => ({
  useCanonConnection: () => ({ status: 'disconnected', lastPingMs: null }),
}));

vi.mock('../../canon/CanonNotification', () => ({
  CanonNotificationHost: () => null,
  useCanonNotifications: () => ({
    notifications: [],
    addNotification: vi.fn(),
    dismissNotification: vi.fn(),
  }),
}));

import CanonHome from '../../pages/CanonHome';

describe('P20 Canon Visual Contract', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('canon root has canon-shell class, 3 regions, and no animate-pulse elements', () => {
    render(<CanonHome />);

    // Contract 1: Root element uses canon-shell class
    const root = screen.getByTestId('terracanon-root');
    expect(root.classList.contains('canon-shell')).toBe(true);

    // Three primary regions exist
    const header = screen.getByTestId('canon-header');
    expect(header).toBeInTheDocument();
    expect(header.tagName.toLowerCase()).toBe('header');

    const devCockpit = screen.getByTestId('canon-devCockpit');
    expect(devCockpit).toBeInTheDocument();
    expect(devCockpit.tagName.toLowerCase()).toBe('section');

    const suiteLauncher = screen.getByTestId('canon-suiteLauncher');
    expect(suiteLauncher).toBeInTheDocument();

    // All three are children (direct or nested) of the root
    expect(root.contains(header)).toBe(true);
    expect(root.contains(devCockpit)).toBe(true);
    expect(root.contains(suiteLauncher)).toBe(true);

    // Contract 2: No animate-pulse elements inside Canon
    const pulseElements = root.querySelectorAll(
      '.animate-pulse, .animate-pulse-slow, .animate-pulse-glow, [class*="animate-pulse"]'
    );
    expect(pulseElements.length).toBe(0);
  });
});
