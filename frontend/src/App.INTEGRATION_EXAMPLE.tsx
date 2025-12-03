/**
 * TerraFusion OS - Main Application Entry Point Example
 * How to integrate the Native Shell into your React app
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { NativeShell } from './components/native-shell';
import './index.css'; // Tailwind CSS

/**
 * Simple Integration
 * The Native Shell handles everything: routing, mode switching, AI drawer, suite orchestration
 */
function App() {
  return <NativeShell />;
}

// React 18 root rendering
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * Advanced Integration Example
 * If you want to add custom wrapper components or authentication
 */
function AdvancedApp() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <NativeShell />
      </ErrorBoundary>
    </AuthProvider>
  );
}

// Mock AuthProvider
function AuthProvider({ children }: { children: React.ReactNode }) {
  // Add authentication logic here
  return <>{children}</>;
}

// Mock ErrorBoundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
          <div className='text-center'>
            <h1 className='text-4xl font-bold text-white mb-4'>Something went wrong</h1>
            <button
              onClick={() => window.location.reload()}
              className='px-6 py-3 bg-cyan-600 rounded-lg text-white font-semibold hover:bg-cyan-500'
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Environment Setup
 * Ensure these dependencies are in package.json
 */
/*
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.2.0",
    "vite": "^5.0.0"
  }
}
*/

/**
 * Tailwind Configuration
 * Ensure tailwind.config.js has dark mode and TerraFusion colors
 */
/*
module.exports = {
  content: [
    "./index.html",
    "./src/**\/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'terra-cyan': '#00FFFF',
        'terra-midnight': '#0A0E1A',
        'terra-blue': '#0080FF',
        'terra-slate': '#1E293B',
      },
    },
  },
  plugins: [],
}
*/

/**
 * Suite Manifest Setup
 * Create suite manifest files in public/suites/ directory
 */
/*
public/
└── suites/
    ├── assessment.json
    ├── levy.json
    ├── gis.json
    ├── collections.json
    ├── sync.json
    ├── flow.json
    ├── insights.json
    ├── agent.json
    └── admin.json
*/

/**
 * Example: assessment.json
 */
/*
{
  "id": "assessment",
  "label": "Assessment Suite",
  "description": "Property valuation and assessment management",
  "category": "government-operations",
  "icon": "📊",
  "webApps": [
    "parcel-viewer",
    "valuation-workbench",
    "sales-analysis",
    "appeals-management"
  ],
  "nativeModules": [
    "assessment-desktop-panel",
    "valuation-editor-panel"
  ],
  "engines": [
    "valuation-engine",
    "gis-engine"
  ],
  "apis": [
    "assessment-api",
    "parcels-api",
    "valuations-api"
  ],
  "aiAgents": [
    {
      "id": "valuation-assistant",
      "name": "Valuation Assistant",
      "capabilities": [
        "Explain property valuations",
        "Review IAAO compliance",
        "Suggest comparable sales",
        "Analyze assessment ratios"
      ]
    }
  ],
  "permissions": [
    "ROLE_ASSESSOR",
    "ROLE_COUNTY_STAFF",
    "ROLE_ADMIN"
  ],
  "hotSwappable": false,
  "dependencies": [],
  "integrations": {
    "PACS9": {
      "endpoints": [
        "/api/parcels",
        "/api/valuations"
      ],
      "pollInterval": 5000
    }
  }
}
*/

/**
 * Running the Application
 */
/*
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
*/

/**
 * Testing Mode Switching
 * - Press Ctrl+M to toggle County Staff ↔ Power User
 * - Mode persists in localStorage (key: 'terrafusion-user-mode')
 * - All components automatically adapt to new mode
 */

/**
 * Creating New Suites
 * 1. Create suite manifest in public/suites/
 * 2. Create suite component in src/components/native-shell/suites/
 * 3. Import and route in NativeShell.tsx
 * 4. Use CognitiveScaffold + SuperpowerCard for dual-mode UX
 */
/*
// Example: LevySuite.tsx
import { CognitiveScaffold, SuperpowerCard } from '../CognitiveScaffold';

export const LevySuite = () => {
  return (
    <CognitiveScaffold
      guidedText="Let's review levy calculations"
      quickActions={[
        { label: 'Explain Anomaly', onClick: handleExplain }
      ]}
    >
      <SuperpowerCard
        simpleInsight="District 14 levy is 5% higher due to new school bond"
        powerUserData={{
          metrics: [
            { label: 'Assessed Value', value: '$1.2B' },
            { label: 'Levy Rate', value: '2.45%' }
          ]
        }}
      />
    </CognitiveScaffold>
  );
};
*/

/**
 * Deployment Checklist
 * ✓ Suite manifests in public/suites/
 * ✓ Tailwind configured with dark mode
 * ✓ React 18+ installed
 * ✓ TypeScript configured
 * ✓ Build command works
 * ✓ Environment variables set
 * ✓ Backend APIs configured
 * ✓ Authentication enabled
 */
