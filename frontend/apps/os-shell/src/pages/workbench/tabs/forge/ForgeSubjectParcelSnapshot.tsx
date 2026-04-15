import React from 'react';
import { useWorkbenchTab } from '../../../../context/workbenchTabContext';
import { usePropertyStore } from '../../../../stores/propertyStore';
import { WorkbenchSourceBadge } from '../../../../components/workbench/WorkbenchSourceBadge';
import {
  formatAcreage,
  formatAssessmentStatus,
  formatCurrencyValue,
  formatIntegerValue,
  formatLastSale,
  formatPropertyType,
  formatTaxDistrict,
  toDisclosureSource,
} from '../../../../components/workbench/parcelContextFacts';

const dash = (value?: string | number | null): string =>
  value != null && value !== '' ? String(value) : '-';

const SnapshotSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="tf-panel rounded-xl p-3 space-y-3">
    <div className="text-[10px] font-semibold uppercase tracking-widest tf-text-tertiary">
      {title}
    </div>
    {children}
  </div>
);

const SnapshotField: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'default' | 'accent' | 'success';
}> = ({ label, value, mono = false, tone = 'default' }) => {
  const color =
    tone === 'success'
      ? 'hsl(var(--tf-success))'
      : tone === 'accent'
        ? 'hsl(var(--tf-transcend-cyan-hs) 70%)'
        : 'hsl(var(--tf-text) / 0.9)';

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] uppercase tracking-wide tf-text-tertiary">
        {label}
      </span>
      <span
        className={`text-sm leading-snug truncate ${mono ? 'font-mono tabular-nums' : 'font-medium'}`}
        style={{ color }}
        title={value}
      >
        {value}
      </span>
    </div>
  );
};

export const ForgeSubjectParcelSnapshot: React.FC = () => {
  const { parcelId, propertyData } = useWorkbenchTab();
  const activeParcel = usePropertyStore((s) => s.activeParcel);
  const appeals = usePropertyStore((s) => s.appeals);

  const disclosureSource = toDisclosureSource(activeParcel?.dataSource ?? propertyData?.source);
  const typeLabel = formatPropertyType(activeParcel?.propertyType ?? propertyData?.propertyType);
  const useCode = activeParcel?.propertyUseCode || activeParcel?.landUseDescription || '-';
  const district = formatTaxDistrict(activeParcel?.taxDistrictName, activeParcel?.taxDistrictCode) ?? '-';
  const assessment = activeParcel
    ? `${activeParcel.assessmentYear} · ${formatAssessmentStatus(activeParcel.assessmentStatus)}`
    : '-';
  const lastSale = formatLastSale(activeParcel?.lastSaleDate, activeParcel?.lastSalePrice) ?? '-';

  return (
    <section className="tf-panel rounded-xl p-4 space-y-4" data-testid="forge-subject-parcel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-widest tf-text-tertiary">
            Subject Parcel
          </div>
          <div className="mt-1 text-base font-semibold tf-text">{parcelId}</div>
          <div className="text-sm tf-text-secondary truncate" title={propertyData?.address || activeParcel?.address || '-'}>
            {propertyData?.address || activeParcel?.address || '-'}
          </div>
          <div className="text-xs tf-text-tertiary truncate" title={propertyData?.owner || activeParcel?.ownerName || '-'}>
            {propertyData?.owner || activeParcel?.ownerName || '-'}
          </div>
        </div>
        <WorkbenchSourceBadge source={disclosureSource} className="shrink-0" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <SnapshotSection title="Classification">
          <div className="grid grid-cols-2 gap-3">
            <SnapshotField label="Parcel ID" value={parcelId} mono />
            <SnapshotField label="Property Type" value={typeLabel} />
            <SnapshotField label="Use Code" value={useCode} />
            <SnapshotField label="Neighborhood" value={dash(activeParcel?.neighborhood)} />
            <SnapshotField label="Tax District" value={district} />
            <SnapshotField label="Assessment" value={assessment} />
          </div>
        </SnapshotSection>

        <SnapshotSection title="Physical">
          <div className="grid grid-cols-2 gap-3">
            <SnapshotField label="Year Built" value={activeParcel?.yearBuilt ? String(activeParcel.yearBuilt) : '-'} mono />
            <SnapshotField label="GLA (Sq Ft)" value={activeParcel?.buildingSquareFeet ? formatIntegerValue(activeParcel.buildingSquareFeet) : '-'} mono />
            <SnapshotField label="Land Acres" value={activeParcel?.landAcreage ? formatAcreage(activeParcel.landAcreage) : '-'} mono />
            <SnapshotField label="Zoning" value={dash(activeParcel?.zoning)} />
            <SnapshotField label="Bedrooms" value={activeParcel?.bedrooms != null ? String(activeParcel.bedrooms) : '-'} mono />
            <SnapshotField label="Bathrooms" value={activeParcel?.bathrooms != null ? String(activeParcel.bathrooms) : '-'} mono />
            <div className="col-span-2">
              <SnapshotField label="Last Sale" value={lastSale} mono={lastSale.includes('$')} />
            </div>
          </div>
        </SnapshotSection>

        <SnapshotSection title="Value">
          <div className="grid grid-cols-2 gap-3">
            <SnapshotField
              label="Land Value"
              value={formatCurrencyValue(activeParcel?.landValue ?? propertyData?.landValue)}
              mono
            />
            <SnapshotField
              label="Improvement Value"
              value={formatCurrencyValue(activeParcel?.improvementValue ?? propertyData?.improvementValue)}
              mono
            />
            <SnapshotField
              label="Assessed Value"
              value={formatCurrencyValue(activeParcel?.totalAssessedValue ?? propertyData?.assessedValue)}
              mono
              tone="success"
            />
            <SnapshotField
              label="Market Value"
              value={formatCurrencyValue(activeParcel?.marketValue ?? propertyData?.marketValue)}
              mono
              tone="accent"
            />
            <SnapshotField
              label="Exemption"
              value={formatCurrencyValue(activeParcel?.exemptionAmount)}
              mono
            />
            <SnapshotField
              label="Taxable Value"
              value={formatCurrencyValue(activeParcel?.taxableValue)}
              mono
            />
          </div>
        </SnapshotSection>
      </div>

      {(activeParcel?.hasAppeals || activeParcel?.hasActivePermits || (activeParcel?.exemptionAmount ?? 0) > 0) && (
        <div className="flex flex-wrap gap-2">
          {activeParcel?.hasAppeals && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: 'hsl(var(--tf-error, 0 80% 60%) / 0.12)',
                color: 'hsl(var(--tf-error, 0 80% 60%))',
              }}
            >
              {appeals.length > 0 ? `${appeals.length} appeal${appeals.length === 1 ? '' : 's'} on record` : 'Appeal on record'}
            </span>
          )}
          {activeParcel?.hasActivePermits && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: 'hsl(var(--tf-info, 200 80% 60%) / 0.12)',
                color: 'hsl(var(--tf-info, 200 80% 60%))',
              }}
            >
              Active permits
            </span>
          )}
          {(activeParcel?.exemptionAmount ?? 0) > 0 && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: 'hsl(var(--tf-warning, 45 90% 55%) / 0.12)',
                color: 'hsl(var(--tf-warning, 45 90% 55%))',
              }}
            >
              Exemption {formatCurrencyValue(activeParcel?.exemptionAmount)}
            </span>
          )}
        </div>
      )}
    </section>
  );
};

export default ForgeSubjectParcelSnapshot;
