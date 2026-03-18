/**
 * workbench.activityFeed.test.tsx
 *
 * Phase I + Phase J: Tests for the Unified Activity Feed component.
 *
 * Contract:
 * - Renders entries with source icon, summary, timestamp
 * - Respects maxEntries limit
 * - Shows empty state when no entries
 * - Uses LiquidPanel wrapper (material quality gate)
 * - Timeline dot color matches severity
 * - Accessible: role="log", data-testid attributes
 *
 * @module __tests__/workbench/workbench.activityFeed.test
 * @see components/workbench/ActivityFeed — Component under test
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ActivityFeed, ActivityEntry } from '../../components/workbench/ActivityFeed';
import * as materialQualityGate from '../../ui/materials/materialQualityGate';
import { MaterialQuality } from '../../ui/materials/materialQualityGate';

// Mock the quality gate
vi.mock('../../ui/materials/materialQualityGate', async () => ({
  ...(await vi.importActual('../../ui/materials/materialQualityGate')),
  useMaterialQuality: vi.fn(),
}));

const mockUseMaterialQuality = materialQualityGate.useMaterialQuality as vi.MockedFunction<
  typeof materialQualityGate.useMaterialQuality
>;

const HIGH_QUALITY_STATE: materialQualityGate.MaterialQualityState = {
  tier: MaterialQuality.HIGH,
  gpuTier: 3,
  enableBackdropBlur: true,
  enableGlassDistortion: true,
  enableSprings: true,
  enableWarps: true,
  enableLoopingAnimations: true,
  prefersReducedMotion: false,
};

// ============================================================================
// Test Data
// ============================================================================

const SAMPLE_ENTRIES: ActivityEntry[] = [
  {
    id: 'a1',
    source: 'forge',
    summary: 'Market value updated to $285,000',
    timestamp: new Date(Date.now() - 5 * 60_000), // 5 min ago
    severity: 'success',
  },
  {
    id: 'a2',
    source: 'atlas',
    summary: 'Parcel boundary adjusted by GIS',
    timestamp: new Date(Date.now() - 30 * 60_000), // 30 min ago
    severity: 'info',
  },
  {
    id: 'a3',
    source: 'dais',
    summary: 'Appeal filed — hearing scheduled',
    timestamp: new Date(Date.now() - 2 * 3600_000), // 2h ago
    severity: 'warn',
  },
  {
    id: 'a4',
    source: 'dossier',
    summary: 'COD threshold exceeded — review required',
    timestamp: new Date(Date.now() - 25 * 3600_000), // 25h ago
    severity: 'danger',
  },
  {
    id: 'a5',
    source: 'os',
    summary: 'Workbench session started',
    timestamp: new Date(Date.now() - 60_000), // 1 min ago
    severity: 'info',
  },
];

// ============================================================================
// Tests
// ============================================================================

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMaterialQuality.mockReturnValue(HIGH_QUALITY_STATE);
  });

  describe('Rendering', () => {
    it('renders all provided entries', () => {
      render(<ActivityFeed entries={SAMPLE_ENTRIES} />);

      expect(screen.getByTestId('activity-entry-a1')).toBeInTheDocument();
      expect(screen.getByTestId('activity-entry-a2')).toBeInTheDocument();
      expect(screen.getByTestId('activity-entry-a3')).toBeInTheDocument();
      expect(screen.getByTestId('activity-entry-a4')).toBeInTheDocument();
      expect(screen.getByTestId('activity-entry-a5')).toBeInTheDocument();
    });

    it('displays entry summaries', () => {
      render(<ActivityFeed entries={SAMPLE_ENTRIES} />);

      expect(screen.getByText('Market value updated to $285,000')).toBeInTheDocument();
      expect(screen.getByText('Parcel boundary adjusted by GIS')).toBeInTheDocument();
      expect(screen.getByText('Appeal filed — hearing scheduled')).toBeInTheDocument();
      expect(screen.getByText('COD threshold exceeded — review required')).toBeInTheDocument();
    });

    it('renders source labels for each entry', () => {
      render(<ActivityFeed entries={[SAMPLE_ENTRIES[0], SAMPLE_ENTRIES[2]]} />);

      // Forge entry
      const forgeEntry = screen.getByTestId('activity-entry-a1');
      expect(within(forgeEntry).getByText(/Forge/)).toBeInTheDocument();

      // Dais entry
      const daisEntry = screen.getByTestId('activity-entry-a3');
      expect(within(daisEntry).getByText(/Dais/)).toBeInTheDocument();
    });

    it('renders default title', () => {
      render(<ActivityFeed entries={SAMPLE_ENTRIES} />);
      expect(screen.getByText('Activity')).toBeInTheDocument();
    });

    it('renders custom title', () => {
      render(<ActivityFeed entries={SAMPLE_ENTRIES} title="Parcel History" />);
      expect(screen.getByText('Parcel History')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows default empty message when no entries', () => {
      render(<ActivityFeed entries={[]} />);
      expect(screen.getByText('No activity for this parcel yet.')).toBeInTheDocument();
    });

    it('shows custom empty message', () => {
      render(<ActivityFeed entries={[]} emptyMessage="Nothing here." />);
      expect(screen.getByText('Nothing here.')).toBeInTheDocument();
    });
  });

  describe('maxEntries Limit', () => {
    it('limits displayed entries to maxEntries', () => {
      render(<ActivityFeed entries={SAMPLE_ENTRIES} maxEntries={2} />);

      expect(screen.getByTestId('activity-entry-a1')).toBeInTheDocument();
      expect(screen.getByTestId('activity-entry-a2')).toBeInTheDocument();
      expect(screen.queryByTestId('activity-entry-a3')).not.toBeInTheDocument();
    });

    it('defaults maxEntries to 20', () => {
      // With 5 entries and default limit of 20, all should render
      render(<ActivityFeed entries={SAMPLE_ENTRIES} />);

      const entries = SAMPLE_ENTRIES.map((e) =>
        screen.getByTestId(`activity-entry-${e.id}`)
      );
      expect(entries).toHaveLength(5);
    });
  });

  describe('Accessibility', () => {
    it('wraps entries in a role="log" container', () => {
      render(<ActivityFeed entries={SAMPLE_ENTRIES} />);
      expect(screen.getByRole('log')).toBeInTheDocument();
    });

    it('log container has aria-label matching title', () => {
      render(<ActivityFeed entries={SAMPLE_ENTRIES} title="Parcel Events" />);
      expect(screen.getByRole('log')).toHaveAttribute('aria-label', 'Parcel Events');
    });

    it('no log role when entries are empty', () => {
      render(<ActivityFeed entries={[]} />);
      expect(screen.queryByRole('log')).not.toBeInTheDocument();
    });
  });

  describe('Materials Integration', () => {
    it('renders with LiquidPanel wrapper', () => {
      const { container } = render(<ActivityFeed entries={SAMPLE_ENTRIES} />);

      const panel = container.querySelector('[data-quality-tier]');
      expect(panel).toBeInTheDocument();
    });
  });
});
