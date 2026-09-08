import assert from 'node:assert/strict';

// The same behavioral cases run in Vitest and in the dependency-free sparse lane.
// Node loads whole, real TS/JSON modules; no production function is extracted or mocked.
const nodeOnly = process.env.WAL_NODE_TESTS === '1';
const { test } = nodeOnly ? await import('node:test') : await import('vitest');
async function loadClient() {
  if (!nodeOnly) return import('../../services/washingtonCountyLaunch');
  const { readFileSync, existsSync } = await import('node:fs');
  const { dirname, resolve } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { stripTypeScriptTypes } = await import('node:module');
  const { SourceTextModule, SyntheticModule } = await import('node:vm');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const modules = new Map();
  function load(path: string) {
    if (modules.has(path)) return modules.get(path);
    const source = readFileSync(path, 'utf8');
    const module = path.endsWith('.json')
      ? new SyntheticModule(['default'], function () {
          this.setExport('default', JSON.parse(source));
        })
      : new SourceTextModule(stripTypeScriptTypes(source), { identifier: path });
    modules.set(path, module);
    return module;
  }
  const client = load(resolve(root, 'services/washingtonCountyLaunch.ts'));
  await client.link((specifier: string, parent: { identifier: string }) => {
    const path = specifier.startsWith('@/')
      ? resolve(root, specifier.slice(2))
      : resolve(dirname(parent.identifier), specifier);
    return load(existsSync(path) ? path : `${path}.ts`);
  });
  await client.evaluate();
  return client.namespace;
}
const client = await loadClient();
const fetchBaseline = (...args: unknown[]) => {
  assert.equal(
    typeof client.fetchWashingtonParcelBaseline,
    'function',
    'parcel metadata client is missing'
  );
  return client.fetchWashingtonParcelBaseline(...args);
};
const receipt = (overrides: Record<string, unknown> = {}) => ({
  contractId: 'wal.county-parcel-baseline.v1',
  countyId: '00000000-0000-0000-0000-000000000063',
  countyKey: 'wa-spokane',
  countyName: 'Spokane',
  countyCode: '063',
  fipsCode: '53063',
  observedParcelCount: 2,
  linkedParcelCount: 1,
  latestParcelUpdatedAtUtc: '2026-09-01T12:00:00Z',
  publicProvenance: 'unverified',
  sourceUse: 'unverified',
  publicReady: false,
  status: 'unverified',
  gapReasons: ['public-provenance-unverified', 'source-use-unverified'],
  ...overrides,
});
const response = (value: unknown, status = 200) =>
  ({
    ok: status === 200,
    status,
    json: async () => value,
  }) as Response;

test('returns county runtime counts without advertising public readiness', async () => {
  const result = await fetchBaseline('063', async (path: string, init: RequestInit) => {
    assert.equal(path, '/counties/063/parcel-baseline');
    assert.equal(init.method, 'GET');
    assert.equal(init.cache, 'no-store');
    return response(receipt());
  });
  assert.equal(result.observedParcelCount, 2);
  assert.equal(result.linkedParcelCount, 1);
  assert.equal(result.publicReady, false);
});

test('accepts no runtime parcels as an explicit absence', async () => {
  const result = await fetchBaseline('063', async () =>
    response(
      receipt({
        observedParcelCount: 0,
        linkedParcelCount: 0,
        latestParcelUpdatedAtUtc: null,
        status: 'no-parcels',
        gapReasons: ['no-runtime-parcels', 'public-provenance-unverified', 'source-use-unverified'],
      })
    )
  );
  assert.equal(result.status, 'no-parcels');
  assert.equal(result.observedParcelCount, 0);
});

// Hand-checked identities, independent of the production registry implementation.
const counties =
  '001:Adams|003:Asotin|005:Benton|007:Chelan|009:Clallam|011:Clark|013:Columbia|015:Cowlitz|017:Douglas|019:Ferry|021:Franklin|023:Garfield|025:Grant|027:Grays Harbor|029:Island|031:Jefferson|033:King|035:Kitsap|037:Kittitas|039:Klickitat|041:Lewis|043:Lincoln|045:Mason|047:Okanogan|049:Pacific|051:Pend Oreille|053:Pierce|055:San Juan|057:Skagit|059:Skamania|061:Snohomish|063:Spokane|065:Stevens|067:Thurston|069:Wahkiakum|071:Walla Walla|073:Whatcom|075:Whitman|077:Yakima';
