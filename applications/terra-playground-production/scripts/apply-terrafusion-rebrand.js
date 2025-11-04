#!/usr/bin/env node

/**
 * Apply Terrafusion Rebrand
 *
 * This script automates the process of applying the Terrafusion rebrand to the codebase.
 * It updates CSS files, component styles, and helps generate SVG assets.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuration
const config = {
  tokensFile: path.resolve(__dirname, '../tokens/terrafusion.json'),
  cssTokensFile: path.resolve(__dirname, '../client/src/styles/terrafusion-tokens.css'),
  tailwindConfigFile: path.resolve(__dirname, '../tailwind.config.ts'),
  hexToTokenScript: path.resolve(__dirname, './hexToToken.js'),
  componentPaths: [
    path.resolve(__dirname, '../client/src/components/ui'),
    path.resolve(__dirname, '../client/src/components/common'),
  ],
  assetsSrcDir: path.resolve(__dirname, '../assets/terrafusion'),
  assetsDestDir: path.resolve(__dirname, '../public/assets'),
};

// Check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Step 1: Verify that all necessary files exist
function verifyFiles() {
  console.log(chalk.blue('Step 1: Verifying necessary files...'));

  if (!fileExists(config.tokensFile)) {
    console.error(chalk.red(`Error: Tokens file not found at ${config.tokensFile}`));
    return false;
  }

  if (!fileExists(config.tailwindConfigFile)) {
    console.error(
      chalk.red(`Error: Tailwind config file not found at ${config.tailwindConfigFile}`)
    );
    return false;
  }

  if (!fileExists(config.hexToTokenScript)) {
    console.error(chalk.red(`Error: Hex to token script not found at ${config.hexToTokenScript}`));
    return false;
  }

  console.log(chalk.green('✓ All necessary files found'));
  return true;
}

// Step 2: Apply Terrafusion tokens CSS
function applyCSSTokens() {
  console.log(chalk.blue('Step 2: Applying Terrafusion tokens CSS...'));

  if (!fileExists(config.cssTokensFile)) {
    console.log(chalk.yellow('Warning: CSS tokens file not found, creating it...'));

    // Read tokens data
    const tokensData = JSON.parse(fs.readFileSync(config.tokensFile, 'utf8'));

    // Generate CSS variables
    let cssContent =
      '/**\n * Terrafusion Design Tokens\n * CSS Custom Properties (Variables)\n */\n\n:root {\n';

    // Add font families
    if (tokensData.tokens && tokensData.tokens.fonts) {
      cssContent += '  /* Font Families */\n';
      for (const [name, data] of Object.entries(tokensData.tokens.fonts)) {
        cssContent += `  --font-${name}: ${data.value};\n`;
      }
      cssContent += '  \n';
    }

    // Add colors
    if (tokensData.tokens && tokensData.tokens.colors) {
      const { colors } = tokensData.tokens;

      // Primary colors
      cssContent += '  /* Primary Colors */\n';
      for (const [name, data] of Object.entries(colors.primary || {})) {
        cssContent += `  --color-primary-${name}: ${data.value};\n`;
      }
      cssContent += '\n';

      // Secondary colors
      cssContent += '  /* Secondary Colors */\n';
      for (const [name, data] of Object.entries(colors.secondary || {})) {
        cssContent += `  --color-secondary-${name}: ${data.value};\n`;
      }
      cssContent += '\n';

      // Accent colors
      cssContent += '  /* Accent Colors */\n';
      for (const [name, data] of Object.entries(colors.accent || {})) {
        cssContent += `  --color-accent-${name}: ${data.value};\n`;
      }
      cssContent += '\n';

      // System colors
      cssContent += '  /* System Colors */\n';
      for (const [name, data] of Object.entries(colors.system || {})) {
        cssContent += `  --color-${name}: ${data.value};\n`;
      }
      cssContent += '\n';

      // Background colors
      cssContent += '  /* Background Colors */\n';
      for (const [name, data] of Object.entries(colors.background || {})) {
        cssContent += `  --color-background-${name}: ${data.value};\n`;
      }
      cssContent += '\n';

      // Surface colors
      cssContent += '  /* Surface Colors */\n';
      for (const [name, data] of Object.entries(colors.surface || {})) {
        cssContent += `  --color-surface-${name}: ${data.value};\n`;
      }
      cssContent += '\n';

      // Add black and white
      if (colors.black) {
        cssContent += `  --color-black: ${colors.black.value};\n`;
      }
      if (colors.white) {
        cssContent += `  --color-white: ${colors.white.value};\n`;
      }
      cssContent += '\n';
    }

    // Add shadows
    if (tokensData.tokens && tokensData.tokens.shadows) {
      cssContent += '  /* Shadows */\n';
      for (const [name, data] of Object.entries(tokensData.tokens.shadows)) {
        cssContent += `  --shadow-${name}: ${data.value};\n`;
      }
      cssContent += '\n';
    }

    // Add border radius
    if (tokensData.tokens && tokensData.tokens.borderRadius) {
      cssContent += '  /* Border Radius */\n';
      for (const [name, data] of Object.entries(tokensData.tokens.borderRadius)) {
        cssContent += `  --radius-${name}: ${data.value};\n`;
      }
      cssContent += '\n';
    }

    // Close root selector
    cssContent += '}\n\n';

    // Add dark mode
    cssContent += '/* Dark mode overrides */\n';
    cssContent += '@media (prefers-color-scheme: dark) {\n';
    cssContent += '  :root {\n';
    cssContent += '    /* Override any variables that need adjustments in dark mode */\n';
    cssContent += '  }\n';
    cssContent += '}\n\n';

    // Add dark mode class
    cssContent += '/* Class for forcing dark mode */\n';
    cssContent += '.dark-mode {\n';
    cssContent += '  --color-background: var(--color-background-dark);\n';
    cssContent += '  --color-surface: var(--color-surface-dark);\n';
    cssContent += '  /* Add other dark mode overrides as needed */\n';
    cssContent += '}';

    // Ensure directory exists
    const cssDir = path.dirname(config.cssTokensFile);
    if (!fs.existsSync(cssDir)) {
      fs.mkdirSync(cssDir, { recursive: true });
    }

    // Write CSS file
    fs.writeFileSync(config.cssTokensFile, cssContent, 'utf8');
    console.log(chalk.green(`✓ Created CSS tokens file at ${config.cssTokensFile}`));
  } else {
    console.log(chalk.green(`✓ CSS tokens file already exists at ${config.cssTokensFile}`));
  }
}

