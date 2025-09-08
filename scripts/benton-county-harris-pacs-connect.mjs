#!/usr/bin/env node

/**
 * Harris PACS Integration for Benton County
 * TerraFusion OS v1.0 - Government AI Operating System
 * 
 * Connects and synchronizes with Harris PACS system
 */

import { execSync } from 'child_process';
import fs from 'fs';

const HARRIS_CONFIG = {
    version: 'v12.4.7',
    county: 'Benton County',
    parcels: 89247,
    projection: 'EPSG:2927',
    syncInterval: 15000, // 15 seconds
    configPath: 'deployment/benton-county/harris-pacs/harris-integration-config.json'
};

function connectHarrisPACS() {
    console.log('🔗 HARRIS PACS INTEGRATION');
    console.log('═══════════════════════════');
    
    // Check if Harris configuration exists
    if (!fs.existsSync(HARRIS_CONFIG.configPath)) {
        console.log('⚠️ Harris PACS configuration not found');
        console.log('🔧 Run: npm run benton-county:white-glove:deploy first');
        process.exit(1);
    }
    
    try {
        // Load Harris configuration
        const config = JSON.parse(fs.readFileSync(HARRIS_CONFIG.configPath, 'utf8'));
        
        console.log('🏛️ Starting Harris PACS Integration...');
        console.log(`📍 County: ${HARRIS_CONFIG.county}`);
        console.log(`📊 Parcels: ${HARRIS_CONFIG.parcels.toLocaleString()}`);
        console.log(`🗺️ Projection: ${HARRIS_CONFIG.projection}`);
        console.log(`🔄 Sync Interval: ${HARRIS_CONFIG.syncInterval / 1000}s`);
        
        // Validate API credentials
        if (!process.env.HARRIS_PACS_API_KEY || process.env.HARRIS_PACS_API_KEY === 'PRODUCTION_KEY_REQUIRED') {
            console.log('⚠️ Harris PACS API Key not configured');
            console.log('💡 Set HARRIS_PACS_API_KEY environment variable');
            console.log('📋 Contact Harris Technical Support for API credentials');
        }
        
        // Start Harris PACS sync service
        console.log('🚀 Launching Harris PACS Sync Service...');
        
        // Set environment variables
        process.env.HARRIS_CONFIG_PATH = HARRIS_CONFIG.configPath;
        process.env.HARRIS_COUNTY = HARRIS_CONFIG.county;
        process.env.HARRIS_PARCELS = HARRIS_CONFIG.parcels.toString();
        
        // Launch sync service
        execSync('npm run start:harris-sync', { 
            stdio: 'inherit',
            env: { ...process.env }
        });
        
    } catch (error) {
        console.error('❌ Failed to connect Harris PACS:', error.message);
        console.log('💡 Verify Harris PACS system is accessible');
        console.log('📞 Contact Harris Technical Support if issues persist');
        process.exit(1);
    }
}

connectHarrisPACS();
