/**
 * ═══════════════════════════════════════════════════════════════
 * PHASE 28: SYSTEMGPT ATLAS PANEL TESTS
 * Tests for Map-Based AI Health Visualization
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SystemGptAtlasResponse } from '../../../../api/systemDiagnosticsApi';
import { SystemGptAtlasPanel } from '../SystemGptAtlasPanel';

// Mock the fetch API
vi.mock('../../../../api/systemDiagnosticsApi', async () => {
  const actual = await vi.importActual('../../../../api/systemDiagnosticsApi');
  return {
    ...actual,
    fetchSystemGptAtlas: vi.fn(),
  };
});

import { fetchSystemGptAtlas } from '../../../../api/systemDiagnosticsApi';

describe('SystemGptAtlasPanel', () => {
  const mockOnCountySelect = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnCountySelect.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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
      (fetchSystemGptAtlas as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}), // Never resolves
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
      (fetchSystemGptAtlas as ReturnType<typeof vi.fn>).mockResolvedValue(healthyAtlasData);
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
        expect(screen.getByText(/Healthy/)).toBeInTheDocument();
        expect(screen.getByText(/Degraded/)).toBeInTheDocument();
        expect(screen.getByText(/Unhealthy/)).toBeInTheDocument();
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
      (fetchSystemGptAtlas as ReturnType<typeof vi.fn>).mockResolvedValue(healthyAtlasData);
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
      (fetchSystemGptAtlas as ReturnType<typeof vi.fn>).mockResolvedValue(healthyAtlasData);
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
      (fetchSystemGptAtlas as ReturnType<typeof vi.fn>).mockResolvedValue(healthyAtlasData);
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
      (fetchSystemGptAtlas as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error'),
      );

      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        expect(screen.getByText(/Atlas Error/i)).toBeInTheDocument();
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      (fetchSystemGptAtlas as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error'),
      );

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
      (fetchSystemGptAtlas as ReturnType<typeof vi.fn>).mockResolvedValue({
        generatedAtUtc: new Date().toISOString(),
        nodes: [],
      });

      render(<SystemGptAtlasPanel onCountySelect={mockOnCountySelect} />);

      await waitFor(() => {
        expect(screen.getByText(/No county data available/i)).toBeInTheDocument();
      });
    });
  });
});
