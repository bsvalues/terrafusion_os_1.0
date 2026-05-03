/**
 * ======================================================================
 * TERRAFUSION OS - PHASE 9 DAIS OPERATIONS CONTRACT TESTS
 *
 * Contract tests for three Dais operation pages:
 *   - RollReadiness (TFR-065): Certification pipeline with summary cards
 *   - DefensePacket (TFR-070): Defense narrative form + preview
 *   - FieldStudio  (TFR-073): Offline field observations + sync
 *
 * TDD-first: these tests define the contract and will fail until
 * implementation adds the required data-testid attributes and removes
 * hardcoded light-mode color classes.
 * ======================================================================
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Light-mode class detection helper
// ---------------------------------------------------------------------------

const LIGHT_MODE_PATTERNS = [
  /bg-gray-\d+/,
  /bg-blue-\d+/,
  /bg-green-\d+/,
  /bg-red-\d+/,
  /bg-yellow-\d+/,
  /border-gray-\d+/,
  /hover:bg-gray-\d+/,
  /text-gray-\d+/,
];

function assertNoLightModeClasses(container: HTMLElement) {
  const html = container.innerHTML;
  for (const pattern of LIGHT_MODE_PATTERNS) {
    expect(html).not.toMatch(pattern);
  }
}

// ---------------------------------------------------------------------------
// Mocks — shadcn/ui primitives
// ---------------------------------------------------------------------------

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-component="card" {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-component="card-content" {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div data-component="card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <div data-component="card-title" {...props}>{children}</div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span data-component="badge" {...props}>{children}</span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn(async ({ toolId }: { toolId: string }) => {
    if (toolId === 'open_appeal_packet') {
      return {
        success: true,
        correlationId: 'corr-packet-001',
        result: {
          output: JSON.stringify({
            appealId: 'P-123',
            packetRef: 'packet:P-123',
            payloadRef: 'payload:P-123',
            sections: ['summary', 'evidence'],
            chainOfCustody: ['entry-1'],
          }),
        },
      };
    }

    if (toolId === 'draft_appeal_response') {
      return {
        success: true,
        correlationId: 'corr-draft-001',
        result: {
          output: JSON.stringify({
            draftSummary: 'Narrative ready for board review.',
            payloadRef: 'payload:P-123',
          }),
        },
      };
    }

    if (toolId === 'assemble_boe_packet') {
      return {
        success: true,
        correlationId: 'corr-assemble-001',
        result: { output: 'assembled' },
      };
    }

    return {
      success: false,
      correlationId: 'corr-error-001',
      error: { message: 'Unexpected tool' },
    };
  }),
}));

// ---------------------------------------------------------------------------
// Mocks — daisService (getCertificationStatus)
// ---------------------------------------------------------------------------

vi.mock('@/services/suites/daisService', () => ({
  getCertificationStatus: vi.fn().mockResolvedValue([
    {
      area: 'Richland North',
      totalParcels: 5000,
      completedParcels: 4500,
      percentComplete: 90,
      status: 'on-track',
      deadline: '2026-06-30',
      assignedTo: 'Team Alpha',
    },
    {
      area: 'Kennewick South',
      totalParcels: 3000,
      completedParcels: 1800,
      percentComplete: 60,
      status: 'at-risk',
      deadline: '2026-06-30',
      assignedTo: 'Team Beta',
    },
  ]),
}));

// ---------------------------------------------------------------------------
// Mocks — dossierService (assemblePacket, getDocuments)
// ---------------------------------------------------------------------------

vi.mock('@/services/suites/dossierService', () => ({
  assemblePacket: vi.fn().mockResolvedValue({ packetId: 'pkt-001', status: 'assembled' }),
  getDocuments: vi.fn().mockResolvedValue([
    { documentId: 'doc-1', name: 'Comparable Sales', type: 'pdf' },
  ]),
}));

// ---------------------------------------------------------------------------
// Mocks — fieldStore
// ---------------------------------------------------------------------------

vi.mock('@/services/fieldStore', () => ({
  fieldStore: {
    getAll: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    getUnsyncedCount: vi.fn().mockResolvedValue(0),
    getUnsyncedAll: vi.fn().mockResolvedValue([]),
    syncToBackend: vi.fn().mockResolvedValue([]),
    getByParcel: vi.fn().mockResolvedValue([]),
  },
  FieldStore: vi.fn(),
}));

vi.mock('@/services/fieldStoreV2', () => ({
  getAssignments: vi.fn().mockResolvedValue([
    {
      id: 'assignment-1',
      parcelId: 'P-123',
      parcelNumber: 'P-123',
      address: '123 Benton Ave',
      city: 'Richland',
      latitude: 46.28,
      longitude: -119.27,
      currentValue: 425000,
      propertyClass: 'Residential',
      priority: 'routine',
      status: 'assigned',
      assignedAt: '2026-04-15T16:00:00.000Z',
      inspectedAt: null,
      notes: null,
    },
  ]),
  saveAssignments: vi.fn().mockResolvedValue(undefined),
  addObservation: vi.fn().mockResolvedValue('observation-1'),
  getObservations: vi.fn().mockResolvedValue([]),
  updateAssignmentStatus: vi.fn().mockResolvedValue(undefined),
  getQueueStats: vi.fn().mockResolvedValue({ pending: 0, synced: 0, error: 0, total: 0 }),
}));

vi.mock('@/hooks/useFieldSync', () => ({
  useFieldSync: vi.fn(() => ({
    isOnline: true,
    isSyncing: false,
    lastSyncResult: null,
    lastSyncAt: null,
    progress: null,
    queueStats: { pending: 0, synced: 0, error: 0, total: 0 },
    syncNow: vi.fn().mockResolvedValue({ synced: 0, errors: 0, conflicts: 0, retried: 0 }),
    refresh: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../../components/field/InspectionPanel', () => ({
  InspectionPanel: () => <div data-testid="inspection-panel">Inspection panel</div>,
}));

vi.mock('../../components/field/SyncStatusBanner', () => ({
  SyncStatusBanner: () => <div data-testid="field-sync-banner">Sync banner</div>,
}));

vi.mock('../../components/field/PreVisitBriefingPanel', () => ({
  PreVisitBriefingPanel: () => <div data-testid="pre-visit-briefing">Briefing</div>,
}));

vi.mock('../../components/field/PostInspectionReview', () => ({
  PostInspectionReview: () => <div data-testid="post-inspection-review">Review</div>,
}));

// ---------------------------------------------------------------------------
// Imports under test
// ---------------------------------------------------------------------------

import RollReadiness from '../../pages/dais/RollReadiness';
import DefensePacket from '../../pages/dais/DefensePacket';
import FieldStudio from '../../pages/dais/FieldStudio';

// ===========================================================================
// Phase 9: Dais Operations Contract
// ===========================================================================

describe('Phase 9: Dais Operations Contract', () => {
  // -------------------------------------------------------------------------
  // RollReadiness
  // -------------------------------------------------------------------------
  describe('RollReadiness', () => {
    it('renders with data-testid="roll-readiness"', async () => {
      render(<RollReadiness />);
      expect(await screen.findByTestId('roll-readiness')).toBeInTheDocument();
    });

    it('summary cards have data-material="bento"', async () => {
      render(<RollReadiness />);
      // Wait for async cert data to load and summary cards to render
      await screen.findByTestId('readiness-summary');
      const cards = document.querySelectorAll('[data-material="bento"]');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    it('no light-mode classes in rendered output', async () => {
      const { container } = render(<RollReadiness />);
      // Wait for async data to settle
      await screen.findByTestId('roll-readiness');
      assertNoLightModeClasses(container);
    });
  });

  // -------------------------------------------------------------------------
  // DefensePacket
  // -------------------------------------------------------------------------
  describe('DefensePacket', () => {
    it('renders with data-testid="defense-packet"', () => {
      render(<DefensePacket />);
      expect(screen.getByTestId('defense-packet')).toBeInTheDocument();
    });

    it('form has data-testid="defense-form"', () => {
      render(<DefensePacket />);
      expect(screen.getByTestId('defense-form')).toBeInTheDocument();
    });

    it('no light-mode classes in rendered output', () => {
      const { container } = render(<DefensePacket />);
      assertNoLightModeClasses(container);
    });

    it('renders governed packet readiness panel', () => {
      render(<DefensePacket />);
      expect(screen.getByTestId('defense-packet-governed-brief')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // FieldStudio
  // -------------------------------------------------------------------------
  describe('FieldStudio', () => {
    it('renders with data-testid="field-studio"', async () => {
      render(<FieldStudio />);
      expect(await screen.findByTestId('field-studio')).toBeInTheDocument();
    });

    it('sync status bar has data-testid="sync-status"', async () => {
      render(<FieldStudio />);
      expect(await screen.findByTestId('sync-status')).toBeInTheDocument();
    });

    it('observation form has data-testid="observation-form"', async () => {
      render(<FieldStudio />);
      // The form appears after clicking "New Observation"
      const newObsButton = await screen.findByRole('button', { name: /new observation/i });
      newObsButton.click();
      expect(await screen.findByTestId('observation-form')).toBeInTheDocument();
    });

    it('no light-mode classes in rendered output', async () => {
      const { container } = render(<FieldStudio />);
      await screen.findByTestId('field-studio');
      assertNoLightModeClasses(container);
    });
  });
});
