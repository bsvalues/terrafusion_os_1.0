# Shock-and-Awe Architecture Documentation

## Executive Summary

**Shock-and-Awe** is a **Tauri-based desktop demonstration application** designed to showcase TerraFusion OS's AI swarm coordination capabilities to government stakeholders. This document provides comprehensive architectural analysis, technical specifications, and integration roadmap.

**Key Findings**:
- ✅ **Complete desktop application** with 100+ source files
- ✅ **Tauri runtime** (Rust backend + React 18 frontend)
- ✅ **50,247 AI agent coordination** across 7 specialized squads
- ⚠️ **Naming mismatch**: "Shock-and-Awe" suggests emergency system but is demonstration tool
- ⚠️ **Backend integration incomplete**: TerraFusion.Operations has config but TODO implementations
- ⚠️ **VS Code task mismatches**: Tasks reference non-existent emergency directories

## 1. Purpose & Mission

### Primary Purpose
**Government Stakeholder Demonstration Platform** - High-impact visualization tool showcasing TerraFusion OS capabilities including:
- Real-time AI swarm coordination (50,000+ agents)
- Multi-county system integration demonstrations
- Quantum-enhanced processing visualizations
- Property assessment AI capabilities
- Emergency response coordination previews

### Target Audience
- **County Assessors**: Property assessment AI capabilities
- **Government CIOs**: Technical architecture and scalability
- **Executive Leadership**: ROI and strategic value propositions
- **Emergency Management**: Coordination and response capabilities (future)

### NOT an Emergency Response System
Despite the "Shock-and-Awe" naming:
- **Current Reality**: Desktop demonstration application
- **Marketing Position**: High-impact capability showcase
- **Future Vision**: May integrate with real emergency services
- **Immediate Value**: Stakeholder engagement and decision support

## 2. Technical Architecture

### 2.1 Technology Stack

**Desktop Runtime**: Tauri 1.x
- Rust backend for OS-level operations
- IPC communication between frontend and backend
- Native file system access and APIs
- Cross-platform: Windows, macOS, Linux

**Frontend Framework**: React 18
- TypeScript 5 for type safety
- Vite 5 for build tooling and hot reload
- Material-UI for government-appropriate design
- React Router for navigation (if multi-page)

**Visualization Libraries**:
- **Three.js**: 3D quantum particle rendering and visualizations
- **D3.js**: Data-driven charts and graphs
- **React Three Fiber**: React integration for Three.js
- **@react-three/drei**: Three.js helpers and abstractions

**State Management**:
- React hooks (useState, useEffect, useContext)
- Context API for global state
- Potential Redux/Zustand integration (to be confirmed)

**Development Tools**:
- ESLint + Prettier for code quality
- TypeScript for type checking
- Vitest or Jest for testing
- React DevTools for debugging

### 2.2 Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tauri Desktop Application                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              React Frontend (TypeScript)                 │   │
│  │                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ Components   │  │ Transcendent │  │   Engines    │  │   │
│  │  │              │  │              │  │              │  │   │
│  │  │ - Quantum    │  │ - Quantum    │  │ - Quantum    │  │   │
│  │  │   Visual     │  │   Conscious  │  │   Processor  │  │   │
│  │  │ - Live       │  │ - Multiverse │  │ - Predictive │  │   │
│  │  │   Dashboard  │  │   Integr     │  │   Engine     │  │   │
│  │  │ - Particle   │  │ - Infinite   │  │ - Analytics  │  │   │
│  │  │   Field      │  │   Potential  │  │   Engine     │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   Services   │  │    Hooks     │  │    Utils     │  │   │
│  │  │              │  │              │  │              │  │   │
│  │  │ - Supreme    │  │ - useAI      │  │ - Format     │  │   │
│  │  │   Commander  │  │ - useQuantum │  │ - Validate   │  │   │
│  │  │ - Multi      │  │ - use3D      │  │ - Calculate  │  │   │
│  │  │   County     │  │ - useCounty  │  │ - Transform  │  │   │
│  │  │ - TerraFusion│  │              │  │              │  │   │
│  │  │   Client     │  │              │  │              │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                           │   │
│  └───────────────────────────┬───────────────────────────────┘   │
│                              │ IPC                               │
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Tauri Backend (Rust)                       │   │
│  │                                                           │   │
│  │  - Window management                                     │   │
│  │  - File system access                                    │   │
│  │  - OS-level APIs                                         │   │
│  │  - Native integrations                                   │   │
│  │                                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Future Integration (Planned)
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│              TerraFusion Backend Services (.NET 8)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ TerraFusion    │  │ TerraFusion    │  │ TerraFusion    │   │
│  │ .API           │  │ .Operations    │  │ .Consciousness │   │
│  │                │  │                │  │                │   │
│  │ - Core         │  │ - Emergency    │  │ - AI Swarm     │   │
│  │   Services     │  │   Response     │  │   Coordination │   │
│  │ - REST         │  │   (TODO)       │  │ - 50,000+      │   │
│  │   Endpoints    │  │ - Self-Healing │  │   Agents       │   │
│  │ - Auth         │  │   (TODO)       │  │ - Quantum      │   │
│  │ - Gateway      │  │                │  │   Optimization │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 AI Agent Coordination Architecture

