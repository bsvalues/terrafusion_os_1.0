# Property Workbench Canonical Specification v3.0

**Document ID:** TF-050  
**Status:** Canonical (Locked)  
**Version:** 3.0  
**Era:** Genesis Era (1.0)  
**Effective:** 2026-01-28  
**Supersedes:** All previous parcel screen implementations

---

## 1. Executive Summary

The **Property Workbench** is the unified parcel interface for TerraFusion OS—a **Tier 0 OS Surface** that serves as the bridge between all suites. Every county staff member, regardless of role, lands on the same workbench when working with a parcel. Suites contribute tabs; the OS owns the shell.

**Mission:** "One parcel, one screen, every role."

---

## 2. Canonical Names

| Component | Name | Type | Status |
|-----------|------|------|--------|
| Platform | TerraFusion | OS | Active |
| Valuation Suite | TerraForge | Suite | Active |
| GIS Suite | TerraAtlas | Suite | Active |
| Assessor Admin Suite | TerraDais | Suite | Active |
| Records/Evidence Suite | TerraDossier | Suite | Active |
| Personal Copilot | TerraPilot | OS Feature | Active |
| Parcel Interface | Property Workbench | OS Surface | Active |

### Reserved Names (Future Offices)

| Name | Reserved For | Status |
|------|--------------|--------|
| TerraClerk | County Clerk Suite | Reserved |
| TerraTreasury | County Treasurer Suite | Reserved |
| TerraAudit | County Auditor Suite | Reserved |
| TerraRecorder | Recorder Suite | Reserved |

### Blocked Module Prefixes (Collision Prevention)

- `terra-clerk-*` → Reserved for TerraClerk
- `terra-treasury-*` → Reserved for TerraTreasury
- `terra-audit-*` → Reserved for TerraAudit (use `terra-trace-*` for Assessor audit trails)
- `terra-recorder-*` → Reserved for TerraRecorder

---

## 3. Architectural Position

### Tier Classification

```
TerraFusion OS Architecture Tiers
├── Tier 0: OS Surfaces (Core UI Framework) ← Property Workbench lives here
│   ├── Global Search
│   ├── Property Workbench
│   ├── Main Navigation (OS Shell)
│   ├── System Settings
│   └── TerraPilot (Personal Copilot)
│
├── Tier 1: Suites (Major Functional Domains)
│   ├── TerraForge (Valuation)
│   ├── TerraAtlas (GIS)
│   ├── TerraDais (Assessor Admin)
│   ├── TerraDossier (Records/Evidence)
│   └── GPT Suite (AI Assistance)
│
└── Tier 2: Modules (within suites)
    ├── terra-levy, terra-pilt, terra-permit, etc. (TerraDais)
    ├── terra-parcel, terra-layers, etc. (TerraAtlas)
    └── terra-cost, terra-comp, etc. (TerraForge)
```

### Ownership Rule

> **Property Workbench is NOT owned by any suite.**  
> It is an OS-level surface. Suites contribute tabs as plugins.

---

## 4. URL Patterns (Canonical)

```
# Primary routes
/property/:parcelId                 → Summary tab (default)
/property/:parcelId/forge          → TerraForge tab
/property/:parcelId/atlas          → TerraAtlas tab
/property/:parcelId/dais           → TerraDais tab
/property/:parcelId/dossier        → TerraDossier tab
/property/:parcelId/pilot          → TerraPilot tab

# Deep links (preserve existing routes)
/property/:parcelId/forge/cost     → Cost approach panel
/property/:parcelId/dais/exempt    → Exemption workflow
/property/:parcelId/atlas/layers   → Layer manager

# Future office tabs
/property/:parcelId/clerk          → TerraClerk tab (reserved)
/property/:parcelId/treasury       → TerraTreasury tab (reserved)
/property/:parcelId/auditor        → TerraAudit tab (reserved)
```

### Navigation Flow