// Step 3: Update Tailwind config
function updateTailwindConfig() {
  console.log(chalk.blue('Step 3: Updating Tailwind config...'));

  try {
    let tailwindConfig = fs.readFileSync(config.tailwindConfigFile, 'utf8');

    // Check if Terrafusion plugin is already imported
    if (!tailwindConfig.includes("import terrafusionPlugin from './scripts/patchTailwind'")) {
      // Add import
      const importLine = "import terrafusionPlugin from './scripts/patchTailwind';\n";
      tailwindConfig = importLine + tailwindConfig;

      // Add plugin to the plugins array
      if (tailwindConfig.includes('plugins: [')) {
        tailwindConfig = tailwindConfig.replace(
          'plugins: [',
          'plugins: [\n    terrafusionPlugin(),'
        );
      } else {
        // If no plugins array exists, add it
        if (tailwindConfig.includes('export default')) {
          tailwindConfig = tailwindConfig.replace(
            'export default {',
            'export default {\n  plugins: [terrafusionPlugin()],'
          );
        }
      }

      fs.writeFileSync(config.tailwindConfigFile, tailwindConfig, 'utf8');
      console.log(chalk.green(`✓ Updated Tailwind config to use Terrafusion plugin`));
    } else {
      console.log(chalk.green(`✓ Tailwind config already includes Terrafusion plugin`));
    }
  } catch (err) {
    console.error(chalk.red(`Error updating Tailwind config: ${err.message}`));
  }
}

