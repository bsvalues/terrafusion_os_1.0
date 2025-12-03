/**
 * TerraFusion OS - Shell Root
 *
 * Master orchestrator: Desktop vs OS Frame
 * Blends macOS/Windows desktop launcher with Pro workspace frame
 */

import React, { useState } from 'react';
import { DesktopHome } from '../desktop/DesktopHome';
import { OSFrame } from './OSFrame';

type ActiveView =
  | { type: 'desktop' }
  | { type: 'suite'; suiteId: string }
  | { type: 'app'; appId: string };

type UserMode = 'county' | 'power';

export const ShellRoot: React.FC = () => {
  const [view, setView] = useState<ActiveView>({ type: 'desktop' });
  const [mode, setMode] = useState<UserMode>('county');

  const openSuite = (suiteId: string) => setView({ type: 'suite', suiteId });
  const openApp = (appId: string) => setView({ type: 'app', appId });
  const goHome = () => setView({ type: 'desktop' });

  const toggleMode = () => setMode((prev) => (prev === 'county' ? 'power' : 'county'));

  if (view.type === 'desktop') {
    return (
      <DesktopHome
        onOpenSuite={openSuite}
        onOpenApp={openApp}
        mode={mode}
        onToggleMode={toggleMode}
      />
    );
  }

  return <OSFrame view={view} mode={mode} onToggleMode={toggleMode} onGoHome={goHome} />;
};
