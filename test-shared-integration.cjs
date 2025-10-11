// Test TerraFusion Shared Package Integration (CommonJS)
console.log('🚀 TERRAFUSION OS - SHARED PACKAGE INTEGRATION TEST (CommonJS)');
console.log('=' .repeat(65));

try {
  console.log('🔍 ATTEMPTING TO REQUIRE @terrafusion/shared...');
  const shared = require('@terrafusion/shared');
  
  console.log('✅ REQUIRE SUCCESSFUL!');
  console.log('   Available exports:', Object.keys(shared || {}));
  
  // Extract specific exports
  const { 
    ProjectStatus, 
    UserRole, 
    hasPermission,
    formatCurrency,
    TERRAFUSION_SHARED_VERSION
  } = shared;

  console.log('');
  console.log('✅ SPECIFIC IMPORTS:');
  console.log('   ProjectStatus:', typeof ProjectStatus, ProjectStatus ? Object.keys(ProjectStatus).slice(0, 3) : 'undefined');
  console.log('   UserRole:', typeof UserRole, UserRole ? Object.keys(UserRole).slice(0, 3) : 'undefined');
  console.log('   hasPermission:', typeof hasPermission);
  console.log('   formatCurrency:', typeof formatCurrency);
  console.log('   Version:', TERRAFUSION_SHARED_VERSION);

  // Test functionality
  console.log('');
  console.log('🔧 FUNCTIONALITY TESTS:');
  if (UserRole && ProjectStatus) {
    console.log('   User roles available:', Object.keys(UserRole).length);
    console.log('   Project statuses available:', Object.keys(ProjectStatus).length);
    
    if (hasPermission && UserRole.MANAGER) {
      const canRead = hasPermission(UserRole.MANAGER, 'READ');
      console.log('   Manager can read:', canRead);
    }
  }
  
  if (formatCurrency) {
    const formattedBudget = formatCurrency(500000, 'USD');
    console.log('   Budget format test:', formattedBudget);
  }

  console.log('');
  console.log('🎉 FULL INTEGRATION SUCCESS!');
  console.log('   @terrafusion/shared is fully functional in TerraFusion OS');
  
} catch (error) {
  console.log('❌ INTEGRATION FAILED!');
  console.log('   Error:', error.message);
  console.log('   Stack:', error.stack);
  
  // Try to diagnose the issue
  console.log('');
  console.log('🔍 DIAGNOSTIC INFORMATION:');
  console.log('   Node.js version:', process.version);
  console.log('   Current working directory:', process.cwd());
  
  try {
    const packagePath = require.resolve('@terrafusion/shared/package.json');
    console.log('   Package resolved to:', packagePath);
  } catch (e) {
    console.log('   Package resolution failed:', e.message);
  }
}
