import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContextRibbon } from './ContextRibbon';

describe('ContextRibbon', () => {
  // SKIP NOTE (2026-04-25): ContextRibbon's prop surface no longer
  // exposes a parcelFacts array or a 'context-ribbon-facts' landmark.
  // Inline fact compaction was moved to dedicated banner components
  // (ParcelContextBanner / forge-baseline-disclosure). Re-author against
  // those surfaces — or unsk ip if parcelFacts is reintroduced.
  it.skip('renders compact parcel facts when provided', () => {
    render(
      <ContextRibbon
        parcelId="101843040000010"
        address="123 Main St"
        owner="Jane Owner"
        countyName="Benton County"
        // @ts-expect-error parcelFacts removed from prop surface
        parcelFacts={[
          { key: 'type', label: 'Type', value: 'Residential · R1' },
        ]}
        workMode="overview"
        onWorkModeChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('context-ribbon-facts')).toBeInTheDocument();
  });

  it('does not render work mode tabs in the ribbon chrome', () => {
    render(
      <ContextRibbon
        parcelId="101843040000010"
        workMode="overview"
        onWorkModeChange={vi.fn()}
      />
    );

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByText('Valuation')).not.toBeInTheDocument();
    expect(screen.queryByText('Mapping')).not.toBeInTheDocument();
  });
});
