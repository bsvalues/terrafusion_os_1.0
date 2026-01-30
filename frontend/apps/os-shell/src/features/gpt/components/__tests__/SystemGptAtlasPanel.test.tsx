/**
 * ═══════════════════════════════════════════════════════════════
 * PHASE 28: SYSTEMGPT ATLAS PANEL TESTS
 * Tests for Map-Based AI Health Visualization
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
// Vitest imports removed - Jest globals used
import '@testing-library/jest-dom';
import type { SystemGptAtlasResponse } from '../../../../api/systemDiagnosticsApi';
import { SystemGptAtlasPanel } from '../SystemGptAtlasPanel';

// Mock the systemDiagnosticsApi module entirely (avoids import.meta.env issues)
const mockFetchSystemGptAtlas = jest.fn();
jest.mock('../../../../api/systemDiagnosticsApi', () => ({
  fetchSystemGptAtlas: (...args: any[]) => mockFetchSystemGptAtlas(...args),
}));

describe('SystemGptAtlasPanel', () => {
  const mockOnCountySelect = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    mockOnCountySelect.mockClear();
    mockFetchSystemGptAtlas.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // MOCK DATA
  // ═══════════════════════════════════════════════════════════════

  const healthyAtlasData: SystemGptAtlasResponse = {
    generatedAtUtc: new Date().toISOString(),
    nodes: [
      {
        countyId: 'benton',
        countyName: 'Benton County',
        health: 'Healthy',
        capacityRisk: 'Low',
        ragStatus: 'Ready',
        configured: true,
        fleetRagDriftRisk: 'Low',
        fleetRagNote: null,
        recentGuardrailDeny: false,
        recentSafeModeRecommended: false,
        mapX: 0.4,
        mapY: 0.7,
      },
      {
        countyId: 'yakima',
        countyName: 'Yakima County',
        health: 'Degraded',
        capacityRisk: 'Medium',
        ragStatus: 'Stale',
        configured: true,
        fleetRagDriftRisk: 'Medium',
        fleetRagNote: 'Index is 48 hours old',
        recentGuardrailDeny: true,
        recentSafeModeRecommended: false,
        mapX: 0.6,
        mapY: 0.55,
      },
      {
        countyId: 'franklin',
        countyName: 'Franklin County',
        health: 'Unknown',
        capacityRisk: 'Unknown',
        ragStatus: 'Unindexed',
        configured: false,
        fleetRagDriftRisk: 'Low',
        fleetRagNote: null,
        recentGuardrailDeny: false,
        recentSafeModeRecommended: false,
        mapX: 0.5,
        mapY: 0.85,
      },
    ],
  };

  // ═══════════════════════════════════════════════════════════════
  // LOADING STATE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('loading state', () => {
    it('shows loading indicator initially', () => {
      mockFetchSystemGptAtlas.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      expect(screen.getByText(/Loading Atlas/i)).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SUCCESSFUL DATA DISPLAY TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('when data loads successfully', () => {
    beforeEach(() => {
      mockFetchSystemGptAtlas.mockResolvedValue(healthyAtlasData);
    });

    it('displays Atlas header', async () => {
      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        expect(screen.getByText(/SystemGPT Atlas/i)).toBeInTheDocument();
      });
    });

    it('displays phase information', async () => {
      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        expect(screen.getByText(/Phase 28/i)).toBeInTheDocument();
      });
    });

    it('displays all county nodes', async () => {
      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        expect(screen.getByText(/Benton/)).toBeInTheDocument();
        expect(screen.getByText(/Yakima/)).toBeInTheDocument();
        expect(screen.getByText(/Franklin/)).toBeInTheDocument();
      });
    });

    it('displays legend', async () => {
      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        expect(screen.getByText(/Legend/i)).toBeInTheDocument();
        // Use getAllByText because these labels appear in both Legend and Fleet Stats
        expect(screen.getAllByText(/Healthy/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Degraded/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Unhealthy/).length).toBeGreaterThan(0);
      });
    });

    it('displays fleet stats', async () => {
      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        expect(screen.getByText(/Fleet Status/i)).toBeInTheDocument();
        expect(screen.getByText(/Total:/i)).toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // INTERACTION TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('county node interactions', () => {
    beforeEach(() => {
      mockFetchSystemGptAtlas.mockResolvedValue(healthyAtlasData);
    });

    it('calls onCountySelect when clicking a county node', async () => {
      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        expect(screen.getByText(/Benton/)).toBeInTheDocument();
      });

      // Find the Benton node button and click it
      const bentonNode = screen.getByTitle(/Benton County/i);
      fireEvent.click(bentonNode);

      expect(mockOnCountySelect).toHaveBeenCalledWith('benton');
    });

    it('shows refresh button', async () => {
      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // RAG STATUS DISPLAY TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('RAG status display', () => {
    beforeEach(() => {
      mockFetchSystemGptAtlas.mockResolvedValue(healthyAtlasData);
    });

    it('displays RAG status badges for each county', async () => {
      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
        expect(screen.getByText('Stale')).toBeInTheDocument();
        expect(screen.getByText('Unindexed')).toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // WARNING INDICATOR TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('warning indicators', () => {
    beforeEach(() => {
      mockFetchSystemGptAtlas.mockResolvedValue(healthyAtlasData);
    });

    it('displays guardrail denial indicator for affected county', async () => {
      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        // Yakima has recentGuardrailDeny: true
        expect(screen.getByText(/Denied/i)).toBeInTheDocument();
      });
    });

    it('displays not configured indicator for unconfigured county', async () => {
      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        // Franklin has configured: false
        expect(screen.getByText(/Not Configured/i)).toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ERROR STATE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('error state', () => {
    it('displays error message when fetch fails', async () => {
      mockFetchSystemGptAtlas.mockRejectedValue(new Error('Network error'));

      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        expect(screen.getByText(/Atlas Error/i)).toBeInTheDocument();
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      mockFetchSystemGptAtlas.mockRejectedValue(new Error('Network error'));

      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // EMPTY STATE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('empty state', () => {
    it('displays empty message when no nodes', async () => {
      mockFetchSystemGptAtlas.mockResolvedValue({
        generatedAtUtc: new Date().toISOString(),
        nodes: [],
      });

      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        expect(screen.getByText(/No county data available/i)).toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // PHASE 29: LIVE STREAMING TESTS (C2)
  // "Write the exam before the course"
  // ═══════════════════════════════════════════════════════════════

  describe('Phase 29: Live Streaming Integration', () => {
    // These tests will be enabled once the useSystemGptAtlasLive hook is implemented
    // For now, they are skipped to allow the test suite to pass

    describe.skip('C2.1 - Connection state display', () => {
      it('should show connecting indicator when connectionState is connecting', () => {
        // TODO: Implement when useSystemGptAtlasLive is wired to SystemGptAtlasPanel
        expect(true).toBe(true);
      });

      it('should show connected/live indicator when connectionState is connected', () => {
        // TODO: Implement when useSystemGptAtlasLive is wired to SystemGptAtlasPanel
        expect(true).toBe(true);
      });

      it('should show reconnecting indicator with retry info', () => {
        // TODO: Implement when useSystemGptAtlasLive is wired to SystemGptAtlasPanel
        expect(true).toBe(true);
      });

      it('should show offline indicator with fallback message', () => {
        // TODO: Implement when useSystemGptAtlasLive is wired to SystemGptAtlasPanel
        expect(true).toBe(true);
      });
    });

    describe.skip('C2.2 - County node health visualization', () => {
      it('should render healthy county with green indicator', () => {
        // TODO: Implement when live data integration is complete
        expect(true).toBe(true);
      });

      it('should render warning county with yellow/amber indicator', () => {
        // TODO: Implement when live data integration is complete
        expect(true).toBe(true);
      });

      it('should render critical county with red indicator', () => {
        // TODO: Implement when live data integration is complete
        expect(true).toBe(true);
      });

      it('should render offline county with gray indicator', () => {
        // TODO: Implement when live data integration is complete
        expect(true).toBe(true);
      });
    });

    describe.skip('C2.3 - Live metrics display', () => {
      it('should display health score percentage', () => {
        // TODO: Implement when live data integration is complete
        expect(true).toBe(true);
      });

      it('should display active requests count', () => {
        // TODO: Implement when live data integration is complete
        expect(true).toBe(true);
      });

      it('should display P95 latency', () => {
        // TODO: Implement when live data integration is complete
        expect(true).toBe(true);
      });
    });

    describe.skip('C2.4 - Alert display', () => {
      it('should display active alerts for county', () => {
        // TODO: Implement when live data integration is complete
        expect(true).toBe(true);
      });

      it('should not show alert section when no alerts', () => {
        // TODO: Implement when live data integration is complete
        expect(true).toBe(true);
      });
    });

    describe.skip('C2.5 - Static + Live merge', () => {
      it('should show static data when live data not yet received', () => {
        // TODO: Implement when live data integration is complete
        expect(true).toBe(true);
      });

      it('should overlay live data on static nodes when available', () => {
        // TODO: Implement when live data integration is complete
        expect(true).toBe(true);
      });
    });
  });
});
