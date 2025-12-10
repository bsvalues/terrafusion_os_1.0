/**
 * ═══════════════════════════════════════════════════════════════
 * PHASE 27: SYSTEMGPT RAG FLEET PANEL TESTS
 * Tests for RAG Fleet Readiness and Drift Detection panel
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RagFleetReadiness } from '../../../../api/systemDiagnosticsApi';
import { SystemGptRagFleetPanel } from '../SystemGptRagFleetPanel';

// Mock the fetch API
vi.mock('../../../../api/systemDiagnosticsApi', async () => {
  const actual = await vi.importActual('../../../../api/systemDiagnosticsApi');
  return {
    ...actual,
    fetchRagFleetReadiness: vi.fn(),
  };
});

describe('SystemGptRagFleetPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // BASIC RENDERING TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('when data is provided externally', () => {
    const healthyFleetData: RagFleetReadiness = {
      generatedAtUtc: new Date().toISOString(),
      fleetDriftRisk: 'Low',
      advisory: 'Fleet RAG parity is healthy across all counties.',
      counties: [
        {
          countyId: 'benton',
          countyName: 'Benton County',
          configured: true,
          ragStatus: 'Ready',
          documentCount: 500,
          embeddingCount: 2500,
          lastIndexedAtUtc: new Date().toISOString(),
          indexAgeHours: 2.5,
          note: null,
        },
      ],
      totalCounties: 1,
      configuredCounties: 1,
      readyCounties: 1,
      driftConditions: [],
    };

    it('displays fleet readiness header', () => {
      render(<SystemGptRagFleetPanel fleetReadiness={healthyFleetData} />);

      expect(screen.getByText(/RAG Fleet Readiness/i)).toBeInTheDocument();
    });

    it('displays phase information', () => {
      render(<SystemGptRagFleetPanel fleetReadiness={healthyFleetData} />);

      expect(screen.getByText(/Phase 27/i)).toBeInTheDocument();
    });

    it('displays advisory message', () => {
      render(<SystemGptRagFleetPanel fleetReadiness={healthyFleetData} />);

      expect(screen.getByText(/Fleet RAG parity is healthy/)).toBeInTheDocument();
    });

    it('displays fleet stats', () => {
      render(<SystemGptRagFleetPanel fleetReadiness={healthyFleetData} />);

      expect(screen.getByText(/Total Counties/i)).toBeInTheDocument();
      expect(screen.getByText(/Configured/i)).toBeInTheDocument();
      expect(screen.getByText(/Ready/i)).toBeInTheDocument();
    });

    it('displays county name in table', () => {
      render(<SystemGptRagFleetPanel fleetReadiness={healthyFleetData} />);

      expect(screen.getByText(/Benton County/)).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DRIFT RISK BADGE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('drift risk badge display', () => {
    it('shows FLEET ALIGNED for Low risk', () => {
      const lowRiskData: RagFleetReadiness = {
        generatedAtUtc: new Date().toISOString(),
        fleetDriftRisk: 'Low',
        advisory: 'All good',
        counties: [],
        totalCounties: 1,
        configuredCounties: 1,
        readyCounties: 1,
        driftConditions: [],
      };

      render(<SystemGptRagFleetPanel fleetReadiness={lowRiskData} />);

      expect(screen.getByText(/FLEET ALIGNED/i)).toBeInTheDocument();
    });

    it('shows DRIFT DETECTED for Medium risk', () => {
      const mediumRiskData: RagFleetReadiness = {
        generatedAtUtc: new Date().toISOString(),
        fleetDriftRisk: 'Medium',
        advisory: 'Some drift detected',
        counties: [],
        totalCounties: 2,
        configuredCounties: 2,
        readyCounties: 1,
        driftConditions: ['IndexAgeDriftMedium'],
      };

      render(<SystemGptRagFleetPanel fleetReadiness={mediumRiskData} />);

      expect(screen.getByText(/DRIFT DETECTED/i)).toBeInTheDocument();
    });

    it('shows HIGH DRIFT for High risk', () => {
      const highRiskData: RagFleetReadiness = {
        generatedAtUtc: new Date().toISOString(),
        fleetDriftRisk: 'High',
        advisory: 'Critical drift',
        counties: [],
        totalCounties: 2,
        configuredCounties: 2,
        readyCounties: 0,
        driftConditions: ['IndexAgeDriftHigh', 'StatusDriftSevere'],
      };

      render(<SystemGptRagFleetPanel fleetReadiness={highRiskData} />);

      expect(screen.getByText(/HIGH DRIFT/i)).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // COUNTY STATUS BADGE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('county status display', () => {
    const makeDataWithCountyStatus = (status: string): RagFleetReadiness => ({
      generatedAtUtc: new Date().toISOString(),
      fleetDriftRisk: 'Low',
      advisory: 'Test',
      counties: [
        {
          countyId: 'benton',
          countyName: 'Benton County',
          configured: true,
          ragStatus: status,
          documentCount: 100,
          embeddingCount: 500,
          lastIndexedAtUtc: new Date().toISOString(),
          indexAgeHours: 1,
          note: null,
        },
      ],
      totalCounties: 1,
      configuredCounties: 1,
      readyCounties: status === 'Ready' ? 1 : 0,
      driftConditions: [],
    });

    it('displays Ready status badge', () => {
      render(<SystemGptRagFleetPanel fleetReadiness={makeDataWithCountyStatus('Ready')} />);

      const statusBadges = screen.getAllByText('Ready');
      expect(statusBadges.length).toBeGreaterThan(0);
    });

    it('displays Stale status badge', () => {
      render(<SystemGptRagFleetPanel fleetReadiness={makeDataWithCountyStatus('Stale')} />);

      expect(screen.getByText('Stale')).toBeInTheDocument();
    });

    it('displays Unindexed status badge', () => {
      render(<SystemGptRagFleetPanel fleetReadiness={makeDataWithCountyStatus('Unindexed')} />);

      expect(screen.getByText('Unindexed')).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DRIFT CONDITIONS DISPLAY TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('drift conditions display', () => {
    it('shows drift condition labels', () => {
      const dataWithDrift: RagFleetReadiness = {
        generatedAtUtc: new Date().toISOString(),
        fleetDriftRisk: 'Medium',
        advisory: 'Drift detected',
        counties: [],
        totalCounties: 2,
        configuredCounties: 2,
        readyCounties: 1,
        driftConditions: ['IndexAgeDriftMedium'],
      };

      render(<SystemGptRagFleetPanel fleetReadiness={dataWithDrift} />);

      expect(screen.getByText(/Index Age Drift/i)).toBeInTheDocument();
    });

    it('does not show conditions section when empty', () => {
      const dataWithoutDrift: RagFleetReadiness = {
        generatedAtUtc: new Date().toISOString(),
        fleetDriftRisk: 'Low',
        advisory: 'All good',
        counties: [],
        totalCounties: 1,
        configuredCounties: 1,
        readyCounties: 1,
        driftConditions: [],
      };

      render(<SystemGptRagFleetPanel fleetReadiness={dataWithoutDrift} />);

      // The drift conditions component should not render any tags
      expect(screen.queryByText(/Index Age Drift/i)).not.toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // UNCONFIGURED COUNTIES TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('unconfigured counties handling', () => {
    it('shows unconfigured counties in collapsed section', () => {
      const dataWithUnconfigured: RagFleetReadiness = {
        generatedAtUtc: new Date().toISOString(),
        fleetDriftRisk: 'Low',
        advisory: 'Test',
        counties: [
          {
            countyId: 'benton',
            countyName: 'Benton County',
            configured: true,
            ragStatus: 'Ready',
            documentCount: 100,
            embeddingCount: 500,
            lastIndexedAtUtc: new Date().toISOString(),
            indexAgeHours: 1,
            note: null,
          },
          {
            countyId: 'yakima',
            countyName: 'Yakima County',
            configured: false,
            ragStatus: 'Unknown',
            documentCount: null,
            embeddingCount: null,
            lastIndexedAtUtc: null,
            indexAgeHours: null,
            note: 'RAG services not configured',
          },
        ],
        totalCounties: 2,
        configuredCounties: 1,
        readyCounties: 1,
        driftConditions: [],
      };

      render(<SystemGptRagFleetPanel fleetReadiness={dataWithUnconfigured} />);

      expect(screen.getByText(/1 unconfigured counties/i)).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LOADING STATE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('loading state', () => {
    it('shows loading indicator when no data and loading', () => {
      // When no external data is provided and fetch hasn't completed
      render(<SystemGptRagFleetPanel />);

      expect(screen.getByText(/Loading RAG Fleet Readiness/i)).toBeInTheDocument();
    });
  });
});
