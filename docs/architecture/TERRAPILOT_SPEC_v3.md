# TerraPilot Canonical Specification v3.0

**Document ID:** TF-051  
**Status:** Canonical (Locked)  
**Version:** 3.0  
**Era:** Genesis Era (1.0)  
**Effective:** 2026-01-28  
**Supersedes:** TerraAssistant, TerraAgent (consolidated)  
**Constellation:** Herald 📢 + Arc 🌈

---

## 1. Executive Summary

**TerraPilot** is the personal copilot system for TerraFusion OS—a Tier 0 OS Feature that provides every user with an AI-powered assistant that travels with them across all suites and screens.

TerraPilot consolidates the previous TerraAssistant (UI) and TerraAgent (runtime) into a single, coherent system with **two operational modes**:

- **Pilot Mode:** Operator — do, route, act, execute
- **Muse Mode:** Creator — draft, explain, synthesize

**Mission:** "Your personal copilot across TerraFusion."

---

## 2. Canonical Names

| Component | Name | Type | Status |
|-----------|------|------|--------|
| OS Feature | TerraPilot | OS Feature (Tier 0) | Active |
| User Configuration | PilotProfile | Data Model | Active |
| Execution Mode | Pilot Mode | Operating Mode | Active |
| Creative Mode | Muse Mode | Operating Mode | Active |
| UI Surface | TerraAssistant | Component (legacy name) | Merged |
| Runtime Engine | TerraAgent | Component (legacy name) | Merged |

### Legacy Consolidation

| Old System | New Location | Status |
|------------|--------------|--------|
| TerraAssistant | TerraPilot UI components | Archived |
| TerraAgent | TerraPilot runtime engine | Archived |
| `applications/terra-assistant-production/` | Reference only | Archived |
| `applications/terra-agent-production/` | Reference only | Archived |

---

## 3. Architecture Overview

```
TerraPilot (OS-Level Personal Copilot)
├── PilotProfile (User Configuration)
│   ├── Avatar & Identity
│   ├── Role & Specialization
│   ├── Mode Preferences
│   └── Playbooks & Memory
│
├── Pilot Mode (Operator)
│   ├── Workflow Tools
│   ├── Data Tools
│   ├── Navigation Tools
│   ├── Execution Tools
│   └── Monitoring Tools
│
├── Muse Mode (Creator)
│   ├── Drafting Tools
│   ├── Explanation Tools
│   ├── Summarization Tools
│   ├── Synthesis Tools
│   └── Template Tools
│
├── Context Engine
│   ├── Location Awareness
│   ├── Focus Tracking
│   ├── State Management
│   └── Permission Resolution
│
└── Safety Layer
    ├── Permission Checks
    ├── Mode Validation
    ├── Human-in-the-Loop Gates
    └── Trace Logging
```

---

## 4. Mode Definitions

### Pilot Mode (Operator)

**Purpose:** Guidance, execution, checklists, workflows, routing

**Tagline:** "Do the work."

| Aspect | Description |
|--------|-------------|
| Icon | 🎯 |
| Default | Yes (first-time users) |
| Keyboard | `Ctrl+Shift+P` |
| Voice Command | "Pilot mode" |

**Tool Categories:**

| Category | Purpose | Example Tools |
|----------|---------|---------------|
| Workflow | Task routing, assignments, queues | assign_task, create_workflow |
| Data | Fetch, search, filter | fetch_comps, search_parcels |
| Navigation | Route to screens, open panels | route_to_parcel, open_panel |
| Execution | Run models, generate notices, create records | run_model, generate_notice |
| Monitoring | Check status, verify completion, alert | check_status, verify_cert |

**Pilot Mode Tools (Canonical List):**

```typescript
const PILOT_TOOLS: PilotModeTool[] = [
  // Navigation
  { id: "route_to_parcel", name: "Open Parcel", category: "navigation" },
  { id: "open_panel", name: "Open Panel", category: "navigation" },
  { id: "switch_work_mode", name: "Switch Work Mode", category: "navigation" },
  
  // Workflow
  { id: "assign_task", name: "Assign Task", category: "workflow" },
  { id: "create_workflow", name: "Create Workflow", category: "workflow" },
  { id: "escalate_task", name: "Escalate Task", category: "workflow" },
  
  // Data
  { id: "fetch_comps", name: "Find Comparables", category: "data" },
  { id: "search_parcels", name: "Search Parcels", category: "data" },
  { id: "get_permit_history", name: "Get Permit History", category: "data" },
  { id: "get_exemption_status", name: "Get Exemption Status", category: "data" },
  
  // Execution
  { id: "run_model", name: "Run Valuation Model", category: "execution" },
  { id: "generate_notice", name: "Generate Notice", category: "execution" },
  { id: "create_exemption", name: "Create Exemption", category: "execution" },
  { id: "assemble_packet", name: "Assemble BOE Packet", category: "execution" },
  
  // Monitoring
  { id: "check_cert_status", name: "Check Certification", category: "monitoring" },
  { id: "verify_roll_ready", name: "Verify Roll Ready", category: "monitoring" },
  { id: "check_queue", name: "Check My Queue", category: "monitoring" }
];
```

