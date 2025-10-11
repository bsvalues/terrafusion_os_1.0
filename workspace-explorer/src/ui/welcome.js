/**
 * Welcome Screen
 * Beautiful terminal welcome with TerraFusion branding
 */

const chalk = require('chalk');
const figlet = require('figlet');
const boxen = require('boxen');

/**
 * Display welcome banner
 */
function displayWelcome() {
  console.clear();
  
  // ASCII art title
  const title = figlet.textSync('TerraFusion', {
    font: 'Standard',
    horizontalLayout: 'default'
  });
  
  console.log(chalk.cyan(title));
  
  // Welcome box
  const welcomeText = chalk.bold('🌍 Workspace Explorer v1.0.0\n\n') +
    chalk.dim('AI-Powered Interactive Navigation\n') +
    chalk.dim('Navigate 318 packages with ease\n\n') +
    chalk.green('✨ THE TERRAFUSION WAY ✨');
  
  const box = boxen(welcomeText, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    align: 'center'
  });
  
  console.log(box);
  
  // Quick tips
  console.log(chalk.yellow('💡 Quick Tips:'));
  console.log(chalk.dim('   • Use arrow keys to navigate'));
  console.log(chalk.dim('   • Press Ctrl+C anytime to exit'));
  console.log(chalk.dim('   • Start with "Search Workspace" to find anything'));
  console.log(chalk.dim('   • Try "Quick Actions" for common tasks\n'));
}

module.exports = {
  displayWelcome
};
