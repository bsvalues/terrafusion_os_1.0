# 🏗️ TERRAFUSION OS - GENERATION 2 APPLICATION ARCHITECTURE

**The Template for All Future Government Applications**

---

## Strategic Decision: January 2026

We recognized that the 32 applications in `/applications` were "Generation 1" - standalone full-stack apps built **before** TerraFusion OS existed. They carry heavy baggage:

- Own authentication systems
- Own database connections
- Own server processes
- Heavy, duplicated builds

**Generation 2 changes everything.**

---

## The Generation Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION GENERATIONS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   GENERATION 1 (Legacy)                 GENERATION 2 (Native OS)        │
│   ═════════════════════                ═══════════════════════════      │
│                                                                          │
│   ┌─────────────────┐                  ┌─────────────────┐              │
│   │  terra-permit   │                  │  TerraDossier   │              │
│   │  terra-levy     │                  │  (First Native) │              │
│   │  terra-flow     │                  │                 │              │
│   │  etc...         │                  │  Future apps    │              │
│   ├─────────────────┤                  ├─────────────────┤              │
│   │ Own Auth        │                  │ OS Identity ────┼──┐           │
│   │ Own Database    │                  │ OS Data Layer ──┼──┤ KERNEL    │
│   │ Own Server      │                  │ OS AI Swarm ────┼──┤           │
│   │ Heavy Build     │                  │ Light Module    │  │           │
│   └─────────────────┘                  └─────────────────┘  │           │
│          │                                    ↑              │           │
│          │                                    └──────────────┘           │
│          │                                                               │
│          ↓                                                               │
│     FREEZE/ARCHIVE                        BUILD THESE                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## What Generation 2 Apps Inherit

### 1. Identity (from OS Shell)

**No auth code needed.** The OS Shell manages user sessions.

```typescript
// Gen 2 apps receive user context automatically
interface OSUserContext {
  userId: string
  email: string
  displayName: string
  role: 'Administrator' | 'Assessor' | 'Analyst' | 'Citizen'
  countyId: string
  permissions: string[]
  sessionToken: string
}

// Accessed via OS Context Provider
import { useOSContext } from '@os/providers/OSContextProvider'

function MyComponent() {
  const { user, county } = useOSContext()
  // User is already authenticated by OS Shell
}
```

### 2. Database (from OS Data Layer)

**No connection strings needed.** The OS manages data persistence.

```typescript
// Gen 2 apps use OS Data APIs
import { useOSData } from '@os/hooks/useOSData'

function MyComponent() {
  const { query, mutate } = useOSData()
  
  // Query data (OS handles connection, county isolation, audit)
  const notebooks = await query('notebooks', { 
    where: { userId: user.id }
  })
  
  // Mutate data (OS handles validation, audit logging)
  await mutate('notebooks', 'create', notebookData)
}
```

### 3. AI (from 1,008 Agent Swarm)

**No AI integration needed.** The OS provides direct Swarm access.

```typescript
// Gen 2 apps connect to AI Swarm
import { useAISwarm } from '@os/hooks/useAISwarm'

function MyComponent() {
  const { chat, generate, analyze } = useAISwarm()
  
  // Chat with PropertyAssessmentGPT
  const response = await chat({
    gptId: 'property-assessment',
    message: userInput
  })
  
  // Generate report with AI
  const report = await generate({
    template: 'compliance-audit',
    data: complianceData
  })
}
```

### 4. UI (from OS Design System)

**Consistent look and feel.** Apps use the shared component library.

```typescript
import { 
  Button, 
  Card, 
  Input, 
  Table,
  Dialog 
} from '@terrafusion/ui-kit'
```

---

## Generation 2 Package.json Manifest

```json
{
  "name": "@terrafusion/app-name",
  "version": "0.1.0",
  "type": "module",
  "terrafusion": {
    "generation": 2,
    "type": "native-os-app",
    "inherits": {
      "identity": "os-shell",
      "database": "os-data-layer",
      "ai": "swarm-intelligence"
    },
    "port": 3007,
    "category": "productivity",
    "permissions": [
      "ai.swarm.access",
      "data.read",
      "data.write"
    ]
  }
}
```

---

## Directory Structure

```
applications/
├── terra-dossier/          # GENERATION 2 (Native)
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── stores/         # Zustand stores
│   │   ├── styles/         # App-specific styles
│   │   ├── App.tsx         # Main component
│   │   └── main.tsx        # Entry point
│   ├── package.json        # Gen-2 manifest
│   └── vite.config.ts      # Lightweight build
│
├── terra-permit-production/ # GENERATION 1 (Legacy - FROZEN)
├── terra-levy/              # GENERATION 1 (Legacy - FROZEN)
├── terra-flow-production/   # GENERATION 1 (Legacy - FROZEN)
└── ...
```

---

## Creating a New Generation 2 App

### Step 1: Create Directory

```bash
mkdir applications/my-new-app
cd applications/my-new-app
```

### Step 2: Initialize with Gen-2 Template

```bash
# Copy from TerraDossier template
cp -r ../terra-dossier/* .

# Update package.json with new name
```

### Step 3: Configure OS Integration

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5000',  // OS Gateway
      '/ai': 'http://localhost:5000',    // AI Swarm
    },
  },
})
```

### Step 4: Develop

```bash
npm install
npm run dev
```

---

## Migration Path: Gen 1 → Gen 2

For legacy apps that need modernization:

1. **Freeze** the Gen 1 app in current state
2. **Create** new Gen 2 app with same name + "-native" suffix
3. **Migrate** business logic (no auth/db code needed)
4. **Connect** to OS services instead of custom backends
5. **Test** thoroughly with OS integration
6. **Deprecate** Gen 1 when Gen 2 is stable

---

## First Gen 2 Application: TerraDossier

**TerraDossier** is the pilot application for Generation 2 architecture.

| Feature | Implementation |
|---------|---------------|
| **Purpose** | AI Notebook Suite |
| **Identity** | Inherited from OS Shell |
| **Database** | OS Data Layer (PostgreSQL) |
| **AI** | Connected to 1,008 Agent Swarm |
| **Port** | 3007 |
| **Status** | ✅ Scaffolded |

---

## Benefits of Generation 2

| Aspect | Gen 1 | Gen 2 | Improvement |
|--------|-------|-------|-------------|
| **Lines of Code** | 10,000+ | 2,000 | 80% reduction |
| **Auth Code** | 500+ lines | 0 lines | 100% eliminated |
| **DB Setup** | Complex | None | Inherited |
| **AI Integration** | None/Custom | Native | Full Swarm |
| **Build Time** | 2-5 min | 10 sec | 90% faster |
| **Dependencies** | 100+ | 20 | 80% reduction |

---

## The Future

All new TerraFusion OS applications will be **Generation 2 Native**.

Legacy Gen 1 apps will be:
- **Archived** for reference
- **Migrated** to Gen 2 when needed
- **Never** enhanced with new features

This is **The TerraFusion Way**.

---

*Document Created: January 2026*
*First Gen 2 App: TerraDossier*
*Status: ACTIVE ARCHITECTURE*
