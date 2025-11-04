# Quick Start: AI-Enhanced Components

**Start here** to add AI superpowers to county employee interfaces in 30 minutes.

---

## Phase 1: Setup (5 minutes)

### Step 1: Install Dependencies

```powershell
cd c:\Users\bsval\terrafusion_os_1.0\frontend

# Install AI/real-time dependencies
npm install @microsoft/signalr
npm install recharts
npm install framer-motion

# Verify installation
npm list @microsoft/signalr recharts framer-motion
```

### Step 2: Create Component Structure

```powershell
# Create AI-enhanced components directory
New-Item -ItemType Directory -Path "src\components\ai-enhanced\AIConsciousnessIndicator" -Force
New-Item -ItemType Directory -Path "src\components\ai-enhanced\QuantumValuationPanel" -Force
New-Item -ItemType Directory -Path "src\components\ai-enhanced\SmartPropertySearch" -Force

# Create county workflows directory
New-Item -ItemType Directory -Path "src\components\county-workflows\PropertyAssessmentWorkflow" -Force
```

### Step 3: Configure Environment

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:5000
VITE_CONSCIOUSNESS_URL=http://localhost:3004
VITE_ENABLE_AI_FEATURES=true
```

---

## Phase 2: First Component (10 minutes)

### Create AIConsciousnessIndicator

**File**: `frontend/src/components/ai-enhanced/AIConsciousnessIndicator/index.tsx`

Copy the following complete implementation:

```tsx
import React, { useEffect, useState } from 'react';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Activity, Cpu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/terrafusion-design-system';

interface AgentSwarmStatus {
  totalAgents: number;
  activeAgents: number;
  workingAgents: number;
  averageAccuracy: number;
  quantumFactor: number;
}

interface Props {
  compact?: boolean;
  showDetails?: boolean;
}

