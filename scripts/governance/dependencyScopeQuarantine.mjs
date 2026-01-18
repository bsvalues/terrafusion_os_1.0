import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const CONFIG = {
  reportPath: path.resolve('DEPENDENCY_SCOPE_REPORT.md'),
  inventoryPath: path.resolve('dependency-scope-quarantine.json'),
  logPath: path.resolve('ci_dependency_scope_quarantine.log'),
  baselinePath: path.resolve('scripts/governance/dependency-scope-quarantine-baseline.json'),
  budgetPath: path.resolve('scripts/governance/dependency-scope-quarantine-budget.json'),
};

/**
 * Parses the DEPENDENCY_SCOPE_REPORT.md content.
 * @param {string} content
 * @returns {{ totals: Record<string, number>, samples: Array<any> }}
 */
export function parseReport(content) {
  const lines = content.split(/\r?\n/);
  const samples = [];
  const totals = {};

  let section = '';

  for (const line of lines) {
    if (line.startsWith('## Totals')) {
      section = 'totals';
      continue;
    }
    if (line.startsWith('## Top Evidence Samples')) {
      section = 'samples';
      continue;
    }

    if (section === 'totals' && line.trim().startsWith('- ')) {
      const parts = line.replace('- ', '').split(':');
      if (parts.length === 2) {
        totals[parts[0].trim()] = parseInt(parts[1].trim(), 10);
      }
    }

    if (section === 'samples' && line.trim().startsWith('- ')) {
      // Format: - Name -> Category (local=X; total=Y; wiring=Z)
      const match = line.match(/- (.*?) -> (.*?) \(local=(\d+); total=(\d+); wiring=(.*?)\)/);
      if (match) {
        samples.push({
          package: match[1],
          bucket: match[2],
          localUsage: parseInt(match[3], 10),
          totalUsage: parseInt(match[4], 10),
          wiring: match[5],
        });
      }
    }
  }
  return { totals, samples };
}

/**
 * Main execution logic
 */
const isMainModule = url => {
  if (!url) return false;
  const executedFile = path.resolve(process.argv[1]);
  const currentFile = fileURLToPath(url);
  return executedFile === currentFile;
};

if (isMainModule(import.meta.url)) {
  try {
    const isGate = process.argv.includes('--gate');

    if (!fs.existsSync(CONFIG.reportPath)) {
      console.error(
        `[Error] Report not found at ${CONFIG.reportPath}. Run 'npm run ci:renovate-scope' first.`
      );
      process.exit(1);
    }

    console.log(`[Quarantine] Reading report from ${CONFIG.reportPath}...`);
    const content = fs.readFileSync(CONFIG.reportPath, 'utf8');
    const result = parseReport(content);

    // Filter for QUARANTINE items
    const quarantineItems = result.samples.filter(s => s.bucket === 'QUARANTINE');
    const quarantineCount = result.totals['QUARANTINE'] || 0;

    // Sort for deterministic hashing
    quarantineItems.sort((a, b) => a.package.localeCompare(b.package));

    const inventory = {
      generatedAt: new Date().toISOString(),
      totalQuarantine: quarantineCount,
      items: quarantineItems,
    };

    // Calculate Hash
    const hash = crypto.createHash('sha256').update(JSON.stringify(quarantineItems)).digest('hex');
    inventory.hash = hash;

    // Write Inventory
    fs.writeFileSync(CONFIG.inventoryPath, JSON.stringify(inventory, null, 2));
    console.log(`[Quarantine] Inventory written to ${CONFIG.inventoryPath}`);

    // Determine Baseline
    let baseline = { quarantineCount: 0, hash: '' };
    if (fs.existsSync(CONFIG.baselinePath)) {
      try {
        baseline = JSON.parse(fs.readFileSync(CONFIG.baselinePath, 'utf8'));
      } catch (e) {
        console.warn(`[Warning] Could not parse baseline file: ${e.message}`);
      }
    } else {
      console.warn(`[Warning] No baseline found at ${CONFIG.baselinePath}`);
    }

    const budget = fs.existsSync(CONFIG.budgetPath)
      ? JSON.parse(fs.readFileSync(CONFIG.budgetPath, 'utf8'))
      : { maxNewQuarantineItems: 0 };

    // Write Log
    let logContent = `DEPENDENCY SCOPE QUARANTINE REPORT\n`;
    logContent += `Generated: ${inventory.generatedAt}\n`;
    logContent += `Total Quarantine: ${quarantineCount} (Baseline: ${baseline.quarantineCount})\n`;
    logContent += `Hash: ${hash} (Baseline: ${baseline.hash})\n\n`;

    logContent += `--- QUARANTINE ITEMS ---\n`;
    quarantineItems.forEach(item => {
      logContent += `${item.package.padEnd(40)} | Total: ${item.totalUsage.toString().padEnd(4)} | Wiring: ${item.wiring}\n`;
    });

    fs.writeFileSync(CONFIG.logPath, logContent);
    console.log(`[Quarantine] Log written to ${CONFIG.logPath}`);

    // Gate Logic
    if (isGate) {
      console.log(`[Gate] Checking against baseline...`);
      const diff = quarantineCount - baseline.quarantineCount;

      if (diff > budget.maxNewQuarantineItems) {
        console.error(
          `[Gate] FAILED: Quarantine count increased by ${diff} (Current: ${quarantineCount}, Baseline: ${baseline.quarantineCount}). Max allowed increase: ${budget.maxNewQuarantineItems}`
        );
        process.exit(1);
      }

      // Optional: Hash check could act as strict mode
      if (budget.allowDrift === false && quarantineCount !== baseline.quarantineCount) {
        console.error(
          `[Gate] FAILED: Quarantine drift detected. Count changed from ${baseline.quarantineCount} to ${quarantineCount}, but allowDrift is false.`
        );
        process.exit(1);
      }

      console.log(`[Gate] PASSED.`);
    }
  } catch (e) {
    console.error('Fatal Error:', e);
    process.exit(1);
  }
}
