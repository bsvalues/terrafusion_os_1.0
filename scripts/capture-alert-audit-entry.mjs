#!/usr/bin/env node
/**
 * TerraFusion OS — Alert Audit Entry Capture
 *
 * Captures paging alert evidence for Validation Criterion #4 (Alert FP audit).
 * Enforces sequential alert ID tracking (#001-100, no skipping).
 *
 * Usage:
 *   node scripts/capture-alert-audit-entry.mjs --id 001 --classification TP --reason "API pod crashed" --action "None"
 *   node scripts/capture-alert-audit-entry.mjs --id 002 --classification FP --reason "Batch job spike" --action "Exclude scheduled window"
 *
 * @classification Government Operations — FISMA-HIGH
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== Configuration =====

const CONFIG = {
  evidenceDir: path.join(__dirname, '../docs/deploy/rehearsals/evidence/alerts'),
  auditLogPath: path.join(__dirname, '../docs/ops/alerts-noise-audit.md'),
};

// ===== CLI Arguments =====

function parseArgs() {
  const args = process.argv.slice(2);

  const id = args.find(arg => arg.startsWith('--id'))?.split('=')[1];
  const classification = args.find(arg => arg.startsWith('--classification'))?.split('=')[1];
  const reason = args.find(arg => arg.startsWith('--reason'))?.split('=')[1];
  const action = args.find(arg => arg.startsWith('--action'))?.split('=')[1];

  // Validation
  if (!id || !/^[0-9]{3}$/.test(id)) {
    console.error('❌ Error: --id must be 001-100 format');
    process.exit(1);
  }

  if (!classification || !['TP', 'FP', 'Flapping', 'Out-of-SLA'].includes(classification)) {
    console.error('❌ Error: --classification must be TP, FP, Flapping, or Out-of-SLA');
    process.exit(1);
  }

  if (!reason) {
    console.error('❌ Error: --reason required (description of alert)');
    process.exit(1);
  }

  if (!action) {
    console.error('❌ Error: --action required (tuning action taken, or "None")');
    process.exit(1);
  }

  return {
    id,
    classification,
    reason: reason.replace(/"/g, ''),
    action: action.replace(/"/g, ''),
  };
}

// ===== Evidence Capture =====

async function createEvidencePlaceholders(id) {
  console.log(`📋 Creating evidence placeholders for Alert #${id}...`);

  const payloadPath = path.join(CONFIG.evidenceDir, `alert-${id}-payload.json`);
  const tracePath = path.join(CONFIG.evidenceDir, `alert-${id}-trace.json`);
  const ticketPath = path.join(CONFIG.evidenceDir, `alert-${id}-ticket.md`);

  // Alert payload placeholder
  const payloadTemplate = {
    alert_id: id,
    timestamp: new Date().toISOString(),
    alert_name: 'FILL_ALERT_NAME',
    severity: 'FILL_SEVERITY',
    labels: {},
    annotations: {
      summary: 'FILL_SUMMARY',
      description: 'FILL_DESCRIPTION',
    },
    state: 'firing',
    acknowledged_at: null,
    resolved_at: null,
    _note: 'MANUAL FILL REQUIRED: Replace placeholder values with actual alert data',
  };

  await fs.writeFile(payloadPath, JSON.stringify(payloadTemplate, null, 2), 'utf-8');
  console.log(`   → ${payloadPath}`);

  // Trace placeholder
  const traceTemplate = {
    trace_id: 'FILL_TRACE_ID',
    spans: [],
    _note: 'MANUAL FILL REQUIRED: Export trace from Jaeger or provide trace link',
  };

  await fs.writeFile(tracePath, JSON.stringify(traceTemplate, null, 2), 'utf-8');
  console.log(`   → ${tracePath}`);

  // Ticket placeholder
  const ticketTemplate = `# Alert #${id}

**Classification:** FILL_CLASSIFICATION

**Incident Ticket:** FILL_TICKET_URL

**Summary:** FILL_INCIDENT_SUMMARY

**Resolution:** FILL_RESOLUTION_NOTES
`;

  await fs.writeFile(ticketPath, ticketTemplate, 'utf-8');
  console.log(`   → ${ticketPath}`);

  return { payloadPath, tracePath, ticketPath };
}

async function checkSequentialOrder(id) {
  const auditLog = await fs.readFile(CONFIG.auditLogPath, 'utf-8');
  const lines = auditLog.split('\n');

  // Find all existing alert IDs
  const existingIds = [];
  for (const line of lines) {
    const match = line.match(/^\| (\d{3}) \|/);
    if (match) {
      existingIds.push(match[1]);
    }
  }

  const expectedNext =
    existingIds.length > 0
      ? String(parseInt(existingIds[existingIds.length - 1]) + 1).padStart(3, '0')
      : '001';

  if (id !== expectedNext) {
    console.error(`\n❌ SEQUENTIAL ORDER VIOLATION`);
    console.error(`   Expected next ID: ${expectedNext}`);
    console.error(`   Provided ID: ${id}`);
    console.error(`\n   Alert audit must be sequential (#001 → #100, no skipping).`);
    console.error(`   This is a governance requirement (no cherry-picking).`);
    process.exit(1);
  }

  console.log(`   ✅ Sequential order check: ${id} is next in sequence`);
}

async function appendAuditLogEntry(id, classification, reason, action) {
  console.log(`📝 Appending entry to alert audit log...`);

  const auditLog = await fs.readFile(CONFIG.auditLogPath, 'utf-8');
  const lines = auditLog.split('\n');

  // Build table row
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toISOString().split('T')[1].split('.')[0];
  const entry = `| ${id} | ${date} | ${time} | FILL_ALERT_NAME | FILL_SEVERITY | XXs | ${classification} | ${reason} | ${action} |`;

  // Find insertion point (Week 3 or Week 4 table)
  const week3TableIndex = lines.findIndex(line => line.includes('### Week 3:'));
  const week4TableIndex = lines.findIndex(line => line.includes('### Week 4:'));

  const alertNum = parseInt(id);
  const insertIndex = alertNum <= 50 ? week3TableIndex + 5 : week4TableIndex + 5;

  if (insertIndex < 5) {
    console.error(`   ❌ Could not find table insertion point in audit log`);
    process.exit(1);
  }

  // Find actual insertion point (after | 001 | line or last filled line)
  let actualInsertIndex = insertIndex;
  for (let i = insertIndex; i < lines.length; i++) {
    if (lines[i].match(/^\| \d{3} \|/) && !lines[i].includes('FILL_ALERT_NAME')) {
      actualInsertIndex = i + 1;
    } else if (lines[i].trim() === '') {
      break;
    }
  }

  lines.splice(actualInsertIndex, 0, entry);

  await fs.writeFile(CONFIG.auditLogPath, lines.join('\n'), 'utf-8');
  console.log(`   ✅ Entry appended`);
}

// ===== Main Execution =====

async function main() {
  const { id, classification, reason, action } = parseArgs();

  console.log(`\n🚨 TerraFusion OS — Alert Audit Entry Capture (#${id})\n`);

  // Ensure evidence directory exists
  await fs.mkdir(CONFIG.evidenceDir, { recursive: true });

  // Check sequential order
  await checkSequentialOrder(id);

  // Create evidence placeholders
  const evidencePaths = await createEvidencePlaceholders(id);

  // Append audit log entry
  await appendAuditLogEntry(id, classification, reason, action);

  console.log(`\n✅ Alert #${id} entry captured\n`);
  console.log(`Next steps:`);
  console.log(`  1. Fill evidence placeholders with actual alert data:`);
  console.log(`     - alert-${id}-payload.json (from Alertmanager)`);
  console.log(`     - alert-${id}-trace.json (from Jaeger/Zipkin)`);
  console.log(`     - alert-${id}-ticket.md (incident ticket link/summary)`);
  console.log(`  2. Commit evidence:`);
  console.log(`     git add docs/deploy/rehearsals/evidence/alerts/alert-${id}-*`);
  console.log(`     git add docs/ops/alerts-noise-audit.md`);
  console.log(
    `     git commit -m "ops(telemetry): capture Alert #${id} evidence (${classification})"`
  );
  console.log(``);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