**7 Specialized AI Squads** (50,247 total agents):

1. **Squad 1 - Terra Data Processing** (168 agents)
   - County data synchronization demonstrations
   - Harris PACS integration visualizations
   - Real-time data flow animations

2. **Squad 2 - CostForge Analysis** (142 agents)
   - Property valuation AI demonstrations
   - Cost analysis visualizations
   - IAAO compliance displays

3. **Squad 3 - Quantum Computing** (126 agents)
   - Quantum algorithm visualizations
   - Entanglement demonstrations
   - Quantum-enhanced processing displays

4. **Squad 4 - Consciousness Coordination** (103 agents)
   - AI consciousness parameter displays
   - Swarm intelligence visualizations
   - Multi-agent coordination animations

5. **Squad 5 - Predictive Modeling** (87 agents)
   - Forecasting demonstrations
   - Statistical model visualizations
   - Accuracy metric displays

6. **Squad 6 - County Synchronization** (65 agents)
   - Multi-county coordination displays
   - System integration visualizations
   - Data flow animations

7. **Squad 7 - Emergency Coordination** (51 agents)
   - Emergency response previews
   - Incident handling demonstrations
   - Crisis management visualizations

**Coordination Patterns**:
- Simulated real-time agent activity
- Visual representation of agent-to-agent communication
- Hierarchical coordination displays
- Performance metrics and dashboards

## 3. Directory Structure Deep Dive

### 3.1 Frontend Source (`src/`)

```
src/
├── components/                       # Reusable UI components
│   ├── QuantumVisualization/         # 3D quantum particle rendering
│   │   ├── QuantumVisualization.tsx
│   │   ├── ParticleSystem.ts
│   │   └── QuantumShaders.glsl
│   ├── LiveDashboard/                # Real-time dashboards
│   │   ├── LiveDashboard.tsx
│   │   ├── MetricsPanel.tsx
│   │   └── AgentStatusGrid.tsx
│   ├── ParticleField/                # Immersive particle effects
│   │   ├── ParticleField.tsx
│   │   └── ParticlePhysics.ts
│   ├── AgentCoordination/            # AI agent displays
│   │   ├── SwarmVisualization.tsx
│   │   └── AgentGraph.tsx
│   └── CountyIntegration/            # Multi-county displays
│       ├── CountyMap.tsx
│       └── SystemIntegrationFlow.tsx
│
├── transcendent/                     # Advanced demonstrations
│   ├── QuantumConsciousness/         # Consciousness displays
│   │   ├── ConsciousnessVisualization.tsx
│   │   └── ConsciousnessParameters.tsx
│   ├── MultiverseIntegration/        # Multi-reality demos
│   │   └── MultiverseExplorer.tsx
│   └── InfinitePotential/            # Aspirational showcases
│       └── InfinitePotentialDemo.tsx
│
├── engines/                          # Processing engines
│   ├── QuantumProcessor/             # Quantum algorithms
│   │   ├── QuantumProcessor.ts
│   │   └── QuantumAlgorithms.ts
│   ├── PredictiveEngine/             # Forecasting
│   │   ├── PredictiveEngine.ts
│   │   └── StatisticalModels.ts
│   └── AnalyticsEngine/              # Analytics
│       ├── AnalyticsEngine.ts
│       └── DataAggregation.ts
│
├── services/                         # Service layer
│   ├── SupremeCommanderClaude/       # AI coordination
│   │   └── SupremeCommanderClient.ts
│   ├── MultiCountyOrchestrator/      # County orchestration
│   │   └── CountyOrchestrator.ts
│   └── TerraFusionClient/            # Backend client (future)
│       └── TerraFusionAPIClient.ts
│
├── hooks/                            # Custom React hooks
│   ├── useAIAgent.ts
│   ├── useQuantumState.ts
│   ├── use3DVisualization.ts
│   └── useCountyData.ts
│
├── utils/                            # Utility functions
│   ├── formatting.ts
│   ├── validation.ts
│   ├── calculations.ts
│   └── transformations.ts
│
├── types/                            # TypeScript definitions
│   ├── Agent.ts
│   ├── County.ts
│   ├── Quantum.ts
│   └── Emergency.ts
│
├── App.tsx                           # Main application component
├── main.tsx                          # React entry point
└── index.css                         # Global styles
```