```
Global Search → Parcel ID → Property Workbench → Suite Tab
     ↓                           ↓
  "1-23456"                 Summary (default)
```

---

## 5. Tab Structure

### Canonical Tab Order

| Position | Tab | Owner | Icon | Shortcut |
|----------|-----|-------|------|----------|
| 1 | Summary | OS Core | 📋 | Alt+1 |
| 2 | Forge | TerraForge | ⚒️ | Alt+2 |
| 3 | Atlas | TerraAtlas | 🗺️ | Alt+3 |
| 4 | Dais | TerraDais | 🏛️ | Alt+4 |
| 5 | Dossier | TerraDossier | 📁 | Alt+5 |
| 6 | Pilot | TerraPilot | 🤖 | Alt+6 |

### Tab Visibility by Role

| Tab | Appraiser | GIS Tech | Admin | Clerk | Treasurer | Auditor |
|-----|-----------|----------|-------|-------|-----------|---------|
| Summary | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Forge | ✅ | read | ✅ | - | - | read |
| Atlas | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dais | ✅ | read | ✅ | read | read | read |
| Dossier | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pilot | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend:** ✅ = full access, `read` = read-only, `-` = hidden

---

## 6. Context Ribbon (Persistent Header)

The Context Ribbon is always visible across all tabs, providing parcel identity and status at a glance.

### Data Model

```typescript
interface ContextRibbon {
  // Core Identity
  parcel: {
    id: string;              // "1-23456"
    situs: string;           // "123 Main St"
    owner: string;           // "Smith, John & Jane"
    county: string;          // "Benton County, WA"
    legalDescription: string; // Short version
  };
  
  // Active Statuses (visual badges)
  statuses: {
    appeal: AppealStatus | null;      // "Active - BOE Hearing 2/15"
    exemption: ExemptionStatus | null; // "Senior Exemption - Active"
    permit: PermitStatus | null;       // "Renovation - In Progress"
    certification: CertStatus | null;  // "Ready for Roll"
    levy: LevyImpact | null;          // "Special Assessment Active"
    dataQuality: DQFlag | null;       // "Review Required"
  };
  
  // Quick Actions (role-aware, max 4 shown)
  quickActions: QuickAction[];
  
  // Work Mode indicator
  currentWorkMode: WorkMode;
}
```

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🏠 1-23456 │ Smith, John & Jane │ 123 Main St, Kennewick, WA 99338     │
│ 🚨 Appeal Active  💰 Senior Exemption  🔨 Permit Open  ⚠️ Data Review   │
│ [📁 Open Dossier] [📨 Create Notice] [📋 Assign Task] [🤖 Ask Pilot]   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Work Modes

Work Modes align the UI to how staff think about their tasks, not which suite they're in.

### Mode Definitions

| Mode | Default Tab | Focus | Primary Use Case |
|------|-------------|-------|------------------|
| Overview | Summary | Big picture | Initial review, orientation |
| Valuation | Forge | Value work | Model runs, comps, cost approach |
| Mapping | Atlas | Spatial | GIS analysis, boundary review |
| Admin | Dais | Workflows | Permits, exemptions, appeals, notices |
| Case | Dossier | Evidence | Packet assembly, narrative building |

### Mode Configuration

