/**
 * Quick Actions Menu
 * Fast access to common tasks
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const { spawn } = require('child_process');
const ora = require('ora');

/**
 * Display quick actions menu
 */
async function quickActionsMenu(workspaceData) {
  console.log(chalk.cyan('\n⚡ QUICK ACTIONS\n'));
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Choose an action:',
      choices: [
        {
          name: `🚀 ${chalk.bold('Start Everything')} - Launch the entire workspace`,
          value: 'start-all',
          short: 'Start All'
        },
        {
          name: `✅ ${chalk.bold('Run Validation')} - Test all packages`,
          value: 'validate',
          short: 'Validate'
        },
        {
          name: `❤️  ${chalk.bold('Health Check')} - Monitor system resources`,
          value: 'health',
          short: 'Health Check'
        },
        {
          name: `🧪 ${chalk.bold('Run Tests')} - Execute test suites`,
          value: 'test',
          short: 'Run Tests'
        },
        {
          name: `🔧 ${chalk.bold('Install Dependencies')} - npm install all`,
          value: 'install',
          short: 'Install'
        },
        {
          name: `📚 ${chalk.bold('View Documentation')} - Open guides`,
          value: 'docs',
          short: 'Documentation'
        },
        new inquirer.Separator(),
        {
          name: chalk.dim('← Back to main menu'),
          value: 'back',
          short: 'Back'
        }
      ],
      pageSize: 15
    }
  ]);

  switch (action) {
    case 'start-all':
      await runScript('start-everything.ps1', 'Starting entire workspace');
      break;
    
    case 'validate':
      await runScript('validate-workspace.ps1', 'Running validation tests');
      break;
    
    case 'health':
      await runScript('health-check.ps1', 'Running health check');
      break;
    
    case 'test':
      console.log(chalk.yellow('\n🧪 Test runner coming soon!'));
      await waitForEnter();
      break;
    
    case 'install':
      console.log(chalk.yellow('\n🔧 Batch install coming soon!'));
      await waitForEnter();
      break;
    
    case 'docs':
      await showDocumentation();
      break;
    
    case 'back':
      return;
  }
}

/**
 * Run a PowerShell script
 */
async function runScript(scriptName, description) {
  const spinner = ora(description).start();
  
  try {
    const scriptPath = `./scripts/${scriptName}`;
    
    // Check if running on Windows
    const isWindows = process.platform === 'win32';
    
    if (!isWindows) {
      spinner.fail('PowerShell scripts only work on Windows');
      console.log(chalk.yellow('💡 Run this manually: .\\scripts\\' + scriptName));
      await waitForEnter();
      return;
    }

    spinner.text = `Running ${scriptName}...`;
    
    const child = spawn('pwsh', ['-File', scriptPath], {
      stdio: 'inherit',
      shell: true
    });

    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          spinner.succeed(`${description} completed successfully`);
          resolve();
        } else {
          spinner.fail(`${description} failed with code ${code}`);
          resolve(); // Don't reject, just continue
        }
      });
      
      child.on('error', (err) => {
        spinner.fail(`Failed to run ${scriptName}`);
        console.error(chalk.red(err.message));
        resolve();
      });
    });

    await waitForEnter();

  } catch (error) {
    spinner.fail(`Error running ${scriptName}`);
    console.error(chalk.red(error.message));
    await waitForEnter();
  }
}

/**
 * Show available documentation
 */
async function showDocumentation() {
  console.log(chalk.cyan('\n📚 AVAILABLE DOCUMENTATION\n'));
  
  const docs = [
    { name: 'Workspace Navigation Guide', file: 'WORKSPACE_NAVIGATION_GUIDE.md' },
    { name: 'Active Systems', file: 'ACTIVE_SYSTEMS.md' },
    { name: 'Path Resolution Guide', file: 'PATH_RESOLUTION_GUIDE.md' },
    { name: 'Strategic Enhancements Status', file: 'STRATEGIC_ENHANCEMENTS_STATUS.md' },
    { name: 'What to Do Next', file: 'WHAT_TO_DO_NEXT.md' }
  ];

  docs.forEach((doc, index) => {
    console.log(chalk.cyan(`${index + 1}.`) + ` ${chalk.bold(doc.name)}`);
    console.log(chalk.dim(`   File: ${doc.file}\n`));
  });

  console.log(chalk.yellow('💡 Open these files in your editor to read them'));
  
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
  quickActionsMenu
};
