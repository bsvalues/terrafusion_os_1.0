import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  resolveWashingtonAssessorReferenceRoute,
  WASHINGTON_ASSESSOR_REFERENCE_PACKAGE,
  WASHINGTON_REFERENCE_ROUTES,
} from '../../lib/washingtonAssessorReferencePackage';
import { fetchWashingtonCountyStatus } from '../../services/washingtonCountyLaunch';

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
    expect(counties[0]).toMatchObject({ county: 'Spokane', countyCode: '063' });
    expect(fetchMock).not.toHaveBeenCalled();
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
