/**
 * This script demonstrates and tests the circuit breaker service in our application.
 */
import { circuitBreakerService } from './services/circuitBreakerService';
import { apiService } from './services/apiService';

// Register some test circuit breakers
circuitBreakerService.register('test-auth-service', async () => {
  // This action will sometimes fail
  if (Math.random() < 0.7) { // 70% failure rate
    throw new Error('Auth service test error');
  }
  return { status: 'success', message: 'Auth service responded' };
});

circuitBreakerService.register('test-database-service', async () => {
  // This action will sometimes fail
  if (Math.random() < 0.5) { // 50% failure rate
    throw new Error('Database service test error');
  }
  return { status: 'success', message: 'Database service responded' };
});

// Let's run some test calls to collect metrics
async function runTests() {
  try {
    // Execute test auth service 10 times
    console.log('Testing auth service circuit breaker...');
    for (let i = 0; i < 10; i++) {
      try {
        await circuitBreakerService.execute('test-auth-service', {});
        console.log('  Auth service call succeeded');
      } catch (error) {
        console.log('  Auth service call failed');
      }
    }

    // Execute test database service 10 times
    console.log('\nTesting database service circuit breaker...');
    for (let i = 0; i < 10; i++) {
      try {
        await circuitBreakerService.execute('test-database-service', {});
        console.log('  Database service call succeeded');
      } catch (error) {
        console.log('  Database service call failed');
      }
    }

    // Now let's check the circuit breaker status
    console.log('\nCircuit breaker status:');
    console.log(JSON.stringify(circuitBreakerService.getHealth(), null, 2));
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Log that the test started
console.log('Starting circuit breaker test...');

// Run the tests
runTests().then(() => {
  console.log('Circuit breaker tests completed.');
});