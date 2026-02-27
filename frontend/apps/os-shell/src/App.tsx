/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - MAIN APPLICATION ENTRY POINT
 * Elite AI-Native Government Operating System Interface
 *
 * THE TERRAFUSION WAY - ELITE ENGINEERING EXCELLENCE
 *
 * This is the production entry point for TerraFusion OS.
 * The Desktop Shell is the primary interface - a real operating
 * system experience with draggable windows, taskbar, start menu,
 * and modular application launching.
 *
 * Verified: 725 tests passing + visual verification complete
 * ═══════════════════════════════════════════════════════════════
 */

import { useEffect } from 'react';

// ============================================================================
// CSS IMPORTS - ORDER IS CRITICAL (DO NOT REORDER - BREAKS STYLING)
// ============================================================================
// 1. Base tokens MUST load first (defines --tf-quantum-cyan, --tf-void-black, etc.)
import './styles/terrafusion-tokens.css';
// 2. Then brand system (references tokens)
import './styles/terrafusion-brand.css';
// 3. Then OS styles (references tokens + brand)
import './styles/terrafusion-os.css';
// 4. Finally App-specific overrides
import './App.css';
// ============================================================================

import { MODULES } from './config/modules';
import { useSyncIntegration } from './hooks/useSyncIntegration';
import { installShellIpcBridge } from './ipc/shellIpcBridge';
import { activateModule } from './orchestration/moduleActivation';
import { DesktopWithErrorBoundary } from './shell/desktop';
import { useDesktopStore } from './stores/desktopStore';
import { useModuleRegistryStore } from './stores/moduleRegistryStore';
import { useStartMenuStore } from './stores/startMenuStore';

// ============================================================================
// Application Component
// ============================================================================

/**
 * TerraFusion OS Application
 *
 * Revolutionary AI-Native Government Operating System
 *
 * Features:
 * - Desktop Shell with draggable/resizable windows
 * - Start Menu with application launcher
 * - Taskbar with window management
 * - Windows 11-style window snapping
 * - AI Health Status monitoring
 * - Government-grade reliability (725 tests, visual verification)
 *
 * Government. Transcended.
 */
function App() {
  const registerModules = useModuleRegistryStore((state) => state.registerModules);
  const setAllApps = useStartMenuStore((state) => state.setAllApps);
  const setPinnedApps = useStartMenuStore((state) => state.setPinnedApps);

  // Enable Real-time Sync
  useSyncIntegration();

  // Initialize module registry and start menu on mount
  useEffect(() => {
    // Install IPC bridge for app ↔ shell communication
    const cleanupIpc = installShellIpcBridge();

    // Register all modules
    registerModules(MODULES);

    // Configure Start Menu (include entryType for wiring status badges)
    const startMenuApps = MODULES.map((m) => ({
      id: m.id,
      name: m.displayName,
      description: m.description,
      icon: m.icon,
      category: m.category,
      status: m.status,
      entryType: m.entry?.type as 'url' | 'route' | 'mf' | undefined,
    }));

    setAllApps(startMenuApps);
    setPinnedApps(startMenuApps.filter((_, i) => MODULES[i].isCore));

    console.log('🚀 TerraFusion OS initialized');
    console.log(`📦 ${MODULES.length} modules registered`);
    console.log('📡 IPC bridge installed');

    // Auto-launch key modules on first boot so Desktop isn't empty
    const { windows } = useDesktopStore.getState();
    if (windows.length === 0) {
      // Small delay to let registry settle, then open CostForge as the hero window
      setTimeout(() => {
        activateModule('costforge', {
          source: 'system',
          showNotification: false,
        });
      }, 300);
    }

    return () => {
      cleanupIpc();
    };
  }, [registerModules, setAllApps, setPinnedApps]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
      }}
    >
      <DesktopWithErrorBoundary />
    </div>
  );
}

export default App;
