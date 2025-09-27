/**
 * Terrafusion Plugin Validation System
 * Comprehensive validation for plugin certification and marketplace submission
 */

import { PluginManifest } from '../TerraFusionSDK';
import { SecurityScanner } from '../../services/SecurityScanner';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: 'structure' | 'security' | 'performance' | 'compliance' | 'quality';
  severity: 'error' | 'warning' | 'info';
  validator: (context: ValidationContext) => Promise<ValidationResult>;
}

export interface ValidationContext {
  manifest: PluginManifest;
  sourceCode: Map<string, string>;
  dependencies: string[];
  pluginPath: string;
  testResults?: any;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  details?: any;
  suggestions?: string[];
  score?: number;
}

export interface ValidationReport {
  pluginId: string;
  pluginName: string;
  version: string;
  timestamp: string;
  overallScore: number;
  certificationLevel: 'failed' | 'basic' | 'standard' | 'premium' | 'enterprise';
  categories: {
    structure: CategoryResult;
    security: CategoryResult;
    performance: CategoryResult;
    compliance: CategoryResult;
    quality: CategoryResult;
  };
  violations: ValidationViolation[];
  recommendations: string[];
  readyForMarketplace: boolean;
}

export interface CategoryResult {
  score: number;
  maxScore: number;
  passed: boolean;
  violations: ValidationViolation[];
}

export interface ValidationViolation {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
  suggestions: string[];
}

export class PluginValidator {
  private rules: ValidationRule[] = [];
  private securityScanner: SecurityScanner;

  constructor() {
    this.securityScanner = new SecurityScanner();
    this.initializeRules();
  }

  async validatePlugin(context: ValidationContext): Promise<ValidationReport> {
    const startTime = Date.now();
    const violations: ValidationViolation[] = [];
    const categoryScores = {
      structure: { score: 0, maxScore: 0, violations: [] as ValidationViolation[] },
      security: { score: 0, maxScore: 0, violations: [] as ValidationViolation[] },
      performance: { score: 0, maxScore: 0, violations: [] as ValidationViolation[] },
      compliance: { score: 0, maxScore: 0, violations: [] as ValidationViolation[] },
      quality: { score: 0, maxScore: 0, violations: [] as ValidationViolation[] },
    };

    // Run all validation rules
    for (const rule of this.rules) {
      try {
        const result = await rule.validator(context);
        categoryScores[rule.category].maxScore += 100;

        if (result.passed) {
          categoryScores[rule.category].score += result.score || 100;
        } else {
          const violation: ValidationViolation = {
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            severity: rule.severity,
            message: result.message,
            suggestions: result.suggestions || [],
          };

          violations.push(violation);
          categoryScores[rule.category].violations.push(violation);

          // Partial score for warnings and info
          if (rule.severity === 'warning') {
            categoryScores[rule.category].score += 50;
          } else if (rule.severity === 'info') {
            categoryScores[rule.category].score += 75;
          }
        }
      } catch (error) {
        const violation: ValidationViolation = {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          severity: 'error',
          message: `Validation rule failed: ${error.message}`,
          suggestions: ['Review plugin structure and fix validation errors'],
        };
        violations.push(violation);
        categoryScores[rule.category].violations.push(violation);
      }
    }

    // Calculate overall score and certification level
    const totalScore = Object.values(categoryScores).reduce((sum, cat) => sum + cat.score, 0);
    const maxTotalScore = Object.values(categoryScores).reduce((sum, cat) => sum + cat.maxScore, 0);
    const overallScore = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

    const certificationLevel = this.determineCertificationLevel(overallScore, violations);
    const readyForMarketplace =
      certificationLevel !== 'failed' &&
      violations.filter(v => v.severity === 'error').length === 0;

    return {
      pluginId: context.manifest.id,
      pluginName: context.manifest.name,
      version: context.manifest.version,
      timestamp: new Date().toISOString(),
      overallScore: Math.round(overallScore),
      certificationLevel,
      categories: {
        structure: {
          score: Math.round(categoryScores.structure.score),
          maxScore: categoryScores.structure.maxScore,
          passed:
            categoryScores.structure.violations.filter(v => v.severity === 'error').length === 0,
          violations: categoryScores.structure.violations,
        },
        security: {
          score: Math.round(categoryScores.security.score),
          maxScore: categoryScores.security.maxScore,
          passed:
            categoryScores.security.violations.filter(v => v.severity === 'error').length === 0,
          violations: categoryScores.security.violations,
        },
        performance: {
          score: Math.round(categoryScores.performance.score),
          maxScore: categoryScores.performance.maxScore,
          passed:
            categoryScores.performance.violations.filter(v => v.severity === 'error').length === 0,
          violations: categoryScores.performance.violations,
        },
        compliance: {
          score: Math.round(categoryScores.compliance.score),
          maxScore: categoryScores.compliance.maxScore,
          passed:
            categoryScores.compliance.violations.filter(v => v.severity === 'error').length === 0,
          violations: categoryScores.compliance.violations,
        },
        quality: {
          score: Math.round(categoryScores.quality.score),
          maxScore: categoryScores.quality.maxScore,
          passed:
            categoryScores.quality.violations.filter(v => v.severity === 'error').length === 0,
          violations: categoryScores.quality.violations,
        },
      },
      violations,
      recommendations: this.generateRecommendations(violations, overallScore),
      readyForMarketplace,
    };
  }

