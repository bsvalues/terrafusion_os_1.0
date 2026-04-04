### TerraFusion Scope & Lane Management: A Developer’s Navigation Guide

#### 1\. Introduction: The Prime Directive and the Core Governance Surface

In the TerraFusion architecture, system stability is not a suggestion; it is a hard requirement enforced by automated protocols. All contributors—whether human developers or AI agents—operate under a singular, non-negotiable mandate known as the Prime Directive.**THE PRIME DIRECTIVE:**  Do not destabilize the Core Governance Surface.The  **Core Governance Surface**  encompasses the foundational types, configurations, and tool registry logic that underpin the entire platform. This surface is the "Source of Truth" for the Agent Mesh and the CI/CD pipeline.**The "So What?":**  Understanding these boundaries is mandatory to prevent "Silent Punts"—instances where a developer or agent deflects a task due to unrecognized scope restrictions. Failure to respect these lanes results in immediate PR rejection by the SEAL (Security/Enforcement Automated Layer). You must internalize these boundaries before initialization to ensure your work aligns with the active architectural state rather than legacy fragments.While the Core Governance Surface defines the rules of the system, the following "Lanes" define where your implementation logic must reside.

#### 2\. The Green Zones: Navigating Lane A and Lane B

TerraFusion development is strictly partitioned into two operational lanes. Modifications outside these specific paths are blocked by default.| Lane Name | Scope/Pathing | Functional Purpose || \------ | \------ | \------ || **Lane A: Core Governance** | os-platform/core/pilot/**, os-platform/core/types/**, tools/registry/**, tsconfig.core.json, package.json, .github/workflows/** (gate wiring only) | Management of the system "brain" and "skeleton," including core logic, type definitions, and CI/CD gate orchestration. || **Lane B: OS Shell UI** | frontend/apps/os-shell/**, frontend/packages/**, .governance/workflow/**, .governance/mesh/** | Development of the user experience, shared primitives, and the documentation governing workflow and agent coordination. |

##### The Active UI Surface

A common failure point for new contributors is identifying the "living" code versus legacy debris. The following four paths constitute the  **Active UI Surface** :

1. **frontend/apps/os-shell/**\*\* : The active source for the Desktop, Workbench, and MWUX.  
2. **frontend/packages/**\*\* : Shared UI primitives and internal libraries.  
3. **frontend-v2/**\*\* : The designated target for future migrations.  
4. **experience-suite/temp-extract/experience-suite-v5/**\*\* : The current active experience suite iteration.While these areas are open for modification, they are surrounded by strictly off-limits legacy structures that will trigger immediate scope blocks.

#### 3\. The Forbidden Zones: Avoiding Legacy and Core AI Systems

The following "Forbidden Scopes" are protected by the governance layer. Any attempt to modify these will result in an immediate build failure or PR block.

* **/ARCHIVE/**  
* *Learner's Note:*  Historical reference only. Any change here is a violation of versioning integrity.  
* **specialized/**\*\*  **and**  **applications/**\*\*  
* *Learner's Note:*  Restricted modules requiring specific security clearance; out of scope for general development.  
* **os-platform/ai-systems/ai-systems/ai-swarm/**\*\*  
* *Learner's Note:*  The core AI coordination mesh. Unsanctioned changes here destabilize agent autonomy across the platform.  
* **frontend/src/**\*\*  
* *Learner's Note:*  The legacy root. Currently contains 97+ errors; touching this reintroduces dead code and breaks the build.  
* **frontend/components/**\*\*  
* *Learner's Note:*  An old component tree that is no longer maintained. Use frontend/packages/\*\* for primitives instead.**WARNING:**  Do not confuse the pathing.  **frontend/apps/os-shell/**\*\*  is the  **ACTIVE**  UI and is where you must work.  **frontend/src/**\*\*  is the  **LEGACY**  root and is strictly  **FORBIDDEN** .Once you have identified your allowed path, you must adhere to the technical environment constraints within that scope.

#### 4\. Technical Guardrails: Ports and Required Gates

TerraFusion utilizes Zero-Tolerance rules for environment configuration. Hardcoded ports are a primary cause of deployment failure and are strictly prohibited.

##### Port Rules (Zero Tolerance)

You must use the designated environment variables to ensure compatibility with the containerized mesh.| Requirement | ❌ Forbidden (Hardcoded) | ✅ Required (Environment Variable) || \------ | \------ | \------ || **Frontend Port** | localhost:3000 | localhost:${TF\_FRONTEND\_PORT:-3102} || **API Port** | localhost:5000 | localhost:${TF\_API\_PORT:-5046} || **Variable Assignment** | port=3000 | process.env.TF\_FRONTEND\_PORT \\|\\| 3102 |

##### Required Gates

Before any PR is eligible for review, the following sequence must be completed successfully.  **The SEAL will block any PR that fails these gates.**

1. **Type-Check:**  Execute pnpm run type-check to validate TS integrity.  
2. **Core Node Test:**  Execute node \--test os-platform/core/tests/phase83-tools.test.mjs to verify tool infrastructure.When these boundaries or gates are violated, the system triggers a formal rejection protocol to guide the contributor back to the allowed surface.

#### 5\. The Scope Blocking Protocol: Navigating Rejection

To prevent agents and developers from silently deflecting tasks, TerraFusion mandates the  **Silent Punt Prevention**  protocol. If a scope violation occurs, the contributor must generate a report that identifies the failure and provides a valid path forward.

##### Mock Scope Error Report

This format is required for all blocked operations to maintain the "Doc-First Law."**🚫 SCOPE BLOCKEDAttempted:**  frontend/src/legacy/Component.tsx**Rule:**  "frontend/src/\*\* ← LEGACY ROOT (97+ errors, do not touch)"**Alternative:**  frontend/apps/os-shell/src/components/NewComponent.tsx**Recommendation:**  Implement in os-shell instead of legacy root.These boundary rules are strictly integrated into the mandatory workflow documentation requirements.

#### 6\. Workflow Triggers and Artifacts

Non-trivial changes require deterministic documentation. If a PR touches specific surface areas, the governance artifacts must be updated.

##### Non-Trivial Change Triggers

Documentation is mandatory when a PR affects:

* **UI Surface:**  Changes to frontend/apps/os-shell/src/\*\*.  
* **Core Governance:**  Changes to os-platform/core/pilot/\*\*.  
* **Infrastructure:**  Changes to tools/registry/\*\*.  
* **New Initiatives:**  Any machine-checkable "New Initiative" (defined below).

##### Machine-Checkable "New Initiative" Definitions

A  **New Initiative**  requires full documentation from scratch. This is defined as any change that:

1. Introduces a new top-level surface (new page, module, or tool category).  
2. Changes the authentication/authorization model.  
3. Adds a new data write-lane (new database table or API mutation).  
4. Creates a new design language or materials system.  
5. Adds a new integration (external API or external system connection).

##### The Four Required Artifacts

Artifact,Path,Primary Insight Provided  
Discovery,discovery.md,"Documented intent, constraints, and mandatory Q\&A."  
Research,research.md,Domain research and evaluation of prior art.  
Plan,plan.md,"Definition of phases, tasks, and ""Definition of Done"" (DoD)."  
Progress,progress.md,"Real-time status, commit history, and next steps."

##### Solo-Dev Mode (TF\_SOLO\_DEV=1)

When the TF\_SOLO\_DEV flag is active, the workflow is optimized for speed while maintaining the Core Governance Surface.

* **Reuse Allowed:**  If you are performing incremental work on an existing plan, you may reuse existing discovery.md and research.md files.  
* **Full Requirement:**  You must only create all four documents from scratch when your work meets the "New Initiative" criteria listed above.  
* **Minimum Update:**  For any triggering change, plan.md and progress.md  **must**  be updated.**NEVER skip directly to implementation. SEAL will block non-compliant PRs.**

