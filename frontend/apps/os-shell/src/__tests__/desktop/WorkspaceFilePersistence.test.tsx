/**
 * P20.1 Workspace File Persistence – regression tests
 *
 * Invariants:
 *   1. Opening a workspace persists seed files to localStorage;
 *      remounting restores them (explorer shows files without re-seeding).
 *   2. Closing a workspace clears active tabs/editor state but
 *      does NOT delete persisted files — reopening restores them.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../components/standalone', async () => ({
  StandaloneHomeShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../canon/CanonModuleHost', async () => ({
  CanonModuleHost: () => <div data-testid='canon-module-host-stub' />,
}));

vi.mock('../../canon/useCanonLayout', async () => ({
  useCanonLayout: () => [
    { leftPaneWidth: 250, rightPaneWidth: 750, inspectorOpen: false },
    vi.fn(),
  ],
}));

vi.mock('../../canon/invokeWithPreflight', async () => ({
  invokeWithPreflight: vi.fn(),
}));

vi.mock('../../api/canonDoctor', async () => ({ runCanonDoctor: vi.fn() }));
vi.mock('../../api/canonGateFast', async () => ({ runCanonGateFast: vi.fn() }));
vi.mock('../../api/canonPing', async () => ({ runCanonPing: vi.fn() }));

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------
import CanonHome from '../../pages/CanonHome';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('P20.1 – Workspace File Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('persists seed files to localStorage and restores on remount', () => {
    // Mount 1: open workspace → seeds files → persists
    const { unmount } = render(<CanonHome />);
    fireEvent.click(screen.getByTestId('terracanon-open-empty-workspace'));

    // Seed files visible
    expect(screen.getByTestId('terracanon-file-0')).toHaveTextContent('README.md');
    expect(screen.getByTestId('terracanon-file-1')).toHaveTextContent('terrafusion.json');

    // localStorage should now contain files
    const rawFiles = localStorage.getItem('tf.canon.files.v1');
    expect(rawFiles).not.toBeNull();
    const parsedFiles = JSON.parse(rawFiles!);
    const wsIds = Object.keys(parsedFiles);
    expect(wsIds.length).toBe(1);
    expect(parsedFiles[wsIds[0]].length).toBe(2);

    // Unmount + remount — files should restore from localStorage
    unmount();
    render(<CanonHome />);

    // Workspace was persisted by existing Phase 38 mechanism
    expect(screen.getByTestId('terracanon-file-0')).toHaveTextContent('README.md');
    expect(screen.getByTestId('terracanon-file-1')).toHaveTextContent('terrafusion.json');
  });

  it('closing workspace clears tabs but persisted files survive for reopen', () => {
    render(<CanonHome />);

    // Open workspace + open a file tab
    fireEvent.click(screen.getByTestId('terracanon-open-empty-workspace'));
    fireEvent.click(screen.getByTestId('terracanon-file-0'));
    expect(screen.getByTestId('terracanon-tab-bar')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-editor-content')).toBeInTheDocument();

    // Close the tab first to get back to workspace-loaded view
    fireEvent.click(screen.getByTestId('terracanon-tab-README.md'));
    const closeBtn = screen.getByLabelText('Close README.md');
    fireEvent.click(closeBtn);

    // Now close the workspace
    fireEvent.click(screen.getByTestId('terracanon-close-workspace'));

    // Should return to empty state
    expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
    expect(screen.queryByTestId('terracanon-tab-bar')).not.toBeInTheDocument();

    // Files should still be in localStorage (not deleted on close)
    const rawFiles = localStorage.getItem('tf.canon.files.v1');
    expect(rawFiles).not.toBeNull();
    const parsedFiles = JSON.parse(rawFiles!);
    const wsIds = Object.keys(parsedFiles);
    expect(wsIds.length).toBe(1);

    // Reopen → files should be restored (not re-seeded)
    fireEvent.click(screen.getByTestId('terracanon-reopen-workspace'));
    expect(screen.getByTestId('terracanon-file-0')).toHaveTextContent('README.md');
    expect(screen.getByTestId('terracanon-file-1')).toHaveTextContent('terrafusion.json');
  });
});
