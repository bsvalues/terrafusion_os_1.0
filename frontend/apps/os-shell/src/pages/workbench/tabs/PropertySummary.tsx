/**
 * Property Summary Tab - Overview of parcel data
 *
 * Displays real assessment data using BentoGrid layout:
 * - Identity cards (Parcel ID, Address, Owner, Property Type)
 * - Valuation breakdown (Market, Assessed, Land, Improvement)
 * - Property details (Year Built, SqFt, Acreage, Assessment Year)
 * - Assessment history mini-table
 * - Legal description + status flags
 *
 * Data flows from propertyStore (snapshot/live/fixtures) via useWorkbenchTab context
 * and direct store subscription for richer data (assessments, flags).
 *
 * @module pages/workbench/tabs/PropertySummary
 */

import React from 'react';
import { useWorkbenchTab } from '../../../context/workbenchTabContext';
import { usePropertyStore } from '../../../stores/propertyStore';
import { BentoGrid } from '../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../ui/materials/BentoCard';

const fmt = (v: number) => (v ? `$${v.toLocaleString()}` : '—');
const num = (v: number | undefined) => (v != null ? v.toLocaleString() : '—');

const typeLabels: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  agricultural: 'Agricultural',
  'vacant-land': 'Vacant Land',
  'multi-family': 'Multi-Family',
  'mixed-use': 'Mixed Use',
  exempt: 'Exempt',
  other: 'Other',
  // Legacy PACS codes
  R: 'Residential',
  C: 'Commercial',
  I: 'Industrial',
  A: 'Agricultural',
  E: 'Exempt',
};

export const PropertySummary: React.FC = () => {
  const { propertyData } = useWorkbenchTab();

  // Richer data from store (eagerly loaded on parcel selection)
  const activeParcel = usePropertyStore((s) => s.activeParcel);
  const assessments = usePropertyStore((s) => s.assessments);
  const appeals = usePropertyStore((s) => s.appeals);

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
          {activeParcel && (
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
              {activeParcel.city}{activeParcel.zip ? `, ${activeParcel.zip}` : ''}
            </p>
          )}
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
          {activeParcel?.landUseDescription && (
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
              {activeParcel.landUseDescription}
            </p>
          )}
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

      {/* Property Details — from full Property record */}
      {activeParcel && (
        <BentoGrid columns={4} gap={0.75} padding={0}>
          <BentoCard variant="stat" title="Year Built">
            <p className="text-xl font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
              {activeParcel.yearBuilt || '—'}
            </p>
          </BentoCard>
          <BentoCard variant="stat" title="Building SqFt">
            <p className="text-xl font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
              {num(activeParcel.buildingSquareFeet)}
            </p>
          </BentoCard>
          <BentoCard variant="stat" title="Land Acreage">
            <p className="text-xl font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
              {activeParcel.landAcreage ? activeParcel.landAcreage.toFixed(2) : '—'}
            </p>
          </BentoCard>
          <BentoCard variant="stat" title="Assessment Year">
            <p className="text-xl font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
              {activeParcel.assessmentYear}
            </p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
              Status: {activeParcel.assessmentStatus}
            </p>
          </BentoCard>
        </BentoGrid>
      )}

      {/* Status Flags + Exemptions */}
      {activeParcel && (activeParcel.hasActivePermits || activeParcel.hasAppeals || (activeParcel.exemptionAmount > 0)) && (
        <BentoGrid columns={3} gap={0.75} padding={0}>
          {activeParcel.exemptionAmount > 0 && (
            <BentoCard variant="stat" title="Exemptions">
              <p className="text-lg font-bold" style={{ color: 'hsl(var(--tf-warning, 45 90% 55%))' }}>
                {fmt(activeParcel.exemptionAmount)}
              </p>
              {activeParcel.exemptionTypes && (
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                  {activeParcel.exemptionTypes.join(', ')}
                </p>
              )}
            </BentoCard>
          )}
          {activeParcel.hasAppeals && (
            <BentoCard variant="stat" title="Active Appeals">
              <p className="text-lg font-bold" style={{ color: 'hsl(var(--tf-error, 0 80% 60%))' }}>
                {appeals.length} appeal{appeals.length !== 1 ? 's' : ''}
              </p>
            </BentoCard>
          )}
          {activeParcel.hasActivePermits && (
            <BentoCard variant="stat" title="Permits">
              <p className="text-lg font-bold" style={{ color: 'hsl(var(--tf-info, 200 80% 60%))' }}>
                Active permits on file
              </p>
            </BentoCard>
          )}
        </BentoGrid>
      )}

      {/* Assessment History — from eagerly loaded store data */}
      {assessments.length > 0 && (
        <BentoCard variant="table" title="Assessment History">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: 'hsl(var(--tf-text) / 0.9)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                  <th className="text-left py-2 px-3 font-medium">Year</th>
                  <th className="text-right py-2 px-3 font-medium">Land</th>
                  <th className="text-right py-2 px-3 font-medium">Improvement</th>
                  <th className="text-right py-2 px-3 font-medium">Total</th>
                  <th className="text-right py-2 px-3 font-medium">Market</th>
                  <th className="text-right py-2 px-3 font-medium">Taxable</th>
                </tr>
              </thead>
              <tbody>
                {assessments.slice(0, 5).map((a) => (
                  <tr
                    key={a.assessmentId}
                    style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.08)' }}
                  >
                    <td className="py-2 px-3 font-medium">{a.assessmentYear}</td>
                    <td className="py-2 px-3 text-right">{fmt(a.landValue)}</td>
                    <td className="py-2 px-3 text-right">{fmt(a.improvementValue)}</td>
                    <td className="py-2 px-3 text-right font-medium">{fmt(a.totalAssessedValue)}</td>
                    <td className="py-2 px-3 text-right">{fmt(a.marketValue)}</td>
                    <td className="py-2 px-3 text-right">{fmt(a.taxableValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      )}

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

      {/* Sale History — if available */}
      {activeParcel?.lastSaleDate && (
        <BentoGrid columns={2} gap={0.75} padding={0}>
          <BentoCard variant="stat" title="Last Sale Date">
            <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
              {new Date(activeParcel.lastSaleDate).toLocaleDateString()}
            </p>
          </BentoCard>
          <BentoCard variant="stat" title="Last Sale Price">
            <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
              {activeParcel.lastSalePrice ? fmt(activeParcel.lastSalePrice) : '—'}
            </p>
          </BentoCard>
        </BentoGrid>
      )}

      {/* Tax District */}
      {activeParcel?.taxDistrictName && (
        <BentoCard variant="stat" title="Tax District">
          <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
            {activeParcel.taxDistrictName}
          </p>
          {activeParcel.taxDistrictCode && (
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
              Code: {activeParcel.taxDistrictCode}
            </p>
          )}
        </BentoCard>
      )}
    </div>
  );
};

export default PropertySummary;
