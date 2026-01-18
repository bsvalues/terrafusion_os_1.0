import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const CONFIG = {
  reportPath: path.resolve('DEPENDENCY_SCOPE_REPORT.md'),
  fullInventoryPath: path.resolve('DEPENDENCY_SCOPE_QUARANTINE.json'),
  inventoryPath: path.resolve('dependency-scope-quarantine.json'),
  logPath: path.resolve('ci_dependency_scope_quarantine.log'),
  baselinePath: path.resolve('scripts/governance/dependency-scope-quarantine-baseline.json'),
  budgetPath: path.resolve('scripts/governance/dependency-scope-quarantine-budget.json'),
  promotionsDir: path.resolve('scripts/governance/promotions'),
};

/**
 * Loads valid promotions from JSON files in the promotions directory.
 */
function loadPromotions() {
  const promotions = {};
  if (!fs.existsSync(CONFIG.promotionsDir)) return promotions;

  const files = fs
    .readdirSync(CONFIG.promotionsDir)
    .filter(f => f.endsWith('.json'))
    .sort();
  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(CONFIG.promotionsDir, file), 'utf8'));
      if (content.promotions && Array.isArray(content.promotions)) {
        for (const promo of content.promotions) {
          if (promo.package && promo.target) {
            promotions[promo.package] = promo.target;
          }
        }
      }
    } catch (e) {
      console.warn(`[Warning] Failed to load promotions from ${file}: ${e.message}`);
    }
  }
  return promotions;
}

/**
 * Parses the DEPENDENCY_SCOPE_REPORT.md content.
 * @param {string} content
 * @returns {{ totals: Record<string, number>, samples: Array<any>, truncationDetected: boolean }}
 */
export function parseReport(content) {
  const promotions = loadPromotions();
  console.log(`[Quarantine] Loaded ${Object.keys(promotions).length} promotion rules.`);

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
        const pkgName = match[1];
        let bucket = match[2];

        // Apply Promotion Rule
        if (promotions[pkgName]) {
          bucket = promotions[pkgName];
        }

        samples.push({
          package: pkgName,
          bucket: bucket,
          localUsage: parseInt(match[3], 10),
          totalUsage: parseInt(match[4], 10),
          wiring: match[5],
        });
      }
    }
  }

  // Completeness Check (Fail-Closed)
  const officialQuarantineCount = totals['QUARANTINE'] || 0;
  // Count how many samples were originally QUARANTINE before promotion logic
  // Actually, we should check against the samples parsed.
  // The samples section lists specific items that were flagged.
  // Ideally, total samples found should match official totals if the report is complete.

  // Note: The Markdown report truncates "Top Evidence Samples" to 20 items.
  // If totals['QUARANTINE'] > samples.length, we define this as TRUNCATED.
  const truncationDetected = (totals['QUARANTINE'] || 0) > samples.length;

  if (truncationDetected) {
    console.warn(
      `[Quarantine] TRUNCATION DETECTED: Report claims ${totals['QUARANTINE']} items but only provided ${samples.length} samples. Governance is incomplete.`
    );
  }

  // Recalculate totals based on active buckets (since promotions override original report totals)
  const newTotals = {};
  samples.forEach(s => {
    newTotals[s.bucket] = (newTotals[s.bucket] || 0) + 1;
  });

  return { totals: newTotals, samples, truncationDetected };
}

/**
 * Processes the full inventory data from JSON, applying promotions.
 * @param {Array<any>} fullData
 * @param {Record<string, string>} promotions
 */
export function processFullInventory(fullData, promotions) {
  const samples = fullData.map(item => {
    const pkgName = item.root;
    let bucket = item.bucket;

    // Apply Promotion Rule
    if (promotions[pkgName]) {
      bucket = promotions[pkgName];
    }

    return {
      package: pkgName,
      bucket: bucket,
      localUsage: item.evidence?.scoreLocal || 0,
      totalUsage: item.evidence?.scoreTotal || 0,
      wiring: item.evidence?.wiring?.join(',') || 'none',
    };
  });

  // Filter for QUARANTINE
  const quarantineItems = samples.filter(s => s.bucket === 'QUARANTINE');

  return {
    source: 'full_json',
    samples: samples,
    quarantineItems: quarantineItems,
    quarantineCount: quarantineItems.length,
  };
}

