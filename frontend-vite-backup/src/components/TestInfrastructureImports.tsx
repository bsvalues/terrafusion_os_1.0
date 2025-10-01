// Test infrastructure imports
import { useSecureAPI } from '../contexts/InfrastructureContext';
import { CircuitBreakerError, AttestationError } from '../../infrastructure/SecureAPIClient';

console.log('Infrastructure imports test:', useSecureAPI, CircuitBreakerError, AttestationError);

export const TestInfrastructureImports = () => {
  return <div>Infrastructure imports working!</div>;
};