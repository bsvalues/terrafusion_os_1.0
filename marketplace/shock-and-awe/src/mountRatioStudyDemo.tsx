import React from 'react';
import { createRoot } from 'react-dom/client';
import RatioStudyBenton from './pages/RatioStudyBenton';

const rootEl = document.getElementById('root') || (() => {
  const el = document.createElement('div');
  el.id = 'root';
  document.body.appendChild(el);
  return el;
})();

createRoot(rootEl).render(
  <React.StrictMode>
    <RatioStudyBenton />
  </React.StrictMode>
);
