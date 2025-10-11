/**
 * Search Menu UI
 * Interactive search interface
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const { searchWorkspace, getSuggestions } = require('../search/search-engine');

/**
 * Display search menu and handle search
 */
async function searchMenu(workspaceData) {
  console.log(chalk.cyan('\n🔍 SEARCH WORKSPACE\n'));
  
  const { searchQuery } = await inquirer.prompt([
    {
      type: 'input',
      name: 'searchQuery',
      message: 'What are you looking for?',
      validate: (input) => {
        if (input.trim().length === 0) {
          return 'Please enter a search query';
        }
        return true;
      }
    }
  ]);

  if (!searchQuery.trim()) {
    return;
  }

  console.log(chalk.dim(`\nSearching for: ${searchQuery}...`));
  
  const results = await searchWorkspace(workspaceData, searchQuery);

  if (results.length === 0) {
    console.log(chalk.yellow('\n❌ No results found'));
    
    // Offer suggestions
    const suggestions = getSuggestions(workspaceData, searchQuery);
    if (suggestions.length > 0) {
      console.log(chalk.cyan('\n💡 Did you mean:'));
      suggestions.slice(0, 5).forEach(s => {
        console.log(chalk.dim(`   - ${s}`));
      });
    }
    
    await waitForEnter();
    return;
  }

  // Display results
  console.log(chalk.green(`\n✅ Found ${results.length} results:\n`));
  
  const choices = results.map((result, index) => ({
    name: `${chalk.cyan((index + 1).toString().padStart(2))}. ${chalk.bold(result.name)} ${chalk.dim(`(${result.tier || 'unknown'})`)}
     ${chalk.dim(result.path)}
     ${result.description ? chalk.dim(result.description.substring(0, 80) + (result.description.length > 80 ? '...' : '')) : ''}`,
    value: result,
    short: result.name
  }));

  choices.push(new inquirer.Separator());
  choices.push({
    name: chalk.dim('← Back to main menu'),
    value: 'back',
    short: 'Back'
  });

  const { selectedPackage } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedPackage',
      message: 'Select a package for more details:',
      choices,
      pageSize: 15
    }
  ]);

  if (selectedPackage === 'back') {
    return;
  }

  // Show package details
  await showPackageDetails(selectedPackage);
}

/**
 * Show detailed information about a package
 */
async function showPackageDetails(pkg) {
  console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyan.bold(`  📦 ${pkg.name}`));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  
  console.log(chalk.bold('Path:'), chalk.dim(pkg.path));
  console.log(chalk.bold('Tier:'), pkg.tier || chalk.dim('unknown'));
  console.log(chalk.bold('Type:'), pkg.type || chalk.dim('unknown'));
  
  if (pkg.description) {
    console.log(chalk.bold('\nDescription:'));
    console.log(chalk.dim(pkg.description));
  }
  
  console.log(chalk.bold('\nFeatures:'));
  console.log(`  ${pkg.hasDependencies ? '✅' : '❌'} Has dependencies`);
  console.log(`  ${pkg.hasTests ? '✅' : '❌'} Has tests`);
  console.log(`  ${pkg.hasDocumentation ? '✅' : '❌'} Has documentation`);
  
  if (pkg.scripts && Object.keys(pkg.scripts).length > 0) {
    console.log(chalk.bold('\nAvailable Scripts:'));
    Object.keys(pkg.scripts).slice(0, 10).forEach(script => {
      console.log(chalk.dim(`  - ${script}`));
    });
  }

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
  searchMenu,
  showPackageDetails
};
