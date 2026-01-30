# TerraPilot Canonical Specification v3.0

**Status:** LOCKED - Implementation Required  
**Last Updated:** January 28, 2026  
**Classification:** OS-Level AI Copilot Architecture  

---

## CANONICAL NAMES (ENFORCEMENT REQUIRED)

| Component | Canonical Name | Forbidden Variants |
|-----------|---------------|-------------------|
| Personal Copilot | TerraPilot | TaraPilot, Terra Pilot, Pilot |
| Operator Mode | Pilot Mode | PilotMode, pilot mode |
| Creator Mode | Muse Mode | MuseMode, muse mode |
| User Profile | PilotProfile | Pilot Profile, pilotProfile (except in code) |
| Audit Trail | TerraTrace | TaraTrace, Terra Trace, Trace |

---

## 1. ARCHITECTURAL OVERVIEW

TerraPilot is a **single OS-level personal copilot** with two operational modes:

```
TerraPilot (User's Copilot)
├── PilotProfile (persistent avatar + preferences)
├── Pilot Mode (operator: do/route/act)
└── Muse Mode (creator: draft/explain/synthesize)
```

**Core Principles:**
1. **One copilot per user** (not multiple assistants)
2. **Mode-based capabilities** (Pilot vs Muse)
3. **Always logged** (every action to TerraTrace)
4. **Always permission-gated** (RBAC + tool allowlists)
5. **Human-in-the-loop** (for high-impact actions)

---

## 2. PERMISSION MODEL (ENHANCED - CRITICAL FIX)

### Permission Architecture Split

**PREVIOUS (WRONG):**
```typescript
// Mixed permissions with tools - INCORRECT
if (availableTools.includes(perm)) { ... }
```

**CURRENT (CORRECT):**
```typescript
interface UserPermissions {
  // RBAC Claims (role-based access control)
  rbacClaims: string[];         // e.g., ["forge:read", "dais:write"]
  
  // Tool Allowlist (what tools this user can invoke)
  allowedTools: string[];       // e.g., ["run_model", "draft_notice"]
  
  // Data Access Level
  dataAccess: AccessLevel;      // "read-only" | "standard" | "elevated"
  
  // County Scope
  countyScope: string[];        // Which counties user can access
}

interface ToolPermissionCheck {
  // Tool requirements
  requiredClaims: string[];     // RBAC claims tool needs
  riskLevel: RiskLevel;         // Tool risk classification
  
  // Validation
  validate(user: UserPermissions): boolean;
}
```

### Tool Risk Levels (NEW)

Every tool must have an assigned risk level:

```typescript
enum RiskLevel {
  READ_ONLY = "read-only",               // No writes, safe to auto-execute
  WRITE_LOW = "write-low-risk",          // Drafts, notes, non-binding
  WRITE_MEDIUM = "write-medium-risk",    // Workflow actions, assignments
  WRITE_HIGH = "write-high-risk",        // Approvals, decisions, notices
  IRREVERSIBLE = "irreversible"          // Roll certification, deletions
}

interface RiskPolicy {
  riskLevel: RiskLevel;
  requiresConfirmation: boolean;
  requiresReasonCode: boolean;
  requiresSupervisorApproval: boolean;
  confirmationMessage?: string;
  reasonCodeOptions?: string[];
}

const RISK_POLICIES: Record<RiskLevel, RiskPolicy> = {
  "read-only": {
    riskLevel: "read-only",
    requiresConfirmation: false,
    requiresReasonCode: false,
    requiresSupervisorApproval: false
  },
  
  "write-low-risk": {
    riskLevel: "write-low-risk",
    requiresConfirmation: false,
    requiresReasonCode: false,
    requiresSupervisorApproval: false
  },
  
  "write-medium-risk": {
    riskLevel: "write-medium-risk",
    requiresConfirmation: true,
    requiresReasonCode: false,
    requiresSupervisorApproval: false,
    confirmationMessage: "This action will modify workflow state. Continue?"
  },
  
  "write-high-risk": {
    riskLevel: "write-high-risk",
    requiresConfirmation: true,
    requiresReasonCode: true,
    requiresSupervisorApproval: false, // Configurable per county
    confirmationMessage: "This is a high-impact decision. Please provide a reason.",
    reasonCodeOptions: [
      "Policy Change",
      "Data Correction",
      "User Request",
      "Compliance Requirement",
      "Other (specify)"
    ]
  },
  
  "irreversible": {
    riskLevel: "irreversible",
    requiresConfirmation: true,
    requiresReasonCode: true,
    requiresSupervisorApproval: true,
    confirmationMessage: "WARNING: This action cannot be undone. Supervisor approval required.",
    reasonCodeOptions: [
      "Annual Roll Certification",
      "Emergency Correction",
      "Legal Requirement",
      "Authorized Deletion"
    ]
  }
};
```