export const AIConsciousnessIndicator: React.FC<Props> = ({
  compact = false,
  showDetails = true
}) => {
  const [status, setStatus] = useState<AgentSwarmStatus>({
    totalAgents: 50000,
    activeAgents: 0,
    workingAgents: 0,
    averageAccuracy: 0.995,
    quantumFactor: 949
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_CONSCIOUSNESS_URL}/consciousness-hub`)
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log('✓ Connected to TerraFusion Consciousness Engine');
        setIsConnected(true);
        connection.invoke('SubscribeToAgentStatus');
      })
      .catch(err => {
        console.error('Consciousness connection error:', err);
        // Use mock data for development
        setStatus({
          totalAgents: 50000,
          activeAgents: 48532,
          workingAgents: 12847,
          averageAccuracy: 0.9972,
          quantumFactor: 949
        });
      });

    connection.on('AgentStatusUpdate', (update: AgentSwarmStatus) => {
      setStatus(update);
    });

    return () => {
      connection?.stop();
    };
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-2 terra-glass px-3 py-2 rounded-lg">
        <Activity className={`h-4 w-4 ${isConnected ? 'text-terra-cyan animate-pulse' : 'text-gray-400'}`} />
        <span className="text-sm font-medium">
          {status.workingAgents.toLocaleString()} AI Agents Active
        </span>
        {isConnected && <div className="h-2 w-2 rounded-full bg-terra-cyan animate-pulse" />}
      </div>
    );
  }

  return (
    <Card className="terra-glass" variant="glass" glow>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-terra-cyan" />
          AI Agent Consciousness
          {isConnected && <div className="h-2 w-2 rounded-full bg-terra-cyan animate-pulse" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="terra-glass p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Total Agents</div>
            <div className="text-2xl font-bold text-terra-cyan">
              {status.totalAgents.toLocaleString()}
            </div>
          </div>

          <div className="terra-glass p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Working Now</div>
            <div className="text-2xl font-bold text-terra-cyan">
              {status.workingAgents.toLocaleString()}
            </div>
          </div>

          <div className="terra-glass p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Accuracy Score</div>
            <div className="text-2xl font-bold text-green-400">
              {(status.averageAccuracy * 100).toFixed(2)}%
            </div>
          </div>

          <div className="terra-glass p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Quantum Factor</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-terra-cyan to-blue-500 bg-clip-text text-transparent">
              {status.quantumFactor}
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Active Agents:</span>
              <span className="font-medium text-terra-cyan">{status.activeAgents.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-400">Idle Agents:</span>
              <span className="font-medium">{(status.totalAgents - status.activeAgents).toLocaleString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIConsciousnessIndicator;
```

### Export the Component

**File**: `frontend/src/components/ai-enhanced/index.ts`

```typescript
export { AIConsciousnessIndicator } from './AIConsciousnessIndicator';
export { QuantumValuationPanel } from './QuantumValuationPanel';
export { SmartPropertySearch } from './SmartPropertySearch';
```

---

## Phase 3: Test the Component (5 minutes)

### Quick Test Page

**File**: `frontend/src/pages/AITestPage.tsx`

```tsx
import React from 'react';
import { AIConsciousnessIndicator } from '@/components/ai-enhanced';

export const AITestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-terra-midnight p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-terra-cyan">AI Components Test</h1>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Compact View</h2>
          <AIConsciousnessIndicator compact={true} />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Full View</h2>
          <AIConsciousnessIndicator />
        </section>
      </div>
    </div>
  );
};
```

### Add Route

**File**: `frontend/src/Router.tsx` (or wherever your routes are defined)

```tsx
import { AITestPage } from './pages/AITestPage';

// Add to your routes:
<Route path="/ai-test" element={<AITestPage />} />
```

### Test It

```powershell
# Start frontend dev server
npm run dev

# Open browser
Start-Process "http://localhost:5173/ai-test"
```

**Expected Result**: You should see two AI Consciousness Indicators showing 50,000 agents with quantum styling.

---

## Phase 4: Integrate into Existing Pages (10 minutes)

### Option A: Add to Existing Dashboard

**Example**: Enhance `frontend/src/pages/Dashboard.tsx`

```tsx
import { AIConsciousnessIndicator } from '@/components/ai-enhanced';

export const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      {/* Existing dashboard header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Property Assessment Dashboard</h1>

        {/* Add AI indicator */}
        <AIConsciousnessIndicator compact={true} />
      </header>

      {/* Rest of dashboard */}
      <div className="dashboard-content">
        {/* Existing content */}
      </div>
    </div>
  );
};
```

### Option B: Add to Plugin Shell

**Example**: Enhance Harris PACS plugin

**File**: `frontend/src/plugins/harris-pacs/index.tsx`

```tsx
import { AIConsciousnessIndicator } from '@/components/ai-enhanced';

const HarrisPacsPlugin: React.FC<HarrisPacsPluginProps> = ({ context }) => {
  // Existing plugin code...

  return (
    <div className={styles.container}>
      {/* Add AI indicator at top */}
      <div className="mb-4">
        <AIConsciousnessIndicator compact={true} />
      </div>

      {/* Existing plugin content */}
      <div className={styles.header}>
        <h2>Harris PACS 9.0 Migration</h2>
        <p>Benton County Legacy System Integration</p>
      </div>

      {/* Rest of plugin */}
    </div>
  );
};
```

---

## Phase 5: Backend Setup (Optional for Mock Data)

If backend services aren't running, the component uses mock data automatically. To connect to real services:

### Start Backend Services

```powershell
# Terminal 1: Start API
cd c:\Users\bsval\terrafusion_os_1.0\backend
dotnet run --project TerraFusion.API --urls "http://localhost:5000"

# Terminal 2: Start Consciousness Engine
dotnet run --project TerraFusion.Consciousness --urls "http://localhost:3004"
```

### Verify Connection

```powershell
# Test API health
Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET

# Test consciousness endpoint
Invoke-WebRequest -Uri "http://localhost:3004/api/consciousness/status" -Method GET
```

---

## Troubleshooting

### Issue: Component not showing

**Solution**: Check import path and ensure terra-glass CSS is loaded

```tsx
// Verify this import works:
import { Card, CardContent, CardHeader, CardTitle } from '@/components/terrafusion-design-system';

// If not, try:
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
```

### Issue: SignalR connection fails

**Solution**: Component automatically falls back to mock data. Check console for:

```
✓ Connected to TerraFusion Consciousness Engine
```

or

```
Consciousness connection error: [error details]
```

### Issue: Terra-cyan color not working

**Solution**: Ensure design tokens are loaded. Add to `frontend/src/styles/globals.css`:

```css
:root {
  --terra-cyan: #00FFFF;
  --terra-midnight: #0A0E1A;
  --terra-blue: #0080FF;
  --terra-slate: #1E293B;
}

.terra-glass {
  background: rgba(30, 41, 59, 0.3);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 255, 255, 0.2);
}

.text-terra-cyan {
  color: var(--terra-cyan);
}

.bg-terra-cyan {
  background-color: var(--terra-cyan);
}
```

---

## Next Components to Build

Once AIConsciousnessIndicator works, add these in order:

1. **SmartPropertySearch** (15 min) - AI-powered search with natural language
2. **QuantumValuationPanel** (20 min) - CostForge AI property valuation
3. **PropertyAssessmentWorkflow** (30 min) - Complete county employee workflow

Each component follows the same pattern:
- Create directory in `src/components/ai-enhanced/`
- Implement component with TerraFusion design system
- Export from `index.ts`
- Test on dedicated page
- Integrate into real workflows

---

## Success Criteria

✅ **AI Consciousness Indicator displays**
- Shows 50,000 total agents
- Real-time updates (or mock data fallback)
- Terra-cyan quantum styling
- Compact and full views work

✅ **Integration Complete**
- Component appears in at least one existing page
- No console errors
- Quantum animations working
- Accessibility (keyboard navigation) functional

✅ **Ready for Next Component**
- Team understands the pattern
- Design system integration clear
- Backend connection optional but available

---

## Team Handoff

**Files Created**:
- `frontend/src/components/ai-enhanced/AIConsciousnessIndicator/index.tsx`
- `frontend/src/components/ai-enhanced/index.ts`
- `frontend/src/pages/AITestPage.tsx`
- `frontend/.env.local`

**Next Sprint Tasks**:
1. Build SmartPropertySearch component
2. Build QuantumValuationPanel component
3. Create PropertyAssessmentWorkflow
4. Design Figma mockups for other county roles
5. Schedule pilot program with Benton County

**Documentation**:
- [Complete Strategy](../TERRAFUSION_UI_UX_ENHANCEMENT_STRATEGY.md)
- [Implementation Guide](./UI_UX_IMPLEMENTATION_GUIDE.md)
- This quick start guide

---

**"Government. Transcended."** - Your first AI-powered component in 30 minutes. 🚀
