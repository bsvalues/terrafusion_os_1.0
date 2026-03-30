/**
 * TerraFusion OS Scene Store
 *
 * Canonical Scenes are predefined window arrangements for government
 * assessment workflows. Each scene opens a specific set of suite windows
 * in a known layout — NOT generative AI layouts.
 *
 * Phase 8 Design Manifesto: Context Mode / Canonical Scenes
 *
 * @module stores/sceneStore
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export type SceneCategory =
  | 'valuation'
  | 'review'
  | 'compliance'
  | 'intake'
  | 'analysis';

export interface SceneWindow {
  /** Canonical module ID (matches moduleActivation registry) */
  moduleId: string;
  /** Optional metadata passed to the module on activation */
  metadata?: Record<string, unknown>;
}

export interface Scene {
  id: string;
  label: string;
  description: string;
  category: SceneCategory;
  icon: string;
  /** Ordered list of windows to open for this scene */
  windows: SceneWindow[];
  /** Keywords for command palette search */
  keywords: string[];
}

export interface SceneState {
  /** Currently active scene ID, or null */
  activeSceneId: string | null;

  /** Activate a scene (store tracks it; caller handles window opening) */
  activateScene: (sceneId: string) => void;

  /** Clear the active scene */
  clearScene: () => void;

  /** Get a scene by ID */
  getScene: (sceneId: string) => Scene | undefined;
}

// ============================================================================
// Canonical Scene Library
// ============================================================================

export const SCENE_LIBRARY: Scene[] = [
  {
    id: 'ingestion-gate',
    label: 'Ingestion Gate',
    description:
      'New parcel data intake: valuation workspace + document evidence archive.',
    category: 'intake',
    icon: '📥',
    windows: [
      { moduleId: 'suite-forge' },
      { moduleId: 'suite-dossier' },
    ],
    keywords: ['ingestion', 'intake', 'new', 'parcel', 'data', 'import'],
  },
  {
    id: 'neighborhood-review',
    label: 'Neighborhood Review',
    description:
      'GIS mapping + valuation side-by-side for neighborhood analysis.',
    category: 'review',
    icon: '🏘️',
    windows: [
      { moduleId: 'suite-atlas' },
      { moduleId: 'suite-forge' },
    ],
    keywords: ['neighborhood', 'review', 'map', 'analysis', 'area'],
  },
  {
    id: 'ratio-study',
    label: 'Ratio Study',
    description:
      'Valuation analysis with AI insights for ratio study compliance.',
    category: 'analysis',
    icon: '📊',
    windows: [
      { moduleId: 'suite-forge' },
      { moduleId: 'suite-gpt' },
    ],
    keywords: ['ratio', 'study', 'compliance', 'analysis', 'IAAO'],
  },
  {
    id: 'appeal-defense',
    label: 'Appeal Defense Pack',
    description:
      'Build BOE appeal defense: evidence + valuation + governance workflow.',
    category: 'compliance',
    icon: '⚖️',
    windows: [
      { moduleId: 'suite-dossier' },
      { moduleId: 'suite-forge' },
      { moduleId: 'suite-dais' },
    ],
    keywords: ['appeal', 'defense', 'BOE', 'board', 'equalization', 'packet'],
  },
  {
    id: 'roll-certification',
    label: 'Roll Certification',
    description:
      'Assessment roll certification workflow with document verification.',
    category: 'compliance',
    icon: '✅',
    windows: [
      { moduleId: 'suite-dais' },
      { moduleId: 'suite-dossier' },
    ],
    keywords: ['roll', 'certification', 'assessment', 'certify', 'DOR'],
  },
  {
    id: 'daily-appraiser',
    label: 'Daily Appraiser',
    description:
      'Standard appraiser workspace: Forge for valuation + Atlas for mapping.',
    category: 'valuation',
    icon: '🏠',
    windows: [
      { moduleId: 'suite-forge' },
      { moduleId: 'suite-atlas' },
    ],
    keywords: ['daily', 'appraiser', 'workspace', 'standard', 'valuation'],
  },
  {
    id: 'permit-intake',
    label: 'Permit Intake',
    description:
      'Building permit processing: governance workflow + mapping overlay.',
    category: 'intake',
    icon: '🏗️',
    windows: [
      { moduleId: 'suite-dais' },
      { moduleId: 'suite-atlas' },
    ],
    keywords: ['permit', 'building', 'intake', 'construction'],
  },
  {
    id: 'ai-research',
    label: 'AI Research Station',
    description:
      'AI assistant with valuation data for research and analysis.',
    category: 'analysis',
    icon: '🤖',
    windows: [
      { moduleId: 'suite-gpt' },
      { moduleId: 'suite-forge' },
      { moduleId: 'suite-atlas' },
    ],
    keywords: ['ai', 'research', 'gpt', 'analysis', 'assistant'],
  },
  {
    id: 'calibration-run',
    label: 'Calibration Run',
    description:
      'Ratio study execution: run mass appraisal model calibration, tune coefficients, and validate output against IAAO standards.',
    category: 'analysis',
    icon: '⚙️',
    windows: [
      { moduleId: 'suite-forge' },
      { moduleId: 'suite-gpt' },
    ],
    keywords: ['calibration', 'model', 'tuning', 'ratio', 'study', 'IAAO', 'validation', 'run'],
  },
  {
    id: 'time-adjustment',
    label: 'Time Adjustment Cockpit',
    description:
      'Sales timeline analysis with time adjustment matrix and compliance verification for assessment date alignment.',
    category: 'compliance',
    icon: '📅',
    windows: [
      { moduleId: 'suite-forge' },
      { moduleId: 'suite-dais' },
    ],
    keywords: ['time', 'adjustment', 'sales', 'timeline', 'compliance', 'assessment', 'date'],
  },
  {
    id: 'drift-warning',
    label: 'Drift Warning',
    description:
      'Monitor assessment drift: drift indicators, QA checklist review, and governance alert triage for at-risk parcels.',
    category: 'compliance',
    icon: '⚠️',
    windows: [
      { moduleId: 'suite-forge' },
      { moduleId: 'suite-dais' },
      { moduleId: 'suite-gpt' },
    ],
    keywords: ['drift', 'warning', 'monitor', 'QA', 'governance', 'alert', 'compliance'],
  },
];

// ============================================================================
// Store
// ============================================================================

export const useSceneStore = create<SceneState>()((set) => ({
  activeSceneId: null,

  activateScene: (sceneId) => set({ activeSceneId: sceneId }),

  clearScene: () => set({ activeSceneId: null }),

  getScene: (sceneId) => SCENE_LIBRARY.find((s) => s.id === sceneId),
}));

export default useSceneStore;
