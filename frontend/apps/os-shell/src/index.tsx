import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { FEATURES } from './config/features';
import './globals.css';
import './i18n/config'; // Initialize i18n
import logger from './utils/logger';

// TerraFusion Elite Console Error Filter - Suppress external extension noise
import './utils/consoleErrorFilter';

// Router is the main entry point - contains all routes including /desktop -> App
import Router from './Router';
import { registerPWA } from './pwa';

// Motion override is opt-in only.
// Set VITE_FORCE_REDUCE_MOTION=1 to force reduced motion in development.
if (import.meta.env.DEV && import.meta.env.VITE_FORCE_REDUCE_MOTION === '1') {
  document.documentElement.classList.add('reduce-motion-force');
  logger.info('Forced reduced motion enabled (VITE_FORCE_REDUCE_MOTION=1).');
}

// Console Badge for IT Admins
logger.info(
  `TERRAFUSION OS v1.0 | SOVEREIGNTY: ${import.meta.env.VITE_SOVEREIGN_DOMAIN || 'unknown'}`
);

logger.debug('Feature flags:', FEATURES); // Transparency for the operator

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

// Register Service Worker
registerPWA();

root.render(
  <StrictMode>
    <Router />
  </StrictMode>
);
