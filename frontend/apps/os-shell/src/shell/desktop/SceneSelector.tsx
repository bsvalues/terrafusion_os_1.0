/**
 * SceneSelector — Canonical Scene Picker
 *
 * Slide-out panel listing predefined workflow scenes.
 * Each scene opens a specific set of suite windows for a government
 * assessment task.
 *
 * Phase 8 Design Manifesto: Context Mode / Canonical Scenes
 *
 * @module shell/desktop/SceneSelector
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { LiquidPanel } from '../../ui/materials';
import { useSceneStore, SCENE_LIBRARY, type Scene, type SceneCategory } from '../../stores/sceneStore';
import { activateModule } from '../../orchestration/moduleActivation';
import './scene-selector.css';

// ============================================================================
// Category labels
// ============================================================================

const CATEGORY_LABELS: Record<SceneCategory, string> = {
  valuation: 'Valuation',
  review: 'Review',
  compliance: 'Compliance',
  intake: 'Intake',
  analysis: 'Analysis',
};

const CATEGORY_ORDER: SceneCategory[] = [
  'valuation',
  'intake',
  'review',
  'compliance',
  'analysis',
];

// ============================================================================
// Props
// ============================================================================

interface SceneSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function SceneSelector({ isOpen, onClose }: SceneSelectorProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { activateScene, activeSceneId } = useSceneStore();

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  const handleActivateScene = useCallback(
    (scene: Scene) => {
      activateScene(scene.id);
      // Open each window in the scene
      for (const w of scene.windows) {
        activateModule(w.moduleId, {
          source: 'system',
          metadata: { scene: scene.id, ...w.metadata },
        });
      }
      onClose();
    },
    [activateScene, onClose],
  );

  // Group scenes by category
  const groupedScenes = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    scenes: SCENE_LIBRARY.filter((s) => s.category === cat),
  })).filter((g) => g.scenes.length > 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className='scene-backdrop'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-label='Scene Selector'
        tabIndex={-1}
        className={`scene-panel ${isOpen ? 'scene-panel--open' : ''}`}
      >
        <LiquidPanel variant='shell' className='h-full flex flex-col'>
          {/* Header */}
          <div className='scene-header'>
            <div>
              <h2 className='scene-title'>Scenes</h2>
              <p className='scene-subtitle'>
                Predefined window layouts for assessment workflows
              </p>
            </div>
            <button
              onClick={onClose}
              className='scene-close'
              aria-label='Close scene selector'
            >
              ✕
            </button>
          </div>

          {/* Scene List */}
          <div className='scene-list'>
            {groupedScenes.map((group) => (
              <div key={group.category} className='scene-group'>
                <h3 className='scene-group-label'>{group.label}</h3>
                {group.scenes.map((scene) => {
                  const isActive = scene.id === activeSceneId;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => handleActivateScene(scene)}
                      className={`scene-card ${isActive ? 'scene-card--active' : ''}`}
                    >
                      <span className='scene-card-icon'>{scene.icon}</span>
                      <div className='scene-card-content'>
                        <span className='scene-card-label'>{scene.label}</span>
                        <span className='scene-card-desc'>{scene.description}</span>
                        <span className='scene-card-windows'>
                          {scene.windows.length} window{scene.windows.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </LiquidPanel>
      </div>
    </>
  );
}
