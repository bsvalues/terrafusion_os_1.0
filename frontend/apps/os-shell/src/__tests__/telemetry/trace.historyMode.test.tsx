/**
 * Trace History Mode Tests
 *
 * TDD tests for Action Stream UI History mode:
 * - Live/History toggle
 * - History mode loads from persisted store
 * - Live mode shows real-time events
 * - Wipe action clears history
 *
 * @module __tests__/telemetry/trace.historyMode.test
 * @see Slice 20: Persisted Telemetry Backend
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the telemetry store before importing components
const mockStoreList = vi.fn();
const mockStoreWipe = vi.fn();
const mockStoreStats = vi.fn();

vi.mock('../../services/telemetry', () => ({
  getTelemetryStore: vi.fn(() => ({
    list: mockStoreList,
    wipe: mockStoreWipe,
    stats: mockStoreStats,
    append: vi.fn(),
  })),
  createTelemetryStore: vi.fn(),
}));

vi.mock('../../services/osActions', () => ({
  subscribeToAllTraces: vi.fn((callback) => {
    // Return unsubscribe function
    return () => {};
  }),
}));

// Import after mocks
import { ActionStreamModule } from '../../components/Trace/ActionStreamModule';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockStoredEvent(id: number, timestamp?: number) {
  return {
    id: `stored-event-${id}`,
    type: 'os_action_invoked' as const,
    timestamp: timestamp ?? Date.now() - id * 1000,
    payload: {
      actionId: `action-${id}`,
      actionType: 'navigation',
      intent: 'standalone',
      surface: 'launcher',
      suiteId: 'test',
      href: `/stored/${id}`,
    },
  };
}

function renderWithRouter(component: React.ReactNode) {
  return render(<MemoryRouter>{component}</MemoryRouter>);
}

// ============================================================================
// Tests
// ============================================================================

describe('Action Stream History Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreList.mockResolvedValue([]);
    mockStoreStats.mockResolvedValue({ eventCount: 0 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mode toggle', () => {
    it('renders Live/History mode toggle', () => {
      renderWithRouter(<ActionStreamModule />);

      expect(screen.getByRole('button', { name: /live/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
    });

    it('defaults to Live mode', () => {
      renderWithRouter(<ActionStreamModule />);

      const liveButton = screen.getByRole('button', { name: /live/i });
      expect(liveButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('switches to History mode on click', async () => {
      renderWithRouter(<ActionStreamModule />);

      const historyButton = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(historyButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('switches back to Live mode on click', async () => {
      renderWithRouter(<ActionStreamModule />);

      const historyButton = screen.getByRole('button', { name: /history/i });
      const liveButton = screen.getByRole('button', { name: /live/i });

      fireEvent.click(historyButton);
      await waitFor(() => {
        expect(historyButton).toHaveAttribute('aria-pressed', 'true');
      });

      fireEvent.click(liveButton);
      await waitFor(() => {
        expect(liveButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('History mode data loading', () => {
    it('loads events from telemetry store in History mode', async () => {
      const storedEvents = [
        createMockStoredEvent(1),
        createMockStoredEvent(2),
        createMockStoredEvent(3),
      ];
      mockStoreList.mockResolvedValue(storedEvents);
      mockStoreStats.mockResolvedValue({ eventCount: 3 });

      renderWithRouter(<ActionStreamModule />);

      const historyButton = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(mockStoreList).toHaveBeenCalled();
      });

      // Should display stored events
      await waitFor(() => {
        expect(screen.getByText(/action-1/)).toBeInTheDocument();
      });
    });

    it('shows empty state when no history', async () => {
      mockStoreList.mockResolvedValue([]);
      mockStoreStats.mockResolvedValue({ eventCount: 0 });

      renderWithRouter(<ActionStreamModule />);

      const historyButton = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText(/no events/i)).toBeInTheDocument();
      });
    });

    it('does not call store.list() in Live mode', async () => {
      renderWithRouter(<ActionStreamModule />);

      // In Live mode by default, should not fetch history
      expect(mockStoreList).not.toHaveBeenCalled();
    });
  });

  describe('Wipe functionality', () => {
    it('shows wipe button in History mode', async () => {
      mockStoreList.mockResolvedValue([createMockStoredEvent(1)]);
      mockStoreStats.mockResolvedValue({ eventCount: 1 });

      renderWithRouter(<ActionStreamModule />);

      const historyButton = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /wipe/i })).toBeInTheDocument();
      });
    });

    it('wipe button calls store.wipe()', async () => {
      mockStoreList.mockResolvedValue([createMockStoredEvent(1)]);
      mockStoreStats.mockResolvedValue({ eventCount: 1 });
      mockStoreWipe.mockResolvedValue(undefined);

      renderWithRouter(<ActionStreamModule />);

      const historyButton = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /wipe/i })).toBeInTheDocument();
      });

      const wipeButton = screen.getByRole('button', { name: /wipe/i });
      fireEvent.click(wipeButton);

      await waitFor(() => {
        expect(mockStoreWipe).toHaveBeenCalled();
      });
    });

    it('refreshes event list after wipe', async () => {
      mockStoreList
        .mockResolvedValueOnce([createMockStoredEvent(1)]) // Initial load
        .mockResolvedValueOnce([]); // After wipe
      mockStoreStats.mockResolvedValue({ eventCount: 0 });
      mockStoreWipe.mockResolvedValue(undefined);

      renderWithRouter(<ActionStreamModule />);

      const historyButton = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText(/action-1/)).toBeInTheDocument();
      });

      const wipeButton = screen.getByRole('button', { name: /wipe/i });
      fireEvent.click(wipeButton);

      await waitFor(() => {
        expect(screen.getByText(/no events/i)).toBeInTheDocument();
      });
    });
  });

  describe('Stats display', () => {
    it('shows event count in History mode', async () => {
      mockStoreList.mockResolvedValue([createMockStoredEvent(1), createMockStoredEvent(2)]);
      mockStoreStats.mockResolvedValue({ eventCount: 2 });

      renderWithRouter(<ActionStreamModule />);

      const historyButton = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText(/2 events/i)).toBeInTheDocument();
      });
    });

    it('shows total stored count badge', async () => {
      mockStoreStats.mockResolvedValue({ eventCount: 150 });
      mockStoreList.mockResolvedValue([]);

      renderWithRouter(<ActionStreamModule />);

      const historyButton = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText(/150/)).toBeInTheDocument();
      });
    });
  });

  describe('Mode indicator', () => {
    it('shows LIVE indicator in Live mode', () => {
      renderWithRouter(<ActionStreamModule />);

      expect(screen.getByText(/live/i)).toBeInTheDocument();
    });

    it('shows HISTORY indicator in History mode', async () => {
      mockStoreList.mockResolvedValue([]);
      mockStoreStats.mockResolvedValue({ eventCount: 0 });

      renderWithRouter(<ActionStreamModule />);

      const historyButton = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyButton);

      await waitFor(() => {
        // Should have "History" in the mode toggle area
        expect(historyButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });
});

describe('Action Stream Live/History Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreList.mockResolvedValue([]);
    mockStoreStats.mockResolvedValue({ eventCount: 0 });
  });

  it('switching modes preserves filter state', async () => {
    renderWithRouter(<ActionStreamModule />);

    // Change surface filter in Live mode
    const surfaceSelect = screen.getByLabelText(/surface/i);
    fireEvent.change(surfaceSelect, { target: { value: 'launcher' } });

    // Switch to History
    const historyButton = screen.getByRole('button', { name: /history/i });
    fireEvent.click(historyButton);

    await waitFor(() => {
      expect(historyButton).toHaveAttribute('aria-pressed', 'true');
    });

    // Switch back to Live
    const liveButton = screen.getByRole('button', { name: /live/i });
    fireEvent.click(liveButton);

    await waitFor(() => {
      expect(liveButton).toHaveAttribute('aria-pressed', 'true');
    });

    // Filter should still be set
    expect(surfaceSelect).toHaveValue('launcher');
  });

  it('clear button in Live mode does not affect History', async () => {
    const storedEvents = [createMockStoredEvent(1)];
    mockStoreList.mockResolvedValue(storedEvents);
    mockStoreStats.mockResolvedValue({ eventCount: 1 });

    renderWithRouter(<ActionStreamModule />);

    // Clear in Live mode
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    // Switch to History
    const historyButton = screen.getByRole('button', { name: /history/i });
    fireEvent.click(historyButton);

    // History should still have the event
    await waitFor(() => {
      expect(screen.getByText(/action-1/)).toBeInTheDocument();
    });
  });
});
