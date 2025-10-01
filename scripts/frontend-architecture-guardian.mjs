#!/usr/bin/env node
/**
 * TerraFusion OS - AI Agent Frontend Architecture Guardian
 * Prevents AI agents from working on wrong frontend
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

class FrontendArchitectureGuardian {
    constructor() {
        this.legacyPaths = [
            '/frontend/',
            '/terrafusion/frontend/',
            'frontend/src',
            'frontend/components'
        ];
        
        this.correctPaths = [
            '/frontend-v2/',
            '/frontend-v2/shell/',
            '/frontend-v2/packages/'
        ];
    }

    validateCurrentDirectory() {
        const currentDir = process.cwd();
        console.log('🛡️ Frontend Architecture Guardian - Validation Starting');
        console.log(`📍 Current Directory: ${currentDir}`);
        
        // Check if in legacy frontend
        for (const legacyPath of this.legacyPaths) {
            if (currentDir.includes(legacyPath) && !currentDir.includes('frontend-v2')) {
                this.triggerLegacyFrontendAlert(currentDir);
                return false;
            }
        }
        
        // Check if in correct frontend
        for (const correctPath of this.correctPaths) {
            if (currentDir.includes(correctPath)) {
                this.confirmCorrectArchitecture(currentDir);
                return true;
            }
        }
        
        // Neutral location
        this.provideGuidance();
        return true;
    }

    triggerLegacyFrontendAlert(currentDir) {
        console.log('');
        console.log('🚨 CRITICAL ERROR: LEGACY FRONTEND DETECTED!');
        console.log('==============================================');
        console.log(`❌ Current Location: ${currentDir}`);
        console.log('❌ This is the LEGACY frontend with 97+ TypeScript errors');
        console.log('❌ AI agents are FORBIDDEN from working here');
        console.log('');
        console.log('✅ CORRECT LOCATION: /workspaces/terrafusion_os_1.0/frontend-v2/');
        console.log('');
        console.log('🔧 IMMEDIATE REMEDIATION REQUIRED:');
        console.log('   cd /workspaces/terrafusion_os_1.0/frontend-v2/shell');
        console.log('   npm run dev:os');
        console.log('');
        console.log('📚 READ: AI_AGENT_FRONTEND_PROTECTION.md');
        console.log('==============================================');
        
        // Exit with error code to stop execution
        process.exit(1);
    }

    confirmCorrectArchitecture(currentDir) {
        console.log('');
        console.log('✅ FRONTEND ARCHITECTURE VALIDATION PASSED');
        console.log('==========================================');
        console.log(`✅ Correct Location: ${currentDir}`);
        console.log('✅ Enterprise Frontend-v2 Architecture Confirmed');
        console.log('✅ Safe to proceed with development');
        
        // Additional package.json validation
        this.validatePackageJson();
    }

    validatePackageJson() {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                
                if (packageData.name?.includes('frontend-shell') && packageData.version === '2.0.0') {
                    console.log('✅ Enterprise package.json validated');
                    console.log(`   Name: ${packageData.name}`);
                    console.log(`   Version: ${packageData.version}`);
                } else {
                    console.log('⚠️  Package.json validation inconclusive');
                    console.log(`   Name: ${packageData.name}`);
                    console.log(`   Version: ${packageData.version}`);
                }
            } catch (error) {
                console.log('⚠️  Could not validate package.json');
            }
        }
    }

    provideGuidance() {
        console.log('');
        console.log('ℹ️  FRONTEND DEVELOPMENT GUIDANCE');
        console.log('================================');
        console.log('📍 Not currently in a frontend directory');
        console.log('');
        console.log('🎯 For TerraFusion OS Frontend Development:');
        console.log('   cd /workspaces/terrafusion_os_1.0/frontend-v2/shell');
        console.log('   npm run dev:os  # Port ${TF_LOKI_PORT:-3100}');
        console.log('');
        console.log('⚠️  REMEMBER: Never work in /frontend/ (legacy)');
        console.log('✅ ALWAYS use /frontend-v2/ (enterprise)');
        console.log('');
        console.log('📚 Documentation: AI_AGENT_FRONTEND_PROTECTION.md');
    }

    createPreventionChecks() {
        // Create .frontend-guardian file for directory monitoring
        const guardianFile = path.join(PROJECT_ROOT, '.frontend-guardian');
        const guardianConfig = {
            lastCheck: new Date().toISOString(),
            legacyPaths: this.legacyPaths,
            correctPaths: this.correctPaths,
            message: 'AI agents must use frontend-v2 architecture only'
        };
        
        fs.writeFileSync(guardianFile, JSON.stringify(guardianConfig, null, 2));
        console.log('📝 Frontend Guardian configuration created');
    }

    runFullValidation() {
        console.log('🛡️ TerraFusion OS - Frontend Architecture Guardian');
        console.log('================================================');
        
        const isValid = this.validateCurrentDirectory();
        this.createPreventionChecks();
        
        if (isValid) {
            console.log('');
            console.log('🎉 VALIDATION COMPLETE: Frontend architecture protection active');
            console.log('✅ Safe to proceed with TerraFusion OS development');
        }
        
        return isValid;
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const guardian = new FrontendArchitectureGuardian();
    const success = guardian.runFullValidation();
    process.exit(success ? 0 : 1);
}

export default FrontendArchitectureGuardian;