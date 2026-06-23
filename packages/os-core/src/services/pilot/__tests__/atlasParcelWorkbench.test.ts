import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolRunner, type PilotContext } from '../ToolRunner';
import { ToolRegistry } from '../ToolRegistry';
import { registerDefaultTools, defaultTools } from '../registerDefaultTools';

vi.mock('../../trace/TerraTraceService', () => ({
  TerraTraceService: {
    emit: vi.fn(async () => 'trace-wb-1'),
    emitResult: vi.fn(async () => 'trace-wb-result'),
  },
}));

function makeCtx(overrides: Partial<PilotContext> = {}): PilotContext {
  return {
    userId: 'u-test',
    userRole: 'appraiser',
    permissions: ['parcel:read'],
    activeMode: 'pilot',
    countyId: 'benton',
    parcelId: 'test-parcel',
    ...overrides,
  };
}

describe('atlas.parcel.workbench', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ToolRegistry._clear();
  });

  afterEach(() => {

  });

  it('is registered by registerDefaultTools', () => {
    registerDefaultTools();
    expect(ToolRegistry.has('atlas.parcel.workbench')).toBe(true);
    const meta = ToolRegistry.list().find(t => t.id === 'atlas.parcel.workbench');
    expect(meta).toBeDefined();
    expect(meta!.suite).toBe('atlas');
    expect(meta!.risk).toBe('read_only');
    expect(meta!.writeLane).toBe('atlas:read');
  });

  it('is exported in defaultTools', () => {
    expect(defaultTools.atlasParcelWorkbench).toBeDefined();
    expect(defaultTools.atlasParcelWorkbench.id).toBe('atlas.parcel.workbench');
  });

  it('returns null facets (not omitted) when API returns 404', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
    vi.stubGlobal('fetch', mockFetch);

    const tool = defaultTools.atlasParcelWorkbench;
    const result = await tool.handler(
      { parcelId: '00000000-0000-0000-0000-000000000001' },
      makeCtx()
    );

    expect(result).toHaveProperty('geometry', null);
    expect(result).toHaveProperty('ownerCurrent', null);
    expect(result).toHaveProperty('wsdorRoll', null);
    expect(result.errors).toEqual([]);


  });

  it('collects per-facet errors without throwing', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    vi.stubGlobal('fetch', mockFetch);

    const tool = defaultTools.atlasParcelWorkbench;
    const result = await tool.handler(
      { parcelId: '00000000-0000-0000-0000-000000000001' },
      makeCtx()
    );

    expect(result.geometry).toBeNull();
    expect(result.ownerCurrent).toBeNull();
    expect(result.wsdorRoll).toBeNull();
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0]).toContain('geometry');
    expect(result.errors[1]).toContain('ownerCurrent');
    expect(result.errors[2]).toContain('wsdorRoll');


  });

  it('nullable output fields are present as null, never omitted', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal('fetch', mockFetch);

    const tool = defaultTools.atlasParcelWorkbench;
    const result = await tool.handler({ parcelId: 'abc' }, makeCtx());
    const keys = Object.keys(result);

    expect(keys).toContain('parcelId');
    expect(keys).toContain('geometry');
    expect(keys).toContain('ownerCurrent');
    expect(keys).toContain('wsdorRoll');
    expect(keys).toContain('errors');


  });

  it('composes all three facets when API returns 200', async () => {
    const geomPayload = {
      tfParcelId: 'p1',
      countyId: 'c1',
      geomWkt: 'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',
      centroidLat: 0.5,
      centroidLon: 0.5,
      areaSqFt: 43560,
      lastSyncedAt: '2026-01-01T00:00:00Z',
      sourceServiceUrl: 'https://gis.example.com',
      isActive: true,
    };
    const ownerPayload = {
      tfParcelId: 'p1',
      countyId: 'c1',
      taxYear: 2026,
      owners: [
        {
          tfOwnerId: 'o1',
          acctId: 12345,
          displayName: 'Test Owner',
          pctOwnership: null,
          isPrimary: true,
          confidentialFlag: false,
          webSuppression: false,
        },
      ],
    };
    const wsdorPayload = {
      tfParcelId: 'p1',
      countyId: 'c1',
      assessmentYear: 2026,
      entries: [],
      assessedValTotal: null,
      marketValTotal: null,
    };

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/geometry')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(geomPayload) });
      }
      if (url.includes('/owner-current')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(ownerPayload) });
      }
      if (url.includes('/wsdor-roll')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(wsdorPayload) });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
    vi.stubGlobal('fetch', mockFetch);

    const tool = defaultTools.atlasParcelWorkbench;
    const result = await tool.handler({ parcelId: 'p1', taxYear: 2026 }, makeCtx());

    expect(result.geometry).toEqual(geomPayload);
    expect(result.ownerCurrent).toEqual(ownerPayload);
    expect(result.wsdorRoll).toEqual(wsdorPayload);
    expect(result.errors).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(3);


  });

  it('passes era param through to owner-current and wsdor-roll URLs', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal('fetch', mockFetch);

    const tool = defaultTools.atlasParcelWorkbench;
    await tool.handler({ parcelId: 'p1', taxYear: 2026, era: 'ALL' }, makeCtx());

    const urls = mockFetch.mock.calls.map((c: any[]) => c[0] as string);
    const ownerUrl = urls.find((u: string) => u.includes('owner-current'));
    const wsdorUrl = urls.find((u: string) => u.includes('wsdor-roll'));
    expect(ownerUrl).toContain('era=ALL');
    expect(wsdorUrl).toContain('era=ALL');


  });

  it('is denied when parcel:read permission is missing', async () => {
    registerDefaultTools();
    const tool = ToolRegistry.get('atlas.parcel.workbench');
    const ctx = makeCtx({ permissions: [] });

    await expect(
      ToolRunner.execute(tool, { parcelId: 'p1' }, ctx)
    ).rejects.toThrow(/Permission Denied/i);
  });

  it('passes acctId through as-is from the API response (int64 caution)', async () => {
    const ownerPayload = {
      tfParcelId: 'p1',
      countyId: 'c1',
      taxYear: 2026,
      owners: [
        {
          tfOwnerId: 'o1',
          acctId: 9007199254740992,
          displayName: 'Large AcctId Owner',
          pctOwnership: null,
          isPrimary: true,
          confidentialFlag: false,
          webSuppression: false,
        },
      ],
    };

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/owner-current')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(ownerPayload) });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
    vi.stubGlobal('fetch', mockFetch);

    const tool = defaultTools.atlasParcelWorkbench;
    const result = await tool.handler({ parcelId: 'p1', taxYear: 2026 }, makeCtx());

    expect(result.ownerCurrent).not.toBeNull();
    expect(result.ownerCurrent!.owners[0].acctId).toBe(9007199254740992);
  });
});