### Tool Permission Validation

```typescript
async function validateToolPermissions(
  tool: BaseTool,
  user: User
): Promise<PermissionValidationResult> {
  
  // 1. Check RBAC claims
  const hasRequiredClaims = tool.requiredClaims.every(claim =>
    user.permissions.rbacClaims.includes(claim)
  );
  
  if (!hasRequiredClaims) {
    return {
      allowed: false,
      reason: "insufficient_rbac_claims",
      missingClaims: tool.requiredClaims.filter(
        c => !user.permissions.rbacClaims.includes(c)
      )
    };
  }
  
  // 2. Check tool allowlist
  const isToolAllowed = user.permissions.allowedTools.includes(tool.id);
  
  if (!isToolAllowed) {
    return {
      allowed: false,
      reason: "tool_not_in_allowlist",
      toolId: tool.id
    };
  }
  
  // 3. Check county scope (if tool is parcel-specific)
  if (tool.context?.parcelId) {
    const parcel = await ParcelService.get(tool.context.parcelId);
    const hasCountyAccess = user.permissions.countyScope.includes(parcel.countyId);
    
    if (!hasCountyAccess) {
      return {
        allowed: false,
        reason: "county_access_denied",
        countyId: parcel.countyId
      };
    }
  }
  
  // 4. Check data access level
  if (tool.minimumAccessLevel) {
    const accessLevels = ["read-only", "standard", "elevated"];
    const userLevel = accessLevels.indexOf(user.permissions.dataAccess);
    const requiredLevel = accessLevels.indexOf(tool.minimumAccessLevel);
    
    if (userLevel < requiredLevel) {
      return {
        allowed: false,
        reason: "insufficient_access_level",
        required: tool.minimumAccessLevel,
        current: user.permissions.dataAccess
      };
    }
  }
  
  return { allowed: true };
}
```

---

## 3. HUMAN-IN-THE-LOOP POLICY (NEW)

### Core Principle

**TerraPilot can RECOMMEND high-impact actions but CANNOT execute them without explicit human approval.**

### Approval Requirements by Risk Level

| Risk Level | Auto-Execute | Confirmation | Reason Code | Supervisor | Trace Detail |
|------------|-------------|--------------|-------------|-----------|--------------|
| Read-Only | ✅ Yes | ❌ No | ❌ No | ❌ No | Basic |
| Write-Low | ✅ Yes | ❌ No | ❌ No | ❌ No | Basic |
| Write-Medium | ❌ No | ✅ Yes | ❌ No | ❌ No | Standard |
| Write-High | ❌ No | ✅ Yes | ✅ Yes | ⚠️ Configurable | Enhanced |
| Irreversible | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | Full Audit |

### Approval Workflow

