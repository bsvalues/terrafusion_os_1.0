/**
 * TerraFusion Native Shell - Type Definitions
 * Core types for suite orchestration and launcher UI
 */

export type SuiteCategory = 'core' | 'premium' | 'enterprise';
export type IntegrationType = 'pacs' | 'gis' | 'ftp' | 'cloud' | 'api';

export interface AIAgent {
  id: string;
  name: string;
  capabilities: string[];
}

export interface Integration {
  id: string;
  type: IntegrationType;
  endpoints: string[];
}

export interface SuiteManifest {
  id: string;
  label: string;
  category: SuiteCategory;
  webApps: string[];
  nativeModules: string[];
  engines: string[];
  apis: string[];
  aiAgents: AIAgent[];
  permissions: string[];
  hotSwappable: boolean;
  dependencies?: string[];
  integrations?: Integration[];
  icon?: string;
  color?: string;
  description?: string;
}

export type SuiteStatus =
  | 'inactive' // Suite not loaded
  | 'loading' // Suite loading dependencies
  | 'active' // Suite running
  | 'error' // Suite failed to load
  | 'disabled'; // Suite disabled by admin

export interface SuiteState {
  manifest: SuiteManifest;
  status: SuiteStatus;
  error?: string;
  loadedAt?: Date;
  mountedApps: Set<string>;
  mountedModules: Set<string>;
  activeEngines: Set<string>;
}

export type UserMode = 'county-staff' | 'power-user';

export interface LauncherConfig {
  gridColumns: number;
  tileSize: 'small' | 'medium' | 'large';
  showDescriptions: boolean;
  enableAnimations: boolean;
  userMode: UserMode;
}

export interface AIDrawerState {
  isOpen: boolean;
  activeSuite?: string;
  activeAgents: AIAgent[];
  conversationHistory: AIMessage[];
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
}

export interface RouteParams {
  suiteId: string;
  appId?: string;
  moduleId?: string;
  view?: string;
}

export interface SuiteActivationResult {
  success: boolean;
  suiteId: string;
  loadedApps: string[];
  loadedModules: string[];
  error?: string;
}
