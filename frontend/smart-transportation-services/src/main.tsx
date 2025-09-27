import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import './App.css'

// Transportation System Performance Monitoring
const startTime = performance.now();

// Service Worker Registration for Offline Capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('🚦 Transportation SW registered:', registration);
      })
      .catch((error) => {
        console.log('🚫 Transportation SW registration failed:', error);
      });
  });
}

// Transportation Notification Permissions
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('🔔 Transportation notifications enabled');
    }
  });
}

// Initialize Transportation System
const initializeTransportationSystem = () => {
  const loadTime = performance.now() - startTime;
  console.log(`🚀 TerraFusion Smart Transportation System initialized in ${loadTime.toFixed(2)}ms`);
  
  // Transportation system ready notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('TerraFusion Smart Transportation', {
      body: 'Intelligent Transport Systems Online\nBenton County Transportation Authority: (509) 735-3300',
      icon: '/favicon.ico',
      tag: 'transportation-ready'
    });
  }
  
  // Log transportation system status
  console.log('🚦 Transportation Management System Status:');
  console.log('   📍 Coverage: Benton County, Washington (1,703.4 sq mi)');
  console.log('   🚦 Smart Signals: 142 adaptive traffic signals');
  console.log('   🚌 Transit: Ben Franklin Transit (28 routes)');
  console.log('   🅿️ Parking: 8,430 managed spaces');
  console.log('   🛣️ Corridors: I-82, SR-240, Columbia Drive, Keene Road');
  console.log('   ⚡ Features: Real-time monitoring, signal optimization, incident detection');
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// Initialize after render
setTimeout(initializeTransportationSystem, 100);