import React, {useState, useEffect} from 'react';

// TerraFusion Brand System Integration
// Connects sophisticated backend architecture with polished user experience

export const BrandColors = {primary: '#0099ff', // Trust & Technology
  primaryDark: '#0077cc',
  accent: '#00ffaa', // Growth & Success
  accentDark: '#00cc88',
  transcend: '#00ffee', // Transcendence & Innovation
  dark: '#0b1020', // Depth & Sophistication
  darkLighter: '#1a1f3a',
  light: '#ffffff',
  gray: '#888888',
  grayLight: '#cccccc',
  error: '#ff3333',
  success: '#00ff88',
  warning: '#ffaa00',
  clarity: '#e0f7ff',} as const;

export const BrandMicrocopy = {confirmation: [
    'Transcendence complete.',
    'Your path is clear.',
    'All systems: Ready.',
    'Clarity achieved.',
    'Excellence delivered.',
  ],
  loading: [
    'Preparing transcendence…',
    'Advancing county intelligence…',
    'Orchestrating clarity…',
    'Elevating government operations…',
    'Transforming complexity…',
  ],
  error: [
    "Let's clear the path—together.",
    'We anticipate, we adapt, we solve.',
    'Support is standing by your side.',
    "This isn't a setback, it's a setup for clarity.",
    "We're here to help you transcend this.",
  ],
  emptyState: [
    'A blank page for transformation.',
    'Every great solution starts here.',
    "Ready to transcend what's possible?",
    'Your next breakthrough begins now.',
    'The future is waiting to be built.',
  ],} as const;

interface BrandSplashProps {onComplete: () => void;
  currentStep?: string;}

export const BrandSplash: React.FC<BrandSplashProps>= ({onComplete, currentStep}) => {const [loadingMessage, setLoadingMessage] = useState('Preparing transcendence…');
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let messageIndex = 0;
    let progressValue = 0;

    const interval = setInterval(() => {
      progressValue += 2;
      setProgress(progressValue);

      if (progressValue % 20 === 0) {
        messageIndex = (messageIndex + 1) % BrandMicrocopy.loading.length;
        setLoadingMessage(BrandMicrocopy.loading[messageIndex]);}

      if (progressValue >= 100) {clearInterval(interval);
        setTimeout(() => {
          setLoadingMessage('Transcendence complete.');
          setTimeout(onComplete, 800);}, 500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (<div className='brand-splash'><div className='splash-content'><div className='logo-container'><svg width='120' height='120' viewBox='0 0 120 120' className='brand-logo'><defs><linearGradient id='brandGradient' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stopColor={BrandColors.primary} stopOpacity={1} /><stop offset='100%' stopColor={BrandColors.accent} stopOpacity={1} /></linearGradient></defs><circle
              cx='60'
              cy='60'
              r='50'
              fill='none'
              stroke='url(#brandGradient)'
              strokeWidth='3' /><text
              x='60'
              y='70'
              fontSize='36'
              fontWeight='bold'
              textAnchor='middle'
              fill='url(#brandGradient)'
            >TF</text></svg></div><h1 className='splash-title'>Terrafusion OS</h1><p className='splash-subtitle'>Government. Transcended.</p><p className='splash-tagline'>Turn Complexity into Clarity.</p><p className='splash-motto'>We do it right the first time.</p><div className='loading-container'><div className='loading-bar'><div
              className='loading-progress'
              style={{ '--progress': progress} as React.CSSProperties} /></div><p className='loading-message'>{loadingMessage}</p>{currentStep &&<p className='loading-step'>Current: {currentStep}</p>}
        </div></div></div>
  );
};

interface BrandHeaderProps {userInfo?: {
    name: string;
    authenticated: boolean;
    capabilities: string[];};
}

export const BrandHeader: React.FC<BrandHeaderProps>= ({userInfo}) => {
  return (<header className='brand-header'><div className='header-left'><div className='brand-logo-small'>TF</div><h1 className='brand-app-title'>Terrafusion OS</h1><span className='brand-essence'>Government. Transcended.</span></div><div className='header-center'><nav className='brand-nav'><button className='nav-item active'>Operations</button><button className='nav-item'>Assessment</button><button className='nav-item'>Intelligence</button><button className='nav-item'>Orchestration</button><button className='nav-item'>Transform</button></nav></div><div className='header-right'>{userInfo?.authenticated ? (<div className='user-info'><span className='user-name'>{userInfo.name}</span><div className='user-capabilities'>{userInfo.capabilities.map((cap, idx) => (<span key={idx} className='capability-badge'>{cap}</span>))}</div></div>) : (<button className='auth-button'>Sign In</button>)}</div></header>
  );
};

// Enhanced Loading Component with Brand Integration
interface BrandLoadingProps {message?: string;
  type?: 'default' | 'ai-processing' | 'data-sync' | 'module-load';
  showProgress?: boolean;
  progress?: number;}

export const BrandLoading: React.FC<BrandLoadingProps>= ({message,
  type = 'default',
  showProgress = false,
  progress = 0,}) => {const getLoadingMessage = () => {
    if (message) return message;

    switch (type) {
      case 'ai-processing':
        return 'AI Swarm coordinating response…';
      case 'data-sync':
        return 'Synchronizing county intelligence…';
      case 'module-load':
        return 'Loading enterprise modules…';
      default:
        return BrandMicrocopy.loading[0];}
  };

  return (<div className='brand-loading'><div className='loading-spinner' /><p className='loading-text'>{getLoadingMessage()}</p>{showProgress && (<div className='progress-bar'><div
            className='progress-fill'
            style={{ '--progress': progress} as React.CSSProperties} /></div>)}</div>
  );
};

// Status Indicator with Brand Messaging
interface BrandStatusProps {type: 'success' | 'error' | 'warning' | 'info';
  message?: string;
  autoClose?: boolean;
  duration?: number;}

export const BrandStatus: React.FC<BrandStatusProps>= ({type,
  message,
  autoClose = true,
  duration = 4000,}) => {const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);}
  }, [autoClose, duration]);

  const getBrandMessage = () => {if (message) return message;

    switch (type) {
      case 'success':
        return BrandMicrocopy.confirmation[0];
      case 'error':
        return BrandMicrocopy.error[0];
      case 'warning':
        return 'Attention required for optimal transcendence.';
      case 'info':
        return 'System intelligence update available.';}
  };

  if (!visible) return null;

  return (<div className={`brand-status brand-status--${type}`}><div className='status-icon' /><span className='status-message'>{getBrandMessage()}</span><button className='status-close' onClick={() =>setVisible(false)}>
        ×</button></div>
  );
};
