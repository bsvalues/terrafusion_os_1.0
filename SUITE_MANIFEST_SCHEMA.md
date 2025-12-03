# TerraFusion OS — Suite Manifest Schema (v1.0)

**Defines the orchestration contract for suites under the Native Shell.**

---

## Purpose

This schema establishes the standard contract for **TerraFusion Suites** — the product packaging layer that orchestrates 42 web apps + 17 native shell modules into 9 hot-swappable domain suites.

**Counties buy SUITES, not individual apps.**

Each suite manifest tells the Native Shell:
- Which web apps to mount
- Which native panels to load
- Which AI agents to inject
- Which backend APIs are available
- What permissions are required

---

## TypeScript Interface Definition

```typescript
/**
 * TerraFusion OS — Suite Manifest Schema (v1.0)
 * Defines the orchestration contract for suites under the Native Shell.
 */

export interface SuiteManifest {
  /** Unique suite identifier (lowercase, no spaces) */
  id: string;                              // "assessment", "levy", "gis"

  /** Human-readable display name shown in Native Shell launcher */
  label: string;                           // "Assessment Suite", "Levy & Tax Suite"

  /** Suite classification (drives licensing + upgrade paths) */
  category: 'core' | 'premium' | 'enterprise';

  /** Web applications (React/Next.js) mounted by the Native Shell */
  webApps: string[];                       // ["terra-assessor-production", "property-workbench"]

  /** Native Shell modules (desktop panels/components rendered in shell) */
  nativeModules: string[];                 // ["assessment-desktop-panel", "parcel-detail-panel"]

  /** Rust/Performance engines required by this suite */
  engines: string[];                       // ["valuation-engine", "gis-engine"]

  /** Backend APIs (.NET, Rust, or mixed) exposed to the suite */
  apis: string[];                          // ["assessment-api", "tf-substrate-core/property"]

  /** AI agents injected into the AI Drawer when the suite is active */
  aiAgents: AIAgent[];

  /** Role requirements for UI access (RBAC enforcement) */
  permissions: string[];                   // ["ROLE_APPRAISER", "ROLE_CHIEF_APPRAISER"]

  /** Is this suite hot-swappable without OS reboot? */
  hotSwappable: boolean;                   // true = can enable/disable at runtime

  /** Optional dependencies (suite must load these first) */
  dependencies?: string[];                 // ["assessment"] - Levy depends on Assessment

  /** Integrations with external systems (PACS, GIS servers, etc.) */
  integrations?: Integration[];
}

export interface AIAgent {
  /** Unique agent identifier */
  id: string;                              // "assessment-copilot", "levy-clerk-assistant"
  
  /** Display name shown in AI Drawer */
  name: string;                            // "Assessment Assistant", "Levy Clerk Assistant"
  
  /** Capabilities/skills this agent provides */
  capabilities: string[];                  // ["explain-cama", "parcel-summaries", "market-analysis"]
}

export interface Integration {
  /** Integration identifier */
  id: string;                              // "pacs9", "tyler-gis", "esri-server"
  
  /** Integration type */
  type: 'pacs' | 'gis' | 'ftp' | 'cloud' | 'api';
  
  /** Endpoints exposed by this integration */
  endpoints: string[];                     // ["pacs9/levy", "pacs9/districts", "pacs9/parcels"]
}
```

---

## JSON Schema Definition

