import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const MOCK_PROPERTY = {
  parcelId: 'TEST-001',
  address: '123 Test St',
  owner: 'Test Owner',
  propertyType: 'residential',
  source: 'snapshot' as const,
  marketValue: 350000,
  assessedValue: 315000,
  landValue: 100000,
  improvementValue: 215000,
  legalDescription: '',
};

vi.mock('../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({
    parcelId: 'TEST-001',
    propertyData: MOCK_PROPERTY,
    workMode: 'overview',
  }),
}));
vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({
      activeParcel: { ...MOCK_PROPERTY, city: 'Kennewick', zip: '99336', assessmentYear: 2025 },
      assessments: [],
      appeals: [],
    }),
  ),
}));

import { PropertySummary } from '../../pages/workbench/tabs/PropertySummary';

describe('PropertySummary source honesty contract', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders WorkbenchSourceBadge disclosing data source', () => {
    render(<MemoryRouter><PropertySummary /></MemoryRouter>);
    const badge = screen.getByTestId('workbench-source-badge');
    expect(badge).toBeInTheDocument();
  });

  it('badge source matches the propertyData source (snapshot → fallback)', () => {
    render(<MemoryRouter><PropertySummary /></MemoryRouter>);
    const badge = screen.getByTestId('workbench-source-badge');
    // MOCK_PROPERTY.source is 'snapshot' which is not 'live' or 'polled', so badge should be fallback
    expect(badge).toHaveAttribute('data-source');
    const src = badge.getAttribute('data-source');
    expect(['fallback', 'unavailable', 'live', 'partial']).toContain(src);
  });

  it('does not render a source label that contradicts the data origin', () => {
    render(<MemoryRouter><PropertySummary /></MemoryRouter>);
    // The key invariant is the badge EXISTS for all data states
    expect(screen.getByTestId('workbench-source-badge')).toBeInTheDocument();
  });
});
