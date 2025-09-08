#!/usr/bin/env node
/**
 * TerraFusion OS - Real-Time Code Pattern Monitor
 * Detects and prevents inappropriate architecture suggestions
 */

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

class TerraFusionCodeMonitor {
    constructor() {
        this.prohibitedPatterns = [
            // Web deployment patterns
            /vercel/gi,
            /netlify/gi,
            /static.*site/gi,
            /web.*app.*deploy/gi,
            /docker.*compose.*web/gi,
            
            // Desktop wrapper patterns
            /electron/gi,
            /tauri/gi,
            /desktop.*app/gi,
            /app.*wrapper/gi,
            
            // Web hosting patterns
            /apache/gi,
            /nginx.*web/gi,
            /serve.*static/gi,
            /web.*hosting/gi,
            
            // Wrong architecture patterns
            /spa.*app/gi,
            /single.*page.*app/gi,
            /react.*router.*web/gi,
            /vue.*router.*web/gi,
        ];
        
        this.requiredPatterns = [
            /operating.*system/gi,
            /government.*os/gi,
            /ai.*swarm/gi,
            /module.*system/gi,
            /hot.*swap/gi,
        ];
        
        this.violationLog = 'AI_MONITORING/CODE_VIOLATIONS.md';
    }
    
    /**
     * Start monitoring code files for violations
     */
    startMonitoring() {
        console.log('🔍 TerraFusion OS - Real-Time Code Monitor Started');
        console.log('Watching for inappropriate architecture suggestions...');
        
        // Watch all code files
        const watcher = chokidar.watch(['**/*.{js,ts,jsx,tsx,py,cs,md,json}'], {
            ignored: /node_modules|\.git|dist|build/,
            persistent: true
        });
        
        watcher.on('change', (filePath) => {
            this.analyzeFile(filePath);
        });
        
        watcher.on('add', (filePath) => {
            this.analyzeFile(filePath);
        });
    }
    
    /**
     * Analyze file for violation patterns
     */
    async analyzeFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const violations = this.detectViolations(content, filePath);
            
            if (violations.length > 0) {
                this.logViolation(filePath, violations);
                this.sendAlert(filePath, violations);
            }
        } catch (error) {
            // Ignore files that can't be read
        }
    }
    
    /**
     * Detect code violations
     */
    detectViolations(content, filePath) {
        const violations = [];
        
        // Check for prohibited patterns
        this.prohibitedPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                violations.push({
                    type: 'PROHIBITED_PATTERN',
                    pattern: pattern.toString(),
                    matches: matches,
                    severity: 'HIGH'
                });
            }
        });
        
        // Check for missing OS context in new files
        if (content.length > 100) {
            const hasOSContext = this.requiredPatterns.some(pattern => 
                pattern.test(content)
            );
            
            if (!hasOSContext && filePath.includes('.md')) {
                violations.push({
                    type: 'MISSING_OS_CONTEXT',
                    pattern: 'No OS context found',
                    severity: 'MEDIUM'
                });
            }
        }
        
        return violations;
    }
    
    /**
     * Log violation to tracking file
     */
    logViolation(filePath, violations) {
        const timestamp = new Date().toISOString();
        const logEntry = `
## Code Violation Detected
- **File**: ${filePath}
- **Time**: ${timestamp}
- **Violations**: ${violations.length}

${violations.map(v => `- **${v.type}**: ${v.pattern} (${v.severity})`).join('\n')}

---
`;
        
        fs.appendFileSync(this.violationLog, logEntry);
    }
    
    /**
     * Send real-time alert
     */
    sendAlert(filePath, violations) {
        console.log(`🚨 CODE VIOLATION DETECTED: ${filePath}`);
        console.log(`   Violations: ${violations.length}`);
        violations.forEach(v => {
            console.log(`   - ${v.type}: ${v.pattern}`);
        });
        console.log('');
        
        // Show correction guidance
        this.showCorrectionGuidance(violations);
    }
    
    /**
     * Show correction guidance
     */
    showCorrectionGuidance(violations) {
        console.log('📋 CORRECTION GUIDANCE:');
        
        violations.forEach(violation => {
            switch(violation.type) {
                case 'PROHIBITED_PATTERN':
                    console.log('   ✅ Remember: TerraFusion is a complete OS, not a web application');
                    console.log('   ✅ Use OS-native integration patterns instead');
                    console.log('   ✅ Focus on government module development');
                    break;
                case 'MISSING_OS_CONTEXT':
                    console.log('   ✅ Add OS architecture context to documentation');
                    console.log('   ✅ Emphasize government operating system nature');
                    console.log('   ✅ Include AI swarm and marketplace information');
                    break;
            }
        });
        console.log('');
    }
}

// Start monitoring if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const monitor = new TerraFusionCodeMonitor();
    monitor.startMonitoring();
}

export default TerraFusionCodeMonitor;