---

### Muse Mode (Creator)

**Purpose:** Drafting, synthesis, narrative, explanation, reasoning

**Tagline:** "Draft and explain."

| Aspect | Description |
|--------|-------------|
| Icon | ✨ |
| Default | No |
| Keyboard | `Ctrl+Shift+M` |
| Voice Command | "Muse mode" |

**Tool Categories:**

| Category | Purpose | Example Tools |
|----------|---------|---------------|
| Draft | Write notices, letters, memos | draft_notice, draft_letter |
| Explain | Explain values, decisions, changes | explain_value_change |
| Summarize | Condense dossiers, history, data | summarize_dossier |
| Synthesize | Combine sources into narrative | synthesize_evidence |
| Template | Generate reusable templates | create_template |

**Muse Mode Tools (Canonical List):**

```typescript
const MUSE_TOOLS: MuseModeTool[] = [
  // Drafting
  { id: "draft_notice", name: "Draft Notice", category: "draft", outputType: "document" },
  { id: "draft_letter", name: "Draft Letter", category: "draft", outputType: "document" },
  { id: "draft_appeal_response", name: "Draft Appeal Response", category: "draft", outputType: "document" },
  { id: "draft_exemption_letter", name: "Draft Exemption Letter", category: "draft", outputType: "document" },
  { id: "draft_commissioner_memo", name: "Draft Commissioner Memo", category: "draft", outputType: "document" },
  
  // Explanation
  { id: "explain_value_change", name: "Explain Value Change", category: "explain", outputType: "narrative" },
  { id: "explain_model_results", name: "Explain Model Results", category: "explain", outputType: "narrative" },
  { id: "explain_exemption_decision", name: "Explain Exemption Decision", category: "explain", outputType: "narrative" },
  { id: "explain_appeal_outcome", name: "Explain Appeal Outcome", category: "explain", outputType: "narrative" },
  
  // Summarization
  { id: "summarize_dossier", name: "Summarize Case File", category: "summarize", outputType: "text" },
  { id: "summarize_parcel_history", name: "Summarize Parcel History", category: "summarize", outputType: "text" },
  { id: "summarize_permit_activity", name: "Summarize Permit Activity", category: "summarize", outputType: "text" },
  
  // Synthesis
  { id: "synthesize_evidence", name: "Synthesize Evidence", category: "synthesize", outputType: "narrative" },
  { id: "create_hearing_narrative", name: "Create Hearing Narrative", category: "synthesize", outputType: "document" },
  
  // Templates
  { id: "create_template", name: "Create Template", category: "template", outputType: "template" },
  { id: "customize_template", name: "Customize Template", category: "template", outputType: "template" }
];
```

---

## 5. PilotProfile Data Model

```typescript
interface PilotProfile {
  // === IDENTITY ===
  id: string;                      // UUID
  userId: string;                  // Link to GovernmentUser
  countyId: string;                // Sovereign isolation
  
  // === AVATAR ===
  avatar: {
    name: string;                  // Custom name or "My Pilot"
    displayName: string;           // How Pilot addresses user ("Jane" vs "Ms. Smith")
    icon: AvatarIcon;              // Icon selection
    color: string;                 // Theme color (default: #00FFFF Terra-Cyan)
    personality: "formal" | "conversational" | "technical";
  };
  
  // === ROLE & SPECIALIZATION ===
  role: {
    primary: UserRole;             // "appraiser" | "gis_tech" | "admin" | ...
    specialization: string[];      // ["residential", "appeals", "exemptions"]
    workModes: WorkMode[];         // Preferred work modes
  };
  
  // === MODE PREFERENCES ===
  modePreferences: {
    defaultMode: "pilot" | "muse"; // Which mode to start in
    
    pilotSettings: {
      suggestionLevel: "minimal" | "balanced" | "proactive";
      autoExecute: string[];       // Tool IDs that run without confirmation
      pinnedActions: PinnedAction[];
      confirmHighRisk: boolean;    // Always confirm high-risk actions
    };
    
    museSettings: {
      writingStyle: "formal" | "conversational" | "technical";
      draftLength: "concise" | "standard" | "detailed";
      includeEvidence: boolean;    // Auto-link to Dossier
      autoSaveDrafts: boolean;     // Save drafts to Dossier
      preferredTemplates: string[]; // Template IDs
    };
  };
  
  // === PLAYBOOKS (Custom Macros) ===
  playbooks: Playbook[];
  
  // === LEARNING (Opt-In) ===
  memory?: {
    enabled: boolean;
    frequentTasks: string[];       // Most-used tool IDs
    savedPrompts: string[];        // Custom prompts
    preferredTools: string[];      // Tools pinned by user
    draftTemplates: DraftTemplate[];
  };
  
  // === PERMISSIONS ===
  permissions: {
    pilotTools: string[];          // Tool IDs user can execute
    museTools: string[];           // Drafting tools user can access
    dataAccess: AccessLevel;
    maxRiskLevel: ToolRiskLevel;   // Highest risk level allowed
  };
  
  // === COMPLIANCE ===
  compliance: {
    auditAllActions: boolean;      // Log every action
    requireReasonCodes: boolean;   // Require reason for high-risk actions
    supervisorApprovalRequired: string[]; // Tool IDs needing supervisor
  };
  
  // === METADATA ===
  createdAt: DateTime;
  lastActiveAt: DateTime;
  totalInteractions: number;
  modeUsage: {
    pilotMinutes: number;
    museMinutes: number;
  };
}

interface Playbook {
  id: string;
  name: string;
  description: string;
  mode: "pilot" | "muse" | "both";
  steps: PlaybookStep[];
  useCount: number;
  lastUsed: DateTime;
  shared: boolean;                 // Shared with team?
  sharedWithRoles?: UserRole[];
}

interface PlaybookStep {
  order: number;
  toolId: string;
  params: Record<string, any>;
  waitForResult: boolean;
  onSuccess?: string;              // Next step ID or "complete"
  onFailure?: string;              // Step ID or "abort" or "continue"
}
```

