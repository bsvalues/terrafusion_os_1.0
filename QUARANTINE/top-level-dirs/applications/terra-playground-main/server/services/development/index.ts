/**
 * TaxI_AI Development Platform Services
 *
 * This file exports all the development platform services needed for
 * creating, managing, and previewing assessment agency applications.
 */

import { fileManager } from './file-manager';
import { projectManager } from './project-manager';
import { previewEngine } from './preview-engine';
import { getAICodeAssistant } from './ai-code-assistant';
import { CodeSnippetService } from './code-snippet-service';
import { DataVisualizationService } from './data-visualization-service';
import { ComponentPlaygroundService } from './component-playground-service';

export {
  fileManager,
  projectManager,
  previewEngine,
  getAICodeAssistant,
  CodeSnippetService,
  DataVisualizationService,
  ComponentPlaygroundService,
};

// Export service types for consistency
export { CodeSnippetType } from '@shared/schema';
export { VisualizationType } from '@shared/schema';
export { ComponentType } from '@shared/schema';
