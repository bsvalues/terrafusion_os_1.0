import React from 'react';
import { createRoot } from 'react-dom/client';
import AppShell from './AppShell';

const rootEl = document.getElementById('root') || (() => {
  const el = document.createElement('div');
  el.id = 'root';
  document.body.appendChild(el);
  return el;
})();

createRoot(rootEl).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);
