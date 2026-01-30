# Property Workbench Canonical Specification v3.0

**Status:** LOCKED - Implementation Required  
**Last Updated:** January 28, 2026  
**Classification:** OS-Level Architecture Specification  

---

## CANONICAL NAMES (ENFORCEMENT REQUIRED)

**These names are IMMUTABLE. Lint rules must prevent variants:**

| Component | Canonical Name | Forbidden Variants |
|-----------|---------------|-------------------|
| Operating System | TerraFusion | Tara Fusion, Terra-Fusion, TaraFusion |
| Valuation Suite | TerraForge | TaraForge, Terra Forge |
| GIS Suite | TerraAtlas | TaraAtlas, Terra Atlas |
| Assessor Admin Suite | TerraDais | TaraDais, Terra Dais |
| Case/Evidence Suite | TerraDossier | TaraDossier, Terra Dossier |
| Personal Copilot | TerraPilot | TaraPilot, Terra Pilot |
| Activity Trail | TerraTrace | TaraTrace, Terra Trace |
| Property Hub | Property Workbench | Parcel Workbench, Property Hub |

**Lint Rule Required:**
```javascript
// .eslintrc.js or equivalent
rules: {
  "terrafusion/canonical-names": ["error", {
    forbidden: ["Tara", "TaraFusion", "TaraForge", "TaraAtlas", 
                "TaraDais", "TaraDossier", "TaraPilot", "TaraTrace"]
  }]
}
```

---

## 1. ARCHITECTURAL POSITION (UNCHANGED)

Property Workbench is a **Tier 0 OS Surface** - the canonical parcel interaction point.

**URL Pattern (Canonical):**
```
/property/:parcelId           # Always lands on Summary tab
/property/:parcelId/:tab      # Direct to specific tab
```

**Navigation Flow:**
```
Global Search → Parcel ID → Property Workbench → Suite Tab → Work
```

---

## 2. TAB STRUCTURE & OWNERSHIP (ENHANCED)

### Tab Registry (Canonical)

| Tab Name | Owner | Type | Permissions | Future-Proof |
|----------|-------|------|-------------|--------------|
| summary | OS Core | always | * | ✅ Reserved |
| forge | TerraForge | conditional | forge:read | ✅ Reserved |
| atlas | TerraAtlas | conditional | atlas:read | ✅ Reserved |
| dais | TerraDais | conditional | dais:read | ✅ Reserved |
| dossier | TerraDossier | conditional | dossier:read | ✅ Reserved |
| pilot | OS Core | always | * | ✅ Reserved |
| clerk | TerraClerk | future | clerk:read | ⚠️ Reserved |
| treasurer | TerraTreasury | future | treasurer:read | ⚠️ Reserved |
| auditor | TerraAudit | future | auditor:read | ⚠️ Reserved |
| recorder | TerraRecorder | future | recorder:read | ⚠️ Reserved |

**Tab Visibility Rules:**
```typescript
interface TabVisibilityRule {
  tab: TabName;
  condition: (user: User, parcel: Parcel) => boolean;
  fallback?: string; // Redirect if condition fails
}

const TAB_VISIBILITY: TabVisibilityRule[] = [
  {
    tab: "summary",
    condition: () => true // Always visible
  },
  {
    tab: "forge",
    condition: (user) => user.hasPermission("forge:read") && user.hasLicense("TerraForge"),
    fallback: "summary"
  },
  {
    tab: "dais",
    condition: (user) => user.hasPermission("dais:read") && user.hasLicense("TerraDais"),
    fallback: "summary"
  }
  // ... etc
];
```

---

## 3. WRITE-LANE MATRIX (NEW - CRITICAL)

### Data Ownership Rules

**PRINCIPLE:** Each data entity has exactly ONE owning suite that can write it. Other suites can READ via APIs.

