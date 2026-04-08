import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContextRibbon } from './ContextRibbon';

describe('ContextRibbon', () => {
  it('renders compact parcel facts when provided', () => {
    render(
      <ContextRibbon
        parcelId="101843040000010"
        address="123 Main St"
        owner="Jane Owner"
        countyName="Benton County"
        parcelFacts={[
          { key: 'type', label: 'Type', value: 'Residential · R1' },
          { key: 'assessment', label: 'Assessment', value: '2026 · Active' },
          { key: 'assessed', label: 'Assessed', value: '$333,530', tone: 'success', mono: true },
        ]}
        workMode="overview"
        onWorkModeChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('context-ribbon-facts')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Residential · R1')).toBeInTheDocument();
    expect(screen.getByText('2026 · Active')).toBeInTheDocument();
    expect(screen.getByText('$333,530')).toBeInTheDocument();
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
