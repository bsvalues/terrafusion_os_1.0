# TerraLevy Application - AI Coding Guidelines

## Project Overview

TerraLevy is a government tax and levy management application within TerraFusion OS. The codebase is distributed across a multi-workspace monorepo with distinct layers for API, core services, frontend components, AI systems, and analytics platforms.

## Architecture & Project Structure

### Multi-Workspace Organization
The project spans 20 workspace folders organized by functional domain:
- **Core Application Layer**: `terra-levy/api`, `terra-levy/core-services`, `terra-levy/collection-engine`
- **Frontend Layer**: `frontend/src/applications/terra-levy`, `native-shell/applications/terra-levy`
- **Intelligence Layer**: `ai-systems/levy-intelligence`, `consciousness/agents/levy-management`
- **Analytics & Workflows**: `analytics-platform/terra-levy`, `workflow-automation/levy-processes`
- **Supporting Systems**: Configuration, documentation, testing, monitoring, infrastructure

**Key Pattern**: Components are segregated by responsibility but share TypeScript interfaces. When modifying data structures, check all workspace folders for dependent types.

### Frontend Architecture (React + Three.js)

**Component Organization** (`frontend/src/applications/terra-levy/`):
```
components/
  ├── ai/              # AI assistant overlays & interactions
  ├── analytics/       # Data visualization & reporting
  ├── budget/          # Budget planning & projections
  ├── immersive/       # 3D visualizations using @react-three/fiber
  └── workflow/        # Process automation & workflow builders
```

**Custom Hooks Pattern**: All feature logic lives in custom hooks (`hooks/`), not components:
- `useAIAssistant` - AI response generation, model training, proactive insights
- `useBudgetData` - WebSocket-based real-time budget updates
- `useVoiceCommands` - Voice interaction for immersive experiences
- `useGestureControl` - Gesture-based 3D navigation
- `useQuantumResearch` - Quantum computing integration APIs
- `useCollaboration` - Multi-user workspace synchronization

**Example**: When building new features, create a custom hook first, then build UI components that consume it.

### Type System & Data Models

**Centralized Types** (`frontend/src/applications/terra-levy/types/`):
- `LevyTypes.ts` - Core levy data structures with AI recommendations
- `BudgetTypes.ts` - Budget categories, projections, compliance tracking
- `CitizenTypes.ts` - Citizen profiles, interactions, payment records
- `PaymentTypes.ts` - Payment flows, analytics, trends

**Critical Pattern**: All data interfaces include optional `aiRecommendation` fields:
```typescript
interface LevyDataPoint {
  // ... core fields
  aiRecommendation?: {
    action: string;
    confidence: number;
    reasoning: string;
  };
}
```

When adding AI features, extend existing types rather than creating parallel structures.

### 3D Immersive Dashboard Pattern

**Tech Stack**: React Three Fiber + Drei helpers + Three.js primitives

**Core Pattern** (see `ImmersiveDashboard.tsx`):
1. Canvas wrapper with high-performance WebGL settings
2. OrbitControls for camera navigation
3. Multiple 3D visualization components positioned in 3D space
4. Environment lighting (studio preset + directional lights)
5. Integration with voice/gesture hooks for multi-modal interaction

**Example**: `LevyStatusVisualization`, `CitizenInteractionPanel`, `PaymentTrackingSphere` are positioned as separate 3D objects in the scene. Each receives data props and handles its own rendering.

When creating new 3D visualizations:
- Position using Vector3 coordinates (x, y, z)
- Support `immersionLevel` prop (0.1-1.0) for zoom/detail control
- Add `quantumMode` toggle for enhanced rendering options
- Use `useTerraFusionTheme()` for consistent quantum-themed colors

### Real-Time Data Patterns

**WebSocket Integration** (see `useBudgetData.ts`):
```typescript
// Standard pattern for real-time updates
wsRef.current = new WebSocket('ws://localhost:8080/budget-updates');

wsRef.current.onmessage = (event) => {
  const update = JSON.parse(event.data);
  if (update.type === 'budget_update') {
    setBudgetData(prevData => 
      prevData.map(item => 
        item.id === update.categoryId 
          ? { ...item, ...update.changes, lastUpdated: new Date() }
          : item
      )
    );
  }
};
```

