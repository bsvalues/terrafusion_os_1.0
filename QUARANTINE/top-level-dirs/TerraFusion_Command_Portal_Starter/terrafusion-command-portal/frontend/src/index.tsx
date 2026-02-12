import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Main entry point for TerraFusion Command Portal
const container = document.getElementById('root')
if (!container) {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
}

const root = createRoot(container || document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)