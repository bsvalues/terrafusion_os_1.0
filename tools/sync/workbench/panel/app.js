// ============================================================================
// TerraFusion Sync Workbench — Doctor Panel client
// ----------------------------------------------------------------------------
// Fetches POST /api/doctor/run, parses the tf-sync-doctor.mjs output,
// and renders:
//   • Four step cards + overall verdict banner  (Slice A)
//   • Domain coverage grouped by status         (Slice B)
//   • Source pack fit — 66 checks, 4 categories (Slice C)
//   • Lane seal — 22 gates, 9 lanes             (Slice D)
//   • Identity spine — 11 tables, dangling alarm (Slice E)
//   • Evidence browser — proof artifacts catalog  (Slice F)
//   • Readback set — six acceptance parcels       (Slice G)
//
// No framework, no build step, no external dependencies.
// All DOM mutations use createElement/textContent — no innerHTML.
// ============================================================================

'use strict';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const runBtn           = document.getElementById('run-btn');
const metaEl           = document.getElementById('meta');
const overallEl        = document.getElementById('overall');
const stepsEl          = document.getElementById('steps');
const packValidatorEl   = document.getElementById('pack-validator');
const identitySpineEl   = document.getElementById('identity-spine');
const readbackSetEl     = document.getElementById('readback-set');
const evidenceBrowserEl = document.getElementById('evidence-browser');
const sealCheckEl      = document.getElementById('seal-check');
const domainCoverageEl = document.getElementById('domain-coverage');
const rawOut           = document.getElementById('raw-output');
const rawPre           = document.getElementById('raw-pre');
const dryRunPreviewEl  = document.getElementById('dry-run-preview');

// ── Verdict helpers ───────────────────────────────────────────────────────────
const SYM   = { PASS: '✓', WARN: '⚠', FAIL: '✗' };
const LABEL = { PASS: 'PASS', WARN: 'WARN', FAIL: 'FAIL' };

function vcls(v) { return v ? v.toLowerCase() : ''; }

function makeBadge(v) {
  if (!v) return null;
  const e = document.createElement('span');
  e.className = 'verdict-badge ' + vcls(v);
  e.textContent = (SYM[v] || '?') + ' ' + (LABEL[v] || v);
  return e;
}

// ── Pack validator catalog (Slice C) ─────────────────────────────────────────
//
// Display config for the four sections of harris-pacs-pack-validator.sql.
//
const PV_CATEGORIES = {
  table_presence:   {
    label: 'Source Tables',
    desc:  '15 PACS landing tables — 11 CRITICAL + 4 WARN',
  },
  column_structure: {
    label: 'Column Structure',
    desc:  '38 key fields across all lane domains',
  },
  dictionary: {
    label: 'Canonical Dictionaries',
    desc:  '5 canonical_tf dict tables seeded by hosted service',
  },
  data_content: {
    label: 'Data Content',
    desc:  '8 row-count and ratio-population checks',
  },
};

const PV_CAT_ORDER = ['table_presence', 'column_structure', 'dictionary', 'data_content'];

// ── Lane seal catalog (Slice D) ───────────────────────────────────────────────
//
// Display config for the nine lane groups in seal-check-runner.sql.
//
const LANE_META = {
  'parcel-spine': { label: 'Parcel Spine',                desc: 'Live active parcel count' },
  'assessment':   { label: 'Assessment',                  desc: 'tf_assessment — current-year assessed values' },
  'jurisdiction': { label: 'Jurisdiction',                desc: 'tf_parcel_tax_area — must equal parcel spine' },
  'exemption':    { label: 'Exemption',                   desc: 'tf_exemption — partial coverage expected' },
  'land':         { label: 'Land',                        desc: 'tf_land — multi-segment, ≥ sealed threshold' },
  'improvement':  { label: 'Improvement',                 desc: 'tf_improvement — multi-improvement, ≥ sealed threshold' },
  'geometry':     { label: 'Geometry',                    desc: 'gis_tf.tf_parcel_geom — GIS parcel footprints' },
  'revenue-l':    { label: 'Revenue — Levy',              desc: 'tf_tax_bill_line + rollup + amount integrity' },
  'revenue-a':    { label: 'Revenue — Special Assessment', desc: 'tf_assessment_bill_line + rollup + amount integrity' },
};

const LANE_ORDER = [
  'parcel-spine', 'assessment', 'jurisdiction', 'exemption',
  'land', 'improvement', 'geometry', 'revenue-l', 'revenue-a',
];

// ── Readback set catalog (Slice G) ───────────────────────────────────────────
//
// Six Benton production-readback parcels resolved from the sealed current-year
// substrate (2026-06-08, post-F1 repair).
//
// Source:
//   docs/sync/seals/benton-current-year-production-readback-checklist.md
//   docs/sync/seals/benton-current-year-production-readback-results.md
//
// Surface counts are from the post-F1 re-run readback table.
// truthAbsent = surfaces whose zero count is truth-verified absent (¹ marker in
//   the results doc) — not a defect, the canonical truth genuinely has no segment
//   for that parcel.
// correctAbsent = surfaces whose zero count is correct expected absence for the
//   profile (e.g. no exemption on a non-exempt parcel, no A-bill on a levy-only
//   parcel, no improvement on a land-only parcel).
//
// Verdict 'PASS' = data-seal + cross-lane join layer.
// County Studio UI pixel layer NOT exercised — frontend :3000 not running.
// That is the remaining human acceptance step, per the readback results doc.
//
const READBACK_SET = [
  {
    propId:   '321209',
    profile:  '1 · Normal residential',
    tag:      'plain path',
    why:      'assessment sup=0, no exemption, no special assessment — exercises the plain case end-to-end',
    surfaces: {
      owners:     2,
      assessment: 1,
      land:       0,   // truth-verified absent ¹
      improvement:1,
      geom:       0,   // truth-verified absent ¹
      exemption:  0,   // correct absence — no exemption for this parcel
      taxArea:    1,
      levyLines:  11,
      aBillLines: 0,   // correct absence — no special-assessment agency
    },
    truthAbsent:   ['land', 'geom'],
    correctAbsent: ['exemption', 'aBillLines'],
    financials: { due: '1,309.58', paid: '0.00', balance: '1,309.58' },
    verdict: 'PASS',
  },
  {
    propId:   '10009',
    profile:  '2 · With exemption',
    tag:      'exemption path',
    why:      'exercises tf_exemption + dict-backed type / pct; due/paid/balance all zero (fully exempt)',
    surfaces: {
      owners:     9,
      assessment: 1,
      land:       1,
      improvement:0,   // correct absence — no improvement in truth for this parcel
      geom:       1,
      exemption:  1,   // correctly present
      taxArea:    1,
      levyLines:  12,
      aBillLines: 0,   // correct absence
    },
    truthAbsent:   [],
    correctAbsent: ['improvement', 'aBillLines'],
    financials: { due: '0.00', paid: '0.00', balance: '0.00' },
    verdict: 'PASS',
    notes: 'Financials all zero — parcel is fully exempt. Correct expected state.',
  },
  {
    propId:   '87621',
    profile:  '3 · Non-zero active supplement',
    tag:      'supplement path',
    why:      'proves active-supplement resolution (not sup=0); all three physical surfaces truth-absent',
    surfaces: {
      owners:     9,
      assessment: 1,
      land:       0,   // truth-verified absent ¹
      improvement:0,   // truth-verified absent ¹
      geom:       0,   // truth-verified absent ¹
      exemption:  0,   // correct absence
      taxArea:    1,
      levyLines:  15,
      aBillLines: 0,   // correct absence
    },
    truthAbsent:   ['land', 'improvement', 'geom'],
    correctAbsent: ['exemption', 'aBillLines'],
    financials: { due: '4,260.25', paid: '0.00', balance: '4,260.25' },
    verdict: 'PASS',
    notes: 'Land, improvement, and geometry are truth-verified absent in PACS for this parcel — not a defect.',
  },
  {
    propId:   '23199',
    profile:  '4 · With special-assessment bill',
    tag:      'special-assessment path',
    why:      '6 special-assessment agencies — exercises tf_assessment_bill_line + tf_assessment_agency',
    surfaces: {
      owners:     9,
      assessment: 1,
      land:       1,
      improvement:0,   // correct absence — no improvement in truth for this parcel
      geom:       1,
      exemption:  0,   // correct absence
      taxArea:    1,
      levyLines:  14,
      aBillLines: 6,   // key surface for this profile
    },
    truthAbsent:   [],
    correctAbsent: ['improvement', 'exemption'],
    financials: { due: '606.77', paid: '0.00', balance: '606.77' },
    verdict: 'PASS',
  },
  {
    propId:   '10881',
    profile:  '5 · Paid amount > 0',
    tag:      'payment path',
    why:      'paid $1,132.26 — exercises due/paid/balance rollup + net-paid attestation (Stage 3B)',
    surfaces: {
      owners:     9,
      assessment: 1,
      land:       1,
      improvement:3,
      geom:       1,
      exemption:  0,   // correct absence
      taxArea:    1,
      levyLines:  11,
      aBillLines: 3,
    },
    truthAbsent:   [],
    correctAbsent: ['exemption'],
    financials: { due: '1,841.02', paid: '1,132.26', balance: '708.76' },
    verdict: 'PASS',
    notes: 'Net-paid reconciled penny-exact: balance = due − paid = 1841.02 − 1132.26 = 708.76. ' +
           'Attested corpus-wide Δ=$0.00 (Stage 3B evidence 2026-06-07). ' +
           'This is PACS-recorded bill-grain net paid — not a receipt-level or cash-ledger figure.',
  },
  {
    propId:   '56444',
    profile:  '6 · Complex district set',
    tag:      'jurisdiction breadth',
    why:      '8 districts — exercises jurisdiction breadth + levy bill line fan-out (steps 6–7)',
    surfaces: {
      owners:     9,
      assessment: 1,
      land:       1,
      improvement:1,
      geom:       1,
      exemption:  0,   // correct absence
      taxArea:    1,
      levyLines:  15,
      aBillLines: 4,
    },
    truthAbsent:   [],
    correctAbsent: ['exemption'],
    financials: { due: '3,453.38', paid: '0.00', balance: '3,453.38' },
    verdict: 'PASS',
  },
];

