import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const CONFIG = {
  baselinePath: path.resolve('governance/dotnet-warning-baseline.json'),
  budgetPath: path.resolve('governance/dotnet-warning-budget.json'),
  snapshotPath: path.resolve('dotnet-warning-snapshot.json'),
  logPath: path.resolve('ci_dotnet_warning_budget.log'),
  solution: 'backend/TerraFusion.sln'
};

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  fs.appendFileSync(CONFIG.logPath, line + '\n');
}

function parseWarnings(output) {
  const match = output.match(/\s+(\d+)\s+Warning\(s\)/);
  return match ? parseInt(match[1], 10) : 0;
}

try {
  // Init log
  fs.writeFileSync(CONFIG.logPath, '');
  log('Starting .NET Warning Budget Gate...');

  // 1. Load Baseline & Budget
  if (!fs.existsSync(CONFIG.baselinePath)) {
    throw new Error(`Baseline file not found: ${CONFIG.baselinePath}`);
  }
  const baseline = JSON.parse(fs.readFileSync(CONFIG.baselinePath, 'utf8'));
  
  let budget = { allowedIncrease: 0 };
  if (fs.existsSync(CONFIG.budgetPath)) {
    budget = JSON.parse(fs.readFileSync(CONFIG.budgetPath, 'utf8'));
  }

  log(`Baseline loaded: ${baseline.totalWarnings} warnings.`);
  log(`Budget loaded: +${budget.allowedIncrease} allowed.`);

  // 2. Run Build
  log(`Executing dotnet build on ${CONFIG.solution}...`);
  let buildOutput = '';
  try {
    // Using standard build to ensure output format matches regex
    // Using --no-incremental to get the true count regardless of previous builds
    buildOutput = execSync(`dotnet build ${CONFIG.solution} --no-incremental`, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer to handle 2000+ warnings
    });
  } catch (e) {
    buildOutput = e.stdout ? e.stdout.toString() : '';
    // If we have output, we try to parse it even if exit code was non-zero (build error)
    // But usually build error means we failed anyway.
    if (!buildOutput) {
         log('Build failed with no output.');
         throw e;
    }
  }

  // 3. Parse Output
  const currentWarnings = parseWarnings(buildOutput);
  log(`Current warning count: ${currentWarnings}`);

  // 4. Compare
  const delta = currentWarnings - baseline.totalWarnings;
  const passed = delta <= budget.allowedIncrease;
  
  const status = passed ? 'PASS' : 'FAIL';
  log(`Check Status: ${status} (Delta: ${delta > 0 ? '+' : ''}${delta})`);

  // 5. Write Snapshot
  const snapshot = {
    generatedAt: new Date().toISOString(),
    solution: CONFIG.solution,
    totalWarnings: currentWarnings,
    baseline: baseline.totalWarnings,
    delta: delta,
    status: status
  };
  fs.writeFileSync(CONFIG.snapshotPath, JSON.stringify(snapshot, null, 2));
  log(`Snapshot written to ${CONFIG.snapshotPath}`);

  if (!passed) {
    log('❌ Warning budget exceeded.');
    process.exit(1);
  } else {
    log('✅ Warning budget verified.');
    process.exit(0);
  }

} catch (error) {
  log(`🔥 Fatal Error: ${error.message}`);
  try {
     const errorSnapshot = { error: error.message, generatedAt: new Date().toISOString() };
     fs.writeFileSync(CONFIG.snapshotPath, JSON.stringify(errorSnapshot, null, 2));
  } catch (e) {} 
  process.exit(2);
}