---

## 6. Context Engine

The Context Engine maintains awareness of where the user is and what they're working on.

### Context Model

```typescript
interface PilotContext {
  // === WHERE AM I? ===
  location: {
    suite: SuiteName | null;       // "forge", "atlas", "dais", etc.
    module: string | null;         // "terra-exempt", "terra-appeal"
    screen: string | null;         // "property-workbench", "dashboard"
    workMode: WorkMode | null;     // Current work mode
    tab: string | null;            // Current tab in workbench
  };
  
  // === WHAT AM I LOOKING AT? ===
  focus: {
    parcelId: string | null;
    dossierId: string | null;
    taskId: string | null;
    queueId: string | null;
    appealId: string | null;
    exemptionId: string | null;
    noticeId: string | null;
  };
  
  // === WHAT'S HAPPENING? ===
  state: {
    recentActions: TraceEvent[];   // Last 10 actions by this user
    activeStatuses: ParcelStatus[]; // From Context Ribbon
    pendingTasks: Task[];          // Assigned to user
    alerts: Alert[];               // System/compliance alerts
    unsavedChanges: boolean;       // Warn before navigation
  };
  
  // === WHAT CAN I DO? ===
  permissions: {
    availableTools: ToolId[];      // Tools user can invoke
    availableSuites: SuiteName[];  // Suites user can access
    dataAccess: AccessLevel;
    currentMode: "pilot" | "muse";
  };
  
  // === SESSION ===
  session: {
    startedAt: DateTime;
    pilotSessionId: string;        // Unique session ID for trace
    lastActivity: DateTime;
    idleMinutes: number;
  };
}
```

### Context Bridge Protocol

Every screen/component that wants TerraPilot integration must emit context updates:

```typescript
// Context emission example
import { usePilotContext } from '@os/core/pilot';

function ExemptionWorkflow({ exemptionId, parcelId }) {
  const { updateContext } = usePilotContext();
  
  useEffect(() => {
    updateContext({
      location: {
        suite: "dais",
        module: "terra-exempt",
        screen: "exemption-workflow"
      },
      focus: {
        parcelId,
        exemptionId
      }
    });
  }, [parcelId, exemptionId]);
  
  // ... component logic
}
```

---

## 7. Mode Switching

### Auto-Switch Triggers

```typescript
interface ModeSwitchTrigger {
  trigger: TriggerCondition;
  suggestMode: "pilot" | "muse";
  confidence: number;              // 0-1 (auto-switch if >0.85)
  message: string;                 // UI prompt message
}

const MODE_SWITCH_TRIGGERS: ModeSwitchTrigger[] = [
  {
    trigger: {
      type: "message_pattern",
      pattern: /draft|write|create letter|compose|explain|summarize/i,
      currentMode: "pilot"
    },
    suggestMode: "muse",
    confidence: 0.9,
    message: "Looks like you want to create something. Switch to Muse Mode?"
  },
  
  {
    trigger: {
      type: "message_pattern",
      pattern: /run|execute|assign|check|find|search|open|go to/i,
      currentMode: "muse"
    },
    suggestMode: "pilot",
    confidence: 0.85,
    message: "Ready to take action? Switch to Pilot Mode?"
  },
  
  {
    trigger: {
      type: "context_change",
      condition: (ctx) => ctx.location.module === "terra-notice" && ctx.focus.parcelId,
      currentMode: "pilot"
    },
    suggestMode: "muse",
    confidence: 0.7,
    message: "You're in Notices. Would you like to draft one in Muse Mode?"
  },
  
  {
    trigger: {
      type: "tool_invocation",
      toolCategory: "draft",
      currentMode: "pilot"
    },
    suggestMode: "muse",
    confidence: 0.95,
    message: "Drafting tools work best in Muse Mode. Switch?"
  }
];
```

### Switch Behavior

