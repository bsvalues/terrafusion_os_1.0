/**
 * Browse Menu
 * Browse packages by category
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const { filterPackages } = require('../search/search-engine');
const { showPackageDetails } = require('./search-menu');

/**
 * Display browse menu
 */
async function browseMenu(workspaceData) {
  console.log(chalk.cyan('\n🎯 BROWSE BY CATEGORY\n'));
  
  // Get unique tiers and types
  const tiers = [...new Set(workspaceData.packages.map(p => p.tier).filter(Boolean))];
  const types = [...new Set(workspaceData.packages.map(p => p.type).filter(Boolean))];

  const { browseBy } = await inquirer.prompt([
    {
      type: 'list',
      name: 'browseBy',
      message: 'Browse by:',
      choices: [
        { name: '🎯 Tier (core, essential, enhanced, premium)', value: 'tier' },
        { name: '📂 Type (module, library, application, etc.)', value: 'type' },
        { name: '✅ Has Tests', value: 'hasTests' },
        { name: '📦 Has Dependencies', value: 'hasDependencies' },
        new inquirer.Separator(),
        { name: chalk.dim('← Back'), value: 'back' }
      ]
    }
  ]);

  if (browseBy === 'back') return;

  let filtered = [];

  if (browseBy === 'tier') {
    const { selectedTier } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedTier',
        message: 'Select tier:',
        choices: [...tiers.map(t => ({ name: t, value: t })), new inquirer.Separator(), { name: chalk.dim('← Back'), value: 'back' }]
      }
    ]);
    
    if (selectedTier === 'back') return;
    filtered = filterPackages(workspaceData, { tier: selectedTier });
  } else if (browseBy === 'type') {
    const { selectedType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedType',
        message: 'Select type:',
        choices: [...types.map(t => ({ name: t, value: t })), new inquirer.Separator(), { name: chalk.dim('← Back'), value: 'back' }]
      }
    ]);
    
    if (selectedType === 'back') return;
    filtered = filterPackages(workspaceData, { type: selectedType });
  } else if (browseBy === 'hasTests') {
    filtered = filterPackages(workspaceData, { hasTests: true });
  } else if (browseBy === 'hasDependencies') {
    filtered = filterPackages(workspaceData, { hasDependencies: true });
  }

  if (filtered.length === 0) {
    console.log(chalk.yellow('\n❌ No packages found'));
    await waitForEnter();
    return;
  }

  console.log(chalk.green(`\n✅ Found ${filtered.length} packages\n`));

  const choices = filtered.map((pkg, index) => ({
    name: `${chalk.cyan((index + 1).toString().padStart(2))}. ${pkg.name} ${chalk.dim(`(${pkg.tier || 'unknown'})`)}`,
    value: pkg,
    short: pkg.name
  }));

  choices.push(new inquirer.Separator());
  choices.push({ name: chalk.dim('← Back'), value: 'back' });

  const { selectedPackage } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedPackage',
      message: 'Select a package:',
      choices,
      pageSize: 15
    }
  ]);

  if (selectedPackage === 'back') return;

  await showPackageDetails(selectedPackage);
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
  browseMenu
};