  private initializeRules(): void {
    // Structure Validation Rules
    this.rules.push({
      id: 'manifest-required-fields',
      name: 'Manifest Required Fields',
      description: 'Plugin manifest must contain all required fields',
      category: 'structure',
      severity: 'error',
      validator: async context => {
        const required = ['id', 'name', 'version', 'description', 'author', 'terrafusion'];
        const missing = required.filter(field => !context.manifest[field]);

        if (missing.length > 0) {
          return {
            passed: false,
            message: `Missing required manifest fields: ${missing.join(', ')}`,
            suggestions: [`Add missing fields to plugin manifest: ${missing.join(', ')}`],
          };
        }

        return { passed: true, message: 'All required manifest fields present' };
      },
    });

    this.rules.push({
      id: 'version-format',
      name: 'Version Format',
      description: 'Plugin version must follow semantic versioning',
      category: 'structure',
      severity: 'error',
      validator: async context => {
        const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/;

        if (!versionRegex.test(context.manifest.version)) {
          return {
            passed: false,
            message: `Invalid version format: ${context.manifest.version}`,
            suggestions: ['Use semantic versioning format (e.g., 1.0.0, 1.2.3-beta)'],
          };
        }

        return { passed: true, message: 'Version format is valid' };
      },
    });

    this.rules.push({
      id: 'main-entry-exists',
      name: 'Main Entry Point',
      description: 'Plugin main entry point must exist',
      category: 'structure',
      severity: 'error',
      validator: async context => {
        const mainFile = context.manifest.main || 'index.js';
        const hasMainFile =
          context.sourceCode.has(mainFile) ||
          context.sourceCode.has('src/index.ts') ||
          context.sourceCode.has('dist/index.js');

        if (!hasMainFile) {
          return {
            passed: false,
            message: `Main entry point not found: ${mainFile}`,
            suggestions: ['Create the main entry point file specified in manifest'],
          };
        }

        return { passed: true, message: 'Main entry point exists' };
      },
    });

    // Security Validation Rules
    this.rules.push({
      id: 'permission-validation',
      name: 'Permission Validation',
      description: 'Plugin permissions must be properly declared and justified',
      category: 'security',
      severity: 'error',
      validator: async context => {
        const permissions = context.manifest.terrafusion?.permissions || [];

        if (permissions.length === 0) {
          return {
            passed: false,
            message: 'No permissions declared - plugins must declare required permissions',
            suggestions: ['Add required permissions to manifest.terrafusion.permissions'],
          };
        }

        const invalidPermissions = permissions.filter(
          perm => !perm.type || !perm.scope || !perm.description
        );

        if (invalidPermissions.length > 0) {
          return {
            passed: false,
            message: 'Invalid permission declarations found',
            suggestions: ['Ensure all permissions have type, scope, and description fields'],
          };
        }

        return { passed: true, message: 'Permissions properly declared' };
      },
    });

    this.rules.push({
      id: 'security-scan',
      name: 'Security Vulnerability Scan',
      description: 'Plugin code must pass security vulnerability scanning',
      category: 'security',
      severity: 'error',
      validator: async context => {
        try {
          const scanResults = await this.securityScanner.scanPlugin({
            id: context.manifest.id,
            name: context.manifest.name,
            version: context.manifest.version,
            sourceFiles: Array.from(context.sourceCode.entries()).map(([path, content]) => ({
              path,
              content,
              size: content.length,
            })),
            dependencies: context.dependencies,
          });

          const criticalVulns = scanResults.vulnerabilities.filter(v => v.severity === 'critical');
          const highVulns = scanResults.vulnerabilities.filter(v => v.severity === 'high');

          if (criticalVulns.length > 0) {
            return {
              passed: false,
              message: `Critical security vulnerabilities found: ${criticalVulns.length}`,
              suggestions: ['Fix all critical security vulnerabilities before submission'],
            };
          }

          if (highVulns.length > 0) {
            return {
              passed: false,
              message: `High severity security vulnerabilities found: ${highVulns.length}`,
              suggestions: ['Fix high severity security vulnerabilities'],
            };
          }

          return {
            passed: true,
            message: 'No critical security vulnerabilities found',
            score: Math.max(0, 100 - scanResults.vulnerabilities.length * 5),
          };
        } catch (error) {
          return {
            passed: false,
            message: `Security scan failed: ${error.message}`,
            suggestions: ['Ensure plugin code is accessible for security scanning'],
          };
        }
      },
    });

    // Performance Validation Rules
    this.rules.push({
      id: 'bundle-size',
      name: 'Bundle Size Check',
      description: 'Plugin bundle size should be reasonable',
      category: 'performance',
      severity: 'warning',
      validator: async context => {
        const totalSize = Array.from(context.sourceCode.values()).reduce(
          (sum, content) => sum + content.length,
          0
        );

        const maxSize = 5 * 1024 * 1024; // 5MB
        const warningSize = 2 * 1024 * 1024; // 2MB

        if (totalSize > maxSize) {
          return {
            passed: false,
            message: `Plugin bundle too large: ${(totalSize / 1024 / 1024).toFixed(2)}MB`,
            suggestions: ['Optimize bundle size by removing unused dependencies and code'],
          };
        }

        if (totalSize > warningSize) {
          return {
            passed: true,
            message: `Plugin bundle size is large: ${(totalSize / 1024 / 1024).toFixed(2)}MB`,
            score: 75,
            suggestions: ['Consider optimizing bundle size for better performance'],
          };
        }

        return {
          passed: true,
          message: `Plugin bundle size is optimal: ${(totalSize / 1024 / 1024).toFixed(2)}MB`,
          score: 100,
        };
      },
    });

    // Compliance Validation Rules
    this.rules.push({
      id: 'terrafusion-compatibility',
      name: 'Terrafusion Compatibility',
      description: 'Plugin must specify compatible Terrafusion version',
      category: 'compliance',
      severity: 'error',
      validator: async context => {
        const minVersion = context.manifest.terrafusion?.minVersion;

        if (!minVersion) {
          return {
            passed: false,
            message: 'Terrafusion minimum version not specified',
            suggestions: ['Add terrafusion.minVersion to manifest'],
          };
        }

        const versionRegex = /^\d+\.\d+\.\d+$/;
        if (!versionRegex.test(minVersion)) {
          return {
            passed: false,
            message: `Invalid Terrafusion version format: ${minVersion}`,
            suggestions: ['Use semantic versioning format for minVersion'],
          };
        }

        return { passed: true, message: 'Terrafusion compatibility specified' };
      },
    });

    this.rules.push({
      id: 'compliance-standards',
      name: 'Compliance Standards',
      description: 'Plugin must declare compliance with required standards',
      category: 'compliance',
      severity: 'warning',
      validator: async context => {
        const compliance = context.manifest.terrafusion?.compliance || [];
        const requiredStandards = ['CountyOS'];

        const missingStandards = requiredStandards.filter(
          standard => !compliance.some(comp => comp.standard === standard)
        );

        if (missingStandards.length > 0) {
          return {
            passed: false,
            message: `Missing compliance declarations: ${missingStandards.join(', ')}`,
            suggestions: ['Add required compliance standards to manifest'],
          };
        }

        return { passed: true, message: 'Compliance standards declared' };
      },
    });

    // Quality Validation Rules
    this.rules.push({
      id: 'documentation-quality',
      name: 'Documentation Quality',
      description: 'Plugin should have comprehensive documentation',
      category: 'quality',
      severity: 'warning',
      validator: async context => {
        const hasReadme =
          context.sourceCode.has('README.md') || context.sourceCode.has('readme.md');

        if (!hasReadme) {
          return {
            passed: false,
            message: 'README.md file not found',
            suggestions: ['Add comprehensive README.md with usage instructions'],
          };
        }

        const readme =
          context.sourceCode.get('README.md') || context.sourceCode.get('readme.md') || '';
        const minLength = 500; // Minimum documentation length

        if (readme.length < minLength) {
          return {
            passed: false,
            message: 'Documentation is too brief',
            score: 60,
            suggestions: ['Expand documentation with detailed usage examples and API reference'],
          };
        }

        return { passed: true, message: 'Documentation quality is good', score: 100 };
      },
    });

    this.rules.push({
      id: 'test-coverage',
      name: 'Test Coverage',
      description: 'Plugin should include comprehensive tests',
      category: 'quality',
      severity: 'info',
      validator: async context => {
        const hasTests = Array.from(context.sourceCode.keys()).some(
          path =>
            path.includes('test') ||
            path.includes('spec') ||
            path.endsWith('.test.ts') ||
            path.endsWith('.spec.ts')
        );

        if (!hasTests) {
          return {
            passed: false,
            message: 'No test files found',
            score: 50,
            suggestions: ['Add comprehensive test suite for better quality assurance'],
          };
        }

        return { passed: true, message: 'Test files present', score: 100 };
      },
    });
  }

