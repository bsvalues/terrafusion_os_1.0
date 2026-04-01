/**
 * Property Summary Tab — High-density assessor CAMA workbench surface
 *
 * Layout (7 blocks, tight grid):
 *   1. IDENTITY     — parcelId, address, owner, legal description
 *   2. ADMIN        — tax district, neighborhood, use code
 *   3. VALUATION    — 6-cell 2×3: assessment year, land, improvement, total, market, status
 *   4. PHYSICAL     — year built, sq ft, bedrooms, bathrooms, land acres
 *   5. LAST SALE    — date, price, days since sale
 *   6. HISTORY      — assessment history table (up to 5 rows)
 *   7. EXEMPTIONS   — amount, types (only when non-zero)
 *
 * Data honesty rules:
 *   - No vendor/system names in rendered text (harris-*, pacs_*, oltp)
 *   - assessmentYear always visible so operator knows data vintage
 *   - Null/empty fields render '—', never blank or 'undefined'
 *   - Source badge shows 'live' or 'fallback', not raw source string
 *
 * @module pages/workbench/tabs/PropertySummary
 */

import React from 'react';
import { useWorkbenchTab } from '../../../context/workbenchTabContext';
import { usePropertyStore } from '../../../stores/propertyStore';
import { WorkbenchSourceBadge } from '../../../components/workbench/WorkbenchSourceBadge';

// ─── Formatters ──────────────────────────────────────────────────────────────
const fmt = (v: number | undefined | null) => (v ? `$${v.toLocaleString()}` : '—');
const num = (v: number | undefined | null) => (v != null ? v.toLocaleString() : '—');
const dash = (v: string | number | undefined | null) => (v != null && v !== '' ? String(v) : '—');

function daysSince(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const ms = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) return 'Today';
  if (days < 365) return `${days}d ago`;
  const years = Math.floor(days / 365);
  return `${years}yr ago`;
}

// ─── Block primitives ─────────────────────────────────────────────────────────

const BlockHeader: React.FC<{ label: string; badge?: React.ReactNode }> = ({ label, badge }) => (
  <div className="flex items-center gap-2 mb-2">
    <span
      className="text-[9px] font-semibold tracking-widest uppercase"
      style={{ color: 'hsl(var(--tf-text) / 0.35)' }}
    >
      {label}
    </span>
    {badge}
  </div>
);

const Block: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    className={`rounded-lg p-3 ${className}`}
    style={{
      background: 'hsl(var(--tf-surface) / 0.25)',
      border: '1px solid hsl(var(--tf-border) / 0.12)',
    }}
  >
    {children}
  </div>
);

const Field: React.FC<{ label: string; value: React.ReactNode; mono?: boolean; accent?: string }> = ({
  label, value, mono = false, accent
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] uppercase tracking-wide" style={{ color: 'hsl(var(--tf-text) / 0.38)' }}>
      {label}
    </span>
    <span
      className={`text-sm leading-snug ${mono ? 'font-mono tabular-nums' : 'font-medium'}`}
      style={{ color: accent || 'hsl(var(--tf-text) / 0.9)' }}
    >
      {value}
    </span>
  </div>
);

