// Test TerraFusion Shared Package Integration (ES Module)
import { 
  ProjectStatus, 
  UserRole, 
  hasPermission,
  getRolePermissions,
  TERRAFUSION_SHARED_VERSION
} from '@terrafusion/shared';

console.log('🚀 TERRAFUSION OS - SHARED PACKAGE INTEGRATION TEST (ES Module)');
console.log('=' .repeat(68));

console.log('✅ ES MODULE IMPORTS SUCCESSFUL!');
console.log('   Version:', TERRAFUSION_SHARED_VERSION);

console.log('');
console.log('🔍 TESTING ENUM EXPORTS:');
console.log('   ProjectStatus type:', typeof ProjectStatus);
console.log('   UserRole type:', typeof UserRole);
console.log('   hasPermission type:', typeof hasPermission);
console.log('   getRolePermissions type:', typeof getRolePermissions);

if (ProjectStatus) {
  console.log('   ProjectStatus keys:', Object.keys(ProjectStatus).slice(0, 5));
  console.log('   ProjectStatus.ACTIVE:', ProjectStatus.ACTIVE);
  console.log('   ProjectStatus.DRAFT:', ProjectStatus.DRAFT);
}

if (UserRole) {
  console.log('   UserRole keys:', Object.keys(UserRole).slice(0, 5));
  console.log('   UserRole.MANAGER:', UserRole.MANAGER);
  console.log('   UserRole.ADMIN:', UserRole.ADMIN);
}

console.log('');
console.log('🔧 FUNCTIONALITY TESTS:');
if (UserRole && hasPermission) {
  const managerRole = UserRole.MANAGER || UserRole.COUNTY_ADMIN;
  if (managerRole) {
    const canRead = hasPermission(managerRole, 'READ');
    console.log('   Manager/Admin can read:', canRead);
  }
}

if (getRolePermissions && UserRole) {
  try {
    const adminRole = UserRole.ADMIN || UserRole.MANAGER;
    if (adminRole) {
      const permissions = getRolePermissions(adminRole);
      console.log('   Role permissions test:', permissions ? permissions.slice(0, 3) : 'No permissions');
    }
  } catch (error) {
    console.log('   Role permissions error:', error.message);
  }
}

console.log('');
console.log('🎉 ES MODULE INTEGRATION TEST COMPLETE!');
console.log('   TerraFusion Shared package successfully imported via ES modules');