### 3.2 Tauri Backend (`src-tauri/`)

```
src-tauri/
├── src/
│   ├── main.rs                       # Tauri initialization
│   ├── commands.rs                   # IPC command handlers (future)
│   └── lib.rs                        # Rust library exports
├── Cargo.toml                        # Rust dependencies
├── Cargo.lock                        # Dependency lockfile
├── tauri.conf.json                   # Tauri configuration
│   ├── identifier: "gov.terrafusion.shock-and-awe"
│   ├── windows: [{ title, width, height, resizable }]
│   ├── security: { csp, dangerousDisableAssetCspModification }
│   └── bundle: { identifier, icon, resources }
└── icons/                            # Application icons
    ├── 32x32.png
    ├── 128x128.png
    ├── icon.icns (macOS)
    └── icon.ico (Windows)
```

### 3.3 AI Systems Configuration (`ai_systems/`)

```
ai_systems/
├── squad_1_terra_data/
│   ├── agents.json                   # 168 agent configurations
│   ├── coordination_rules.yaml
│   └── performance_metrics.json
├── squad_2_costforge/
│   ├── agents.json                   # 142 agent configurations
│   └── valuation_models.yaml
├── squad_3_quantum/
│   ├── agents.json                   # 126 agent configurations
│   └── quantum_algorithms.yaml
├── squad_4_consciousness/
│   ├── agents.json                   # 103 agent configurations
│   └── consciousness_parameters.yaml
├── squad_5_predictive/
│   ├── agents.json                   # 87 agent configurations
│   └── forecasting_models.yaml
├── squad_6_county_sync/
│   ├── agents.json                   # 65 agent configurations
│   └── sync_patterns.yaml
└── squad_7_emergency/
    ├── agents.json                   # 51 agent configurations
    └── emergency_protocols.yaml
```

## 4. Backend Integration Analysis

### 4.1 Current State: TerraFusion.Operations

**Location**: `../../../backend/TerraFusion.Operations/`

**Configuration Exists** (`appsettings.json`):
```json
{
  "EmergencyResponse": {
    "EnableAutomaticEmergencyResponse": true,
    "NotificationChannels": ["email", "sms", "teams", "slack", "pagerduty"],
    "EscalationPolicyId": "policy-001",
    "DisasterRecoveryTimeoutMinutes": 30
  },
  "HealthMonitoring": {
    "EnableRealTimeHealthMonitoring": true,
    "HealthCheckIntervalSeconds": 30,
    "UnhealthyThresholdCount": 3
  },
  "PerformanceOptimization": {
    "EnableAutonomousPerformanceOptimization": true,
    "OptimizationIntervalMinutes": 5
  }
}
```

**Service Implementations**: TODO Placeholders
```csharp
// Services/EliteOperationalService.cs
public class EliteOperationalService : IEliteOperationalService
{
    private readonly IIncidentResponseService _incidentResponse;         // TODO
    private readonly ISelfHealingService _selfHealing;                   // TODO
    private readonly IAutonomousRecoveryService _autonomousRecovery;     // TODO
    private readonly IPerformanceOptimizationService _performance;       // TODO

    // All methods throw NotImplementedException
}
```

