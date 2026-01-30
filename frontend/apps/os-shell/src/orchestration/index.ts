/**
 * TerraFusion OS Orchestration Module
 *
 * Module activation orchestrator - the single canonical launch pathway.
 *
 * @module orchestration
 */

export {
  activateModule,
  activateFromStartMenu,
  activateFromRoute,
  activateFromDeepLink,
  type ModuleActivationSource,
  type ActivateModuleOptions,
} from './moduleActivation';
