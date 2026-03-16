/**
 * P19 Workspace MVP – regression tests
 *
 * Invariants:
 *   1. Opening a workspace seeds virtual files visible in the explorer.
 *   2. Clicking a file opens a tab and displays read-only content.
 *
 * No filesystem, no persistence — virtual files only.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — same pattern as CanonBentoCompliance
// ---------------------------------------------------------------------------

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

// Mock the lazy-loaded Monaco editor to render content synchronously
vi.mock('../../canon/CanonEditor', () => ({
  CanonEditor: ({ value }: { value: string }) => (
    <div data-testid='terracanon-editor-content-inner'>{value}</div>
  ),
  detectLanguage: vi.fn().mockReturnValue('plaintext'),
}));

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------
import CanonHome from '../../pages/CanonHome';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('P19 – Workspace MVP', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('open workspace → explorer lists seed files', () => {
    render(<CanonHome />);
    fireEvent.click(screen.getByTestId('terracanon-open-empty-workspace'));

    // Seed files should appear in the explorer file tree
    expect(screen.getByTestId('terracanon-file-0')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-file-0')).toHaveTextContent('README.md');
    expect(screen.getByTestId('terracanon-file-1')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-file-1')).toHaveTextContent('terrafusion.json');
  });

  it('click file → tab appears and content is visible', async () => {
    render(<CanonHome />);
    fireEvent.click(screen.getByTestId('terracanon-open-empty-workspace'));

    // Click the first file (README.md)
    fireEvent.click(screen.getByTestId('terracanon-file-0'));

    // Tab bar should appear
    expect(screen.getByTestId('terracanon-tab-bar')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-tab-README.md')).toBeInTheDocument();

    // Editor content area should be rendered
    expect(screen.getByTestId('terracanon-editor-content')).toBeInTheDocument();

    // Flush React.lazy Suspense resolution
    await act(async () => {});

    // The mocked editor renders file content — check for seed text
    expect(screen.getByTestId('terracanon-editor-content')).toHaveTextContent(
      'Welcome to TerraCanon'
    );
  });
});
