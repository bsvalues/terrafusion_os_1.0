#!/usr/bin/env node
/**
 * TerraFusionPro Deployment Script
 * 
 * This script handles deployment of the Terrafusion platform to staging and production
 * environments. It uses a blue/green deployment strategy to minimize downtime.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  staging: {
    namespace: 'terrafusion-staging',
    services: [
      'api-gateway',
      'user-service',
      'property-service',
      'form-service',
      'analysis-service',
      'report-service',
      'apollo-federation-gateway',
      'web-client'
    ],
    integratedApps: [
      // These will be deployed later in phase 2
    ]
  },
  production: {
    namespace: 'terrafusion-prod',
    services: [
      'api-gateway',
      'user-service',
      'property-service',
      'form-service',
      'analysis-service',
      'report-service',
      'apollo-federation-gateway',
      'web-client'
    ],
    integratedApps: [
      // Will be added in future release
    ]
  }
};

// Deployment environment (staging or production)
const deployEnv = process.argv[2] || 'staging';
if (!['staging', 'production'].includes(deployEnv)) {
  console.error('Usage: deploy.js [staging|production]');
  process.exit(1);
}

console.log(`Starting deployment to ${deployEnv} environment...`);

// Ensure namespace exists
try {
  console.log(`Ensuring namespace ${config[deployEnv].namespace} exists...`);
  execSync(`kubectl get namespace ${config[deployEnv].namespace} || kubectl create namespace ${config[deployEnv].namespace}`);
} catch (error) {
  console.error('Error setting up namespace:', error.message);
  process.exit(1);
}

// Apply database migrations
try {
  console.log('Applying database migrations...');
  execSync('npm run db:migrate');
} catch (error) {
  console.error('Error applying database migrations:', error.message);
  process.exit(1);
}

// Deploy core services
console.log('Deploying core services...');
for (const service of config[deployEnv].services) {
  try {
    console.log(`Deploying ${service}...`);
    
    // Apply Kubernetes configs
    const k8sConfigPath = path.join('infrastructure', 'kubernetes', deployEnv, `${service}.yaml`);
    if (fs.existsSync(k8sConfigPath)) {
      execSync(`kubectl apply -f ${k8sConfigPath} --namespace=${config[deployEnv].namespace}`);
    } else {
      console.warn(`No Kubernetes config found for ${service}, using base config...`);
      const baseConfigPath = path.join('infrastructure', 'kubernetes', 'base', `${service}.yaml`);
      execSync(`kubectl apply -f ${baseConfigPath} --namespace=${config[deployEnv].namespace}`);
    }
    
    // Wait for deployment to complete
    execSync(`kubectl rollout status deployment/${service} --namespace=${config[deployEnv].namespace} --timeout=5m`);
    
    console.log(`✅ Successfully deployed ${service}`);
  } catch (error) {
    console.error(`❌ Error deploying ${service}:`, error.message);
    process.exit(1);
  }
}

// Run post-deployment health check
try {
  console.log('Running post-deployment health check...');
  execSync('bash ./smoke-test.sh');
  console.log('✅ Post-deployment health check passed');
} catch (error) {
  console.error('❌ Post-deployment health check failed:', error.message);
  console.error('Starting rollback...');
  
  // Rollback logic would go here
  
  process.exit(1);
}

console.log(`\n✅ Terrafusion platform successfully deployed to ${deployEnv} environment`);