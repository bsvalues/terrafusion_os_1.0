/**
 * index.ts
 *
 * Export the entire multi-agent architecture
 */

// Export core components
export * from './core';

// Export domain-specific agents
export * from './domain';

// Export task-specific agents
export * from './task';

// Export learning components
export * from './learning';

// Export multi-agent orchestration
export { AgentSystem } from './AgentSystem';