| Data Entity | Owner | Write Permission | Read Permission | Notes |
|-------------|-------|-----------------|-----------------|-------|
| **Parcel Core** | OS Core | os:parcel:write | * | Identifiers, situs, legal |
| **Ownership Records** | OS Core | os:ownership:write | * | Owner names, addresses |
| **Global Flags** | OS Core | os:flags:write | * | Data quality, status flags |
| **Valuation Models** | TerraForge | forge:models:write | forge:read | Model configs, outputs |
| **Comparables** | TerraForge | forge:comps:write | forge:read | Comp selections, adjustments |
| **Cost Data** | TerraForge | forge:cost:write | forge:read | Cost approach calculations |
| **Income Data** | TerraForge | forge:income:write | forge:read | Income approach data |
| **Valuation Notes** | TerraForge | forge:notes:write | forge:read | Appraiser narratives |
| **GIS Layers** | TerraAtlas | atlas:layers:write | atlas:read | Map layers, styling |
| **Spatial Bookmarks** | TerraAtlas | atlas:bookmarks:write | atlas:read | Saved map views |
| **Annotations** | TerraAtlas | atlas:annotations:write | atlas:read | Map markup, notes |
| **Permits** | TerraDais | dais:permits:write | dais:read | Permit records, status |
| **Exemptions** | TerraDais | dais:exemptions:write | dais:read | Exemption decisions |
| **Appeals** | TerraDais | dais:appeals:write | dais:read | Appeal records, outcomes |
| **Notices** | TerraDais | dais:notices:write | dais:read | Generated notices, queue |
| **Certification** | TerraDais | dais:cert:write | dais:read | Roll cert checklists |
| **Workflow Tasks** | TerraDais | dais:tasks:write | dais:read | Task assignments, queues |
| **Dossier Items** | TerraDossier | dossier:items:write | dossier:read | Documents, evidence |
| **Narratives** | TerraDossier | dossier:narratives:write | dossier:read | Written explanations |
| **Packets** | TerraDossier | dossier:packets:write | dossier:read | Assembled document sets |
| **Trace Events** | OS Core | os:trace:write | os:trace:read | Audit trail (append-only) |
| **User Preferences** | OS Core | os:user:write | os:user:read | Per-user settings |

### Cross-Suite Write Rules

**FORBIDDEN:**
- TerraForge CANNOT write permits (TerraDais owns)
- TerraDais CANNOT write valuations (TerraForge owns)
- TerraAtlas CANNOT write exemptions (TerraDais owns)

**ALLOWED (via API contract):**
- TerraForge can READ permits to flag "permit-triggered revaluation"
- TerraDais can READ valuations to generate notice text
- TerraAtlas can READ all entities for map overlays

**ENFORCEMENT:**
```typescript
// Validation middleware (enforced at API layer)
function validateWriteLane(
  entity: DataEntity,
  suite: SuiteName,
  user: User
): void {
  const owner = WRITE_LANE_MATRIX[entity.type].owner;
  
  if (owner !== suite && owner !== "os") {
    throw new WriteLaneViolationError(
      `Suite "${suite}" cannot write "${entity.type}" (owned by "${owner}")`
    );
  }
  
  // Log violation attempt
  TraceService.emit({
    event: {
      suite,
      module: "os-core",
      action: "write_lane_violation_blocked",
      category: "system"
    },
    data: {
      inputs: { entityType: entity.type, attemptedBy: suite, owner },
      outputs: { blocked: true }
    },
    compliance: {
      classification: "RESTRICTED",
      auditRequired: true
    }
  });
}
```

---

## 4. CONTEXT RIBBON (ENHANCED)

### Ribbon Data Model

```typescript
interface ContextRibbon {
  // Core Identity (Always Visible)
  parcel: {
    id: string;              
    displayId: string;        // User-friendly format
    situs: string;
    owner: string;
    county: string;
  };
  
  // Status Badges (Dynamic - Suite Contributions)
  badges: RibbonBadge[];
  
  // Quick Actions (Context-Aware)
  quickActions: RibbonAction[];
  
  // TerraPilot Integration
  pilotButton: {
    visible: boolean;
    badge: number;          // Unread suggestions
    mode: "pilot" | "muse";
  };
}

interface RibbonBadge {
  id: string;
  suite: SuiteName;          // Which suite provided this
  label: string;             // "Appeal Active"
  variant: "success" | "warning" | "danger" | "info";
  detail?: string;           // "BOE Hearing 2/15"
  onClick?: () => void;      // Optional navigation
}

interface RibbonAction {
  id: string;
  label: string;
  icon: string;
  permissions: string[];
  onClick: () => void;
}
```

### Suite Contribution API

Each suite provides badges via extension API:

```typescript
// Example from TerraDais
class DaisWorkbenchExtension implements WorkbenchExtension {
  getContextRibbonBadges(parcelId: string, user: User): RibbonBadge[] {
    const badges: RibbonBadge[] = [];
    
    // Check for active appeal
    const appeal = await AppealService.getActive(parcelId);
    if (appeal) {
      badges.push({
        id: "appeal-active",
        suite: "dais",
        label: "Appeal Active",
        variant: "warning",
        detail: `BOE Hearing ${appeal.hearingDate}`,
        onClick: () => router.navigate(`/property/${parcelId}/dais/appeals`)
      });
    }
    
    // Check for pending exemption
    const exemption = await ExemptionService.getPending(parcelId);
    if (exemption) {
      badges.push({
        id: "exemption-pending",
        suite: "dais",
        label: "Exemption Pending",
        variant: "info",
        detail: exemption.type
      });
    }
    
    return badges;
  }
  
  getQuickActions(parcelId: string, user: User): RibbonAction[] {
    const actions: RibbonAction[] = [];
    
    if (user.hasPermission("dais:notices:write")) {
      actions.push({
        id: "create-notice",
        label: "Create Notice",
        icon: "📧",
        permissions: ["dais:notices:write"],
        onClick: () => NoticeService.createForParcel(parcelId)
      });
    }
    
    return actions;
  }
}
```

---

## 5. WORKBENCH EXTENSION API (NEW)

### Extension Contract

Every suite must implement this interface to integrate with Property Workbench:

```typescript
interface WorkbenchExtension {
  // Identity
  suite: SuiteName;
  version: string;
  
  // Tab Registration
  getTabs(
    parcelId: string,
    user: User
  ): WorkbenchTab[];
  
  // Context Ribbon Contributions
  getContextRibbonBadges(
    parcelId: string,
    user: User
  ): RibbonBadge[];
  
  getQuickActions(
    parcelId: string,
    user: User
  ): RibbonAction[];
  
  // Work Mode Integration
  getPanels(
    workMode: WorkMode,
    parcelId: string,
    user: User
  ): WorkbenchPanel[];
  
  // Lifecycle Hooks
  onTabActivated?(
    parcelId: string,
    user: User
  ): Promise<void>;
  
  onTabDeactivated?(
    parcelId: string,
    user: User
  ): Promise<void>;
}

interface WorkbenchTab {
  id: string;
  label: string;
  icon: string;
  route: string;
  permissions: string[];
  order: number;              // Tab position
  visible: boolean;
}

interface WorkbenchPanel {
  id: string;
  title: string;
  component: ComponentType;
  position: "left" | "right" | "bottom";
  collapsible: boolean;
  defaultCollapsed: boolean;
}
```

### Registration

```typescript
// OS Core assembles workbench from extensions
class PropertyWorkbenchOrchestrator {
  private extensions: Map<SuiteName, WorkbenchExtension> = new Map();
  
  registerExtension(extension: WorkbenchExtension): void {
    this.extensions.set(extension.suite, extension);
  }
  
  async buildWorkbench(
    parcelId: string,
    user: User
  ): Promise<WorkbenchConfig> {
    const tabs: WorkbenchTab[] = [];
    const badges: RibbonBadge[] = [];
    const actions: RibbonAction[] = [];
    
    // Always include Summary (OS Core)
    tabs.push({
      id: "summary",
      label: "Summary",
      icon: "📋",
      route: `/property/${parcelId}`,
      permissions: [],
      order: 0,
      visible: true
    });
    
    // Collect from extensions
    for (const [suite, extension] of this.extensions) {
      if (user.hasLicense(suite)) {
        tabs.push(...await extension.getTabs(parcelId, user));
        badges.push(...await extension.getContextRibbonBadges(parcelId, user));
        actions.push(...await extension.getQuickActions(parcelId, user));
      }
    }
    
    // Sort tabs by order
    tabs.sort((a, b) => a.order - b.order);
    
    return { tabs, badges, actions };
  }
}
```

---

## 6. WORK MODES (ENHANCED)

### Mode Override Rules

