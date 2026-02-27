/**
 * P21 In-memory Editing + Dirty State – regression tests
 *
 * Invariants:
 *   1. Typing in the editor textarea toggles the dirty indicator on the tab.
 *   2. Saving clears the dirty state and persists the content to localStorage.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — same pattern as WorkspaceMVP
// ---------------------------------------------------------------------------

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../components/standalone', () => ({
  StandaloneHomeShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../canon/CanonModuleHost', () => ({
  CanonModuleHost: () => <div data-testid='canon-module-host-stub' />,
}));

jest.mock('../../canon/useCanonLayout', () => ({
  useCanonLayout: () => [
    { leftPaneWidth: 250, rightPaneWidth: 750, inspectorOpen: false },
    jest.fn(),
  ],
}));

jest.mock('../../canon/invokeWithPreflight', () => ({
  invokeWithPreflight: jest.fn(),
}));

jest.mock('../../api/canonDoctor', () => ({ runCanonDoctor: jest.fn() }));
jest.mock('../../api/canonGateFast', () => ({ runCanonGateFast: jest.fn() }));
jest.mock('../../api/canonPing', () => ({ runCanonPing: jest.fn() }));

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

  it('typing in editor toggles dirty indicator on tab', () => {
    render(<CanonHome />);
    openWorkspaceAndFile();

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

  it('save clears dirty state and persists to localStorage', () => {
    render(<CanonHome />);
    openWorkspaceAndFile();

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