```typescript
interface ApprovalRequest {
  toolId: string;
  toolName: string;
  riskLevel: RiskLevel;
  context: {
    parcelId?: string;
    dossierId?: string;
    description: string;
  };
  requestedBy: {
    userId: string;
    userName: string;
    timestamp: DateTime;
  };
  requiresSupervisor: boolean;
}

interface ApprovalResponse {
  approved: boolean;
  approvedBy: {
    userId: string;
    userName: string;
    role: string;
    timestamp: DateTime;
  };
  reasonCode?: string;
  reasonDetail?: string;
  supervisorApproval?: {
    supervisorId: string;
    supervisorName: string;
    timestamp: DateTime;
  };
}

async function requestApproval(
  tool: BaseTool,
  user: User,
  context: PilotContext
): Promise<ApprovalResponse> {
  
  const policy = RISK_POLICIES[tool.riskLevel];
  
  // Low-risk tools skip approval
  if (!policy.requiresConfirmation) {
    return {
      approved: true,
      approvedBy: {
        userId: user.id,
        userName: user.name,
        role: user.role,
        timestamp: new Date()
      }
    };
  }
  
  // Show confirmation modal
  const confirmation = await showConfirmationModal({
    title: `Confirm: ${tool.name}`,
    message: policy.confirmationMessage,
    requireReasonCode: policy.requiresReasonCode,
    reasonCodeOptions: policy.reasonCodeOptions,
    riskLevel: tool.riskLevel
  });
  
  if (!confirmation.confirmed) {
    throw new UserCancelledError("User declined approval");
  }
  
  // Check if supervisor approval required
  if (policy.requiresSupervisorApproval) {
    const supervisor = await requestSupervisorApproval({
      tool,
      user,
      context,
      userReason: confirmation.reasonCode,
      userReasonDetail: confirmation.reasonDetail
    });
    
    if (!supervisor.approved) {
      throw new ApprovalDeniedError("Supervisor denied approval");
    }
    
    return {
      approved: true,
      approvedBy: {
        userId: user.id,
        userName: user.name,
        role: user.role,
        timestamp: new Date()
      },
      reasonCode: confirmation.reasonCode,
      reasonDetail: confirmation.reasonDetail,
      supervisorApproval: supervisor
    };
  }
  
  return {
    approved: true,
    approvedBy: {
      userId: user.id,
      userName: user.name,
      role: user.role,
      timestamp: new Date()
    },
    reasonCode: confirmation.reasonCode,
    reasonDetail: confirmation.reasonDetail
  };
}
```

### Muse Mode Publishing Policy

**Core Rule:** Muse Mode can **draft** anything but **cannot publish/send** without human approval.

```typescript
// Example: Draft Notice Tool (Muse Mode)
const draftNoticeTool: MuseModeTool = {
  id: "draft_notice",
  name: "Draft Notice",
  mode: "muse",
  category: "draft",
  riskLevel: "write-low-risk",  // Draft is low-risk
  
  execute: async (params, context) => {
    const draft = await NoticeService.generateDraft(params);
    
    // Save as draft (not published)
    await DossierService.createItem({
      type: "notice_draft",
      content: draft,
      status: "draft", // NOT "published"
      metadata: {
        generatedBy: "terra-muse",
        requiresReview: true
      }
    });
    
    return {
      success: true,
      draft,
      message: "Draft created. Review and publish manually."
    };
  }
};

// Publishing requires separate high-risk tool
const publishNoticeTool: PilotModeTool = {
  id: "publish_notice",
  name: "Publish Notice",
  mode: "pilot",
  category: "execution",
  riskLevel: "write-high-risk",  // Publishing is high-risk
  
  execute: async (params, context, approval) => {
    // approval contains user confirmation + reason code
    
    const published = await NoticeService.publish({
      draftId: params.draftId,
      approvedBy: approval.approvedBy,
      reasonCode: approval.reasonCode
    });
    
    return { success: true, published };
  }
};
```

---

## 4. TERRATRACE IMMUTABILITY & RETENTION (NEW)

### Append-Only Architecture

**PRINCIPLE:** TraceEvents are immutable once written. No in-place updates.

```typescript
// WRONG (in-place update)
await TraceService.update(invocationEvent.id, {
  data: { outputs: result }
});

// RIGHT (append-only pattern)
// Event 1: Tool Invoked
const invokedEvent = await TraceService.emit({
  event: {
    suite: "pilot",
    module: "terra-pilot",
    action: "tool_invoked",
    category: "system"
  },
  data: {
    toolId: tool.id,
    params: sanitizeParams(params)
  }
});

// Event 2: Tool Succeeded (or Failed)
const resultEvent = await TraceService.emit({
  event: {
    suite: "pilot",
    module: "terra-pilot",
    action: "tool_succeeded",  // or "tool_failed"
    category: "system"
  },
  data: {
    toolId: tool.id,
    invocationId: invokedEvent.id,  // Link back
    outputs: sanitizeOutputs(result),
    executionTime: duration
  }
});
```

### PII Handling Rules