for (const entry of counties.split('|')) {
  const [code, name] = entry.split(':');
  test(`accepts canonical ${name} identity`, async () => {
    const result = await fetchBaseline(code, async () =>
      response(
        receipt({
          countyCode: code,
          countyName: name,
          fipsCode: `53${code}`,
          countyKey: `wa-${name.toLowerCase().replaceAll(' ', '-')}`,
        })
      )
    );
    assert.equal(result.countyName, name);
  });
}

for (const [name, patch] of Object.entries({
  'cross-county response': {
    countyCode: '005',
    countyName: 'Benton',
    countyKey: 'wa-benton',
    fipsCode: '53005',
  },
  'mismatched name': { countyName: 'Benton' },
  'mismatched key': { countyKey: 'wa-benton' },
  'mismatched FIPS': { fipsCode: '53005' },
  'unknown contract': { contractId: 'v2' },
  'empty GUID': { countyId: '00000000-0000-0000-0000-000000000000' },
  'invalid GUID': { countyId: 'county-source-name' },
  'negative count': { observedParcelCount: -1 },
  'fractional count': { observedParcelCount: 1.5 },
  'unsafe count': { observedParcelCount: Number.MAX_SAFE_INTEGER + 1 },
  'excess linked count': { linkedParcelCount: 3 },
  'missing count': { observedParcelCount: undefined, sourceCount: 100000 },
  'sales aggregate': { observedParcelCount: undefined, stagedSales: 100000 },
  'invented public readiness': { publicReady: true },
  'invented verified origin': { publicProvenance: 'verified' },
  'unsupported licensing claim': { sourceUse: 'restricted' },
  'inconsistent absence': { status: 'no-parcels' },
  'invalid timestamp': { latestParcelUpdatedAtUtc: 'yesterday' },
  'impossible calendar date': { latestParcelUpdatedAtUtc: '2026-02-31T12:00:00Z' },
  'missing timestamp': { latestParcelUpdatedAtUtc: undefined },
  'missing gap': { gapReasons: [] },
  'unknown gap': { gapReasons: ['made-up'] },
  'unexpected records': { rows: [{ owner: 'must not be retained' }] },
})) {
  test(`rejects ${name}`, async () => {
    await assert.rejects(() => fetchBaseline('063', async () => response(receipt(patch))));
  });
}

test('unknown county is refused before requesting metadata', async () => {
  await assert.rejects(() =>
    fetchBaseline('999', async () => {
      assert.fail('must not fetch');
    })
  );
});
for (const status of [401, 403, 404, 500]) {
  test(`HTTP ${status} cannot become zero parcels or disclose its body`, async () => {
    await assert.rejects(
      () => fetchBaseline('063', async () => response({ secret: 'private' }, status)),
      (error: Error) => !error.message.includes('private')
    );
  });
}
test('request failure has no reference or sales fallback', async () => {
  await assert.rejects(() =>
    fetchBaseline('063', async () => {
      throw new Error('network');
    })
  );
});
test('already cancelled request never starts', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() =>
    fetchBaseline(
      '063',
      async () => {
        assert.fail('must not fetch');
      },
      controller.signal
    )
  );
});
test('cancelled request rejects even if transport resolves late', async () => {
  const controller = new AbortController();
  let finish!: (value: Response) => void;
  const result = fetchBaseline(
    '063',
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
    controller.signal
  );
  controller.abort();
  finish(response(receipt()));
  await assert.rejects(() => result);
});
test('a stalled transport reaches a bounded failure', async () => {
  const original = globalThis.setTimeout;
  globalThis.setTimeout = ((callback: () => void) => original(callback, 0)) as typeof setTimeout;
  try {
    await assert.rejects(
      () => fetchBaseline('063', () => new Promise(() => {})),
      (error: Error) => error.name === 'TimeoutError'
    );
  } finally {
    globalThis.setTimeout = original;
  }
});
