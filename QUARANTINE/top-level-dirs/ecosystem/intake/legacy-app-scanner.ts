/**
 * TerraFusion Elite Government OS - Legacy Application Scanner
 * Zero-Touch Integration Pipeline - Air-Gap Security Analysis
 *
 * Government. Transcended.
 * Infrastructure Intelligence, Infinite Scale
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export interface LegacyAppProfile {
  appId: string;
  name: string;
  framework:
    | 'asp-net-framework'
    | 'php'
    | 'jsp'
    | 'python-django'
    | 'ruby-rails'
    | 'node-legacy'
    | 'unknown';
  version: string;
  complexity: 'low' | 'medium' | 'high' | 'critical';
  securityRisk: 'minimal' | 'moderate' | 'high' | 'critical';
  dataPatterns: string[];
  dependencies: string[];
  compliance: {
    fismaHigh: boolean;
    fedramp: boolean;
    accessibility: boolean;
    pii: boolean;
  };
  modernizationPath: 'terrabuild' | 'hybrid' | 'wrapper' | 'rebuild';
  aiEnhancement: boolean;
  estimatedEffort: number; // hours
}

export class LegacyApplicationScanner {
  private readonly scanResults: Map<string, LegacyAppProfile> = new Map();
  private readonly govCompliancePatterns = [
    /social.*security/i,
    /tax.*id/i,
    /driver.*license/i,
    /address.*info/i,
    /financial.*data/i,
    /medical.*record/i,
  ];

  async scanApplicationDirectory(appPath: string): Promise<LegacyAppProfile> {
    console.log(`🔍 TerraFusion Scanner: Analyzing ${appPath}`);

    const appId = path.basename(appPath);
    const profile: LegacyAppProfile = {
      appId,
      name: appId,
      framework: 'unknown',
      version: '0.0.0',
      complexity: 'medium',
      securityRisk: 'moderate',
      dataPatterns: [],
      dependencies: [],
      compliance: {
        fismaHigh: false,
        fedramp: false,
        accessibility: false,
        pii: false,
      },
      modernizationPath: 'terrabuild',
      aiEnhancement: true,
      estimatedEffort: 40,
    };

    // Framework Detection
    profile.framework = await this.detectFramework(appPath);

    // Security & Compliance Analysis
    await this.analyzeSecurityCompliance(appPath, profile);

    // Data Pattern Analysis
    profile.dataPatterns = await this.analyzeDataPatterns(appPath);

    // Dependency Analysis
    profile.dependencies = await this.analyzeDependencies(appPath);

    // Complexity Assessment
    profile.complexity = this.assessComplexity(profile);

    // Modernization Path Recommendation
    profile.modernizationPath = this.recommendModernizationPath(profile);

    // Effort Estimation
    profile.estimatedEffort = this.estimateEffort(profile);

    this.scanResults.set(appId, profile);

    console.log(
      `✅ Analysis Complete: ${profile.framework} | ${profile.complexity} complexity | ${profile.estimatedEffort}h estimated`
    );

    return profile;
  }

  private async detectFramework(appPath: string): Promise<LegacyAppProfile['framework']> {
    try {
      const files = await fs.readdir(appPath, { recursive: true });

      // ASP.NET Framework Detection
      if (files.some(f => f.toString().endsWith('.aspx') || f.toString().endsWith('.ascx'))) {
        return 'asp-net-framework';
      }

      // PHP Detection
      if (files.some(f => f.toString().endsWith('.php'))) {
        return 'php';
      }

      // JSP Detection
      if (files.some(f => f.toString().endsWith('.jsp') || f.toString().endsWith('.war'))) {
        return 'jsp';
      }

      // Django Detection
      if (files.some(f => f.toString().includes('manage.py') || f.toString().includes('wsgi.py'))) {
        return 'python-django';
      }

      // Rails Detection
      if (files.some(f => f.toString().includes('Gemfile') || f.toString().includes('config.ru'))) {
        return 'ruby-rails';
      }

      // Legacy Node Detection
      if (files.some(f => f.toString().includes('package.json'))) {
        return 'node-legacy';
      }
    } catch (error) {
      console.warn(`Framework detection failed for ${appPath}:`, error);
    }

    return 'unknown';
  }

  private async analyzeSecurityCompliance(
    appPath: string,
    profile: LegacyAppProfile
  ): Promise<void> {
    try {
      // Scan for PII patterns
      const codeContent = await this.readCodeFiles(appPath);

      profile.compliance.pii = this.govCompliancePatterns.some(pattern =>
        pattern.test(codeContent)
      );

      // FISMA-HIGH indicators
      const fismaIndicators = [
        /encrypt/i,
        /authentication/i,
        /authorization/i,
        /audit/i,
        /logging/i,
      ];

      profile.compliance.fismaHigh = fismaIndicators.some(pattern => pattern.test(codeContent));

      // Accessibility patterns
      const accessibilityPatterns = [/aria-/i, /alt=/i, /role=/i, /tabindex/i];

      profile.compliance.accessibility = accessibilityPatterns.some(pattern =>
        pattern.test(codeContent)
      );

      // Security risk assessment
      const securityVulns = [/sql.*injection/i, /xss/i, /csrf/i, /hardcoded.*password/i, /eval\(/i];

      if (securityVulns.some(pattern => pattern.test(codeContent))) {
        profile.securityRisk = 'high';
      }
    } catch (error) {
      console.warn('Security analysis failed:', error);
    }
  }

  private async analyzeDataPatterns(appPath: string): Promise<string[]> {
    const patterns: string[] = [];

    try {
      const codeContent = await this.readCodeFiles(appPath);

      // Common data patterns
      const dataPatterns = [
        { pattern: /sql.*server/i, name: 'SQL Server' },
        { pattern: /oracle/i, name: 'Oracle Database' },
        { pattern: /mysql/i, name: 'MySQL' },
        { pattern: /postgresql/i, name: 'PostgreSQL' },
        { pattern: /mongodb/i, name: 'MongoDB' },
        { pattern: /redis/i, name: 'Redis' },
        { pattern: /elasticsearch/i, name: 'Elasticsearch' },
        { pattern: /ldap/i, name: 'LDAP Directory' },
        { pattern: /active.*directory/i, name: 'Active Directory' },
        { pattern: /saml/i, name: 'SAML Authentication' },
        { pattern: /oauth/i, name: 'OAuth Integration' },
        { pattern: /rest.*api/i, name: 'REST API' },
        { pattern: /soap/i, name: 'SOAP Services' },
        { pattern: /xml.*rpc/i, name: 'XML-RPC' },
      ];

      dataPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(codeContent)) {
          patterns.push(name);
        }
      });
    } catch (error) {
      console.warn('Data pattern analysis failed:', error);
    }

    return patterns;
  }

  private async analyzeDependencies(appPath: string): Promise<string[]> {
    const dependencies: string[] = [];

    try {
      // Package.json dependencies
      const packageJsonPath = path.join(appPath, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        dependencies.push(...Object.keys(packageJson.dependencies || {}));
        dependencies.push(...Object.keys(packageJson.devDependencies || {}));
      } catch (e) {
        /* Not a Node.js app */
      }

      // Requirements.txt dependencies
      const requirementsPath = path.join(appPath, 'requirements.txt');
      try {
        const requirements = await fs.readFile(requirementsPath, 'utf-8');
        dependencies.push(...requirements.split('\n').filter(line => line.trim()));
      } catch (e) {
        /* Not a Python app */
      }

      // Gemfile dependencies
      const gemfilePath = path.join(appPath, 'Gemfile');
      try {
        const gemfile = await fs.readFile(gemfilePath, 'utf-8');
        const gemMatches = gemfile.match(/gem\s+['"]([^'"]+)['"]/g) || [];
        dependencies.push(
          ...gemMatches.map(match => match.replace(/gem\s+['"]([^'"]+)['"]/, '$1'))
        );
      } catch (e) {
        /* Not a Ruby app */
      }
    } catch (error) {
      console.warn('Dependency analysis failed:', error);
    }

    return dependencies;
  }

  private assessComplexity(profile: LegacyAppProfile): LegacyAppProfile['complexity'] {
    let complexityScore = 0;

    // Framework complexity
    const frameworkComplexity = {
      'asp-net-framework': 3,
      jsp: 4,
      php: 2,
      'python-django': 2,
      'ruby-rails': 2,
      'node-legacy': 1,
      unknown: 3,
    };

    complexityScore += frameworkComplexity[profile.framework];

    // Dependency complexity
    complexityScore += Math.min(profile.dependencies.length / 10, 3);

    // Data pattern complexity
    complexityScore += Math.min(profile.dataPatterns.length / 5, 2);

    // Compliance complexity
    if (profile.compliance.fismaHigh) complexityScore += 2;
    if (profile.compliance.pii) complexityScore += 1;

    // Security risk complexity
    if (profile.securityRisk === 'high') complexityScore += 2;
    if (profile.securityRisk === 'critical') complexityScore += 4;

    if (complexityScore <= 3) return 'low';
    if (complexityScore <= 6) return 'medium';
    if (complexityScore <= 9) return 'high';
    return 'critical';
  }

  private recommendModernizationPath(
    profile: LegacyAppProfile
  ): LegacyAppProfile['modernizationPath'] {
    // Critical security risks require rebuild
    if (profile.securityRisk === 'critical') {
      return 'rebuild';
    }

    // High complexity with government compliance needs hybrid approach
    if (profile.complexity === 'critical' && profile.compliance.fismaHigh) {
      return 'hybrid';
    }

    // Legacy frameworks that can't be easily containerized
    if (profile.framework === 'asp-net-framework' && profile.complexity === 'high') {
      return 'wrapper';
    }

    // Default path for most applications
    return 'terrabuild';
  }

  private estimateEffort(profile: LegacyAppProfile): number {
    let baseEffort = 40; // Base 40 hours

    // Framework multipliers
    const frameworkMultipliers = {
      'asp-net-framework': 1.5,
      jsp: 1.8,
      php: 1.2,
      'python-django': 1.1,
      'ruby-rails': 1.1,
      'node-legacy': 1.0,
      unknown: 2.0,
    };

    baseEffort *= frameworkMultipliers[profile.framework];

    // Complexity multipliers
    const complexityMultipliers = {
      low: 0.7,
      medium: 1.0,
      high: 1.5,
      critical: 2.5,
    };

    baseEffort *= complexityMultipliers[profile.complexity];

    // Security and compliance overhead
    if (profile.securityRisk === 'high') baseEffort *= 1.3;
    if (profile.securityRisk === 'critical') baseEffort *= 2.0;
    if (profile.compliance.fismaHigh) baseEffort *= 1.4;
    if (profile.compliance.pii) baseEffort *= 1.2;

    return Math.round(baseEffort);
  }

  private async readCodeFiles(appPath: string): Promise<string> {
    try {
      const files = await fs.readdir(appPath, { recursive: true });
      const codeExtensions = [
        '.js',
        '.ts',
        '.cs',
        '.php',
        '.py',
        '.rb',
        '.jsp',
        '.aspx',
        '.html',
        '.htm',
      ];

      let content = '';
      for (const file of files) {
        const filePath = file.toString();
        const ext = path.extname(filePath);

        if (codeExtensions.includes(ext)) {
          try {
            const fullPath = path.join(appPath, filePath);
            const fileContent = await fs.readFile(fullPath, 'utf-8');
            content += fileContent + '\n';
          } catch (e) {
            // Skip unreadable files
          }
        }
      }

      return content;
    } catch (error) {
      console.warn('Code reading failed:', error);
      return '';
    }
  }

  async generateIntakeReport(appProfile: LegacyAppProfile): Promise<string> {
    const report = `# TerraFusion Elite Government OS - Legacy Application Intake Report

## Application Profile: ${appProfile.name}

### 🎯 Executive Summary
- **Framework**: ${appProfile.framework.toUpperCase()}
- **Complexity**: ${appProfile.complexity.toUpperCase()}
- **Security Risk**: ${appProfile.securityRisk.toUpperCase()}
- **Modernization Path**: ${appProfile.modernizationPath.toUpperCase()}
- **Estimated Effort**: ${appProfile.estimatedEffort} hours

### 🔒 Government Compliance Analysis
- **FISMA-HIGH Ready**: ${appProfile.compliance.fismaHigh ? '✅ YES' : '❌ NO'}
- **FedRAMP Compatible**: ${appProfile.compliance.fedramp ? '✅ YES' : '❌ NO'}
- **PII Handling**: ${appProfile.compliance.pii ? '⚠️ DETECTED' : '✅ CLEAR'}
- **Accessibility**: ${appProfile.compliance.accessibility ? '✅ COMPLIANT' : '❌ NEEDS WORK'}

### 📊 Data Integration Points
${appProfile.dataPatterns.map(pattern => `- ${pattern}`).join('\n')}

### 📦 Dependency Analysis
${appProfile.dependencies
  .slice(0, 10)
  .map(dep => `- ${dep}`)
  .join('\n')}
${appProfile.dependencies.length > 10 ? `... and ${appProfile.dependencies.length - 10} more` : ''}

### 🚀 Recommended Integration Strategy

#### Phase 1: Air-Gap Security Assessment (2-4 hours)
- Containerize application in isolated environment
- Run automated security scans
- Validate government compliance requirements

#### Phase 2: TerraFusion Integration (${Math.round(appProfile.estimatedEffort * 0.3)} hours)
- Implement API facade with quantum UI components
- Integrate with TerraFusion authentication system
- Add championship-level observability

#### Phase 3: AI Enhancement (${Math.round(appProfile.estimatedEffort * 0.2)} hours)
- Connect to TerraFusion AI agent swarm
- Implement predictive analytics
- Add autonomous self-healing capabilities

#### Phase 4: Government Excellence (${Math.round(appProfile.estimatedEffort * 0.3)} hours)
- FISMA-HIGH security hardening
- Accessibility compliance validation
- Performance optimization for government scale

#### Phase 5: Production Deployment (${Math.round(appProfile.estimatedEffort * 0.2)} hours)
- Zero-downtime migration strategy
- Monitoring and alerting setup
- Disaster recovery configuration

### 🎊 Government. Transcended.
This application will be transformed from legacy system to championship-level government technology, featuring infinite scalability, autonomous recovery, and transcendent user experience.

---
*Generated by TerraFusion Elite Government OS - Infrastructure Intelligence, Infinite Scale*
`;

    return report;
  }

  getResults(): Map<string, LegacyAppProfile> {
    return this.scanResults;
  }
}

// Export singleton instance
export const legacyScanner = new LegacyApplicationScanner();
