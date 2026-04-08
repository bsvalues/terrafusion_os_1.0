import type { Property } from '../../types/domain';

export interface ContextRibbonFact {
  key: string;
  label: string;
  value: string;
  tone?: 'default' | 'accent' | 'success' | 'warn';
  mono?: boolean;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const integerFormatter = new Intl.NumberFormat('en-US');
const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'numeric',
  day: 'numeric',
  year: 'numeric',
});

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  agricultural: 'Agricultural',
  'vacant-land': 'Vacant Land',
  'multi-family': 'Multi-Family',
  'mixed-use': 'Mixed Use',
  exempt: 'Exempt',
  other: 'Other',
  R: 'Residential',
  C: 'Commercial',
  I: 'Industrial',
  A: 'Agricultural',
  E: 'Exempt',
};

const ASSESSMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  'under-review': 'Under Review',
  appealed: 'Appealed',
  exempt: 'Exempt',
  pending: 'Pending',
  sealed: 'Sealed',
  certified: 'Certified',
};

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

export function formatPropertyType(propertyType?: string | null): string {
  if (!propertyType) return '-';
  return PROPERTY_TYPE_LABELS[propertyType] ?? propertyType;
}

export function formatAssessmentStatus(status?: string | null): string {
  if (!status) return '-';
  return ASSESSMENT_STATUS_LABELS[status] ?? status;
}

export function formatCurrencyValue(value?: number | null): string {
  return value != null ? currencyFormatter.format(value) : '-';
}

export function formatIntegerValue(value?: number | null): string {
  return value != null ? integerFormatter.format(value) : '-';
}

export function formatAcreage(value?: number | null): string {
  if (value == null) return '-';
  return value >= 10 ? value.toFixed(1) : value.toFixed(2);
}

export function formatTaxDistrict(
  taxDistrictName?: string | null,
  taxDistrictCode?: string | null,
): string | null {
  if (taxDistrictName && taxDistrictCode) {
    return `${taxDistrictName} (${taxDistrictCode})`;
  }
  return taxDistrictName || taxDistrictCode || null;
}

export function formatLastSale(
  saleDate?: string | null,
  salePrice?: number | null,
): string | null {
  if (!saleDate && salePrice == null) return null;
  const parts: string[] = [];
  if (saleDate) {
    const parsed = new Date(saleDate);
    parts.push(Number.isNaN(parsed.getTime()) ? saleDate : shortDateFormatter.format(parsed));
  }
  if (salePrice != null) {
    parts.push(formatCurrencyValue(salePrice));
  }
  return parts.join(' · ');
}

export function toDisclosureSource(dataSource?: string | null): 'live' | 'fallback' {
  const normalized = (dataSource ?? '').toLowerCase();
  if (
    normalized === 'live' ||
    normalized === 'polled' ||
    normalized.includes('live') ||
    normalized.includes('snapshot-live')
  ) {
    return 'live';
  }
  return 'fallback';
}

export function buildContextRibbonFacts(parcel?: Property | null): ContextRibbonFact[] {
  if (!parcel) return [];

  const facts: ContextRibbonFact[] = [];

  const classificationParts = [
    formatPropertyType(parcel.propertyType),
    parcel.propertyUseCode,
  ].filter(Boolean);

  if (classificationParts.length > 0) {
    facts.push({
      key: 'classification',
      label: 'Type',
      value: classificationParts.join(' · '),
    });
  }

  if (hasValue(parcel.neighborhood)) {
    facts.push({
      key: 'neighborhood',
      label: 'Neighborhood',
      value: String(parcel.neighborhood),
    });
  }

  const district = formatTaxDistrict(parcel.taxDistrictName, parcel.taxDistrictCode);
  if (district) {
    facts.push({
      key: 'district',
      label: 'District',
      value: district,
    });
  }

  const assessmentSummary = [
    hasValue(parcel.assessmentYear) ? String(parcel.assessmentYear) : null,
    formatAssessmentStatus(parcel.assessmentStatus),
  ].filter(Boolean);
  if (assessmentSummary.length > 0) {
    facts.push({
      key: 'assessment',
      label: 'Assessment',
      value: assessmentSummary.join(' · '),
    });
  }

  if (parcel.totalAssessedValue > 0) {
    facts.push({
      key: 'assessed',
      label: 'Assessed',
      value: formatCurrencyValue(parcel.totalAssessedValue),
      tone: 'success',
      mono: true,
    });
  }

  if (parcel.marketValue > 0) {
    facts.push({
      key: 'market',
      label: 'Market',
      value: formatCurrencyValue(parcel.marketValue),
      tone: 'accent',
      mono: true,
    });
  }

  if (parcel.buildingSquareFeet > 0) {
    facts.push({
      key: 'square-feet',
      label: 'Sq Ft',
      value: formatIntegerValue(parcel.buildingSquareFeet),
      mono: true,
    });
  }

  if (parcel.landAcreage > 0) {
    facts.push({
      key: 'acreage',
      label: 'Acres',
      value: formatAcreage(parcel.landAcreage),
      mono: true,
    });
  }

  const lastSale = formatLastSale(parcel.lastSaleDate, parcel.lastSalePrice);
  if (lastSale) {
    facts.push({
      key: 'last-sale',
      label: 'Last Sale',
      value: lastSale,
      mono: parcel.lastSalePrice != null,
    });
  }

  return facts;
}