```typescript
interface PIIPolicy {
  // Which fields can contain free text
  freeTextFields: string[];
  
  // Automatic sanitization rules
  sanitizeRules: SanitizationRule[];
  
  // Retention rules
  retentionRules: RetentionRule[];
}

const TRACE_PII_POLICY: PIIPolicy = {
  freeTextFields: [
    "data.inputs.userMessage",     // User chat messages
    "data.outputs.narrative",      // Muse-generated narratives
    "data.metadata.reasonDetail"   // User-provided reasons
  ],
  
  sanitizeRules: [
    {
      field: "data.inputs.userMessage",
      rule: "redact_ssn",           // SSN pattern
      replacement: "[SSN REDACTED]"
    },
    {
      field: "data.outputs.narrative",
      rule: "redact_phone",         // Phone number pattern
      replacement: "[PHONE REDACTED]"
    }
  ],
  
  retentionRules: [
    {
      category: "workflow",
      retention: "7_years",         // Government standard
      purgeAfter: true
    },
    {
      category: "system",
      retention: "audit_cycle",     // 90 days
      purgeAfter: true
    },
    {
      category: "compliance",
      retention: "permanent",
      purgeAfter: false
    }
  ]
};
```

### Redaction Strategy

**When redaction is required (court order, GDPR request, etc.):**

```typescript
interface RedactionRequest {
  traceEventId: string;
  fieldsToRedact: string[];
  requestedBy: {
    userId: string;
    authority: "court_order" | "gdpr_request" | "data_breach";
  };
  reason: string;
}

async function redactTraceEvent(
  request: RedactionRequest
): Promise<RedactionResult> {
  
  // 1. Create redaction event (audit trail)
  const redactionEvent = await TraceService.emit({
    event: {
      suite: "os",
      module: "terra-trace",
      action: "event_redacted",
      category: "compliance"
    },
    data: {
      originalEventId: request.traceEventId,
      fieldsRedacted: request.fieldsToRedact,
      authority: request.requestedBy.authority,
      reason: request.reason
    },
    compliance: {
      classification: "RESTRICTED",
      retention: "permanent",
      auditRequired: true
    }
  });
  
  // 2. Create redacted version (new event)
  const originalEvent = await TraceService.get(request.traceEventId);
  const redactedData = applyRedaction(
    originalEvent.data,
    request.fieldsToRedact
  );
  
  const redactedEvent = await TraceService.emit({
    event: {
      ...originalEvent.event,
      action: originalEvent.event.action + "_redacted"
    },
    data: {
      ...redactedData,
      _redacted: true,
      _redactionEventId: redactionEvent.id
    },
    compliance: originalEvent.compliance
  });
  
  // 3. Mark original as redacted (flag, not delete)
  await TraceService.markRedacted(request.traceEventId, {
    redactedEventId: redactedEvent.id,
    redactionEventId: redactionEvent.id
  });
  
  return {
    success: true,
    originalEventId: request.traceEventId,
    redactedEventId: redactedEvent.id,
    redactionEventId: redactionEvent.id
  };
}
```

### Retention Schedule

```typescript
interface RetentionSchedule {
  category: TraceCategory;
  retention: "7_years" | "permanent" | "audit_cycle" | "custom";
  customDays?: number;
  purgeStrategy: "hard_delete" | "archive" | "redact";
}

const TRACE_RETENTION_SCHEDULE: RetentionSchedule[] = [
  {
    category: "valuation",
    retention: "7_years",
    purgeStrategy: "archive"  // Move to cold storage, don't delete
  },
  {
    category: "workflow",
    retention: "7_years",
    purgeStrategy: "archive"
  },
  {
    category: "compliance",
    retention: "permanent",
    purgeStrategy: "archive"
  },
  {
    category: "system",
    retention: "audit_cycle",
    purgeStrategy: "hard_delete"
  }
];

// Automated retention enforcement
async function enforceRetention(): Promise<void> {
  for (const schedule of TRACE_RETENTION_SCHEDULE) {
    const cutoffDate = calculateCutoffDate(schedule.retention, schedule.customDays);
    
    const expiredEvents = await TraceService.findExpired({
      category: schedule.category,
      before: cutoffDate
    });
    
    for (const event of expiredEvents) {
      switch (schedule.purgeStrategy) {
        case "hard_delete":
          await TraceService.delete(event.id);
          break;
          
        case "archive":
          await TraceService.archive(event.id);
          break;
          
        case "redact":
          await redactSensitiveFields(event.id);
          break;
      }
    }
  }
}
```

---

## 5. PILOT MODE TOOLS (ENHANCED)

### Tool Definition with Risk Levels