```typescript
interface WorkModeConfig {
  mode: WorkMode;
  defaultTab: TabName;
  visiblePanels: PanelId[];      // Which panels to show
  quickActions: ActionId[];       // Actions pinned in ribbon
  pilotSuggestions: string[];    // TerraPilot contextual prompts
  keyboardShortcut: string;      // e.g., "Ctrl+Shift+V" for Valuation
}

const WORK_MODES: Record<WorkMode, WorkModeConfig> = {
  overview: {
    mode: "overview",
    defaultTab: "summary",
    visiblePanels: ["identity", "value-history", "status-timeline"],
    quickActions: ["open-dossier", "ask-pilot"],
    pilotSuggestions: [
      "Summarize recent activity on this parcel",
      "Show me the value history"
    ],
    keyboardShortcut: "Ctrl+Shift+O"
  },
  valuation: {
    mode: "valuation",
    defaultTab: "forge",
    visiblePanels: ["comp-grid", "cost-breakdown", "market-trends", "model-status"],
    quickActions: ["run-model", "find-comps", "export-report"],
    pilotSuggestions: [
      "Run residential model for this parcel",
      "Find 5 recent comps within 1 mile",
      "Explain value change from last year"
    ],
    keyboardShortcut: "Ctrl+Shift+V"
  },
  mapping: {
    mode: "mapping",
    defaultTab: "atlas",
    visiblePanels: ["map-view", "layers", "identify", "measurement"],
    quickActions: ["toggle-layers", "export-map", "print-map"],
    pilotSuggestions: [
      "Show neighborhood boundaries",
      "Highlight flood zones",
      "Measure lot dimensions"
    ],
    keyboardShortcut: "Ctrl+Shift+M"
  },
  admin: {
    mode: "admin",
    defaultTab: "dais",
    visiblePanels: ["permit-timeline", "exemption-status", "appeal-queue", "cert-checklist"],
    quickActions: ["create-notice", "assign-task", "check-cert"],
    pilotSuggestions: [
      "Assemble BOE packet for pending appeal",
      "Generate senior exemption renewal notice",
      "Show certification readiness checklist"
    ],
    keyboardShortcut: "Ctrl+Shift+A"
  },
  case: {
    mode: "case",
    defaultTab: "dossier",
    visiblePanels: ["case-timeline", "documents", "evidence", "narratives"],
    quickActions: ["add-document", "create-narrative", "assemble-packet"],
    pilotSuggestions: [
      "Summarize case evidence",
      "Draft appeal response",
      "Generate hearing packet"
    ],
    keyboardShortcut: "Ctrl+Shift+C"
  }
};
```

### Mode Persistence Rules

1. **User Default:** Each user has a preferred default mode (stored in PilotProfile)
2. **Role Default:** Fallback to role-based default if user hasn't set preference
3. **Module Override:** Modules can request a mode (e.g., opening from Terra-Exempt → Admin mode)
4. **Session Memory:** Mode persists across parcels within a session
5. **Deep Link Override:** URL can force a mode via `?mode=valuation`

---

## 8. Tab Ownership Matrix

### OS Core (Summary Tab) — Owned by TerraFusion OS

The Summary tab provides the universal parcel view that every role needs.

| Capability | Owner | Read | Write |
|------------|-------|------|-------|
| Parcel Identity (PIN, Account) | OS Core | All | System |
| Situs Address | OS Core | All | System |
| Legal Description | OS Core | All | System |
| Ownership Records | OS Core | All | System |
| Value History (read-only summary) | OS Core | All | — |
| Tax History (read-only summary) | OS Core | All | — |
| Global Flags | OS Core | All | Admin |
| Activity Feed (Trace) | OS Core | All | System |
| Status Badges | OS Core | All | Suites emit |

### TerraForge (Forge Tab) — Owned by Valuation Suite

| Capability | Owner | Read | Write |
|------------|-------|------|-------|
| Valuation Models | TerraForge | Appraiser | Appraiser |
| Cost Approach | TerraForge | Appraiser | Appraiser |
| Income Approach | TerraForge | Appraiser | Appraiser |
| Sales Comparison | TerraForge | Appraiser | Appraiser |
| Comparable Grid | TerraForge | Appraiser | Appraiser |
| Model Calibration | TerraForge | Appraiser | Appraiser |
| Pricing Parameters | TerraForge | Appraiser | Appraiser |
| Valuation Notes | TerraForge | All | Appraiser |
| CAMA Characteristics | TerraForge | All | Appraiser |

### TerraAtlas (Atlas Tab) — Owned by GIS Suite

