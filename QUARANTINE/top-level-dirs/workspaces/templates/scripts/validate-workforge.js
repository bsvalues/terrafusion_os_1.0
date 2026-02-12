/**
 * TerraFusion WorkForge Compatibility Validator
 * Government. Transcended. - Championship Excellence
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class WorkForgeValidator {
  constructor() {
    this.workspaceRoot = process.env.WORKSPACE_ROOT || process.cwd();
    this.validationResults = {
      structure: { passed: false, errors: [] },
      dependencies: { passed: false, errors: [] },
      quality: { passed: false, errors: [] },
      accessibility: { passed: false, errors: [] },
      performance: { passed: false, errors: [] },
      security: { passed: false, errors: [] }
    };
  }

  async validateWorkspace() {
    console.log('🔍 TerraFusion WorkForge Compatibility Validation');
    console.log('Government. Transcended. - Championship Excellence Standard');
    console.log(`📍 Workspace: ${this.workspaceRoot}`);
    console.log('═'.repeat(80));

    try {
      await this.validateStructure();
      await this.validateDependencies();
      await this.validateQuality();
      await this.validateAccessibility();
      await this.validatePerformance();
      await this.validateSecurity();

      await this.generateReport();

      const overallPassed = this.isOverallValidationPassed();

      if (overallPassed) {
        console.log('🎊 VALIDATION PASSED - WorkForge Compatible! 🎊');
        console.log('Championship Excellence: Government. Transcended.');
        process.exit(0);
      } else {
        console.log('❌ VALIDATION FAILED - See report for details');
        process.exit(1);
      }

    } catch (error) {
      console.error('💥 Validation Error:', error.message);
      process.exit(1);
    }
  }

  async validateStructure() {
    console.log('📁 Validating Workspace Structure...');

    const requiredFiles = [
      'README.md',
      'package.json',
      '.gitignore'
    ];

    const requiredDirs = [
      'src',
      'tests',
      'docs',
      '.vscode'
    ];

    const optionalFiles = [
      'tsconfig.json',
      'vite.config.ts',
      'jest.config.js',
      'playwright.config.ts',
      'docker-compose.yml'
    ];

    // Check required files
    for (const file of requiredFiles) {
      const filePath = path.join(this.workspaceRoot, file);
      if (!fs.existsSync(filePath)) {
        this.validationResults.structure.errors.push(`Missing required file: ${file}`);
      } else {
        console.log(`  ✅ ${file}`);
      }
    }

    // Check required directories
    for (const dir of requiredDirs) {
      const dirPath = path.join(this.workspaceRoot, dir);
      if (!fs.existsSync(dirPath)) {
        this.validationResults.structure.errors.push(`Missing required directory: ${dir}`);
      } else {
        console.log(`  ✅ ${dir}/`);
      }
    }

    // Check optional files (informational)
    for (const file of optionalFiles) {
      const filePath = path.join(this.workspaceRoot, file);
      if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file} (optional)`);
      }
    }

    // Validate VS Code configuration
    await this.validateVSCodeConfig();

    this.validationResults.structure.passed = this.validationResults.structure.errors.length === 0;
  }

  async validateVSCodeConfig() {
    const vscodeDir = path.join(this.workspaceRoot, '.vscode');

    if (fs.existsSync(vscodeDir)) {
      const requiredVSCodeFiles = [
        'settings.json',
        'extensions.json'
      ];

      for (const file of requiredVSCodeFiles) {
        const filePath = path.join(vscodeDir, file);
        if (!fs.existsSync(filePath)) {
          this.validationResults.structure.errors.push(`Missing VS Code config: .vscode/${file}`);
        } else {
          // Validate TerraFusion-specific settings
          try {
            const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (file === 'settings.json' && !config['terrafusion.workspace']) {
              this.validationResults.structure.errors.push('Missing TerraFusion workspace configuration in settings.json');
            }

            console.log(`  ✅ .vscode/${file}`);
          } catch (error) {
            this.validationResults.structure.errors.push(`Invalid JSON in .vscode/${file}: ${error.message}`);
          }
        }
      }
    }
  }

  async validateDependencies() {
    console.log('📦 Validating Dependencies...');

    const packageJsonPath = path.join(this.workspaceRoot, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      this.validationResults.dependencies.errors.push('No package.json found');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Check for TerraFusion required dependencies
      const requiredDeps = [
        '@terrafusion/sdk',
        '@terrafusion/ui-kit'
      ];

      const requiredDevDeps = [
        'typescript',
        '@types/node'
      ];

      // Validate dependencies
      const deps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};

      for (const dep of requiredDeps) {
        if (!deps[dep]) {
          this.validationResults.dependencies.errors.push(`Missing required dependency: ${dep}`);
        } else {
          console.log(`  ✅ ${dep}`);
        }
      }

      for (const dep of requiredDevDeps) {
        if (!devDeps[dep]) {
          this.validationResults.dependencies.errors.push(`Missing required dev dependency: ${dep}`);
        } else {
          console.log(`  ✅ ${dep} (dev)`);
        }
      }

      // Check for security vulnerabilities
      try {
        execSync('npm audit --audit-level=high', { cwd: this.workspaceRoot, stdio: 'pipe' });
        console.log('  ✅ No high-severity security vulnerabilities');
      } catch (error) {
        this.validationResults.dependencies.errors.push('High-severity security vulnerabilities found');
      }

      this.validationResults.dependencies.passed = this.validationResults.dependencies.errors.length === 0;

    } catch (error) {
      this.validationResults.dependencies.errors.push(`Invalid package.json: ${error.message}`);
    }
  }

  async validateQuality() {
    console.log('🏆 Validating Code Quality...');

    try {
      // Check if TypeScript is configured
      const tsconfigPath = path.join(this.workspaceRoot, 'tsconfig.json');
      if (fs.existsSync(tsconfigPath)) {
        console.log('  ✅ TypeScript configuration found');

        // Run TypeScript type check
        try {
          execSync('npx tsc --noEmit', { cwd: this.workspaceRoot, stdio: 'pipe' });
          console.log('  ✅ TypeScript type check passed');
        } catch (error) {
          this.validationResults.quality.errors.push('TypeScript type check failed');
        }
      }

      // Check for ESLint configuration
      const eslintConfigs = ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yml'];
      let hasEslint = false;

      for (const config of eslintConfigs) {
        if (fs.existsSync(path.join(this.workspaceRoot, config))) {
          hasEslint = true;
          console.log(`  ✅ ESLint configuration found: ${config}`);
          break;
        }
      }

      if (!hasEslint) {
        this.validationResults.quality.errors.push('No ESLint configuration found');
      }

      // Check for Prettier configuration
      const prettierConfigs = ['.prettierrc', '.prettierrc.json', '.prettierrc.js'];
      let hasPrettier = false;

      for (const config of prettierConfigs) {
        if (fs.existsSync(path.join(this.workspaceRoot, config))) {
          hasPrettier = true;
          console.log(`  ✅ Prettier configuration found: ${config}`);
          break;
        }
      }

      if (!hasPrettier) {
        this.validationResults.quality.errors.push('No Prettier configuration found');
      }

      // Check test coverage (if tests exist)
      const testDirs = ['tests', 'test', '__tests__', 'src/__tests__'];
      let hasTests = false;

      for (const dir of testDirs) {
        if (fs.existsSync(path.join(this.workspaceRoot, dir))) {
          hasTests = true;
          console.log(`  ✅ Test directory found: ${dir}`);
          break;
        }
      }

      if (!hasTests) {
        this.validationResults.quality.errors.push('No test directory found');
      }

      this.validationResults.quality.passed = this.validationResults.quality.errors.length === 0;

    } catch (error) {
      this.validationResults.quality.errors.push(`Quality validation error: ${error.message}`);
    }
  }

  async validateAccessibility() {
    console.log('♿ Validating Accessibility Standards...');

    // Check for accessibility testing tools
    const packageJsonPath = path.join(this.workspaceRoot, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        const accessibilityTools = [
          '@axe-core/react',
          'axe-core',
          '@testing-library/jest-dom',
          'jest-axe'
        ];

        let hasAccessibilityTooling = false;

        for (const tool of accessibilityTools) {
          if (allDeps[tool]) {
            console.log(`  ✅ Accessibility tool: ${tool}`);
            hasAccessibilityTooling = true;
          }
        }

        if (!hasAccessibilityTooling) {
          this.validationResults.accessibility.errors.push('No accessibility testing tools found');
        }

        this.validationResults.accessibility.passed = this.validationResults.accessibility.errors.length === 0;

      } catch (error) {
        this.validationResults.accessibility.errors.push(`Accessibility validation error: ${error.message}`);
      }
    }
  }

  async validatePerformance() {
    console.log('⚡ Validating Performance Standards...');

    // Check for performance monitoring tools
    const packageJsonPath = path.join(this.workspaceRoot, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        const performanceTools = [
          'lighthouse',
          'web-vitals',
          '@playwright/test'
        ];

        let hasPerformanceTooling = false;

        for (const tool of performanceTools) {
          if (allDeps[tool]) {
            console.log(`  ✅ Performance tool: ${tool}`);
            hasPerformanceTooling = true;
          }
        }

        if (!hasPerformanceTooling) {
          this.validationResults.performance.errors.push('No performance testing tools found');
        }

        this.validationResults.performance.passed = this.validationResults.performance.errors.length === 0;

      } catch (error) {
        this.validationResults.performance.errors.push(`Performance validation error: ${error.message}`);
      }
    }
  }

  async validateSecurity() {
    console.log('🛡️ Validating Security Standards...');

    try {
      // Check for security-related files
      const securityFiles = [
        '.env.example',
        'SECURITY.md'
      ];

      for (const file of securityFiles) {
        if (fs.existsSync(path.join(this.workspaceRoot, file))) {
          console.log(`  ✅ Security file: ${file}`);
        }
      }

      // Check for .env in .gitignore
      const gitignorePath = path.join(this.workspaceRoot, '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        if (gitignoreContent.includes('.env')) {
          console.log('  ✅ .env files properly ignored in .gitignore');
        } else {
          this.validationResults.security.errors.push('.env files not properly ignored in .gitignore');
        }
      }

      this.validationResults.security.passed = this.validationResults.security.errors.length === 0;

    } catch (error) {
      this.validationResults.security.errors.push(`Security validation error: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📋 VALIDATION REPORT');
    console.log('═'.repeat(80));

    const sections = [
      { name: 'Structure', key: 'structure', icon: '📁' },
      { name: 'Dependencies', key: 'dependencies', icon: '📦' },
      { name: 'Code Quality', key: 'quality', icon: '🏆' },
      { name: 'Accessibility', key: 'accessibility', icon: '♿' },
      { name: 'Performance', key: 'performance', icon: '⚡' },
      { name: 'Security', key: 'security', icon: '🛡️' }
    ];

    for (const section of sections) {
      const result = this.validationResults[section.key];
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';

      console.log(`${section.icon} ${section.name}: ${status}`);

      if (result.errors.length > 0) {
        for (const error of result.errors) {
          console.log(`  • ${error}`);
        }
      }
    }

    // Generate JSON report
    const reportPath = path.join(this.workspaceRoot, 'workforge-validation-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      workspace: path.basename(this.workspaceRoot),
      overallPassed: this.isOverallValidationPassed(),
      results: this.validationResults,
      summary: {
        totalChecks: Object.keys(this.validationResults).length,
        passed: Object.values(this.validationResults).filter(r => r.passed).length,
        failed: Object.values(this.validationResults).filter(r => !r.passed).length
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }

  isOverallValidationPassed() {
    return Object.values(this.validationResults).every(result => result.passed);
  }
}

// Main execution
async function main() {
  const validator = new WorkForgeValidator();
  await validator.validateWorkspace();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = WorkForgeValidator;