```typescript
interface PilotModeTool extends BaseTool {
  id: string;
  name: string;
  mode: "pilot";
  category: PilotModeToolCategory;
  
  // Permission model (FIXED)
  requiredClaims: string[];          // RBAC claims
  riskLevel: RiskLevel;              // Risk classification
  minimumAccessLevel?: AccessLevel;  // Data access requirement
  
  // Execution
  executionType: "immediate" | "queued" | "scheduled";
  execute: (params: any, context: PilotContext, approval?: ApprovalResponse) => Promise<ToolResult>;
}
```

### Example Tools with Risk Levels

```typescript
// Low-Risk Tool
const fetchComps: PilotModeTool = {
  id: "fetch_comps",
  name: "Find Comparables",
  mode: "pilot",
  category: "data",
  requiredClaims: ["forge:read"],
  riskLevel: "read-only",
  executionType: "immediate",
  
  execute: async (params, context) => {
    const comps = await CompService.search({
      parcelId: context.focus.parcelId,
      radius: params.radius || 1.0,
      limit: params.limit || 5
    });
    
    return { success: true, comps };
  }
};

// Medium-Risk Tool
const assignTask: PilotModeTool = {
  id: "assign_task",
  name: "Assign Task",
  mode: "pilot",
  category: "workflow",
  requiredClaims: ["dais:tasks:write"],
  riskLevel: "write-medium-risk",
  executionType: "immediate",
  
  execute: async (params, context, approval) => {
    // approval contains user confirmation
    
    const task = await TaskService.create({
      ...params,
      assignedBy: approval.approvedBy.userId
    });
    
    await TraceService.emit({
      parcelId: context.focus.parcelId,
      event: {
        suite: "dais",
        module: "terra-queue",
        action: "task_assigned",
        category: "workflow"
      },
      data: {
        inputs: params,
        outputs: { taskId: task.id }
      }
    });
    
    return { success: true, task };
  }
};

// High-Risk Tool
const approveExemption: PilotModeTool = {
  id: "approve_exemption",
  name: "Approve Exemption",
  mode: "pilot",
  category: "execution",
  requiredClaims: ["dais:exemptions:approve"],
  riskLevel: "write-high-risk",
  minimumAccessLevel: "elevated",
  executionType: "immediate",
  
  execute: async (params, context, approval) => {
    // approval contains confirmation + reason code + optional supervisor
    
    const exemption = await ExemptionService.approve({
      exemptionId: params.exemptionId,
      approvedBy: approval.approvedBy.userId,
      reasonCode: approval.reasonCode,
      reasonDetail: approval.reasonDetail,
      supervisorApproval: approval.supervisorApproval
    });
    
    await TraceService.emit({
      parcelId: context.focus.parcelId,
      event: {
        suite: "dais",
        module: "terra-exempt",
        action: "exemption_approved",
        category: "workflow"
      },
      data: {
        inputs: params,
        outputs: { exemptionId: exemption.id, amount: exemption.amount },
        metadata: {
          reasonCode: approval.reasonCode,
          reasonDetail: approval.reasonDetail,
          supervisorId: approval.supervisorApproval?.supervisorId
        }
      },
      compliance: {
        classification: "CONFIDENTIAL",
        retention: "7_years",
        auditRequired: true
      }
    });
    
    return { success: true, exemption };
  }
};

// Irreversible Tool
const certifyRoll: PilotModeTool = {
  id: "certify_roll",
  name: "Certify Assessment Roll",
  mode: "pilot",
  category: "execution",
  requiredClaims: ["dais:cert:certify"],
  riskLevel: "irreversible",
  minimumAccessLevel: "elevated",
  executionType: "immediate",
  
  execute: async (params, context, approval) => {
    // approval MUST contain supervisor approval for irreversible actions
    
    if (!approval.supervisorApproval) {
      throw new ApprovalError("Supervisor approval required for roll certification");
    }
    
    const certification = await CertificationService.certify({
      rollYear: params.year,
      certifiedBy: approval.approvedBy.userId,
      supervisorId: approval.supervisorApproval.supervisorId,
      reasonCode: approval.reasonCode
    });
    
    await TraceService.emit({
      event: {
        suite: "dais",
        module: "terra-cert",
        action: "roll_certified",
        category: "compliance"
      },
      data: {
        inputs: params,
        outputs: {
          certificationId: certification.id,
          rollYear: params.year,
          parcelCount: certification.parcelCount,
          totalValue: certification.totalValue
        },
        metadata: {
          certifiedBy: approval.approvedBy.userId,
          supervisorId: approval.supervisorApproval.supervisorId,
          reasonCode: approval.reasonCode,
          reasonDetail: approval.reasonDetail
        }
      },
      compliance: {
        classification: "RESTRICTED",
        retention: "permanent",
        auditRequired: true
      }
    });
    
    return { success: true, certification };
  }
};
```