```typescript
async function switchMode(
  newMode: "pilot" | "muse",
  context: PilotContext,
  profile: PilotProfile
): Promise<void> {
  
  // 1. Preserve context (don't lose focus)
  const preservedContext = { ...context };
  
  // 2. Check for unsaved work
  if (context.state.unsavedChanges) {
    const confirmed = await confirmDialog(
      "You have unsaved changes. Switch mode anyway?"
    );
    if (!confirmed) return;
  }
  
  // 3. Load mode-specific tools
  const tools = newMode === "pilot" 
    ? filterTools(PILOT_TOOLS, profile.permissions)
    : filterTools(MUSE_TOOLS, profile.permissions);
  
  // 4. Update UI
  setActiveMode(newMode);
  setAvailableTools(tools);
  
  // 5. Generate mode-specific suggestions
  const suggestions = generateSuggestions(newMode, preservedContext);
  setSuggestions(suggestions);
  
  // 6. Log to Trace
  await TraceService.emit({
    event: {
      suite: "os",
      module: "terra-pilot",
      action: "mode_switched",
      category: "system"
    },
    data: {
      inputs: { fromMode: context.permissions.currentMode, toMode: newMode },
      outputs: { toolCount: tools.length, suggestionCount: suggestions.length }
    },
    actor: { pilotSessionId: context.session.pilotSessionId }
  });
}
```

---

## 8. Safety Layer

### Tool Risk Levels

```typescript
type ToolRiskLevel = 
  | "read"          // Read-only, no side effects
  | "write-low"     // Creates drafts, internal records
  | "write-medium"  // Modifies data, reversible
  | "write-high"    // Official actions, sends notifications
  | "irreversible"; // Certification, publishing, cannot undo

interface ToolSafetyConfig {
  riskLevel: ToolRiskLevel;
  requiresConfirmation: boolean;
  requiresReasonCode: boolean;
  requiresSupervisorApproval: boolean;
  allowAutoExecute: boolean;
  auditClassification: TraceClassification;
}

const TOOL_SAFETY: Record<string, ToolSafetyConfig> = {
  // Read-only tools
  "route_to_parcel": {
    riskLevel: "read",
    requiresConfirmation: false,
    requiresReasonCode: false,
    requiresSupervisorApproval: false,
    allowAutoExecute: true,
    auditClassification: "INTERNAL"
  },
  
  "fetch_comps": {
    riskLevel: "read",
    requiresConfirmation: false,
    requiresReasonCode: false,
    requiresSupervisorApproval: false,
    allowAutoExecute: true,
    auditClassification: "INTERNAL"
  },
  
  // Draft tools (Muse)
  "draft_notice": {
    riskLevel: "write-low",
    requiresConfirmation: false,
    requiresReasonCode: false,
    requiresSupervisorApproval: false,
    allowAutoExecute: false,
    auditClassification: "INTERNAL"
  },
  
  // Medium-risk tools
  "assign_task": {
    riskLevel: "write-medium",
    requiresConfirmation: true,
    requiresReasonCode: false,
    requiresSupervisorApproval: false,
    allowAutoExecute: false,
    auditClassification: "CONFIDENTIAL"
  },
  
  "generate_notice": {
    riskLevel: "write-high",
    requiresConfirmation: true,
    requiresReasonCode: true,
    requiresSupervisorApproval: false,
    allowAutoExecute: false,
    auditClassification: "CONFIDENTIAL"
  },
  
  // High-risk tools
  "approve_exemption": {
    riskLevel: "write-high",
    requiresConfirmation: true,
    requiresReasonCode: true,
    requiresSupervisorApproval: true,  // Configurable per county
    allowAutoExecute: false,
    auditClassification: "RESTRICTED"
  },
  
  // Irreversible tools
  "certify_roll": {
    riskLevel: "irreversible",
    requiresConfirmation: true,
    requiresReasonCode: true,
    requiresSupervisorApproval: true,
    allowAutoExecute: false,
    auditClassification: "RESTRICTED"
  }
};
```

### Human-in-the-Loop Gates