  private determineCertificationLevel(
    score: number,
    violations: ValidationViolation[]
  ): 'failed' | 'basic' | 'standard' | 'premium' | 'enterprise' {
    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;

    if (errorCount > 0 || score < 50) {
      return 'failed';
    } else if (score >= 95 && warningCount === 0) {
      return 'enterprise';
    } else if (score >= 85 && warningCount <= 2) {
      return 'premium';
    } else if (score >= 70 && warningCount <= 5) {
      return 'standard';
    } else {
      return 'basic';
    }
  }

  private generateRecommendations(violations: ValidationViolation[], score: number): string[] {
    const recommendations: string[] = [];

    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;

    if (errorCount > 0) {
      recommendations.push(`Fix ${errorCount} critical error(s) before marketplace submission`);
    }

    if (warningCount > 0) {
      recommendations.push(`Address ${warningCount} warning(s) to improve plugin quality`);
    }

    if (score < 70) {
      recommendations.push('Improve overall plugin quality to meet marketplace standards');
    }

    if (score >= 95) {
      recommendations.push('Excellent plugin quality! Ready for enterprise certification.');
    }

    const securityViolations = violations.filter(v => v.category === 'security');
    if (securityViolations.length > 0) {
      recommendations.push('Address security vulnerabilities to ensure plugin safety');
    }

    const performanceViolations = violations.filter(v => v.category === 'performance');
    if (performanceViolations.length > 0) {
      recommendations.push('Optimize plugin performance for better user experience');
    }

    return recommendations;
  }

  addCustomRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  getRules(): ValidationRule[] {
    return [...this.rules];
  }
}

// Export default validator instance
export const pluginValidator = new PluginValidator();
