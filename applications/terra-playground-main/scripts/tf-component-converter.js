#!/usr/bin/env node

/**
 * Terrafusion Component Converter
 *
 * This utility helps convert existing components to use Terrafusion styling.
 * It analyzes component files and suggests Terrafusion-compatible styling changes.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
let targetPath = '';
let dryRun = false;
let verbose = false;

// Process arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dry-run' || args[i] === '-d') {
    dryRun = true;
  } else if (args[i] === '--verbose' || args[i] === '-v') {
    verbose = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    showHelp();
    process.exit(0);
  } else {
    targetPath = args[i];
  }
}

// Show help
function showHelp() {
  console.log(chalk.bold('Terrafusion Component Converter'));
  console.log('');
  console.log('Usage: node tf-component-converter.js [options] <target-path>');
  console.log('');
  console.log('Options:');
  console.log('  -d, --dry-run    Show suggested changes without making them');
  console.log('  -v, --verbose    Show detailed information during conversion');
  console.log('  -h, --help       Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node tf-component-converter.js ./client/src/components/MyComponent.tsx');
  console.log('  node tf-component-converter.js --dry-run ./client/src/components/ui/');
  console.log('');
}

// Validate target path
if (!targetPath) {
  console.error(chalk.red('Error: No target path specified'));
  showHelp();
  process.exit(1);
}

// Check if the target path exists
if (!fs.existsSync(targetPath)) {
  console.error(chalk.red(`Error: Target path ${targetPath} does not exist`));
  process.exit(1);
}

// Color token mappings
const colorTokenMappings = {
  // Blues
  '#1976D2': 'var(--color-primary-blue)',
  '#1E88E5': 'var(--color-primary-blue-light)',
  '#1565C0': 'var(--color-primary-blue-dark)',
  'rgb(25, 118, 210)': 'var(--color-primary-blue)',

  // Greens
  '#388E3C': 'var(--color-primary-green)',
  '#43A047': 'var(--color-primary-green-light)',
  '#2E7D32': 'var(--color-primary-green-dark)',
  'rgb(56, 142, 60)': 'var(--color-primary-green)',

  // Oranges
  '#FF8000': 'var(--color-primary-orange)',
  '#FF9933': 'var(--color-primary-orange-light)',
  '#CC6600': 'var(--color-primary-orange-dark)',
  'rgb(255, 128, 0)': 'var(--color-primary-orange)',

  // Reds
  '#E64A19': 'var(--color-primary-red)',
  '#FF5722': 'var(--color-primary-red-light)',
  '#BF360C': 'var(--color-primary-red-dark)',
  'rgb(230, 74, 25)': 'var(--color-primary-red)',

  // Grays
  '#212529': 'var(--color-black)',
  '#495057': 'var(--color-primary-gray-dark)',
  '#6C757D': 'var(--color-primary-gray)',
  '#ADB5BD': 'var(--color-primary-gray-light)',
  '#DEE2E6': 'var(--color-secondary-gray)',
  '#E9ECEF': 'var(--color-secondary-gray-light)',
  '#F8F9FA': 'var(--color-secondary-gray-ultralight)',

  // System colors
  '#28A745': 'var(--color-success)',
  '#FFC107': 'var(--color-warning)',
  '#DC3545': 'var(--color-error)',
  '#17A2B8': 'var(--color-info)',

  // Common UI colors
  '#FFFFFF': 'var(--color-white)',
  '#F5F5F5': 'var(--color-background-light)',
  '#212121': 'var(--color-background-dark)',
};

// Tailwind class mappings for conversion
const tailwindClassMappings = {
  // Background color classes
  'bg-blue-500': 'bg-primary-blue',
  'bg-blue-600': 'bg-primary-blue-dark',
  'bg-blue-400': 'bg-primary-blue-light',
  'bg-green-500': 'bg-primary-green',
  'bg-green-600': 'bg-primary-green-dark',
  'bg-green-400': 'bg-primary-green-light',
  'bg-red-500': 'bg-primary-red',
  'bg-red-600': 'bg-primary-red-dark',
  'bg-red-400': 'bg-primary-red-light',
  'bg-yellow-500': 'bg-primary-orange',
  'bg-yellow-600': 'bg-primary-orange-dark',
  'bg-yellow-400': 'bg-primary-orange-light',
  'bg-gray-100': 'bg-secondary-gray-ultralight',
  'bg-gray-200': 'bg-secondary-gray-light',
  'bg-gray-300': 'bg-secondary-gray',
  'bg-gray-500': 'bg-primary-gray',
  'bg-gray-700': 'bg-primary-gray-dark',
  'bg-gray-900': 'bg-black',
  'bg-white': 'bg-white',

  // Text color classes
  'text-blue-500': 'text-primary-blue',
  'text-blue-600': 'text-primary-blue-dark',
  'text-blue-400': 'text-primary-blue-light',
  'text-green-500': 'text-primary-green',
  'text-green-600': 'text-primary-green-dark',
  'text-green-400': 'text-primary-green-light',
  'text-red-500': 'text-primary-red',
  'text-red-600': 'text-primary-red-dark',
  'text-red-400': 'text-primary-red-light',
  'text-yellow-500': 'text-primary-orange',
  'text-yellow-600': 'text-primary-orange-dark',
  'text-yellow-400': 'text-primary-orange-light',
  'text-gray-100': 'text-secondary-gray-ultralight',
  'text-gray-200': 'text-secondary-gray-light',
  'text-gray-300': 'text-secondary-gray',
  'text-gray-500': 'text-primary-gray',
  'text-gray-700': 'text-primary-gray-dark',
  'text-gray-900': 'text-black',
  'text-white': 'text-white',

  // Border color classes
  'border-blue-500': 'border-primary-blue',
  'border-blue-600': 'border-primary-blue-dark',
  'border-blue-400': 'border-primary-blue-light',
  'border-green-500': 'border-primary-green',
  'border-green-600': 'border-primary-green-dark',
  'border-green-400': 'border-primary-green-light',
  'border-red-500': 'border-primary-red',
  'border-red-600': 'border-primary-red-dark',
  'border-red-400': 'border-primary-red-light',
  'border-yellow-500': 'border-primary-orange',
  'border-yellow-600': 'border-primary-orange-dark',
  'border-yellow-400': 'border-primary-orange-light',
  'border-gray-100': 'border-secondary-gray-ultralight',
  'border-gray-200': 'border-secondary-gray-light',
  'border-gray-300': 'border-secondary-gray',
  'border-gray-500': 'border-primary-gray',
  'border-gray-700': 'border-primary-gray-dark',
  'border-gray-900': 'border-black',
  'border-white': 'border-white',

  // Font families
  'font-sans': 'tf-font-body',
  'font-serif': 'tf-font-display',
  'font-mono': 'tf-font-mono',
};

// Process a file and suggest or apply changes
function processFile(filePath) {
  if (verbose) {
    console.log(chalk.blue(`Processing file: ${filePath}`));
  }

  const fileExt = path.extname(filePath).toLowerCase();
  if (!['.js', '.jsx', '.ts', '.tsx', '.css', '.scss'].includes(fileExt)) {
    if (verbose) {
      console.log(chalk.yellow(`Skipping unsupported file type: ${fileExt}`));
    }
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    const changes = [];

    // Process hex color replacements
    for (const [hexColor, token] of Object.entries(colorTokenMappings)) {
      if (content.includes(hexColor)) {
        const regex = new RegExp(hexColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        modifiedContent = modifiedContent.replace(regex, token);
        changes.push(`${chalk.red(hexColor)} → ${chalk.green(token)}`);
      }
    }

    // Process Tailwind class name replacements
    for (const [oldClass, newClass] of Object.entries(tailwindClassMappings)) {
      // Look for the class name in various contexts (e.g., in className, in cn() function, etc.)
      const patterns = [
        `${oldClass}\\s`, // Class followed by whitespace
        `${oldClass}"`, // Class followed by closing quote
        `${oldClass}'`, // Class followed by single quote
        `${oldClass}\``, // Class followed by backtick
      ];

      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'g');
        if (regex.test(modifiedContent)) {
          modifiedContent = modifiedContent.replace(regex, match => {
            return match.replace(oldClass, newClass);
          });
          changes.push(`${chalk.red(oldClass)} → ${chalk.green(newClass)}`);
        }
      }
    }

    // Check if any changes were found
    if (changes.length > 0) {
      console.log(chalk.green(`✓ ${filePath} (${changes.length} changes)`));

      if (verbose) {
        console.log(chalk.yellow('Changes:'));
        changes.forEach((change, i) => {
          console.log(`  ${i + 1}. ${change}`);
        });
      }

      // Apply changes if not in dry run mode
      if (!dryRun) {
        fs.writeFileSync(filePath, modifiedContent, 'utf8');
        console.log(chalk.green('  Changes applied successfully'));
      } else {
        console.log(chalk.yellow('  Dry run mode: no changes applied'));
      }
    } else if (verbose) {
      console.log(chalk.blue(`No changes needed in ${filePath}`));
    }
  } catch (err) {
    console.error(chalk.red(`Error processing ${filePath}: ${err.message}`));
  }
}

// Recursively process a directory
function processDirectory(dirPath) {
  if (verbose) {
    console.log(chalk.blue(`Scanning directory: ${dirPath}`));
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
          processDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        processFile(fullPath);
      }
    }
  } catch (err) {
    console.error(chalk.red(`Error reading directory ${dirPath}: ${err.message}`));
  }
}

// Main function
function main() {
  console.log(chalk.bold.green('Terrafusion Component Converter'));
  console.log(chalk.cyan(`Target: ${targetPath}`));
  console.log(chalk.cyan(`Mode: ${dryRun ? 'Dry run (preview only)' : 'Apply changes'}`));
  console.log(chalk.cyan(`Verbose: ${verbose ? 'Yes' : 'No'}`));
  console.log('');

  // Check if target is a file or directory
  const stats = fs.statSync(targetPath);

  if (stats.isFile()) {
    processFile(targetPath);
  } else if (stats.isDirectory()) {
    processDirectory(targetPath);
  } else {
    console.error(chalk.red(`Error: ${targetPath} is neither a file nor a directory`));
    process.exit(1);
  }

  console.log('');
  console.log(chalk.green('Conversion complete!'));
  if (dryRun) {
    console.log(chalk.yellow('Note: This was a dry run. No changes were actually applied.'));
    console.log(chalk.yellow('Run without --dry-run to apply the changes.'));
  }
}

// Run the main function
main();
