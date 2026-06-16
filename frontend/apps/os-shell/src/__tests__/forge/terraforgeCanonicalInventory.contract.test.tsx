import React from 'react';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, resolve, sep } from 'path';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TERRAFORGE_CANONICAL_INVENTORY,
  getTerraForgeCanonicalInventory,
} from '../../pages/suites/terraforgeCanonicalInventory';

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => ({
    stats: null,
    loading: false,
    error: null,
    source: null,
  }),
}));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector?: (s: unknown) => unknown) => {
    const state = { recentParcels: [] as unknown[], activeParcel: null };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: vi.fn(),
}));

vi.mock('../../pages/suites/SaleQualificationQueue', () => ({
  SaleQualificationQueue: () => <div data-testid="mock-sale-qualification-queue" />,
}));

vi.mock('../../pages/suites/CompsPoolBrowser', () => ({
  CompsPoolBrowser: () => null,
}));

async function renderForgeSuiteHome() {
  const { default: ForgeSuiteHome } = await import('../../pages/suites/ForgeSuiteHome');
  return render(
    <MemoryRouter>
      <ForgeSuiteHome />
    </MemoryRouter>,
  );
}

describe('TerraForge canonical inventory contract', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('freezes every June 10 primary capability in testable form', () => {
    const primaryLabels = getTerraForgeCanonicalInventory()
      .filter((capability) => capability.tier === 'primary')
      .map((capability) => capability.label);

    expect(primaryLabels).toEqual([
      'CostForge',
      'CompsForge',
      'SalesForge',
      'IncomeForge',
      'Reconciliation',
      'Calibration / QC',
      'CAMA Characteristics',
      'Valuation Notes / Defensibility',
    ]);
  });

  it('classifies primary capabilities with honest runtime posture', () => {
    const primary = getTerraForgeCanonicalInventory().filter((capability) => capability.tier === 'primary');

    expect(primary.every((capability) => capability.proofSurface === 'suite')).toBe(true);
    expect(primary.every((capability) => capability.status === 'active')).toBe(true);
    expect(primary.every((capability) => capability.moduleId)).toBe(true);
  });

  it('keeps support and deferred tools outside primary suite proof', () => {
    const supportLabels = getTerraForgeCanonicalInventory()
      .filter((capability) => capability.tier === 'support' || capability.tier === 'deferred')
      .map((capability) => capability.label);

    expect(supportLabels).toEqual([
      'Batch Cost Runs',
      'Regression Studio',
      'County Studio',
      'Coefficient Preview',
      'Current-use Support',
    ]);
    expect(supportLabels).not.toContain('TerraGAMA');
  });

  it('does not count Workbench Forge as TerraForge suite proof', () => {
    expect(TERRAFORGE_CANONICAL_INVENTORY.every((capability) => capability.proofSurface !== 'workbench')).toBe(true);
    expect(TERRAFORGE_CANONICAL_INVENTORY.every((capability) => !capability.route?.startsWith('/property/'))).toBe(true);
  });
});

describe('/forge canonical suite rendering', () => {
  it('renders every primary capability in the primary suite section', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');

    for (const capability of getTerraForgeCanonicalInventory().filter((entry) => entry.tier === 'primary')) {
      expect(within(primary).getByText(capability.label)).toBeDefined();
    }
  });

  it('renders support and deferred tools separately from primary suite proof', async () => {
    await renderForgeSuiteHome();
    const support = screen.getByTestId('forge-support-applications');
    const primary = screen.getByTestId('forge-primary-applications');

    for (const capability of getTerraForgeCanonicalInventory().filter((entry) => entry.tier !== 'primary')) {
      expect(within(support).getByText(capability.label)).toBeDefined();
      expect(within(primary).queryByText(capability.label)).toBeNull();
    }
  });

  it('does not render non-canonical extras as suite proof', async () => {
    await renderForgeSuiteHome();

    expect(screen.queryByText('TerraGAMA')).toBeNull();
    expect(screen.queryByText(/recent parcels/i)).toBeNull();
    expect(screen.queryByText(/generic dashboard/i)).toBeNull();
    expect(screen.queryByText(/queued card/i)).toBeNull();
  });
});

describe('Forge PACS boundary guard', () => {
  const repoRoot = resolve(import.meta.dirname, '../../../../../..');
  const scanRoots = [
    'frontend/apps/os-shell/src/pages/forge',
    'frontend/apps/os-shell/src/pages/suites',
    'frontend/apps/os-shell/src/services/forge',
    'frontend/apps/os-shell/src/services/suites',
  ];
  const allowedPathParts = new Set(['sync', 'provenance', 'intake', '__tests__']);
  const forbidden = /\bPACS\b|\bPacs\b|\bpacs_/;

  function listFiles(root: string): string[] {
    const absoluteRoot = resolve(repoRoot, root);
    const entries = readdirSync(absoluteRoot);
    return entries.flatMap((entry) => {
      const absolutePath = join(absoluteRoot, entry);
      const stat = statSync(absolutePath);
      if (stat.isDirectory()) {
        return listFiles(relative(repoRoot, absolutePath));
      }
      return /\.(ts|tsx)$/.test(entry) ? [absolutePath] : [];
    });
  }

  it('does not expose PACS language in Forge runtime UI or runtime service paths', () => {
    const violations = scanRoots
      .flatMap(listFiles)
      .filter((absolutePath) => {
        const pathParts = relative(repoRoot, absolutePath).split(sep);
        return !pathParts.some((part) => allowedPathParts.has(part.toLowerCase()));
      })
      .flatMap((absolutePath) => {
        const content = readFileSync(absolutePath, 'utf-8');
        return content
          .split(/\r?\n/)
          .map((line, index) => ({ absolutePath, line, lineNumber: index + 1 }))
          .filter(({ line }) => forbidden.test(line))
          .map(({ absolutePath: file, lineNumber, line }) => `${relative(repoRoot, file)}:${lineNumber}: ${line.trim()}`);
      });

    expect(violations).toEqual([]);
  });
});
