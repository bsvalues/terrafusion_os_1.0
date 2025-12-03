# TerraLevy Application - AI Coding Guidelines

## Project Overview

TerraLevy is a government tax and levy management application within TerraFusion
OS. The frontend codebase lives in `frontend/src/applications/terra-levy/` with
a React + Three.js architecture for immersive 3D data visualization.

## Architecture at a Glance

```
frontend/src/applications/terra-levy/
├── components/          # UI organized by feature domain
│   ├── ai/              # AIAssistant.tsx - overlay interactions
│   ├── analytics/       # Data visualization
│   ├── budget/          # Budget planning
│   ├── immersive/       # 3D dashboards (React Three Fiber)
│   └── workflow/        # VisualWorkflowDesigner.tsx
├── hooks/               # ALL business logic lives here
└── types/               # Shared TypeScript interfaces
```

## Critical Pattern: Hook-First Development

**All feature logic belongs in custom hooks, not components.** Components are
thin rendering wrappers.

| Hook                    | Purpose                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| `useAIAssistant`        | AI response generation, intent classification, personalization       |
| `useBudgetData`         | WebSocket real-time updates, CRUD operations                         |
| `useVoiceCommands`      | Speech recognition with confidence thresholds                        |
| `useGestureControl`     | Pinch/gesture handling for 3D navigation                             |
| `useCollaboration`      | Multi-user session sync                                              |
| `useQuantumProjections` | Quantum-enhanced forecasting, scenario analysis, budget optimization |
| `useJupyterLab`         | Data science notebook integration, kernel management                 |

**Example - Adding a feature:**

```typescript
// 1. Create hook first
export const useNewFeature = (options) => {
  const [data, setData] = useState([]);
  // ...logic
  return { data, actions };
};

// 2. Then thin component wrapper
const FeatureComponent = () => {
  const { data, actions } = useNewFeature(options);
  return <div>{/* render data */}</div>;
};
```

## Type System: AI-First Data Models

All interfaces in `types/` include optional AI recommendation fields. **Extend
existing types; don't create parallel structures.**

```typescript
// From types/LevyTypes.ts - standard pattern
interface LevyDataPoint {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'disputed';
  aiRecommendation?: {
    // Always include this pattern
    action: string;
    confidence: number;
    reasoning: string;
  };
}
```

Key type files:

- `types/BudgetTypes.ts` - 400+ lines with `ComplianceStatus`,
  `QuantumBudgetProjection`, `CollaborativeSession`
- `types/LevyTypes.ts` - Core levy data structures

## 3D Immersive Dashboard Pattern

Uses React Three Fiber + Drei. See
`components/immersive/dashboard/ImmersiveDashboard.tsx`.

```tsx
// Standard Canvas setup
<Canvas
  gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
  camera={{ position: new Vector3(0, 5, 10), fov: 60 }}
>
  <Environment preset="studio" />
  <OrbitControls enablePan enableZoom enableRotate />

  {/* Position 3D components in space */}
  <LevyStatusVisualization
    position={[-5, 0, 0]}
    immersionLevel={0.8}
    quantumMode={false}
  />
  <CitizenInteractionPanel position={[0, 0, 0]} interactive aiEnhanced />
  <PaymentTrackingSphere position={[5, 0, 0]} realTimeUpdates predictiveMode />
</Canvas>
```

**New 3D component requirements:**

- Accept `position: [x, y, z]` prop
- Support `immersionLevel` (0.1-1.0) for detail scaling
- Add `quantumMode` toggle for enhanced effects
- Use `useTerraFusionTheme()` for consistent colors

## Real-Time WebSocket Pattern

```typescript
// From useBudgetData.ts - standard reconnection pattern
wsRef.current = new WebSocket('ws://localhost:8080/budget-updates');

wsRef.current.onmessage = event => {
  const update = JSON.parse(event.data);
  if (update.type === 'budget_update') {
    setBudgetData(prev =>
      prev.map(item =>
        item.id === update.categoryId
          ? { ...item, ...update.changes, lastUpdated: new Date() }
          : item
      )
    );
  }
};

wsRef.current.onclose = () => {
  setTimeout(connectWebSocket, 5000); // Auto-reconnect
};
```

## AI Intent Classification

`useAIAssistant` classifies user intent via keyword matching. To add intents:

```typescript
// In useAIAssistant.ts analyzeIntent()
function analyzeIntent(input: string) {
  const lowercaseInput = input.toLowerCase();

  if (
    lowercaseInput.includes('optimize') ||
    lowercaseInput.includes('workflow')
  ) {
    return { type: 'workflow_optimization', confidence: 0.85 };
  }
  // Add new intents here with keyword patterns
}
```

Built-in intents: `data_query`, `workflow_optimization`, `compliance_check`,
`revenue_analysis`, `general_help`

## Compliance: FISMA-HIGH Required

Every data model involving government data **must** include compliance tracking:

```typescript
complianceStatus: {
  level: 'FISMA-HIGH',
  auditTrail: AuditEntry[],
  lastAudit: Date,
  nextAuditDue: Date,
  complianceScore: number,  // 0-100
  violations: ComplianceViolation[],
  certifications: string[]
}
```

## Build & Development Tasks

Run via `Ctrl+Shift+P` → "Tasks: Run Task":

| Task                                | Description                                     |
| ----------------------------------- | ----------------------------------------------- |
| `🏗️ Build TerraLevy Application`    | Full build (depends on backend + frontend + AI) |
| `Build Frontend Application`        | `npm run build` in frontend dir                 |
| `Build Backend Services`            | `dotnet build --configuration Debug`            |
| `🧪 Run Comprehensive Test Suite`   | Full test execution                             |
| `🔬 Start Data Science Environment` | Jupyter Lab on port 8888                        |