| Capability | Owner | Read | Write |
|------------|-------|------|-------|
| Map View | TerraAtlas | All | — |
| Layer Management | TerraAtlas | All | GIS Tech |
| Spatial Queries | TerraAtlas | All | — |
| Parcel Boundaries | TerraAtlas | All | GIS Tech |
| Measurements | TerraAtlas | All | — |
| Map Annotations | TerraAtlas | All | GIS Tech |
| Print/Export Maps | TerraAtlas | All | — |
| Neighborhood Definitions | TerraAtlas | All | GIS Tech/Admin |

### TerraDais (Dais Tab) — Owned by Assessor Admin Suite

| Capability | Owner | Read | Write |
|------------|-------|------|-------|
| Permit Timeline | TerraDais | All | Admin |
| Permit Inspections | TerraDais | All | Admin |
| Exemption Eligibility | TerraDais | All | Admin |
| Exemption Renewals | TerraDais | All | Admin |
| Appeal Intake/Status | TerraDais | All | Admin |
| Appeal Deadlines | TerraDais | All | System |
| BOE Packet Assembly | TerraDais | Admin | Admin |
| Notice Generation | TerraDais | Admin | Admin |
| Mail/Print Queue | TerraDais | Admin | Admin |
| Roll Certification Checklist | TerraDais | Admin | Admin |
| Task Assignments | TerraDais | Assigned | Admin |
| Queue Routing | TerraDais | Admin | Admin |
| Workflow Status | TerraDais | All | System |
| Activity Trace (Dais actions) | TerraDais → TerraTrace | All | System |

### TerraDossier (Dossier Tab) — Owned by Records Suite

| Capability | Owner | Read | Write |
|------------|-------|------|-------|
| Case Files | TerraDossier | All | Case Owner |
| Documents (upload/link) | TerraDossier | All | Authorized |
| Evidence Items | TerraDossier | All | Case Owner |
| Narratives | TerraDossier | All | Author |
| Packet Assembly | TerraDossier | All | Authorized |
| Audit Trail View | TerraDossier | Auditor | System |
| Retention Management | TerraDossier | Admin | Admin |

### TerraPilot (Pilot Tab) — Owned by OS Core

| Capability | Owner | Read | Write |
|------------|-------|------|-------|
| Tool Execution | TerraPilot | Per-tool | Per-tool |
| Chat Interface | TerraPilot | User | User |
| Suggestions | TerraPilot | User | System |
| Mode Switching | TerraPilot | User | User |
| Action History | TerraPilot → Trace | User | System |

---

## 9. Write-Lane Matrix

**Critical Governance Rule:** Each data domain has exactly ONE owner that can write to it.

| Data Domain | Write Owner | Other Suites Can |
|-------------|-------------|------------------|
| Parcel Identity (PIN, situs, legal) | OS Core (sync from CAMA) | Read only |
| Ownership Records | OS Core (sync from CAMA) | Read only |
| Valuation Artifacts (model outputs, notes) | TerraForge | Read only |
| Comparable Sets | TerraForge | Read only |
| CAMA Characteristics | TerraForge | Read only |
| GIS Artifacts (boundaries, annotations) | TerraAtlas | Read only |
| Layer Configuration | TerraAtlas | Read only |
| Workflow States (permit, exempt, appeal) | TerraDais | Read only |
| Notices | TerraDais | Read only |
| Certification Checklists | TerraDais | Read only |
| Task Assignments | TerraDais | Read only |
| Documents | TerraDossier | Read only |
| Narratives | TerraDossier | Read only |
| Packets | TerraDossier | Read only |
| Trace Events | TerraTrace (OS) | Emit only |
| User Preferences | OS Core | Read own |
| PilotProfile | TerraPilot | Read own |

### Cross-Suite Write Protocol

When a suite needs to trigger an action in another suite's domain:

