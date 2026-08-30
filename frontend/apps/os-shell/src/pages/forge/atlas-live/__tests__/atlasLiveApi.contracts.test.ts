import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  ATLAS_COUNTY_LAUNCH_CONTEXT_CONTRACT_ID,
  fetchAtlasCountyContext,
  type AtlasRouteScope,
} from '../atlasLiveApi';

const BENTON_SCOPE: AtlasRouteScope = {
  studyId: 'study-1',
  countyId: '19190019-1919-1919-1919-191919191919',
  countyName: 'Benton',
  countyCode: null,
  segmentId: 'seg-1',
  neighborhoodCode: '13011',
  taxYear: 2026,
};

const SPOKANE_SCOPE: AtlasRouteScope = {
  ...BENTON_SCOPE,
  countyId: null,
  countyName: 'Spokane',
  countyCode: '063',
};

const statusPayload = {
  counties: [
    {
      county: 'Benton',
      countyCode: '005',
      priority: 'P1',
      prometheusStatus: 'automated_with_review',
      primarySourceMode: 'local_pacs_mirror',
      latestSaleDate: '2026-01-13',
      candidateSales: 59559,
      stagedSales: 59559,
      needsReview: 730,
      confidence: {
        averageQualityScore: 0.9874,
        parserStatus: 'ready_for_parser_mapping',
        rawStatus: 'landed',
        rawDriftDetected: false,
      },
      staticRoutes: {
        detail: '/launch-data/washington/counties/005.json',
        salesShard: '/launch-data/washington/sales/by-county/005.json',
      },
    },
    {
      county: 'Spokane',
      countyCode: '063',
      priority: 'P1',
      prometheusStatus: 'source_drift',
      primarySourceMode: 'arcgis_service',
      latestSaleDate: '2026-04-22',
      candidateSales: 23171,
      stagedSales: 23171,
      needsReview: 10,
      confidence: {
        averageQualityScore: 0.85,
        parserStatus: 'ready_for_parser_mapping',
        rawStatus: 'landed',
        rawDriftDetected: true,
      },
      staticRoutes: {
        detail: '/launch-data/washington/counties/063.json',
        salesShard: '/launch-data/washington/sales/by-county/063.json',
      },
    },
  ],
};

function mockFetch(payload = statusPayload) {
  const fetchMock = vi.fn(async (path: string) => {
    if (path.endsWith('/status.json')) {
      return Response.json(payload);
    }
    if (path.endsWith('/005.json')) {
      return Response.json({
        county: 'Benton',
        countyCode: '005',
        operationalState: {
          primarySourceMode: 'local_pacs_mirror',
          prometheusStatus: 'automated_with_review',
        },
        summary: {
          records: 59559,
          latestSaleDate: '2026-01-13',
        },
        salesRoute: '/launch-data/washington/sales/by-county/005.json',
      });
    }
    if (path.endsWith('/063.json')) {
      return Response.json({
        county: 'Spokane',
        countyCode: '063',
        operationalState: {
          primarySourceMode: 'arcgis_service',
          prometheusStatus: 'source_drift',
        },
        summary: {
          records: 23171,
          latestSaleDate: '2026-04-22',
        },
        salesRoute: '/launch-data/washington/sales/by-county/063.json',
      });
    }
    return new Response('not found', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('fetchAtlasCountyContext contract posture', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks Benton as production provisional with converted legacy sensitivity', async () => {
    mockFetch();

    const context = await fetchAtlasCountyContext(BENTON_SCOPE);

    expect(context?.contractId).toBe(ATLAS_COUNTY_LAUNCH_CONTEXT_CONTRACT_ID);
    expect(context?.trustTier).toBe('production_provisional');
    expect(context?.dataTrustBadges).toContain('Converted Legacy Sensitive');
    expect(context?.databasePosture).toContain('TerraFusion.Benton.Operational');
    expect(context?.productionClaimAllowed).toBe(false);
    expect(context?.geometryAvailability).toBe('compatibility');
  });

  it('marks non-Benton launch counties as reference/demo only', async () => {
    mockFetch();

    const context = await fetchAtlasCountyContext(SPOKANE_SCOPE);

    expect(context?.contractId).toBe(ATLAS_COUNTY_LAUNCH_CONTEXT_CONTRACT_ID);
    expect(context?.trustTier).toBe('reference_demo');
    expect(context?.dataTrustBadges).toContain('Demo/Reference Only');
    expect(context?.databasePosture).toContain('TerraFusion.Reference39.Demo');
    expect(context?.productionClaimAllowed).toBe(false);
    expect(context?.geometryAvailability).toBe('unpublished');
  });

  it('uses county status without fetching when no detail route is published', async () => {
    const fetchMock = mockFetch({
      counties: statusPayload.counties.map((county) =>
        county.countyCode === '063'
          ? {
              ...county,
              staticRoutes: {
                ...county.staticRoutes,
                detail: '',
              },
            }
          : county,
      ),
    });

    const context = await fetchAtlasCountyContext(SPOKANE_SCOPE);

    expect(context).toMatchObject({
      countyName: 'Spokane',
      countyCode: '063',
      primarySourceMode: 'arcgis_service',
      prometheusStatus: 'source_drift',
      latestSaleDate: '2026-04-22',
      stagedSales: 23171,
      detailRoute: '',
      salesRoute: '/launch-data/washington/sales/by-county/063.json',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.some(([path]) => path === '')).toBe(false);
  });
});
