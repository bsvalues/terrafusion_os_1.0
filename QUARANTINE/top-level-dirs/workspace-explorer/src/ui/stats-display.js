/**
 * Statistics Display
 * Show detailed workspace statistics
 */

const chalk = require('chalk');
const Table = require('cli-table3');
const { getWorkspaceStats } = require('../search/workspace-loader');

/**
 * Display workspace statistics
 */
async function displayStats(workspaceData) {
  console.log(chalk.cyan('\n📊 WORKSPACE STATISTICS\n'));
  
  const stats = getWorkspaceStats(workspaceData);

  // Overall stats
  console.log(chalk.bold('📦 Overall Statistics:\n'));
  console.log(`  Total Packages: ${chalk.cyan(stats.totalPackages)}`);
  console.log(`  AI Systems: ${chalk.cyan(stats.totalAISystems)}`);
  console.log(`  MCP Servers: ${chalk.cyan(stats.totalMCPServers)}`);
  console.log(`  Modules: ${chalk.cyan(stats.totalModules)}`);
  console.log(`  With Dependencies: ${chalk.cyan(stats.hasDependencies)}`);
  console.log(`  With Tests: ${chalk.cyan(stats.hasTests)}`);

  // By tier table
  if (Object.keys(stats.byTier).length > 0) {
    console.log(chalk.bold('\n\n🎯 Packages by Tier:\n'));
    
    const tierTable = new Table({
      head: [chalk.cyan('Tier'), chalk.cyan('Count'), chalk.cyan('Percentage')],
      style: { head: [], border: [] }
    });

    Object.entries(stats.byTier)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tier, count]) => {
        const percentage = ((count / stats.totalPackages) * 100).toFixed(1);
        tierTable.push([tier, count, `${percentage}%`]);
      });

    console.log(tierTable.toString());
  }

  // By type table
  if (Object.keys(stats.byType).length > 0) {
    console.log(chalk.bold('\n\n📂 Packages by Type:\n'));
    
    const typeTable = new Table({
      head: [chalk.cyan('Type'), chalk.cyan('Count'), chalk.cyan('Percentage')],
      style: { head: [], border: [] }
    });

    Object.entries(stats.byType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const percentage = ((count / stats.totalPackages) * 100).toFixed(1);
        typeTable.push([type, count, `${percentage}%`]);
      });

    console.log(typeTable.toString());
  }

  console.log('\n');
  
  const inquirer = require('inquirer');
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue...',
      prefix: ''
    }
  ]);
}

module.exports = {
  displayStats
};
