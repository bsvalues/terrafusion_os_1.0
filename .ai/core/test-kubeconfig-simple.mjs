// TerraFusion Elite Kubeconfig Integration Test
// Championship-Level Kubernetes Configuration Validation

import * as fs from 'fs';

console.log('TerraFusion Kubeconfig Integration Test');
console.log('==============================================');

// Primary kubeconfig path (same as ClaudeFlowIntegration.ts)
const kubeconfigPath = 'c:\\Users\\bsval\\terrafusion_os_1.0\\.ai\\core\\kubeconfig.yaml';

// Test kubeconfig accessibility
function testKubeconfigAccess() {
  try {
    console.log(`Testing kubeconfig access at: ${kubeconfigPath}`);

    // Check if file exists
    if (!fs.existsSync(kubeconfigPath)) {
      console.error('Kubeconfig file not found!');
      return false;
    }

    console.log('Kubeconfig file exists');

    // Test read permissions
    const kubeconfigContent = fs.readFileSync(kubeconfigPath, 'utf8');
    console.log('Kubeconfig file is readable');
    console.log(`File size: ${kubeconfigContent.length} bytes`);

    // Validate YAML structure
    if (
      kubeconfigContent.includes('apiVersion: v1') &&
      kubeconfigContent.includes('kind: Config')
    ) {
      console.log('Valid Kubernetes config format detected');
    } else {
      console.log('Warning: File may not be valid Kubernetes config');
    }

    // Check current context
    if (kubeconfigContent.includes('current-context: terrafusion-bulletproof-context')) {
      console.log('Current context: terrafusion-bulletproof-context');
    } else {
      console.log('Warning: No valid current context found');
    }

    // Environment variable check
    const envKubeconfig = process.env.KUBECONFIG;
    if (envKubeconfig) {
      console.log(`KUBECONFIG environment variable: ${envKubeconfig}`);
    } else {
      console.log('KUBECONFIG environment variable not set (using fallback)');
    }

    return true;
  } catch (error) {
    console.error(`Error accessing kubeconfig: ${error.message}`);
    return false;
  }
}

// Main execution
const result = testKubeconfigAccess();

if (result) {
  console.log('\nKUBECONFIG STATUS: OPERATIONAL');
  console.log('Government. Transcended.');
  process.exit(0);
} else {
  console.log('\nKUBECONFIG STATUS: FAILED');
  process.exit(1);
}