```typescript
interface ModeOverridePolicy {
  // What happens when user tries to use wrong-mode tool?
  onWrongModeTool: "block" | "suggest-switch" | "auto-switch";
  
  // When to auto-suggest mode switch
  autoSuggestThreshold: number; // 0-1 confidence
  
  // Never auto-switch for these tool categories
  neverAutoSwitchFor: ToolCategory[];
}

const DEFAULT_MODE_POLICY: ModeOverridePolicy = {
  onWrongModeTool: "suggest-switch",
  autoSuggestThreshold: 0.8,
  neverAutoSwitchFor: ["execution", "approval", "certification"]
};
```

### Mode Persistence Strategy

```typescript
interface ModePersistence {
  // User's global default
  userDefault: WorkMode;
  
  // Per-suite defaults (overrides global)
  suiteDefaults: Record<SuiteName, WorkMode>;
  
  // Per-module defaults (overrides suite)
  moduleDefaults: Record<string, WorkMode>;
  
  // Session state (current mode in this session)
  currentMode: WorkMode;
}

// Example
const userModeConfig: ModePersistence = {
  userDefault: "overview",
  suiteDefaults: {
    forge: "valuation",
    atlas: "mapping",
    dais: "admin"
  },
  moduleDefaults: {
    "terra-exempt": "admin",
    "terra-appeal": "case"
  },
  currentMode: "admin" // Currently in Admin mode
};
```

### Mode Switch Logic

```typescript
async function handleToolRequest(
  tool: BaseTool,
  currentMode: WorkMode,
  policy: ModeOverridePolicy
): Promise<ToolExecutionResult> {
  
  // Check if tool requires different mode
  if (tool.mode !== currentMode && tool.mode !== "both") {
    
    // High-impact tools NEVER auto-switch
    if (policy.neverAutoSwitchFor.includes(tool.category)) {
      throw new ModeViolationError(
        `Tool "${tool.name}" requires ${tool.mode} mode. Please switch manually.`
      );
    }
    
    // Suggest or auto-switch based on policy
    if (policy.onWrongModeTool === "auto-switch") {
      await switchMode(tool.mode);
      return await tool.execute();
      
    } else if (policy.onWrongModeTool === "suggest-switch") {
      // Show modal
      const confirmed = await showModeSwitchModal({
        currentMode,
        requiredMode: tool.mode,
        toolName: tool.name
      });
      
      if (confirmed) {
        await switchMode(tool.mode);
        return await tool.execute();
      } else {
        throw new UserCancelledError();
      }
      
    } else {
      throw new ModeViolationError(
        `Cannot use ${tool.mode}-mode tool while in ${currentMode} mode`
      );
    }
  }
  
  // Mode matches - execute
  return await tool.execute();
}
```

---

## 7. RESERVED NAMESPACE PREFIXES (NEW)

### Module Naming Conventions

**Format:** `terra-{suite}-{module}`

| Suite | Prefix | Examples | Status |
|-------|--------|----------|--------|
| Core | `terra-core-*` | `terra-core-auth`, `terra-core-flags` | ✅ Active |
| Forge | `terra-forge-*` | `terra-forge-models`, `terra-forge-comps` | ✅ Active |
| Atlas | `terra-atlas-*` | `terra-atlas-layers`, `terra-atlas-spatial` | ✅ Active |
| Dais | `terra-dais-*` | `terra-dais-permit`, `terra-dais-exempt` | ✅ Active |
| Dossier | `terra-dossier-*` | `terra-dossier-items`, `terra-dossier-packets` | ✅ Active |
| Pilot | `terra-pilot-*` | `terra-pilot-tools`, `terra-pilot-profile` | ✅ Active |
| Clerk | `terra-clerk-*` | `terra-clerk-elections`, `terra-clerk-licenses` | ⚠️ Reserved |
| Treasury | `terra-treasury-*` | `terra-treasury-collections`, `terra-treasury-receipts` | ⚠️ Reserved |
| Auditor | `terra-audit-*` | `terra-audit-compliance`, `terra-audit-reports` | ⚠️ Reserved |
| Recorder | `terra-recorder-*` | `terra-recorder-documents`, `terra-recorder-deeds` | ⚠️ Reserved |

**FORBIDDEN:**
- TerraDais modules CANNOT use `terra-clerk-*` prefix
- TerraForge modules CANNOT use `terra-audit-*` prefix
- Any suite CANNOT use another suite's reserved prefix

