/**
 * OS-COUNTY-CONTEXT-001 manifest prerequisite.
 * Run: node --test os-platform/core/tests/active-staged-manifest.test.mjs
 * Uses the existing Ajv dependency; no alternate validator or runtime is introduced.
 * These are registry/contract proofs, not backend persistence or UI acceptance.
 */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const { ToolRegistry } = require('../pilot/ToolRegistry.js');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const base = 'e16572b09da89ca9f8e421ffadcb82aa211126e3';
const activePath = 'tools/registry/terrapilot.tools.json';
const stagedPath = 'tools/registry/terrapilot.tools.forward-staged.json';
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const baseline = JSON.parse(execFileSync('git', ['show', base + ':' + activePath], { cwd: root, encoding: 'utf8' }));
const active = readJson(activePath);
const reservedSuites = new Set(['clerk', 'treasury', 'audit']);
const expectedStaged = baseline.tools.filter((t) => reservedSuites.has(t.suite) && t.toolId !== 'export_audit_bundle');
const stagedIds = new Set(expectedStaged.map((t) => t.toolId));
const workflowIds = ['export_equalization_package', 'export_audit_bundle', 'open_appeal_packet', 'generate_morning_brief'];
const getTool = (id) => {
  const tool = active.tools.find((t) => t.toolId === id);
  assert.ok(tool, 'Missing active tool: ' + id);
  return tool;
};
const gatePath = 'scripts/spec-gates/write-lanes.mjs';
const gateSource = readFileSync(join(root, gatePath), 'utf8');
// Replace only imports with fixture bindings. The actual gate's assertion/reporting body
// executes unchanged; no fixture files, production manifest writes, or duplicate validator.
const gateBody = gateSource
  .replace(/^import \{ existsSync, readFileSync \} from 'fs';\r?\n/m, '')
  .replace(/^import \{ join \} from 'path';\r?\n/m, '');
function runGate(manifest) {
  const lines = [];
  const finished = new Error('gate finished');
  let status;
  assert.doesNotMatch(gateBody, /^import /m, 'Unexpected gate imports require explicit fixture support');
  try {
    runInNewContext(gateBody, {
      existsSync: (path) => path === join(root, activePath),
      readFileSync: (path) => {
        assert.equal(path, join(root, activePath));
        return JSON.stringify(manifest);
      },
      join,
      console: { log: (...args) => lines.push(args.join(' ')) },
      process: {
        cwd: () => root,
        exit: (code) => { status = code; throw finished; },
      },
    }, { timeout: 1000 });
  } catch (error) {
    if (error !== finished) throw error;
  }
  assert.notEqual(status, undefined, 'Gate must explicitly exit');
  return { status, output: lines.join('\n') };
}

test('the exact 18 future-office objects are preserved in their original order', () => {
  const staged = readJson(stagedPath);
  assert.equal(expectedStaged.length, 18);
  assert.equal(staged.activation, 'not-authorized');
  assert.equal(staged.sourceCommit, base);
  assert.deepEqual(staged.tools, expectedStaged);
});

test('active and staged inventories are disjoint and preserve all 116 tool identities', () => {
  const staged = readJson(stagedPath);
  assert.equal(active.tools.length, 98);
  assert.equal(staged.tools.length, 18);
  const ids = [...active.tools, ...staged.tools].map((t) => t.toolId);
  assert.equal(new Set(ids).size, 116);
  assert.deepEqual([...ids].sort(), baseline.tools.map((t) => t.toolId).sort());
  assert.ok(active.tools.every((t) => !reservedSuites.has(t.suite) && !stagedIds.has(t.toolId)));
});

test('unaffected active declarations are unchanged, including their privacy and permissions', () => {
  assert.deepEqual(
    active.tools.filter((t) => !workflowIds.includes(t.toolId)),
    baseline.tools.filter((t) => !stagedIds.has(t.toolId) && !workflowIds.includes(t.toolId)),
  );
});