// Surface display config — label + what a non-zero count proves
const RB_SURFACE_META = [
  { key: 'owners',     label: 'Owners',        seal: 'Owner ✓'           },
  { key: 'assessment', label: 'Assessment',    seal: 'Assessment Value ✓' },
  { key: 'land',       label: 'Land',          seal: 'Land ✓'             },
  { key: 'improvement',label: 'Improvement',   seal: 'Improvement ✓'      },
  { key: 'geom',       label: 'Geometry',      seal: 'Geometry ✓'         },
  { key: 'exemption',  label: 'Exemption',     seal: 'Exemption ✓'        },
  { key: 'taxArea',    label: 'Tax Area',       seal: 'Jurisdiction ✓'     },
  { key: 'levyLines',  label: 'Levy Lines',    seal: 'Revenue Stage 1 ✓'  },
  { key: 'aBillLines', label: 'A-Bill Lines',  seal: 'Revenue Stage 2B ✓' },
];

function renderReadbackSet() {
  clearChildren(readbackSetEl);

  // ── Header ──────────────────────────────────────────────────────────────────
  const hdr = el('div', 'rb-heading');
  const row = el('div', 'rb-title-row');
  row.appendChild(el('h2', 'rb-title', 'Production Readback Set'));
  row.appendChild(el('span', 'rb-subtitle',
    '6 acceptance parcels · data-seal + cross-lane join layer · post-F1 repair'));
  hdr.appendChild(row);

  const limNote = el('div', 'rb-limit-notice');
  const limIcon = el('span', 'rb-limit-icon', '⚠');
  const limText = el('span', 'rb-limit-text',
    'County Studio UI pixel layer NOT exercised — frontend :3000 not running. ' +
    'These results evidence the canonical data-seal + cross-lane join layer only. ' +
    'The UI render layer remains the remaining human acceptance step.');
  limNote.appendChild(limIcon);
  limNote.appendChild(limText);
  hdr.appendChild(limNote);

  readbackSetEl.appendChild(hdr);

  // ── Parcel cards ─────────────────────────────────────────────────────────────
  const grid = el('div', 'rb-grid');

  for (const parcel of READBACK_SET) {
    const card = el('div', 'rb-card');

    // Card header
    const cardHdr = el('div', 'rb-card-header');
    const idBadge = el('span', 'rb-prop-id', parcel.propId);
    const profileLabel = el('span', 'rb-profile', parcel.profile);
    const tagBadge = el('span', 'rb-tag', parcel.tag);
    cardHdr.appendChild(idBadge);
    cardHdr.appendChild(profileLabel);
    cardHdr.appendChild(tagBadge);
    card.appendChild(cardHdr);

    // Why / purpose
    const why = el('p', 'rb-why', parcel.why);
    card.appendChild(why);

    // Surface grid
    const surfGrid = el('div', 'rb-surface-grid');
    for (const sm of RB_SURFACE_META) {
      const count = parcel.surfaces[sm.key];
      const isTruthAbsent   = parcel.truthAbsent.includes(sm.key);
      const isCorrectAbsent = parcel.correctAbsent.includes(sm.key);

      const cell = el('div', 'rb-surface-cell');
      const cellLabel = el('span', 'rb-surface-label', sm.label);
      cell.appendChild(cellLabel);

      const cellVal = document.createElement('span');
      if (count > 0) {
        cellVal.className   = 'rb-surface-count rb-count-ok';
        cellVal.textContent = String(count);
      } else if (isTruthAbsent) {
        cellVal.className   = 'rb-surface-count rb-count-truth-absent';
        cellVal.textContent = '0 ¹';
        cell.title = 'Truth-verified absent: canonical truth has no segment for this parcel — not a defect';
      } else if (isCorrectAbsent) {
        cellVal.className   = 'rb-surface-count rb-count-correct-absent';
        cellVal.textContent = '0 ✓';
        cell.title = 'Correct expected absence for this parcel profile';
      } else {
        cellVal.className   = 'rb-surface-count rb-count-zero';
        cellVal.textContent = '0';
      }
      cell.appendChild(cellVal);
      surfGrid.appendChild(cell);
    }
    card.appendChild(surfGrid);

    // Financials
    const fin = el('div', 'rb-financials');
    const finItems = [
      { label: 'Due',     value: parcel.financials.due     },
      { label: 'Paid',    value: parcel.financials.paid    },
      { label: 'Balance', value: parcel.financials.balance },
    ];
    for (const f of finItems) {
      const item = el('div', 'rb-fin-item');
      item.appendChild(el('span', 'rb-fin-label', f.label));
      const valEl = el('span', 'rb-fin-value', f.value);
      if (f.label === 'Paid' && f.value !== '0.00') {
        valEl.classList.add('rb-fin-paid-nonzero');
      }
      item.appendChild(valEl);
      fin.appendChild(item);
    }
    card.appendChild(fin);

    // Notes
    if (parcel.notes) {
      const noteEl = el('p', 'rb-notes', parcel.notes);
      card.appendChild(noteEl);
    }

    // Verdict
    const vrow = el('div', 'rb-verdict-row');
    vrow.appendChild(el('span', 'rb-verdict rb-verdict-pass', '✓ PASS — data-seal + cross-lane join'));
    card.appendChild(vrow);

    grid.appendChild(card);
  }

  readbackSetEl.appendChild(grid);

  // ── Truth-absent footnote ────────────────────────────────────────────────────
  const foot = el('div', 'rb-footnote');
  foot.appendChild(el('span', 'rb-footnote-marker', '¹ '));
  foot.appendChild(el('span', 'rb-footnote-text',
    'Truth-verified absent: canonical truth has no land / improvement / geometry segment for this ' +
    'parcel in Harris PACS. The zero is correct. Post-F1 repair, these parcels resolve wherever ' +
    'truth has the segment; the two zero-land parcels (321209, 87621) genuinely lack those segments.'));
  readbackSetEl.appendChild(foot);

  // ── Forbidden claims ─────────────────────────────────────────────────────────
  const forbidden = el('div', 'rb-forbidden');
  forbidden.appendChild(el('p', 'rb-forbidden-title', 'Not claimed / out of scope:'));
  const forbidList = [
    'Receipt-level payment history or tender detail',
    'Void / refund / reversal workflow',
    'Penalty / interest / bond paid breakdown',
    'Delinquency status or certification',
    'Fund / distribution accounting',
    'Prior-year revenue history (current-year 2025 only)',
    'County Studio UI pixel layer acceptance (UI not exercised — human step)',
    'F2 — tf_parcel identity inflation diagnosis or repair',
  ];
  const ul = document.createElement('ul');
  ul.className = 'rb-forbidden-list';
  for (const item of forbidList) {
    const li = el('li', 'rb-forbidden-item', item);
    ul.appendChild(li);
  }
  forbidden.appendChild(ul);
  readbackSetEl.appendChild(forbidden);
}

