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
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('click file → tab appears and content is visible', () => {
    render(<CanonHome />);
    fireEvent.click(screen.getByTestId('terracanon-open-empty-workspace'));

    // Click the first file (README.md)
    fireEvent.click(screen.getByTestId('terracanon-file-0'));

    // Tab bar should appear
    expect(screen.getByTestId('terracanon-tab-bar')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-tab-README.md')).toBeInTheDocument();

    // Editor content should show the file content (read-only)
    expect(screen.getByTestId('terracanon-editor-content')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-editor-content')).toHaveTextContent(
      'Welcome to TerraCanon'
    );
  });
});
