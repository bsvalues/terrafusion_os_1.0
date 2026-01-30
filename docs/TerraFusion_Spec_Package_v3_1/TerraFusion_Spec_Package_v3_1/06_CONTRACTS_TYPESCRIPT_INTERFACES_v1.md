# Contracts — TypeScript Interfaces (v1)

These are copy/paste-ready interface shapes for contract validation.  
(Exact filenames/paths will follow your repo conventions.)

## 1) Workbench Suite Contribution
```ts
export type WorkbenchTabSlug = "summary"|"forge"|"atlas"|"dais"|"dossier"|"pilot";

export type DataClassification = "PUBLIC"|"CONFIDENTIAL"|"RESTRICTED";

export interface WorkbenchContext {
  countyId: string;
  userId: string;
  roles: string[];
  parcelId: string;
  workMode: "overview"|"valuation"|"mapping"|"admin"|"case";
}

export interface TabDefinition {
  slug: WorkbenchTabSlug;
  title: string;
  owner: "os"|"forge"|"atlas"|"dais"|"dossier"|"pilot";
  requiredClaims?: string[];
  requiredLicense?: string;
  route: string; // `/property/:parcelId/<slug>`
}

export interface Badge {
  key: string;
  label: string;
  severity?: "info"|"warn"|"danger";
  classification: DataClassification;
  tooltip?: string;
}

export interface BadgeProvider {
  owner: "forge"|"atlas"|"dais"|"dossier"|"os";
  getBadges(parcelId: string, ctx: WorkbenchContext): Promise<Badge[]>;
}

export interface QuickActionDefinition {
  id: string;
  label: string;
  toolId: string;
  toolParams?: Record<string, unknown>;
  requiredClaims?: string[];
}

export interface WorkbenchContribution {
  getTabs(ctx: WorkbenchContext): Promise<TabDefinition[]>;
  badgeProvider?: BadgeProvider;
  getQuickActions?(ctx: WorkbenchContext): Promise<QuickActionDefinition[]>;
}
```

## 2) TerraPilot Tool Contracts
```ts
export type PilotMode = "pilot"|"muse"|"both";
export type ToolRisk = "read_only"|"write_low"|"write_high"|"irreversible";

export interface RiskPolicy {
  risk: ToolRisk;
  requiresConfirmation: boolean;
  requiresReasonCode: boolean;
  requiresSupervisor: boolean;
}

export interface ToolDescriptor {
  toolId: string;
  title: string;
  mode: PilotMode;
  risk: ToolRisk;
  suiteOwner: "os"|"forge"|"atlas"|"dais"|"dossier";
  requiredClaims: string[];
  enabledBy?: { license?: string; policyFlag?: string };
  writesTo: string[]; // must match write-lane names
}

export interface ToolExecutionContext {
  countyId: string;
  userId: string;
  userClaims: string[];
  enabledTools: string[];
  parcelId?: string;
  dossierId?: string;
  currentMode: "pilot"|"muse";
  correlationId: string;
}

export interface ToolResult {
  ok: boolean;
  summary: string;
  payloadRef?: string; // blob pointer
}
```