// ── Evidence catalog (Slice F) ───────────────────────────────────────────────
//
// Static catalog of proof artifacts grouped into seven families.
// File paths are relative to the repo root and served by GET /api/doc?p=...
// The catalog is built from the actual docs/sync tree — paths are real.
//
const EVIDENCE_CATALOG = [
  {
    key:   'seal-packets',
    label: 'Seal Packets',
    desc:  'Primary proof — spine seal, lane status, solo-dev closeout',
    files: [
      {
        path:  'docs/sync/seals/benton-lane-status.md',
        label: 'Lane Status',
      },
      {
        path:  'docs/sync/seals/benton-current-year-spine-seal-packet.md',
        label: 'Spine Seal Packet',
      },
      {
        path:  'docs/sync/seals/benton-full-corpus-verification-supersession.md',
        label: 'Full Corpus Verification',
      },
      {
        path:  'docs/sync/seals/county-studio-parcel-read-model-contract.md',
        label: 'Parcel Read-Model Contract',
      },
      {
        path:  'docs/sync/seals/benton-sync-final-solo-dev-closeout.md',
        label: 'Solo-Dev Closeout',
      },
    ],
  },
  {
    key:   'revenue-addenda',
    label: 'Revenue Addenda',
    desc:  'Revenue spine stage 1 / 2B / 3A seal addenda',
    files: [
      {
        path:  'docs/sync/seals/benton-revenue-spine-stage1-addendum.md',
        label: 'Stage 1 — Levy bill explanation',
      },
      {
        path:  'docs/sync/seals/benton-revenue-spine-stage2b-addendum.md',
        label: 'Stage 2B — Assessment bill canonical',
      },
      {
        path:  'docs/sync/seals/benton-revenue-spine-stage3a-addendum.md',
        label: 'Stage 3A — Payment transaction doctrine',
      },
    ],
  },
  {
    key:   'readback',
    label: 'Readback Evidence',
    desc:  'Production readback checklist and results (post-F1)',
    files: [
      {
        path:  'docs/sync/seals/benton-current-year-production-readback-checklist.md',
        label: 'Readback Checklist',
      },
      {
        path:  'docs/sync/seals/benton-current-year-production-readback-results.md',
        label: 'Readback Results',
      },
    ],
  },
  {
    key:   'source-packs',
    label: 'Source Packs',
    desc:  'Harris PACS source pack — shape specification, validator, application guide',
    files: [
      {
        path:  'docs/sync/source-packs/harris-pacs/HARRIS_PACS_SOURCE_PACK.md',
        label: 'Harris PACS Source Pack',
      },
      {
        path:  'docs/sync/source-packs/harris-pacs/HARRIS_PACS_PACK_VALIDATOR.md',
        label: 'Pack Validator Reference',
      },
      {
        path:  'docs/sync/source-packs/harris-pacs/APPLYING_HARRIS_PACS_PACK.md',
        label: 'Applying the Pack',
      },
      {
        path:  'docs/sync/source-packs/SOURCE_PACK_TEMPLATE.md',
        label: 'Source Pack Template',
      },
    ],
  },
  {
    key:   'automation',
    label: 'Automation Docs',
    desc:  'tf-sync-doctor and the four SQL automation scripts',
    files: [
      {
        path:  'docs/sync/automation/tf-sync-doctor.md',
        label: 'tf-sync-doctor',
      },
      {
        path:  'docs/sync/automation/identity-drift-detector.md',
        label: 'Identity Drift Detector',
      },
      {
        path:  'docs/sync/automation/seal-check-runner.md',
        label: 'Seal Check Runner',
      },
      {
        path:  'docs/sync/automation/domain-coverage-audit.md',
        label: 'Domain Coverage Audit',
      },
    ],
  },
  {
    key:   'doctor-evidence',
    label: 'Doctor Evidence',
    desc:  'Benton baseline artifacts captured from live doctor runs',
    files: [
      {
        path:  'docs/sync/benton-pacs-catalog-health-baseline.md',
        label: 'PACS Catalog Health Baseline',
      },
      {
        path:  'docs/sync/benton-domain-coverage-audit.md',
        label: 'Domain Coverage Audit (Benton)',
      },
      {
        path:  'docs/sync/benton-dictionary-loader-preflight-evidence-baseline.md',
        label: 'Dictionary Loader Preflight',
      },
      {
        path:  'docs/sync/benton-sales-qualification-coverage-baseline.md',
        label: 'Sales Qualification Coverage',
      },
    ],
  },
  {
    key:   'doctrine',
    label: 'Doctrine',
    desc:  'Core sync doctrine, boundary policy, identity dataflow policy',
    files: [
      {
        path:  'docs/sync/TERRAFUSION_SYNC_PRODUCT_DOCTRINE.md',
        label: 'Product Doctrine',
      },
      {
        path:  'docs/sync/sync-boundary-policy.md',
        label: 'Sync Boundary Policy',
      },
      {
        path:  'docs/sync/pacs-canonical-dataflow-identity-policy.md',
        label: 'PACS → Canonical Dataflow Identity',
      },
    ],
  },
];

// Renders the evidence browser section immediately on page load (not doctor-triggered).
function renderEvidenceBrowser() {
  clearChildren(evidenceBrowserEl);

  const headingDiv = el('div', 'ep-heading');
  const titleRow   = el('div', 'ep-title-row');
  titleRow.appendChild(el('h2', 'ep-title', 'Evidence Artifacts'));
  titleRow.appendChild(el('span', 'ep-subtitle',
    EVIDENCE_CATALOG.reduce((n, g) => n + g.files.length, 0) + ' documents — open in new tab'));
  headingDiv.appendChild(titleRow);
  evidenceBrowserEl.appendChild(headingDiv);

  for (const group of EVIDENCE_CATALOG) {
    const details  = document.createElement('details');
    details.className = 'ep-group';

    const summary = document.createElement('summary');
    summary.className = 'ep-group-summary';
    summary.appendChild(el('span', 'ep-group-label', group.label));
    summary.appendChild(el('span', 'ep-group-desc', group.desc));
    summary.appendChild(el('span', 'ep-group-count',
      group.files.length + (group.files.length === 1 ? ' file' : ' files')));
    details.appendChild(summary);

    const list = el('ul', 'ep-file-list');
    for (const file of group.files) {
      const li = el('li', 'ep-file-item');
      const a  = document.createElement('a');
      a.className  = 'ep-file-link';
      a.href       = '/api/doc?p=' + encodeURIComponent(file.path);
      a.target     = '_blank';
      a.rel        = 'noopener noreferrer';
      a.textContent = file.label;
      li.appendChild(a);
      const pathSpan = el('span', 'ep-file-path', file.path);
      li.appendChild(pathSpan);
      list.appendChild(li);
    }
    details.appendChild(list);

    evidenceBrowserEl.appendChild(details);
  }
}

// ── Identity spine catalog (Slice E) ─────────────────────────────────────────
//
// Known-deferred tables: treated as WARN instead of FAIL when dangling > 0.
// Mirrors KNOWN_DRIFT_DEFERRED in tf-sync-doctor.mjs.
//
const KNOWN_DRIFT_DEFERRED = new Set(['canonical_tf.tf_parcel_owner_link']);

// Four display groups for the 11 parcel-bearing canonical tables.
const ID_GROUPS = [
  {
    key:    'f1-family',
    label:  'F1 Family',
    desc:   'Land · Improvement · Geometry — should be clean after F1 drift fix',
    tables: [
      'canonical_tf.tf_land',
      'canonical_tf.tf_improvement',
      'gis_tf.tf_parcel_geom',
    ],
  },
  {
    key:    'core',
    label:  'Valuation · Jurisdiction · Exemption',
    desc:   'Assessment + tax area must equal live spine; exemption partial coverage expected',
    tables: [
      'canonical_tf.tf_assessment',
      'canonical_tf.tf_parcel_tax_area',
      'canonical_tf.tf_exemption',
    ],
  },
  {
    key:    'revenue',
    label:  'Revenue',
    desc:   'Levy + special-assessment bill lines and rollup tables',
    tables: [
      'canonical_tf.tf_tax_bill_line',
      'canonical_tf.tf_tax_bill_current',
      'canonical_tf.tf_assessment_bill_line',
      'canonical_tf.tf_assessment_bill_current',
    ],
  },
  {
    key:    'owner',
    label:  'Owner Link',
    desc:   'Known deferred drift — not a sealed canonical lane',
    tables: ['canonical_tf.tf_parcel_owner_link'],
  },
];

// ── Domain coverage catalog ───────────────────────────────────────────────────
//
// Static Benton domain inventory — matches domain-coverage-audit.sql.
// Update when a domain is promoted (e.g. LANDED_ONLY → SEALED) or a new
// domain is added. seq matches the SQL ORDER BY seq.
//
const DOMAIN_CATALOG = [
  // ── SEALED — 12 domains ────────────────────────────────────────────────
  { seq:  1, status: 'SEALED',              label: 'Parcel / Property Identity' },
  { seq:  2, status: 'SEALED',              label: 'Owner (current-year active-supplement)' },
  { seq:  3, status: 'SEALED',              label: 'Land (current-year segments)' },
  { seq:  4, status: 'SEALED',              label: 'Improvement / Structure (current-year)' },
  { seq:  5, status: 'SEALED',              label: 'Sales — DOR ratio-coded qualified' },
  { seq:  6, status: 'SEALED',              label: 'Geometry / GIS parcel boundary' },
  { seq:  7, status: 'SEALED',              label: 'Assessment Value (current-year 2025)' },
  { seq:  8, status: 'SEALED',              label: 'Owner-WSDOR (DOR audit roll)' },
  { seq:  9, status: 'SEALED',              label: 'Exemption' },
  { seq: 10, status: 'SEALED',              label: 'Jurisdiction / Tax Area–District Assignment' },
  { seq: 11, status: 'SEALED',              label: 'Revenue — Levy Tax Bills' },
  { seq: 12, status: 'SEALED',              label: 'Revenue — Special-Assessment Bills' },
  // ── DISCOVERED_DEFERRED — 3 domains ───────────────────────────────────
  { seq: 13, status: 'DISCOVERED_DEFERRED', label: 'Payment / Collection Ledger' },
  { seq: 14, status: 'DISCOVERED_DEFERRED', label: 'Fund / Distribution Accounting' },
  { seq: 15, status: 'DISCOVERED_DEFERRED', label: 'Delinquency' },
  // ── LANDED_ONLY — 3 domains ────────────────────────────────────────────
  { seq: 16, status: 'LANDED_ONLY',         label: 'Assessment-Value History (multi-year)' },
  { seq: 17, status: 'LANDED_ONLY',         label: 'Land / Improvement History (multi-year)' },
  { seq: 18, status: 'LANDED_ONLY',         label: 'Sales — Disqualified / Historical' },
  // ── EMPTY_IN_SOURCE — 1 domain ─────────────────────────────────────────
  { seq: 19, status: 'EMPTY_IN_SOURCE',     label: 'Appeals / Corrections (ARB)' },
];

