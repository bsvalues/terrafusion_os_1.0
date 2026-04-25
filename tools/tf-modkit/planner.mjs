/**
 * tf-modkit — Conversion Planner
 * ================================
 * Generates a conversion plan from a scan report.
 * Read-only — outputs a plan object, never modifies files.
 */

/**
 * Generate a conversion plan from a scan report.
 * @param {object} report - Output from scanPackage()
 * @returns {object} Conversion plan with phases and tasks
 */
export function generatePlan(report) {
  const plan = {
    package: report.name,
    identity: report.identity,
    classification: report.classification,
    phases: [],
    totalTasks: 0,
    estimatedEffort: 'unknown',
    securityBlockers: [],
  };

  // --- Security blockers (must fix BEFORE conversion) ---
  for (const secret of report.secrets) {
    plan.securityBlockers.push({
      severity: 'critical',
      action: `Rotate ${secret.type} in ${secret.file}`,
      detail: 'Credential is in git history. Rotate the key/token, then delete the file.',
    });
  }
  if (report.issues.some(i => i.code === 'COMMITTED_COOKIES')) {
    plan.securityBlockers.push({
      severity: 'high',
      action: 'Delete cookies.txt',
      detail: 'Session cookies committed to repo.',
    });
  }

  if (report.classification === 'clean') {
    plan.estimatedEffort = 'none';
    return plan;
  }

  // --- P0: Amputation ---
  const p0 = { id: 'P0', name: 'AMPUTATION — Remove Dead Code', tasks: [] };

  // Server deletion
  if (report.serverFiles.count > 0) {
    p0.tasks.push({
      id: 'P0-DEL-SERVER',
      title: `Delete server/ directory (${report.serverFiles.count} files, ${report.serverFiles.lines.toLocaleString()} lines)`,
      severity: 'critical',
      action: 'delete-dir',
      target: 'server/',
      preCheck: 'Verify no Rust kernels or live code exists in server/ before deletion',
    });
  }

  // Schema deletion
  for (const schema of report.schemaFiles) {
    p0.tasks.push({
      id: `P0-DEL-SCHEMA-${schema.replace(/[/.]/g, '-')}`,
      title: `Delete dead Drizzle schema: ${schema}`,
      severity: 'high',
      action: 'delete-file',
      target: schema,
    });
  }

  // Auth file deletion
  if (report.authFiles.dead.length > 0) {
    p0.tasks.push({
      id: 'P0-DEL-AUTH',
      title: `Delete ${report.authFiles.dead.length} dead auth files`,
      severity: 'high',
      action: 'delete-files',
      targets: report.authFiles.dead,
      preCheck: 'Rewire all auth consumers to OsContext first',
    });
  }

  // Replit artifacts
  if (report.replitArtifacts.length > 0) {
    p0.tasks.push({
      id: 'P0-DEL-REPLIT',
      title: `Delete Replit artifacts: ${report.replitArtifacts.join(', ')}`,
      severity: 'medium',
      action: 'delete-files',
      targets: report.replitArtifacts,
    });
  }

  // Standalone artifacts
  if (report.standaloneArtifacts.length > 0) {
    p0.tasks.push({
      id: 'P0-DEL-STANDALONE',
      title: `Delete standalone project artifacts: ${report.standaloneArtifacts.join(', ')}`,
      severity: 'medium',
      action: 'delete-files-or-dirs',
      targets: report.standaloneArtifacts,
    });
  }

  // Electron artifacts
  if (report.electronArtifacts.length > 0) {
    p0.tasks.push({
      id: 'P0-DEL-ELECTRON',
      title: `Delete Electron wrapper: ${report.electronArtifacts.join(', ')}`,
      severity: 'medium',
      action: 'delete-files',
      targets: report.electronArtifacts,
    });
  }

  // Launcher scripts
  if (report.launcherArtifacts.length > 0) {
    p0.tasks.push({
      id: 'P0-DEL-LAUNCHERS',
      title: `Delete launcher scripts: ${report.launcherArtifacts.join(', ')}`,
      severity: 'low',
      action: 'delete-files',
      targets: report.launcherArtifacts,
    });
  }

  // Python dead backends
  if (report.pythonFiles.length > 0) {
    p0.tasks.push({
      id: 'P0-DEL-PYTHON',
      title: `Remove dead Python backend: ${report.pythonFiles.join(', ')}`,
      severity: 'high',
      action: 'delete-files-or-dirs',
      targets: report.pythonFiles,
      preCheck: 'Verify no live Python data processing (ML models, WASM) before deletion',
    });
  }

  // env files with secrets
  for (const ef of report.envFiles) {
    if (!ef.includes('example') && !ef.includes('template')) {
      p0.tasks.push({
        id: `P0-DEL-ENV-${ef.replace(/[/.]/g, '-')}`,
        title: `Delete ${ef} (should not be committed)`,
        severity: 'high', 
        action: 'delete-file',
        target: ef,
      });
    }
  }

  // attached_assets triage
  if (report.attachedAssets.exists) {
    p0.tasks.push({
      id: 'P0-TRIAGE-ASSETS',
      title: `Triage attached_assets/ (${report.attachedAssets.count} files) — review before deletion`,
      severity: 'low',
      action: 'manual-review',
      target: 'attached_assets/',
      note: 'Some may be valuable reference docs (PDFs, SQL). DO NOT auto-delete.',
    });
  }

  if (p0.tasks.length > 0) plan.phases.push(p0);

  // --- P1: Dependencies ---
  const p1 = { id: 'P1', name: 'DEPENDENCIES — Clean package.json', tasks: [] };

  if (report.deadDeps.length > 0) {
    p1.tasks.push({
      id: 'P1-GUT-DEPS',
      title: `Remove ${report.deadDeps.length} dead dependencies`,
      severity: 'critical',
      action: 'remove-deps',
      targets: report.deadDeps,
      verify: 'pnpm install succeeds, no import errors',
    });
  }

  // Fix scripts
  const hasDeadScripts = report.serverPattern && report.serverPattern !== 'none';
  if (hasDeadScripts) {
    p1.tasks.push({
      id: 'P1-FIX-SCRIPTS',
      title: 'Fix package.json scripts (remove server references)',
      severity: 'high',
      action: 'edit-scripts',
      detail: 'Remove dev:server, build:server, db:push, start (Express). Keep dev → vite.',
    });
  }

  // Fix name
  if (report.packageJsonName === 'rest-express') {
    p1.tasks.push({
      id: 'P1-FIX-NAME',
      title: `Rename package from "rest-express" to "${report.identity}"`,
      severity: 'medium',
      action: 'edit-field',
      target: 'package.json',
      field: 'name',
      value: report.identity,
    });
  }

  if (p1.tasks.length > 0) plan.phases.push(p1);

  // --- P2: Wiring ---
  const p2 = { id: 'P2', name: 'WIRING — OS-Native Integration', tasks: [] };

  if (!report.hasOsContext) {
    p2.tasks.push({
      id: 'P2-INJECT-OSCONTEXT',
      title: 'Inject OsContext.tsx for OS-native auth',
      severity: 'critical',
      action: 'copy-file',
      source: 'packages/terrabuild/client/src/contexts/OsContext.tsx',
      detail: 'Copy from terrabuild (template package), adapt imports',
    });
  }

  if (report.authFiles.dead.length > 0) {
    p2.tasks.push({
      id: 'P2-REWIRE-AUTH',
      title: 'Rewire all auth consumers to OsContext',
      severity: 'high',
      action: 'manual-edit',
      detail: 'Replace useAuth/AuthProvider/ProtectedRoute imports with useOsContext()',
    });
  }

  if (report.schemaFiles.length > 0) {
    p2.tasks.push({
      id: 'P2-CREATE-TYPES',
      title: 'Create TS interfaces matching .NET DTOs',
      severity: 'high',
      action: 'create-file',
      target: 'client/src/types/api.ts',
      detail: 'Replace @shared/schema imports with TS interfaces that match .NET controller responses',
    });
  }

  if (p2.tasks.length > 0) plan.phases.push(p2);

  // --- P3: Verification ---
  const p3 = { id: 'P3', name: 'VERIFICATION — Post-Conversion Audit', tasks: [] };

  p3.tasks.push({
    id: 'P3-GREP-DEAD',
    title: 'Grep audit — no dead references remain',
    severity: 'high',
    action: 'verify-grep',
    patterns: ['bcbs', 'replit', 'supabase', '@shared/schema', 'passport', 'express-session', 'drizzle', 'useAuth', 'AuthProvider'],
  });

  p3.tasks.push({
    id: 'P3-BUILD',
    title: 'Build verification',
    severity: 'critical',
    action: 'verify-build',
    detail: 'pnpm install + vite build (or next build) must succeed',
  });

  p3.tasks.push({
    id: 'P3-SNYK',
    title: 'Security scan (Snyk)',
    severity: 'high',
    action: 'verify-security',
    detail: 'Run Snyk scan — 0 new high/critical issues',
  });

  plan.phases.push(p3);

  // --- Totals ---
  plan.totalTasks = plan.phases.reduce((sum, p) => sum + p.tasks.length, 0);

  // Effort estimate
  const serverLines = report.serverFiles.lines;
  const deadDepCount = report.deadDeps.length;
  if (serverLines > 50000) plan.estimatedEffort = 'large';
  else if (serverLines > 10000 || deadDepCount > 30) plan.estimatedEffort = 'medium';
  else if (serverLines > 0 || deadDepCount > 5) plan.estimatedEffort = 'small';
  else plan.estimatedEffort = 'tiny';

  return plan;
}