```typescript
// Example: TerraDais needs to add a document to Dossier
// TerraDais CANNOT write directly to Dossier tables

// CORRECT: Use the Dossier service API
await DossierService.createDocument({
  parcelId: context.parcelId,
  title: "Exemption Application",
  content: applicationData,
  createdBy: context.userId,
  sourceModule: "terra-exempt"  // Attribution to originating module
});

// WRONG: Direct database insert
// await db.dossier_documents.insert(...) // ❌ FORBIDDEN
```

---

## 10. Tab Extension API

Suites register their tabs via a standardized plugin interface.

### Tab Registration Contract

```typescript
interface WorkbenchTabPlugin {
  // Identity
  id: string;                      // "forge", "atlas", "dais", etc.
  suite: SuiteName;                // Which suite owns this tab
  displayName: string;             // "TerraForge"
  icon: IconName;                  // "Hammer" (Lucide icon)
  
  // Routing
  path: string;                    // "/forge"
  component: React.ComponentType<TabProps>;
  
  // Permissions
  requiredPermissions: Permission[];
  requiredLicense?: string;        // Optional license requirement
  
  // Context contribution
  getContextBadges(parcelId: string): Promise<StatusBadge[]>;
  getQuickActions(parcelId: string, userRole: Role): Promise<QuickAction[]>;
  getWorkModePanels(mode: WorkMode): PanelConfig[];
  
  // Lifecycle
  onTabActivate?(context: TabContext): void;
  onTabDeactivate?(context: TabContext): void;
}

// Example: TerraForge tab registration
const forgeTabPlugin: WorkbenchTabPlugin = {
  id: "forge",
  suite: "terraforge",
  displayName: "TerraForge",
  icon: "Hammer",
  path: "/forge",
  component: ForgeTabContainer,
  requiredPermissions: ["forge:read"],
  
  async getContextBadges(parcelId) {
    const status = await ValuationService.getStatus(parcelId);
    return status.needsReview 
      ? [{ type: "warning", label: "Review Required", icon: "AlertTriangle" }]
      : [];
  },
  
  async getQuickActions(parcelId, userRole) {
    if (userRole !== "appraiser") return [];
    return [
      { id: "run-model", label: "Run Model", icon: "Play", tool: "forge:run_model" },
      { id: "find-comps", label: "Find Comps", icon: "Search", tool: "forge:search_comps" }
    ];
  },
  
  getWorkModePanels(mode) {
    if (mode !== "valuation") return [];
    return [
      { id: "comp-grid", component: CompGrid, position: "main" },
      { id: "cost-breakdown", component: CostBreakdown, position: "sidebar" }
    ];
  }
};
```

### Tab Registry

```typescript
// os-platform/core/services/WorkbenchTabRegistry.ts
class WorkbenchTabRegistry {
  private tabs: Map<string, WorkbenchTabPlugin> = new Map();
  
  register(plugin: WorkbenchTabPlugin): void {
    // Validate no duplicate IDs
    if (this.tabs.has(plugin.id)) {
      throw new Error(`Tab "${plugin.id}" already registered`);
    }
    
    // Validate ID not in reserved list
    if (RESERVED_TAB_IDS.includes(plugin.id)) {
      throw new Error(`Tab ID "${plugin.id}" is reserved for future office`);
    }
    
    this.tabs.set(plugin.id, plugin);
  }
  
  getVisibleTabs(user: User): WorkbenchTabPlugin[] {
    return Array.from(this.tabs.values())
      .filter(tab => this.userCanAccessTab(user, tab))
      .sort((a, b) => TAB_ORDER.indexOf(a.id) - TAB_ORDER.indexOf(b.id));
  }
  
  private userCanAccessTab(user: User, tab: WorkbenchTabPlugin): boolean {
    // Check permissions
    const hasPermissions = tab.requiredPermissions.every(p => 
      user.permissions.includes(p)
    );
    
    // Check license if required
    const hasLicense = !tab.requiredLicense || 
      user.county.licenses.includes(tab.requiredLicense);
    
    return hasPermissions && hasLicense;
  }
}

const RESERVED_TAB_IDS = ["clerk", "treasury", "auditor", "recorder"];
const TAB_ORDER = ["summary", "forge", "atlas", "dais", "dossier", "pilot"];
```