// Step 4: Run hexToToken script to update colors in components
function updateComponentColors() {
  console.log(chalk.blue('Step 4: Updating component colors...'));

  for (const componentPath of config.componentPaths) {
    if (fs.existsSync(componentPath)) {
      try {
        const command = `npx jscodeshift -t "${config.hexToTokenScript}" "${componentPath}/**/*.{js,jsx,ts,tsx}"`;
        console.log(chalk.yellow(`Running: ${command}`));
        execSync(command, { stdio: 'inherit' });
        console.log(chalk.green(`✓ Updated colors in ${componentPath}`));
      } catch (err) {
        console.error(
          chalk.red(`Error updating component colors in ${componentPath}: ${err.message}`)
        );
      }
    } else {
      console.log(chalk.yellow(`Warning: Component path ${componentPath} not found, skipping`));
    }
  }
}

// Step 5: Copy Terrafusion assets
function copyAssets() {
  console.log(chalk.blue('Step 5: Copying Terrafusion assets...'));

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(config.assetsDestDir)) {
    fs.mkdirSync(config.assetsDestDir, { recursive: true });
  }

  // Check if source directory exists
  if (fs.existsSync(config.assetsSrcDir)) {
    try {
      const files = fs.readdirSync(config.assetsSrcDir);

      for (const file of files) {
        const srcPath = path.join(config.assetsSrcDir, file);
        const destPath = path.join(config.assetsDestDir, file);

        fs.copyFileSync(srcPath, destPath);
        console.log(chalk.green(`✓ Copied ${file} to ${config.assetsDestDir}`));
      }
    } catch (err) {
      console.error(chalk.red(`Error copying assets: ${err.message}`));
    }
  } else {
    console.log(
      chalk.yellow(`Warning: Assets source directory ${config.assetsSrcDir} not found, skipping`)
    );
  }
}

// Step 6: Update theme.json
function updateThemeJson() {
  console.log(chalk.blue('Step 6: Updating theme.json...'));

  const themeJsonPath = path.resolve(__dirname, '../theme.json');

  if (fs.existsSync(themeJsonPath)) {
    try {
      const themeData = JSON.parse(fs.readFileSync(themeJsonPath, 'utf8'));

      // Update with Terrafusion colors
      const updatedThemeData = {
        ...themeData,
        primary: '#1976D2', // Terrafusion primary blue
        variant: 'professional',
        radius: 0.5, // Medium radius
      };

      fs.writeFileSync(themeJsonPath, JSON.stringify(updatedThemeData, null, 2), 'utf8');
      console.log(chalk.green(`✓ Updated theme.json with Terrafusion colors`));
    } catch (err) {
      console.error(chalk.red(`Error updating theme.json: ${err.message}`));
    }
  } else {
    console.log(chalk.yellow(`Warning: theme.json not found at ${themeJsonPath}, skipping`));
  }
}

// Step 7: Update index.css to import Terrafusion tokens
function updateIndexCss() {
  console.log(chalk.blue('Step 7: Updating index.css to import Terrafusion tokens...'));

  const indexCssPath = path.resolve(__dirname, '../client/src/index.css');

  if (fs.existsSync(indexCssPath)) {
    try {
      let indexCss = fs.readFileSync(indexCssPath, 'utf8');

      // Check if Terrafusion tokens are already imported
      if (!indexCss.includes('@import "./styles/terrafusion-tokens.css";')) {
        // Add import at the top of the file
        indexCss = '@import "./styles/terrafusion-tokens.css";\n' + indexCss;

        fs.writeFileSync(indexCssPath, indexCss, 'utf8');
        console.log(chalk.green(`✓ Updated index.css to import Terrafusion tokens`));
      } else {
        console.log(chalk.green(`✓ index.css already imports Terrafusion tokens`));
      }
    } catch (err) {
      console.error(chalk.red(`Error updating index.css: ${err.message}`));
    }
  } else {
    console.log(chalk.yellow(`Warning: index.css not found at ${indexCssPath}, skipping`));
  }
}

// Main function
async function main() {
  console.log(chalk.bold.green('=== Terrafusion Rebrand Application ==='));

  // Run all steps
  if (!verifyFiles()) {
    process.exit(1);
  }

  applyCSSTokens();
  updateTailwindConfig();
  updateComponentColors();
  copyAssets();
  updateThemeJson();
  updateIndexCss();

  console.log(chalk.bold.green('=== Terrafusion Rebrand Completed Successfully ==='));
}

// Run main function
main().catch(err => {
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(1);
});
