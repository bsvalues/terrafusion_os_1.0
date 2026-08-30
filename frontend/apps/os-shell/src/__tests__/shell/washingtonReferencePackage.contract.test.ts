import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  resolveWashingtonAssessorReferenceRoute,
  WASHINGTON_ASSESSOR_REFERENCE_PACKAGE,
  WASHINGTON_REFERENCE_ROUTES,
} from '../../lib/washingtonAssessorReferencePackage';
import {
  fetchWashingtonCountyStatus,
  resolveWashingtonCountyStatus,
  verifyWashingtonCountySalesShard,
  type WashingtonCountyStatusEntry,
} from '../../services/washingtonCountyLaunch';
import { getWashingtonSalesReviewCapability } from '../../pages/forge/sales/washingtonSalesReviewCapability';
import { fetchWashingtonLaunchQueue } from '../../pages/forge/sales/washingtonLaunchApi';

interface ReferenceRoutes {
  detail: string;
  salesShard: string;
}

interface ReferenceCountyStatus {
  county: string;
  countyCode: string;
  candidateSales: number;
  stagedSales: number;
  needsReview: number;
  primarySourceMode: string;
  confidence: { averageQualityScore: number };
  staticRoutes: ReferenceRoutes;
}

interface ReferenceStatusPayload {
  sourcePosture: string;
  counties: ReferenceCountyStatus[];
}

interface ReferenceSaleRecord {
  saleId: string;
  parcelNumber: string;
  saleNote: string;
  grantor: string | null;
  grantee: string | null;
  documentNumber: string | null;
  qualityScore: number;
  neighborhoodCode: string | null;
  flags: { needsReview: boolean };
  provenance: {
    sourceUrl: string | null;
    sourceFinalUrl: string | null;
    sourcePayloadPath: string | null;
    sourcePayloadSha256: string | null;
  };
}

interface ReferenceSalesShard {
  county: string;
  countyCode: string;
  summary: { records: number; reviewRecords: number };
  records: ReferenceSaleRecord[];
}

interface ReferenceCountyDetail {
  county: string;
  countyCode: string;
  salesRoute: string;
}

interface ReferenceManifest {
  sourcePosture: string;
  summary: {
    counties: number;
    candidateSales: number;
    stagedSales: number;
    needsReview: number;
    recordsWithNeighborhoodCode: number;
  };
}

function readBundledReferenceRoute<T>(route: string): T {
  const payload = resolveWashingtonAssessorReferenceRoute(route);
  expect(payload, `Missing tracked Washington reference route: ${route}`).toBeDefined();
  return payload as T;
}

function hostedEligibleStatus(
  overrides: Partial<Pick<
    WashingtonCountyStatusEntry,
    'stagedSales' | 'needsReview' | 'latestSaleDate'
  >> = {},
) {
  return {
    ...WASHINGTON_ASSESSOR_REFERENCE_PACKAGE.status,
    counties: WASHINGTON_ASSESSOR_REFERENCE_PACKAGE.status.counties.map((county) => ({
      ...county,
      primarySourceMode: 'public_recorder_export',
      ...overrides,
    })),
  };
}

function hostedPublicSalesShard() {
  const shard = WASHINGTON_ASSESSOR_REFERENCE_PACKAGE.salesShards['063'];
  return {
    ...shard,
    records: shard.records.map((record, index) => ({
      ...record,
      saleId: `WA-PUBLIC-063-${index + 1}`,
      parcelNumber: `PUBLIC-063-${index + 1}`,
      saleNote: 'Observed public recorder export fixture.',
      sourceMode: 'public_recorder_export',
      candidateSource: 'spokane_public_recorder_export',
      provenance: {
        ...record.provenance,
        sourceUrl: 'https://public.example.test/spokane/sales',
        sourceFinalUrl: `https://public.example.test/spokane/sales/${index + 1}`,
        sourcePayloadPath: `washington/spokane/public-sale-${index + 1}.json`,
        sourcePayloadSha256: `public-fixture-${index + 1}`,
        candidateIndexSource: 'spokane_public_recorder_index',
        candidateRecordType: 'public_sale_candidate',
      },
    })),
  };
}