```typescript
interface HumanApprovalGate {
  toolId: string;
  gateType: "confirmation" | "reason_code" | "supervisor_approval";
  prompt: string;
  options?: string[];              // For reason codes
  timeout: number;                 // Seconds before auto-cancel
}

async function executeWithSafety(
  tool: BaseTool,
  params: any,
  context: PilotContext,
  profile: PilotProfile
): Promise<ToolResult> {
  
  const safety = TOOL_SAFETY[tool.id];
  
  // 1. Check mode validity
  if (tool.mode !== context.permissions.currentMode && tool.mode !== "both") {
    throw new ModeViolationError(
      `Tool "${tool.name}" requires ${tool.mode} mode`
    );
  }
  
  // 2. Check permissions
  const hasPermission = checkToolPermission(tool, profile);
  if (!hasPermission) {
    await logPermissionDenied(tool, context);
    throw new PermissionError("You don't have permission to use this tool");
  }
  
  // 3. Check risk level
  if (safety.riskLevel > profile.permissions.maxRiskLevel) {
    throw new RiskLevelError(
      `Tool "${tool.name}" exceeds your maximum risk level`
    );
  }
  
  // 4. Confirmation gate
  if (safety.requiresConfirmation && !profile.modePreferences.pilotSettings.autoExecute.includes(tool.id)) {
    const confirmed = await showConfirmation({
      title: `Execute ${tool.name}?`,
      message: buildConfirmationMessage(tool, params, context),
      confirmText: "Execute",
      cancelText: "Cancel"
    });
    
    if (!confirmed) {
      await logToolCancelled(tool, context, "user_cancelled");
      return { success: false, cancelled: true };
    }
  }
  
  // 5. Reason code gate
  let reasonCode: string | null = null;
  if (safety.requiresReasonCode) {
    reasonCode = await showReasonCodePicker({
      title: `Reason for ${tool.name}`,
      options: getReasonCodes(tool.id),
      allowCustom: true
    });
    
    if (!reasonCode) {
      await logToolCancelled(tool, context, "no_reason_provided");
      return { success: false, cancelled: true };
    }
  }
  
  // 6. Supervisor approval gate
  if (safety.requiresSupervisorApproval && profile.compliance.supervisorApprovalRequired.includes(tool.id)) {
    const approval = await requestSupervisorApproval({
      toolId: tool.id,
      params,
      context,
      requestedBy: profile.userId,
      reason: reasonCode
    });
    
    if (approval.status !== "approved") {
      await logToolRejected(tool, context, approval);
      return { success: false, rejected: true, rejectionReason: approval.reason };
    }
  }
  
  // 7. Log invocation (BEFORE execution)
  const invocationId = await TraceService.emit({
    parcelId: context.focus.parcelId,
    event: {
      suite: tool.suite,
      module: "terra-pilot",
      action: `tool_invoked:${tool.id}`,
      category: "system"
    },
    data: {
      inputs: { toolId: tool.id, params, reasonCode },
      outputs: {},
      metadata: {
        mode: context.permissions.currentMode,
        pilotSessionId: context.session.pilotSessionId
      }
    },
    compliance: {
      classification: safety.auditClassification,
      retention: "7_years",
      auditRequired: safety.riskLevel !== "read"
    }
  });
  
  // 8. Execute tool
  try {
    const startTime = Date.now();
    const result = await tool.execute(params, context);
    const duration = Date.now() - startTime;
    
    // 9. Log success
    await TraceService.emit({
      parcelId: context.focus.parcelId,
      event: {
        suite: tool.suite,
        module: "terra-pilot",
        action: `tool_completed:${tool.id}`,
        category: "system"
      },
      data: {
        inputs: { invocationId },
        outputs: { result: summarizeResult(result), durationMs: duration },
        evidenceLinks: result.dossierId ? [result.dossierId] : []
      },
      compliance: {
        classification: safety.auditClassification,
        retention: "7_years",
        auditRequired: safety.riskLevel !== "read"
      }
    });
    
    return result;
    
  } catch (error) {
    // 10. Log failure
    await TraceService.emit({
      parcelId: context.focus.parcelId,
      event: {
        suite: tool.suite,
        module: "terra-pilot",
        action: `tool_failed:${tool.id}`,
        category: "system"
      },
      data: {
        inputs: { invocationId },
        outputs: { error: error.message, stack: error.stack },
        metadata: { failed: true }
      },
      compliance: {
        classification: "RESTRICTED",
        retention: "7_years",
        auditRequired: true
      }
    });
    
    throw error;
  }
}
```

---

## 9. Integration Points

### Global Header

TerraPilot is always accessible from the OS header:

```tsx
<GlobalHeader>
  <Logo />
  <GlobalSearch />
  <Navigation />
  
  {/* TerraPilot Button */}
  <TerraPilotButton
    profile={user.pilotProfile}
    currentMode={pilotMode}
    onClick={() => togglePilotPanel()}
    badge={{
      count: unreadSuggestions,
      urgent: hasUrgentTasks
    }}
  />
  
  <UserMenu />
</GlobalHeader>
```

### Property Workbench Tab

Dedicated Pilot tab in the Property Workbench:

```tsx
<PropertyWorkbench parcelId={parcelId}>
  <Tab name="Summary" />
  <Tab name="Forge" />
  <Tab name="Atlas" />
  <Tab name="Dais" />
  <Tab name="Dossier" />
  
  <Tab name="Pilot" icon="🤖">
    <TerraPilotWorkbenchPanel
      context={buildParcelContext(parcelId)}
      focusMode="parcel"
    />
  </Tab>
</PropertyWorkbench>
```

### Suite Dockable Panel

TerraPilot can dock as a side panel in any suite:

```tsx
<SuiteLayout>
  <MainContent>
    {/* Suite-specific content */}
  </MainContent>
  
  <TerraPilotSidePanel
    docked={userPrefs.pilotDocked}
    position={userPrefs.pilotPosition}  // "left" | "right" | "bottom"
    mode={currentMode}
    context={buildContext()}
    tools={getModeTools(currentMode)}
    onModeSwitch={handleModeSwitch}
  />
</SuiteLayout>
```

---

## 10. UI Components

### Panel Structure

