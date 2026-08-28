import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const PUBLIC_ROOT = resolve(import.meta.dirname, '../../../public');

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

function readPublicJson<T>(route: string): T {
  const path = resolve(PUBLIC_ROOT, route.replace(/^\//, ''));
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

describe('Washington assessor reference package', () => {
  it('ships a resolvable county status -> detail -> sales-shard chain', () => {
    const status = readPublicJson<ReferenceStatusPayload>(
      '/launch-data/washington/counties/status.json',
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

    const detail = readPublicJson<ReferenceCountyDetail>(spokane.staticRoutes.detail);
    const shard = readPublicJson<ReferenceSalesShard>(spokane.staticRoutes.salesShard);
    const manifest = readPublicJson<ReferenceManifest>(
      '/launch-data/washington/manifest.json',
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
    const shard = readPublicJson<ReferenceSalesShard>(
      '/launch-data/washington/sales/by-county/063.json',
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
