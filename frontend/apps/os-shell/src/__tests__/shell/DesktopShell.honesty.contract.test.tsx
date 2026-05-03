/**
 * Desktop shell honesty contract
 * Ensures the governed desktop shell does not project a fake module catalog
 * or fake health posture when the live registry/runtime is unavailable.
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

const useModulesMock = vi.fn();
const useSystemHealthMock = vi.fn();

vi.mock('../../hooks/useModules', () => ({
  useModules: () => useModulesMock(),
}));

vi.mock('../../hooks/useSystemHealth', () => ({
  useSystemHealth: () => useSystemHealthMock(),
}));

vi.mock('../../shell/SystemTray', () => ({
  SystemTray: () => <div data-testid="system-tray" />,
}));

vi.mock('../../shell/WindowManager', () => ({
  WindowManager: () => <div data-testid="window-manager" />,
}));

import { DesktopShell } from '../../shell/DesktopShell';
import { ModuleLauncher } from '../../shell/ModuleLauncher';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Desktop shell static honesty contract', () => {
  it('moduleAPI does not retain hardcoded fallback catalogs', () => {
    const src = readSrc('services/moduleAPI.ts');
    expect(src).not.toContain('const realModules =');
    expect(src).not.toContain('Backend not available, using real Terrafusion module data');
    expect(src).toContain('Governed module registry unavailable.');
  });

  it('DesktopShell removes fake scale and security claims', () => {
    const src = readSrc('shell/DesktopShell.tsx');
    expect(src).not.toContain('50,000+ AI Agents');
    expect(src).not.toContain('All Systems Secure');
    expect(src).not.toContain('Government. Transcended.');
    expect(src).toContain('Governed Operator Desktop');
    expect(src).toContain('desktop-shell-module-registry-status');
    expect(src).toContain('desktop-shell-system-health-status');
  });

  it('ModuleLauncher exposes explicit loading and unavailable states', () => {
    const src = readSrc('shell/ModuleLauncher.tsx');
    expect(src).toContain('module-launcher-loading');
    expect(src).toContain('module-launcher-unavailable');
    expect(src).toContain('Module registry unavailable.');
    expect(src).toContain('No governed modules available.');
  });
});

describe('Desktop shell rendered honesty behavior', () => {
  it('renders registry unavailable messaging instead of fallback modules', () => {
    useSystemHealthMock.mockReturnValue({
      systemHealth: {
        memory: null,
        memoryStatus: 'unknown',
        cpu: null,
        cpuStatus: 'unknown',
        notifications: 0,
        uptime: null,
        activeModules: 0,
        totalModules: 0,
        lastUpdated: '',
        status: 'Unavailable',
        warnings: [],
        systemComponents: {},
      },
    });

    useModulesMock.mockReturnValue({
      modules: [],
      loadModule: vi.fn(),
      isLoading: false,
      errorMessage:
        'Governed module registry unavailable. Desktop module catalog loading cannot continue without the live backend.',
    });

    render(<DesktopShell />);

    expect(screen.getByTestId('desktop-shell-module-registry-status')).toHaveTextContent(
      'Module registry unavailable',
    );
    expect(screen.getByTestId('desktop-shell-system-health-status')).toHaveTextContent(
      'System health unavailable',
    );
    expect(screen.getByTestId('module-launcher-unavailable')).toBeInTheDocument();
    expect(screen.queryByText('All Systems Secure')).not.toBeInTheDocument();
  });

  it('renders explicit empty state when the live registry returns no modules', () => {
    render(<ModuleLauncher modules={[]} onModuleLaunch={vi.fn()} />);

    expect(screen.getByTestId('module-launcher-empty')).toHaveTextContent(
      'No governed modules available.',
    );
  });
});
