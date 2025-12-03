/**
 * TerraFusion OS - OS Frame (Pro Workspace)
 *
 * Full "pro" OS frame with:
 * - Top system bar (TF identity + mode toggle + Home button)
 * - Left rail (Suites nav)
 * - Center (Suite workspace)
 * - Right (AI drawer)
 */

import React from 'react';
import { SUITES } from '../suites';
import './osframe.css';

type UserMode = 'county' | 'power';

type ActiveView = { type: 'suite'; suiteId: string } | { type: 'app'; appId: string };

interface OSFrameProps {
  view: ActiveView;
  mode: UserMode;
  onToggleMode: () => void;
  onGoHome: () => void;
}

export const OSFrame: React.FC<OSFrameProps> = ({ view, mode, onToggleMode, onGoHome }) => {
  const activeSuite =
    view.type === 'suite' ? (SUITES.find((s) => s.id === view.suiteId) ?? null) : null;

  return (
    <div className='tf-os-frame'>
      {/* Minimal top bar - just home button */}
      <div className='tf-os-topbar'>
        <button type='button' className='tf-os-home-btn' onClick={onGoHome}>
          <span className='tf-os-home-icon'>⬅</span>
          <span>Desktop</span>
        </button>

        <div className='tf-os-topbar-spacer' />

        <button type='button' className='tf-os-mode-btn' onClick={onToggleMode}>
          {mode === 'county' ? '👤 County' : '🔬 Power'}
        </button>
      </div>

      {/* Full-screen immersive workspace */}
      <div className='tf-os-workspace'>
        {view.type === 'suite' && activeSuite && (
          <SuiteWorkspace suiteId={activeSuite.id} mode={mode} />
        )}

        {view.type === 'app' && <AppWorkspace appId={view.appId} mode={mode} />}
      </div>
    </div>
  );
};

interface SuiteWorkspaceProps {
  suiteId: string;
  mode: UserMode;
}

const SuiteWorkspace: React.FC<SuiteWorkspaceProps> = ({ suiteId, mode }) => {
  return (
    <div className='tf-suite-fullscreen'>
      <h1 className='tf-suite-title'>{suiteId.charAt(0).toUpperCase() + suiteId.slice(1)} Suite</h1>
      <p className='tf-suite-subtitle'>
        {mode === 'county' ? 'Simple, guided workflow' : 'Full power analytics & transparency'}
      </p>

      <div className='tf-suite-content'>
        {/* Suite content will render here full-screen */}
        <div className='tf-suite-placeholder'>
          <div className='tf-suite-placeholder-icon'>🚧</div>
          <h3>{suiteId.toUpperCase()} IMPLEMENTATION</h3>
          <p>Full-screen suite workspace • No sidebars • No chrome • Pure focus</p>
        </div>
      </div>
    </div>
  );
};

interface AppWorkspaceProps {
  appId: string;
  mode: UserMode;
}

const AppWorkspace: React.FC<AppWorkspaceProps> = ({ appId, mode }) => {
  return (
    <div className='tf-suite-fullscreen'>
      <h1 className='tf-suite-title'>{appId.charAt(0).toUpperCase() + appId.slice(1)}</h1>
      <p className='tf-suite-subtitle'>
        Standalone App • {mode === 'county' ? 'Simplified' : 'Full Power'}
      </p>

      <div className='tf-suite-content'>
        <div className='tf-suite-placeholder'>
          <div className='tf-suite-placeholder-icon'>🚀</div>
          <h3>{appId.toUpperCase()} APP</h3>
          <p>Full-screen immersive experience</p>
        </div>
      </div>
    </div>
  );
};
