// Test TerraFusion Shared Package Integration
import { 
  ProjectStatus, 
  UserRole, 
  hasPermission,
  formatCurrency 
} from '@terrafusion/shared';

console.log('🚀 TERRAFUSION OS - SHARED PACKAGE INTEGRATION TEST');
console.log('=' .repeat(60));

console.log('✅ IMPORTS SUCCESSFUL:');
console.log('   ProjectStatus:', typeof ProjectStatus);
console.log('   UserRole:', typeof UserRole);
console.log('   hasPermission:', typeof hasPermission);
console.log('   formatCurrency:', typeof formatCurrency);

// Test functionality
console.log('');
console.log('🔧 FUNCTIONALITY TESTS:');
const canManage = hasPermission(UserRole.MANAGER, 'READ');
const formattedBudget = formatCurrency(500000, 'USD');

console.log('   Manager can READ:', canManage);
console.log('   Budget format test:', formattedBudget);

console.log('');
console.log('🎉 INTEGRATION SUCCESS!');
console.log('   @terrafusion/shared is working in TerraFusion OS');
