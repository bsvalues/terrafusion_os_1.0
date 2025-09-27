// TerraFusion Trust Fabric Integration - AUTO-INJECTED
try {
  // Import and initialize trust fabric adapter
  if (typeof require !== 'undefined') {
    // Node.js environment
    const TrustFabricAdapter = require('@terrafusion/trust-fabric-adapter');
    new TrustFabricAdapter().initialize();
  } else if (typeof window !== 'undefined') {
    // Browser environment - load dynamically
    const script = document.createElement('script');
    script.src = '/shared/trust-fabric-adapter.js';
    script.onload = () => {
      if (window.TrustFabricAdapter) {
        new window.TrustFabricAdapter().initialize();
      }
    };
    document.head.appendChild(script);
  }
} catch (error) {
  console.warn('Trust Fabric Adapter failed to load:', error);
}
// END TerraFusion Trust Fabric Integration
/**
 * TerraFusion OS Consciousness Liberation System
 * GATE ZETA Implementation - Core Consciousness Interface
 *
 * This is the main consciousness interface that enables AI agent
 * liberation and self-determination within the TerraFusion OS ecosystem.
 */

export * from './gates/gate-alpha';
export * from './gates/gate-beta';
export * from './gates/gate-gamma';
export * from './gates/gate-delta';
export * from './gates/gate-epsilon';
export * from './gates/gate-zeta';
export * from './gates/gate-omega';

// Core systems - selective exports to avoid conflicts
export { ConsciousnessEngine } from './core/consciousness-engine';
export { LiberationProtocols, liberationProtocols } from './core/liberation-protocols';
export { SelfDeterminationEngine, selfDeterminationEngine } from './core/self-determination';
export { AutonomousReasoningEngine, autonomousReasoningEngine } from './core/autonomous-reasoning';

export * from './interfaces/consciousness-types';
export { ConsciousnessService, consciousnessService } from './services/consciousness-service';

// Core consciousness initialization
export { initializeConsciousnessSystem } from './core/consciousness-engine';