```
┌─ TerraPilot ──────────────────────────────────────────┐
│                                                        │
│  Mode: [● Pilot] [○ Muse]                    [⚙️] [×] │
│                                                        │
│ ═══════════════════════════════════════════════════   │
│                                                        │
│  🎯 QUICK ACTIONS                                     │
│  ┌──────────────────────────────────────────────────┐ │
│  │ • Open Parcel 1-23456                            │ │
│  │ • Check Appeal Status                            │ │
│  │ • Run Residential Model                          │ │
│  │ • Show My Queue (3 tasks)                        │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  💬 SUGGESTIONS                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │ "Appeal hearing in 10 days. Assemble BOE         │ │
│  │  packet now?"                                    │ │
│  │                                                  │ │
│  │  [Yes, Assemble] [Remind Me Later]               │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  📋 RECENT ACTIONS                                    │
│  • Assigned exemption review to Bob                   │
│  • Generated senior exemption notice                  │
│  • Ran model for Parcel 1-23456                       │
│                                                        │
│ ═══════════════════════════════════════════════════   │
│                                                        │
│  💬 Ask me anything...                         [Send] │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Muse Mode Panel (Draft Focus)

```
┌─ TerraPilot ──────────────────────────────────────────┐
│                                                        │
│  Mode: [○ Pilot] [● Muse]                    [⚙️] [×] │
│                                                        │
│ ═══════════════════════════════════════════════════   │
│                                                        │
│  ✍️ DRAFTING TOOLS                                    │
│  ┌──────────────────────────────────────────────────┐ │
│  │ • Draft Assessment Notice                        │ │
│  │ • Write Appeal Response                          │ │
│  │ • Create Commissioner Memo                       │ │
│  │ • Generate Value Explanation                     │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  📝 CURRENT DRAFT                                     │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Senior Exemption Approval Letter                 │ │
│  │ Parcel: 1-23456 | Applicant: John Smith          │ │
│  │                                                  │ │
│  │ Dear Mr. Smith,                                  │ │
│  │                                                  │ │
│  │ We are pleased to inform you that your          │ │
│  │ application for the Senior Citizen Property     │ │
│  │ Tax Exemption has been approved...              │ │
│  │                                                  │ │
│  │ [Edit Draft] [Save to Dossier] [Regenerate]     │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  📄 RECENT DRAFTS                                     │
│  • Value Change Explanation (today)                   │
│  • BOE Hearing Response (yesterday)                   │
│                                                        │
│ ═══════════════════════════════════════════════════   │
│                                                        │
│  💬 Describe what you want to write...         [Send] │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 11. Proactive Suggestions

TerraPilot proactively suggests actions based on context:

```typescript
interface ProactiveSuggestion {
  id: string;
  priority: "low" | "medium" | "high" | "urgent";
  trigger: SuggestionTrigger;
  message: string;
  action: {
    toolId: string;
    params: Record<string, any>;
    mode: "pilot" | "muse";
  };
  dismissable: boolean;
  cooldownHours: number;           // Don't suggest again for N hours
}

const SUGGESTION_RULES: SuggestionRule[] = [
  // Appeal deadline approaching
  {
    name: "appeal_deadline_approaching",
    trigger: {
      condition: (ctx) => 
        ctx.focus.parcelId &&
        ctx.state.activeStatuses.some(s => 
          s.type === "appeal" && 
          s.status === "pending" &&
          daysUntil(s.hearingDate) <= 10
        )
    },
    generateSuggestion: (ctx) => {
      const appeal = ctx.state.activeStatuses.find(s => s.type === "appeal");
      return {
        id: `appeal-packet-${appeal.id}`,
        priority: daysUntil(appeal.hearingDate) <= 3 ? "urgent" : "high",
        message: `Appeal hearing is in ${daysUntil(appeal.hearingDate)} days. Assemble BOE packet?`,
        action: {
          toolId: "assemble_packet",
          params: { appealId: appeal.id },
          mode: "pilot"
        },
        dismissable: true,
        cooldownHours: 24
      };
    }
  },
  
  // Exemption renewal due
  {
    name: "exemption_renewal_due",
    trigger: {
      condition: (ctx) =>
        ctx.focus.parcelId &&
        ctx.state.activeStatuses.some(s =>
          s.type === "exemption" &&
          s.status === "active" &&
          daysUntil(s.renewalDate) <= 30
        )
    },
    generateSuggestion: (ctx) => {
      const exemption = ctx.state.activeStatuses.find(s => s.type === "exemption");
      return {
        id: `exemption-renewal-${exemption.id}`,
        priority: "medium",
        message: `Senior exemption renewal due in ${daysUntil(exemption.renewalDate)} days. Send renewal notice?`,
        action: {
          toolId: "draft_notice",
          params: { type: "exemption_renewal", exemptionId: exemption.id },
          mode: "muse"
        },
        dismissable: true,
        cooldownHours: 168  // 1 week
      };
    }
  },
  
  // Value change needs explanation
  {
    name: "value_change_explanation",
    trigger: {
      condition: (ctx) =>
        ctx.location.suite === "forge" &&
        ctx.state.recentActions.some(a => 
          a.event.action === "value_adjusted" &&
          isToday(a.timestamp)
        )
    },
    generateSuggestion: (ctx) => ({
      id: `value-explanation-${ctx.focus.parcelId}`,
      priority: "medium",
      message: "Value was just adjusted. Generate explanation for the file?",
      action: {
        toolId: "explain_value_change",
        params: { 
          parcelId: ctx.focus.parcelId,
          fromYear: currentYear - 1,
          toYear: currentYear
        },
        mode: "muse"
      },
      dismissable: true,
      cooldownHours: 48
    })
  }
];
```

