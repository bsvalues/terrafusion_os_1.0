/**
 * P19 Workspace MVP – regression tests
 *
 * Invariants:
 *   1. Opening a workspace seeds virtual files visible in the explorer.
 *   2. Clicking a file opens a tab and displays read-only content.
 *
 * No filesystem, no persistence — virtual files only.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — same pattern as CanonBentoCompliance
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
