import React from 'react';
import ReactDOM from 'react-dom/client';
import TestApp from './TestApp';
import './index.css';

console.log('Test app loading...');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);

console.log('Test app mounted!');