// ─── Property type map ────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  residential: 'Residential', commercial: 'Commercial', industrial: 'Industrial',
  agricultural: 'Agricultural', 'vacant-land': 'Vacant Land', 'multi-family': 'Multi-Family',
  'mixed-use': 'Mixed Use', exempt: 'Exempt', other: 'Other',
  R: 'Residential', C: 'Commercial', I: 'Industrial', A: 'Agricultural', E: 'Exempt',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const PropertySummary: React.FC = () => {
  const { propertyData } = useWorkbenchTab();
  const activeParcel = usePropertyStore((s) => s.activeParcel);
  const assessments = usePropertyStore((s) => s.assessments);
  const appeals = usePropertyStore((s) => s.appeals);

  // Disclosure tier — vendor names must never appear in operator UI
  const isLiveSource = propertyData?.source === 'live' || propertyData?.source === 'polled';
  const disclosureSource: 'live' | 'fallback' = isLiveSource ? 'live' : 'fallback';

  return (
    <div className="p-3 flex flex-col gap-2.5 overflow-y-auto">

      {/* ── 1. IDENTITY ───────────────────────────────────────────────────── */}
      <Block>
        <BlockHeader label="Identity" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <Field label="Parcel ID" value={propertyData.parcelId} mono />
          <Field label="Owner" value={dash(propertyData.owner)} />
          <Field
            label="Situs Address"
            value={
              <>
                {dash(propertyData.address)}
                {activeParcel?.city && (
                  <span className="text-xs ml-1" style={{ color: 'hsl(var(--tf-text) / 0.45)' }}>
                    {activeParcel.city}{activeParcel.zip ? `, ${activeParcel.zip}` : ''}
                  </span>
                )}
              </>
            }
          />
          <Field
            label="Property Type"
            value={`${TYPE_LABELS[propertyData.propertyType] || propertyData.propertyType || '—'}${activeParcel?.landUseDescription ? ` · ${activeParcel.landUseDescription}` : ''}`}
          />
          {propertyData.legalDescription && (
            <div className="col-span-2 flex flex-col gap-0.5 pt-0.5">
              <span className="text-[10px] uppercase tracking-wide" style={{ color: 'hsl(var(--tf-text) / 0.38)' }}>
                Legal Description
              </span>
              <span className="text-xs font-mono leading-relaxed" style={{ color: 'hsl(var(--tf-text) / 0.7)' }}>
                {propertyData.legalDescription}
              </span>
            </div>
          )}
        </div>
      </Block>

      {/* ── 2. ADMINISTRATIVE ─────────────────────────────────────────────── */}
      {activeParcel && (
        <Block>
          <BlockHeader label="Administrative" />
          <div className="grid grid-cols-3 gap-x-4 gap-y-2.5">
            <Field
              label="Tax District"
              value={
                activeParcel.taxDistrictName
                  ? `${activeParcel.taxDistrictName}${activeParcel.taxDistrictCode ? ` (${activeParcel.taxDistrictCode})` : ''}`
                  : '—'
              }
            />
            <Field label="Neighborhood" value={dash(activeParcel.neighborhood)} />
            <Field
              label="Use Code"
              value={
                activeParcel.propertyUseCode
                  ? `${activeParcel.propertyUseCode}${activeParcel.landUseDescription ? ` · ${activeParcel.landUseDescription}` : ''}`
                  : '—'
              }
            />
          </div>
        </Block>
      )}

      {/* ── 3. VALUATION ──────────────────────────────────────────────────── */}
      <Block>
        <BlockHeader
          label={
            activeParcel?.assessmentYear
              ? `Valuation · Assessment Year ${activeParcel.assessmentYear}`
              : 'Valuation'
          }
          badge={<WorkbenchSourceBadge source={disclosureSource} />}
        />
        <div className="grid grid-cols-3 gap-x-4 gap-y-2.5">
          <Field
            label="Market Value"
            value={fmt(propertyData.marketValue)}
            mono
            accent="hsl(var(--tf-transcend-cyan-hs) 65%)"
          />
          <Field label="Land Value" value={fmt(propertyData.landValue)} mono />
          <Field label="Improvement Value" value={fmt(propertyData.improvementValue)} mono />
          <Field
            label="Assessed Value"
            value={fmt(propertyData.assessedValue)}
            mono
            accent="hsl(var(--tf-success))"
          />
          <Field label="Assessment Year" value={dash(activeParcel?.assessmentYear)} mono />
          <Field
            label="Status"
            value={dash(activeParcel?.assessmentStatus)}
            accent={
              activeParcel?.assessmentStatus === 'certified'
                ? 'hsl(var(--tf-success))'
                : undefined
            }
          />
        </div>
        {/* Provenance — honest vintage, no vendor names */}
        {activeParcel?.assessmentYear && (
          <p className="mt-2 text-[10px]" style={{ color: 'hsl(var(--tf-text) / 0.3)' }}>
            Historical assessment snapshot · Data vintage: {activeParcel.assessmentYear}
          </p>
        )}
      </Block>

      {/* ── 4. PHYSICAL CHARACTERISTICS ───────────────────────────────────── */}
      {activeParcel && (
        <Block>
          <BlockHeader label="Physical Characteristics" />
          <div className="grid grid-cols-5 gap-x-4 gap-y-2.5">
            <Field label="Year Built" value={dash(activeParcel.yearBuilt)} mono />
            <Field label="Sq Ft" value={num(activeParcel.buildingSquareFeet)} mono />
            <Field label="Bedrooms" value={dash(activeParcel.bedrooms)} mono />
            <Field label="Bathrooms" value={dash(activeParcel.bathrooms)} mono />
            <Field label="Land Acres" value={activeParcel.landAcreage ? activeParcel.landAcreage.toFixed(2) : '—'} mono />
          </div>
        </Block>
      )}

      {/* ── 5. LAST SALE ──────────────────────────────────────────────────── */}
      {activeParcel?.lastSaleDate && (
        <Block>
          <BlockHeader label="Last Sale" badge={<WorkbenchSourceBadge source={disclosureSource} />} />
          <div className="grid grid-cols-3 gap-x-4 gap-y-2.5">
            <Field
              label="Sale Date"
              value={
                <>
                  {new Date(activeParcel.lastSaleDate).toLocaleDateString()}
                  <span className="ml-1.5 text-[10px]" style={{ color: 'hsl(var(--tf-text) / 0.4)' }}>
                    {daysSince(activeParcel.lastSaleDate)}
                  </span>
                </>
              }
            />
            <Field label="Sale Price" value={fmt(activeParcel.lastSalePrice)} mono />
          </div>
        </Block>
      )}

      {/* ── 6. ASSESSMENT HISTORY ─────────────────────────────────────────── */}
      {assessments.length > 0 && (
        <Block>
          <BlockHeader label="Assessment History" />
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs" style={{ color: 'hsl(var(--tf-text) / 0.85)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                  {['Year', 'Land', 'Improvement', 'Total', 'Market', 'Taxable'].map((h) => (
                    <th
                      key={h}
                      className={`py-1.5 px-2 font-medium ${h === 'Year' ? 'text-left' : 'text-right'}`}
                      style={{ color: 'hsl(var(--tf-text) / 0.45)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assessments.slice(0, 5).map((a) => (
                  <tr key={a.assessmentId} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.07)' }}>
                    <td className="py-1.5 px-2 font-mono font-medium">{a.assessmentYear}</td>
                    <td className="py-1.5 px-2 text-right font-mono">{fmt(a.landValue)}</td>
                    <td className="py-1.5 px-2 text-right font-mono">{fmt(a.improvementValue)}</td>
                    <td className="py-1.5 px-2 text-right font-mono font-medium">{fmt(a.totalAssessedValue)}</td>
                    <td className="py-1.5 px-2 text-right font-mono">{fmt(a.marketValue)}</td>
                    <td className="py-1.5 px-2 text-right font-mono">{fmt(a.taxableValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>
      )}

      {/* ── 7. EXEMPTIONS ─────────────────────────────────────────────────── */}
      {activeParcel && activeParcel.exemptionAmount > 0 && (
        <Block>
          <BlockHeader label="Exemptions" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            <Field
              label="Exemption Amount"
              value={fmt(activeParcel.exemptionAmount)}
              mono
              accent="hsl(var(--tf-warning, 45 90% 55%))"
            />
            <Field
              label="Exemption Types"
              value={activeParcel.exemptionTypes?.length ? activeParcel.exemptionTypes.join(', ') : '—'}
            />
          </div>
        </Block>
      )}

      {/* ── FLAGS: Appeals + Permits ───────────────────────────────────────── */}
      {activeParcel && (activeParcel.hasAppeals || activeParcel.hasActivePermits) && (
        <Block>
          <BlockHeader label="Active Flags" />
          <div className="flex flex-wrap gap-2">
            {activeParcel.hasAppeals && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: 'hsl(var(--tf-error, 0 80% 60%) / 0.15)',
                  color: 'hsl(var(--tf-error, 0 80% 60%))',
                }}
              >
                {appeals.length} Appeal{appeals.length !== 1 ? 's' : ''} on record
              </span>
            )}
            {activeParcel.hasActivePermits && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: 'hsl(var(--tf-info, 200 80% 60%) / 0.15)',
                  color: 'hsl(var(--tf-info, 200 80% 60%))',
                }}
              >
                Active permits
              </span>
            )}
          </div>
        </Block>
      )}

    </div>
  );
};

export default PropertySummary;
