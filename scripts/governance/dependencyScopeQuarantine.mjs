import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../..');
const QUARANTINE_FILE = path.join(ROOT_DIR, 'DEPENDENCY_SCOPE_QUARANTINE.json');
const BASELINE_FILE = path.join(__dirname, 'dependency-scope-quarantine-baseline.json');
const SNAPSHOT_FILE = path.join(ROOT_DIR, 'dependency-scope-quarantine.json');

function main() {
  console.log('Running Dependency Scope Quarantine Check...');

  if (!fs.existsSync(QUARANTINE_FILE)) {
    console.error(`Error: Quarantine file not found: ${QUARANTINE_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(BASELINE_FILE)) {
    console.error(`Error: Baseline file not found: ${BASELINE_FILE}`);
    process.exit(1);
  }

  const quarantineData = JSON.parse(fs.readFileSync(QUARANTINE_FILE, 'utf8'));
  const baselineData = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));

  const currentCount = quarantineData.length;
  const baselineCount = baselineData.count;
  const delta = currentCount - baselineCount;

  console.log(`Current Quarantine Count: ${currentCount}`);
  console.log(`Baseline Quarantine Count: ${baselineCount}`);

  // ════════════════════════════════════════════════════════════════════════════
  // QUARANTINE POLICY (Option A): Monotonic decrease allowed, increase blocked
  // ────────────────────────────────────────────────────────────────────────────
  // PASS if current <= baseline  (shrinking or stable = good)
  // FAIL if current > baseline   (regression = bad)
  // ════════════════════════════════════════════════════════════════════════════
  const isPass = currentCount <= baselineCount;
  const policyNote =
    delta < 0
      ? `✅ Quarantine shrank by ${Math.abs(delta)} (improvement)`
      : delta === 0
        ? `✅ Quarantine stable at baseline`
        : `❌ Quarantine grew by ${delta} (regression blocked)`;

  console.log(policyNote);

  // Create the requested snapshot/output
  fs.writeFileSync(
    SNAPSHOT_FILE,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        status: isPass ? 'PASS' : 'FAIL',
        policy: 'monotonic-decrease-allowed',
        policyNote,
        metrics: {
          current: currentCount,
          baseline: baselineCount,
          delta,
        },
        quarantineList: quarantineData.map(q => q.root),
      },
      null,
      2
    )
  );
  console.log(`Snapshot written to ${SNAPSHOT_FILE}`);

  if (!isPass) {
    console.error(
      `FAILURE: Quarantine count (${currentCount}) exceeds baseline (${baselineCount}).`
    );
    console.error(`Update baseline or reduce quarantine entries before merging.`);
    process.exit(1);
  }

  console.log('SUCCESS: Quarantine count is within limits.');
}

main();