// Status display metadata — meaning and operator implication per group.
const STATUS_META = {
  SEALED: {
    sym:        '✓',
    cls:        'sealed',
    meaning:    'Converted end-to-end; canonical lane proven and sealed',
    implication: 'Safe to use as current-year substrate.',
  },
  LANDED_ONLY: {
    sym:        '⚠',
    cls:        'landed',
    meaning:    'Source data landed in legacy_pacs_raw; full canonical lane not yet sealed',
    implication: 'Do not overclaim. Full history lanes are future work.',
  },
  DISCOVERED_DEFERRED: {
    sym:        '⚠',
    cls:        'deferred',
    meaning:    'Exists in PACS with real data; explicitly deferred with documented rationale',
    implication: 'Not a gap — a documented decision. Seal holds its stated boundary.',
  },
  EMPTY_IN_SOURCE: {
    sym:        '—',
    cls:        'empty',
    meaning:    'Tabled in PACS schema; zero meaningful rows for this county',
    implication: 'No implementation required for Benton.',
  },
};

// Rendering order for domain groups.
const STATUS_ORDER = ['SEALED', 'LANDED_ONLY', 'DISCOVERED_DEFERRED', 'EMPTY_IN_SOURCE'];

// ── Output parser ─────────────────────────────────────────────────────────────
//
// Parses the formatted stdout of tf-sync-doctor.mjs.
//
// Structure: exactly 4 BAR lines (═{10,}).
//   bars 1-2: header  ("tf-sync doctor — TerraFusion Sync Health Check")
//   body: DB line, step #0–#3
//   bar 3: opens OVERALL section
//   bar 4: closes OVERALL section
//
// Step header regex: /^\s+#(\d)\s+(.+?)\s*\.{3}/
// Pack-validator FAIL truncates after step #0 but still emits bars 3+4.

function detectSym(text) {
  if (text.includes('✓')) return 'PASS';
  if (text.includes('⚠')) return 'WARN';
  if (text.includes('✗')) return 'FAIL';
  if (/\berror\b/i.test(text)) return 'FAIL';
  return null;
}

function worstOf(a, b) {
  const rank = { PASS: 0, WARN: 1, FAIL: 2 };
  if (a == null) return b;
  if (b == null) return a;
  return (rank[a] ?? 0) >= (rank[b] ?? 0) ? a : b;
}

function parseDoctor(stdout) {
  const lines    = stdout.split('\n');
  let dbInfo     = null;
  let overall    = null;
  const overMsgs = [];
  const steps    = [];
  let cur        = null;
  let barCount   = 0;
  let inOverall  = false;

  for (const line of lines) {
    const t = line.trim();

    // BAR line (10+ ═ characters)
    if (/^═{10,}/.test(t)) {
      if (cur) { steps.push(cur); cur = null; }
      barCount++;
      inOverall = (barCount === 3);
      if (barCount >= 4) inOverall = false;
      continue;
    }

    if (!t) continue;

    // DB info line
    if (t.startsWith('DB:')) {
      dbInfo = t.slice(3).trim();
      continue;
    }

    // Overall section (between bars 3 and 4)
    if (inOverall) {
      const sym = detectSym(t);
      if (sym && t.includes('OVERALL:')) overall = sym;
      const msg = t
        .replace(/^[✓⚠✗]\s+/, '')
        .replace(/^OVERALL:\s*\S+\s*[—–-]\s*/, '')
        .trim();
      if (msg) overMsgs.push(msg);
      continue;
    }

    // Step header: "  #N  Name of step ..."
    const sm = line.match(/^\s+#(\d)\s+(.+?)\s*\.{3}/);
    if (sm) {
      if (cur) steps.push(cur);
      cur = {
        idx:     parseInt(sm[1], 10),
        name:    sm[2].trim(),
        verdict: null,
        details: [],   // [{ sym, text }]
      };
      continue;
    }

    // Step detail line
    if (cur) {
      const sym  = detectSym(t);
      const text = t.replace(/^[✓⚠✗]\s{2}/, '').trim();
      if (sym) cur.verdict = worstOf(cur.verdict, sym);
      if (text) cur.details.push({ sym, text });
    }
  }

  if (cur) steps.push(cur);
  return { dbInfo, overall, overMsgs, steps };
}

// ── DOM helpers ───────────────────────────────────────────────────────────────
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls)  e.className   = cls;
  if (text != null) e.textContent = text;
  return e;
}

function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

// ── Renderers ─────────────────────────────────────────────────────────────────
function renderMeta(data, result) {
  clearChildren(metaEl);
  const dur = result.durationMs < 1000
    ? result.durationMs + 'ms'
    : (result.durationMs / 1000).toFixed(1) + 's';
  const ts = new Date(result.timestamp).toLocaleString();

  metaEl.appendChild(el('span', 'meta-db',  'DB: ' + (data.dbInfo || '—')));
  metaEl.appendChild(el('span', 'meta-sep', '·'));
  metaEl.appendChild(el('span', 'meta-ts',  'Last run: ' + ts + ' · ' + dur));
  metaEl.classList.remove('hidden');
}

function renderOverall(data, exitCode) {
  clearChildren(overallEl);
  const v = data.overall || (exitCode === 2 ? 'FAIL' : null);
  if (!v) { overallEl.classList.add('hidden'); return; }

  // Verdict row
  const row = el('div', 'overall-verdict');
  row.appendChild(el('span', 'overall-sym',   SYM[v]   || '?'));
  row.appendChild(el('span', 'overall-label', 'OVERALL: ' + v));
  overallEl.appendChild(row);

  // DO NOT DRAIN gate for FAIL
  if (v === 'FAIL') {
    overallEl.appendChild(el('p', 'fail-gate',
      '⛔ DO NOT DRAIN until FAIL items are resolved.'));
  }

  // Supporting messages from the overall section
  const msgs = data.overMsgs.filter(m =>
    !m.startsWith('OVERALL:') && m.length > 3
  );
  if (msgs.length) {
    const ul = el('ul', 'overall-msgs');
    msgs.forEach(m => ul.appendChild(el('li', null, m)));
    overallEl.appendChild(ul);
  }

  overallEl.className = 'overall-banner ' + vcls(v);
  overallEl.classList.remove('hidden');
}

function renderSteps(steps) {
  clearChildren(stepsEl);

  if (!steps.length) {
    stepsEl.appendChild(el('p', 'no-steps-msg',
      'No step data found in output. Check raw output below for connection or psql errors.'));
    return;
  }

  for (const s of steps) {
    const v    = s.verdict || 'FAIL';
    const card = el('div', 'step-card ' + vcls(v));
    card.setAttribute('role', 'article');

    // Card header
    const hdr = el('div', 'step-header');
    hdr.appendChild(el('span', 'step-num',  '#' + s.idx));
    hdr.appendChild(el('span', 'step-name', s.name));
    const b = makeBadge(v);
    if (b) hdr.appendChild(b);
    card.appendChild(hdr);

    // Detail lines
    if (s.details.length) {
      const ul = el('ul', 'step-details');
      for (const d of s.details) {
        const li = el('li', d.sym ? vcls(d.sym) : null,
          (d.sym ? SYM[d.sym] + ' ' : '  ') + d.text);
        ul.appendChild(li);
      }
      card.appendChild(ul);
    }

    stepsEl.appendChild(card);
  }
}

