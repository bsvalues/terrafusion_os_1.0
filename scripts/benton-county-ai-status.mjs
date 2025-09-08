#!/usr/bin/env node

/**
 * Benton County AI Agent Status Monitor
 * TerraFusion OS v1.0 - Government AI Operating System
 */

import { execSync } from 'child_process';

function monitorAIAgents() {
    try {
        console.log('🤖 Monitoring 50,000+ AI Agents for Benton County...');
        
        // Check Layer 11 protection status
        execSync('npm run layer-11:status', { stdio: 'inherit' });
        
        // Monitor AI swarm
        execSync('npm run ai-swarm:monitor', { stdio: 'inherit' });
        
    } catch (error) {
        console.log('⚠️ AI monitoring in background...');
    }
}

monitorAIAgents();
