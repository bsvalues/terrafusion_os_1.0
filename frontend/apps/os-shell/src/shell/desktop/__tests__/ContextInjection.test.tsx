import { fireEvent, render, screen } from '@testing-library/react';
import { AxiomFSDetailPanel } from '@/fs/components/AxiomFSDetailPanel';
import { useAxiomFsStore } from '@/fs/store/axiomFsStore';
import { useDesktopStore } from '../../../stores/desktopStore';

// Mock the openWindow action from desktopStore
const mockOpenWindow = jest.fn();

// Mock dependencies
jest.mock('@/config/features', () => ({
  FEATURES: {
    ENABLE_AXIOM_FS: true,
    ENABLE_DASHBOARD: true,
    ENABLE_SIMULATION_ENGINE: true,
    ENABLE_REDUCED_MOTION: false,
    ENABLE_DEBUG_OVERLAYS: false,
    USE_MOCK_DATA: false,
  },
}));

jest.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Protocol C4.3: Deep Context Injection', () => {
  beforeEach(() => {
    // Reset mocks
    mockOpenWindow.mockClear();

    // Mock store implementations
    useDesktopStore.setState({ openWindow: mockOpenWindow });

    // Seed AxiomFS with a target object
    useAxiomFsStore.setState({
      selectedId: 'PARCEL-999',
      objects: new Map([
        [
          'PARCEL-999',
          {
            id: 'PARCEL-999',
            label: 'Test Parcel',
            type: 'parcel',
            status: 'verified',
            relations: [],
            tags: ['context-test'],
          },
        ],
      ]),
    });
  });

  test('Clicking Open transmits object metadata to Desktop Store', () => {
    render(<AxiomFSDetailPanel />);

    // Find and click the action button
    const btn = screen.getByText('OPEN DOCUMENT');
    fireEvent.click(btn);

    // Verify the transmission payload
    expect(mockOpenWindow).toHaveBeenCalledWith(
      'sovereign-dashboard',
      expect.stringContaining('Test Parcel'), // Title derived from label
      expect.any(String), // Icon
      expect.objectContaining({
        objectId: 'PARCEL-999',
        objectType: 'parcel',
        context: 'axiom-fs',
      })
    );
  });

  test('Metadata allows multiple unique windows', () => {
    // Simulate opening a different object
    useAxiomFsStore.setState({
      selectedId: 'DOC-123',
      objects: new Map([
        [
          'DOC-123',
          {
            id: 'DOC-123',
            label: 'Tax Report',
            type: 'document',
            status: 'draft',
            relations: [],
            tags: [],
          },
        ],
      ]),
    });

    render(<AxiomFSDetailPanel />);
    fireEvent.click(screen.getByText('OPEN DOCUMENT'));

    expect(mockOpenWindow).toHaveBeenCalledWith(
      'sovereign-dashboard',
      expect.stringContaining('Tax Report'),
      expect.any(String),
      expect.objectContaining({ objectId: 'DOC-123' })
    );
  });
});
