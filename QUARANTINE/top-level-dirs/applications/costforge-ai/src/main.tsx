import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import CostForgeApp from './CostForgeApp';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CostForgeApp />
  </StrictMode>,
);