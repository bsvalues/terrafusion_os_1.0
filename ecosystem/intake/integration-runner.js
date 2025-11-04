#!/usr/bin/env node

/**
 * TerraFusion Elite Government OS - Integration Runner
 * Zero-Touch Integration Pipeline - Orchestration Engine
 */

import chalk from 'chalk';
import ora from 'ora';
import { ztIntegrationOrchestrator } from './integration-orchestrator.js';
import { legacyScanner } from './legacy-app-scanner.js';

async function runIntegration(appPath) {
  console.log(chalk.cyan('🏛️ TerraFusion Elite Government OS'));
  console.log(chalk.green('   Government. Transcended.'));
  console.log(chalk.yellow('   Infrastructure Intelligence, Infinite Scale\n'));

  const spinner = ora('Initializing Zero-Touch Integration Pipeline...').start();

  try {
    // Step 1: Scan application if not already done
    spinner.text = '🔍 Scanning legacy application...';
    const profile = await legacyScanner.scanApplicationDirectory(appPath);
    spinner.succeed(`Application scanned: ${profile.framework} | ${profile.complexity} complexity`);

    // Step 2: Create integration plan
    spinner.start('📋 Creating integration plan...');
    const plan = await ztIntegrationOrchestrator.createIntegrationPlan(profile);
    spinner.succeed(
      `Integration plan created: ${plan.phases.length} phases, ${plan.totalEstimatedHours}h estimated`
    );

    // Step 3: Execute integration
    spinner.start('🚀 Executing integration pipeline...');
    await ztIntegrationOrchestrator.executeIntegrationPlan(plan);
    spinner.succeed('Integration pipeline executed successfully!');

    // Step 4: Final report
    console.log(chalk.green('\n🎊 INTEGRATION COMPLETED SUCCESSFULLY!\n'));

    console.log(chalk.cyan('📊 INTEGRATION SUMMARY:'));
    console.log(`   • Application: ${chalk.white(profile.name)}`);
    console.log(`   • Framework: ${chalk.white(profile.framework.toUpperCase())}`);
    console.log(`   • Complexity: ${chalk.white(profile.complexity.toUpperCase())}`);
    console.log(`   • FISMA Level: ${chalk.white(plan.governmentCompliance.fismaLevel)}`);
    console.log(`   • AI Agents: ${chalk.white(plan.aiEnhancements.agentCount)}`);
    console.log(`   • Total Effort: ${chalk.white(plan.totalEstimatedHours + ' hours')}`);

    console.log(chalk.cyan('\n🤖 AI ENHANCEMENTS ACTIVE:'));
    if (plan.aiEnhancements.predictiveAnalytics) console.log('   ✅ Predictive Analytics');
    if (plan.aiEnhancements.autonomousHealing) console.log('   ✅ Autonomous Healing');
    if (plan.aiEnhancements.intelligentRouting) console.log('   ✅ Intelligent Routing');
    if (plan.aiEnhancements.userBehaviorAnalysis) console.log('   ✅ User Behavior Analysis');
    if (plan.aiEnhancements.performanceOptimization) console.log('   ✅ Performance Optimization');
    if (plan.aiEnhancements.securityMonitoring) console.log('   ✅ Security Monitoring');

    console.log(chalk.cyan('\n🛡️ GOVERNMENT COMPLIANCE:'));
    console.log(
      `   • FISMA Controls: ${chalk.white(plan.governmentCompliance.controls.length + ' implemented')}`
    );
    console.log(
      `   • Data Classification: ${chalk.white(plan.governmentCompliance.dataClassification)}`
    );
    console.log(
      `   • FedRAMP Ready: ${chalk.white(plan.governmentCompliance.fedrampRequired ? 'YES' : 'NO')}`
    );

    console.log(chalk.cyan('\n🚀 DEPLOYMENT STRATEGY:'));
    console.log(`   • Approach: ${chalk.white(plan.deploymentStrategy.approach.toUpperCase())}`);
    console.log(
      `   • Environments: ${chalk.white(plan.deploymentStrategy.environments.join(' → '))}`
    );
    console.log(
      `   • Approval Gates: ${chalk.white(plan.deploymentStrategy.approvalGates.length + ' configured')}`
    );

    console.log(chalk.green('\n🎯 Government. Transcended.'));
    console.log(
      chalk.yellow(
        '   Your legacy application has been elevated to championship-level government technology.'
      )
    );
    console.log(
      chalk.white(
        '   Featuring infinite scalability, autonomous recovery, and transcendent user experience.\n'
      )
    );
  } catch (error) {
    spinner.fail('Integration failed');
    console.error(chalk.red('❌ Integration Error:'), error.message);
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const appPath = args[0];

if (!appPath) {
  console.error(chalk.red('Usage: node integration-runner.js <app-path>'));
  process.exit(1);
}

// Run the integration
runIntegration(appPath);