test('staging register records the exact split and retains the 19-ID provenance', () => {
  const register = readJson('docs/brain/canon/reserved-staging.json');
  const footprint = register.footprint.manifest_tools;
  assert.equal(footprint.file, stagedPath);
  assert.equal(footprint.count, 18);
  assert.deepEqual(Object.values(footprint.ids).flat().sort(), [...stagedIds].sort());
  assert.equal(register.manifest_separation.source_commit, base);
  assert.equal(register.manifest_separation.active_manifest, activePath);
  assert.equal(register.manifest_separation.reclassified_tool.toolId, 'export_audit_bundle');
  assert.deepEqual(
    Object.values(register.manifest_separation.original_ids).flat().sort(),
    baseline.tools.filter((t) => reservedSuites.has(t.suite)).map((t) => t.toolId).sort(),
  );
  assert.equal(register.gate.frontend.status, 'pending-coordinator-integration');
  assert.equal(register.gate.runtime.status, 'active-manifest-only');
});

test('Dossier owns the export, retains privacy, and declares no direct Trace access', () => {
  const tool = getTool('export_audit_bundle');
  assert.equal(tool.suite, 'dossier');
  assert.equal(tool.writeLane, 'dossier');
  assert.equal(tool.payloadStore, 'dossier');
  assert.deepEqual(tool.touches, ['dossier', 'workflow']);
  assert.equal(tool.risk, 'write_low');
  assert.equal(tool.officeScope, 'assessor');
  assert.match(tool.description, /no direct Trace store access/i);
});

test('all four workflows preserve modes, risk, confirmation, reasons, and privacy controls', () => {
  for (const id of workflowIds) {
    const before = baseline.tools.find((t) => t.toolId === id);
    const after = getTool(id);
    for (const key of ['mode', 'risk', 'requiresConfirmation', 'reasonCodeRequired', 'reasonCodes',
      'requiresSupervisorApproval', 'supervisorRoles', 'piiHandling', 'tracePolicy', 'officeScope']) {
      assert.deepEqual(after[key], before[key], id + '.' + key);
    }
  }
});

test('the normal registry loads active tools only, even with the historical activation flag set', async () => {
  const previousFlag = process.env.TF_ENABLE_FORWARD_STAGED_OFFICES;
  const previousOverride = process.env.TERRAFUSION_TOOL_MANIFEST_PATH;
  try {
    delete process.env.TERRAFUSION_TOOL_MANIFEST_PATH;
    for (const value of ['false', 'true']) {
      process.env.TF_ENABLE_FORWARD_STAGED_OFFICES = value;
      const registry = new ToolRegistry();
      await registry.initialize();
      for (const id of stagedIds) assert.equal(registry.getTool(id), undefined, id);
      for (const id of workflowIds) assert.ok(registry.getTool(id), id);
      assert.equal(registry.getTool('export_audit_bundle').writeLane, 'dossier');
    }
  } finally {
    if (previousFlag === undefined) delete process.env.TF_ENABLE_FORWARD_STAGED_OFFICES;
    else process.env.TF_ENABLE_FORWARD_STAGED_OFFICES = previousFlag;
    if (previousOverride === undefined) delete process.env.TERRAFUSION_TOOL_MANIFEST_PATH;
    else process.env.TERRAFUSION_TOOL_MANIFEST_PATH = previousOverride;
  }
});

test('the real unchanged write-lanes command passes for the active manifest', () => {
  const result = spawnSync(process.execPath, [gatePath], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /98 tools validated/);
});

test('the fixture harness reproduces all 21 inherited violations', () => {
  const result = runGate(baseline);
  assert.equal(result.status, 1);
  assert.match(result.output, /Found 21 violation/);
});

test('staged declarations cannot pass the active gate or be silently recombined', () => {
  const staged = readJson(stagedPath);
  for (const manifest of [staged, { ...active, tools: [...active.tools, ...staged.tools] }]) {
    const result = runGate(manifest);
    assert.equal(result.status, 1);
    assert.match(result.output, /Found 18 violation/);
    assert.match(result.output, /invalid_suite/);
  }
});

