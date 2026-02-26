import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { FEATURES } from './config/features';
import './globals.css';
import './i18n/config'; // Initialize i18n

// TerraFusion Elite Console Error Filter - Suppress external extension noise
import './utils/consoleErrorFilter';

// Router is the main entry point - contains all routes including /desktop -> App
import Router from './Router';
import { registerPWA } from './pwa';

// Motion override is opt-in only.
// Set VITE_FORCE_REDUCE_MOTION=1 to force reduced motion in development.
if (import.meta.env.DEV && import.meta.env.VITE_FORCE_REDUCE_MOTION === '1') {
  document.documentElement.classList.add('reduce-motion-force');
  console.log(
    '%c[TerraFusion] Forced reduced motion enabled (VITE_FORCE_REDUCE_MOTION=1).',
    'color: #00e5ff'
  );
}

// Console Badge for IT Admins
console.log(
  `%c TERRAFUSION OS v1.0 %c SOVEREIGNTY: ${import.meta.env.VITE_SOVEREIGN_DOMAIN || 'unknown'} `,
  'background: var(--tf-bg-surface); color: var(--tf-transcend-highlight); padding: 4px; border-radius: 4px 0 0 4px;',
  'background: var(--tf-transcend-highlight); color: var(--tf-void-black); padding: 4px; border-radius: 0 4px 4px 0;'
);

console.table(FEATURES); // Transparency for the operator

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

// Register Service Worker
registerPWA();

root.render(
  <StrictMode>
    <Router />
  </StrictMode>
);