---

## 11. TerraTrace Integration

All suite actions emit events to the unified TerraTrace spine.

### Trace Event Model

```typescript
interface TraceEvent {
  // Identity
  id: string;                      // UUID v7 (time-sortable)
  timestamp: DateTime;             // ISO 8601, UTC
  
  // Sovereignty
  countyId: string;                // Tenant isolation
  
  // Links
  parcelId: string | null;
  dossierId: string | null;
  taskId: string | null;
  
  // Actor
  actor: {
    userId: string;
    userName: string;
    role: UserRole;
    pilotSessionId?: string;       // If action via TerraPilot
  };
  
  // Event
  event: {
    suite: SuiteName | "os";       // Which suite emitted
    module: string;                // e.g., "terra-exempt"
    action: string;                // e.g., "exemption_approved"
    category: "valuation" | "workflow" | "compliance" | "system" | "navigation";
  };
  
  // Payload
  data: {
    inputs: Record<string, any>;   // What went in (sanitized)
    outputs: Record<string, any>;  // What came out
    evidenceLinks: string[];       // Dossier document IDs
    metadata: Record<string, any>;
  };
  
  // Compliance
  compliance: {
    classification: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
    retention: RetentionPolicy;
    piiPresent: boolean;
    redactable: boolean;
  };
}

type RetentionPolicy = 
  | "session"           // Delete after session
  | "30_days"          // Temporary
  | "1_year"           // Short-term
  | "7_years"          // Standard audit
  | "permanent";       // Never delete
```

### Trace Immutability Rules

1. **Append-Only:** Trace events cannot be updated or deleted (except redaction)
2. **Separate Events:** Use `action_started` + `action_completed/action_failed` pattern
3. **Redaction:** PII can be redacted, but event shell remains with `[REDACTED]` marker
4. **Chain Integrity:** Events include hash of previous event for tamper detection

### Workbench Activity Feed

The Property Workbench Summary tab shows a unified activity feed from TerraTrace:

```
┌─ ACTIVITY (Recent) ────────────────────────────────────┐
│ ⏰ Today, 2:15 PM                                      │
│ 👤 Jane Appraiser (via TerraPilot)                    │
│ ✅ Senior Exemption Approved                          │
│    Application: EX-2025-123 | Amount: $60,000         │
│    📎 Evidence: [Income Verification] [Age Proof]     │
│                                                        │
│ ⏰ Yesterday, 4:30 PM                                  │
│ 👤 Bob GIS (TerraAtlas)                               │
│ 🗺️ Neighborhood Boundary Updated                      │
│    Added 3 parcels to Comp Area 12                    │
│                                                        │
│ ⏰ 3 days ago                                          │
│ 👤 System (TerraForge)                                │
│ 💰 Valuation Model Recalibrated                       │
│    Residential Model 2025 | RMSE: 0.087              │
│                                                        │
│ [View All Activity →]                                  │
└────────────────────────────────────────────────────────┘
```

---

## 12. Migration Plan

### Phase 0: Workbench Shell (Current)

- [ ] Deploy Property Workbench route `/property/:parcelId`
- [ ] Implement Summary tab (OS Core)
- [ ] Implement Context Ribbon
- [ ] Implement Tab Registry
- [ ] Old parcel screens remain functional

### Phase 1: Suite Tab Migration

- [ ] TerraForge registers Forge tab
- [ ] TerraAtlas registers Atlas tab
- [ ] TerraDais registers Dais tab
- [ ] TerraDossier registers Dossier tab
- [ ] TerraPilot registers Pilot tab
- [ ] Old parcel screens get deprecation warnings

### Phase 2: Route Redirects

