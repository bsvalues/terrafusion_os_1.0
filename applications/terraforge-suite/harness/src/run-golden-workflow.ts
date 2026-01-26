import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { v4 as uuidv4 } from 'uuid';
import { CostKernel } from './stubs/cost-kernel.js';
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
};

const validateResult = ajv.compile(schemas.result);
const validateAudit = ajv.compile(schemas.audit);

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
  // const defenseStudio = new DefenseStudio();

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
  // We instantiate ModuleRunner to handle dynamic invocation
  const moduleRunner = new ModuleRunner(MODULES_DIR, REGISTRY_PATH);

  const testMode = process.env.TEST_MODE || 'steel';
  console.log(`ℹ️  Test Mode: ${testMode.toUpperCase()}`);

  // Legacy/Hybrid: Some modules still fake, some real
  // Cost Kernel: Stub or Steel?
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
  console.log(`   ✅ RCN: ${costRes.data.replacementCost}, Depr: ${costRes.data.depreciation}`);

  // Validate Audit Event
  // Note: Rust module returns snake_case audit keys if not configured carefully,
  // but we used #[serde(rename_all = "camelCase")] so it should match schema.
  if (!validateAudit(costRes.auditEvent)) {
    console.error('❌ Invalid Audit Event from Cost Kernel', validateAudit.errors);
    process.exit(1);
  }
  auditLog.push(costRes.auditEvent);
  console.log('   ✅ Audit Event Validated');

  // 4. Step B: Valuation Kernel (Final Value) -> NOW VIRTUALIZED
  let valRes: any;
  if (testMode === 'stub') {
    console.log('\n⚙️  Step B: Valuation Kernel -> Valuate (via STUB for test speed)');
    // Call via Stub instead of ModuleRunner
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
    console.log('\n⚙️  Step B: Valuation Kernel -> Valuate (via Registry)');
    // In a real scenario, this would call moduleRunner.invoke for Valuation too.
    // For now, if "steel" mode is requested but Valuation isn't executable-ready,
    // we might fallback or throw. The instructions say:
    // "Make Valuation truly stub vs steel... valRes = await moduleRunner.invoke..."
    // Assuming Valuation IS configured in registry for standard invocation (even if it points to a stub wrapper or if we want to simulate it).
    // However, based on the previous code, it WAS calling moduleRunner.invoke. Let's restore that for the 'else' block.
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

  // Validate Result against Schema
  if (!validateResult(result)) {
    console.error('❌ Invalid Valuation Result', validateResult.errors);
    process.exit(1);
  }
  console.log('   ✅ Valuation Result Schema Validated');
  auditLog.push(valRes.auditEvent);

  // 5. Step C: Defense Studio (Generate Packet Stub)
  console.log('\n⚙️  Step C: Defense Studio -> Generate Packet');

  // Inline stub for Defense Studio
  const defenseRes = {
    success: true,
    data: {
      summary: `Valuation of ${result.totalValue} vs Sale ${sale.salePrice}. Ratio: ${(result.totalValue / sale.salePrice).toFixed(2)}`,
      status: result.totalValue / sale.salePrice < 0.9 ? 'Review Required' : 'OK',
    },
    auditEvent: {
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      actor: 'system',
      action: 'generate_packet',
      resourceId: subject.parcelId,
      module: 'terraforge.studio.defense',
      hash: 'stub-hash-defense-123',
    },
  };

  if (!defenseRes.success) throw new Error('Defense Studio failed');
  console.log(`   ✅ Packet Summary: ${defenseRes.data.summary}`);
  console.log(`   ✅ Analysis: ${defenseRes.data.status}`);
  auditLog.push(defenseRes.auditEvent);

  // 6. Final Report
  console.log('\n📋 Golden Workflow Complete');
  console.log('---------------------------------------------------');
  console.log(`Events Logged: ${auditLog.length}`);
  const resultAny = result as any;
  console.log(`Final Value:   $${resultAny.totalValue.toLocaleString()}`);
  console.log(`Sale Price:    $${sale.salePrice.toLocaleString()}`);

  // Simple Determinism Check
  // 2500 * 150 = 375,000 * 0.95 = 356,250
  // Depr 10% = 35,625 -> 320,625
  // Land 50,000 + 320,625 = 370,625

  const actualValue = resultAny.totalValue;

  if (actualValue === 370625) {
    console.log('✅ Determinism Check PASSED');
  } else {
    console.error(`❌ Determinism Check FAILED. Expected 370,625, got ${actualValue}`);
    process.exit(1);
  }

  console.log('✨ All Systems GREEN');
}

runGoldenWorkflow().catch(err => {
  console.error('💥 Workflow Failed:', err);
  process.exit(1);
});
