const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');
const { createProgressBar } = require('./utils/progress');

async function build() {
  const spinner = ora('Initializing build process...').start();
  
  try {
    // Clean previous builds
    spinner.text = 'Cleaning previous builds...';
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    if (fs.existsSync('.next')) {
      fs.rmSync('.next', { recursive: true, force: true });
    }

    // Install dependencies
    spinner.text = 'Installing dependencies...';
    execSync('npm install', { stdio: 'ignore' });

    // Build Next.js
    spinner.text = 'Building Next.js application...';
    execSync('npm run build', { stdio: 'ignore' });

    // Build Electron
    spinner.text = 'Building Electron application...';
    execSync('npm run electron:build', { stdio: 'ignore' });

    // Create installer
    spinner.text = 'Creating installer...';
    execSync('npm run make', { stdio: 'ignore' });

    spinner.succeed(chalk.green('Build completed successfully!'));
    
    // Show build artifacts
    console.log('\nBuild artifacts:');
    const distPath = path.join(process.cwd(), 'dist');
    const files = fs.readdirSync(distPath);
    files.forEach(file => {
      console.log(chalk.blue(`- ${file}`));
    });

  } catch (error) {
    spinner.fail(chalk.red('Build failed!'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

build(); 