**Enforcement:**
```typescript
// Module registration validation
function validateModuleName(moduleName: string, suite: SuiteName): void {
  const prefix = `terra-${suite.toLowerCase()}-`;
  
  if (!moduleName.startsWith(prefix)) {
    throw new NamingViolationError(
      `Module "${moduleName}" must use prefix "${prefix}" for suite "${suite}"`
    );
  }
  
  // Check for reserved prefix violations
  const reservedPrefixes = ["terra-clerk-", "terra-treasury-", "terra-audit-", "terra-recorder-"];
  for (const reserved of reservedPrefixes) {
    if (moduleName.startsWith(reserved) && suite !== extractSuiteFromPrefix(reserved)) {
      throw new NamingViolationError(
        `Module "${moduleName}" uses reserved prefix "${reserved}"`
      );
    }
  }
}
```

---

## 8. MIGRATION & COMPATIBILITY PLAN (NEW)

### Phase-Based Migration

**Phase 0: Shell Deployment (Week 1-2)**
- Deploy Property Workbench shell (Summary tab only)
- Old parcel screens remain functional
- New route `/property/:id` coexists with legacy routes
- No breaking changes

**Phase 1: Suite Tab Migration (Week 3-6)**
- Each suite creates WorkbenchExtension implementation
- Suites register tabs with Workbench orchestrator
- Old parcel screens still accessible via legacy routes
- Both systems run in parallel

**Phase 2: Route Redirection (Week 7-8)**
- Implement redirects from legacy routes to Workbench tabs
- Example: `/forge/parcel/:id` → `/property/:id/forge`
- Preserve query parameters and state
- Log redirects for monitoring

**Phase 3: Contract Verification (Week 9-10)**
- Automated tests verify all suites implement WorkbenchExtension
- Validate write-lane compliance
- Check permission enforcement
- Verify Trace logging

**Phase 4: Legacy Cleanup (Week 11-12)**
- Remove old parcel screens only after:
  - 100% Workbench adoption measured
  - Zero critical bugs for 2 weeks
  - All bookmarks migrated
  - User training completed

### Backward Compatibility Rules

**DO NOT BREAK:**
- Bookmarked URLs (redirect gracefully)
- Deep links from emails (preserve via redirects)
- Saved queries (migrate filters to new format)
- API contracts (maintain v1 alongside v2)
- Keyboard shortcuts (map old to new)

**PROVIDE:**
- Redirect mapping table for all legacy routes
- Migration guide for users
- Fallback to legacy view if Workbench fails
- Rollback plan if adoption <80% after 4 weeks

### Redirect Implementation

```typescript
// Legacy route redirects
const LEGACY_REDIRECTS: Record<string, string> = {
  "/forge/parcel/:id": "/property/:id/forge",
  "/atlas/parcel/:id": "/property/:id/atlas",
  "/dais/parcel/:id": "/property/:id/dais",
  "/parcel/:id": "/property/:id/summary"
};

// Middleware
app.use((req, res, next) => {
  for (const [legacy, modern] of Object.entries(LEGACY_REDIRECTS)) {
    if (matchRoute(req.path, legacy)) {
      const modernPath = transformPath(req.path, legacy, modern);
      
      // Log redirect for monitoring
      TraceService.emit({
        event: {
          suite: "os",
          module: "os-core",
          action: "legacy_redirect",
          category: "system"
        },
        data: {
          inputs: { legacyPath: req.path, modernPath },
          outputs: { redirected: true }
        }
      });
      
      return res.redirect(301, modernPath);
    }
  }
  next();
});
```

---

## 9. BRIDGE UI CONCEPT (NEW)

### Suite Compass Component

**Purpose:** Help users understand "what can I do here?"

```typescript
interface SuiteCompass {
  suites: SuiteCompassItem[];
  currentSuite: SuiteName | null;
}

interface SuiteCompassItem {
  suite: SuiteName;
  icon: string;
  label: string;
  capabilities: string[];    // Short list of what you can do
  active: boolean;           // Currently in this suite's tab
  available: boolean;        // User has permission + license
}

// Example rendering
const SUITE_COMPASS: SuiteCompassItem[] = [
  {
    suite: "forge",
    icon: "⚒️",
    label: "Forge",
    capabilities: [
      "Run valuation models",
      "Find comparables",
      "Analyze costs"
    ],
    active: false,
    available: true
  },
  {
    suite: "atlas",
    icon: "🗺️",
    label: "Atlas",
    capabilities: [
      "View maps",
      "Analyze spatial data",
      "Create overlays"
    ],
    active: false,
    available: true
  },
  {
    suite: "dais",
    icon: "🏛️",
    label: "Dais",
    capabilities: [
      "Manage permits",
      "Process exemptions",
      "Handle appeals"
    ],
    active: true,  // Currently here
    available: true
  }
];
```