## Key Files for Context

| File                                                    | Why It Matters                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------- |
| `hooks/useAIAssistant.ts`                               | 400+ lines: AI response generation, intent parsing, personalization |
| `hooks/useBudgetData.ts`                                | WebSocket pattern, state management                                 |
| `types/BudgetTypes.ts`                                  | Complex nested types, compliance structures                         |
| `components/immersive/dashboard/ImmersiveDashboard.tsx` | 3D orchestration pattern                                            |

## Guidelines Summary

1. **Hooks contain logic** - Components only render
2. **Extend types with `aiRecommendation`** - Don't create parallel structures
3. **FISMA-HIGH compliance** - Include audit trails in all government data
4. **WebSocket with reconnect** - Not polling for real-time data
5. **3D components** - Position props + immersionLevel + quantumMode
6. **Voice/gesture augment UI** - Never replace traditional controls

## Voice Command Integration

`useVoiceCommands` wraps Web Speech API with confidence filtering:

```typescript
// Standard voice command setup
const { voiceCommand, isListening, transcript, confidence } = useVoiceCommands({
  onCommand: (command, confidence) => handleVoiceCommand(command),
  continuous: true, // Keep listening after recognition
  language: 'en-US',
  confidenceThreshold: 0.7, // Reject low-confidence results
});

// Built-in command patterns in ImmersiveDashboard
function handleVoiceCommand(command: string) {
  switch (command.toLowerCase()) {
    case 'show levy status':
      setSelectedDataSet('levy-overview');
      break;
    case 'quantum mode':
      setQuantumVisualization(!quantumVisualization);
      break;
    case 'ai assistant':
      setAiAssistantActive(!aiAssistantActive);
      break;
  }
}
```

**Adding new voice commands**: Add case statements to `handleVoiceCommand()` in
the consuming component.

## Quantum Projections & Scenario Analysis

`useQuantumProjections` provides budget forecasting with what-if scenarios:

```typescript
const {
  projections,
  scenarios,
  optimizations,
  quantumState,        // 'idle' | 'computing' | 'optimizing'
  generateQuantumProjections,
  generateScenarios,
  optimizeBudgetAllocation,
} = useQuantumProjections();

// Generate projections with economic factors
await generateQuantumProjections(historicalData, economicFactors, policyChanges);

// Standard projection structure
interface QuantumBudgetProjection {
  confidence: number;                    // Target 0.997 (99.7%)
  baseScenario: { totalRevenue, totalExpenses, netPosition, assumptions };
  optimisticScenario: { ... };
  pessimisticScenario: { ... };
  riskFactors: Array<{ factor, probability, impact, mitigation }>;
  quantumAlgorithms: string[];           // e.g., ['QAOA', 'VQE']
  quantumAdvantage: number;              // % improvement over classical
}
```

## Jupyter Lab Integration

`useJupyterLab` manages data science notebooks with quantum computing resources:

```typescript
const {
  isConnected,
  kernels, // Available computation kernels
  notebooks,
  quantumResources, // IBM/Google simulators, hardware access
  createNotebook,
  executeCell,
  saveNotebook,
} = useJupyterLab(userId, department);

// Create notebook from template
const notebook = await createNotebook('Revenue Forecasting', options);

// Available templates: 'Revenue Forecasting', 'Citizen Analytics', 'Quantum Optimization'
// Kernels: 'python-quantum-ai', 'r-statistics', 'julia-hpc', 'quantum-circuit'
```

**Jupyter WebSocket**: Connects to `ws://localhost:8888/jupyter-ws` for
real-time cell execution updates.

## Complex Type Examples

### CollaborativeSession (multi-user budget editing)

```typescript
interface CollaborativeSession {
  id: string;
  participants: SessionParticipant[];
  budgetScope: {
    fiscalYear: string;
    departments: string[];
    categories: string[];
  };
  permissions: {
    canEdit: string[];
    canApprove: string[];
  };
  settings: {
    autoSave: boolean;
    conflictResolution: 'auto' | 'manual';
  };
  modifications: CollaborativeModification[];
  conflictResolution: ConflictResolution[];
}
```

### ScenarioProjection (what-if analysis)

```typescript
interface ScenarioProjection {
  id: string;
  name: string;
  variables: Array<{ name; currentValue; newValue; unit }>;
  projectedOutcome: {
    revenueChange: number;
    expenseChange: number;
    netImpact: number;
    confidence: number;
  };
  stakeholderImpact: Array<{
    stakeholder: string;
    impact: 'positive' | 'negative' | 'neutral' | 'mixed';
    severity: 'low' | 'moderate' | 'high';
    mitigation: string;
  }>;
}
```

## Intended Backend Architecture

The backend services are under development. Workspace folders exist for:

```
terra-levy/
├── api/                    # Express/Fastify REST API (planned)
├── core-services/          # .NET Core business logic (planned)
├── collection-engine/      # Payment processing (planned)
├── analytics-platform/     # Python analytics services (planned)
└── citizen-portal/         # Public-facing API (planned)
```

**When implementing backend services**:

- Use `.NET Core` for `core-services/` with `dotnet build --configuration Debug`
- Python services should accept `--quantum-enhanced` flag
- All APIs must include FISMA-HIGH compliance headers
- WebSocket endpoints follow pattern: `ws://localhost:{port}/{service}-updates`