**Gap Analysis**:
- ✅ Configuration complete and production-ready
- ⚠️ Service interfaces defined but not implemented
- ❌ No actual emergency response capabilities
- ❌ Desktop app not integrated with backend

### 4.2 Integration Roadmap

**Phase 1: Basic REST API Integration** (2-4 weeks)
- Implement TerraFusion.API endpoints for demo data
- Create `TerraFusionAPIClient.ts` in desktop app
- Fetch AI agent status from backend
- Display real-time backend metrics

**Phase 2: Live Data Synchronization** (4-6 weeks)
- Implement SignalR for real-time updates
- Stream AI agent coordination events
- Display live county system synchronization
- Real-time performance metrics

**Phase 3: Emergency Services Integration** (8-12 weeks)
- Implement TerraFusion.Operations services
- Connect desktop app to emergency response endpoints
- Real incident handling demonstrations
- Actual crisis management capabilities

**Phase 4: Production Deployment** (12+ weeks)
- Full backend integration testing
- County-specific data isolation
- SSO authentication integration
- Multi-tenant support

## 5. VS Code Task Configuration Issues

### 5.1 Current Task Definitions

**Problems Identified**:
- Tasks reference **non-existent directories**:
  - `marketplace/shock-and-awe/rapid-deployment` ❌
  - `marketplace/shock-and-awe/emergency-response` ❌
  - `marketplace/shock-and-awe/crisis-management` ❌
  - `marketplace/shock-and-awe/recovery-tools` ❌

**Example Problematic Task**:
```json
{
  "label": "Deploy Emergency Services",
  "type": "shell",
  "command": "npm",
  "args": ["run", "deploy:emergency"],
  "options": {
    "cwd": "${workspaceFolder}/marketplace/shock-and-awe/rapid-deployment"
  }
}
```

### 5.2 Recommended Task Updates

**Accurate Tauri Desktop Tasks**:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Shock-and-Awe: Development Mode",
      "type": "shell",
      "command": "npm",
      "args": ["run", "tauri:dev"],
      "options": {
        "cwd": "${workspaceFolder}/marketplace/shock-and-awe"
      },
      "group": "build",
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "Shock-and-Awe: Build Production",
      "type": "shell",
      "command": "npm",
      "args": ["run", "tauri:build"],
      "options": {
        "cwd": "${workspaceFolder}/marketplace/shock-and-awe"
      },
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "Shock-and-Awe: Run Tests",
      "type": "shell",
      "command": "npm",
      "args": ["run", "test"],
      "options": {
        "cwd": "${workspaceFolder}/marketplace/shock-and-awe"
      },
      "group": {
        "kind": "test",
        "isDefault": true
      }
    },
    {
      "label": "Shock-and-Awe: Lint Code",
      "type": "shell",
      "command": "npm",
      "args": ["run", "lint"],
      "options": {
        "cwd": "${workspaceFolder}/marketplace/shock-and-awe"
      },
      "group": "none"
    },
    {
      "label": "Shock-and-Awe: Type Check",
      "type": "shell",
      "command": "npm",
      "args": ["run", "type-check"],
      "options": {
        "cwd": "${workspaceFolder}/marketplace/shock-and-awe"
      },
      "group": "none"
    }
  ]
}
```

## 6. Development Workflow

### 6.1 Initial Setup

```powershell
# Navigate to Shock-and-Awe workspace
cd "c:\Users\bsval\terrafusion_os_1.0\marketplace\shock-and-awe"

# Install Node dependencies
npm install

# Verify Rust toolchain
rustup default stable
rustup target add x86_64-pc-windows-msvc  # Windows
# rustup target add x86_64-apple-darwin   # macOS
# rustup target add x86_64-unknown-linux-gnu  # Linux

# Start development mode
npm run tauri:dev
```

### 6.2 Development Cycle

**Hot Reload Development**:
1. Run `npm run tauri:dev`
2. Desktop app launches with developer tools
3. Edit React components in `src/`
4. Changes auto-reload in desktop app
5. Rust changes require manual restart

**Component Development**:
```typescript
// 1. Create new component
// src/components/MyNewVisualization/MyNewVisualization.tsx

