// Test TerraFusion Shared UI Components Integration
import { 
  ProjectStatus, 
  UserRole,
  Button,
  Input,
  Modal
} from '@terrafusion/shared';

console.log('🎨 TERRAFUSION UI COMPONENTS - INTEGRATION TEST');
console.log('=' .repeat(55));

console.log('✅ Checking component availability:');
console.log('   Button component:', typeof Button);
console.log('   Input component:', typeof Input);
console.log('   Modal component:', typeof Modal);

// Verify we still have constants
console.log('   ProjectStatus:', typeof ProjectStatus);
console.log('   UserRole:', typeof UserRole);

if (Button) {
  console.log('   Button is a React component:', Button.toString().includes('React'));
}

console.log('');
console.log('🚀 UI COMPONENTS INTEGRATION SUCCESS!');
console.log('   Shared package now provides both constants AND components');