/**
 * Main Interactive Menu
 * The heart of the Workspace Explorer
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const { searchMenu } = require('./search-menu');
const { quickActionsMenu } = require('./quick-actions-menu');
const { aboutMenu } = require('./about-menu');

/**
 * Display main menu and handle selection
 */
async function mainMenu(workspaceData) {
  while (true) {
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan.bold('  🌍 TERRAFUSION WORKSPACE EXPLORER'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          {
            name: `🔍 ${chalk.bold('Search Workspace')} - Find packages, modules, and files`,
            value: 'search',
            short: 'Search'
          },
          {
            name: `⚡ ${chalk.bold('Quick Actions')} - Start, test, validate, and more`,
            value: 'quick-actions',
            short: 'Quick Actions'
          },
          {
            name: `📊 ${chalk.bold('Workspace Stats')} - View detailed statistics`,
            value: 'stats',
            short: 'Stats'
          },
          {
            name: `🎯 ${chalk.bold('Browse by Category')} - Explore organized packages`,
            value: 'browse',
            short: 'Browse'
          },
          {
            name: `🤖 ${chalk.bold('AI Assistant')} - Get intelligent suggestions`,
            value: 'ai-assistant',
            short: 'AI Assistant'
          },
          {
            name: `ℹ️  ${chalk.bold('About')} - Learn about this tool`,
            value: 'about',
            short: 'About'
          },
          new inquirer.Separator(),
          {
            name: `❌ ${chalk.dim('Exit')}`,
            value: 'exit',
            short: 'Exit'
          }
        ],
        pageSize: 15
      }
    ]);

    // Handle user choice
    switch (action) {
      case 'search':
        await searchMenu(workspaceData);
        break;
      
      case 'quick-actions':
        await quickActionsMenu(workspaceData);
        break;
      
      case 'stats':
        const { displayStats } = require('./stats-display');
        await displayStats(workspaceData);
        break;
      
      case 'browse':
        const { browseMenu } = require('./browse-menu');
        await browseMenu(workspaceData);
        break;
      
      case 'ai-assistant':
        const { aiAssistantMenu } = require('./ai-assistant-menu');
        await aiAssistantMenu(workspaceData);
        break;
      
      case 'about':
        await aboutMenu();
        break;
      
      case 'exit':
        console.log(chalk.cyan('\n👋 Thanks for using TerraFusion Workspace Explorer!'));
        console.log(chalk.dim('   Built with ❤️  THE TERRAFUSION WAY\n'));
        process.exit(0);
      
      default:
        console.log(chalk.yellow('Unknown action'));
    }
  }
}

module.exports = {
  mainMenu
};