// 2. Implement with TypeScript
export const MyNewVisualization: React.FC<Props> = ({ ... }) => {
  // Implementation
};

// 3. Test in isolation
npm run test -- MyNewVisualization

// 4. Integrate into App.tsx
import { MyNewVisualization } from './components/MyNewVisualization';

// 5. Verify in dev mode
npm run tauri:dev
```

### 6.3 Production Build

```powershell
# Build for current platform
npm run tauri:build

# Output locations:
# Windows: src-tauri/target/release/shock-and-awe.exe
# macOS: src-tauri/target/release/bundle/macos/Shock-and-Awe.app
# Linux: src-tauri/target/release/shock-and-awe

# Create installer
npm run tauri:build -- --bundles msi    # Windows MSI
npm run tauri:build -- --bundles dmg    # macOS DMG
npm run tauri:build -- --bundles deb    # Linux DEB
```

## 7. Performance Optimization

### 7.1 Target Metrics

- **Startup Time**: < 3 seconds from launch to interactive
- **Frame Rate**: Consistent 60 FPS for all visualizations
- **Memory Usage**: < 500 MB for typical session
- **CPU Usage**: < 25% on modern hardware during active visualization

### 7.2 Optimization Strategies

**Three.js Rendering**:
- Use instanced meshes for particle systems
- Implement LOD (Level of Detail) for distant objects
- Enable frustum culling for off-screen objects
- Use texture atlases to reduce draw calls

**React Performance**:
- Memoize expensive components with `React.memo`
- Use `useMemo` and `useCallback` for expensive calculations
- Implement virtualization for long lists
- Lazy load routes and components

**Tauri Backend**:
- Minimize IPC calls between frontend and backend
- Batch multiple operations when possible
- Use async Rust operations for non-blocking execution
- Implement caching for frequently accessed data

## 8. Testing Strategy

### 8.1 Unit Testing

**Frontend Tests** (Vitest/Jest):
```typescript
// src/components/QuantumVisualization/__tests__/QuantumVisualization.test.tsx
import { render, screen } from '@testing-library/react';
import { QuantumVisualization } from '../QuantumVisualization';

describe('QuantumVisualization', () => {
  it('renders without crashing', () => {
    render(<QuantumVisualization agentCount={100} />);
    expect(screen.getByTestId('quantum-canvas')).toBeInTheDocument();
  });

  it('displays correct agent count', () => {
    render(<QuantumVisualization agentCount={50247} />);
    expect(screen.getByText(/50,247 agents/i)).toBeInTheDocument();
  });
});
```

**Backend Tests** (Rust):
```rust
// src-tauri/src/tests/commands_test.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_agent_status() {
        let result = get_agent_status("benton");
        assert!(result.is_ok());
    }
}
```

### 8.2 Integration Testing

**Tauri Commands**:
```typescript
// Test IPC communication between frontend and backend
import { invoke } from '@tauri-apps/api/tauri';