---

## 6. MUSE MODE TOOLS (ENHANCED)

### Tool Definition with Publishing Restrictions

```typescript
interface MuseModeTool extends BaseTool {
  id: string;
  name: string;
  mode: "muse";
  category: MuseModeToolCategory;
  
  // Permission model
  requiredClaims: string[];
  riskLevel: RiskLevel;  // Drafts are low-risk, publishing is high-risk
  
  // Output
  outputType: "text" | "document" | "narrative";
  canPublish: boolean;    // Can this tool publish directly?
  
  execute: (params: any, context: PilotContext) => Promise<ToolResult>;
}
```

### Example Muse Tools

```typescript
// Draft Tool (Low-Risk)
const draftNotice: MuseModeTool = {
  id: "draft_notice",
  name: "Draft Assessment Notice",
  mode: "muse",
  category: "draft",
  requiredClaims: ["dais:notices:draft"],
  riskLevel: "write-low-risk",  // Draft is low-risk
  outputType: "document",
  canPublish: false,  // CANNOT publish directly
  
  execute: async (params, context) => {
    const draft = await NoticeService.generateDraft({
      parcelId: context.focus.parcelId,
      noticeType: params.noticeType,
      customData: params.data,
      style: context.pilotProfile.modePreferences.museSettings.writingStyle
    });
    
    // Save as DRAFT only
    const dossierItem = await DossierService.createItem({
      parcelId: context.focus.parcelId,
      type: "notice_draft",
      content: draft,
      status: "draft",  // NOT "published"
      metadata: {
        generatedBy: "terra-muse",
        requiresReview: true,
        noticeType: params.noticeType
      }
    });
    
    await TraceService.emit({
      parcelId: context.focus.parcelId,
      dossierId: dossierItem.id,
      event: {
        suite: "gpt",
        module: "terra-muse",
        action: "notice_drafted",
        category: "workflow"
      },
      data: {
        inputs: params,
        outputs: {
          draftId: dossierItem.id,
          wordCount: draft.split(/\s+/).length
        }
      }
    });
    
    return {
      success: true,
      draft,
      dossierItem,
      message: "Draft created. Review in Dossier, then publish manually via Dais."
    };
  }
};

// Explanation Tool (Read-Only)
const explainValueChange: MuseModeTool = {
  id: "explain_value_change",
  name: "Explain Value Change",
  mode: "muse",
  category: "explain",
  requiredClaims: ["forge:read"],
  riskLevel: "read-only",  // Pure explanation, no writes
  outputType: "narrative",
  canPublish: false,
  
  execute: async (params, context) => {
    const history = await ValuationService.getHistory(context.focus.parcelId);
    const comps = await CompService.getRecentComps(context.focus.parcelId);
    
    const explanation = await GPTService.generateExplanation({
      history,
      comps,
      compareYears: [params.fromYear, params.toYear],
      style: context.pilotProfile.modePreferences.museSettings.writingStyle
    });
    
    // Optionally save to Dossier
    let dossierId = null;
    if (context.pilotProfile.modePreferences.museSettings.includeEvidence) {
      const item = await DossierService.createItem({
        parcelId: context.focus.parcelId,
        title: `Value Explanation: ${params.fromYear} to ${params.toYear}`,
        content: explanation,
        type: "narrative",
        tags: ["valuation", "explanation", "muse-generated"]
      });
      dossierId = item.id;
    }
    
    return {
      success: true,
      explanation,
      dossierId
    };
  }
};
```

---

## 7. PILOTPROFILE DATA MODEL (FINAL)

