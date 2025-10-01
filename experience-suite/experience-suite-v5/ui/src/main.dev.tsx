// ui/src/main.dev.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

async function enableMSW() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}
enableMSW().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
});