**UI Placement:**
- Small compass widget in bottom-right of Workbench
- Expandable on hover to show capabilities
- Click to navigate to suite tab
- Shows "not available" state if no permission/license

**Visual (Collapsed):**
```
┌─ Suite Compass ─┐
│ ⚒️  🗺️  🏛️  📁 │
└──────────────────┘
```

**Visual (Expanded on Hover):**
```
┌─ Suite Compass ──────────────────────┐
│ ⚒️ Forge                             │
│    • Run models                       │
│    • Find comps                       │
│                                       │
│ 🗺️ Atlas                             │
│    • View maps                        │
│    • Spatial analysis                 │
│                                       │
│ 🏛️ Dais (Current)                    │
│    • Manage permits                   │
│    • Process exemptions               │
│    • Handle appeals                   │
│                                       │
│ 📁 Dossier                            │
│    • Manage documents                 │
│    • Create narratives                │
└───────────────────────────────────────┘
```

---

## 10. VALIDATION & ENFORCEMENT

### Contract Checks

```typescript
// Automated validation run on every deployment
class WorkbenchContractValidator {
  async validateSuiteIntegration(suite: SuiteName): Promise<ValidationResult> {
    const extension = WorkbenchOrchestrator.getExtension(suite);
    
    const checks = [
      this.validateTabRegistration(extension),
      this.validateWriteLaneCompliance(suite),
      this.validatePermissionGates(extension),
      this.validateTraceLogging(suite),
      this.validateNamespacePrefix(suite)
    ];
    
    const results = await Promise.all(checks);
    const passed = results.every(r => r.success);
    
    return {
      suite,
      passed,
      checks: results,
      timestamp: new Date()
    };
  }
  
  private validateWriteLaneCompliance(suite: SuiteName): ValidationResult {
    // Scan all API endpoints in suite
    // Verify each write operation respects write-lane matrix
    // Return violations if found
  }
  
  private validateNamespacePrefix(suite: SuiteName): ValidationResult {
    // Scan all module names in suite
    // Verify proper prefix usage
    // Check for reserved prefix violations
  }
}
```

### Deployment Gate

```yaml
# CI/CD Pipeline
workbench-validation:
  stage: test
  script:
    - npm run validate:workbench-contracts
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: always
  allow_failure: false  # Block deployment if validation fails
```

---

## IMPLEMENTATION CHECKLIST

**Phase 0: Foundation**
- [ ] Create WorkbenchExtension interface
- [ ] Implement Property Workbench shell (Summary tab)
- [ ] Deploy OS Core routes (`/property/:id`)
- [ ] Add Suite Compass widget

**Phase 1: Suite Integration**
- [ ] TerraForge implements WorkbenchExtension
- [ ] TerraAtlas implements WorkbenchExtension
- [ ] TerraDais implements WorkbenchExtension
- [ ] TerraDossier implements WorkbenchExtension
- [ ] TerraPilot registers as OS-level tab

**Phase 2: Enforcement**
- [ ] Implement write-lane validation middleware
- [ ] Add naming lint rules (canonical names, namespace prefixes)
- [ ] Create contract validation tests
- [ ] Set up deployment gates

**Phase 3: Migration**
- [ ] Implement legacy route redirects
- [ ] Create migration guide for users
- [ ] Monitor adoption metrics
- [ ] Remove legacy screens (after validation)

**Phase 4: Enhancement**
- [ ] Add mode persistence logic
- [ ] Implement Context Ribbon badge system
- [ ] Build Suite Compass tooltips
- [ ] Create user training materials

---

## REFERENCES

- **Related Specs:** `TERRAPILOT_SPEC_v3.md`, `ADR_0001-0004.md`
- **Implementation:** `os-platform/core/property-workbench/`
- **Tests:** `os-platform/core/property-workbench/__tests__/`

---

**END OF SPECIFICATION**
