/**
 * PropertySummary.honesty.test.tsx
 *
 * TDD honesty-pass: every assessment/value claim in PropertySummary must
 * carry a WorkbenchSourceBadge so the user knows whether data was
 * returned from a live backend or is demo/fallback data.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/* ── fixtures ──────────────────────────────────────────────────── */
const MOCK_PROPERTY = {
  parcelId: 'HON-001',
  address: '456 Honesty Ln',
  owner: 'Honesty Owner',
  propertyType: 'residential',
  source: 'snapshot' as const,
  marketValue: 350000,
  assessedValue: 315000,
  landValue: 100000,
  improvementValue: 215000,
  legalDescription: 'LOT 1 BLK 2',
};

const MOCK_ASSESSMENTS = [
  {
    assessmentId: 'A-1',
    assessmentYear: 2024,
    landValue: 95000,
    improvementValue: 200000,
    totalAssessedValue: 295000,
    marketValue: 330000,
    taxableValue: 290000,
  },
  {
    assessmentId: 'A-2',
    assessmentYear: 2023,
    landValue: 90000,
    improvementValue: 190000,
    totalAssessedValue: 280000,
    marketValue: 310000,
    taxableValue: 275000,
  },
];

/* ── mocks ─────────────────────────────────────────────────────── */
vi.mock('../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({
    parcelId: 'HON-001',
    propertyData: MOCK_PROPERTY,
    workMode: 'overview',
  }),
}));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({
      activeParcel: {
        ...MOCK_PROPERTY,
        city: 'Kennewick',
        zip: '99336',
        assessmentYear: 2025,
        assessmentStatus: 'Final',
        yearBuilt: 1998,
        buildingSquareFeet: 2200,
        landAcreage: 0.25,
        hasActivePermits: false,
        hasAppeals: false,
        exemptionAmount: 5000,
        exemptionTypes: ['Senior'],
        lastSaleDate: '2021-06-15',
        lastSalePrice: 275000,
        taxDistrictName: 'Kennewick',
        taxDistrictCode: 'KC-01',
        landUseDescription: 'Single Family',
      },
      assessments: MOCK_ASSESSMENTS,
      appeals: [],
    }),
  ),
}));

import { PropertySummary } from '../../pages/workbench/tabs/PropertySummary';

/* ── helpers ───────────────────────────────────────────────────── */
function renderSummary() {
  return render(
    <MemoryRouter>
      <PropertySummary />
    </MemoryRouter>,
  );
}

/* ── tests ─────────────────────────────────────────────────────── */
describe('PropertySummary honesty pass — source disclosure on value claims', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders at least one WorkbenchSourceBadge for valuation cards', () => {
    renderSummary();
    const badges = screen.getAllByTestId('workbench-source-badge');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('Assessed Value card carries a source badge', () => {
    renderSummary();
    // Find the Assessed Value heading, then look for a badge sibling
    const assessedHeading = screen.getByText('Assessed Value');
    const card = assessedHeading.closest('[data-slot="bento-card"]') || assessedHeading.parentElement!.parentElement!;
    const badge = card.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).not.toBeNull();
  });

  it('Land Value card carries a source badge', () => {
    renderSummary();
    const heading = screen.getByText('Land Value');
    const card = heading.closest('[data-slot="bento-card"]') || heading.parentElement!.parentElement!;
    const badge = card.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).not.toBeNull();
  });

  it('Improvement Value card carries a source badge', () => {
    renderSummary();
    const heading = screen.getByText('Improvement Value');
    const card = heading.closest('[data-slot="bento-card"]') || heading.parentElement!.parentElement!;
    const badge = card.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).not.toBeNull();
  });

  it('Assessment History table carries a source badge', () => {
    renderSummary();
    const heading = screen.getByText('Assessment History');
    const card = heading.closest('[data-slot="bento-card"]') || heading.parentElement!.parentElement!;
    const badge = card.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).not.toBeNull();
  });

  it('Exemptions card carries a source badge when exemptionAmount > 0', () => {
    renderSummary();
    const heading = screen.getByText('Exemptions');
    const card = heading.closest('[data-slot="bento-card"]') || heading.parentElement!.parentElement!;
    const badge = card.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).not.toBeNull();
  });

  it('Last Sale Price card carries a source badge', () => {
    renderSummary();
    const heading = screen.getByText('Last Sale Price');
    const card = heading.closest('[data-slot="bento-card"]') || heading.parentElement!.parentElement!;
    const badge = card.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).not.toBeNull();
  });

  it('all source badges use honest wording (no "from server" or unqualified claims)', () => {
    renderSummary();
    const badges = screen.getAllByTestId('workbench-source-badge');
    badges.forEach((badge) => {
      const text = badge.textContent ?? '';
      // Must be one of the canonical labels
      expect(text).toMatch(/^(Live|Demo data|Partial|Unavailable)/);
    });
  });
});
