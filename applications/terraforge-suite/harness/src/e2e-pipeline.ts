/**
 * TerraForge E2E Pipeline Orchestrator
 *
 * Single-command proof that runs the full pipeline:
 *   cost (steel/stub) → valuation (steel/stub) → defense → audit → determinism
 *
 * Usage:
 *   TEST_MODE=steel npm run e2e:pipeline
 *   TEST_MODE=stub npm run e2e:pipeline
 *
 * Exits 0 on success, non-zero on failure.
 * Always writes artifacts to artifacts/e2e-pipeline/<timestamp>/
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { ModuleRunner } from './module-runner.js';
import { CostKernel } from './stubs/cost-kernel.js';
import { DefenseStudio } from './stubs/defense-studio.js';
import { ValuationKernel } from './stubs/valuation-kernel.js';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CONFIGURATION
// ============================================================

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/golden_workflow');
const INPUT_SET_PATH = path.join(FIXTURES_DIR, 'input_set.json');
const SCHEMAS_DIR = path.resolve(__dirname, '../../contracts/schemas');
const MODULES_DIR = path.resolve(__dirname, '../../modules');
const REGISTRY_PATH = path.resolve(__dirname, '../../registry.json');
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const ARTIFACTS_DIR = path.join(REPO_ROOT, 'artifacts', 'e2e-pipeline');

// Expected deterministic values
const EXPECTED_VALUES = {
  totalValue: 370625,
  land: 50000,
  building: 320625,
  rcn: 356250,
  depreciation: 35625,
  rcnld: 320625,
  ratio: 0.96,
  defenseStatus: 'OK' as const,
  auditEventCount: 3,
};

// ============================================================
// TYPES
// ============================================================

interface PipelineResult {
  success: boolean;
  mode: 'stub' | 'steel';
  timestamp: string;
  runId: string;
  duration: number;
  values: {
    totalValue: number;
    land: number;
    building: number;
    rcn: number;
    depreciation: number;
    rcnld: number;
    ratio: number;
    defenseStatus: string;
  };
  auditEventCount: number;
  checks: {
    costKernel: boolean;
    valuationKernel: boolean;
    defenseStudio: boolean;
    schemaValidation: boolean;
    determinism: boolean;
    auditEvents: boolean;
  };
  errors: string[];
  artifactPath: string;
}

interface AuditEvent {
  eventId: string;
  timestamp: string;
  actor: string;
  action: string;
  resourceId: string;
  module: string;
  hash: string;
}

// ============================================================
// MAIN ORCHESTRATOR
// ============================================================

export async function runE2EPipeline(options?: {
  mode?: 'stub' | 'steel';
  inputPath?: string;
  expectedValues?: Partial<typeof EXPECTED_VALUES>;
}): Promise<PipelineResult> {
  const startTime = Date.now();
  const mode = options?.mode || (process.env.TEST_MODE as 'stub' | 'steel') || 'steel';
  const inputPath = options?.inputPath || INPUT_SET_PATH;
  const expected = { ...EXPECTED_VALUES, ...options?.expectedValues };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runId = `${mode}-${timestamp}`;
  const artifactPath = path.join(ARTIFACTS_DIR, runId);

  // Initialize result
  const result: PipelineResult = {
    success: false,
    mode,
    timestamp: new Date().toISOString(),
    runId,
    duration: 0,
    values: {
      totalValue: 0,
      land: 0,
      building: 0,
      rcn: 0,
      depreciation: 0,
      rcnld: 0,
      ratio: 0,
      defenseStatus: '',
    },
    auditEventCount: 0,
    checks: {
      costKernel: false,
      valuationKernel: false,
      defenseStudio: false,
      schemaValidation: false,
      determinism: false,
      auditEvents: false,
    },
    errors: [],
    artifactPath,
  };

  const auditLog: AuditEvent[] = [];

  // Create artifact directory
  fs.mkdirSync(artifactPath, { recursive: true });

  // Setup schema validators
  const ajv = new Ajv();
  addFormats(ajv);

  const schemas = {
    result: JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'valuation_result.json'), 'utf-8')),
    audit: JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'audit_event.json'), 'utf-8')),
    defense: JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'defense_packet.json'), 'utf-8')),
  };

  const validateResult = ajv.compile(schemas.result);
  const validateAudit = ajv.compile(schemas.audit);
  const validateDefense = ajv.compile(schemas.defense);

  try {
    // ============================================================
    // STEP 0: Load Input Data
    // ============================================================
    console.log(`🚀 E2E Pipeline Starting (${mode.toUpperCase()} mode)`);
    console.log(`📂 Input: ${path.relative(process.cwd(), inputPath)}`);
    console.log(`📁 Artifacts: ${path.relative(process.cwd(), artifactPath)}`);

    const inputSet = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    const subject = inputSet.parcels[0];
    const sale = inputSet.sales[0];
    const costFactors = inputSet.costFactors;
    const model = inputSet.model;

    // Write input artifact
    fs.writeFileSync(path.join(artifactPath, 'input.json'), JSON.stringify(inputSet, null, 2));

    // ============================================================
    // STEP 1: Cost Kernel
    // ============================================================
    console.log('\n⚙️  Step 1/3: Cost Kernel');

    let costRes: any;
    if (mode === 'stub') {
      const costKernel = new CostKernel();
      costRes = await costKernel.handle({
        action: 'calculate_cost',
        payload: { subject, tables: costFactors },
      });
    } else {
      const moduleRunner = new ModuleRunner(MODULES_DIR, REGISTRY_PATH);
      costRes = await moduleRunner.invoke('terraforge.kernel.cost', {
        action: 'calculate_cost',
        payload: { subject, tables: costFactors },
      });
    }

    if (!costRes.success) {
      result.errors.push(`Cost kernel failed: ${costRes.error}`);
      throw new Error(costRes.error);
    }

    result.values.rcn = costRes.data.replacementCost;
    result.values.depreciation = costRes.data.depreciation;
    result.values.rcnld = costRes.data.rcnld;
    result.checks.costKernel = true;

    if (!validateAudit(costRes.auditEvent)) {
      result.errors.push(
        `Cost kernel audit event invalid: ${JSON.stringify(validateAudit.errors)}`
      );
    }
    auditLog.push(costRes.auditEvent);

    console.log(
      `   ✅ RCN=${costRes.data.replacementCost} Depr=${costRes.data.depreciation} RCNLD=${costRes.data.rcnld}`
    );

    // Write cost output artifact
    fs.writeFileSync(
      path.join(artifactPath, 'cost-output.json'),
      JSON.stringify(costRes.data, null, 2)
    );

    // ============================================================
    // STEP 2: Valuation Kernel
    // ============================================================
    console.log('\n⚙️  Step 2/3: Valuation Kernel');

    let valRes: any;
    if (mode === 'stub') {
      const valKernel = new ValuationKernel();
      valRes = await valKernel.handle({
        action: 'valuate',
        payload: { subject, costBreakdown: costRes.data, model },
      });
    } else {
      const moduleRunner = new ModuleRunner(MODULES_DIR, REGISTRY_PATH);
      valRes = await moduleRunner.invoke('terraforge.kernel.valuation', {
        action: 'valuate',
        payload: { subject, costBreakdown: costRes.data, model },
      });
    }

    if (!valRes.success) {
      result.errors.push(`Valuation kernel failed: ${valRes.error}`);
      throw new Error(valRes.error);
    }

    result.values.totalValue = valRes.data.totalValue;
    result.values.land = valRes.data.components.land;
    result.values.building = valRes.data.components.building;
    result.checks.valuationKernel = true;

    if (!validateResult(valRes.data)) {
      result.errors.push(`Valuation result invalid: ${JSON.stringify(validateResult.errors)}`);
    } else {
      result.checks.schemaValidation = true;
    }

    if (!validateAudit(valRes.auditEvent)) {
      result.errors.push(`Valuation audit event invalid: ${JSON.stringify(validateAudit.errors)}`);
    }
    auditLog.push(valRes.auditEvent);

    console.log(
      `   ✅ Total=${valRes.data.totalValue} Land=${valRes.data.components.land} Building=${valRes.data.components.building}`
    );

    // Write valuation output artifact
    fs.writeFileSync(
      path.join(artifactPath, 'valuation-output.json'),
      JSON.stringify(valRes.data, null, 2)
    );

    // ============================================================
    // STEP 3: Defense Studio
    // ============================================================
    console.log('\n⚙️  Step 3/3: Defense Studio');

    const defenseStudio = new DefenseStudio();
    const defenseRes = await defenseStudio.handle({
      action: 'generate_packet',
      payload: {
        parcelId: subject.parcelId,
        assessedValue: valRes.data.totalValue,
        salePrice: sale.salePrice,
        components: valRes.data.components,
      },
    });

    if (!defenseRes.success) {
      result.errors.push(`Defense studio failed: ${defenseRes.error}`);
      throw new Error(defenseRes.error);
    }

    result.values.ratio = defenseRes.data!.ratio;
    result.values.defenseStatus = defenseRes.data!.status;
    result.checks.defenseStudio = true;

    if (!validateDefense(defenseRes.data)) {
      result.errors.push(`Defense packet invalid: ${JSON.stringify(validateDefense.errors)}`);
      result.checks.schemaValidation = false;
    }

    if (!validateAudit(defenseRes.auditEvent)) {
      result.errors.push(`Defense audit event invalid: ${JSON.stringify(validateAudit.errors)}`);
    }
    auditLog.push(defenseRes.auditEvent!);

    console.log(`   ✅ Ratio=${defenseRes.data!.ratio} Status=${defenseRes.data!.status}`);

    // Write defense output artifact
    fs.writeFileSync(
      path.join(artifactPath, 'defense-output.json'),
      JSON.stringify(defenseRes.data, null, 2)
    );

    // ============================================================
    // VALIDATION: Determinism Check
    // ============================================================
    console.log('\n📋 Validation Checks');

    const actualTotal = Math.round(result.values.totalValue);
    if (actualTotal === expected.totalValue) {
      result.checks.determinism = true;
      console.log(`   ✅ Determinism: ${actualTotal} === ${expected.totalValue}`);
    } else {
      result.errors.push(
        `Determinism mismatch: expected ${expected.totalValue}, got ${actualTotal}`
      );
      console.log(`   ❌ Determinism: expected ${expected.totalValue}, got ${actualTotal}`);
    }

    // Audit event count check
    result.auditEventCount = auditLog.length;
    if (auditLog.length === expected.auditEventCount) {
      result.checks.auditEvents = true;
      console.log(`   ✅ Audit Events: ${auditLog.length} === ${expected.auditEventCount}`);
    } else {
      result.errors.push(
        `Audit count mismatch: expected ${expected.auditEventCount}, got ${auditLog.length}`
      );
      console.log(
        `   ❌ Audit Events: expected ${expected.auditEventCount}, got ${auditLog.length}`
      );
    }

    // Defense status check
    if (result.values.defenseStatus === expected.defenseStatus) {
      console.log(`   ✅ Defense Status: ${result.values.defenseStatus}`);
    } else {
      result.errors.push(
        `Defense status mismatch: expected ${expected.defenseStatus}, got ${result.values.defenseStatus}`
      );
      console.log(
        `   ❌ Defense Status: expected ${expected.defenseStatus}, got ${result.values.defenseStatus}`
      );
    }

    // ============================================================
    // FINAL RESULT
    // ============================================================
    result.success = Object.values(result.checks).every(Boolean) && result.errors.length === 0;
    result.duration = Date.now() - startTime;

    // Write audit log artifact
    fs.writeFileSync(path.join(artifactPath, 'audit-log.json'), JSON.stringify(auditLog, null, 2));

    // Write summary artifact
    fs.writeFileSync(path.join(artifactPath, 'summary.json'), JSON.stringify(result, null, 2));

    // Print final summary
    console.log('\n' + '═'.repeat(60));
    if (result.success) {
      console.log('✨ E2E PIPELINE: ALL SYSTEMS GREEN');
    } else {
      console.log('❌ E2E PIPELINE: FAILED');
      result.errors.forEach(err => console.log(`   • ${err}`));
    }
    console.log('═'.repeat(60));
    console.log(`Mode:       ${mode.toUpperCase()}`);
    console.log(`Duration:   ${result.duration}ms`);
    console.log(`Total:      $${result.values.totalValue.toLocaleString()}`);
    console.log(`Ratio:      ${result.values.ratio}`);
    console.log(`Status:     ${result.values.defenseStatus}`);
    console.log(`Artifacts:  ${path.relative(process.cwd(), artifactPath)}`);
    console.log('═'.repeat(60));

    // Machine-parseable single-line summary for CI log scanning
    const status = result.success ? 'GREEN' : 'RED';
    console.log(
      `E2E_PIPELINE_RESULT=${status} mode=${mode} totalValue=${result.values.totalValue} auditEvents=${result.auditEventCount} artifacts=${path.relative(process.cwd(), artifactPath)}`
    );

    return result;
  } catch (err) {
    result.duration = Date.now() - startTime;
    result.errors.push(`Pipeline exception: ${err instanceof Error ? err.message : String(err)}`);

    // Always write artifacts even on failure
    fs.writeFileSync(path.join(artifactPath, 'audit-log.json'), JSON.stringify(auditLog, null, 2));
    fs.writeFileSync(path.join(artifactPath, 'summary.json'), JSON.stringify(result, null, 2));

    console.log('\n' + '═'.repeat(60));
    console.log('💥 E2E PIPELINE: EXCEPTION');
    result.errors.forEach(err => console.log(`   • ${err}`));
    console.log('═'.repeat(60));

    // Machine-parseable single-line summary for CI log scanning
    console.log(
      `E2E_PIPELINE_RESULT=RED mode=${mode} totalValue=${result.values.totalValue} auditEvents=${result.auditEventCount} artifacts=${path.relative(process.cwd(), artifactPath)}`
    );

    return result;
  }
}

// ============================================================
// CLI ENTRY POINT
// ============================================================

async function main() {
  const result = await runE2EPipeline();
  process.exit(result.success ? 0 : 1);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}
