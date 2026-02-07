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

// ═══════════════════════════════════════════════════════════════
// PHASE 9: Motion Kill-Switch (Stabilization)
// In dev mode, disable animations by default to prevent screen jank.
// Remove class to preview animations: document.documentElement.classList.remove('reduce-motion-force')
// ═══════════════════════════════════════════════════════════════
if (import.meta.env.DEV) {
  document.documentElement.classList.add('reduce-motion-force');
  console.log(
    '%c[TerraFusion] Motion reduced in dev mode. Run: document.documentElement.classList.remove("reduce-motion-force") to preview animations.',
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
