import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setToken } from '../../auth/authStorage';
import { setDevSession } from '../../auth/session';
import {
  ApiFetchError,
  getDaisAppealReadError,
  LiveDataProvider,
} from '../LiveDataProvider';

const COUNTY_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_COUNTY_ID = '22222222-2222-2222-2222-222222222222';
const PARCEL_ID = 'SR009B-SYNTHETIC-P1';
const APPEAL_ID = '33333333-3333-3333-3333-333333333333';

function jwtForCounty(countyId: string): string {
  const encode = (value: object) => btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: 'sr009b-user', countyId })}.sig`;
}

function validResponse() {
  return {
    schemaVersion: '1.0.0',
    countyId: COUNTY_ID,
    appeals: [
      {
        appealId: APPEAL_ID,
        parcelId: PARCEL_ID,
        taxYear: 2026,
        ground: 'MARKET_VALUE',
        status: 'filed',
        filedAt: '2026-02-03T12:00:00.0000000Z',
        hearingAt: '2026-03-03T12:00:00Z',
      },
    ],
    traceId: 'trace-sr009b',
  };
}

function stubResponse(payload: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('LiveDataProvider Dais appeal workflow contract', () => {
  beforeEach(() => {
    setDevSession({
      userId: 'sr009b-user',
      countyId: COUNTY_ID,
      role: 'Assessor',
      mode: 'pilot',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('maps the exact frozen response without inventing petitioner or value fields', async () => {
    const fetchMock = stubResponse(validResponse());

    const appeals = await new LiveDataProvider().getAppeals(PARCEL_ID);

    expect(appeals).toEqual([
      {
        appealId: APPEAL_ID,
        parcelId: PARCEL_ID,
        appealYear: 2026,
        appealGround: 'MARKET_VALUE',
        status: 'filed',
        filingDate: '2026-02-03T12:00:00.0000000Z',
        hearingDate: '2026-03-03T12:00:00Z',
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/dais/appeals/parcel/${PARCEL_ID}/workflow-read`,
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-county-id': COUNTY_ID }),
        signal: expect.any(AbortSignal),
      }),
    );
    expect(appeals[0]).not.toHaveProperty('petitionerName');
    expect(appeals[0]).not.toHaveProperty('currentAssessedValue');
    expect(appeals[0]).not.toHaveProperty('petitionedValue');
  });

  it('returns an exact empty array only after a valid successful response', async () => {
    stubResponse({ ...validResponse(), appeals: [] });

    await expect(new LiveDataProvider().getAppeals(PARCEL_ID)).resolves.toEqual([]);
  });

  it('uses the authenticated JWT county instead of a stale dev-session county', async () => {
    setDevSession({ userId: 'stale-user', countyId: OTHER_COUNTY_ID, role: 'Assessor' });
    setToken(jwtForCounty(COUNTY_ID));
    const fetchMock = stubResponse(validResponse());

    await expect(new LiveDataProvider().getAppeals(PARCEL_ID)).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/dais/appeals/parcel/${PARCEL_ID}/workflow-read`,
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-County-Id': COUNTY_ID }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it.each([
    ['schema', (value: ReturnType<typeof validResponse>) => ({ ...value, schemaVersion: '2.0.0' })],
    [
      'county',
      (value: ReturnType<typeof validResponse>) => ({ ...value, countyId: OTHER_COUNTY_ID }),
    ],
    [
      'parcel',
      (value: ReturnType<typeof validResponse>) => ({
        ...value,
        appeals: [{ ...value.appeals[0], parcelId: 'OTHER-PARCEL' }],
      }),
    ],
    [
      'status',
      (value: ReturnType<typeof validResponse>) => ({
        ...value,
        appeals: [{ ...value.appeals[0], status: 'pending' }],
      }),
    ],
    [
      'ground',
      (value: ReturnType<typeof validResponse>) => ({
        ...value,
        appeals: [{ ...value.appeals[0], ground: 'OTHER' }],
      }),
    ],
    [
      'UTC timestamp',
      (value: ReturnType<typeof validResponse>) => ({
        ...value,
        appeals: [{ ...value.appeals[0], filedAt: '2026-02-03T12:00:00-08:00' }],
      }),
    ],
    [
      'duplicate identity',
      (value: ReturnType<typeof validResponse>) => ({
        ...value,
        appeals: [value.appeals[0], { ...value.appeals[0] }],
      }),
    ],
  ])('fails closed on invalid %s evidence', async (_label, mutate) => {
    stubResponse(mutate(validResponse()));

    await expect(new LiveDataProvider().getAppeals(PARCEL_ID)).rejects.toThrow(
      /contract|duplicate/i
    );
  });

  it('preserves the backend trace as a visible correlation ID on contract failure', async () => {
    stubResponse({ ...validResponse(), schemaVersion: '2.0.0' });

    await expect(new LiveDataProvider().getAppeals(PARCEL_ID)).rejects.toMatchObject({
      correlationId: 'corr-trace-sr009b',
    });
    expect(getDaisAppealReadError(PARCEL_ID)).toEqual({
      message: 'Appeal records are unavailable for this parcel.',
      correlationId: 'corr-trace-sr009b',
    });
  });

  it.each([401, 403])(
    'preserves API %s as an authentication or authorization failure',
    async (status) => {
      stubResponse({}, status);

      await expect(new LiveDataProvider().getAppeals(PARCEL_ID)).rejects.toMatchObject({ status });
      await expect(new LiveDataProvider().getAppeals(PARCEL_ID)).rejects.toBeInstanceOf(
        ApiFetchError
      );
    }
  );

  it('fails before network access when county identity is not canonical', async () => {
    setDevSession({ userId: 'sr009b-user', countyId: 'benton', role: 'Assessor' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(new LiveDataProvider().getAppeals(PARCEL_ID)).rejects.toThrow(/canonical county/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
