import React, { useEffect, useState } from 'react';
import { TerraSphereCanvas } from '../../terrasphere/TerraSphereCanvas';
import { WorkspaceRouter } from '../../workspaces/WorkspaceRouter';
import { TerraCommandPalette } from '../command/TerraCommandPalette';
import { RightContextRail } from '../layout/RightContextRail';
import { SacredGrid } from '../layout/SacredGrid';
import { TahoeTopStrip } from '../layout/TahoeTopStrip';
import { OmniIntentProvider } from '../state/OmniIntentContext';
import { OSModeProvider } from '../state/OSModeContext';
import { WorkspaceProvider } from '../state/WorkspaceContext';

export const TerraFusionShell: React.FC = () => {
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const key = e.key.toLowerCase();

      const isCommandShortcut =
        (isMac && e.metaKey && key === 'k') || (!isMac && e.ctrlKey && key === 'k');

      if (isCommandShortcut) {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }

      if (e.key === 'Escape') {
        setIsCommandOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <OSModeProvider>
      <WorkspaceProvider>
        <OmniIntentProvider>
          <div className='h-screen w-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden'>
            {/* Background field (for now: gradient + glow) */}
            <TerraSphereCanvas />

            {/* Foreground shell */}
            <div className='relative z-10 flex flex-col h-full'>
              <TahoeTopStrip />

              <div className='flex-1 p-6'>
                <SacredGrid>
                  {/* Main workspace area: 9 columns */}
                  <main className='col-span-9 h-full flex items-center justify-center'>
                    <WorkspaceRouter />
                  </main>

                  {/* Right rail: 3 columns */}
                  <div className='col-span-3 h-full'>
                    <RightContextRail />
                  </div>
                </SacredGrid>
              </div>
            </div>

            {/* TerraCommand overlay */}
            <TerraCommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
          </div>
        </OmniIntentProvider>
      </WorkspaceProvider>
    </OSModeProvider>
  );
};
