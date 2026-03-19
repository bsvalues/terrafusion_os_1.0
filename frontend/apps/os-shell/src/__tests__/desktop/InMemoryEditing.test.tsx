/**
 * P21 In-memory Editing + Dirty State – regression tests
 *
 * Invariants:
 *   1. Typing in the editor textarea toggles the dirty indicator on the tab.
 *   2. Saving clears the dirty state and persists the content to localStorage.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — same pattern as WorkspaceMVP
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

// Mock the lazy-loaded Monaco editor to render a plain textarea for testability
vi.mock('../../canon/CanonEditor', () => ({
  CanonEditor: ({ value, onChange }: { value: string; onChange?: (val: string) => void }) => (
    <textarea
      data-testid='terracanon-editor-textarea'
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
  detectLanguage: vi.fn().mockReturnValue('plaintext'),
}));

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------
import CanonHome from '../../pages/CanonHome';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function openWorkspaceAndFile() {
  fireEvent.click(screen.getByTestId('terracanon-open-empty-workspace'));
  fireEvent.click(screen.getByTestId('terracanon-file-0')); // README.md
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('P21 – In-memory Editing + Dirty State', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('typing in editor toggles dirty indicator on tab', async () => {
    render(<CanonHome />);
    openWorkspaceAndFile();

    // Flush React.lazy Suspense resolution so editor mounts
    await act(async () => {});

    const tab = screen.getByTestId('terracanon-tab-README.md');

    // Initially not dirty
    expect(tab.textContent).not.toContain('●');
    expect(tab.className).not.toContain('dirty');

    // Type in the textarea
    const textarea = screen.getByTestId('terracanon-editor-textarea');
    fireEvent.change(textarea, { target: { value: 'modified content' } });

    // Tab should show dirty indicator
    expect(tab.textContent).toContain('●');
    expect(tab.className).toContain('dirty');
  });

  it('save clears dirty state and persists to localStorage', async () => {
    render(<CanonHome />);
    openWorkspaceAndFile();

    // Flush React.lazy Suspense resolution so editor mounts
    await act(async () => {});

    // Type in the textarea
    const textarea = screen.getByTestId('terracanon-editor-textarea');
    fireEvent.change(textarea, { target: { value: 'saved content' } });

    // Should be dirty
    const tab = screen.getByTestId('terracanon-tab-README.md');
    expect(tab.textContent).toContain('●');

    // Click save
    fireEvent.click(screen.getByTestId('terracanon-save'));

    // Tab should no longer be dirty
    expect(tab.textContent).not.toContain('●');

    // Check localStorage has the updated content
    const stored = JSON.parse(localStorage.getItem('tf.canon.files.v1')!);
    const wsId = Object.keys(stored)[0];
    const readme = stored[wsId].find((f: { name: string }) => f.name === 'README.md');
    expect(readme.content).toBe('saved content');
  });
});
