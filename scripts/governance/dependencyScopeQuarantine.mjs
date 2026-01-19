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

  console.log(`Current Quarantine Count: ${currentCount}`);
  console.log(`Baseline Quarantine Count: ${baselineCount}`);

  // Create the requested snapshot/output
  fs.writeFileSync(
    SNAPSHOT_FILE,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        status: currentCount <= baselineCount ? 'PASS' : 'FAIL',
        metrics: {
          current: currentCount,
          baseline: baselineCount,
        },
        quarantineList: quarantineData.map(q => q.root),
      },
      null,
      2
    )
  );
  console.log(`Snapshot written to ${SNAPSHOT_FILE}`);

  if (currentCount > baselineCount) {
    console.error(
      `FAILURE: Quarantine count (${currentCount}) exceeds baseline (${baselineCount}).`
    );
    process.exit(1);
  }

  console.log('SUCCESS: Quarantine count is within limits.');
}

main();
