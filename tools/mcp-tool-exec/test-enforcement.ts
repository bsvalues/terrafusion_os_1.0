#!/usr/bin/env npx ts-node
/**
 * TerraFusion ToolRunner Enforcement Test
 *
 * Validates the 4 acceptance criteria:
 * 1. Happy path (read tool with permission)
 * 2. Permission denied (missing permission)
 * 3. Risk gate (missing confirmation token)
 * 4. Lane violation (mismatched write lane)
 */

import {
    ToolRegistry,
    ToolRunner,
    registerDefaultTools,
    type PilotContext,
    type ToolDefinition,
} from '@terrafusion/os-core';

// Register default tools
registerDefaultTools();

// Base context for tests
const baseContext: PilotContext = {
  userId: 'test-user-001',
  userRole: 'assessor',
  permissions: [],
  activeMode: 'pilot' as const,
  countyId: 'benton',
};

async function test1_HappyPath() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Happy path (read tool with permission)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const tool = ToolRegistry.get('atlas.parcel.read');
  if (!tool) throw new Error('Tool not found');

  const context: PilotContext = {
    ...baseContext,
    permissions: ['parcel:read'],
  };

  try {
    const { result } = await ToolRunner.execute(tool, { parcelId: 'P-001' }, context);
    console.log('\n✅ TEST 1 PASSED: Tool executed successfully');
    console.log('   Result:', JSON.stringify(result, null, 2));
    return true;
  } catch (err) {
    console.error('\n❌ TEST 1 FAILED:', (err as Error).message);
    return false;
  }
}

async function test2_PermissionDenied() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Permission denied (missing parcel:read)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const tool = ToolRegistry.get('atlas.parcel.read');
  if (!tool) throw new Error('Tool not found');

  const context: PilotContext = {
    ...baseContext,
    permissions: [], // No permissions!
  };

  try {
    await ToolRunner.execute(tool, { parcelId: 'P-001' }, context);
    console.error('\n❌ TEST 2 FAILED: Should have thrown permission denied');
    return false;
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('Permission Denied')) {
      console.log('\n✅ TEST 2 PASSED: Correctly threw permission denied');
      console.log('   Error:', msg);
      return true;
    }
    console.error('\n❌ TEST 2 FAILED: Wrong error:', msg);
    return false;
  }
}

async function test3_RiskGate() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Risk gate (forge.valuation.commit without token)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const tool = ToolRegistry.get('forge.valuation.commit');
  if (!tool) throw new Error('Tool not found');

  // Use correct permission so we pass RBAC and hit the risk gate
  const context: PilotContext = {
    ...baseContext,
    permissions: ['valuation:commit'],
  };

  try {
    // No _confirmationToken!
    await ToolRunner.execute(tool, { valuationId: 'V-001' }, context);
    console.error('\n❌ TEST 3 FAILED: Should have thrown risk gate error');
    return false;
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('Risk Gate')) {
      console.log('\n✅ TEST 3 PASSED: Correctly threw risk gate error');
      console.log('   Error:', msg);
      return true;
    }
    console.error('\n❌ TEST 3 FAILED: Wrong error:', msg);
    return false;
  }
}

async function test4_LaneViolation() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Lane violation (mismatched writeLane)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Create a tool with mismatched lane
  const badTool: ToolDefinition = {
    id: 'atlas.parcel.badwrite',
    suite: 'atlas', // suite is atlas
    writeLane: 'dais:workflow', // but lane is dais - MISMATCH!
    requiredPermissions: ['parcel:write'],
    risk: 'write_high',
    handler: async () => ({ ok: true }),
  };

  // Register temporarily
  ToolRegistry.register(badTool);

  const context: PilotContext = {
    ...baseContext,
    permissions: ['parcel:write'],
  };

  try {
    // Include token to pass risk gate
    await ToolRunner.execute(
      badTool,
      { parcelId: 'P-001', _confirmationToken: 'CONFIRM' },
      context
    );
    console.error('\n❌ TEST 4 FAILED: Should have thrown lane violation');
    return false;
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('Lane Violation')) {
      console.log('\n✅ TEST 4 PASSED: Correctly threw lane violation');
      console.log('   Error:', msg);
      return true;
    }
    console.error('\n❌ TEST 4 FAILED: Wrong error:', msg);
    return false;
  }
}

async function main() {
  console.log('🛡️ TerraFusion ToolRunner Enforcement Tests');
  console.log('='.repeat(60));
  console.log(`   ${ToolRegistry.count()} tools registered\n`);

  const results = await Promise.all([
    test1_HappyPath(),
    test2_PermissionDenied(),
    test3_RiskGate(),
    test4_LaneViolation(),
  ]);

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log(`\n   ${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED - Runtime enforcement verified!\n');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