// ── Domain Coverage renderer (Slice B) ────────────────────────────────────────
//
// Renders the Benton domain inventory grouped by status.
// Content is the static DOMAIN_CATALOG — no extra backend call or SQL query.
// The section is shown only when step #3 is present in the doctor output,
// meaning the doctor ran all the way through the domain-coverage check.
//
// If the pack validator fails (step #0 FAIL), the doctor exits early and
// step #3 is absent — domain coverage is correctly hidden in that case.
//
function renderDomainCoverage(steps) {
  clearChildren(domainCoverageEl);

  // Only render when the doctor completed step #3.
  if (!steps.find(s => s.idx === 3)) {
    domainCoverageEl.classList.add('hidden');
    return;
  }

  // Section heading
  const headingDiv = el('div', 'dc-heading');
  headingDiv.appendChild(el('h2', 'dc-title', 'Domain Coverage'));
  headingDiv.appendChild(el('p', 'dc-subtitle',
    'Benton County PACS domain inventory — 19 domains total, grouped by conversion status.'));
  domainCoverageEl.appendChild(headingDiv);

  for (const status of STATUS_ORDER) {
    const meta    = STATUS_META[status];
    const domains = DOMAIN_CATALOG
      .filter(d => d.status === status)
      .sort((a, b) => a.seq - b.seq);
    if (!domains.length) continue;

    const group = el('div', 'dc-group dc-group-' + meta.cls);

    // Group header: status badge + count
    const hdr = el('div', 'dc-group-header');
    hdr.appendChild(el('span', 'dc-badge dc-badge-' + meta.cls,
      meta.sym + ' ' + status.replace(/_/g, ' ')));
    hdr.appendChild(el('span', 'dc-count',
      domains.length + (domains.length === 1 ? ' domain' : ' domains')));
    group.appendChild(hdr);

    // Meaning + operator implication
    const desc = el('div', 'dc-desc');
    desc.appendChild(el('span', 'dc-meaning', meta.meaning + '.'));
    desc.appendChild(document.createTextNode('  '));
    desc.appendChild(el('em', 'dc-implication', meta.implication));
    group.appendChild(desc);

    // Domain list
    const list = el('ul', 'dc-domain-list');
    for (const d of domains) {
      list.appendChild(el('li', 'dc-domain-row', d.label));
    }
    group.appendChild(list);

    domainCoverageEl.appendChild(group);
  }

  domainCoverageEl.classList.remove('hidden');
}

// ── Pack Validator parser + renderer (Slice C) ────────────────────────────────
//
// Parses the pipe-delimited output of harris-pacs-pack-validator.sql (run via
// pack-validator-runner.mjs) and renders a four-category conformance panel.
//
// Statement 1 format: category|check_name|measured|expected|verdict|severity|notes
// Statement 2 (OVERALL summary) is skipped — we derive verdicts from the rows.

function parsePV(stdout) {
  const rows = [];
  for (const raw of stdout.split('\n')) {
    const l = raw.trim();
    if (!l || l.startsWith('OVERALL:')) continue;
    const parts = l.split('|');
    if (parts.length < 7) continue;
    rows.push({
      category:  parts[0].trim(),
      checkName: parts[1].trim(),
      measured:  parts[2].trim(),
      expected:  parts[3].trim(),
      verdict:   parts[4].trim(),   // PASS | WARN | FAIL | INFO
      severity:  parts[5].trim(),   // CRITICAL | WARN | INFO
      notes:     parts.slice(6).join('|').trim(),
    });
  }
  return rows;
}

// Convert raw check_name to a readable label.
// tbl_property        → property
// col_property__PropId → property.PropId
// dict_canonical__tf_tax_area → tf_tax_area
// data_content checks → spaces for underscores
function humanizeCheck(row) {
  const n = row.checkName;
  if (n.startsWith('tbl_')) return n.slice(4);
  if (n.startsWith('col_')) {
    const rest = n.slice(4);
    const dbl  = rest.indexOf('__');
    return dbl >= 0
      ? rest.slice(0, dbl) + '.' + rest.slice(dbl + 2)
      : rest;
  }
  if (n.startsWith('dict_canonical__')) return n.slice(16);
  return n.replace(/_/g, ' ');
}

// Compute worst verdict across rows, ignoring INFO.
function worstPVVerdict(rows) {
  if (rows.some(r => r.verdict === 'FAIL')) return 'FAIL';
  if (rows.some(r => r.verdict === 'WARN')) return 'WARN';
  return 'PASS';
}

function renderPackValidator(rows) {
  clearChildren(packValidatorEl);
  if (!rows.length) {
    packValidatorEl.classList.add('hidden');
    return;
  }

  // Section heading
  const headingDiv = el('div', 'pv-heading');
  headingDiv.appendChild(el('h2', 'pv-title', 'Source Pack Fit'));
  headingDiv.appendChild(el('p', 'pv-subtitle',
    'Harris PACS landing layer conformance — ' + rows.length + ' checks across 4 categories.'));
  packValidatorEl.appendChild(headingDiv);

  for (const catKey of PV_CAT_ORDER) {
    const catMeta = PV_CATEGORIES[catKey];
    const catRows = rows.filter(r => r.category === catKey);
    if (!catRows.length) continue;

    const verdict   = worstPVVerdict(catRows);
    const passCount = catRows.filter(r => r.verdict === 'PASS').length;
    const warnCount = catRows.filter(r => r.verdict === 'WARN').length;
    const failCount = catRows.filter(r => r.verdict === 'FAIL').length;
    const infoCount = catRows.filter(r => r.verdict === 'INFO').length;

    const group = el('div', 'pv-group pv-group-' + vcls(verdict));

    // Header: badge + category name + count summary
    const hdr = el('div', 'pv-group-header');
    const badge = makeBadge(verdict);
    if (badge) hdr.appendChild(badge);
    hdr.appendChild(el('span', 'pv-cat-label', catMeta.label));
    const countParts = [];
    if (passCount) countParts.push(passCount + (passCount === 1 ? ' pass' : ' pass'));
    if (warnCount) countParts.push(warnCount + ' warn');
    if (failCount) countParts.push(failCount + ' fail');
    if (infoCount) countParts.push(infoCount + ' info');
    hdr.appendChild(el('span', 'pv-cat-count', countParts.join(' · ')));
    group.appendChild(hdr);

    // FAIL + WARN checks shown with full detail
    const nonPass = catRows.filter(r => r.verdict === 'FAIL' || r.verdict === 'WARN');
    if (nonPass.length > 0) {
      const ul = el('ul', 'pv-check-list');
      for (const row of nonPass) {
        const li = el('li', 'pv-check-row pv-check-' + vcls(row.verdict));
        li.appendChild(el('span', 'pv-check-sym', SYM[row.verdict] || '?'));
        li.appendChild(el('span', 'pv-check-name', humanizeCheck(row)));
        if (row.measured !== 'present' || row.expected !== 'present') {
          // Show measured vs expected when it's not a simple presence check
          const measured = row.measured !== row.expected
            ? el('span', 'pv-check-measured', row.measured + ' (expected: ' + row.expected + ')')
            : null;
          if (measured) li.appendChild(measured);
        }
        li.appendChild(el('span', 'pv-check-notes', row.notes));
        ul.appendChild(li);
      }
      group.appendChild(ul);
    }

    // INFO checks shown separately with lighter styling
    const infoRows = catRows.filter(r => r.verdict === 'INFO');
    if (infoRows.length > 0) {
      const ul = el('ul', 'pv-check-list pv-info-list');
      for (const row of infoRows) {
        const li = el('li', 'pv-check-row pv-check-info');
        li.appendChild(el('span', 'pv-check-sym', 'ℹ'));
        li.appendChild(el('span', 'pv-check-name', humanizeCheck(row)));
        li.appendChild(el('span', 'pv-check-notes', row.notes));
        ul.appendChild(li);
      }
      group.appendChild(ul);
    }

    packValidatorEl.appendChild(group);
  }

  packValidatorEl.classList.remove('hidden');
}

