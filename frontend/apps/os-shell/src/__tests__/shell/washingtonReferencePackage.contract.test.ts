import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resolveWashingtonAssessorReferenceRoute,
  WASHINGTON_ASSESSOR_REFERENCE_PACKAGE,
  WASHINGTON_REFERENCE_ROUTES,
} from '../../lib/washingtonAssessorReferencePackage';
import {
  fetchWashingtonCountyStatus,
  WASHINGTON_PUBLIC_DATA_REQUEST_TIMEOUT_MS,
  resolveWashingtonCountyStatus,
  verifyWashingtonCountySalesShard,
  type WashingtonCountyStatusEntry,
} from '../../services/washingtonCountyLaunch';
import {
  computeWashingtonLaunchCanonicalJsonSha256,
  getWashingtonSalesReviewCapability,
} from '../../pages/forge/sales/washingtonSalesReviewCapability';
import {
  evictWashingtonLaunchCountyShard,
  fetchWashingtonLaunchQueue,
} from '../../pages/forge/sales/washingtonLaunchApi';

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
    sourcePosture: 'public_recorder_export',
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
        sourceUrl: 'https://www.spokanecounty.org/scout/sales',
        sourceFinalUrl: `https://www.spokanecounty.org/scout/sales/${index + 1}`,
        sourcePayloadPath: `washington/spokane/public-sale-${index + 1}.json`,
        sourcePayloadSha256: String(index + 1).padStart(64, '0'),
        candidateIndexSource: 'spokane_public_recorder_index',
        candidateRecordType: 'public_sale_candidate',
      },
    })),
  };
}

async function hostedManifest(
  shard: unknown,
  attestationOverrides: Record<string, unknown> = {},
  status: unknown = hostedEligibleStatus(),
) {
  const canonicalJsonSha256 = await computeWashingtonLaunchCanonicalJsonSha256(shard);
  const statusCanonicalJsonSha256 =
    await computeWashingtonLaunchCanonicalJsonSha256(status);
  if (!canonicalJsonSha256 || !statusCanonicalJsonSha256) {
    throw new Error('Web Crypto is required for Washington package contract tests.');
  }

  const records = typeof shard === 'object'
    && shard !== null
    && 'records' in shard
    && Array.isArray(shard.records)
    ? shard.records
    : [];
  const sourcePayloadSha256 = records.flatMap((record) => {
    if (
      typeof record !== 'object'
      || record === null
      || !('provenance' in record)
      || typeof record.provenance !== 'object'
      || record.provenance === null
      || !('sourcePayloadSha256' in record.provenance)
      || typeof record.provenance.sourcePayloadSha256 !== 'string'
    ) {
      return [];
    }
    return [record.provenance.sourcePayloadSha256];
  });

  return {
    ...WASHINGTON_ASSESSOR_REFERENCE_PACKAGE.manifest,
    statusSchemaVersion: WASHINGTON_ASSESSOR_REFERENCE_PACKAGE.status.schemaVersion,
    statusCanonicalJsonSha256,
    sourcePosture: 'public_recorder_export',
    salesShardAttestations: [{
      algorithm: 'SHA-256',
      canonicalJsonSha256,
      county: 'Spokane',
      countyCode: '063',
      officialSourceBaseUrl: 'https://www.spokanecounty.org',
      route: WASHINGTON_REFERENCE_ROUTES.spokaneSales,
      sourcePayloadSha256,
      sourcePosture: 'public_recorder_export',
      ...attestationOverrides,
    }],
  };
}

async function hostedManifestResponse(
  shard: unknown,
  attestationOverrides: Record<string, unknown> = {},
  status: unknown = hostedEligibleStatus(),
) {
  const manifest = await hostedManifest(shard, attestationOverrides, status);
  const manifestSha256 = await computeWashingtonLaunchCanonicalJsonSha256(manifest);
  if (!manifestSha256) {
    throw new Error('Web Crypto is required to pin the hosted manifest in contract tests.');
  }
  vi.stubEnv('VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256', manifestSha256);

  return {
    ok: true,
    status: 200,
    json: async () => manifest,
  };
}

