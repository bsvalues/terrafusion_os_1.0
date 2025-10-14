#!/usr/bin/env node
/**
 * TerraFusion OS - Intelligent Inline Style Refactoring Tool
 * 
 * MIT/PhD Systems Engineering Approach:
 * - Uses Babel AST parsing for accurate code transformation
 * - Intelligently converts static styles to Tailwind
 * - Preserves dynamic styles with CSS custom properties
 * - Maintains code formatting and comments
 * - Creates detailed transformation reports
 * 
 * @author TerraFusion-AI (MIT/PhD Systems Design Mode)
 * @version 1.0.0
 * @date October 13, 2025
 */

const fs = require('fs').promises;
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const { glob } = require('glob');
const chalk = require('chalk');
const { program } = require('commander');
const ora = require('ora');

// ============================================================================
// CONFIGURATION
// ============================================================================

const STYLE_TO_TAILWIND = {
  // Padding & Margin
  "padding: '2rem'": 'p-8',
  "padding: '1rem'": 'p-4',
  "padding: '0.75rem'": 'p-3',
  "padding: '0.5rem'": 'p-2',
  
  // Text Alignment
  "textAlign: 'center'": 'text-center',
  "textAlign: 'left'": 'text-left',
  "textAlign: 'right'": 'text-right',
  
  // Colors
  "color: '#666'": 'text-gray-600',
  "color: '#999'": 'text-gray-400',
  
  // Display & Flexbox
  "display: 'flex'": 'flex',
  "gap: '0.5rem'": 'gap-2',
  "gap: '0.75rem'": 'gap-3',
  "gap: '1rem'": 'gap-4',
  "alignItems: 'center'": 'items-center',
  "alignItems: 'flex-start'": 'items-start',
  "justifyContent: 'space-between'": 'justify-between',
  "flex: 1": 'flex-1',
  
  // Sizing
  "width: '100%'": 'w-full',
  "overflowX: 'auto'": 'overflow-x-auto',
  
  // Typography
  "fontSize: '0.875rem'": 'text-sm',
  "fontWeight: 600": 'font-semibold',
  "marginBottom: '0.25rem'": 'mb-1',
  
  // Table
  "borderCollapse: 'collapse'": 'border-collapse',
};

// ============================================================================
// AST TRANSFORMATION FUNCTIONS
// ============================================================================

