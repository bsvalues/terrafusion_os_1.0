/**
 * PilotDemo.tsx
 *
 * Phase 2: TerraPilot Tool Invocation Demo Page
 * Temporary route for testing tool invocation UX
 *
 * Route: /pilot-demo
 */

import React from 'react';
import { ToolInvokePanel } from '../components/pilot/ToolInvokePanel';

export const PilotDemo: React.FC = () => {
  return (
    <div className='pilot-demo-page'>
      <header className='demo-header'>
        <div className='header-content'>
          <h1>🛠️ TerraPilot Tool Invocation Demo</h1>
          <p className='tagline'>
            Phase 2 MVP: Read-only tool execution with correlationId-first UX
          </p>
        </div>
      </header>

      <main className='demo-content'>
        <div className='demo-info'>
          <h2>Phase 2 Vertical Slice</h2>
          <ul>
            <li>
              ✅ Single read-only tool invocation (<code>registry.list_tools</code>)
            </li>
            <li>✅ correlationId display on success + failure</li>
            <li>✅ ErrorDisplay integration for backend errors</li>
            <li>✅ Network error handling with client-generated correlationId</li>
            <li>✅ Dev-mode trace query hints</li>
          </ul>
        </div>

        <ToolInvokePanel />

        <footer className='demo-footer'>
          <p className='meta'>
            <strong>Test Coverage:</strong> <code>ToolInvokePanel.test.tsx</code> (9 tests)
          </p>
          <p className='meta'>
            <strong>Documentation:</strong> <a href='/error-demo'>Phase 1 Error Demo</a>
          </p>
        </footer>
      </main>

      <style>{`
        .pilot-demo-page {
          min-height: 100vh;
          background: linear-gradient(135deg, hsl(var(--tf-blue-hs) 67%) 0%, hsl(var(--tf-blue-hs) 46%) 100%);
        }

        .demo-header {
          background: hsl(var(--tf-neutral-hs) 100% / 0.95);
          border-bottom: 3px solid hsl(var(--tf-blue-hs) 67%);
          padding: 2rem 0;
          box-shadow: 0 2px 8px hsl(var(--tf-neutral-hs) 0% / 0.1);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .demo-header h1 {
          margin: 0 0 0.5rem 0;
          color: hsl(var(--tf-blue-hs) 14%);
          font-size: 2rem;
        }

        .tagline {
          margin: 0;
          color: hsl(var(--tf-neutral-hs) 52%);
          font-size: 1.1rem;
        }

        .demo-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .demo-info {
          background: hsl(var(--tf-neutral-hs) 100% / 0.95);
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px hsl(var(--tf-neutral-hs) 0% / 0.1);
        }

        .demo-info h2 {
          margin: 0 0 1rem 0;
          color: hsl(var(--tf-blue-hs) 14%);
        }

        .demo-info ul {
          margin: 0;
          padding-left: 1.5rem;
          color: hsl(var(--tf-blue-hs) 23%);
        }

        .demo-info li {
          margin: 0.75rem 0;
          line-height: 1.6;
        }

        .demo-info code {
          background: hsl(var(--tf-neutral-hs) 98%);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          color: hsl(var(--tf-blue-hs) 67%);
        }

        .demo-footer {
          background: hsl(var(--tf-neutral-hs) 100% / 0.95);
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 2rem;
          box-shadow: 0 2px 8px hsl(var(--tf-neutral-hs) 0% / 0.1);
        }

        .meta {
          margin: 0.5rem 0;
          color: hsl(var(--tf-neutral-hs) 35%);
          font-size: 0.9rem;
        }

        .meta strong {
          color: hsl(var(--tf-blue-hs) 23%);
        }

        .meta code {
          background: hsl(var(--tf-neutral-hs) 98%);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 0.85em;
        }

        .meta a {
          color: hsl(var(--tf-blue-hs) 67%);
          text-decoration: none;
        }

        .meta a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};
