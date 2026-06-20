/**
 * TerraFusion Brain — canon loader + deterministic reasoning.
 *
 * Reads the machine-readable canon under docs/brain/canon/*.json (digest of TF-052 +
 * .github/AGENT_ENTRYPOINT.md). Reasoning is deterministic rule lookups, NOT generation —
 * if the canon does not answer, the Brain says so rather than guessing. (proof standard, ADR-0003)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, '..', '..');
const CANON_DIR = join(REPO_ROOT, 'docs', 'brain', 'canon');

const load = name => JSON.parse(readFileSync(join(CANON_DIR, name), 'utf8'));

export const canon = {
  suites: load('suites.json'),
  writeLanes: load('write-lanes.json'),
  layers: load('layers.json'),
  naming: load('naming-rules.json'),
  surfaceContract: load('surface-contract.json'),
};

const SUITE_KEYWORDS = {
  forge: [
    'valuation',
    'value',
    'model',
    'calibrat',
    'comp',
    'cost approach',
    'income approach',
    'cama',
    'pricing',
    'assess value',
  ],
  atlas: [
    'gis',
    'geometry',
    'geospatial',
    'map',
    'layer',
    'parcel boundary',
    'spatial',
    'neighborhood',
    'symbology',
  ],
  dais: [
    'workflow',
    'permit',
    'exemption',
    'appeal',
    'notice',
    'certification',
    'queue',
    'task',
    'hearing',
    'roll',
    'boe',
  ],
  dossier: [
    'document',
    'evidence',
    'packet',
    'narrative',
    'case file',
    'pdf',
    'upload',
    'record bundle',
  ],
  gpt: ['summar', 'draft', 'rag', 'embedding', 'chat', 'prompt', 'q&a', 'retrieval'],
};

/** Which suite owns a free-text data concept? Returns {suite, matched} or null. */
export function ownerOf(text) {
  const t = String(text).toLowerCase();
  for (const [suite, kws] of Object.entries(SUITE_KEYWORDS)) {
    const matched = kws.find(k => t.includes(k));
    if (matched) return { suite, matched };
  }
  return null;
}

/** Can `suite` write to `target` lane? Returns {allowed, reason, bridge}. */
export function canWrite(suite, target) {
  const lane = canon.writeLanes.lanes[suite];
  if (!lane) return { allowed: null, reason: `unknown suite "${suite}"`, bridge: null };
  if (suite === target)
    return { allowed: true, reason: `${suite} owns its own lane`, bridge: null };
  if (lane.must_not_write.includes(target)) {
    return {
      allowed: false,
      reason: `${suite} must not directly write ${target} (cross-lane mutation prohibited)`,
      bridge: lane.bridge,
    };
  }
  return {
    allowed: false,
    reason: `no declared write path from ${suite} to ${target}`,
    bridge: lane.bridge,
  };
}

/** Classify a work request into layer / owner / allowed-forbidden writes. */
export function classify(text) {
  const t = String(text).toLowerCase();
  const owner = ownerOf(t);
  const parcelScoped = /\bparcel\b|property workbench|parcel-scoped/.test(t);
  const naming = checkNaming(t);

  let layer, surface;
  if (parcelScoped) {
    layer = canon.layers.layers.find(l => l.id === 'workbench');
    surface = `Property Workbench${owner ? ` (${canon.suites.active[owner.suite]?.display || owner.suite} tab)` : ''}`;
  } else if (owner) {
    layer = canon.layers.layers.find(l => l.id === 'suite-workspace');
    surface = canon.suites.active[owner.suite]?.display || owner.suite;
  } else {
    layer = null;
    surface = 'UNRESOLVED — owner unclear; ask the architect before building';
  }

  const ownerSuite = owner?.suite;
  const lane = ownerSuite ? canon.writeLanes.lanes[ownerSuite] : null;
  return {
    request: text,
    layer: layer ? `Layer ${layer.n} / ${layer.name}` : 'UNRESOLVED',
    suite: ownerSuite ? canon.suites.active[ownerSuite]?.display || ownerSuite : 'UNRESOLVED',
    matchedOn: owner?.matched ?? null,
    surface,
    allowedWrites: lane ? lane.owns : [],
    forbiddenWrites: lane ? lane.must_not_write : [],
    bridge: lane ? lane.bridge : null,
    namingFlags: naming,
    parcelScoped,
  };
}

