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

// Mock the useSystemGptAtlasLive hook for live data tests
const mockUseSystemGptAtlasLive = jest.fn();
jest.mock('../../../../hooks/useSystemGptAtlasLive', () => ({
  ...jest.requireActual('../../../../hooks/useSystemGptAtlasLive'),
  useSystemGptAtlasLive: (...args: any[]) => mockUseSystemGptAtlasLive(...args),
}));

describe('SystemGptAtlasPanel', () => {
  const mockOnCountySelect = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    mockOnCountySelect.mockClear();
    mockFetchSystemGptAtlas.mockClear();
    mockUseSystemGptAtlasLive.mockClear();
    // Default: connected state with no live events
    mockUseSystemGptAtlasLive.mockReturnValue({
      connectionState: 'connected',
      liveEvent: null,
      error: null,
      getCountyById: () => undefined,
    });
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

  // NOTE: These tests require a jsdom environment (Jest or Vitest with jsdom).
  // They cannot run under `node --test` which lacks DOM APIs.
  // Run with: npx jest SystemGptAtlasPanel.test.tsx  (or equivalent vitest command)

  describe('Phase 29: Live Streaming Integration', () => {
    // Shared mock data for live integration tests
    const mockLiveEvent = {
      version: '1.0',
      eventType: 'atlas_live',
      timestamp: new Date().toISOString(),
      counties: [
        {
          countyId: 'benton',
          healthScore: 97,
          healthState: 'healthy' as const,
          ragActive: true,
          guardrailTriggered: false,
          activeRequests: 42,
          p95LatencyMs: 120,
          errorRatePercent: 0.2,
          activeAlerts: [],
        },
        {
          countyId: 'yakima',
          healthScore: 68,
          healthState: 'warning' as const,
          ragActive: true,
          guardrailTriggered: true,
          activeRequests: 18,
          p95LatencyMs: 450,
          errorRatePercent: 3.1,
          activeAlerts: ['High latency detected on RAG pipeline'],
        },
        {
          countyId: 'franklin',
          healthScore: 15,
          healthState: 'critical' as const,
          ragActive: false,
          guardrailTriggered: false,
          activeRequests: 2,
          p95LatencyMs: 2100,
          errorRatePercent: 12.5,
          activeAlerts: ['Service degraded', 'RAG pipeline offline'],
        },
        {
          countyId: 'grant',
          healthScore: 0,
          healthState: 'offline' as const,
          ragActive: false,
          guardrailTriggered: false,
          activeRequests: 0,
          p95LatencyMs: 0,
          errorRatePercent: 0,
          activeAlerts: [],
        },
      ],
    };

    describe('C2.1 - Connection state display', () => {
      beforeEach(() => {
        mockFetchSystemGptAtlas.mockResolvedValue(healthyAtlasData);
      });

      it('should show connecting indicator when connectionState is connecting', async () => {
        mockUseSystemGptAtlasLive.mockReturnValue({
          connectionState: 'connecting',
          liveEvent: null,
          error: null,
          getCountyById: () => undefined,
        });

        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          const indicator = screen.getByTestId('atlas-connection-state');
          expect(indicator).toHaveAttribute('data-state', 'connecting');
          expect(indicator).toHaveTextContent(/Connecting/i);
        });
      });

      it('should show connected/live indicator when connectionState is connected', async () => {
        mockUseSystemGptAtlasLive.mockReturnValue({
          connectionState: 'connected',
          liveEvent: null,
          error: null,
          getCountyById: () => undefined,
        });

        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          const indicator = screen.getByTestId('atlas-connection-state');
          expect(indicator).toHaveAttribute('data-state', 'connected');
          expect(indicator).toHaveTextContent(/Live/i);
        });
      });

      it('should show reconnecting indicator with retry info', async () => {
        mockUseSystemGptAtlasLive.mockReturnValue({
          connectionState: 'reconnecting',
          liveEvent: null,
          error: null,
          getCountyById: () => undefined,
        });

        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          const indicator = screen.getByTestId('atlas-connection-state');
          expect(indicator).toHaveAttribute('data-state', 'reconnecting');
          expect(indicator).toHaveTextContent(/Reconnecting/i);
        });
      });

      it('should show offline indicator with fallback message', async () => {
        mockUseSystemGptAtlasLive.mockReturnValue({
          connectionState: 'offline',
          liveEvent: null,
          error: new Error('SSE connection failed'),
          getCountyById: () => undefined,
        });

        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          const indicator = screen.getByTestId('atlas-connection-state');
          expect(indicator).toHaveAttribute('data-state', 'offline');
          expect(indicator).toHaveTextContent(/Offline/i);
        });
      });
    });

    describe('C2.2 - County node health visualization', () => {
      beforeEach(() => {
        mockFetchSystemGptAtlas.mockResolvedValue(healthyAtlasData);
        mockUseSystemGptAtlasLive.mockReturnValue({
          connectionState: 'connected',
          liveEvent: mockLiveEvent,
          error: null,
          getCountyById: (id: string) => mockLiveEvent.counties.find((c) => c.countyId === id),
        });
      });

      it('should render healthy county with green indicator', async () => {
        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          // Benton County has health: 'Healthy' in static data, renders with emerald/green styling
          const bentonNode = screen.getByTitle(/Benton County/i);
          expect(bentonNode).toBeInTheDocument();
          expect(bentonNode.className).toMatch(/emerald/);
        });
      });

      it('should render warning county with yellow/amber indicator', async () => {
        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          // Yakima County has health: 'Degraded' in static data, renders with amber styling
          const yakimaNode = screen.getByTitle(/Yakima County/i);
          expect(yakimaNode).toBeInTheDocument();
          expect(yakimaNode.className).toMatch(/amber/);
        });
      });

      it('should render critical county with red indicator', async () => {
        // Use atlas data with an Unhealthy county to test red indicator
        const unhealthyAtlas = {
          ...healthyAtlasData,
          nodes: [
            ...healthyAtlasData.nodes,
            {
              countyId: 'grant',
              countyName: 'Grant County',
              health: 'Unhealthy' as const,
              capacityRisk: 'High' as const,
              ragStatus: 'Unknown' as const,
              configured: true,
              fleetRagDriftRisk: 'High' as const,
              fleetRagNote: 'Critical failures',
              recentGuardrailDeny: false,
              recentSafeModeRecommended: true,
              mapX: 0.3,
              mapY: 0.4,
            },
          ],
        };
        mockFetchSystemGptAtlas.mockResolvedValue(unhealthyAtlas);

        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          const grantNode = screen.getByTitle(/Grant County/i);
          expect(grantNode).toBeInTheDocument();
          expect(grantNode.className).toMatch(/red/);
        });
      });

      it('should render offline county with gray indicator', async () => {
        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          // Franklin County has health: 'Unknown' in static data, renders with slate/gray styling
          const franklinNode = screen.getByTitle(/Franklin County/i);
          expect(franklinNode).toBeInTheDocument();
          expect(franklinNode.className).toMatch(/slate/);
        });
      });
    });

    describe('C2.3 - Live metrics display', () => {
      beforeEach(() => {
        mockFetchSystemGptAtlas.mockResolvedValue(healthyAtlasData);
        mockUseSystemGptAtlasLive.mockReturnValue({
          connectionState: 'connected',
          liveEvent: mockLiveEvent,
          error: null,
          getCountyById: (id: string) => mockLiveEvent.counties.find((c) => c.countyId === id),
        });
      });

      it('should display health score percentage', async () => {
        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          const healthScore = screen.getByTestId('health-score');
          // Average of 97, 68, 15, 0 = 45
          expect(healthScore).toHaveTextContent('45%');
        });
      });

      it('should display active requests count', async () => {
        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          const activeRequests = screen.getByTestId('active-requests');
          // Sum of 42 + 18 + 2 + 0 = 62
          expect(activeRequests).toHaveTextContent('62');
        });
      });

      it('should display P95 latency', async () => {
        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          const p95Latency = screen.getByTestId('p95-latency');
          // Max of 120, 450, 2100, 0 = 2100
          expect(p95Latency).toHaveTextContent('2100ms');
        });
      });
    });

    describe('C2.4 - Alert display', () => {
      beforeEach(() => {
        mockFetchSystemGptAtlas.mockResolvedValue(healthyAtlasData);
      });

      it('should display active alerts for county', async () => {
        mockUseSystemGptAtlasLive.mockReturnValue({
          connectionState: 'connected',
          liveEvent: mockLiveEvent,
          error: null,
          getCountyById: (id: string) => mockLiveEvent.counties.find((c) => c.countyId === id),
        });

        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          const alertSection = screen.getByTestId('atlas-alerts');
          expect(alertSection).toBeInTheDocument();
          // 3 total alerts across yakima (1) and franklin (2)
          expect(alertSection).toHaveTextContent(/Active Alerts \(3\)/);
          expect(alertSection).toHaveTextContent(/High latency detected/);
          expect(alertSection).toHaveTextContent(/Service degraded/);
          expect(alertSection).toHaveTextContent(/RAG pipeline offline/);
        });
      });

      it('should not show alert section when no alerts', async () => {
        const noAlertEvent = {
          ...mockLiveEvent,
          counties: mockLiveEvent.counties.map((c) => ({
            ...c,
            activeAlerts: [],
          })),
        };
        mockUseSystemGptAtlasLive.mockReturnValue({
          connectionState: 'connected',
          liveEvent: noAlertEvent,
          error: null,
          getCountyById: (id: string) => noAlertEvent.counties.find((c) => c.countyId === id),
        });

        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          expect(screen.getByText(/SystemGPT Atlas/i)).toBeInTheDocument();
        });

        expect(screen.queryByTestId('atlas-alerts')).not.toBeInTheDocument();
      });
    });

    describe('C2.5 - Static + Live merge', () => {
      it('should show static data when live data not yet received', async () => {
        mockFetchSystemGptAtlas.mockResolvedValue(healthyAtlasData);
        mockUseSystemGptAtlasLive.mockReturnValue({
          connectionState: 'connecting',
          liveEvent: null,
          error: null,
          getCountyById: () => undefined,
        });

        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          // Static nodes should still render
          expect(screen.getByText(/Benton/)).toBeInTheDocument();
          expect(screen.getByText(/Yakima/)).toBeInTheDocument();
          expect(screen.getByText(/Franklin/)).toBeInTheDocument();
        });

        // Live metrics section should NOT be rendered (no live data)
        expect(screen.queryByTestId('atlas-live-metrics')).not.toBeInTheDocument();
      });

      it('should overlay live data on static nodes when available', async () => {
        mockFetchSystemGptAtlas.mockResolvedValue(healthyAtlasData);
        mockUseSystemGptAtlasLive.mockReturnValue({
          connectionState: 'connected',
          liveEvent: mockLiveEvent,
          error: null,
          getCountyById: (id: string) => mockLiveEvent.counties.find((c) => c.countyId === id),
        });

        render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

        await waitFor(() => {
          // Static nodes still present
          expect(screen.getByText(/Benton/)).toBeInTheDocument();
          // Live metrics overlay appears
          expect(screen.getByTestId('atlas-live-metrics')).toBeInTheDocument();
          // Alert display appears (from live data)
          expect(screen.getByTestId('atlas-alerts')).toBeInTheDocument();
        });
      });
    });
  });
});
