/**
 * TerraFusion OS Module Configuration
 *
 * Defines the core government modules available in the operating system.
 * These definitions drive the Start Menu, Taskbar, and Window Manager.
 * 
 * NOTE: CostForge is the upgraded replacement for TerraBuild.
 * The name was changed to better reflect its purpose as an
 * AI-powered cost/valuation system for property assessment.
 */

import type { ModuleDefinition } from '../stores/moduleRegistryStore';

export const TERRAFUSION_MODULES: ModuleDefinition[] = [
  // ============================================================================
  // Tier 1: Core Government Operations
  // ============================================================================
  
  // CostForge - Primary Property Assessment System (formerly TerraBuild)
  {
    id: 'costforge',
    name: 'costforge',
    displayName: 'CostForge',
    description: 'AI-Powered Property Assessment & Valuation System',
    icon: '🏛️',
    launchPath: '/modules/costforge',
    category: 'Assessment',
    tier: 'Tier1',
    status: 'active',
    version: '2.1.0',
    isCore: true,
    priority: 1,
  },
  
  // Levy Calculator - Tax Management
  {
    id: 'levy-calculator',
    name: 'levy-calculator',
    displayName: 'Levy Calculator',
    description: 'Tax Levy Management & Calculations',
    icon: '📊',
    launchPath: '/modules/levy',
    category: 'Tax',
    tier: 'Tier1',
    status: 'active',
    version: '1.5.0',
    isCore: true,
    priority: 2,
  },
  
  // GIS Viewer - Geographic Information
  {
    id: 'gis-viewer',
    name: 'gis-viewer',
    displayName: 'GIS Viewer',
    description: 'Geographic Information System & Parcel Mapping',
    icon: '🗺️',
    launchPath: '/modules/gis',
    category: 'Mapping',
    tier: 'Tier1',
    status: 'active',
    version: '3.0.0',
    isCore: true,
    priority: 3,
  },

  // ============================================================================
  // Tier 2: Document & Records Management
  // ============================================================================
  
  {
    id: 'document-manager',
    name: 'document-manager',
    displayName: 'Document Manager',
    description: 'County Document Repository & Records',
    icon: '📁',
    launchPath: '/modules/documents',
    category: 'Records',
    tier: 'Tier2',
    status: 'active',
    version: '1.2.0',
    isCore: false,
    priority: 4,
  },
  
  {
    id: 'reporting',
    name: 'reporting',
    displayName: 'Reports & Analytics',
    description: 'Government Analytics & Reporting Dashboard',
    icon: '📈',
    launchPath: '/modules/reports',
    category: 'Analytics',
    tier: 'Tier2',
    status: 'active',
    version: '2.0.0',
    isCore: false,
    priority: 5,
  },

  // ============================================================================
  // AI & Intelligence Modules
  // ============================================================================
  
  {
    id: 'atlas-ai',
    name: 'atlas-ai',
    displayName: 'ATLAS Intelligence',
    description: 'Autonomous Telemetry, Learning & Analytics System',
    icon: '🤖',
    launchPath: '/modules/atlas',
    category: 'AI',
    tier: 'Tier2',
    status: 'active',
    version: '1.0.0',
    isCore: false,
    priority: 6,
  },
  
  {
    id: 'terra-gaia',
    name: 'terra-gaia',
    displayName: 'TerraGaia',
    description: 'Natural Language Government Intelligence Assistant',
    icon: '🌍',
    launchPath: '/modules/terra-gaia',
    category: 'AI',
    tier: 'Tier2',
    status: 'active',
    version: '1.0.0',
    isCore: false,
    priority: 7,
  },

  // ============================================================================
  // System & Administration
  // ============================================================================
  
  {
    id: 'settings',
    name: 'settings',
    displayName: 'System Settings',
    description: 'TerraFusion OS Configuration & Preferences',
    icon: '⚙️',
    launchPath: '/modules/settings',
    category: 'System',
    tier: 'Tier2',
    status: 'active',
    version: '1.0.0',
    isCore: false,
    priority: 99,
  },
];
