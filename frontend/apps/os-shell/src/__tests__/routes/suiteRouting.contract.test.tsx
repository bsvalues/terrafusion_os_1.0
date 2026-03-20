/**
 * suiteRouting.contract.test.tsx
 *
 * Phase 14 — Operator Journey Proofing
 * =====================================
 *
 * Proves suite home components mount when navigated to their routes.
 * Uses MemoryRouter + direct component imports (not the full App Router)
 * to avoid AuthGuard redirect complexity.
 *
 * Contract:
 *   /forge  → ForgeSuiteHome mounts  (contains h1 with "TerraForge" or "Forge")
 *   /atlas  → AtlasSuiteHome mounts  (contains h1 with "TerraAtlas" or "Atlas")
 *   /dais   → DaisSuiteHome mounts   (contains h1 with "TerraDais"  or "Dais")
 *
 * @see router.tsx — suite route definitions
 * @see pages/suites/ForgeSuiteHome.tsx
 * @see pages/suites/AtlasSuiteHome.tsx
 * @see pages/suites/DaisSuiteHome.tsx
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ── Shared mocks ─────────────────────────────────────────────────────────────

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContext: vi.fn(() => ({
    isAuthenticated: true,
    userId: 'benton-assessor-test',
    countyId: 'benton',
    roles: ['assessor'],
    token: null,
  })),
  useAuthContextOptional: vi.fn(() => null),
}));

vi.mock('../../auth/useSession', () => ({
  useSession: vi.fn(() => ({
    userId: 'benton-assessor-test',
    countyId: 'benton',
    role: 'assessor',
    mode: 'pilot',
  })),
}));

vi.mock('../../auth/authPolicy', () => ({
  isDevPreviewMode: () => true,
  shouldForceLoginRedirect: () => false,
}));

vi.mock('lucide-react', () => {
  const Icon = (props: Record<string, unknown>) =>
    React.createElement('svg', { 'data-slot': 'icon', ...props });
  return new Proxy({}, { get: () => Icon });
});

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => ({
    stats: {
      totalParcels: 89247,
      parcelsByCity: {},
      parcelsByType: {},
      averageAssessedValue: 285000,
      assessedThisYear: 45000,
      pendingAssessments: 0,
      assessmentCompletionPercent: 86.5,
      activeAppeals: 0,
      totalLevyRevenue: 0,
    },
    loading: false,
    error: null,
  }),
}));

vi.mock('../../components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: (props: { modules?: unknown[] }) =>
    React.createElement(
      'div',
      { 'data-testid': 'mock-module-grid' },
      `${props.modules?.length ?? 0} modules`,
    ),
}));

vi.mock('../../components/suites/OperationalQueue', () => ({
  OperationalQueue: (props: { title?: string }) =>
    React.createElement('div', {
      'data-testid': 'mock-queue',
      'data-title': props.title,
    }),
}));

// ── Mock: ParcelContextBanner dependencies ────────────────────────────────────

vi.mock('../../context/parcelContext', () => ({
  useParcelContextStore: vi.fn(() => null),
  openWorkbenchWindow: vi.fn(),
}));

vi.mock('../../ui/materials/LiquidPanel', () => ({
  LiquidPanel: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'mock-liquid-panel' }, children),
}));

// ── Mock: DaisSuiteHome extra dependencies ────────────────────────────────────

vi.mock('../../pages/suites/useDaisSuiteStats', () => ({
  useDaisSuiteStats: () => ({
    stats: null,
    loading: false,
    error: null,
    source: null,
  }),
}));

vi.mock('../../components/dais/NoticeBatchQueuePanel', () => ({
  default: () =>
    React.createElement('div', { 'data-testid': 'mock-notice-batch-queue' }),
}));

vi.mock('../../components/dais/CertRollPanel', () => ({
  default: () =>
    React.createElement('div', { 'data-testid': 'mock-cert-roll' }),
}));

vi.mock('../../components/dais/ManagementDashboardPanel', () => ({
  default: () =>
    React.createElement('div', { 'data-testid': 'mock-management-dashboard' }),
}));

vi.mock('../../services/suites/daisService', () => ({
  getAllAppeals: vi.fn().mockResolvedValue([]),
  getCertificationStatus: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../services/suites/queueService', () => ({
  getQueueMetrics: vi.fn().mockResolvedValue(null),
}));

// ── Import subjects after mocks ───────────────────────────────────────────────

import ForgeSuiteHome from '../../pages/suites/ForgeSuiteHome';
import AtlasSuiteHome from '../../pages/suites/AtlasSuiteHome';
import DaisSuiteHome from '../../pages/suites/DaisSuiteHome';

afterEach(() => cleanup());

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderAt(path: string, Component: React.ComponentType) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={<Component />} />
      </Routes>
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('/forge → ForgeSuiteHome', () => {
  it('mounts without crashing', () => {
    const { container } = renderAt('/forge', ForgeSuiteHome);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders an h1 containing "Forge" or "TerraForge"', () => {
    renderAt('/forge', ForgeSuiteHome);
    const h1 = document.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent ?? '').toMatch(/forge/i);
  });
});

describe('/atlas → AtlasSuiteHome', () => {
  it('mounts without crashing', () => {
    const { container } = renderAt('/atlas', AtlasSuiteHome);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders an h1 containing "Atlas" or "TerraAtlas"', () => {
    renderAt('/atlas', AtlasSuiteHome);
    const h1 = document.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent ?? '').toMatch(/atlas/i);
  });
});

describe('/dais → DaisSuiteHome', () => {
  it('mounts without crashing', () => {
    const { container } = renderAt('/dais', DaisSuiteHome);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders an h1 containing "Dais" or "TerraDais"', () => {
    renderAt('/dais', DaisSuiteHome);
    const h1 = document.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent ?? '').toMatch(/dais/i);
  });
});