/** All suites whose data concepts appear in the text (for cross-lane detection). */
export function allOwners(text) {
  const t = String(text).toLowerCase();
  const hits = [];
  for (const [suite, kws] of Object.entries(SUITE_KEYWORDS)) {
    const matched = kws.find(k => t.includes(k));
    if (matched) hits.push({ suite, matched });
  }
  return hits;
}

const RISK_RULES = [
  {
    level: 'R5',
    re: /\b(constitution|reserved suite|terraclerk|terratreasury|terraaudit|terrarecorder|security|auth model|jwt|fisma)\b/,
    reason: 'constitution / security',
  },
  {
    level: 'R4',
    re: /\b(shell|routing|route|dock|top ?bar|z-?index|moduleactivation|cross-?suite|workbench routing)\b/,
    reason: 'shell / cross-suite',
  },
  {
    level: 'R3',
    re: /\b(persist|persistence|migration|dbcontext|\bentity\b|endpoint|\bapi\b|controller|repository|database|seed)\b/,
    reason: 'persistence / API',
  },
  {
    level: 'R1',
    re: /\b(readme|docs?|comment|changelog|\btest(s|ing)?\b|spec)\b/,
    reason: 'docs / tests',
  },
];
const RISK_ORDER = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5'];

/** Deterministic risk score for a work request. Returns {level, reasons}. */
export function riskOf(text, classified) {
  const t = String(text).toLowerCase();
  const reasons = [];
  let level = 'R0';
  const bump = (lvl, why) => {
    if (RISK_ORDER.indexOf(lvl) > RISK_ORDER.indexOf(level)) level = lvl;
    reasons.push(`${lvl}: ${why}`);
  };
  for (const r of RISK_RULES) if (r.re.test(t)) bump(r.level, r.reason);
  if (classified?.suite && classified.suite !== 'UNRESOLVED' && level === 'R0')
    bump('R2', 'single-suite code');
  // cross-lane (more than one suite's concepts present) is at least R4
  if (allOwners(t).length > 1) bump('R4', 'cross-lane intent (multiple suites)');
  return { level, reasons };
}

/**
 * Full command judgment for a work request: the §20 "governed acceleration" verb.
 * verdict ∈ Proceed | Proceed with constraints | Escalate | Defer | Block | Recover
 */
