#!/usr/bin/env node
/**
 * Brain check: reserved-suite staging ratchet.
 *
 * Reserved suites (Clerk/Treasury/Audit/Recorder per TF-052) are forward-staged, not active. This
 * ratchet allows the FROZEN set in docs/brain/canon/reserved-staging.json but FAILS on any NEW
 * reserved-suite controller — so the footprint cannot grow without a deliberate decision.
 *
 *   node scripts/brain/check-reserved-staging.mjs
 *
 * Exit 0 = no new reserved-suite controllers; 1 = footprint grew (update the register + decide).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './canon.mjs';

const reg = JSON.parse(
  readFileSync(join(REPO_ROOT, 'docs', 'brain', 'canon', 'reserved-staging.json'), 'utf8')
);
const frozen = new Set(
  (reg.footprint?.backend_controllers || []).map(c => c.file.replace(/\\/g, '/'))
);
// EXACT reserved-office controller names only. NOT *AuditController (e.g. LevyAuditController =
// levy-compliance audit, a Dais/levy function; SalesAuditController = sales-domain) — those are
// legitimate domain names, not the reserved County Auditor office.
const RESERVED = /^(Clerk|Treasury|Audit|Recorder)Controller\.cs$/;

const ctrlDir = join(REPO_ROOT, 'backend', 'src', 'TerraFusion.API', 'Controllers');
const found = existsSync(ctrlDir)
  ? readdirSync(ctrlDir)
      .filter(f => RESERVED.test(f))
      .map(f => `backend/src/TerraFusion.API/Controllers/${f}`)
  : [];

const novel = found.filter(f => !frozen.has(f));

if (novel.length) {
  console.log(
    `❌ reserved-staging: ${novel.length} NEW reserved-suite controller(s) outside the frozen register`
  );
  novel.forEach(f => console.log(`   ${f}`));
  console.log(`\n   Reserved suites are forward-staged, not active (TF-052). Either:`);
  console.log(`   - revert/relocate the new controller, or`);
  console.log(
    `   - make a deliberate decision + add it to docs/brain/canon/reserved-staging.json (with an ADR).`
  );
  process.exit(1);
}
console.log(
  `✅ reserved-staging: ${found.length} reserved-suite controller(s), all in the frozen register (footprint not growing)`
);
process.exit(0);