- [ ] `/forge/parcel/:id` → `/property/:id/forge`
- [ ] `/gis/parcel/:id` → `/property/:id/atlas`
- [ ] `/admin/parcel/:id` → `/property/:id/dais`
- [ ] `/dossier/parcel/:id` → `/property/:id/dossier`
- [ ] Preserve query params during redirect
- [ ] Log redirect usage for deprecation tracking

### Phase 3: Cleanup

- [ ] Remove old parcel screen routes (after 90-day deprecation)
- [ ] Archive old components
- [ ] Update all deep links in notifications/emails
- [ ] Update bookmarks migration tool

### Do Not Break List

These existing integrations must continue working:

- [ ] Email links to parcels
- [ ] Saved report deep links
- [ ] Harris PACS sync parcel references
- [ ] API parcel endpoints (separate from UI routes)
- [ ] Print/PDF generation links

---

## 13. Implementation Checklist

### Component Structure

```
os-platform/core/
├── components/
│   └── property-workbench/
│       ├── PropertyWorkbench.tsx       # Main container
│       ├── ContextRibbon.tsx           # Persistent header
│       ├── TabContainer.tsx            # Tab routing shell
│       ├── SummaryTab.tsx              # OS-owned summary tab
│       ├── WorkModeSelector.tsx        # Mode switcher
│       └── ActivityFeed.tsx            # Trace-powered feed
├── services/
│   ├── WorkbenchTabRegistry.ts         # Tab plugin registry
│   ├── TraceService.ts                 # Unified audit spine
│   └── WorkModeService.ts              # Mode state management
└── models/
    ├── Parcel.ts                       # Core parcel model
    ├── TraceEvent.ts                   # Audit event model
    └── WorkMode.ts                     # Mode definitions
```

### Required Permissions

```typescript
const WORKBENCH_PERMISSIONS = {
  view: "workbench:view",           // Access Property Workbench
  edit: "workbench:edit",           // Modify parcel data (via suites)
  admin: "workbench:admin",         // Configure workbench settings
  impersonate: "workbench:impersonate" // View as another role (support)
};
```

---

## 14. Validation & Testing

### Contract Tests

1. **Tab Registration:** Every suite tab must pass plugin validation
2. **Write Lane Enforcement:** No cross-suite direct writes
3. **Trace Emission:** Every write action must emit trace event
4. **Permission Gating:** Tabs/actions respect permission matrix
5. **URL Consistency:** All routes follow canonical patterns

### Integration Tests

1. **Tab Loading:** All registered tabs load without error
2. **Context Ribbon:** Badges update when data changes
3. **Work Modes:** Mode switch updates visible panels
4. **Activity Feed:** Trace events appear in feed
5. **Deep Links:** Old routes redirect correctly

### Accessibility Tests

1. **Keyboard Navigation:** All tabs accessible via keyboard
2. **Screen Reader:** Proper ARIA labels on all controls
3. **Focus Management:** Focus moves correctly on tab switch
4. **Color Contrast:** All badges meet WCAG AA

---

## 15. Appendix: Future Office Integration

When TerraClerk, TerraTreasury, or TerraAudit suites are implemented:

1. Register new tab via `WorkbenchTabRegistry.register()`
2. Add to `TAB_ORDER` array in appropriate position
3. Implement `WorkbenchTabPlugin` interface
4. Define role-based visibility rules
5. Add to permission matrix
6. Update this specification

**These suites will NOT:**
- Create separate parcel screens
- Duplicate Context Ribbon logic
- Implement their own tab routing
- Bypass TerraTrace for audit events

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-15 | Architecture | Initial specification |
| 2.0 | 2026-01-15 | Architecture | Added TerraPilot, Work Modes, Trace |
| 3.0 | 2026-01-28 | Architecture | Added Write-Lane Matrix, Tab API, Migration Plan, Immutability Rules |

---

**TerraFusion OS — Genesis Era**  
*Property Workbench: The Bridge Between Suites*