For validation tools and runtime manifest validation:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://terrafusion.gov/schemas/suite-manifest.v1.json",
  "title": "TerraFusion Suite Manifest",
  "description": "Orchestration contract for TerraFusion OS suites",
  "type": "object",
  "required": ["id", "label", "category", "webApps", "nativeModules", "engines", "apis", "aiAgents", "permissions", "hotSwappable"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "Unique suite identifier (lowercase, kebab-case)"
    },
    "label": {
      "type": "string",
      "minLength": 1,
      "description": "Human-readable display name"
    },
    "category": {
      "type": "string",
      "enum": ["core", "premium", "enterprise"],
      "description": "Suite licensing tier"
    },
    "webApps": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Web applications mounted by Native Shell"
    },
    "nativeModules": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Native shell modules/panels"
    },
    "engines": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Required Rust/performance engines"
    },
    "apis": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Backend APIs exposed to suite"
    },
    "aiAgents": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "capabilities"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique agent identifier"
          },
          "name": {
            "type": "string",
            "description": "Display name"
          },
          "capabilities": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Agent capabilities/skills"
          }
        }
      },
      "description": "AI agents for AI Drawer"
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^ROLE_[A-Z_]+$"
      },
      "description": "Required roles for access"
    },
    "hotSwappable": {
      "type": "boolean",
      "description": "Can enable/disable at runtime?"
    },
    "dependencies": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Suite dependencies (load order)"
    },
    "integrations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type", "endpoints"],
        "properties": {
          "id": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": ["pacs", "gis", "ftp", "cloud", "api"]
          },
          "endpoints": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "description": "External system integrations"
    }
  }
}
```

---

## Field Explanations

### Core Identity Fields

**`id`** (required)
- Unique identifier for the suite
- Format: lowercase, kebab-case (e.g., "levy", "assessment", "gis-pro")
- Used for suite registry, routing, and dependency resolution
- **Must be unique** across all TerraFusion suites

**`label`** (required)
- Human-readable name shown in Native Shell launcher
- Examples: "Assessment Suite", "Levy & Tax Suite", "GIS Pro Suite"
- Displayed in UI tiles, breadcrumbs, and navigation

**`category`** (required)
- Licensing tier for county sales
- Values:
  * `core` - Included in base TerraFusion license
  * `premium` - Optional add-on suites
  * `enterprise` - Advanced features for large counties

### Application Orchestration Fields

**`webApps`** (required)
- Array of web application identifiers
- These are React/Next.js apps mounted by the Native Shell
- Examples: `["terra-assessor-production", "property-workbench", "costforge-ai"]`
- Native Shell loads these into iframe/webview containers
- Each app name must match registered app ID in app registry

**`nativeModules`** (required)
- Array of native shell module identifiers
- These are desktop panels/components rendered directly in the shell
- Examples: `["assessment-desktop-panel", "parcel-detail-panel", "sketch-editor-panel"]`
- Native Shell renders these as native UI components (not webviews)
- Module names must match registered module IDs in module registry

**`engines`** (required)
- Array of Rust/performance engine identifiers
- Backend engines required for suite functionality
- Examples: `["valuation-engine", "gis-engine", "sync-engine"]`
- Native Shell ensures these engines are running before suite activation
- Engines provide high-performance computation for frontend apps

**`apis`** (required)
- Array of backend API endpoint identifiers
- APIs exposed to web apps and native modules in this suite
- Examples: `["assessment-api", "tf-substrate-core/property", "levy-api"]`
- Format: `service-name` or `service-name/route-prefix`
- Native Shell configures API routing and authentication for these endpoints

### AI & Intelligence Fields

**`aiAgents`** (required)
- Array of AI agent configurations
- Agents injected into AI Drawer when suite is active
- Each agent has:
  * `id` - Unique identifier (e.g., "assessment-copilot")
  * `name` - Display name (e.g., "Assessment Assistant")
  * `capabilities` - Array of skills (e.g., ["explain-cama", "parcel-summaries"])
- AI Drawer shows only agents relevant to active suite

### Security & Access Control Fields

**`permissions`** (required)
- Array of role identifiers required for suite access
- Format: `ROLE_[NAME]` (uppercase with underscores)
- Examples: `["ROLE_APPRAISER", "ROLE_CHIEF_APPRAISER", "ROLE_LEVY_CLERK"]`
- Native Shell enforces RBAC: users without required roles cannot access suite
- Multiple roles = ANY role grants access (OR logic)

**`hotSwappable`** (required)
- Boolean indicating if suite can be enabled/disabled at runtime
- `true` = Suite can be activated/deactivated without OS reboot
- `false` = Suite requires OS restart to enable/disable
- Most suites should be `true` for operational flexibility

### Dependency & Integration Fields

**`dependencies`** (optional)
- Array of suite IDs that must load before this suite
- Examples: `["assessment"]` - Levy Suite depends on Assessment Suite
- Native Shell enforces load order: dependencies load first
- Prevents runtime errors from missing data/services
- Circular dependencies are **not allowed** and will fail validation

**`integrations`** (optional)
- Array of external system integration configurations
- Each integration has:
  * `id` - Integration identifier (e.g., "pacs9", "tyler-gis")
  * `type` - Integration type (pacs, gis, ftp, cloud, api)
  * `endpoints` - Array of endpoint paths (e.g., ["pacs9/levy", "pacs9/districts"])
- Native Shell configures connectivity and authentication for external systems

---

## Validation Rules

### Required Field Validation
- All fields marked `(required)` must be present
- Arrays cannot be empty for required fields
- Empty arrays are allowed for optional fields

### ID Format Validation
- Suite `id` must match pattern: `^[a-z][a-z0-9-]*$`
- Must start with lowercase letter
- Can contain lowercase letters, numbers, hyphens
- No spaces, underscores, or uppercase letters

### Permission Format Validation
- All permissions must match pattern: `^ROLE_[A-Z_]+$`
- Must start with `ROLE_`
- Must be uppercase with underscores only
- Examples: ✅ `ROLE_APPRAISER`, ❌ `role_appraiser`, ❌ `APPRAISER`

### Dependency Validation
- Dependencies must reference valid suite IDs
- Circular dependencies are **not allowed**
- Suite cannot depend on itself
- All dependency suites must exist in suite registry

### Integration Type Validation
- Integration `type` must be one of: `pacs`, `gis`, `ftp`, `cloud`, `api`
- Endpoints array cannot be empty if integrations are specified

---

## Examples

### Minimal Valid Manifest

```json
{
  "id": "example",
  "label": "Example Suite",
  "category": "core",
  "webApps": ["example-app"],
  "nativeModules": [],
  "engines": ["example-engine"],
  "apis": ["example-api"],
  "aiAgents": [],
  "permissions": ["ROLE_USER"],
  "hotSwappable": true
}
```

### Complete Manifest (All Fields)

See `suites/levy-suite.json` for production example with all fields populated.

---

## Suite Registry Integration

The Native Shell loads suite manifests from:
- `suites/*.json` - Suite manifest files
- Suite Registry Service - Runtime suite loader

**Load Order:**
1. Parse all `suites/*.json` files
2. Validate against schema
3. Resolve dependencies (topological sort)
4. Load suites in dependency order
5. Register with Native Shell launcher

**Runtime Behavior:**
- Native Shell reads manifests to populate launcher tiles
- User selects suite → Native Shell loads webApps + nativeModules
- AI Drawer injects aiAgents for active suite
- Permissions enforced via RBAC middleware
- Hot-swappable suites can be toggled without restart

---

## Versioning

**Current Version:** v1.0

**Schema Evolution:**
- Breaking changes → Major version bump (v2.0)
- New optional fields → Minor version bump (v1.1)
- Backward compatible with v1.0 manifests

---

## References

- **Full Example:** `suites/levy-suite.json`
- **App Mapping:** `SUITE_APP_MAPPING.md`
- **Architecture:** `.github/copilot-instructions.md`

---

**This schema defines the product architecture of TerraFusion OS.**
**Counties buy suites. Suites orchestrate apps. Apps deliver value.**