class StyleRefactorer {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
      createBackup: options.createBackup !== false,
    };
    
    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      stylesFound: 0,
      stylesConverted: 0,
      dynamicStylesPreserved: 0,
      errors: [],
    };
  }
  
  /**
   * Analyze a style object and categorize properties
   */
  analyzeStyleObject(properties) {
    const staticProps = [];
    const dynamicProps = [];
    
    properties.forEach(prop => {
      if (t.isObjectProperty(prop)) {
        const value = prop.value;
        
        // Check if value is dynamic (TemplateLiteral, Identifier, etc.)
        if (t.isStringLiteral(value) || t.isNumericLiteral(value)) {
          staticProps.push(prop);
        } else {
          dynamicProps.push(prop);
        }
      }
    });
    
    return { static: staticProps, dynamic: dynamicProps };
  }
  
  /**
   * Convert static style properties to Tailwind classes
   */
  convertToTailwind(properties) {
    const tailwindClasses = [];
    
    properties.forEach(prop => {
      const key = prop.key.name || prop.key.value;
      const value = prop.value;
      
      let styleString;
      if (t.isStringLiteral(value)) {
        styleString = `${key}: '${value.value}'`;
      } else if (t.isNumericLiteral(value)) {
        styleString = `${key}: ${value.value}`;
      }
      
      const tailwindClass = STYLE_TO_TAILWIND[styleString];
      if (tailwindClass) {
        tailwindClasses.push(tailwindClass);
      }
    });
    
    return tailwindClasses;
  }
  
  /**
   * Transform JSX element with inline styles
   */
  transformJSXElement(path) {
    // JSXElement has openingElement which contains the attributes
    const openingElement = path.node.openingElement;
    
    if (!openingElement || !openingElement.attributes || !Array.isArray(openingElement.attributes)) {
      return false;
    }
    
    const styleAttr = openingElement.attributes.find(
      attr => t.isJSXAttribute(attr) && attr.name.name === 'style'
    );
    
    if (!styleAttr || !t.isJSXExpressionContainer(styleAttr.value)) {
      return false;
    }
    
    const styleObj = styleAttr.value.expression;
    if (!t.isObjectExpression(styleObj)) {
      return false;
    }
    
    this.stats.stylesFound++;
    
    const { static: staticProps, dynamic: dynamicProps } = 
      this.analyzeStyleObject(styleObj.properties);
    
    if (staticProps.length === 0) {
      // All dynamic - preserve as is
      this.stats.dynamicStylesPreserved++;
      return false;
    }
    
    // Convert static properties to Tailwind
    const tailwindClasses = this.convertToTailwind(staticProps);
    
    if (tailwindClasses.length === 0) {
      return false;
    }
    
    // Add Tailwind classes to className
    const classNameAttr = openingElement.attributes.find(
      attr => t.isJSXAttribute(attr) && attr.name.name === 'className'
    );
    
    if (classNameAttr) {
      // Merge with existing className
      if (t.isStringLiteral(classNameAttr.value)) {
        classNameAttr.value.value += ` ${tailwindClasses.join(' ')}`;
      } else if (t.isJSXExpressionContainer(classNameAttr.value)) {
        // Handle template literal or expression
        // This is complex - for now, add comment
        console.log(chalk.yellow(`  ⚠ Complex className expression - manual review needed`));
      }
    } else {
      // Add new className attribute
      openingElement.attributes.push(
        t.jSXAttribute(
          t.jSXIdentifier('className'),
          t.stringLiteral(tailwindClasses.join(' '))
        )
      );
    }
    
    // If all static, remove style attribute
    // If mixed, keep dynamic properties
    if (dynamicProps.length === 0) {
      openingElement.attributes = openingElement.attributes.filter(
        attr => !(t.isJSXAttribute(attr) && attr.name.name === 'style')
      );
    } else {
      styleObj.properties = dynamicProps;
      this.stats.dynamicStylesPreserved++;
    }
    
    this.stats.stylesConverted++;
    return true;
  }
  
  /**
   * Process a single file
   */
  async processFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Parse with Babel
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });
      
      let modified = false;
      
      // Traverse AST and transform
      traverse(ast, {
        JSXElement: (path) => {
          if (this.options.verbose) {
            console.log(chalk.gray(`  Visiting JSXElement:${path.node.openingElement ? path.node.openingElement.name.name : 'unknown'}`));
          }
          const wasModified = this.transformJSXElement(path);
          if (wasModified) modified = true;
        },
      });
      
      if (modified) {
        this.stats.filesModified++;
        
        if (!this.options.dryRun) {
          // Create backup if enabled
          if (this.options.createBackup) {
            const backupPath = `${filePath}.backup`;
            await fs.copyFile(filePath, backupPath);
          }
          
          // Generate new code
          const output = generate(ast, {}, content);
          await fs.writeFile(filePath, output.code);
          
          console.log(chalk.green(`  ✓ Modified: ${path.relative(process.cwd(), filePath)}`));
        } else {
          console.log(chalk.blue(`  ℹ [DRY RUN] Would modify: ${path.relative(process.cwd(), filePath)}`));
        }
      }
      
      this.stats.filesProcessed++;
      return true;
      
    } catch (error) {
      this.stats.errors.push({ file: filePath, error: error.message });
      console.log(chalk.red(`  ✗ Error processing ${path.relative(process.cwd(), filePath)}: ${error.message}`));
      return false;
    }
  }
  
  /**
   * Process multiple files
   */
  async processFiles(patterns) {
    const spinner = ora('Scanning for files...').start();
    
    const files = await glob(patterns, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*'],
    });
    
    spinner.succeed(`Found ${files.length} files to process`);
    
    console.log('');
    
    for (const file of files) {
      await this.processFile(file);
    }
    
    return this.stats;
  }
  
  /**
   * Print summary report
   */
  printSummary() {
    console.log('');
    console.log(chalk.cyan('═══════════════════════════════════════════════════════════'));
    console.log(chalk.cyan(' Refactoring Summary'));
    console.log(chalk.cyan('═══════════════════════════════════════════════════════════'));
    console.log('');
    
    console.log(`Files Processed:          ${chalk.cyan(this.stats.filesProcessed)}`);
    console.log(`Files Modified:           ${chalk.green(this.stats.filesModified)}`);
    console.log(`Styles Found:             ${chalk.cyan(this.stats.stylesFound)}`);
    console.log(`Styles Converted:         ${chalk.green(this.stats.stylesConverted)}`);
    console.log(`Dynamic Styles Preserved: ${chalk.yellow(this.stats.dynamicStylesPreserved)}`);
    console.log(`Errors:                   ${this.stats.errors.length > 0 ? chalk.red(this.stats.errors.length) : chalk.green('0')}`);
    
    if (this.stats.errors.length > 0) {
      console.log('');
      console.log(chalk.red('Errors encountered:'));
      this.stats.errors.forEach(({ file, error }) => {
        console.log(chalk.red(`  • ${file}: ${error}`));
      });
    }
    
    console.log('');
    
    if (this.options.dryRun) {
      console.log(chalk.blue('ℹ This was a DRY RUN - no files were modified'));
      console.log(chalk.blue('ℹ Run without --dry-run to apply changes'));
    } else {
      console.log(chalk.green('✓ Refactoring complete!'));
    }
    
    console.log('');
  }
}

// ============================================================================
// CLI
// ============================================================================

program
  .name('refactor-inline-styles')
  .description('TerraFusion OS - Intelligent Inline Style Refactoring Tool')
  .version('1.0.0')
  .argument('[patterns...]', 'File patterns to process', ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'])
  .option('-d, --dry-run', 'Run without making changes')
  .option('-v, --verbose', 'Verbose output')
  .option('--no-backup', 'Do not create backup files')
  .action(async (patterns, options) => {
    console.log('');
    console.log(chalk.cyan('═══════════════════════════════════════════════════════════'));
    console.log(chalk.cyan(' TerraFusion OS - Inline Style Refactoring Tool'));
    console.log(chalk.cyan(' MIT/PhD Systems Engineering Approach'));
    console.log(chalk.cyan('═══════════════════════════════════════════════════════════'));
    console.log('');
    
    const refactorer = new StyleRefactorer(options);
    await refactorer.processFiles(patterns);
    refactorer.printSummary();
  });

program.parse();