describe('Washington assessor reference package', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads Counties Hub status from tracked source without HTTP', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const counties = await fetchWashingtonCountyStatus(
      undefined,
      'repository-reference',
    );

    expect(counties).toHaveLength(1);
    expect(counties[0]).toMatchObject({
      county: 'Spokane',
      countyCode: '063',
      salesShardVerification: 'not-required',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses a valid same-origin hosted status package wherever the OS is running', async () => {
    const hostedStatus = hostedEligibleStatus({
      stagedSales: 0,
      needsReview: 998,
      latestSaleDate: '2099-12-31',
    });
    const spokaneStatus = hostedStatus.counties[0];
    expect(spokaneStatus).toBeDefined();
    if (!spokaneStatus) throw new Error('Hosted Spokane payload is missing.');
    const multiCountyStatus = {
      ...hostedStatus,
      counties: [
        ...hostedStatus.counties,
        {
          ...spokaneStatus,
          county: 'Adams',
          countyCode: '001',
          staticRoutes: {
            detail: '/launch-data/washington/counties/001.json',
            salesShard: '/launch-data/washington/sales/by-county/001.json',
          },
        },
      ],
    };
    const hostedShard = hostedPublicSalesShard();
    const hostedShardWithStaleSummary = {
      ...hostedShard,
      summary: {
        ...hostedShard.summary,
        latestSaleDate: '1999-01-01',
        reviewRecords: 0,
      },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => multiCountyStatus,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedShardWithStaleSummary,
      });
    vi.stubGlobal('fetch', fetchMock);

    const resolution = await resolveWashingtonCountyStatus();

    expect(resolution).toMatchObject({
      packageSource: 'hosted',
      usedRepositoryFallback: false,
    });
    expect(resolution.counties).toHaveLength(2);
    expect(resolution.counties[0]).toMatchObject({
      county: 'Spokane',
      countyCode: '063',
      stagedSales: 0,
      salesShardVerification: 'unverified',
    });
    expect(fetchMock).toHaveBeenCalledWith(WASHINGTON_REFERENCE_ROUTES.status, {
      cache: 'no-store',
      signal: undefined,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const spokane = resolution.counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');
    const verifiedSpokane = await verifyWashingtonCountySalesShard(spokane);

    expect(verifiedSpokane).toMatchObject({
      stagedSales: 3,
      needsReview: 2,
      latestSaleDate: '2025-11-06',
      salesShardVerification: 'verified',
    });
    expect(getWashingtonSalesReviewCapability(verifiedSpokane)).toMatchObject({
      eligible: true,
      status: 'available',
      referenceData: {
        observed: {
          recordCount: 3,
          needsReview: 2,
          latestSaleDate: '2025-11-06',
        },
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(WASHINGTON_REFERENCE_ROUTES.spokaneSales, {
      cache: 'no-store',
      signal: undefined,
    });

    const queue = await fetchWashingtonLaunchQueue(2025, 'all', 1, 25, {
      countyCode: '063',
      hood: null,
      propertyType: null,
      saleDateFrom: null,
      saleDateTo: null,
      minPrice: null,
      maxPrice: null,
    });
    expect(queue.total).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/launch-data/washington/sales/by-county/001.json',
      expect.anything(),
    );
  });

  it('rejects a noncanonical sale date before deriving verified freshness', async () => {
    const hostedShard = hostedPublicSalesShard();
    const hostedShardWithNoncanonicalDate = {
      ...hostedShard,
      records: hostedShard.records.map((record, index) => index === 0
        ? { ...record, saleDate: '12/31/2025' }
        : record),
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedEligibleStatus(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedShardWithNoncanonicalDate,
      });
    vi.stubGlobal('fetch', fetchMock);

    const resolution = await resolveWashingtonCountyStatus();
    const spokane = resolution.counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');

    const unavailableSpokane = await verifyWashingtonCountySalesShard(spokane);

    expect(unavailableSpokane).toMatchObject({
      countyCode: '063',
      salesShardVerification: 'unavailable',
    });
    expect(getWashingtonSalesReviewCapability(unavailableSpokane)).toMatchObject({
      eligible: false,
      status: 'sales-shard-unavailable',
      referenceData: { observed: null },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects a hosted status relabel when the shard still has synthetic provenance', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedEligibleStatus(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => WASHINGTON_ASSESSOR_REFERENCE_PACKAGE.salesShards['063'],
      });
    vi.stubGlobal('fetch', fetchMock);

    const resolution = await resolveWashingtonCountyStatus();
    const spokane = resolution.counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');

    const unavailableSpokane = await verifyWashingtonCountySalesShard(spokane);

    expect(unavailableSpokane).toMatchObject({
      countyCode: '063',
      salesShardVerification: 'unavailable',
    });
    expect(getWashingtonSalesReviewCapability(unavailableSpokane)).toMatchObject({
      eligible: false,
      status: 'sales-shard-unavailable',
      referenceData: { observed: null },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps a hosted package but makes a county workflow unavailable when its shard is missing', async () => {
    const hostedStatus = hostedEligibleStatus();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedStatus,
      })
      .mockResolvedValueOnce({ ok: false, status: 404 });
    vi.stubGlobal('fetch', fetchMock);

    const resolution = await resolveWashingtonCountyStatus();

    expect(resolution).toMatchObject({
      packageSource: 'hosted',
      usedRepositoryFallback: false,
      counties: [{
        county: 'Spokane',
        countyCode: '063',
        salesShardVerification: 'unverified',
      }],
    });
    const spokane = resolution.counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const unavailableSpokane = await verifyWashingtonCountySalesShard(spokane);
    expect(unavailableSpokane).toMatchObject({
      salesShardVerification: 'unavailable',
      staticRoutes: { salesShard: WASHINGTON_REFERENCE_ROUTES.spokaneSales },
    });
    expect(getWashingtonSalesReviewCapability(unavailableSpokane)).toMatchObject({
      eligible: false,
      status: 'sales-shard-unavailable',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects a successful hosted response whose body is not a valid county shard', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedEligibleStatus(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ htmlFallback: '<!doctype html>' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const resolution = await resolveWashingtonCountyStatus();

    expect(resolution).toMatchObject({
      packageSource: 'hosted',
      usedRepositoryFallback: false,
      counties: [{
        countyCode: '063',
        salesShardVerification: 'unverified',
      }],
    });
    const spokane = resolution.counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const unavailableSpokane = await verifyWashingtonCountySalesShard(spokane);
    expect(unavailableSpokane).toMatchObject({
      salesShardVerification: 'unavailable',
    });
    expect(getWashingtonSalesReviewCapability(unavailableSpokane)).toMatchObject({
      eligible: false,
      status: 'sales-shard-unavailable',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back fail-closed when the same-origin hosted status route is absent', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal('fetch', fetchMock);

    const resolution = await resolveWashingtonCountyStatus();

    expect(resolution).toMatchObject({
      packageSource: 'repository-reference',
      usedRepositoryFallback: true,
      counties: [{
        county: 'Spokane',
        countyCode: '063',
        primarySourceMode: 'repository_reference_demo',
      }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a hosted status that points a county at another county shard', async () => {
    const hostedStatus = {
      ...WASHINGTON_ASSESSOR_REFERENCE_PACKAGE.status,
      counties: WASHINGTON_ASSESSOR_REFERENCE_PACKAGE.status.counties.map((county) => ({
        ...county,
        staticRoutes: {
          ...county.staticRoutes,
          salesShard: '/launch-data/washington/sales/by-county/005.json',
        },
      })),
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => hostedStatus,
    });
    vi.stubGlobal('fetch', fetchMock);

    const resolution = await resolveWashingtonCountyStatus();

    expect(resolution).toMatchObject({
      packageSource: 'repository-reference',
      usedRepositoryFallback: true,
      counties: [{ county: 'Spokane', countyCode: '063' }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('ships a tracked county status -> detail -> sales-shard chain', () => {
    const status = readBundledReferenceRoute<ReferenceStatusPayload>(
      WASHINGTON_REFERENCE_ROUTES.status,
    );
    const spokane = status.counties.find(
      (county) => county.countyCode === '063',
    );

    expect(status.sourcePosture).toBe('repository_reference_demo');
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Spokane reference county is missing.');
    expect(spokane).toMatchObject({
      county: 'Spokane',
      countyCode: '063',
      stagedSales: 3,
      needsReview: 2,
      primarySourceMode: 'repository_reference_demo',
    });

    expect(status).toBe(WASHINGTON_ASSESSOR_REFERENCE_PACKAGE.status);
    const detail = readBundledReferenceRoute<ReferenceCountyDetail>(spokane.staticRoutes.detail);
    const shard = readBundledReferenceRoute<ReferenceSalesShard>(spokane.staticRoutes.salesShard);
    const manifest = readBundledReferenceRoute<ReferenceManifest>(
      WASHINGTON_REFERENCE_ROUTES.manifest,
    );

    expect(detail).toMatchObject({
      county: 'Spokane',
      countyCode: '063',
      salesRoute: spokane.staticRoutes.salesShard,
    });
    expect(shard).toMatchObject({ county: 'Spokane', countyCode: '063' });
    expect(shard.summary.records).toBe(shard.records.length);
    expect(shard.summary.reviewRecords).toBe(
      shard.records.filter((record) => record.flags.needsReview).length,
    );
    const statusTotals = status.counties.reduce(
      (totals, county) => ({
        candidateSales: totals.candidateSales + county.candidateSales,
        stagedSales: totals.stagedSales + county.stagedSales,
        needsReview: totals.needsReview + county.needsReview,
      }),
      { candidateSales: 0, stagedSales: 0, needsReview: 0 },
    );
    const averageQualityScore = shard.records.reduce(
      (total, record) => total + record.qualityScore,
      0,
    ) / shard.records.length;
    expect(spokane.confidence.averageQualityScore).toBeCloseTo(averageQualityScore, 4);
    expect(manifest).toMatchObject({
      sourcePosture: status.sourcePosture,
      summary: {
        counties: status.counties.length,
        ...statusTotals,
        recordsWithNeighborhoodCode: shard.records.filter(
          (record) => record.neighborhoodCode !== null,
        ).length,
      },
    });
  });

  it('contains synthetic workflow evidence only, with no county party or document identity', () => {
    const shard = readBundledReferenceRoute<ReferenceSalesShard>(
      WASHINGTON_REFERENCE_ROUTES.spokaneSales,
    );

    expect(shard.records).toHaveLength(3);
    for (const record of shard.records) {
      expect(record.saleId).toMatch(/^WA-REFERENCE-063-/);
      expect(record.parcelNumber).toMatch(/^REFERENCE-063-/);
      expect(record.saleNote).toContain('Synthetic repository reference');
      expect(record.grantor).toBeNull();
      expect(record.grantee).toBeNull();
      expect(record.documentNumber).toBeNull();
      expect(record.provenance.sourceUrl).toBeNull();
      expect(record.provenance.sourceFinalUrl).toBeNull();
      expect(record.provenance.sourcePayloadPath).toBeNull();
      expect(record.provenance.sourcePayloadSha256).toBeNull();
    }
  });
});
