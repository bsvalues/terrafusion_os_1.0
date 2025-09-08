#!/usr/bin/env node

/**
 * Benton County Assessor Dashboard Launcher
 * TerraFusion OS v1.0 - Government AI Operating System
 * 
 * Launches the customized Assessor Dashboard for Benton County
 */

import { execSync } from 'child_process';
import fs from 'fs';

const ASSESSOR_CONFIG = {
    county: 'Benton County, Washington',
    assessor: 'Benton County Assessor',
    port: 3000,
    apiPort: 5000,
    dashboard: 'assessor-dashboard'
};

function launchAssessorDashboard() {
    console.log('📊 BENTON COUNTY ASSESSOR DASHBOARD');
    console.log('══════════════════════════════════');
    
    // Check if Benton County configuration exists
    const configPath = 'deployment/benton-county/assessor-dashboard/dashboard-config.js';
    
    if (!fs.existsSync(configPath)) {
        console.log('⚠️ Benton County configuration not found');
        console.log('🔧 Run: npm run benton-county:white-glove:deploy first');
        process.exit(1);
    }
    
    try {
        console.log('🏛️ Starting Benton County Assessor Dashboard...');
        console.log(`📍 County: ${ASSESSOR_CONFIG.county}`);
        console.log(`👤 Client: ${ASSESSOR_CONFIG.assessor}`);
        console.log(`🌐 Port: ${ASSESSOR_CONFIG.port}`);
        
        // Set environment variables for Benton County
        process.env.REACT_APP_COUNTY = 'Benton County';
        process.env.REACT_APP_ASSESSOR = 'Benton County Assessor';
        process.env.REACT_APP_CONFIG_PATH = configPath;
        
        // Launch dashboard
        execSync(`npm run start:dashboard -- --port ${ASSESSOR_CONFIG.port}`, { 
            stdio: 'inherit',
            env: { ...process.env }
        });
        
    } catch (error) {
        console.error('❌ Failed to launch Assessor Dashboard:', error.message);
        process.exit(1);
    }
}

launchAssessorDashboard();