```typescript
interface PilotProfile {
  // === IDENTITY ===
  id: string;
  userId: string;
  countyId: string;
  
  // === AVATAR ===
  avatar: {
    name: string;
    displayName: string;
    icon: AvatarIcon;
    color: string;
    personality: "formal" | "conversational" | "technical";
  };
  
  // === ROLE & SPECIALIZATION ===
  role: {
    primary: UserRole;
    specialization: string[];
    workModes: WorkMode[];
  };
  
  // === PERMISSIONS (SPLIT MODEL) ===
  permissions: {
    rbacClaims: string[];           // RBAC permissions
    allowedTools: string[];         // Tool IDs user can invoke
    dataAccess: AccessLevel;        // Read-only, standard, elevated
    countyScope: string[];          // Which counties
  };
  
  // === MODE PREFERENCES ===
  modePreferences: {
    defaultMode: "pilot" | "muse";
    
    pilotSettings: {
      suggestionLevel: "minimal" | "balanced" | "proactive";
      autoExecuteLowRisk: boolean;  // Auto-run read-only tools
      pinnedActions: PinnedAction[];
    };
    
    museSettings: {
      writingStyle: "formal" | "conversational" | "technical";
      draftLength: "concise" | "standard" | "detailed";
      includeEvidence: boolean;
      preferredTemplates: string[];
    };
  };
  
  // === PLAYBOOKS ===
  playbooks: Playbook[];
  
  // === LEARNING (OPT-IN) ===
  memory?: {
    frequentTasks: string[];
    savedPrompts: string[];
    preferredTools: string[];
    draftTemplates: DraftTemplate[];
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
```

---

## 8. IMPLEMENTATION SAFEGUARDS

### Pre-Execution Checks

