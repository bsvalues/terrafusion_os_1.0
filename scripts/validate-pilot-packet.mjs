/**
 * Pilot Inputs Packet Validator (V001-V006)
 * Validates filled packet against governance constraints
 */
import { readFileSync } from 'fs';

const content = readFileSync('docs/ops/PILOT_INPUTS_PACKET_FILLED.yaml', 'utf-8');

console.log('═══════════════════════════════════════════════════════');
console.log('      PILOT INPUTS PACKET VALIDATION (V001-V006)');
console.log('═══════════════════════════════════════════════════════');

const results = [];

// V001: All IDs sha256 prefixed with 64 hex chars
const sha256Regex = /sha256:[a-f0-9]{64}/g;
const matches = content.match(sha256Regex) || [];
const v001 = matches.length >= 15;
results.push(['V001', 'SHA256 ID Format', v001, `${matches.length}/15 IDs valid`]);

// V002: Primary approvers distinct
const allApproverIds = [...content.matchAll(/approver_id:\s*'(sha256:[a-f0-9]{64})'/g)];
const primarySection = content.match(/primary:\s*\n([\s\S]*?)backup:/);
let v002 = false;
let v002Detail = '';
if (primarySection) {
  const primaryIds = [...primarySection[1].matchAll(/approver_id:\s*'(sha256:[a-f0-9]{64})'/g)].map(
    m => m[1]
  );
  v002 = primaryIds.length === 2 && primaryIds[0] !== primaryIds[1];
  v002Detail = v002
    ? `${primaryIds[0].slice(7, 15)}... ≠ ${primaryIds[1].slice(7, 15)}...`
    : 'DUPLICATE!';
}
results.push(['V002', 'Primary Approvers Distinct', v002, v002Detail]);

// V003: DR drill within 90 days of activation (2026-02-03)
const drillMatch = content.match(/drill_date:\s*'(\d{4}-\d{2}-\d{2})'/);
let v003 = false;
let v003Detail = 'No drill date';
if (drillMatch) {
  const drillDate = new Date(drillMatch[1]);
  const activationDate = new Date('2026-02-03');
  const daysDiff = Math.floor((activationDate - drillDate) / (1000 * 60 * 60 * 24));
  v003 = daysDiff <= 90 && daysDiff >= 0;
  v003Detail = `${daysDiff} days ago (limit: 90)`;
}
results.push(['V003', 'DR Drill Freshness', v003, v003Detail]);

// V004: Minimum 3 operators
const opCount = (content.match(/operator_id:/g) || []).length;
const v004 = opCount >= 3;
results.push(['V004', 'Min 3 Operators', v004, `${opCount} operators`]);

// V005: 1-3 services
const svcCount = (content.match(/service_id:/g) || []).length;
const v005 = svcCount >= 1 && svcCount <= 3;
results.push(['V005', 'Service Count (1-3)', v005, `${svcCount} services`]);

// V006: No PII (email, phone patterns)
const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
const hasPII = emailPattern.test(content) || phonePattern.test(content);
const v006 = !hasPII;
results.push(['V006', 'No PII Detected', v006, hasPII ? 'PII FOUND!' : 'Clean']);

// Print results
console.log('');
console.log('  Rule   │ Description              │ Status │ Detail');
console.log('─────────┼──────────────────────────┼────────┼─────────────────────');
for (const [id, desc, pass, detail] of results) {
  const status = pass ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${id}   │ ${desc.padEnd(24)} │ ${status} │ ${detail}`);
}
console.log('═══════════════════════════════════════════════════════');

const allPass = results.every(r => r[2]);
console.log('');
console.log(
  allPass
    ? '✅ ALL VALIDATORS PASS — Packet ready for instantiation'
    : '❌ VALIDATION FAILED — Fix issues before proceeding'
);
console.log('');

process.exit(allPass ? 0 : 1);
