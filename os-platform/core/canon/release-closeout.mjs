/** Pure native product receipt contract. No filesystem, clock, network or issuer attestation. */
import { createHash } from 'node:crypto';
import { canonicalize } from './canon-evidence.mjs';
import schema from './product-terminal-receipt.schema.json' with { type: 'json' };

function requireThat(ok, message) {
  if (!ok) throw Object.assign(new Error(`RELEASE_INVALID: ${message}`), { code: 'RELEASE_INVALID' });
}
const equal = (a, b) => a !== undefined && b !== undefined && canonicalize(a) === canonicalize(b);
const digest = value => createHash('sha256').update(canonicalize(value)).digest('hex');
const identity = c => ({ name: c.name.replace(/^\//, ''), id: c.id, image: c.image });
const sorted = xs => [...xs].sort((a, b) => a.name.localeCompare(b.name, 'en'));
const same = (a, b, label) => requireThat(equal(a, b), label);

// The checked-in schema is the single shape authority. Only its used JSON Schema vocabulary
// is needed here; dependency-free validation rejects additional fields at every object level.
function validateShape(value, rule, location = 'receipt') {
  if ('const' in rule) same(value, rule.const, location);
  if (rule.enum) requireThat(rule.enum.includes(value), location);
  if (rule.type === 'object') {
    requireThat(value !== null && typeof value === 'object' && !Array.isArray(value), location);
    requireThat(Object.keys(value).every(k => Object.hasOwn(rule.properties, k)), `${location}: unknown field`);
    for (const k of rule.required) {
      requireThat(Object.hasOwn(value, k), `${location}.${k}: required`);
      validateShape(value[k], rule.properties[k], `${location}.${k}`);
    }
  } else if (rule.type === 'array') {
    requireThat(Array.isArray(value), location);
    requireThat(value.length >= rule.minItems && value.length <= rule.maxItems, `${location}: count`);
    requireThat(new Set(value.map(canonicalize)).size === value.length, `${location}: duplicate`);
    value.forEach((v, i) => validateShape(v, rule.items, `${location}[${i}]`));
  } else if (rule.type === 'string') {
    requireThat(typeof value === 'string', location);
    if (rule.minLength) requireThat(value.length >= rule.minLength, location);
    if (rule.pattern) requireThat(new RegExp(rule.pattern).test(value), location);
  } else if (rule.type === 'integer') {
    requireThat(Number.isSafeInteger(value) && value >= rule.minimum, location);
  }
}

function validateReceipt(receipt) {
  validateShape(receipt, schema);
  requireThat(new Date(`${receipt.acceptedAt}T00:00:00Z`).toISOString().slice(0, 10) === receipt.acceptedAt, 'acceptedAt');
  const { contentSha256, receiptId, ...content } = receipt;
  same(digest(content), contentSha256, 'contentSha256');
  same(receiptId, `tf-product-terminal:${contentSha256}`, 'receiptId');
  return receipt;
}

function typed(operation) {
  try { return operation(); } catch (error) {
    if (error.code === 'RELEASE_INVALID') throw error;
    throw Object.assign(new Error(`RELEASE_INVALID: ${error.message}`, { cause: error }), { code: 'RELEASE_INVALID' });
  }
}

export function validateProductTerminalReceipt(receipt) {
  return typed(() => validateReceipt(receipt));
}

/**
 * evidence: { [profile.files[].id]: { sha256: lower-case raw hash, bytes: integer,
 * value: parsed JSON / UTF-8 text / null for streamed binaries } }.
 * The filesystem adapter must hash and parse the same opened bytes before calling this pure
 * function. Matching hashes here are consistency checks, never caller trust or issuer proof.
 */
export function buildProductTerminalReceipt(input) {
  return typed(() => buildReceipt(input));
}

function buildReceipt({ policy: p, policySha256, evidence }) {
  requireThat(p?.schemaVersion === 1 && Array.isArray(p.files), 'profile');
  requireThat(/^[0-9a-f]{64}$/.test(policySha256), 'profile digest');
  requireThat(evidence && typeof evidence === 'object', 'evidence');
  const pins = new Map(p.files.map(f => [f.id, f]));
  requireThat(pins.size === p.files.length, 'duplicate evidence IDs');
  same(Object.keys(evidence).sort(), [...pins.keys()].sort(), 'evidence set');
  for (const f of p.files) {
    requireThat(evidence[f.id]?.sha256 === f.sha256 && evidence[f.id]?.bytes === f.bytes, `${f.id}: hash/length`);
  }
  const get = id => { requireThat(pins.has(id) && evidence[id]?.value != null, `missing ${id}`); return evidence[id].value; };
  const hash = id => { requireThat(pins.has(id), `missing ${id}`); return pins.get(id).sha256; };
  const v = get('verdict'), s = get('supervisor'), stage = get('stage'), seal = get('seal');
  for (const [id, record] of [['verdict', v], ['supervisor', s], ['stage', stage]]) {
    same(record.candidate, p.releaseSha, `${id}: candidate`); same(record.machine, p.machine, `${id}: machine`);
  }
  same(seal.candidate, p.releaseSha, 'seal: candidate');
  same(v.status, p.terminalState, 'terminal state'); same(v.conferenceReleaseReady, true, 'acceptance');
  same(v.statewideLaunchComplete, false, 'statewide limit'); same(v.productionDeployed, false, 'production limit');
  same(v.date, p.acceptedAt, 'historical day'); same(v.scope, p.scope, 'scope'); same(v.limits, p.limitations, 'limitations');
  for (const [key, value] of Object.entries({ independentExecutionAssurance: 'PASS', independentSealAssurance: 'PASS',
    deployedBentonConsumerEnforcement: 'PASS_UNKNOWN_DENY', originalWO103: 'COMPLETE_UNCHANGED', wifiControl: 'NOT_PERFORMED' })) {
    same(v.gates?.[key], value, `verdict gate ${key}`);
  }
  const kinds = { supervisor: 'supervisor', stage: 'stage', seal: 'seal', executionReview: 'independentExecutionReview',
    sealReview: 'independentSealReview', backendBuild: 'backendBuild', frontendBuild: 'frontendBuild', canonBuild: 'canonBuild', imageArchive: 'imageArchive' };
  requireThat(Array.isArray(v.evidence) && v.evidence.length === Object.keys(kinds).length, 'verdict references');
  for (const [id, kind] of Object.entries(kinds)) {
    const refs = v.evidence.filter(f => f.kind === kind);
    requireThat(refs.length === 1, `verdict reference ${kind}`);
    same(refs[0].sha256?.toLowerCase(), hash(id), `verdict hash ${kind}`);
    // Historical absolute paths are compared as exact strings, never used to open files.
    same(refs[0].path, pins.get(id).legacyPath, `legacy mapping ${kind}`);
  }
  same(s.status, 'FINAL_RC_TWO_JOURNEY_PRODUCT_ISOLATION_PASS', 'supervisor status');
  same(s.failure, null, 'supervisor failure'); same(s.cleanupErrors, [], 'supervisor cleanup');
  same(s.restorationProven, true, 'restoration'); same(s.fullReleaseReady, false, 'supervisor limited scope');
  same(s.wifiUntouched, true, 'wifi'); same(s.physicalOfflineProofReopened, false, 'physical offline boundary');
  requireThat(Array.isArray(s.journeys) && s.journeys.length === 2, 'two journeys');
  for (let i = 0; i < 2; i++) {
    const j = s.journeys[i];
    same(j.journey, i + 1, 'journey number'); same(j.status, 'RC_BROWSER_JOURNEY_PASS', 'journey status');
    same(j.finalEligibleAndCanonChecks, true, 'journey eligibility');
    const output = get(`journey${i + 1}`).output;
    requireThat(typeof output === 'string' && output.includes(`RC_RELEASE_IDENTITY ${p.releaseSha} journey=${i + 1}`)
      && output.includes(`RC_BROWSER_JOURNEY_PASS journey=${i + 1}`), 'journey output identity');
  }
  same(stage.status, 'FINAL_RC_STAGED_NOT_YET_ACCEPTED', 'historical stage');
  same(stage.fullReleaseReady, false, 'stage limited scope'); same(stage.cleanupErrors, [], 'stage cleanup');
  same(stage.wifiUntouched, true, 'stage wifi'); same(stage.wo103Reopened, false, 'stage offline boundary');
  same(stage.policy?.expectedDisposition, 'UNKNOWN_DENY', 'protected-data denial');
  same(stage.policy?.reviewedSchemaProvisioned, false, 'no protected-data activation');
  same(stage.sourceBinding?.apiProductVersion, `1.0.0+${p.releaseSha}`, 'binary source binding');
  const containers = sorted(s.original.map(identity));
  same(containers, sorted(p.containers), 'pinned container identities');
  requireThat(containers.length === 6 && new Set(containers.map(c => c.id)).size === 6, 'six distinct containers');
  const restored = [...s.restored.containers, s.restored.canon.container].map(identity);
  same(sorted(restored), containers, 'restored identities');
  same([...seal.images.map(i => i.id)].sort(), containers.map(c => c.image).sort(), 'six sealed images');
  const restart = get('restart'); same(restart.errors, [], 'restart errors');
  same(restart.containers, s.restart, 'restart supervisor binding'); same(restart.containers, p.restart, 'pinned restart');
  same(sorted(restart.containers.map(identity)), sorted(stage.deployed.map(identity)), 'four deployed/restarted identities');
  requireThat(restart.containers.length === 4 && stage.deployed.every(c => c.running), 'four running applications');
  for (const c of restart.containers) {
    requireThat(containers.some(x => equal(x, identity(c))), 'restart image/container mismatch');
    const before = Date.parse(c.before), after = Date.parse(c.after);
    requireThat(before < Date.parse(s.journeys[0].finishedAt) && after > Date.parse(s.journeys[0].finishedAt)
      && after < Date.parse(s.journeys[1].finishedAt), 'real intervening restart');
  }
  requireThat(Date.parse(s.startedAt) < Date.parse(s.journeys[0].finishedAt)
    && Date.parse(s.journeys[1].finishedAt) < Date.parse(s.finishedAt)
    && Date.parse(s.finishedAt) < Date.parse(seal.completedAt), 'acceptance sequence');
  for (const [component, name] of [['backend', 'backend'], ['frontend', 'frontend'], ['canon', 'canon-runtime']]) {
    const build = get(`${component}Build`), c = containers.find(x => x.name === `waco-${name}`);
    same(build.candidate, p.releaseSha, 'build candidate'); same(build.machine, p.machine, 'build machine');
    same(build.component, component, 'build component'); same(build.status, 'EXACT_SOURCE_IMAGE_BUILT_NOT_DEPLOYED', 'build status');
    same(build.imageId, c?.image, 'build image'); same(seal.images.find(i => i.id === c?.image)?.revision, p.releaseSha, 'sealed revision');
  }
  same(seal.status, 'FINAL_RC_LOCAL_SEAL_PENDING_INDEPENDENT_F', 'immutable pending seal');
  same(seal.independentFVerdict, 'PENDING', 'immutable pending F'); same(seal.fullReleaseReady, false, 'seal limited scope');
  same(seal.stage?.receiptHash, hash('stage'), 'seal stage hash'); same(seal.supervisor?.receiptHash, hash('supervisor'), 'seal supervisor hash');
  for (const [id, verdict] of [['executionReview', 'INDEPENDENT_F_BOUNDED_EXECUTION_PASS'], ['sealReview', 'SEAL_REVIEW_PASS']]) {
    const text = get(id); requireThat(typeof text === 'string' && text.includes(verdict) && text.includes(p.releaseSha), `${id}: independent verdict`);
  }
  const manifest = get('manifest'), sales = get('sales'), selection = manifest.sourceSelection;
  same(selection?.classification, p.classification, 'classification'); same(selection?.selectedRows, 50, 'selected rows');
  same(manifest.summary?.stagedSales, 50, 'manifest sales'); same(manifest.summary?.counties, 1, 'bounded county count');
  same(sales.county, p.county, 'sales county'); same(sales.countyCode, p.countyCode, 'sales county code');
  same(sales.summary?.records, 50, 'sales count'); requireThat(sales.records?.length === 50, '50 sale records');
  requireThat(manifest.salesShardAttestations?.length === 1, 'single county attestation');
  const attestation = manifest.salesShardAttestations[0];
  same(attestation.county, p.county, 'attested county'); same(attestation.countyCode, p.countyCode, 'attested county code');
  same(attestation.sourcePayloadSha256, selection.sourceSha256, 'package source hash');
  for (const sale of sales.records) {
    same(sale.county, p.county, 'row county'); same(sale.countyCode, p.countyCode, 'row county code');
    same(sale.provenance?.sourcePayloadSha256, selection.sourceSha256, 'row provenance');
    requireThat(sale.ratio == null && sale.assessedValue == null, 'zero computable ratios');
  }
  requireThat(new Set(sales.records.map(r => r.saleId)).size === 50, 'duplicate sales');
  for (const [id, path] of [['manifest', 'manifest.json'], ['sales', 'sales/by-county/005.json']]) {
    const entries = seal.packages?.filter(f => f.path === path);
    requireThat(entries?.length === 1 && entries[0].hash === hash(id), 'sealed package hash');
  }
  same(stage.rollback, p.rollback, 'pinned rollback identities');
  const archive = v.evidence.find(f => f.kind === 'imageArchive');
  same(archive.bytes, pins.get('imageArchive').bytes, 'archive size'); same(archive.imageCount, 6, 'archive image count');
  same(archive.restoredFromArchive, false, 'archive not restored');
  requireThat(get('archiveReport').includes(p.releaseSha), 'archive report identity');
  const content = {
    schemaVersion: 'terrafusion.product-terminal-receipt.v1', productId: p.productId, repository: p.repository,
    terminalState: v.status, releaseId: p.releaseId, releaseSha: v.candidate, deploymentId: p.deploymentId, machine: v.machine,
    authority: { surface: 'terracanon', mode: 'local-maintenance', profileId: p.profileId, profileSha256: policySha256 }, acceptedAt: v.date,
    countyPackage: { countyId: p.countyId, county: sales.county, countyCode: sales.countyCode, classification: selection.classification,
      sales: sales.records.length, computableRatios: 0, manifestSha256: hash('manifest'), salesSha256: hash('sales'), sourcePayloadSha256: selection.sourceSha256 },
    deployment: { scope: v.scope, containers, restart: structuredClone(restart.containers), restorationProven: s.restorationProven },
    assurance: { executionVerdict: 'INDEPENDENT_F_BOUNDED_EXECUTION_PASS', sealVerdict: 'SEAL_REVIEW_PASS', originalSealStatus: seal.status,
      executionReviewSha256: hash('executionReview'), sealReviewSha256: hash('sealReview') },
    recovery: { rollbackContainers: structuredClone(stage.rollback), archive: { sha256: hash('imageArchive'), bytes: archive.bytes,
      imageCount: 6, restoredFromArchive: false }, databaseBackup: false, recoveryTested: false },
    acceptanceEvidence: p.files.map(({ id, root, path, sha256, bytes }) => ({ id, root, path, sha256, bytes })).sort((a, b) => a.id.localeCompare(b.id, 'en')),
    limitations: [...v.limits], statewideLaunchComplete: false, productionDeployed: false,
  };
  const contentSha256 = digest(content);
  return validateProductTerminalReceipt({ ...content, receiptId: `tf-product-terminal:${contentSha256}`, contentSha256 });
}