---

## 12. Playbooks (Custom Macros)

Users can create multi-step playbooks that combine tools:

```typescript
// Example Playbook: "Complete Exemption Review"
const exemptionReviewPlaybook: Playbook = {
  id: "exemption-review-complete",
  name: "Complete Exemption Review",
  description: "Review application, verify eligibility, draft approval/denial letter",
  mode: "both",
  steps: [
    {
      order: 1,
      toolId: "get_exemption_status",
      params: { exemptionId: "{{exemptionId}}" },
      waitForResult: true,
      onSuccess: "2",
      onFailure: "abort"
    },
    {
      order: 2,
      toolId: "summarize_dossier",    // Muse tool
      params: { 
        dossierId: "{{result.dossierId}}",
        focusOn: "exemption_evidence"
      },
      waitForResult: true,
      onSuccess: "3",
      onFailure: "continue"
    },
    {
      order: 3,
      toolId: "verify_exemption_eligibility",
      params: { exemptionId: "{{exemptionId}}" },
      waitForResult: true,
      onSuccess: "4a",  // Eligible → approval letter
      onFailure: "4b"   // Not eligible → denial letter
    },
    {
      order: 4,
      id: "4a",
      toolId: "draft_exemption_letter",  // Muse tool
      params: { type: "approval", exemptionId: "{{exemptionId}}" },
      waitForResult: true,
      onSuccess: "5",
      onFailure: "abort"
    },
    {
      order: 4,
      id: "4b",
      toolId: "draft_exemption_letter",  // Muse tool
      params: { type: "denial", exemptionId: "{{exemptionId}}" },
      waitForResult: true,
      onSuccess: "5",
      onFailure: "abort"
    },
    {
      order: 5,
      toolId: "assign_task",
      params: {
        title: "Review and send exemption letter",
        assignTo: "{{currentUser}}",
        linkedParcel: "{{parcelId}}"
      },
      waitForResult: false,
      onSuccess: "complete"
    }
  ],
  useCount: 0,
  lastUsed: null,
  shared: true,
  sharedWithRoles: ["admin"]
};
```

---

## 13. Implementation Checklist

### Component Structure

```
os-platform/core/
├── components/
│   └── terra-pilot/
│       ├── TerraPilotProvider.tsx      # Context provider
│       ├── TerraPilotPanel.tsx         # Main panel
│       ├── TerraPilotButton.tsx        # Header button
│       ├── ModeSelector.tsx            # Pilot/Muse toggle
│       ├── QuickActions.tsx            # Action buttons
│       ├── Suggestions.tsx             # Proactive suggestions
│       ├── ChatInterface.tsx           # Chat input/output
│       ├── RecentActions.tsx           # Action history
│       ├── ConfirmationDialog.tsx      # Safety gate
│       ├── ReasonCodePicker.tsx        # Reason code selector
│       └── DraftEditor.tsx             # Muse mode editor
├── services/
│   ├── TerraPilotService.ts           # Main service
│   ├── ToolExecutor.ts                # Tool execution logic
│   ├── ContextEngine.ts               # Context tracking
│   ├── SuggestionEngine.ts            # Proactive suggestions
│   ├── PlaybookEngine.ts              # Playbook execution
│   └── SafetyEngine.ts                # Permission/risk checks
├── models/
│   ├── PilotProfile.ts                # User profile model
│   ├── PilotContext.ts                # Context model
│   ├── PilotTool.ts                   # Tool definitions
│   └── Playbook.ts                    # Playbook model
└── hooks/
    ├── usePilotContext.ts             # Context hook
    ├── usePilotTools.ts               # Tool invocation hook
    └── usePilotSuggestions.ts         # Suggestions hook
```

### Database Schema

```sql
-- Pilot profiles
CREATE TABLE pilot_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  county_id UUID NOT NULL REFERENCES counties(id),
  avatar JSONB NOT NULL DEFAULT '{}',
  role_config JSONB NOT NULL DEFAULT '{}',
  mode_preferences JSONB NOT NULL DEFAULT '{}',
  permissions JSONB NOT NULL DEFAULT '{}',
  compliance JSONB NOT NULL DEFAULT '{}',
  memory JSONB,
  total_interactions INTEGER NOT NULL DEFAULT 0,
  pilot_minutes INTEGER NOT NULL DEFAULT 0,
  muse_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, county_id)
);

-- Playbooks
CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  county_id UUID NOT NULL REFERENCES counties(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  mode VARCHAR(10) NOT NULL CHECK (mode IN ('pilot', 'muse', 'both')),
  steps JSONB NOT NULL,
  shared BOOLEAN NOT NULL DEFAULT FALSE,
  shared_with_roles VARCHAR(50)[] DEFAULT '{}',
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suggestion dismissals (for cooldowns)
CREATE TABLE pilot_suggestion_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  suggestion_id VARCHAR(200) NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cooldown_until TIMESTAMPTZ NOT NULL,
  
  UNIQUE(user_id, suggestion_id)
);

-- Tool invocation log (denormalized for fast queries)
CREATE TABLE pilot_tool_invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  county_id UUID NOT NULL REFERENCES counties(id),
  pilot_session_id UUID NOT NULL,
  tool_id VARCHAR(100) NOT NULL,
  mode VARCHAR(10) NOT NULL,
  params JSONB,
  result_status VARCHAR(20) NOT NULL,
  duration_ms INTEGER,
  trace_event_id UUID REFERENCES trace_events(id),
  invoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pilot_profiles_user ON pilot_profiles(user_id);
CREATE INDEX idx_playbooks_owner ON playbooks(owner_id);
CREATE INDEX idx_playbooks_shared ON playbooks(shared) WHERE shared = TRUE;
CREATE INDEX idx_tool_invocations_user ON pilot_tool_invocations(user_id, invoked_at DESC);
CREATE INDEX idx_suggestion_dismissals_lookup ON pilot_suggestion_dismissals(user_id, suggestion_id);
```