```typescript
async function executeToolWithSafeguards(
  tool: BaseTool,
  params: any,
  context: PilotContext
): Promise<ToolResult> {
  
  // 1. Validate permissions (RBAC + allowlist)
  const permCheck = await validateToolPermissions(tool, context.user);
  if (!permCheck.allowed) {
    await logPermissionDenial(tool, context.user, permCheck.reason);
    throw new PermissionError(permCheck.reason);
  }
  
  // 2. Validate mode
  if (tool.mode !== context.currentMode && tool.mode !== "both") {
    throw new ModeViolationError(
      `Tool "${tool.name}" requires ${tool.mode} mode`
    );
  }
  
  // 3. Get approval if required
  let approval: ApprovalResponse | undefined;
  const policy = RISK_POLICIES[tool.riskLevel];
  
  if (policy.requiresConfirmation) {
    approval = await requestApproval(tool, context.user, context);
  } else {
    // Auto-approve for low-risk tools
    approval = {
      approved: true,
      approvedBy: {
        userId: context.user.id,
        userName: context.user.name,
        role: context.user.role,
        timestamp: new Date()
      }
    };
  }
  
  // 4. Log invocation (BEFORE execution)
  const invokedEvent = await TraceService.emit({
    parcelId: context.focus.parcelId,
    event: {
      suite: tool.mode === "pilot" ? "pilot" : "gpt",
      module: "terra-pilot",
      action: "tool_invoked",
      category: "system"
    },
    data: {
      toolId: tool.id,
      toolName: tool.name,
      riskLevel: tool.riskLevel,
      params: sanitizeParams(params),
      approval: {
        approvedBy: approval.approvedBy.userId,
        reasonCode: approval.reasonCode
      }
    },
    compliance: {
      classification: tool.riskLevel === "irreversible" ? "RESTRICTED" : "CONFIDENTIAL",
      retention: tool.riskLevel === "irreversible" ? "permanent" : "7_years",
      auditRequired: policy.requiresReasonCode
    }
  });
  
  // 5. Execute tool
  try {
    const startTime = Date.now();
    const result = await tool.execute(params, context, approval);
    const duration = Date.now() - startTime;
    
    // 6. Log success
    await TraceService.emit({
      parcelId: context.focus.parcelId,
      event: {
        suite: tool.mode === "pilot" ? "pilot" : "gpt",
        module: "terra-pilot",
        action: "tool_succeeded",
        category: "system"
      },
      data: {
        toolId: tool.id,
        invocationId: invokedEvent.id,
        outputs: sanitizeOutputs(result),
        executionTime: duration
      }
    });
    
    return result;
    
  } catch (error) {
    // 7. Log failure
    await TraceService.emit({
      parcelId: context.focus.parcelId,
      event: {
        suite: tool.mode === "pilot" ? "pilot" : "gpt",
        module: "terra-pilot",
        action: "tool_failed",
        category: "system"
      },
      data: {
        toolId: tool.id,
        invocationId: invokedEvent.id,
        error: error.message,
        executionTime: Date.now() - startTime
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

## 9. VALIDATION & TESTING

### Permission Tests

```typescript
describe("TerraPilot Permission Model", () => {
  test("RBAC claims are checked before tool execution", async () => {
    const user = createTestUser({
      rbacClaims: ["forge:read"], // Missing "dais:write"
      allowedTools: ["approve_exemption"]
    });
    
    const tool = approveExemptionTool;
    
    await expect(
      executeToolWithSafeguards(tool, {}, createContext(user))
    ).rejects.toThrow("insufficient_rbac_claims");
  });
  
  test("Tool allowlist is enforced", async () => {
    const user = createTestUser({
      rbacClaims: ["dais:exemptions:approve"],
      allowedTools: ["other_tool"] // Missing "approve_exemption"
    });
    
    const tool = approveExemptionTool;
    
    await expect(
      executeToolWithSafeguards(tool, {}, createContext(user))
    ).rejects.toThrow("tool_not_in_allowlist");
  });
  
  test("High-risk tools require reason code", async () => {
    const user = createTestUser({
      rbacClaims: ["dais:exemptions:approve"],
      allowedTools: ["approve_exemption"]
    });
    
    const tool = approveExemptionTool;
    const approval = await requestApproval(tool, user, createContext(user));
    
    expect(approval.reasonCode).toBeDefined();
  });
  
  test("Irreversible tools require supervisor approval", async () => {
    const user = createTestUser({
      rbacClaims: ["dais:cert:certify"],
      allowedTools: ["certify_roll"]
    });
    
    const tool = certifyRollTool;
    const approval = await requestApproval(tool, user, createContext(user));
    
    expect(approval.supervisorApproval).toBeDefined();
    expect(approval.supervisorApproval.supervisorId).toBeTruthy();
  });
});
```

### Trace Immutability Tests

```typescript
describe("TerraTrace Immutability", () => {
  test("TraceEvents cannot be updated in-place", async () => {
    const event = await TraceService.emit({
      event: { suite: "test", module: "test", action: "test", category: "system" },
      data: { test: true }
    });
    
    await expect(
      TraceService.update(event.id, { data: { test: false } })
    ).rejects.toThrow("TraceEvents are immutable");
  });
  
  test("Redaction creates new event without deleting original", async () => {
    const original = await TraceService.emit({
      event: { suite: "test", module: "test", action: "test", category: "workflow" },
      data: { sensitiveData: "SSN-123-45-6789" }
    });
    
    const redactionResult = await redactTraceEvent({
      traceEventId: original.id,
      fieldsToRedact: ["data.sensitiveData"],
      requestedBy: { userId: "admin", authority: "gdpr_request" },
      reason: "User data deletion request"
    });
    
    // Original still exists (flagged as redacted)
    const originalAfter = await TraceService.get(original.id);
    expect(originalAfter._redacted).toBe(true);
    
    // Redacted version created
    const redacted = await TraceService.get(redactionResult.redactedEventId);
    expect(redacted.data.sensitiveData).toBe("[REDACTED]");
  });
});
```

---

## 10. DEPLOYMENT CHECKLIST

**Phase 0: Foundation**
- [ ] Implement split permission model (RBAC + allowlist)
- [ ] Create risk level enum and policies
- [ ] Build approval workflow UI
- [ ] Implement TerraTrace append-only storage

**Phase 1: Pilot Mode**
- [ ] Create 5 core Pilot tools with risk levels assigned
- [ ] Implement permission validation middleware
- [ ] Add approval modals for medium/high-risk tools
- [ ] Test human-in-loop workflows

**Phase 2: Muse Mode**
- [ ] Create 5 core Muse tools
- [ ] Enforce draft-only policy (no direct publishing)
- [ ] Add Dossier integration for drafts
- [ ] Test publishing workflow (draft → review → publish)

**Phase 3: Trace Hardening**
- [ ] Implement PII sanitization rules
- [ ] Add redaction capability
- [ ] Configure retention schedules
- [ ] Set up automated retention enforcement

**Phase 4: Validation**
- [ ] Permission model tests
- [ ] Risk level enforcement tests
- [ ] Trace immutability tests
- [ ] End-to-end approval workflows

---

## REFERENCES

- **Related Specs:** `PROPERTY_WORKBENCH_SPEC_v3.md`, `ADR_0001-0004.md`
- **Implementation:** `os-platform/core/terra-pilot/`
- **Tests:** `os-platform/core/terra-pilot/__tests__/`

---

**END OF SPECIFICATION**
