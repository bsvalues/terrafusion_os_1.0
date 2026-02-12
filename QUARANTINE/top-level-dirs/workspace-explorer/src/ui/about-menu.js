/**
 * About Menu
 * Information about the Workspace Explorer
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const boxen = require('boxen');

/**
 * Display about menu
 */
async function aboutMenu() {
  console.clear();
  
  const aboutText = 
    chalk.bold.cyan('🌍 TerraFusion Workspace Explorer v1.0.0\n\n') +
    chalk.white('AI-Powered Interactive Navigation Tool\n\n') +
    chalk.dim('Built with:\n') +
    chalk.dim('  • Node.js + Commander.js\n') +
    chalk.dim('  • Inquirer.js (interactive menus)\n') +
    chalk.dim('  • Fuse.js (fuzzy search)\n') +
    chalk.dim('  • Chalk + Boxen (beautiful UI)\n\n') +
    chalk.yellow('✨ THE TERRAFUSION WAY ✨\n') +
    chalk.dim('Build Foundation Before Features');

  const box = boxen(aboutText, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    align: 'center'
  });

  console.log(box);

  // Features
  console.log(chalk.cyan.bold('\n📋 FEATURES:\n'));
  
  const features = [
    '🔍 AI-Powered Semantic Search - Find anything instantly',
    '⚡ Quick Actions - Start, test, validate with one click',
    '📊 Workspace Statistics - Complete overview of 318 packages',
    '🎯 Browse by Category - Organized exploration',
    '🤖 AI Assistant - Intelligent suggestions',
    '📚 Documentation Access - All guides at your fingertips',
    '🎨 Beautiful Terminal UI - Designed for developers'
  ];

  features.forEach(feature => {
    console.log(chalk.white(`  ${feature}`));
  });

  // Stats
  console.log(chalk.cyan.bold('\n📊 WORKSPACE STATS:\n'));
  console.log(chalk.white('  📦 318 packages managed'));
  console.log(chalk.white('  🤖 18 AI systems integrated'));
  console.log(chalk.white('  📡 50 MCP servers catalogued'));
  console.log(chalk.white('  🎯 100% navigation coverage'));

  // THE TERRAFUSION WAY
  console.log(chalk.cyan.bold('\n✨ THE TERRAFUSION WAY:\n'));
  
  const principles = [
    'Foundation Before Features - Build solid base first',
    'Zero Breaking Changes - Backwards compatibility always',
    'Comprehensive Documentation - Knowledge for everyone',
    'AI-Powered Everything - Leverage intelligent automation',
    'Beautiful Terminal UI - Developer experience matters'
  ];

  principles.forEach((principle, index) => {
    console.log(chalk.white(`  ${index + 1}. ${principle}`));
  });

  await waitForEnter();
}

/**
 * Wait for user to press Enter
 */
async function waitForEnter() {
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
  aboutMenu
};