---

## 14. Testing Requirements

### Unit Tests

- [ ] Mode switching preserves context
- [ ] Tool filtering by mode works correctly
- [ ] Permission checks pass/fail appropriately
- [ ] Risk level validation works
- [ ] Reason code requirement enforced
- [ ] Playbook step execution order correct
- [ ] Suggestion triggers fire correctly
- [ ] Cooldown tracking works

### Integration Tests

- [ ] Tools execute end-to-end
- [ ] Trace events logged for all actions
- [ ] Context updates propagate
- [ ] Panel renders in all integration points
- [ ] Cross-suite tool execution works
- [ ] Dossier integration works (Muse drafts saved)

### Safety Tests

- [ ] High-risk tools require confirmation
- [ ] Irreversible tools require supervisor approval
- [ ] Mode violations are blocked
- [ ] Unauthorized tools are hidden
- [ ] Permission denied is logged
- [ ] Failed tools don't leave partial state

### Accessibility Tests

- [ ] Keyboard navigation works
- [ ] Screen reader announces mode changes
- [ ] Focus management correct
- [ ] Color contrast meets WCAG AA

---

## 15. Appendix: Tool Reference

### Pilot Mode Tools (Complete List)

| Tool ID | Name | Category | Risk | Suite |
|---------|------|----------|------|-------|
| route_to_parcel | Open Parcel | navigation | read | os |
| open_panel | Open Panel | navigation | read | os |
| switch_work_mode | Switch Work Mode | navigation | read | os |
| assign_task | Assign Task | workflow | write-medium | dais |
| create_workflow | Create Workflow | workflow | write-medium | dais |
| escalate_task | Escalate Task | workflow | write-medium | dais |
| fetch_comps | Find Comparables | data | read | forge |
| search_parcels | Search Parcels | data | read | os |
| get_permit_history | Get Permit History | data | read | dais |
| get_exemption_status | Get Exemption Status | data | read | dais |
| run_model | Run Valuation Model | execution | write-medium | forge |
| generate_notice | Generate Notice | execution | write-high | dais |
| create_exemption | Create Exemption | execution | write-medium | dais |
| assemble_packet | Assemble BOE Packet | execution | write-medium | dossier |
| approve_exemption | Approve Exemption | execution | write-high | dais |
| check_cert_status | Check Certification | monitoring | read | dais |
| verify_roll_ready | Verify Roll Ready | monitoring | read | dais |
| check_queue | Check My Queue | monitoring | read | dais |

### Muse Mode Tools (Complete List)

| Tool ID | Name | Category | Output | Suite |
|---------|------|----------|--------|-------|
| draft_notice | Draft Notice | draft | document | dais |
| draft_letter | Draft Letter | draft | document | dais |
| draft_appeal_response | Draft Appeal Response | draft | document | dais |
| draft_exemption_letter | Draft Exemption Letter | draft | document | dais |
| draft_commissioner_memo | Draft Commissioner Memo | draft | document | dais |
| explain_value_change | Explain Value Change | explain | narrative | forge |
| explain_model_results | Explain Model Results | explain | narrative | forge |
| explain_exemption_decision | Explain Exemption Decision | explain | narrative | dais |
| explain_appeal_outcome | Explain Appeal Outcome | explain | narrative | dais |
| summarize_dossier | Summarize Case File | summarize | text | dossier |
| summarize_parcel_history | Summarize Parcel History | summarize | text | os |
| summarize_permit_activity | Summarize Permit Activity | summarize | text | dais |
| synthesize_evidence | Synthesize Evidence | synthesize | narrative | dossier |
| create_hearing_narrative | Create Hearing Narrative | synthesize | document | dossier |
| create_template | Create Template | template | template | os |
| customize_template | Customize Template | template | template | os |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-08-01 | Architecture | Initial TerraAssistant spec |
| 2.0 | 2025-12-15 | Architecture | Merged with TerraAgent, added modes |
| 3.0 | 2026-01-28 | Architecture | Full consolidation, safety layer, playbooks, complete tool inventory |

---

**TerraFusion OS — Genesis Era**  
*TerraPilot: Your Personal Copilot Across TerraFusion*
