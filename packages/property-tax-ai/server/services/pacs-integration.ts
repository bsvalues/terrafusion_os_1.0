/**
 * PACS Integration Service Interface
 * 
 * This file defines the interface for integrating with the Property Appraisal and Collection System (PACS).
 */

import { PacsModule } from "../../shared/schema";

/**
 * PACS Integration Service Interface
 */
export interface IPacsIntegrationService {
  // Module operations
  getPacsModules(): Promise<PacsModule[]>;
  getPacsModuleById(id: number): Promise<PacsModule | null>;
  getPacsModulesByCategory(): Promise<PacsModule[]>;
  executeModuleOperation(moduleId: number, operation: string, parameters: any): Promise<any>;
  syncPacsModule(moduleId: number): Promise<any>;
  syncAllPacsModules(): Promise<any[]>;
  updateModuleStatus(moduleId: number, status: string): Promise<any>;
}