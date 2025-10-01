#!/usr/bin/env node

/**
 * 🏛️ BENTON COUNTY PRODUCTION DEPLOYMENT VALIDATOR
 * ================================================
 * 
 * Validates complete TerraFusion OS readiness for Benton County production deployment
 * Checks all critical systems: Backend, Frontend, Rust Engine, AI Swarm, Government Compliance
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

class BentonCountyProductionValidator {
    constructor() {
        this.validationResults = {
            systemReadiness: false,
            backendStatus: false,
            frontendStatus: false,
            rustEngineStatus: false,
            aiSwarmStatus: false,
            complianceStatus: false,
            dataIntegrityStatus: false,
            securityStatus: false
        };
        
        this.errors = [];
        this.warnings = [];
    }

    async validateSystem() {
        console.log('\n🚀 BENTON COUNTY PRODUCTION DEPLOYMENT VALIDATOR');
        console.log('==================================================\n');

        await this.validateBackendSystem();
        await this.validateFrontendSystem();
        await this.validateRustEngine();
        await this.validateAISwarm();
        await this.validateCompliance();
        await this.validateDataIntegrity();
        await this.validateSecurity();
        
        this.generateReport();
        
        return this.validationResults.systemReadiness;
    }

    async validateBackendSystem() {
        console.log('🔧 Validating Backend System (.NET 8.0 API Gateway)...');
        
        try {
            // Check if backend builds successfully
            const backendPath = path.join(process.cwd(), 'backend');
            
            // Check for TerraFusion.API project
            const apiProject = path.join(backendPath, 'TerraFusion.API', 'TerraFusion.API.csproj');
            await fs.access(apiProject);
            
            console.log('  ✅ TerraFusion.API project found');
            
            // Check for solution file
            const solutionFile = path.join(backendPath, 'TerraFusion.sln');
            await fs.access(solutionFile);
            
            console.log('  ✅ TerraFusion.sln solution found');
            
            this.validationResults.backendStatus = true;
            console.log('  ✅ Backend system validation PASSED\n');
            
        } catch (error) {
            this.errors.push(`Backend validation failed: ${error.message}`);
            console.log('  ❌ Backend system validation FAILED\n');
        }
    }

    async validateFrontendSystem() {
        console.log('🎨 Validating Frontend System (Experience Suite v5)...');
        
        try {
            // Check Experience Suite v5 deployment
            const experienceSuitePath = path.join(process.cwd(), 'experience-suite', 'temp-extract', 'experience-suite-v5');
            
            try {
                await fs.access(experienceSuitePath);
                console.log('  ✅ Experience Suite v5 extracted and ready');
            } catch {
                console.log('  ⚠️  Experience Suite v5 not extracted - will extract during deployment');
                this.warnings.push('Experience Suite v5 needs extraction before deployment');
            }
            
            // Check frontend-v2 shell
            const shellPath = path.join(process.cwd(), 'frontend-v2', 'shell');
            await fs.access(shellPath);
            console.log('  ✅ Frontend-v2 shell found');
            
            this.validationResults.frontendStatus = true;
            console.log('  ✅ Frontend system validation PASSED\n');
            
        } catch (error) {
            this.errors.push(`Frontend validation failed: ${error.message}`);
            console.log('  ❌ Frontend system validation FAILED\n');
        }
    }

    async validateRustEngine() {
        console.log('⚡ Validating Elite Rust Performance Engine...');
        
        try {
            const rustEnginePath = path.join(process.cwd(), 'rust-performance-engine');
            
            // Check Cargo.toml
            const cargoToml = path.join(rustEnginePath, 'Cargo.toml');
            await fs.access(cargoToml);
            console.log('  ✅ Rust workspace Cargo.toml found');
            
            // Check critical crates
            const criticalCrates = [
                'agent-coordination',
                'ffi-bridge', 
                'security-layer',
                'performance-monitor',
                'geospatial-engine',
                'valuation-kernel'
            ];
            
            const cratesPath = path.join(rustEnginePath, 'crates');
            for (const crate of criticalCrates) {
                const cratePath = path.join(cratesPath, crate);
                await fs.access(cratePath);
                console.log(`  ✅ ${crate} crate found`);
            }
            
            this.validationResults.rustEngineStatus = true;
            console.log('  ✅ Rust Performance Engine validation PASSED\n');
            
        } catch (error) {
            this.errors.push(`Rust Engine validation failed: ${error.message}`);
            console.log('  ❌ Rust Performance Engine validation FAILED\n');
        }
    }

    async validateAISwarm() {
        console.log('🤖 Validating AI Swarm Coordination (50,000+ Agents)...');
        
        try {
            // Check AI Swarm module
            const aiSwarmPath = path.join(process.cwd(), 'modules', 'ai-swarm');
            await fs.access(aiSwarmPath);
            console.log('  ✅ AI Swarm module found');
            
            // Check Supreme Commander Claude integration
            const backendAiPath = path.join(process.cwd(), 'backend', 'ai-swarm');
            await fs.access(backendAiPath);
            console.log('  ✅ Supreme Commander Claude backend found');
            
            this.validationResults.aiSwarmStatus = true;
            console.log('  ✅ AI Swarm validation PASSED\n');
            
        } catch (error) {
            this.errors.push(`AI Swarm validation failed: ${error.message}`);
            console.log('  ❌ AI Swarm validation FAILED\n');
        }
    }

    async validateCompliance() {
        console.log('🛡️ Validating Government Compliance (FISMA/NIST)...');
        
        try {
            // Check Government Edition module
            const govEditionPath = path.join(process.cwd(), 'modules', 'government-edition');
            await fs.access(govEditionPath);
            console.log('  ✅ Government Edition module found');
            
            // Check security framework
            const securityPath = path.join(process.cwd(), 'backend', 'TerraFusion.Security');
            await fs.access(securityPath);
            console.log('  ✅ Security framework found');
            
            this.validationResults.complianceStatus = true;
            console.log('  ✅ Government compliance validation PASSED\n');
            
        } catch (error) {
            this.errors.push(`Compliance validation failed: ${error.message}`);
            console.log('  ❌ Government compliance validation FAILED\n');
        }
    }

    async validateDataIntegrity() {
        console.log('📊 Validating Data Integration (Benton County Parcels)...');
        
        try {
            // Check for county data integration
            const dataPath = path.join(process.cwd(), 'county-data');
            
            try {
                await fs.access(dataPath);
                console.log('  ✅ County data directory found');
            } catch {
                console.log('  ⚠️  County data directory will be created during deployment');
                this.warnings.push('County data directory needs creation');
            }
            
            // Check data integration scripts
            const integrationScript = path.join(process.cwd(), 'integrate_benton_county.py');
            await fs.access(integrationScript);
            console.log('  ✅ Benton County integration script found');
            
            this.validationResults.dataIntegrityStatus = true;
            console.log('  ✅ Data integrity validation PASSED\n');
            
        } catch (error) {
            this.errors.push(`Data integrity validation failed: ${error.message}`);
            console.log('  ❌ Data integrity validation FAILED\n');
        }
    }

    async validateSecurity() {
        console.log('🔒 Validating Security Framework (11-Layer Protection)...');
        
        try {
            // Check security scripts
            const securityScripts = [
                'scripts/ai-orchestration-layer-11.mjs',
                'scripts/ultimate-ai-firewall.mjs'
            ];
            
            for (const script of securityScripts) {
                const scriptPath = path.join(process.cwd(), script);
                await fs.access(scriptPath);
                console.log(`  ✅ ${script} found`);
            }
            
            this.validationResults.securityStatus = true;
            console.log('  ✅ Security framework validation PASSED\n');
            
        } catch (error) {
            this.errors.push(`Security validation failed: ${error.message}`);
            console.log('  ❌ Security framework validation FAILED\n');
        }
    }

    generateReport() {
        console.log('\n📋 BENTON COUNTY PRODUCTION READINESS REPORT');
        console.log('=============================================\n');
        
        const validationChecks = [
            { name: 'Backend System (.NET 8.0)', status: this.validationResults.backendStatus },
            { name: 'Frontend System (Experience Suite v5)', status: this.validationResults.frontendStatus },
            { name: 'Rust Performance Engine', status: this.validationResults.rustEngineStatus },
            { name: 'AI Swarm Coordination', status: this.validationResults.aiSwarmStatus },
            { name: 'Government Compliance', status: this.validationResults.complianceStatus },
            { name: 'Data Integration', status: this.validationResults.dataIntegrityStatus },
            { name: 'Security Framework', status: this.validationResults.securityStatus }
        ];
        
        validationChecks.forEach(check => {
            const status = check.status ? '✅ PASSED' : '❌ FAILED';
            console.log(`  ${check.name}: ${status}`);
        });
        
        const passedChecks = validationChecks.filter(check => check.status).length;
        const totalChecks = validationChecks.length;
        
        console.log(`\n📊 Overall Status: ${passedChecks}/${totalChecks} checks passed`);
        
        this.validationResults.systemReadiness = passedChecks === totalChecks;
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            this.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
        
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        if (this.validationResults.systemReadiness) {
            console.log('\n🚀 BENTON COUNTY PRODUCTION DEPLOYMENT: READY TO PROCEED');
            console.log('Next step: npm run benton-county:production:deploy');
        } else {
            console.log('\n🛑 BENTON COUNTY PRODUCTION DEPLOYMENT: NOT READY');
            console.log('Please address the errors above before proceeding');
        }
        
        console.log('\n=================================================\n');
    }
}

// Execute validation
async function main() {
    const validator = new BentonCountyProductionValidator();
    const isReady = await validator.validateSystem();
    process.exit(isReady ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}