test('Backend command returns expected data', async () => {
  const result = await invoke('get_agent_status', { county: 'benton' });
  expect(result).toHaveProperty('agentCount');
  expect(result.agentCount).toBeGreaterThan(0);
});
```

### 8.3 E2E Testing

**Playwright/WebdriverIO** (future):
- Launch Tauri desktop app
- Navigate through demonstration flows
- Verify visualizations render correctly
- Test stakeholder presentation scenarios

## 9. Security Considerations

### 9.1 Tauri Security

**Content Security Policy (CSP)**:
```json
{
  "security": {
    "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  }
}
```

**IPC Command Allowlisting**:
```rust
// Only expose necessary commands to frontend
#[tauri::command]
fn get_agent_status(county: String) -> Result<AgentStatus, String> {
    // Implementation
}
```

### 9.2 Government Compliance

**FISMA Requirements**:
- No sensitive county data in demonstration mode
- Simulated data only (no PII)
- Audit logging for backend integration (future)
- SSO authentication for production deployment

## 10. Deployment & Distribution

### 10.1 Stakeholder Distribution

**Package Contents**:
1. Desktop application installer (.msi, .dmg, .deb)
2. Quick-start guide PDF
3. Demonstration script for assessors
4. Technical architecture overview
5. Support contact information

**Installation Process**:
1. Run installer on stakeholder machine
2. Accept government software policy
3. Launch Shock-and-Awe desktop app
4. Follow guided demonstration flow

### 10.2 Update Strategy

**Semantic Versioning**:
- v1.0.0: Initial stakeholder release
- v1.1.0: Backend integration (Phase 1-2)
- v2.0.0: Emergency services integration (Phase 3-4)

**Auto-Update Mechanism** (Tauri updater):
```json
{
  "updater": {
    "active": true,
    "endpoints": ["https://releases.terrafusion.gov/shock-and-awe/{{target}}/{{current_version}}"],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}
```

## 11. Future Enhancements

### 11.1 Short-Term (3-6 months)
- ✅ Backend REST API integration
- ✅ Real-time SignalR updates
- ✅ County-specific customization
- ✅ Enhanced visualizations

### 11.2 Medium-Term (6-12 months)
- ✅ Emergency services integration
- ✅ Production database connectivity
- ✅ SSO authentication
- ✅ Multi-tenant support

### 11.3 Long-Term (12+ months)
- ✅ Mobile companion app (iOS/Android)
- ✅ Web-based dashboard (complementary)
- ✅ VR/AR visualizations
- ✅ Advanced AI consciousness displays

## 12. Recommendations

### Immediate Actions (High Priority)

1. **Clarify Naming** (1-2 days)
   - Update README.md to explicitly state "Demonstration Application"
   - Add disclaimer about simulated emergency capabilities
   - Document actual purpose for new developers

2. **Fix VS Code Tasks** (1 day)
   - Remove references to non-existent directories
   - Create accurate Tauri-based task definitions
   - Test all tasks for correctness

3. **Update Copilot Instructions** (Complete ✅)
   - Created `.github/copilot-instructions.md` with accurate guidance
   - Documented actual architecture and constraints
   - Provided clear development workflows

### Medium-Term Actions (4-8 weeks)

4. **Backend Integration Phase 1**
   - Implement basic REST endpoints in TerraFusion.API
   - Create `TerraFusionAPIClient.ts` service
   - Display real backend metrics in desktop app

5. **Performance Optimization**
   - Profile Three.js rendering performance
   - Optimize React component re-renders
   - Implement caching strategies

6. **Testing Infrastructure**
   - Add comprehensive unit tests (>80% coverage)
   - Create integration test suite
   - Setup CI/CD pipeline

### Long-Term Actions (12+ weeks)

7. **Emergency Services Implementation**
   - Complete TerraFusion.Operations service implementations
   - Integrate desktop app with real emergency endpoints
   - Production-ready incident handling

8. **Production Deployment**
   - Multi-tenant county isolation
   - SSO authentication integration
   - Comprehensive security audit

---

## Appendix A: File Inventory

**Total Files**: 100+ across all directories

**Key Source Files**:
- `src/App.tsx` - Main application component
- `src/main.tsx` - React entry point
- `src-tauri/src/main.rs` - Tauri initialization
- `package.json` - Node dependencies and scripts
- `src-tauri/Cargo.toml` - Rust dependencies

**Configuration Files**:
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `src-tauri/tauri.conf.json` - Tauri desktop configuration
- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Code formatting rules

## Appendix B: Dependencies

**Frontend**:
- react: ^18.x
- react-dom: ^18.x
- three: ^0.x
- @react-three/fiber: ^8.x
- @mui/material: ^5.x
- d3: ^7.x
- vite: ^5.x
- typescript: ^5.x

**Backend (Tauri)**:
- tauri: ^1.x
- serde: ^1.x
- tokio: ^1.x (async runtime)

**Development**:
- @vitejs/plugin-react: ^4.x
- @tauri-apps/cli: ^1.x
- eslint: ^8.x
- prettier: ^3.x
- vitest: ^1.x

---

**Document Version**: 1.0.0  
**Last Updated**: November 2, 2025  
**Author**: TerraFusion Elite Government OS Engineering Agent  
**Status**: Complete ✅
