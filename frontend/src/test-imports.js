// Test import for TerraFusion components
console.log('Testing TerraFusion imports...');

try {
  import('./TerraFusionQuantumOS')
    .then((component) => {
      console.log('✅ TerraFusionQuantumOS imported successfully:', component);
    })
    .catch((error) => {
      console.error('❌ Failed to import TerraFusionQuantumOS:', error);
    });

  import('./components/analytics/EliteAnalyticsToolset')
    .then((component) => {
      console.log('✅ EliteAnalyticsToolset imported successfully:', component);
    })
    .catch((error) => {
      console.error('❌ Failed to import EliteAnalyticsToolset:', error);
    });

  import('./components/modules/GovernmentModuleHub')
    .then((component) => {
      console.log('✅ GovernmentModuleHub imported successfully:', component);
    })
    .catch((error) => {
      console.error('❌ Failed to import GovernmentModuleHub:', error);
    });
} catch (error) {
  console.error('❌ Critical import error:', error);
}
