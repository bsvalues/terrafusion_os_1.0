import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildParcelSummary } from '../../pages/MuseChat';
import type { Property } from '../../types/domain';

const MOCK_PARCEL: Property = {
  parcelId: '117-230-114-0',
  countyCode: 'benton',
  address: '1234 Main St',
  city: 'Richland',
  state: 'WA',
  zip: '99352',
  legalDescription: 'Lot 4 Block 2',
  ownerName: 'Jane Smith',
  propertyType: 'residential',
  propertyUseCode: 'R1',
  landAcreage: 0.24,
  yearBuilt: 1987,
  buildingSquareFeet: 1840,
  landValue: 75000,
  improvementValue: 267500,
  totalAssessedValue: 342500,
  marketValue: 355000,
  taxableValue: 342500,
  exemptionAmount: 0,
  assessmentStatus: 'active',
  assessmentYear: 2025,
  assessmentDate: '2025-01-01',
  lastUpdated: '2025-01-01',
  hasActivePermits: false,
  hasAppeals: false,
  dataSource: 'harris-pacs',
  lastSaleDate: '2019-06-15',
  lastSalePrice: 298000,
  neighborhood: 'Southridge',
  zoning: 'R-1',
  taxDistrictName: 'Richland #400',
  specialDistricts: ['Fire District 1', 'Irrigation District 7'],
  latitude: 46.2804,
  longitude: -119.2752,
};

describe('buildParcelSummary', () => {
  it('returns undefined when activeParcel is null', () => {
    expect(buildParcelSummary(null, '117-230-114-0')).toBeUndefined();
  });

  it('returns undefined when activeParcelId does not match parcel.parcelId (stale store)', () => {
    expect(buildParcelSummary(MOCK_PARCEL, 'different-parcel-id')).toBeUndefined();
  });

  it('returns undefined when activeParcelId is null', () => {
    expect(buildParcelSummary(MOCK_PARCEL, null)).toBeUndefined();
  });

  it('maps all 20 fields including geo when parcel matches', () => {
    const result = buildParcelSummary(MOCK_PARCEL, '117-230-114-0');
    expect(result).toBeDefined();
    expect(result!.address).toBe('1234 Main St');
    expect(result!.city).toBe('Richland');
    expect(result!.totalAssessedValue).toBe(342500);
    expect(result!.yearBuilt).toBe(1987);
    expect(result!.lastSalePrice).toBe(298000);
    expect(result!.neighborhood).toBe('Southridge');
    expect(result!.latitude).toBe(46.2804);
  });

  it('joins specialDistricts array to a comma-separated string', () => {
    const result = buildParcelSummary(MOCK_PARCEL, '117-230-114-0');
    expect(result!.specialDistricts).toBe('Fire District 1, Irrigation District 7');
  });

  it('omits undefined optional fields — specialDistricts is undefined when parcel has none', () => {
    const parcelWithoutDistricts: Property = {
      ...MOCK_PARCEL,
      specialDistricts: undefined,
      neighborhood: undefined,
      zoning: undefined,
    };
    const result = buildParcelSummary(parcelWithoutDistricts, '117-230-114-0');
    expect(result!.specialDistricts).toBeUndefined();
    expect(result!.neighborhood).toBeUndefined();
    expect(result!.zoning).toBeUndefined();
  });
});

describe('callExplain parcelSummary wire', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ explanation: 'ok', sources: [], confidence: 0.9, traceId: 'x' }),
    }));
  });

  it('includes parcelSummary in request body when provided', async () => {
    const { callExplain } = await import('../../pages/MuseChat');
    const ctx = {
      activeParcelId: '117-230-114-0', activeSuite: null, activeTab: null,
      activeBranch: null, activeFile: null, buildStatus: 'unknown', editorMarkers: [],
    };
    const summary = { address: '1234 Main St', totalAssessedValue: 342500 };

    await callExplain('test query', 'benton', 'actor', ctx, summary);

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body as string);
    expect(body.parcelSummary).toEqual(summary);
  });

  it('omits parcelSummary from request body when undefined', async () => {
    const { callExplain } = await import('../../pages/MuseChat');
    const ctx = {
      activeParcelId: null, activeSuite: null, activeTab: null,
      activeBranch: null, activeFile: null, buildStatus: 'unknown', editorMarkers: [],
    };

    await callExplain('test query', 'benton', 'actor', ctx, undefined);

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body as string);
    expect(body.parcelSummary).toBeUndefined();
  });
});
