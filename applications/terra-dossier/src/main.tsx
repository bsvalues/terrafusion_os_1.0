import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("⚡ TERRAFUSION IGNITION SEQUENCE START ⚡");

const rootEl = document.getElementById('root');
if (rootEl) {
    ReactDOM.createRoot(rootEl).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
} else {
    document.body.innerHTML = "<h1>CRITICAL: ROOT ELEMENT MISSING</h1>";
}
