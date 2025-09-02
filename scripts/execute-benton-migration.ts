#!/usr/bin/env node

import { bentonCountyMigration } from '../modules/government-edition/BentonCountyMigration.js';
import { promises as fs } from 'fs';
import path from 'path';

async function main() {
  console.log('🚀 Terrafusion OS 1.0 - BentonCounty Migration Execution');
  console.log('=' .repeat(60));

  try {
    // Validate prerequisites
    console.log('📋 Validating migration prerequisites...');
    const validation = await bentonCountyMigration.validatePrerequisites();
    
    if (!validation.valid) {
      console.error('❌ Prerequisites validation failed:');
      validation.issues.forEach(issue => console.error(`   • ${issue}`));
      process.exit(1);
    }
    console.log('✅ Prerequisites validated successfully');

    // Show migration summary
    const summary = bentonCountyMigration.getMigrationSummary();
    console.log('\n📊 Migration Summary:');
    console.log(`   • Total Components: ${summary.totalComponents}`);
    console.log(`   • Total Size: ${summary.totalSize.toLocaleString()} items`);
    console.log(`   • High Priority: ${summary.byPriority.high.toLocaleString()} items`);
    console.log(`   • Medium Priority: ${summary.byPriority.medium.toLocaleString()} items`);
    console.log(`   • Low Priority: ${summary.byPriority.low.toLocaleString()} items`);

    // Execute high-priority migration first
    console.log('\n🎯 Executing HIGH PRIORITY migration...');
    const highPriorityResult = await bentonCountyMigration.executeMigration(['high']);
    
    if (highPriorityResult.success) {
      console.log(`✅ High priority migration completed successfully`);
      console.log(`   • Components processed: ${highPriorityResult.componentsProcessed}`);
      console.log(`   • Total size migrated: ${highPriorityResult.totalSize.toLocaleString()} items`);
    } else {
      console.error('❌ High priority migration failed:');
      highPriorityResult.errors.forEach(error => console.error(`   • ${error}`));
    }

    // Execute medium-priority migration
    console.log('\n🎯 Executing MEDIUM PRIORITY migration...');
    const mediumPriorityResult = await bentonCountyMigration.executeMigration(['medium']);
    
    if (mediumPriorityResult.success) {
      console.log(`✅ Medium priority migration completed successfully`);
      console.log(`   • Components processed: ${mediumPriorityResult.componentsProcessed}`);
      console.log(`   • Total size migrated: ${mediumPriorityResult.totalSize.toLocaleString()} items`);
    } else {
      console.error('❌ Medium priority migration had issues:');
      mediumPriorityResult.errors.forEach(error => console.error(`   • ${error}`));
    }

    // Create migration report
    const report = {
      timestamp: new Date().toISOString(),
      highPriority: highPriorityResult,
      mediumPriority: mediumPriorityResult,
      totalComponentsMigrated: highPriorityResult.componentsProcessed + mediumPriorityResult.componentsProcessed,
      totalSizeMigrated: highPriorityResult.totalSize + mediumPriorityResult.totalSize,
      overallSuccess: highPriorityResult.success && mediumPriorityResult.success
    };

    const reportPath = path.join(process.cwd(), 'migration-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📄 Migration Report Generated:');
    console.log(`   • Report saved to: ${reportPath}`);
    console.log(`   • Total components migrated: ${report.totalComponentsMigrated}`);
    console.log(`   • Total size migrated: ${report.totalSizeMigrated.toLocaleString()} items`);
    console.log(`   • Overall success: ${report.overallSuccess ? '✅ YES' : '❌ NO'}`);

    if (report.overallSuccess) {
      console.log('\n🎉 BentonCounty migration completed successfully!');
      console.log('🏆 Terrafusion OS 1.0 now includes production-ready BentonCounty components');
    } else {
      console.log('\n⚠️  Migration completed with some issues. Check the report for details.');
    }

  } catch (error) {
    console.error('💥 Migration execution failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as executeBentonMigration };