for (const [name, mutate, rule] of [
  ['new reserved tool', (m) => m.tools.push({toolId: 'new_reserved_probe', suite: 'clerk', risk: 'read_only', writeLane: null}), 'invalid_suite'],
  ['cross-lane write', (m) => { m.tools.find((t) => t.toolId === 'export_audit_bundle').writeLane = 'dais'; }, 'cross_lane_write'],
  ['read-only write lane', (m) => { m.tools.find((t) => t.toolId === 'open_appeal_packet').writeLane = 'dossier'; }, 'read_only_with_write_lane'],
  ['missing high-risk confirmation', (m) => { Object.assign(m.tools.find((t) => t.toolId === 'export_audit_bundle'), {risk:'write_high', requiresConfirmation:false}); }, 'missing_confirmation'],
  ['duplicate tool identity', (m) => m.tools.push(structuredClone(m.tools[0])), 'duplicate_tool_id'],
]) {
  test('unchanged gate rejects ' + name, () => {
    const candidate = structuredClone(active);
    mutate(candidate);
    const result = runGate(candidate);
    assert.equal(result.status, 1);
    assert.match(result.output, new RegExp('\\[' + rule + '\\]'));
  });
}

test('restoring direct Trace access to the Dossier writer still fails both Trace rules', () => {
  const candidate = structuredClone(active);
  candidate.tools.find((t) => t.toolId === 'export_audit_bundle').touches.push('trace');
  const result = runGate(candidate);
  assert.equal(result.status, 1);
  assert.match(result.output, /trace_suite_violation/);
  assert.match(result.output, /trace_write_violation/);
});

const uuid = '7f58ee0f-a862-4d74-a603-82b153674d01';
const fixtures = {
  export_equalization_package: { county: 'synthetic-county', draftVersion: uuid, revision: 'ab'.repeat(32), taxYear: 2026, requestId: uuid },
  export_audit_bundle: { county: 'synthetic-county', taxYear: 2026, requestId: uuid },
  open_appeal_packet: { county: 'synthetic-county', appealId: 'synthetic-appeal', taxYear: 2026 },
  generate_morning_brief: { county: 'synthetic-county', taxYear: 2026, role: 'chief_appraiser' },
};
const ajv = new Ajv({ allErrors: true, strict: true });

test('audit bundle scope matches the supported county/parcel/appeal backend contract', () => {
  const schema = getTool('export_audit_bundle').paramsSchema;
  assert.deepEqual(schema.properties.bundleScope.enum, ['county', 'parcel', 'appeal']);
  const validate = ajv.compile(schema);
  for (const bundleScope of ['county', 'parcel', 'appeal']) {
    assert.equal(validate({ ...fixtures.export_audit_bundle, bundleScope, subjectId: 'synthetic-subject' }), true, bundleScope);
  }
  for (const bundleScope of ['neighborhood', 'all-counties', 'Parcel', '']) {
    assert.equal(validate({ ...fixtures.export_audit_bundle, bundleScope }), false, bundleScope);
  }
});

for (const [id, key] of [
  ['export_equalization_package', 'draftVersion'],
  ['export_equalization_package', 'revision'],
  ['export_equalization_package', 'requestId'],
  ['export_audit_bundle', 'requestId'],
]) {
  test(id + ': ' + key + ' accepts canonical lowercase and rejects uppercase or mixed case', () => {
    const validate = ajv.compile(getTool(id).paramsSchema);
    const canonical = fixtures[id][key];
    assert.equal(validate(fixtures[id]), true, JSON.stringify(validate.errors));
    for (const value of [canonical.toUpperCase(), canonical.replace(/[a-f]/, (char) => char.toUpperCase())]) {
      assert.notEqual(value, canonical, 'Negative fixture must change case');
      assert.equal(validate({ ...fixtures[id], [key]: value }), false, value);
    }
  });
}

