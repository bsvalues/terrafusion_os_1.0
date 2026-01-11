/**
 * AxiomFS to Sovereign Dashboard Integration Tests
 *
 * Tests the flow from selecting an object in AxiomFS lattice
 * to opening it in the Sovereign Dashboard.
 *
 * @module fs/components/__tests__/AxiomFSDetailPanel.test
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { useDesktopStore } from '../../../stores/desktopStore';
import { useAxiomFsStore } from '../../store/axiomFsStore';
import { SovereignObject } from '../../types';
import { AxiomFSDetailPanel } from '../AxiomFSDetailPanel';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    aside: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <aside {...props}>{children}</aside>
    ),
  },
}));

// Mock desktop store
jest.mock('../../../stores/desktopStore', () => ({
  useDesktopStore: jest.fn(),
}));

// Mock axiom fs store
jest.mock('../../store/axiomFsStore', () => ({
  useAxiomFsStore: jest.fn(),
}));

const mockOpenWindow = jest.fn();
const mockSelectObject = jest.fn();

const createMockObject = (overrides?: Partial<SovereignObject>): SovereignObject => ({
  id: 'doc-001',
  type: 'document',
  label: 'Main Street Property',
  status: 'verified',
  tags: ['residential', 'benton-county'],
  relations: ['ledger-001', 'policy-001'],
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('AxiomFSDetailPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default desktop store mock
    (useDesktopStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        openWindow: mockOpenWindow,
      };
      return selector(state);
    });
  });

  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('rendering', () => {
    it('does not render when no object is selected', () => {
      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: null,
        objects: new Map(),
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      expect(screen.queryByTestId('axiomfs-detail-panel')).not.toBeInTheDocument();
    });

    it('renders when an object is selected', () => {
      const mockObject = createMockObject();
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      expect(screen.getByTestId('axiomfs-detail-panel')).toBeInTheDocument();
    });

    it('displays object label', () => {
      const mockObject = createMockObject({ label: 'Test Property' });
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      expect(screen.getByText('Test Property')).toBeInTheDocument();
    });

    it('displays object type badge', () => {
      const mockObject = createMockObject({ type: 'ledger' });
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      expect(screen.getByText('ledger')).toBeInTheDocument();
    });

    it('displays verified status', () => {
      const mockObject = createMockObject({ status: 'verified' });
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      expect(screen.getByText('● VERIFIED')).toBeInTheDocument();
    });

    it('displays pending status', () => {
      const mockObject = createMockObject({ status: 'pending' });
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      expect(screen.getByText('● PENDING')).toBeInTheDocument();
    });

    it('displays anomaly status', () => {
      const mockObject = createMockObject({ status: 'anomaly' });
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      expect(screen.getByText('● ANOMALY')).toBeInTheDocument();
    });

    it('displays relation count', () => {
      const mockObject = createMockObject({
        relations: ['rel-1', 'rel-2', 'rel-3'],
      });
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      expect(screen.getByText('3 Linked Objects')).toBeInTheDocument();
    });

    it('displays tags', () => {
      const mockObject = createMockObject({ tags: ['important', 'review'] });
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      expect(screen.getByText('#important')).toBeInTheDocument();
      expect(screen.getByText('#review')).toBeInTheDocument();
    });

    it('displays "No tags" when tags are empty', () => {
      const mockObject = createMockObject({ tags: [] });
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      expect(screen.getByText('No tags')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Actions
  // ==========================================================================

  describe('actions', () => {
    it('closes panel when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockObject = createMockObject();
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      await user.click(screen.getByTestId('detail-panel-close'));

      expect(mockSelectObject).toHaveBeenCalledWith(null);
    });

    it('renders OPEN DOCUMENT button', () => {
      const mockObject = createMockObject();
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      expect(screen.getByTestId('open-document-button')).toBeInTheDocument();
      expect(screen.getByText('OPEN DOCUMENT')).toBeInTheDocument();
    });

    it('opens sovereign-dashboard when OPEN DOCUMENT is clicked', async () => {
      const user = userEvent.setup();
      const mockObject = createMockObject({ label: 'Test Property' });
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      await user.click(screen.getByTestId('open-document-button'));

      expect(mockOpenWindow).toHaveBeenCalledWith(
        'sovereign-dashboard',
        'Document: Test Property',
        '📄'
      );
    });

    it('renders SHOW RELATIONS button', () => {
      const mockObject = createMockObject();
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      expect(screen.getByTestId('show-relations-button')).toBeInTheDocument();
      expect(screen.getByText('SHOW RELATIONS')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('accessibility', () => {
    it('has accessible label for panel', () => {
      const mockObject = createMockObject();
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      expect(screen.getByLabelText('Sovereign Object Details')).toBeInTheDocument();
    });

    it('close button has accessible label', () => {
      const mockObject = createMockObject();
      const objects = new Map([['doc-001', mockObject]]);

      (useAxiomFsStore as unknown as jest.Mock).mockReturnValue({
        selectedId: 'doc-001',
        objects,
        selectObject: mockSelectObject,
      });

      render(<AxiomFSDetailPanel />);
      expect(screen.getByLabelText('Close Panel')).toBeInTheDocument();
    });
  });
});
