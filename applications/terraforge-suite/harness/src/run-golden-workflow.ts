import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { CostKernel } from './stubs/cost-kernel.js';
import { DefenseStudio } from './stubs/defense-studio.js';
import { ValuationKernel } from './stubs/valuation-kernel.js';

import { ModuleRunner } from './module-runner.js';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ajv = new Ajv();
addFormats(ajv);

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/golden_workflow');
const INPUT_SET_PATH = path.join(FIXTURES_DIR, 'input_set.json');
const SCHEMAS_DIR = path.resolve(__dirname, '../../contracts/schemas');
const MODULES_DIR = path.resolve(__dirname, '../../modules');
const REGISTRY_PATH = path.resolve(__dirname, '../../registry.json');

// Load Schemas for Validation
const schemas = {
  result: JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'valuation_result.json'), 'utf-8')),
  audit: JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'audit_event.json'), 'utf-8')),
  defense: JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'defense_packet.json'), 'utf-8')),
};

const validateResult = ajv.compile(schemas.result);
const validateAudit = ajv.compile(schemas.audit);
const validateDefense = ajv.compile(schemas.defense);

type ValuationResult = {
  totalValue: number;
  components: {
    land: number;
    building: number;
  };
};

async function runGoldenWorkflow() {
  const REPO_ROOT = path.resolve(__dirname, '../../../..');
  const fpFile = path.relative(REPO_ROOT, __filename).replace(/\\/g, '/');
  const fpCwd = path.relative(REPO_ROOT, process.cwd()).replace(/\\/g, '/');
  console.log(`GOLDEN_FINGERPRINT:: ${fpFile} CWD:: ${fpCwd}`);

  console.log('🚀 Starting Golden Workflow Slice (Hot-Swap Enabled)...');

  const auditLog: any[] = [];

  // 1. Load Input Data
  console.log(`📂 Loading input set from ${path.relative(process.cwd(), INPUT_SET_PATH)}...`);
  const inputSet = JSON.parse(fs.readFileSync(INPUT_SET_PATH, 'utf-8'));
  const subject = inputSet.parcels[0];
  const sale = inputSet.sales[0];
  const costFactors = inputSet.costFactors;
  const model = inputSet.model;

  console.log(`   - Parcel: ${subject.parcelId} (${subject.attributes.sqft} sqft)`);
  console.log(`   - Sale: ${sale.salePrice} (${sale.saleDate})`);

  // 2. Initialize Kernels
  const moduleRunner = new ModuleRunner(MODULES_DIR, REGISTRY_PATH);

  const testMode = process.env.TEST_MODE || 'steel';
  console.log(`ℹ️  Test Mode: ${testMode.toUpperCase()}`);

  // ============================================================
  // STEP A: Cost Kernel
  // ============================================================
  let costRes: any;
  if (testMode === 'stub') {
    const costKernel = new CostKernel();
    console.log('\n⚙️  Step A: Cost Kernel (STUB) -> Calculate RCN');
    costRes = await costKernel.handle({
      action: 'calculate_cost',
      payload: { subject, tables: costFactors },
    });
  } else {
    console.log('\n⚙️  Step A: Cost Kernel (STEEL) -> Calculate RCN (via Registry)');
    costRes = await moduleRunner.invoke('terraforge.kernel.cost', {
      action: 'calculate_cost',
      payload: { subject, tables: costFactors },
    });
  }

  if (!costRes.success) throw new Error(costRes.error);
  console.log(`   ✅ RCN: ${costRes.data.replacementCost}, Depr: ${costRes.data.depreciation}, RCNLD: ${costRes.data.rcnld}`);

  if (!validateAudit(costRes.auditEvent)) {
    console.error('❌ Invalid Audit Event from Cost Kernel', validateAudit.errors);
    process.exit(1);
  }
  auditLog.push(costRes.auditEvent);
  console.log('   ✅ Audit Event Validated');

  // ============================================================
  // STEP B: Valuation Kernel
  // ============================================================
  let valRes: any;
  if (testMode === 'stub') {
    console.log('\n⚙️  Step B: Valuation Kernel (STUB) -> Valuate');
    const valKernel = new ValuationKernel();
    valRes = await valKernel.handle({
      action: 'valuate',
      payload: {
        subject,
        costBreakdown: costRes.data,
        model,
      },
    });
  } else {
    console.log('\n⚙️  Step B: Valuation Kernel (STEEL) -> Valuate (via Registry)');
    valRes = await moduleRunner.invoke('terraforge.kernel.valuation', {
      action: 'valuate',
      payload: {
        subject,
        costBreakdown: costRes.data,
        model,
      },
    });
  }

  if (!valRes.success) throw new Error(valRes.error || 'Valuation failed');
  const result = valRes.data as ValuationResult;
  console.log(
    `   ✅ Total Value: ${result.totalValue} (Land: ${result.components.land}, Bldg: ${result.components.building})`
  );

  if (!validateResult(result)) {
    console.error('❌ Invalid Valuation Result', validateResult.errors);
    process.exit(1);
  }
  console.log('   ✅ Valuation Result Schema Validated');
  auditLog.push(valRes.auditEvent);

  // ============================================================
  // STEP C: Defense Studio
  // ============================================================
  console.log('\n⚙️  Step C: Defense Studio -> Generate Packet');

  // Defense Studio is stub-only for now (no Rust implementation yet)
  const defenseStudio = new DefenseStudio();
  const defenseRes = await defenseStudio.handle({
    action: 'generate_packet',
    payload: {
      parcelId: subject.parcelId,
      assessedValue: result.totalValue,
      salePrice: sale.salePrice,
      components: result.components,
    },
  });

  if (!defenseRes.success) throw new Error(defenseRes.error || 'Defense Studio failed');

  // Validate defense packet against schema
  if (!validateDefense(defenseRes.data)) {
    console.error('❌ Invalid Defense Packet', validateDefense.errors);
    process.exit(1);
  }
  console.log('   ✅ Defense Packet Schema Validated');

  console.log(`   ✅ Ratio: ${defenseRes.data!.ratio}`);
  console.log(`   ✅ Status: ${defenseRes.data!.status}`);
  console.log(`   ✅ Summary: ${defenseRes.data!.summary}`);
  auditLog.push(defenseRes.auditEvent);

  // ============================================================
  // FINAL REPORT
  // ============================================================
  console.log('\n📋 Golden Workflow Complete');
  console.log('---------------------------------------------------');
  console.log(`Events Logged: ${auditLog.length}`);
  console.log(`Final Value:   $${Math.round(result.totalValue).toLocaleString()}`);
  console.log(`Sale Price:    $${sale.salePrice.toLocaleString()}`);
  console.log(`Ratio:         ${defenseRes.data!.ratio}`);
  console.log(`Defense:       ${defenseRes.data!.status}`);

  // Determinism Check
  // Expected: 370,625
  const actualValue = Math.round(result.totalValue);
  const expectedValue = 370625;

  if (actualValue === expectedValue) {
    console.log(`✅ Determinism Check PASSED (${actualValue} = ${expectedValue})`);
  } else {
    console.error(`❌ Determinism Check FAILED. Expected ${expectedValue}, got ${actualValue}`);
    process.exit(1);
  }

  // Audit count check
  if (auditLog.length === 3) {
    console.log('✅ Audit Events: 3 events logged (cost, valuation, defense)');
  } else {
    console.error(`❌ Audit Events FAILED. Expected 3, got ${auditLog.length}`);
    process.exit(1);
  }

  console.log('✨ All Systems GREEN');
}

runGoldenWorkflow().catch(err => {
  console.error('💥 Workflow Failed:', err);
  process.exit(1);
});