/**
 * Loads inventory from the full JSON source if available.
 */
function loadFullInventory() {
  if (!fs.existsSync(CONFIG.fullInventoryPath)) return null;

  console.log(`[Quarantine] Reading full inventory from ${CONFIG.fullInventoryPath}...`);
  try {
    const fullData = JSON.parse(fs.readFileSync(CONFIG.fullInventoryPath, 'utf8'));
    const promotions = loadPromotions();
    return processFullInventory(fullData, promotions);
  } catch (e) {
    console.error(`[Error] Failed to parse full inventory JSON: ${e.message}`);
    return null;
  }
}

/**
 * Checks the gate status against baseline and budget.
 */
export const checkGate = (quarantineCount, baseline, budget) => {
  const diff = quarantineCount - baseline.quarantineCount;
  if (diff > budget.maxNewQuarantineItems) {
    return {
      pass: false,
      message: `Quarantine count increased by ${diff} (Current: ${quarantineCount}, Baseline: ${baseline.quarantineCount}). Max allowed increase: ${budget.maxNewQuarantineItems}`,
    };
  }

  // If drift is disallowed, we specifically want to catch DECREASES (Ratchet) to ensure we lock in improvements.
  // Increases within budget (checked above) are permitted even if drift is false.
  if (budget.allowDrift === false && diff < 0) {
    return {
      pass: false,
      message: `Quarantine drift detected. Count decreased from ${baseline.quarantineCount} to ${quarantineCount}. Please update baseline to lock in improvement.`,
    };
  }
  return { pass: true };
};

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

    // 1. Try Loading Full Inventory first (Preferred)
    let quarantineItems = [];
    let quarantineCount = 0;

    const fullInventory = loadFullInventory();

    if (fullInventory) {
      quarantineItems = fullInventory.quarantineItems;
      quarantineCount = fullInventory.quarantineCount;
      console.log(`[Quarantine] Using full JSON inventory source. Total items: ${quarantineCount}`);
    } else {
      // 2. Fallback to Markdown Report (Legacy/Partial)
      if (!fs.existsSync(CONFIG.reportPath)) {
        console.error(
          `[Error] Report not found at ${CONFIG.reportPath}. Run 'npm run ci:renovate-scope' first.`
        );
        process.exit(1);
      }

      console.log(`[Quarantine] Reading report from ${CONFIG.reportPath}...`);
      const content = fs.readFileSync(CONFIG.reportPath, 'utf8');
      const result = parseReport(content);

      // FAIL CLOSED if truncation is detected in fallback mode
      if (result.truncationDetected) {
        console.error(
          `[Error] GOVERNANCE FAILURE: Markdown report is truncated (Totals > Samples). Cannot govern safely. Please provide ${CONFIG.fullInventoryPath}.`
        );
        process.exit(1);
      }

      // Filter for QUARANTINE items
      quarantineItems = result.samples.filter(s => s.bucket === 'QUARANTINE');
      quarantineCount = result.totals['QUARANTINE'] || 0;
    }

    // Sort for deterministic hashing
    quarantineItems.sort((a, b) => a.package.localeCompare(b.package));

    const inventory = {
      generatedAt: new Date().toISOString(),
      source: fullInventory ? 'full_json' : 'markdown_report',
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

    // Execute Gate Check
    if (isGate) {
      console.log(`[Gate] Checking against baseline...`);
      const result = checkGate(quarantineCount, baseline, budget);
      if (!result.pass) {
        console.error(`[Gate] FAILED: ${result.message}`);
        process.exit(1);
      }
      console.log(`[Gate] PASSED.`);
    }
  } catch (e) {
    console.error('Fatal Error:', e);
    process.exit(1);
  }
}
