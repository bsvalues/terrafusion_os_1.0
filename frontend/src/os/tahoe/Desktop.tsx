/**
 * TerraFusion macOS Tahoe Desktop Shell
 * Main desktop orchestrator using existing brand system
 */

import React, { useState } from 'react';
import { Dock } from './Dock';
import { LaunchpadOverlay } from './LaunchpadOverlay';
import { Spotlight } from './Spotlight';
import { TopMenuBar } from './TopMenuBar';
import { Wallpaper } from './Wallpaper';
import { WidgetSidebar } from './WidgetSidebar';
import { WindowManager } from './WindowManager';
import './styles/tahoe-desktop.css';

export type UserMode = 'county' | 'power';

export interface DesktopWindow {
  id: string;
  type: 'suite' | 'app';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
}

export function Desktop() {
  const [mode, setMode] = useState<UserMode>('county');
  const [launchpadVisible, setLaunchpadVisible] = useState(false);
  const [spotlightVisible, setSpotlightVisible] = useState(false);
  const [windows, setWindows] = useState<DesktopWindow[]>([]);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);

  const handleLaunchpadToggle = () => {
    setLaunchpadVisible(!launchpadVisible);
  };

  const handleSpotlightToggle = () => {
    setSpotlightVisible(!spotlightVisible);
  };

  const handleOpenItem = (itemType: string, itemId: string, itemTitle: string) => {
    // Check if window already exists
    const existingWindow = windows.find((w) => w.id === itemId);
    if (existingWindow) {
      setActiveWindow(itemId);
      return;
    }

    // Create new window
    const newWindow: DesktopWindow = {
      id: itemId,
      type: itemType,
      title: itemTitle,
      x: 100 + windows.length * 40,
      y: 100 + windows.length * 40,
      width: 800,
      height: 600,
      minimized: false,
      maximized: false,
    };

    setWindows([...windows, newWindow]);
    setActiveWindow(itemId);
    setLaunchpadVisible(false);
  };

  const handleCloseWindow = (id: string) => {
    setWindows(windows.filter((w) => w.id !== id));
    if (activeWindow === id) {
      setActiveWindow(null);
    }
  };

  const handleModeToggle = () => {
    setMode(mode === 'county' ? 'power' : 'county');
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Space for Spotlight
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        handleSpotlightToggle();
      }
      // Escape to close overlays
      if (e.code === 'Escape') {
        setLaunchpadVisible(false);
        setSpotlightVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className='tahoe-desktop'>
      <Wallpaper />

      <TopMenuBar
        mode={mode}
        activeWindowTitle={
          activeWindow ? windows.find((w) => w.id === activeWindow)?.title : undefined
        }
        onModeToggle={handleModeToggle}
        onSpotlightOpen={handleSpotlightToggle}
      />

      <WindowManager
        windows={windows}
        activeWindow={activeWindow}
        onFocus={setActiveWindow}
        onClose={handleCloseWindow}
        onMinimize={(id) => {
          setWindows(windows.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)));
        }}
        onMaximize={(id) => {
          setWindows(windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)));
        }}
        onUpdateWindow={(id, updates) => {
          setWindows(windows.map((w) => (w.id === id ? { ...w, ...updates } : w)));
        }}
      />

      <WidgetSidebar />

      <Dock
        mode={mode}
        onLaunchpadToggle={handleLaunchpadToggle}
        onOpenItem={handleOpenItem}
        activeApps={windows.map((w) => w.id)}
      />

      <LaunchpadOverlay
        visible={launchpadVisible}
        mode={mode}
        onClose={() => setLaunchpadVisible(false)}
        onOpenItem={handleOpenItem}
      />

      <Spotlight
        visible={spotlightVisible}
        onClose={() => setSpotlightVisible(false)}
        onOpenItem={handleOpenItem}
      />
    </div>
  );
}