function hostedShardResponse(shard: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => shard,
  };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('Washington assessor reference package', () => {
  beforeEach(() => {
    // jsdom 23 exposes Crypto without SubtleCrypto. Exercise the browser digest
    // path with Node's standards-compatible Web Crypto implementation.
    vi.stubGlobal('crypto', webcrypto);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
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
      .mockResolvedValueOnce(await hostedManifestResponse(
        hostedShardWithStaleSummary,
        {},
        multiCountyStatus,
      ))
      .mockResolvedValueOnce(hostedShardResponse(hostedShardWithStaleSummary));
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
      signal: expect.any(AbortSignal),
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
      signal: expect.any(AbortSignal),
    });
    expect(fetchMock).toHaveBeenCalledWith(WASHINGTON_REFERENCE_ROUTES.manifest, {
      cache: 'no-store',
      signal: expect.any(AbortSignal),
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
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/launch-data/washington/sales/by-county/001.json',
      expect.anything(),
    );
  });

  it('does not cache a hosted shard that resolves after its bounded attempt times out', async () => {
    evictWashingtonLaunchCountyShard('063', 'hosted');
    const hostedStatus = hostedEligibleStatus();
    const hostedShard = hostedPublicSalesShard();
    const manifestResponse = await hostedManifestResponse(
      hostedShard,
      {},
      hostedStatus,
    );
    const lateShardJson = deferred<unknown>();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedStatus,
      })
      .mockResolvedValueOnce(manifestResponse)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => lateShardJson.promise,
      });
    vi.stubGlobal('fetch', fetchMock);

    const counties = await fetchWashingtonCountyStatus(undefined, 'hosted');
    const spokane = counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');

    vi.useFakeTimers();
    try {
      const verificationPromise = verifyWashingtonCountySalesShard(spokane);
      await vi.advanceTimersByTimeAsync(WASHINGTON_PUBLIC_DATA_REQUEST_TIMEOUT_MS);
      await expect(verificationPromise).resolves.toMatchObject({
        countyCode: '063',
        salesShardVerification: 'unavailable',
      });

      lateShardJson.resolve(hostedShard);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      await expect(fetchWashingtonLaunchQueue(2025, 'all', 1, 25, {
        countyCode: '063',
        hood: null,
        propertyType: null,
        saleDateFrom: null,
        saleDateTo: null,
        minPrice: null,
        maxPrice: null,
      })).rejects.toThrow(/requires authenticated package verification/i);
    } finally {
      vi.useRealTimers();
      evictWashingtonLaunchCountyShard('063', 'hosted');
    }
  });

  it('does not let an older same-county attempt evict a newer verified shard', async () => {
    evictWashingtonLaunchCountyShard('063', 'hosted');
    const hostedStatus = hostedEligibleStatus();
    const hostedShard = hostedPublicSalesShard();
    const manifestResponse = await hostedManifestResponse(
      hostedShard,
      {},
      hostedStatus,
    );
    const firstShardRequested = deferred<void>();
    const lateInvalidShardJson = deferred<unknown>();
    let shardRequests = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === WASHINGTON_REFERENCE_ROUTES.status) {
        return {
          ok: true,
          status: 200,
          json: async () => hostedStatus,
        };
      }
      if (url === WASHINGTON_REFERENCE_ROUTES.manifest) {
        return manifestResponse;
      }
      if (url === WASHINGTON_REFERENCE_ROUTES.spokaneSales) {
        shardRequests += 1;
        if (shardRequests === 1) {
          firstShardRequested.resolve();
          return {
            ok: true,
            status: 200,
            json: () => lateInvalidShardJson.promise,
          };
        }
        return hostedShardResponse(hostedShard);
      }
      throw new Error(`Unexpected Washington route: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const counties = await fetchWashingtonCountyStatus(undefined, 'hosted');
    const spokane = counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');

    const olderAttempt = verifyWashingtonCountySalesShard(spokane);
    await firstShardRequested.promise;
    await expect(verifyWashingtonCountySalesShard(spokane)).resolves.toMatchObject({
      countyCode: '063',
      salesShardVerification: 'verified',
    });

    lateInvalidShardJson.resolve({ ...hostedShard, countyCode: '001' });
    await expect(olderAttempt).resolves.toMatchObject({
      countyCode: '063',
      salesShardVerification: 'unavailable',
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
    evictWashingtonLaunchCountyShard('063', 'hosted');
  });

  it('restores an older same-county attempt when its superseding caller cancels', async () => {
    evictWashingtonLaunchCountyShard('063', 'hosted');
    const hostedStatus = hostedEligibleStatus();
    const hostedShard = hostedPublicSalesShard();
    const manifestResponse = await hostedManifestResponse(
      hostedShard,
      {},
      hostedStatus,
    );
    const firstShardRequested = deferred<void>();
    const secondShardRequested = deferred<void>();
    const firstShardJson = deferred<unknown>();
    const secondShardJson = deferred<unknown>();
    let shardRequests = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === WASHINGTON_REFERENCE_ROUTES.status) {
        return {
          ok: true,
          status: 200,
          json: async () => hostedStatus,
        };
      }
      if (url === WASHINGTON_REFERENCE_ROUTES.manifest) {
        return manifestResponse;
      }
      if (url === WASHINGTON_REFERENCE_ROUTES.spokaneSales) {
        shardRequests += 1;
        if (shardRequests === 1) {
          firstShardRequested.resolve();
          return {
            ok: true,
            status: 200,
            json: () => firstShardJson.promise,
          };
        }
        secondShardRequested.resolve();
        return {
          ok: true,
          status: 200,
          json: () => secondShardJson.promise,
        };
      }
      throw new Error(`Unexpected Washington route: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const counties = await fetchWashingtonCountyStatus(undefined, 'hosted');
    const spokane = counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');

    const olderAttempt = verifyWashingtonCountySalesShard(spokane);
    await firstShardRequested.promise;

    const supersedingCaller = new AbortController();
    const supersedingAttempt = verifyWashingtonCountySalesShard(
      spokane,
      supersedingCaller.signal,
    );
    await secondShardRequested.promise;
    supersedingCaller.abort();
    await expect(supersedingAttempt).rejects.toMatchObject({ name: 'AbortError' });

    firstShardJson.resolve(hostedShard);
    await expect(olderAttempt).resolves.toMatchObject({
      countyCode: '063',
      salesShardVerification: 'verified',
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
    evictWashingtonLaunchCountyShard('063', 'hosted');
  });

  it('skips a cancelled middle owner when the newest same-county caller also cancels', async () => {
    evictWashingtonLaunchCountyShard('063', 'hosted');
    const hostedStatus = hostedEligibleStatus();
    const hostedShard = hostedPublicSalesShard();
    const manifestResponse = await hostedManifestResponse(
      hostedShard,
      {},
      hostedStatus,
    );
    const shardRequested = [deferred<void>(), deferred<void>(), deferred<void>()];
    const shardJson = [deferred<unknown>(), deferred<unknown>(), deferred<unknown>()];
    let shardRequests = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === WASHINGTON_REFERENCE_ROUTES.status) {
        return {
          ok: true,
          status: 200,
          json: async () => hostedStatus,
        };
      }
      if (url === WASHINGTON_REFERENCE_ROUTES.manifest) {
        return manifestResponse;
      }
      if (url === WASHINGTON_REFERENCE_ROUTES.spokaneSales) {
        const index = shardRequests;
        shardRequests += 1;
        shardRequested[index]?.resolve();
        return {
          ok: true,
          status: 200,
          json: () => shardJson[index]?.promise,
        };
      }
      throw new Error(`Unexpected Washington route: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const counties = await fetchWashingtonCountyStatus(undefined, 'hosted');
    const spokane = counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');

    const oldestAttempt = verifyWashingtonCountySalesShard(spokane);
    await shardRequested[0]?.promise;

    const middleCaller = new AbortController();
    const middleAttempt = verifyWashingtonCountySalesShard(spokane, middleCaller.signal);
    await shardRequested[1]?.promise;

    const newestCaller = new AbortController();
    const newestAttempt = verifyWashingtonCountySalesShard(spokane, newestCaller.signal);
    await shardRequested[2]?.promise;

    middleCaller.abort();
    await expect(middleAttempt).rejects.toMatchObject({ name: 'AbortError' });
    newestCaller.abort();
    await expect(newestAttempt).rejects.toMatchObject({ name: 'AbortError' });

    shardJson[0]?.resolve(hostedShard);
    await expect(oldestAttempt).resolves.toMatchObject({
      countyCode: '063',
      salesShardVerification: 'verified',
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
    evictWashingtonLaunchCountyShard('063', 'hosted');
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
      .mockResolvedValueOnce(await hostedManifestResponse(hostedShardWithNoncanonicalDate))
      .mockResolvedValueOnce(hostedShardResponse(hostedShardWithNoncanonicalDate));
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
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('rejects a hosted status relabel when the shard still has synthetic provenance', async () => {
    const syntheticShard = WASHINGTON_ASSESSOR_REFERENCE_PACKAGE.salesShards['063'];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedEligibleStatus(),
      })
      .mockResolvedValueOnce(await hostedManifestResponse(syntheticShard))
      .mockResolvedValueOnce(hostedShardResponse(syntheticShard));
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
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('rejects a matching source mode without affirmative public provenance', async () => {
    const hostedShard = hostedPublicSalesShard();
    const hostedShardWithoutPublicProvenance = {
      ...hostedShard,
      records: hostedShard.records.map((record) => ({
        ...record,
        candidateSource: null,
        provenance: {
          ...record.provenance,
          sourceUrl: null,
          sourceFinalUrl: null,
          sourcePayloadPath: null,
          sourcePayloadSha256: null,
          candidateIndexSource: null,
          candidateRecordType: null,
        },
      })),
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedEligibleStatus(),
      })
      .mockResolvedValueOnce(await hostedManifestResponse(hostedShardWithoutPublicProvenance))
      .mockResolvedValueOnce(hostedShardResponse(hostedShardWithoutPublicProvenance));
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
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('rejects manifest-attested records that cite an untrusted public source', async () => {
    const hostedShard = hostedPublicSalesShard();
    const shardWithUntrustedSource = {
      ...hostedShard,
      records: hostedShard.records.map((record, index) => ({
        ...record,
        provenance: {
          ...record.provenance,
          sourceUrl: 'https://public.example.test/spokane/sales',
          sourceFinalUrl: `https://public.example.test/spokane/sales/${index + 1}`,
        },
      })),
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedEligibleStatus(),
      })
      .mockResolvedValueOnce(await hostedManifestResponse(shardWithUntrustedSource))
      .mockResolvedValueOnce(hostedShardResponse(shardWithUntrustedSource));
    vi.stubGlobal('fetch', fetchMock);

    const resolution = await resolveWashingtonCountyStatus();
    const spokane = resolution.counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');

    await expect(verifyWashingtonCountySalesShard(spokane)).resolves.toMatchObject({
      countyCode: '063',
      salesShardVerification: 'unavailable',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('rejects an otherwise valid manifest that does not match the build trust pin', async () => {
    const hostedShard = hostedPublicSalesShard();
    const manifest = await hostedManifest(hostedShard);
    vi.stubEnv('VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256', '0'.repeat(64));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedEligibleStatus(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => manifest,
      });
    vi.stubGlobal('fetch', fetchMock);

    const resolution = await resolveWashingtonCountyStatus();
    const spokane = resolution.counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');

    await expect(verifyWashingtonCountySalesShard(spokane)).resolves.toMatchObject({
      countyCode: '063',
      salesShardVerification: 'unavailable',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).not.toHaveBeenCalledWith(
      WASHINGTON_REFERENCE_ROUTES.spokaneSales,
      expect.anything(),
    );
  });

  it('rejects displayed status fields that are not bound by the pinned manifest', async () => {
    const attestedStatus = hostedEligibleStatus();
    const alteredStatus = {
      ...attestedStatus,
      counties: attestedStatus.counties.map((county) => ({
        ...county,
        prometheusStatus: 'forged_ready',
        confidence: {
          ...county.confidence,
          rawStatus: 'forged_observed',
          rawDriftDetected: true,
        },
      })),
    };
    const hostedShard = hostedPublicSalesShard();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => alteredStatus,
      })
      .mockResolvedValueOnce(await hostedManifestResponse(
        hostedShard,
        {},
        attestedStatus,
      ));
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
    expect(
      getWashingtonSalesReviewCapability(unavailableSpokane).referenceData.observed,
    ).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).not.toHaveBeenCalledWith(
      WASHINGTON_REFERENCE_ROUTES.spokaneSales,
      expect.anything(),
    );
  });

  it('rejects a manifest that is not bound to the packaged official county source', async () => {
    const hostedShard = hostedPublicSalesShard();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedEligibleStatus(),
      })
      .mockResolvedValueOnce(await hostedManifestResponse(hostedShard, {
        officialSourceBaseUrl: 'https://public.example.test',
      }));
    vi.stubGlobal('fetch', fetchMock);

    const resolution = await resolveWashingtonCountyStatus();
    const spokane = resolution.counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');

    await expect(verifyWashingtonCountySalesShard(spokane)).resolves.toMatchObject({
      countyCode: '063',
      salesShardVerification: 'unavailable',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).not.toHaveBeenCalledWith(
      WASHINGTON_REFERENCE_ROUTES.spokaneSales,
      expect.anything(),
    );
  });

  it('rejects a hosted shard whose body does not match its manifest digest', async () => {
    const attestedShard = hostedPublicSalesShard();
    const tamperedShard = {
      ...attestedShard,
      records: attestedShard.records.map((record, index) => index === 0
        ? { ...record, salePrice: (record.salePrice ?? 0) + 1 }
        : record),
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedEligibleStatus(),
      })
      .mockResolvedValueOnce(await hostedManifestResponse(attestedShard))
      .mockResolvedValueOnce(hostedShardResponse(tamperedShard));
    vi.stubGlobal('fetch', fetchMock);

    const resolution = await resolveWashingtonCountyStatus();
    const spokane = resolution.counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');

    await expect(verifyWashingtonCountySalesShard(spokane)).resolves.toMatchObject({
      countyCode: '063',
      salesShardVerification: 'unavailable',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('keeps a hosted package but makes a county workflow unavailable when its shard is missing', async () => {
    const hostedStatus = hostedEligibleStatus();
    const hostedShard = hostedPublicSalesShard();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedStatus,
      })
      .mockResolvedValueOnce(await hostedManifestResponse(hostedShard))
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
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('evicts a previously verified hosted shard when fresh verification fails', async () => {
    const hostedShard = hostedPublicSalesShard();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedEligibleStatus(),
      })
      .mockResolvedValueOnce(await hostedManifestResponse(hostedShard))
      .mockResolvedValueOnce(hostedShardResponse(hostedShard))
      .mockResolvedValueOnce(await hostedManifestResponse(hostedShard))
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 });
    vi.stubGlobal('fetch', fetchMock);

    const resolution = await resolveWashingtonCountyStatus();
    const spokane = resolution.counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');

    await expect(verifyWashingtonCountySalesShard(spokane)).resolves.toMatchObject({
      salesShardVerification: 'verified',
    });
    await expect(verifyWashingtonCountySalesShard(spokane)).resolves.toMatchObject({
      salesShardVerification: 'unavailable',
    });
    await expect(fetchWashingtonLaunchQueue(2025, 'all', 1, 25, {
      countyCode: '063',
      hood: null,
      propertyType: null,
      saleDateFrom: null,
      saleDateTo: null,
      minPrice: null,
      maxPrice: null,
    })).rejects.toThrow(/authenticated package verification/i);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('evicts a verified hosted shard when refreshed status makes verification unnecessary', async () => {
    const hostedShard = hostedPublicSalesShard();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedEligibleStatus(),
      })
      .mockResolvedValueOnce(await hostedManifestResponse(hostedShard))
      .mockResolvedValueOnce(hostedShardResponse(hostedShard))
      .mockResolvedValueOnce({ ok: false, status: 404 });
    vi.stubGlobal('fetch', fetchMock);

    const resolution = await resolveWashingtonCountyStatus();
    const spokane = resolution.counties[0];
    expect(spokane).toBeDefined();
    if (!spokane) throw new Error('Hosted Spokane status is missing.');

    await expect(verifyWashingtonCountySalesShard(spokane)).resolves.toMatchObject({
      salesShardVerification: 'verified',
    });
    await expect(verifyWashingtonCountySalesShard({
      ...spokane,
      primarySourceMode: 'repository_reference_demo',
      salesShardVerification: 'unverified',
    })).resolves.toMatchObject({
      salesShardVerification: 'not-required',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    await expect(fetchWashingtonLaunchQueue(2025, 'all', 1, 25, {
      countyCode: '063',
      hood: null,
      propertyType: null,
      saleDateFrom: null,
      saleDateTo: null,
      minPrice: null,
      maxPrice: null,
    })).rejects.toThrow(/authenticated package verification/i);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('rejects a successful hosted response whose body is not a valid county shard', async () => {
    const invalidShard = { htmlFallback: '<!doctype html>' };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => hostedEligibleStatus(),
      })
      .mockResolvedValueOnce(await hostedManifestResponse(invalidShard))
      .mockResolvedValueOnce(hostedShardResponse(invalidShard));
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
    expect(fetchMock).toHaveBeenCalledTimes(3);
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
