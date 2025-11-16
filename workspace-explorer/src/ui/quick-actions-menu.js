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
          short: 'Start All',
        },
        {
          name: `✅ ${chalk.bold('Run Validation')} - Test all packages`,
          value: 'validate',
          short: 'Validate',
        },
        {
          name: `❤️  ${chalk.bold('Health Check')} - Monitor system resources`,
          value: 'health',
          short: 'Health Check',
        },
        {
          name: `🧪 ${chalk.bold('Run Tests')} - Execute test suites`,
          value: 'test',
          short: 'Run Tests',
        },
        {
          name: `🔧 ${chalk.bold('Install Dependencies')} - npm install all`,
          value: 'install',
          short: 'Install',
        },
        {
          name: `📚 ${chalk.bold('View Documentation')} - Open guides`,
          value: 'docs',
          short: 'Documentation',
        },
        new inquirer.Separator(),
        {
          name: chalk.dim('← Back to main menu'),
          value: 'back',
          short: 'Back',
        },
      ],
      pageSize: 15,
    },
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
      await runTestSuite(workspaceData);
      break;

    case 'install':
      await runBatchInstaller(workspaceData);
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
      shell: true,
    });

    await new Promise((resolve, reject) => {
      child.on('close', code => {
        if (code === 0) {
          spinner.succeed(`${description} completed successfully`);
          resolve();
        } else {
          spinner.fail(`${description} failed with code ${code}`);
          resolve(); // Don't reject, just continue
        }
      });

      child.on('error', err => {
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
    { name: 'What to Do Next', file: 'WHAT_TO_DO_NEXT.md' },
  ];

  docs.forEach((doc, index) => {
    console.log(chalk.cyan(`${index + 1}.`) + ` ${chalk.bold(doc.name)}`);
    console.log(chalk.dim(`   File: ${doc.file}\n`));
  });

  console.log(chalk.yellow('💡 Open these files in your editor to read them'));

  await waitForEnter();
}

/**
 * Run test suite for workspace
 */
async function runTestSuite(workspaceData) {
  console.log(chalk.cyan('\n🧪 TEST RUNNER\n'));

  const testOptions = [
    {
      name: `🟢 ${chalk.bold('Backend Tests')} - Run .NET unit tests`,
      value: 'backend',
      short: 'Backend Tests',
    },
    {
      name: `🟦 ${chalk.bold('Frontend Tests')} - Run React/TypeScript tests`,
      value: 'frontend',
      short: 'Frontend Tests',
    },
    {
      name: `🟡 ${chalk.bold('Integration Tests')} - Run full system tests`,
      value: 'integration',
      short: 'Integration Tests',
    },
    {
      name: `🔄 ${chalk.bold('All Tests')} - Run complete test suite`,
      value: 'all',
      short: 'All Tests',
    },
    new inquirer.Separator(),
    {
      name: chalk.dim('← Back'),
      value: 'back',
      short: 'Back',
    },
  ];

  const { testType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'testType',
      message: 'Choose test suite to run:',
      choices: testOptions,
      pageSize: 10,
    },
  ]);

  if (testType === 'back') return;

  const spinner = ora('Running tests...').start();

  try {
    let command, args, cwd;

    switch (testType) {
      case 'backend':
        command = 'dotnet';
        args = ['test', '--nologo', '--verbosity', 'minimal'];
        cwd = './backend';
        spinner.text = 'Running .NET backend tests...';
        break;

      case 'frontend':
        command = 'npm';
        args = ['test', '--', '--passWithNoTests'];
        cwd = './frontend';
        spinner.text = 'Running React frontend tests...';
        break;

      case 'integration':
        command = 'dotnet';
        args = ['test', './backend/tests/TerraFusion.Integration.Tests', '--nologo'];
        cwd = '.';
        spinner.text = 'Running integration tests...';
        break;

      case 'all':
        spinner.text = 'Running all test suites...';
        await runTestCommand('dotnet', ['test', '--nologo'], './backend');
        await runTestCommand('npm', ['test', '--', '--passWithNoTests'], './frontend');
        spinner.succeed('All tests completed!');
        await waitForEnter();
        return;
    }

    await runTestCommand(command, args, cwd);
    spinner.succeed(`${testType} tests completed!`);
  } catch (error) {
    spinner.fail(`Test execution failed: ${error.message}`);
    console.log(chalk.red(`\nError details: ${error.message}`));
  }

  await waitForEnter();
}

/**
 * Run batch dependency installer
 */
async function runBatchInstaller(workspaceData) {
  console.log(chalk.cyan('\n🔧 BATCH DEPENDENCY INSTALLER\n'));

  const installOptions = [
    {
      name: `🟢 ${chalk.bold('Backend Dependencies')} - dotnet restore`,
      value: 'backend',
      short: 'Backend',
    },
    {
      name: `🟦 ${chalk.bold('Frontend Dependencies')} - npm install`,
      value: 'frontend',
      short: 'Frontend',
    },
    {
      name: `🔧 ${chalk.bold('Workspace Explorer')} - npm install workspace tools`,
      value: 'explorer',
      short: 'Explorer',
    },
    {
      name: `🚀 ${chalk.bold('All Dependencies')} - Install everything`,
      value: 'all',
      short: 'All',
    },
    new inquirer.Separator(),
    {
      name: chalk.dim('← Back'),
      value: 'back',
      short: 'Back',
    },
  ];

  const { installType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'installType',
      message: 'Choose dependencies to install:',
      choices: installOptions,
      pageSize: 10,
    },
  ]);

  if (installType === 'back') return;

  const spinner = ora('Installing dependencies...').start();

  try {
    switch (installType) {
      case 'backend':
        spinner.text = 'Installing .NET dependencies...';
        await runInstallCommand('dotnet', ['restore'], './backend');
        break;

      case 'frontend':
        spinner.text = 'Installing Node.js dependencies...';
        await runInstallCommand('npm', ['install'], './frontend');
        break;

      case 'explorer':
        spinner.text = 'Installing workspace explorer dependencies...';
        await runInstallCommand('npm', ['install'], './workspace-explorer');
        break;

      case 'all':
        spinner.text = 'Installing all dependencies...';
        await runInstallCommand('dotnet', ['restore'], './backend');
        await runInstallCommand('npm', ['install'], './frontend');
        await runInstallCommand('npm', ['install'], './workspace-explorer');
        break;
    }

    spinner.succeed('Dependencies installed successfully!');
  } catch (error) {
    spinner.fail(`Installation failed: ${error.message}`);
    console.log(chalk.red(`\nError details: ${error.message}`));
  }

  await waitForEnter();
}

/**
 * Helper to run test commands
 */
async function runTestCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      shell: true,
    });

    let output = '';

    child.stdout.on('data', data => {
      output += data.toString();
    });

    child.stderr.on('data', data => {
      output += data.toString();
    });

    child.on('close', code => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}\n${output}`));
      }
    });

    child.on('error', error => {
      reject(error);
    });
  });
}

/**
 * Helper to run install commands
 */
async function runInstallCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      shell: true,
    });

    let output = '';

    child.stdout.on('data', data => {
      output += data.toString();
    });

    child.stderr.on('data', data => {
      output += data.toString();
    });

    child.on('close', code => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Installation failed with code ${code}\n${output}`));
      }
    });

    child.on('error', error => {
      reject(error);
    });
  });
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
      prefix: '',
    },
  ]);
}

module.exports = {
  quickActionsMenu,
};