**Auto-reconnect**: Always implement reconnection logic with exponential backoff
**State Merging**: Use functional setState to prevent race conditions

### AI Assistant Integration

**Core Hook**: `useAIAssistant` provides:
- `generateResponse()` - Natural language query processing with context
- `analyzeContext()` - Extract relevant data from current user state
- `suggestWorkflows()` - Quantum-optimized workflow recommendations
- `personalizeModel()` - User-specific AI model training
- `getProactiveInsights()` - Module-aware insight generation

**AI Response Types**: 
- `text` - Standard conversational response
- `action` - Executable workflow suggestions
- `visualization` - Trigger 3D data rendering
- `workflow` - Process automation recommendations
- `insight` - Proactive analytical findings

**Intent Classification**: Built-in patterns recognize:
- `data_query` - Analytics and reporting requests
- `workflow_optimization` - Process improvement queries
- `compliance_check` - Regulatory status requests
- `revenue_analysis` - Forecasting and projection queries
- `general_help` - User assistance

When extending AI capabilities:
1. Add new intent types to `analyzeIntent()`
2. Create corresponding response generators
3. Define action payloads for executable recommendations
4. Update confidence scoring based on personalization

### Government Compliance & Security

**FISMA-HIGH Compliance** embedded in data models:
```typescript
complianceStatus: {
  level: 'FISMA-HIGH',
  auditTrail: [],
  lastAudit: Date,
  nextAuditDue: Date,
  complianceScore: number,
  violations: [],
  certifications: string[]
}
```

**Pattern**: Every budget category, levy record, and citizen interaction includes compliance tracking. When modifying data operations, preserve audit trail updates.

### Multi-Modal Interaction System

**Voice Commands** (`useVoiceCommands` hook):
- Continuous listening mode for hands-free operation
- Command patterns: "show levy status", "quantum mode", "ai assistant"
- Callback-based action dispatch

**Gesture Control** (`useGestureControl` hook):
- Pinch gestures control immersion level (zoom)
- Canvas-based coordinate tracking
- 3D navigation through gesture primitives

**Integration Pattern**: Components combining voice + gesture + traditional UI should:
1. Initialize both hooks with shared state callbacks
2. Provide visual feedback for active listening/gesture states
3. Disable conflicting input modes when appropriate

### Development Workflow

**Build Tasks** (VS Code tasks.json provides):
- `🏗️ Build TerraLevy Application` - Main build orchestration
- `Build Backend Services` - .NET Core service compilation
- `Build Frontend Application` - React + TypeScript build
- `Build AI Models` - Python model preparation with quantum flags
- `🧪 Run Comprehensive Test Suite` - Full test execution
- `🤖 Train AI Models` - Model training with quantum acceleration
- `🔬 Start Data Science Environment` - Jupyter Lab on port 8888

**Common Patterns**:
- All Python scripts accept `--quantum-enhanced` flag
- Backend uses `--configuration Debug` for development
- Testing targets sub-100ms response validation
- Security scans run with `--fisma-high --quantum-security` flags

### Key Files for Understanding

**Must-Read for AI Agents**:
- `hooks/useAIAssistant.ts` - 500+ lines implementing AI response generation, personalization, and proactive insights
- `components/immersive/dashboard/ImmersiveDashboard.tsx` - 3D visualization orchestration
- `types/BudgetTypes.ts` - Complex budget modeling with quantum projections
- `hooks/useBudgetData.ts` - Real-time data synchronization patterns

## Development Guidelines

1. **Component-Hook Separation**: UI components are thin wrappers around custom hooks containing all logic
2. **Type Safety**: All data flows use exported TypeScript interfaces from `types/` directory
3. **AI-First Design**: Assume AI recommendations are optional but ubiquitous - include in all data models
4. **3D Performance**: Use `powerPreference: 'high-performance'` and enable antialiasing for WebGL
5. **Real-Time by Default**: Implement WebSocket connections for live data feeds, not polling
6. **Compliance Embedded**: FISMA-HIGH tracking is not optional - include in all government data operations
7. **Multi-Modal Support**: Voice and gesture should augment, not replace, traditional UI patterns