// Fires /api/pack-validator/run after the doctor completes.
// Non-blocking — not awaited in the main click handler.
async function fetchAndRenderPackValidator() {
  // Show loading placeholder while waiting
  clearChildren(packValidatorEl);
  const loadDiv = el('div', 'pv-loading');
  loadDiv.appendChild(el('p', 'hint', 'Loading pack validator detail…'));
  packValidatorEl.appendChild(loadDiv);
  packValidatorEl.classList.remove('hidden');

  try {
    const res = await fetch('/api/pack-validator/run', {
      method: 'POST',
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      packValidatorEl.classList.add('hidden');
      return;
    }
    const result = await res.json();
    if (result.stdout) {
      renderPackValidator(parsePV(result.stdout));
    } else {
      packValidatorEl.classList.add('hidden');
    }
  } catch {
    packValidatorEl.classList.add('hidden');
  }
}

// ── Identity Spine parser + renderer (Slice E) ───────────────────────────────
//
// Parses the pipe-delimited output of identity-drift-detector.sql (run via
// identity-runner.mjs) and renders an 11-table identity health panel.
//
// Statement 1 format: lane_table|total|live|dangling|null_ref|verdict  (6 cols)
// Statement 2 format: OVERALL: PASS/FAIL text  (single column — no pipes)
//
// Hard rule: dangling > 0 on any non-deferred sealed-lane table = FAIL.
// Known deferred: canonical_tf.tf_parcel_owner_link → WARN when dangling > 0.

function parseIdentityDrift(stdout) {
  const rows = [];
  let   overall = null;

  for (const raw of stdout.split('\n')) {
    const l = raw.trim();
    if (!l) continue;

    // Statement 2: single-column verdict (no pipes)
    if (l.startsWith('OVERALL:')) {
      overall = { text: l, pass: l.includes('PASS') };
      continue;
    }

    // Statement 1: 6 pipe-delimited columns
    const parts = l.split('|');
    if (parts.length < 6) continue;

    rows.push({
      table:    parts[0].trim(),
      total:    parseInt(parts[1].trim(), 10) || 0,
      live:     parseInt(parts[2].trim(), 10) || 0,
      dangling: parseInt(parts[3].trim(), 10) || 0,
      nullRef:  parseInt(parts[4].trim(), 10) || 0,
      verdict:  parts[5].trim(),  // PASS | FAIL (SQL-computed)
    });
  }

  return { rows, overall };
}

// Effective verdict respecting known-deferred override.
function idEffectiveVerdict(row) {
  if (row.dangling === 0)                    return 'PASS';
  if (KNOWN_DRIFT_DEFERRED.has(row.table))   return 'WARN';
  return 'FAIL';
}

// Strip schema prefix for display: "canonical_tf.tf_land" → "tf_land"
function idShortName(fullName) {
  const dot = fullName.indexOf('.');
  return dot >= 0 ? fullName.slice(dot + 1) : fullName;
}

// Schema label for display (shown as a small prefix): "canonical_tf", "gis_tf"
function idSchemaLabel(fullName) {
  const dot = fullName.indexOf('.');
  return dot >= 0 ? fullName.slice(0, dot) : '';
}

// Format a large number with commas.
function fmtN(n) {
  return n.toLocaleString('en-US');
}

function renderIdentitySpine({ rows, overall }) {
  clearChildren(identitySpineEl);
  if (!rows.length) {
    identitySpineEl.classList.add('hidden');
    return;
  }

  // Determine if any non-deferred sealed-lane table has drift
  const realFails = rows.filter(r => idEffectiveVerdict(r) === 'FAIL');
  const hasRealFail = realFails.length > 0;

  // Section heading
  const headingDiv = el('div', 'is-heading');
  headingDiv.appendChild(el('h2', 'is-title', 'Identity Spine'));
  headingDiv.appendChild(el('p', 'is-subtitle',
    rows.length + ' canonical tables — live parcel spine cross-reference.'));
  identitySpineEl.appendChild(headingDiv);

  // Global FAIL banner for any non-deferred drift
  if (hasRealFail) {
    const banner = el('div', 'is-overall-fail');
    banner.appendChild(el('span', 'is-overall-icon', '⛔'));
    const msgParts = el('div', 'is-overall-body');
    msgParts.appendChild(el('span', 'is-overall-msg', 'Identity drift detected — do not drain until resolved.'));
    const tableList = realFails.map(r => idShortName(r.table)).join(', ');
    msgParts.appendChild(el('span', 'is-overall-tables', tableList));
    banner.appendChild(msgParts);
    identitySpineEl.appendChild(banner);
  }

  // One card per group
  for (const group of ID_GROUPS) {
    const groupRows = group.tables
      .map(t => rows.find(r => r.table === t))
      .filter(Boolean);
    if (!groupRows.length) continue;

    // Group-level worst verdict
    const verdicts  = groupRows.map(idEffectiveVerdict);
    const groupVerdict = verdicts.includes('FAIL') ? 'FAIL'
                       : verdicts.includes('WARN') ? 'WARN'
                       : 'PASS';
    const groupVcls = vcls(groupVerdict);

    const card = el('div', 'is-group-card is-group-' + groupVcls);
    card.setAttribute('role', 'article');

    // Card header
    const hdr = el('div', 'is-group-header');
    const badge = makeBadge(groupVerdict);
    if (badge) hdr.appendChild(badge);
    const labelWrap = el('div', 'is-group-label-wrap');
    labelWrap.appendChild(el('span', 'is-group-label', group.label));
    labelWrap.appendChild(el('span', 'is-group-desc', group.desc));
    hdr.appendChild(labelWrap);
    card.appendChild(hdr);

    // Table rows
    const tableList = el('div', 'is-table-list');
    for (const row of groupRows) {
      const rv    = idEffectiveVerdict(row);
      const rvcls = vcls(rv);
      const sym   = rv === 'FAIL' ? '✗' : rv === 'WARN' ? '⚠' : '✓';

      const trow = el('div', 'is-table-row is-row-' + rvcls);

      // Symbol + table name
      const nameCell = el('div', 'is-table-name-cell');
      nameCell.appendChild(el('span', 'is-row-sym', sym));
      const schema = idSchemaLabel(row.table);
      if (schema && schema !== 'canonical_tf') {
        nameCell.appendChild(el('span', 'is-schema-label', schema + '.'));
      }
      nameCell.appendChild(el('span', 'is-table-name', idShortName(row.table)));
      trow.appendChild(nameCell);

      // Metrics
      const metrics = el('div', 'is-metrics');

      const mTotal = el('span', 'is-metric');
      mTotal.appendChild(el('span', 'is-metric-val', fmtN(row.total)));
      mTotal.appendChild(el('span', 'is-metric-lbl', 'total'));
      metrics.appendChild(mTotal);

      const mLive = el('span', 'is-metric');
      mLive.appendChild(el('span', 'is-metric-val', fmtN(row.live)));
      mLive.appendChild(el('span', 'is-metric-lbl', 'live'));
      metrics.appendChild(mLive);

      // Dangling — the alarm metric
      const dangCls = row.dangling > 0
        ? (rv === 'FAIL' ? 'is-metric-danger' : 'is-metric-warn')
        : 'is-metric-zero';
      const mDang = el('span', 'is-metric');
      mDang.appendChild(el('span', 'is-metric-val ' + dangCls, fmtN(row.dangling)));
      mDang.appendChild(el('span', 'is-metric-lbl', 'dangling'));
      metrics.appendChild(mDang);

      // Null ref — informational only
      const mNull = el('span', 'is-metric is-metric-faded');
      mNull.appendChild(el('span', 'is-metric-val', fmtN(row.nullRef)));
      mNull.appendChild(el('span', 'is-metric-lbl', 'null'));
      metrics.appendChild(mNull);

      trow.appendChild(metrics);
      tableList.appendChild(trow);
    }
    card.appendChild(tableList);

    identitySpineEl.appendChild(card);
  }

  // Doctrine callout
  const doctrine = el('div', 'is-doctrine');
  doctrine.appendChild(el('span', 'is-doctrine-label', 'Doctrine — Learned Law #2'));
  doctrine.appendChild(el('p', 'is-doctrine-text',
    'Never blind-join canonical_tf.tf_parcel (3.2M rows including legacy generations). ' +
    'Resolve through sync_bridge.source_xref WHERE TfEntityType=\'parcel\' AND IsActive.'));
  identitySpineEl.appendChild(doctrine);

  identitySpineEl.classList.remove('hidden');
}

// Fires /api/identity-drift/run after the doctor completes.
// Non-blocking — not awaited in the main click handler.
async function fetchAndRenderIdentitySpine() {
  clearChildren(identitySpineEl);
  const loadDiv = el('div', 'is-loading');
  loadDiv.appendChild(el('p', 'hint', 'Loading identity spine detail…'));
  identitySpineEl.appendChild(loadDiv);
  identitySpineEl.classList.remove('hidden');

  try {
    const res = await fetch('/api/identity-drift/run', {
      method: 'POST',
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      identitySpineEl.classList.add('hidden');
      return;
    }
    const result = await res.json();
    if (result.stdout) {
      renderIdentitySpine(parseIdentityDrift(result.stdout));
    } else {
      identitySpineEl.classList.add('hidden');
    }
  } catch {
    identitySpineEl.classList.add('hidden');
  }
}

// ── Seal-Check parser + renderer (Slice D) ────────────────────────────────────
//
// Parses the pipe-delimited output of seal-check-runner.sql (run via
// seal-runner.mjs) and renders a per-lane gate panel.
//
// Statement 1 format: lane|check_name|measured|expected|verdict
//   verdict is one of: PASS | WARN-CHANGED | WARN-REGRESSED | FAIL
// Statement 2 format: OVERALL: text|fail_count|reasons (pipe-delimited)

function parseSealChecks(stdout) {
  const rows = [];
  let overall = null;

  for (const raw of stdout.split('\n')) {
    const l = raw.trim();
    if (!l) continue;

    const parts = l.split('|');

    // Statement 2: first column starts with "OVERALL:"
    if (parts[0].startsWith('OVERALL:')) {
      overall = {
        text:      parts[0].trim(),
        failCount: parseInt(parts[1] ?? '0', 10) || 0,
        reasons:   parts.slice(2).join('|').trim(),
      };
      continue;
    }

    // Statement 1: 5 columns — lane|check_name|measured|expected|verdict
    if (parts.length < 5) continue;
    rows.push({
      lane:      parts[0].trim(),
      checkName: parts[1].trim(),
      measured:  parts[2].trim(),
      expected:  parts[3].trim(),
      verdict:   parts[4].trim(),
    });
  }

  return { rows, overall };
}

// Map seal verdict to PASS/WARN/FAIL for CSS class lookups.
function sealVcls(v) {
  if (v === 'FAIL')         return 'fail';
  if (v.startsWith('WARN')) return 'warn';
  return 'pass';
}

// Worst lane-level verdict across a set of gate rows.
function worstSealVerdict(rows) {
  if (rows.some(r => r.verdict === 'FAIL'))         return 'FAIL';
  if (rows.some(r => r.verdict.startsWith('WARN'))) return 'WARN';
  return 'PASS';
}

function renderSealCheck({ rows, overall }) {
  clearChildren(sealCheckEl);
  if (!rows.length) {
    sealCheckEl.classList.add('hidden');
    return;
  }

  const laneCount = LANE_ORDER.filter(l => rows.some(r => r.lane === l)).length;

  // Section heading
  const headingDiv = el('div', 'sc-heading');
  headingDiv.appendChild(el('h2', 'sc-title', 'Lane Seal'));
  headingDiv.appendChild(el('p', 'sc-subtitle',
    rows.length + ' gates across ' + laneCount + ' lanes — Benton County sealed benchmarks.'));
  sealCheckEl.appendChild(headingDiv);

  // Global FAIL banner when any structural gate fails
  if (overall && overall.failCount > 0) {
    const banner = el('div', 'sc-overall-fail');
    banner.appendChild(el('span', 'sc-overall-icon', '⛔'));
    banner.appendChild(el('span', 'sc-overall-msg',
      'Seal integrity COMPROMISED — ' + overall.failCount +
      (overall.failCount === 1 ? ' gate failed.' : ' gates failed.')));
    if (overall.reasons) {
      banner.appendChild(el('p', 'sc-overall-reasons', overall.reasons));
    }
    sealCheckEl.appendChild(banner);
  }

  // One card per lane
  for (const laneKey of LANE_ORDER) {
    const laneRows = rows.filter(r => r.lane === laneKey);
    if (!laneRows.length) continue;

    const meta        = LANE_META[laneKey] || { label: laneKey, desc: '' };
    const laneVerdict = worstSealVerdict(laneRows);
    const laneVcls    = sealVcls(laneVerdict);

    const card = el('div', 'sc-lane-card sc-lane-' + laneVcls);
    card.setAttribute('role', 'article');

    // Card header: verdict badge + lane label + description
    const hdr = el('div', 'sc-lane-header');
    const badge = makeBadge(laneVerdict);
    if (badge) hdr.appendChild(badge);
    const labelWrap = el('div', 'sc-lane-label-wrap');
    labelWrap.appendChild(el('span', 'sc-lane-label', meta.label));
    if (meta.desc) labelWrap.appendChild(el('span', 'sc-lane-desc', meta.desc));
    hdr.appendChild(labelWrap);
    card.appendChild(hdr);

    // FAIL: seal-invalid alert
    if (laneVerdict === 'FAIL') {
      const alert = el('div', 'sc-invalid-alert');
      alert.appendChild(el('span', 'sc-invalid-icon', '⛔'));
      alert.appendChild(el('span', 'sc-invalid-msg', 'Seal invalid — do not rely on this lane.'));
      card.appendChild(alert);
    }

    // Gate rows
    const table = el('div', 'sc-gate-table');
    for (const row of laneRows) {
      const gvcls  = sealVcls(row.verdict);
      const gateRow = el('div', 'sc-gate-row sc-gate-' + gvcls);

      const sym = gvcls === 'fail' ? '✗' : gvcls === 'warn' ? '⚠' : '✓';
      gateRow.appendChild(el('span', 'sc-gate-sym', sym));
      gateRow.appendChild(el('span', 'sc-gate-name', row.checkName));
      gateRow.appendChild(el('span', 'sc-gate-measured', row.measured));
      gateRow.appendChild(el('span', 'sc-gate-expected', 'exp: ' + row.expected));

      // Show full verdict tag for non-PASS (WARN-CHANGED vs WARN-REGRESSED matters)
      if (row.verdict !== 'PASS') {
        gateRow.appendChild(el('span',
          'sc-gate-verdict sc-gate-verdict-' + gvcls,
          row.verdict));
      }

      table.appendChild(gateRow);
    }
    card.appendChild(table);

    sealCheckEl.appendChild(card);
  }

  sealCheckEl.classList.remove('hidden');
}

// Fires /api/seal-check/run after the doctor completes.
// Non-blocking — not awaited in the main click handler.
async function fetchAndRenderSealCheck() {
  // Show loading placeholder while waiting
  clearChildren(sealCheckEl);
  const loadDiv = el('div', 'sc-loading');
  loadDiv.appendChild(el('p', 'hint', 'Loading seal gate detail…'));
  sealCheckEl.appendChild(loadDiv);
  sealCheckEl.classList.remove('hidden');

  try {
    const res = await fetch('/api/seal-check/run', {
      method: 'POST',
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      sealCheckEl.classList.add('hidden');
      return;
    }
    const result = await res.json();
    if (result.stdout) {
      renderSealCheck(parseSealChecks(result.stdout));
    } else {
      sealCheckEl.classList.add('hidden');
    }
  } catch {
    sealCheckEl.classList.add('hidden');
  }
}

function renderError(msg, hint) {
  clearChildren(stepsEl);
  const p = el('p', 'no-steps-msg fail', msg);
  stepsEl.appendChild(p);
  if (hint) {
    const s = el('p', 'hint', hint);
    stepsEl.appendChild(s);
  }
}

function renderLoading() {
  clearChildren(stepsEl);
  const wrap = el('div', 'running-state');

  const spinner = el('div', 'spinner');
  spinner.setAttribute('role', 'status');
  spinner.setAttribute('aria-label', 'Running');
  wrap.appendChild(spinner);

  wrap.appendChild(el('p', null, 'Running tf-sync doctor…'));
  wrap.appendChild(el('p', 'hint',
    'Checking: pack validator → identity drift → seal gates → domain coverage'));
  wrap.appendChild(el('p', 'hint', 'This may take 30–60 seconds.'));

  stepsEl.appendChild(wrap);
}

// ── Main ──────────────────────────────────────────────────────────────────────
runBtn.addEventListener('click', async () => {
  runBtn.disabled    = true;
  runBtn.textContent = 'Running…';

  renderLoading();
  overallEl.classList.add('hidden');
  metaEl.classList.add('hidden');
  packValidatorEl.classList.add('hidden');
  identitySpineEl.classList.add('hidden');
  sealCheckEl.classList.add('hidden');
  domainCoverageEl.classList.add('hidden');
  rawOut.classList.add('hidden');

  try {
    const res = await fetch('/api/doctor/run', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  AbortSignal.timeout(300_000),   // 5 min
    });

    if (res.status === 409) {
      renderError(
        'Doctor is already running.',
        'Please wait for the current run to finish.'
      );
      return;
    }

    if (!res.ok) {
      renderError(
        'Server error — status ' + res.status + '.',
        'Is the workbench server still running?'
      );
      return;
    }

    const result = await res.json();

    // Connection / psql error — no usable stdout
    if (result.exitCode === 2 && !result.stdout.trim()) {
      renderError(
        'Doctor could not connect to PostgreSQL.',
        result.stderr ? result.stderr.slice(0, 200) : 'Check PG_HOST / PGPASSWORD env vars.'
      );
      rawPre.textContent = result.stderr || '(no output)';
      rawOut.classList.remove('hidden');
      return;
    }

    const data = parseDoctor(result.stdout);

    renderMeta(data, result);
    renderOverall(data, result.exitCode);
    renderSteps(data.steps);
    renderDomainCoverage(data.steps);

    // Fire pack validator detail after doctor renders (step #0 must be present).
    // Non-blocking — renders the Source Pack Fit panel when it arrives (~5–10s).
    if (data.steps.find(s => s.idx === 0)) {
      fetchAndRenderPackValidator();
    }

    // Fire identity drift detail after doctor renders (step #1 must be present).
    // Non-blocking — renders the Identity Spine panel when it arrives (~10–20s).
    if (data.steps.find(s => s.idx === 1)) {
      fetchAndRenderIdentitySpine();
    }

    // Fire seal-check detail after doctor renders (step #2 must be present).
    // Non-blocking — renders the Lane Seal panel when it arrives (~5–10s).
    if (data.steps.find(s => s.idx === 2)) {
      fetchAndRenderSealCheck();
    }

    rawPre.textContent = result.stdout +
      (result.stderr ? '\n\n--- stderr ---\n' + result.stderr : '');
    rawOut.classList.remove('hidden');

  } catch (e) {
    if (e.name === 'TimeoutError') {
      renderError(
        'Request timed out after 5 minutes.',
        'Check that PostgreSQL is reachable and responding.'
      );
    } else {
      renderError(
        'Could not reach workbench server: ' + e.message,
        'Run: node tools/sync/workbench/server.mjs'
      );
    }
  } finally {
    runBtn.disabled    = false;
    runBtn.textContent = 'Run Doctor';
  }
});

// ── Dry-Run Preview panel (Slice H) drp-* ───────────────────────────────────
//
// Always visible — not doctor-triggered.
// Operator clicks "Preview Improvement Lane" to run a projection.
// Lane is fixed to "improvement" in Slice H (v0.2 contract).
//
// Hard rules (SLICE_H_DRY_RUN_PREVIEW_CONTRACT.md §8):
//   · The amber notice MUST be the first item rendered after a response.
//   · No approve / commit / run-drain / release-quarantine controls anywhere.
//   · Calls only /api/dry-run-preview/run (the proxy endpoint at port 7700).
//   · The workbench proxy forwards to port 5000 /api/sync/workbench/dry-run-preview.
//

let drpRunning = false;

async function handleDryRunPreview() {
  if (drpRunning) return;
  drpRunning = true;

  const btn        = document.getElementById('drp-preview-btn');
  const yearInput  = document.getElementById('drp-year');
  const topNInput  = document.getElementById('drp-topn');
  const resultArea = document.getElementById('drp-result-area');

  btn.disabled    = true;
  btn.textContent = 'Running…';
  clearChildren(resultArea);

  // Loading spinner
  const loading = el('div', 'drp-loading');
  loading.appendChild(el('div', 'spinner'));
  loading.appendChild(el('p', 'hint', 'Projecting improvement lane…'));
  resultArea.appendChild(loading);

  try {
    const year = parseInt(yearInput.value, 10) || null;
    const topN = topNInput.value.trim() ? parseInt(topNInput.value, 10) : null;

    const res = await fetch('/api/dry-run-preview/run', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ operationalYear: year, topN }),
      signal:  AbortSignal.timeout(300_000),
    });

    clearChildren(resultArea);

    if (res.status === 409) {
      renderDrpError(resultArea, 'Dry-run preview already running — please wait.');
      return;
    }

    const data = await res.json();

    if (!res.ok || data.error) {
      renderDrpError(resultArea, data.error || ('Server error — HTTP ' + res.status));
      return;
    }

    renderDrpResult(resultArea, data);

  } catch (e) {
    clearChildren(resultArea);
    renderDrpError(
      resultArea,
      e.name === 'TimeoutError'
        ? 'Request timed out after 5 minutes.'
        : 'Could not reach workbench server: ' + e.message
    );
  } finally {
    drpRunning      = false;
    btn.disabled    = false;
    btn.textContent = 'Preview Improvement Lane';
  }
}