export function judge(text) {
  const t = String(text).toLowerCase();
  const c = classify(text);
  const risk = riskOf(text, c);
  const owners = allOwners(text);
  const foreign =
    c.suite !== 'UNRESOLVED'
      ? owners.filter(
          o =>
            canon.suites.active[o.suite]?.display !== c.suite &&
            o.suite !==
              Object.keys(canon.suites.active).find(k => canon.suites.active[k].display === c.suite)
        )
      : [];
  const constraints = [];
  let verdict,
    escalation = null;

  const reservedFlag = c.namingFlags.find(
    f => f.kind === 'reserved_suite_name' || f.kind === 'reserved_module_prefix'
  );
  const auditFlag = c.namingFlags.find(f => f.kind === 'audit_vs_trace');

  // Property Workbench mandate: parcel-scoped work may not become a standalone surface.
  const standaloneViolation =
    c.parcelScoped &&
    /standalone|separate (app|window|route|page)|own (app|window|page|route)|outside (the )?workbench|new dashboard/.test(
      t
    );

  // Reserved municipal office ACTIVATION (FU-2A/ADR-0012/D-007): presenting Clerk/Treasury/Audit/
  // Recorder as active (tab/suite/office) requires a TF-052 amendment (R5) or the explicit
  // VITE_TF_ENABLE_FORWARD_STAGED_OFFICES flag. Default 1.0 = gated off. Distinguish from merely
  // KEEPING forward-staged code (that proceeds with constraints).
  const mentionsReservedOffice =
    /\b(clerk|treasury|recorder)\b/.test(t) ||
    (/\baudit\b/.test(t) && /\b(office|suite|tab|workbench)\b/.test(t));
  const activationIntent =
    /\b(enable|activate|turn on|unhide|show|make .*active|as an? active|add .*tab)\b/.test(t);
  const preservationIntent =
    /\b(keep|preserve|forward.?stage|leave|retain|exist|controller|code|test)\b/.test(t);

  if (mentionsReservedOffice && activationIntent) {
    verdict = 'Block';
    constraints.push(
      'reserved municipal office (Clerk/Treasury/Audit/Recorder) — activation needs a TF-052 amendment (R5) OR VITE_TF_ENABLE_FORWARD_STAGED_OFFICES=true. Default OS 1.0 is gated off (ADR-0012).'
    );
    escalation = 'E4: release-scope / R5 constitutional — reserved-office activation';
  } else if (mentionsReservedOffice && preservationIntent) {
    verdict = 'Proceed with constraints';
    constraints.push(
      'forward-staged reserved-office code may exist if recorded in reserved-staging.json, gated off by default, and footprint not grown (ratchet). Do not present it as active.'
    );
    escalation = 'E2: data ownership — forward-staged office';
  } else if (reservedFlag) {
    verdict = 'Block';
    constraints.push(`reserved name "${reservedFlag.term}" — use an active suite`);
    escalation = 'E1: reserved-name use';
  } else if (standaloneViolation) {
    verdict = 'Block';
    constraints.push(
      'parcel-scoped work must route into Property Workbench (Layer 4) — standalone violates the Workbench mandate + Shell Contract'
    );
    constraints.push(
      'allowed alternative: route parcel-specific tools into the Workbench tab; only cross-parcel tools may stand alone'
    );
    escalation = 'E3: shell-contract conflict';
  } else if (c.suite === 'UNRESOLVED') {
    verdict = 'Escalate';
    escalation = 'E1: architecture ambiguity — owner unclear';
  } else if (foreign.length) {
    verdict = 'Proceed with constraints';
    foreign.forEach(f =>
      constraints.push(
        `cross-lane: ${canon.suites.active[f.suite]?.display} owns "${f.matched}" — bridge via its service + TerraTrace event, no direct write`
      )
    );
    escalation = 'E2: data ownership — cross-lane bridge required';
  } else if (risk.level === 'R5') {
    verdict = 'Block';
    constraints.push('R5 constitution/security — manual only, no agent');
  } else if (risk.level === 'R4') {
    verdict = 'Escalate';
    escalation = 'E3/E4: shell or cross-suite — explicit architect approval';
  } else if (risk.level === 'R3') {
    verdict = 'Proceed with constraints';
    constraints.push('R3 — passport + human review + CountyId/AuditableEntity tests');
  } else {
    verdict = 'Proceed';
  }
  if (auditFlag) constraints.push(`naming: use trace/compliance/activity, not "audit"`);

  return {
    request: text,
    verdict,
    risk: risk.level,
    riskReasons: risk.reasons,
    classified: c,
    foreign,
    constraints,
    escalation,
  };
}

/** Scan free text for reserved/blocked naming. Returns array of violations. */
export function checkNaming(text) {
  const t = String(text).toLowerCase();
  const flags = [];
  for (const name of canon.naming.reserved_suite_names) {
    if (t.includes(name)) flags.push({ kind: 'reserved_suite_name', term: name });
  }
  for (const pfx of canon.naming.reserved_module_prefixes) {
    if (t.includes(pfx)) flags.push({ kind: 'reserved_module_prefix', term: pfx });
  }
  // "audit" misuse: present but not as a reserved suite name
  if (/\baudit\b/.test(t) && !t.includes('terraaudit')) {
    flags.push({
      kind: 'audit_vs_trace',
      term: 'audit',
      hint: `use ${canon.naming.audit_vs_trace.use_instead.join(' / ')} for assessor activity`,
    });
  }
  return flags;
}
