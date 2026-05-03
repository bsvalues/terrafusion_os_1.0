#!/usr/bin/env node
/**
 * CostForge Rearchitecture Tracker CLI
 * 
 * Usage:
 *   node tracker.mjs status           # Show all tasks and progress
 *   node tracker.mjs phase P0         # Show tasks in phase P0
 *   node tracker.mjs start P0-01      # Mark task as in-progress
 *   node tracker.mjs done P0-01       # Mark task as done
 *   node tracker.mjs block P0-01      # Mark task as blocked
 *   node tracker.mjs verify P0-01     # Show verification criteria
 *   node tracker.mjs next             # Show next actionable task
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TRACKER_PATH = join(__dirname, 'AMPUTATION_TRACKER.json');

function load() {
  return JSON.parse(readFileSync(TRACKER_PATH, 'utf-8'));
}

function save(data) {
  writeFileSync(TRACKER_PATH, JSON.stringify(data, null, 2));
}

function allTasks(data) {
  return data.phases.flatMap(p => p.tasks.map(t => ({ ...t, phase: p.id, phaseName: p.name })));
}

function colorStatus(s) {
  const colors = { 'not-started': '\x1b[90m', 'in-progress': '\x1b[33m', 'done': '\x1b[32m', 'blocked': '\x1b[31m', 'deferred': '\x1b[36m' };
  return `${colors[s] || ''}${s}\x1b[0m`;
}

function colorSev(s) {
  const colors = { critical: '\x1b[31m', high: '\x1b[33m', medium: '\x1b[36m', low: '\x1b[90m' };
  return `${colors[s] || ''}${s}\x1b[0m`;
}

function showStatus(data) {
  const tasks = allTasks(data);
  const done = tasks.filter(t => t.status === 'done').length;
  const inProg = tasks.filter(t => t.status === 'in-progress').length;
  const blocked = tasks.filter(t => t.status === 'blocked').length;
  const total = tasks.length;

  console.log(`\n  CostForge Rearchitecture Progress: ${done}/${total} done (${Math.round(done/total*100)}%)`);
  console.log(`  In-progress: ${inProg} | Blocked: ${blocked}\n`);

  for (const phase of data.phases) {
    const pDone = phase.tasks.filter(t => t.status === 'done').length;
    console.log(`  ═══ ${phase.id}: ${phase.name} (${pDone}/${phase.tasks.length}) ═══`);
    for (const t of phase.tasks) {
      const icon = t.status === 'done' ? '✅' : t.status === 'in-progress' ? '🔧' : t.status === 'blocked' ? '🚫' : '⬜';
      console.log(`    ${icon} ${t.id} [${colorSev(t.severity)}] ${t.title} — ${colorStatus(t.status)}`);
    }
    console.log();
  }
}

function showPhase(data, phaseId) {
  const phase = data.phases.find(p => p.id === phaseId);
  if (!phase) { console.error(`Phase ${phaseId} not found`); process.exit(1); }
  console.log(`\n  ═══ ${phase.id}: ${phase.name} ═══`);
  console.log(`  ${phase.rationale}\n`);
  for (const t of phase.tasks) {
    const icon = t.status === 'done' ? '✅' : t.status === 'in-progress' ? '🔧' : t.status === 'blocked' ? '🚫' : '⬜';
    console.log(`  ${icon} ${t.id} [${colorSev(t.severity)}] ${t.title}`);
    console.log(`     ${t.detail.substring(0, 120)}${t.detail.length > 120 ? '...' : ''}`);
    if (t.dependsOn) console.log(`     depends: ${t.dependsOn.join(', ')}`);
    console.log(`     verify: ${t.verify}`);
    console.log();
  }
}

function updateTask(data, taskId, newStatus) {
  for (const phase of data.phases) {
    const task = phase.tasks.find(t => t.id === taskId);
    if (task) {
      const old = task.status;
      task.status = newStatus;
      task.updatedAt = new Date().toISOString();
      save(data);
      console.log(`  ${taskId}: ${old} → ${newStatus}`);
      return;
    }
  }
  console.error(`Task ${taskId} not found`);
  process.exit(1);
}

function showVerify(data, taskId) {
  for (const phase of data.phases) {
    const task = phase.tasks.find(t => t.id === taskId);
    if (task) {
      console.log(`\n  ${task.id}: ${task.title}`);
      console.log(`  Severity: ${task.severity}`);
      console.log(`  Status: ${task.status}`);
      console.log(`\n  Detail:\n  ${task.detail}\n`);
      console.log(`  Files:`);
      (task.files || []).forEach(f => console.log(`    - ${f}`));
      if (task.dependsOn) console.log(`\n  Depends on: ${task.dependsOn.join(', ')}`);
      console.log(`\n  Verification:\n  ${task.verify}\n`);
      return;
    }
  }
  console.error(`Task ${taskId} not found`);
}

function showNext(data) {
  const tasks = allTasks(data);
  const doneIds = new Set(tasks.filter(t => t.status === 'done').map(t => t.id));

  // Find first not-started task whose dependencies are all done
  for (const t of tasks) {
    if (t.status !== 'not-started') continue;
    const deps = t.dependsOn || [];
    if (deps.every(d => doneIds.has(d))) {
      console.log(`\n  Next task: ${t.id} [${t.severity}] ${t.title}`);
      console.log(`  Phase: ${t.phase} — ${t.phaseName}`);
      console.log(`  ${t.detail.substring(0, 200)}`);
      console.log(`  Verify: ${t.verify}\n`);
      return;
    }
  }
  console.log('  No actionable tasks found (all done or blocked by deps)');
}

// CLI
const [,, cmd, arg] = process.argv;
const data = load();

switch (cmd) {
  case 'status': showStatus(data); break;
  case 'phase': showPhase(data, arg); break;
  case 'start': updateTask(data, arg, 'in-progress'); break;
  case 'done': updateTask(data, arg, 'done'); break;
  case 'block': updateTask(data, arg, 'blocked'); break;
  case 'defer': updateTask(data, arg, 'deferred'); break;
  case 'verify': showVerify(data, arg); break;
  case 'next': showNext(data); break;
  default:
    console.log('Usage: node tracker.mjs [status|phase|start|done|block|verify|next] [id]');
}