function renderDrpResult(container, data) {
  // ── Amber notice — FIRST item operator sees (contract §8) ───────────────────
  const notice = el('div', 'drp-amber-notice');
  notice.appendChild(el('span', 'drp-notice-icon', '⚠'));
  notice.appendChild(el('span', 'drp-notice-text', 'DRY-RUN PREVIEW — NO DATA HAS MOVED'));
  container.appendChild(notice);

  // ── Result card ──────────────────────────────────────────────────────────────
  const card = el('div', 'drp-result-card');

  // Run ID + duration
  const metaRow = el('div', 'drp-result-meta');

  const ridGrp = el('span', 'drp-meta-group');
  ridGrp.appendChild(el('span', 'drp-meta-label', 'previewRunId'));
  ridGrp.appendChild(el('span', 'drp-meta-val drp-mono', data.previewRunId || '—'));
  metaRow.appendChild(ridGrp);

  const durGrp = el('span', 'drp-meta-group');
  durGrp.appendChild(el('span', 'drp-meta-label', 'duration'));
  durGrp.appendChild(el('span', 'drp-meta-val', (data.durationMs ?? 0) + ' ms'));
  metaRow.appendChild(durGrp);

  card.appendChild(metaRow);

  // Key-value table
  const kvTable = el('div', 'drp-kv-table');

  // Identity fields
  const KV_IDENT = [
    { key: 'lane',            val: data.lane || 'improvement' },
    { key: 'operationalYear', val: String(data.operationalYear ?? '—') },
    { key: 'topN',            val: data.topN != null ? String(data.topN) : '— (full corpus)' },
    { key: 'status',          val: data.status || 'PREVIEW' },
  ];

  for (const row of KV_IDENT) {
    const r = el('div', 'drp-kv-row');
    r.appendChild(el('span', 'drp-kv-key drp-mono', row.key));
    r.appendChild(el('span', 'drp-kv-val', row.val));
    kvTable.appendChild(r);
  }

  // Separator
  const sep = el('div', 'drp-kv-sep');
  sep.appendChild(el('span', 'drp-kv-sep-text', 'Projected counts'));
  kvTable.appendChild(sep);

  // Count fields
  const KV_COUNTS = [
    { key: 'sourceCount',             val: fmtN(data.sourceCount ?? 0),              note: 'rows in legacy_pacs_raw.imprv' },
    { key: 'canonicalCount',          val: fmtN(data.canonicalCount ?? 0),           note: 'rows in canonical_tf.tf_improvement' },
    { key: 'estimatedInserts',        val: fmtN(data.estimatedInserts ?? 0),         note: 'source rows not yet in truth' },
    { key: 'estimatedUpdates',        val: fmtN(data.estimatedUpdates ?? 0),         note: 'source rows already in truth' },
    { key: 'estimatedDeletes',        val: fmtN(data.estimatedDeletes ?? 0),         note: 'truth rows not in source' },
    { key: 'quarantineCandidateCount',val: fmtN(data.quarantineCandidateCount ?? 0), note: 'rows in quarantine tables (not released)' },
  ];

  for (const row of KV_COUNTS) {
    const r = el('div', 'drp-kv-row');
    r.appendChild(el('span', 'drp-kv-key drp-mono', row.key));
    const wrap = el('span', 'drp-kv-val-wrap');
    wrap.appendChild(el('span', 'drp-kv-number', row.val));
    if (row.note) wrap.appendChild(el('span', 'drp-kv-note', row.note));
    r.appendChild(wrap);
    kvTable.appendChild(r);
  }

  card.appendChild(kvTable);
  container.appendChild(card);
}

