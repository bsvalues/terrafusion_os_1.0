import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';

// TerraFusion Elite Console Error Filter - Suppress external extension noise
import './utils/consoleErrorFilter';

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
