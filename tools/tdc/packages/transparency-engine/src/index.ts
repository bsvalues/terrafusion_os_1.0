/**
 * @terrafusion/transparency-engine
 *
 * TerraFusion Elegant Transparency System
 *
 * Progressive disclosure for 50,000+ AI agent swarm operations.
 * Surface layer for citizens, Expert layer for engineers.
 *
 * @example
 * ```typescript
 * import { SwarmTransparencyEngine, DefaultTransparencyBus } from '@terrafusion/transparency-engine';
 *
 * const user = {
 *   userId: 'dev-123',
 *   experienceLevel: 'power',
 *   weeksOfUse: 12,
 *   prefersMinimalUI: false,
 *   role: 'developer'
 * };
 *
 * const context = {
 *   workspace: 'backend',
 *   environment: 'local',
 *   taskType: 'build'
 * };
 *
 * const engine = new SwarmTransparencyEngine(user, context, DefaultTransparencyBus);
 *
 * // Get display model for current layer
 * const model = engine.getDisplayModel();
 * console.log(model);
 *
 * // Elevate to next layer
 * engine.elevate();
 * ```
 */

// Core types
export type {
  AgentAction,
  AgentPhase,
  OperationalContext,
  PerformanceMetrics,
  ServiceMetrics,
  SystemDecisionLog,
  TerraFusionService,
  TransparencyLayer,
  TransparencyPlugin,
  UserCapabilityModel,
} from './types';

// Bus
export { DefaultTransparencyBus, InMemoryTransparencyBus, publishAction } from './bus';

export type { AgentActionHandler, TransparencyBus, UnsubscribeFunction } from './bus';

// Engine
export { SwarmTransparencyEngine } from './engine';

export type {
  DepthDisplayModel,
  DisplayModel,
  ExpertDisplayModel,
  HintDisplayModel,
  SurfaceDisplayModel,
} from './engine';

// Server
export { TransparencyWebSocketServer, transparencyWSServer } from './server';