for (const id of workflowIds) {
  test(id + ': accepts its bounded request and rejects every missing required input', () => {
    const schema = getTool(id).paramsSchema;
    const validate = ajv.compile(schema);
    assert.deepEqual([...schema.required].sort(), Object.keys(fixtures[id]).sort());
    assert.equal(validate(fixtures[id]), true, JSON.stringify(validate.errors));
    for (const key of Object.keys(fixtures[id])) {
      const params = { ...fixtures[id] };
      delete params[key];
      assert.equal(validate(params), false, 'must require ' + key);
    }
  });
  test(id + ': rejects raw sources, privacy overrides, extra fields, and invalid context types', () => {
    const validate = ajv.compile(getTool(id).paramsSchema);
    for (const extra of [
      { sourcePrivacy: 'public' }, { sources: [{ ssn: 'synthetic-sensitive-field' }] },
      { sourceRecords: [] }, { unknownParameter: true }, { countyId: 'another-county' },
    ]) assert.equal(validate({ ...fixtures[id], ...extra }), false, JSON.stringify(extra));
    for (const county of ['', '   ', 42, null]) {
      assert.equal(validate({ ...fixtures[id], county }), false, 'invalid county');
    }
    for (const taxYear of ['2026', 2026.5, null]) {
      assert.equal(validate({ ...fixtures[id], taxYear }), false, 'invalid taxYear');
    }
  });
}

test('equalization rejects display draft names, malformed identities, and invalid SHA-256 revisions', () => {
  const validate = ajv.compile(getTool('export_equalization_package').paramsSchema);
  for (const draftVersion of ['benton-2026-working', '', 'not-a-guid', uuid + '\n', '00000000-0000-0000-0000-000000000000']) {
    assert.equal(validate({ ...fixtures.export_equalization_package, draftVersion }), false, draftVersion);
  }
  for (const revision of ['', 'ab'.repeat(31), 'ab'.repeat(33), 'ab'.repeat(32) + '\n', 'z'.repeat(64), 42]) {
    assert.equal(validate({ ...fixtures.export_equalization_package, revision }), false, String(revision));
  }
});

test('both exports require valid request UUIDs and reject unknown reason codes', () => {
  for (const id of ['export_equalization_package', 'export_audit_bundle']) {
    const tool = getTool(id);
    const validate = ajv.compile(tool.paramsSchema);
    for (const requestId of ['', 'request-1', uuid + '\n', '00000000-0000-0000-0000-000000000000', 42]) {
      assert.equal(validate({ ...fixtures[id], requestId }), false, id);
    }
    for (const reasonCode of tool.reasonCodes) {
      assert.equal(validate({ ...fixtures[id], reasonCode }), true, id);
    }
    assert.equal(validate({ ...fixtures[id], reasonCode: 'bypass_approval' }), false, id);
  }
});

test('optional scope, parcel, and queue selectors remain bounded', () => {
  const audit = ajv.compile(getTool('export_audit_bundle').paramsSchema);
  assert.equal(audit({ ...fixtures.export_audit_bundle, bundleScope: 'appeal', subjectId: 'synthetic-appeal' }), true);
  assert.equal(audit({ ...fixtures.export_audit_bundle, bundleScope: 'all-counties' }), false);
  assert.equal(audit({ ...fixtures.export_audit_bundle, subjectId: '  ' }), false);
  const appeal = ajv.compile(getTool('open_appeal_packet').paramsSchema);
  assert.equal(appeal({ ...fixtures.open_appeal_packet, parcelId: 'synthetic-parcel' }), true);
  assert.equal(appeal({ ...fixtures.open_appeal_packet, parcelId: '' }), false);
  assert.equal(appeal({ ...fixtures.open_appeal_packet, appealId: '  ' }), false);
  const brief = ajv.compile(getTool('generate_morning_brief').paramsSchema);
  assert.equal(brief({ ...fixtures.generate_morning_brief, queueType: 'morning_brief' }), true);
  assert.equal(brief({ ...fixtures.generate_morning_brief, role: 'root' }), false);
  assert.equal(brief({ ...fixtures.generate_morning_brief, queueType: 'unrestricted' }), false);
});
