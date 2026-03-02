/**
 * Property Summary Tab - Overview of parcel data
 *
 * Displays real PACS assessment breakdown using BentoGrid layout:
 * - Identity cards (Parcel ID, Address, Owner, Property Type)
 * - Valuation breakdown (Market, Assessed, Land, Improvement)
 * - Legal description
 * - Quick actions + data source
 *
 * Phase D: First BentoGrid adoption in the workbench.
 *
 * @module pages/workbench/tabs/PropertySummary
 * @see ui/materials/BentoGrid — Grid layout component
 * @see ui/materials/BentoCard — Card container component
 */

import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { BentoGrid } from '../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../ui/materials/BentoCard';

interface PropertyContext {
  parcelId: string;
  propertyData: {
    parcelId: string;
    address: string;
    owner: string;
    assessedValue: number;
    marketValue: number;
    landValue: number;
    improvementValue: number;
    propertyType: string;
    legalDescription: string;
    source: string;
  };
}

const fmt = (v: number) => v ? `$${v.toLocaleString()}` : '—';

const typeLabels: Record<string, string> = {
  R: 'Residential',
  C: 'Commercial',
  I: 'Industrial',
  A: 'Agricultural',
  E: 'Exempt',
};

export const PropertySummary: React.FC = () => {
  const { propertyData } = useOutletContext<PropertyContext>();

  return (
    <div className="space-y-6 p-1">
      {/* Identity Grid */}
      <BentoGrid columns={4} gap={0.75} padding={0}>
        <BentoCard variant="stat" title="Parcel ID">
          <p className="text-xl font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
            {propertyData.parcelId}
          </p>
        </BentoCard>
        <BentoCard variant="stat" title="Address">
          <p className="text-xl font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
            {propertyData.address || '—'}
          </p>
        </BentoCard>
        <BentoCard variant="stat" title="Owner">
          <p className="text-xl font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
            {propertyData.owner || '—'}
          </p>
        </BentoCard>
        <BentoCard variant="stat" title="Property Type">
          <p className="text-xl font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
            {typeLabels[propertyData.propertyType] || propertyData.propertyType || '—'}
          </p>
        </BentoCard>
      </BentoGrid>

      {/* Valuation Breakdown */}
      <BentoGrid columns={4} gap={0.75} padding={0}>
        <BentoCard variant="stat" title="Market Value" promote>
          <p
            className="text-2xl font-bold"
            style={{ color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}
          >
            {fmt(propertyData.marketValue)}
          </p>
        </BentoCard>
        <BentoCard variant="stat" title="Assessed Value" promote>
          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-success))' }}>
            {fmt(propertyData.assessedValue)}
          </p>
        </BentoCard>
        <BentoCard variant="stat" title="Land Value">
          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-text))' }}>
            {fmt(propertyData.landValue)}
          </p>
        </BentoCard>
        <BentoCard variant="stat" title="Improvement Value">
          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-text))' }}>
            {fmt(propertyData.improvementValue)}
          </p>
        </BentoCard>
      </BentoGrid>

      {/* Legal Description + Quick Actions */}
      <BentoGrid columns={2} gap={0.75} padding={0}>
        {propertyData.legalDescription && (
          <BentoCard variant="table" title="Legal Description">
            <p
              className="text-sm leading-relaxed font-mono"
              style={{ color: 'hsl(var(--tf-text) / 0.9)' }}
            >
              {propertyData.legalDescription}
            </p>
          </BentoCard>
        )}
        <BentoCard
          variant="form"
          title="Quick Actions"
          actions={
            propertyData.source ? (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  color: 'hsl(var(--tf-text) / 0.4)',
                  background: 'hsl(var(--tf-surface) / 0.3)',
                }}
              >
                Source: {propertyData.source}
              </span>
            ) : undefined
          }
        >
          <div className="flex flex-wrap gap-2">
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: 'hsl(var(--tf-transcend-cyan-hs) 50%)',
                color: 'hsl(var(--tf-bg))',
              }}
            >
              View on Map
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: 'hsl(var(--tf-surface) / 0.3)',
                color: 'hsl(var(--tf-text) / 0.8)',
              }}
            >
              Generate Report
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: 'hsl(var(--tf-surface) / 0.3)',
                color: 'hsl(var(--tf-text) / 0.8)',
              }}
            >
              View History
            </button>
          </div>
        </BentoCard>
      </BentoGrid>
    </div>
  );
};

export default PropertySummary;
