#!/usr/bin/env node
/**
 * 🏛️ Section 508 Compliance Validation
 * Automated validation for federal accessibility standards
 */

const axe = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Section508Validator {
    constructor() {
        this.results = {
            compliance_score: 0,
            violations: [],
            passes: [],
            government_requirements: [],
            timestamp: new Date().toISOString()
        };
    }

    async validatePage(url) {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.goto(url);
        
        // Section 508 specific rules
        const section508Rules = [
            'color-contrast',
            'keyboard-navigation',
            'focus-management',
            'semantic-markup',
            'alternative-text',
            'form-labels',
            'error-identification',
            'page-structure',
            'link-purpose',
            'consistent-navigation'
        ];
        
        const results = await axe.analyze(page, {
            rules: section508Rules.reduce((acc, rule) => {
                acc[rule] = { enabled: true };
                return acc;
            }, {}),
            tags: ['section508', 'wcag21aa', 'government']
        });
        
        await browser.close();
        
        this.processResults(results);
        return this.generateReport();
    }

    processResults(results) {
        this.results.violations = results.violations.map(violation => ({
            id: violation.id,
            impact: violation.impact,
            description: violation.description,
            help: violation.help,
            helpUrl: violation.helpUrl,
            nodes: violation.nodes.length,
            government_priority: this.getGovernmentPriority(violation.id)
        }));
        
        this.results.passes = results.passes.map(pass => ({
            id: pass.id,
            description: pass.description
        }));
        
        this.calculateComplianceScore();
    }

    getGovernmentPriority(ruleId) {
        const highPriority = [
            'color-contrast',
            'keyboard-navigation',
            'focus-management',
            'alternative-text'
        ];
        
        const mediumPriority = [
            'form-labels',
            'semantic-markup',
            'page-structure'
        ];
        
        if (highPriority.includes(ruleId)) return 'HIGH';
        if (mediumPriority.includes(ruleId)) return 'MEDIUM';
        return 'LOW';
    }

    calculateComplianceScore() {
        const totalChecks = this.results.violations.length + this.results.passes.length;
        if (totalChecks === 0) {
            this.results.compliance_score = 100;
            return;
        }
        
        const passCount = this.results.passes.length;
        this.results.compliance_score = Math.round((passCount / totalChecks) * 100);
    }

    generateReport() {
        const report = {
            ...this.results,
            section_508_status: this.results.compliance_score >= 95 ? 'COMPLIANT' : 'NON_COMPLIANT',
            government_certification: this.results.compliance_score >= 98 ? 'CERTIFIED' : 'PENDING',
            recommendations: this.generateRecommendations()
        };
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        this.results.violations.forEach(violation => {
            if (violation.government_priority === 'HIGH') {
                recommendations.push({
                    priority: 'IMMEDIATE',
                    action: `Fix ${violation.description}`,
                    impact: 'Blocks government certification'
                });
            }
        });
        
        return recommendations;
    }
}

module.exports = Section508Validator;

// CLI usage
if (require.main === module) {
    const validator = new Section508Validator();
    const url = process.argv[2] || 'http://localhost:3000';
    
    validator.validatePage(url).then(report => {
        console.log('📋 Section 508 Compliance Report');
        console.log('═══════════════════════════════');
        console.log(`Compliance Score: ${report.compliance_score}%`);
        console.log(`Status: ${report.section_508_status}`);
        console.log(`Government Certification: ${report.government_certification}`);
        console.log(`\nViolations: ${report.violations.length}`);
        console.log(`Passes: ${report.passes.length}`);
        
        if (report.violations.length > 0) {
            console.log('\n🚨 High Priority Violations:');
            report.violations
                .filter(v => v.government_priority === 'HIGH')
                .forEach(v => console.log(`  - ${v.description}`));
        }
        
        // Save detailed report
        fs.writeFileSync(
            path.join(process.cwd(), 'section-508-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n📄 Detailed report saved to section-508-report.json');
        
        // Exit with error code if non-compliant
        process.exit(report.section_508_status === 'NON_COMPLIANT' ? 1 : 0);
    }).catch(error => {
        console.error('❌ Section 508 validation failed:', error);
        process.exit(1);
    });
}