function renderDrpError(container, msg) {
  const wrap = el('div', 'drp-error');
  wrap.appendChild(el('span', 'drp-error-icon', '✗'));
  wrap.appendChild(el('span', 'drp-error-msg', msg));
  container.appendChild(wrap);
}

function renderDryRunPreviewPanel() {
  clearChildren(dryRunPreviewEl);

  // ── Section heading ──────────────────────────────────────────────────────────
  const hdr = el('div', 'drp-heading');
  hdr.appendChild(el('h2', 'drp-title', 'Dry-Run Preview'));
  hdr.appendChild(el('p', 'drp-subtitle',
    'Preview · improvement — read-only projection. ' +
    'No data moves until a separate approve step (not yet implemented).'));
  dryRunPreviewEl.appendChild(hdr);

  // ── Form card ────────────────────────────────────────────────────────────────
  const form = el('div', 'drp-form-card');

  // Lane row (fixed — not a user input per contract §4)
  const laneRow = el('div', 'drp-field-row');
  laneRow.appendChild(el('label', 'drp-label', 'Lane'));
  laneRow.appendChild(el('span', 'drp-lane-fixed', 'improvement'));
  form.appendChild(laneRow);

  // Assessment year
  const yearRow = el('div', 'drp-field-row');
  const yearLbl = document.createElement('label');
  yearLbl.htmlFor   = 'drp-year';
  yearLbl.className = 'drp-label';
  yearLbl.textContent = 'Assessment Year';
  yearRow.appendChild(yearLbl);
  const yearInput = document.createElement('input');
  yearInput.type      = 'number';
  yearInput.id        = 'drp-year';
  yearInput.className = 'drp-input';
  yearInput.value     = String(new Date().getFullYear());
  yearInput.min       = '2010';
  yearInput.max       = '2035';
  yearRow.appendChild(yearInput);
  form.appendChild(yearRow);

  // TopN (optional)
  const topNRow = el('div', 'drp-field-row');
  const topNLbl = document.createElement('label');
  topNLbl.htmlFor   = 'drp-topn';
  topNLbl.className = 'drp-label';
  topNLbl.textContent = 'TopN (optional)';
  topNRow.appendChild(topNLbl);
  const topNInput = document.createElement('input');
  topNInput.type        = 'number';
  topNInput.id          = 'drp-topn';
  topNInput.className   = 'drp-input';
  topNInput.placeholder = 'full corpus';
  topNInput.min         = '1';
  topNRow.appendChild(topNInput);
  form.appendChild(topNRow);

  // Preview button — label is locked by contract §8: "Preview Improvement Lane"
  const previewBtn = document.createElement('button');
  previewBtn.id          = 'drp-preview-btn';
  previewBtn.className   = 'drp-btn';
  previewBtn.textContent = 'Preview Improvement Lane';
  previewBtn.addEventListener('click', handleDryRunPreview);
  form.appendChild(previewBtn);

  dryRunPreviewEl.appendChild(form);

  // ── Result area (populated by handleDryRunPreview) ───────────────────────────
  const resultArea = el('div', null);
  resultArea.id = 'drp-result-area';
  dryRunPreviewEl.appendChild(resultArea);
}

// ── Page-load initialisation ──────────────────────────────────────────────────
// Both panels are always visible (not doctor-triggered).
renderReadbackSet();
renderEvidenceBrowser();
renderDryRunPreviewPanel();
