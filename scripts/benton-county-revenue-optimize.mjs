#!/usr/bin/env node

/**
 * Benton County Revenue Optimization
 * TerraFusion OS v1.0 - Government AI Operating System
 */

import { execSync } from 'child_process';

function optimizeRevenue() {
    try {
        console.log('💰 Benton County Revenue Optimization AI...');
        
        execSync('npm run start:revenue-ai', { 
            stdio: 'inherit',
            env: { 
                ...process.env,
                COUNTY: 'Benton County',
                AI_MODE: 'revenue-optimization',
                ASSESSMENT_YEAR: '2025'
            }
        });
        
    } catch (error) {
        console.error('❌ Revenue optimization failed:', error.message);
        process.exit(1);
    }
}

optimizeRevenue();
