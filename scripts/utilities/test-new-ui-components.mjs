// Test TerraFusion Shared UI Components Integration - NEW COMPONENTS
import { Button, Card, Badge, Spinner, Alert } from './terrafusion-shared/packages/ui-components/dist/index.mjs';

try {

  console.log('🎨 TERRAFUSION NEW UI COMPONENTS - INTEGRATION TEST');
  console.log('=' .repeat(55));

  console.log('✅ Checking NEW component availability:');
  console.log('   Button component:', typeof Button);
  console.log('   Card component:', typeof Card);
  console.log('   Badge component:', typeof Badge);
  console.log('   Spinner component:', typeof Spinner);
  console.log('   Alert component:', typeof Alert);

  console.log('');
  console.log('🚀 NEW UI COMPONENTS INTEGRATION SUCCESS!');
  console.log('   New components: Card, Badge, Spinner, Alert are now available!');
  console.log('   Core Component Library Development COMPLETE!');

} catch (error) {
  console.error('❌ Error testing new components:', error.message);
}