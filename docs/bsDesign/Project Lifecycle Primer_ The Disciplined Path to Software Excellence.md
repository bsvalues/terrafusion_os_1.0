### Project Lifecycle Primer: The Disciplined Path to Software Excellence

In the high-stakes environment of the TerraFusion ecosystem, code is not merely written—it is engineered through a rigorous, governed lifecycle. This primer establishes the mandatory protocols required to maintain system integrity. As a developer, your primary objective is not just feature delivery; it is the absolute protection of the core environment.

#### 1\. Foundational Philosophy: The Prime Directive

The cornerstone of our engineering culture is the  **Prime Directive** :  *Do not destabilize the Core Governance Surface.*The "Core Governance Surface" represents the critical rules, types, and infrastructure that sustain the entire platform. Any instability introduced here cascades throughout the system, leading to catastrophic failure. Consequently, the ultimate goal of the developer is to operate within the governance framework to ensure that every modification is isolated, verified, and safe. This discipline is not a post-script to development; it begins long before the first line of code is written.The workflow described herein is non-negotiable. Every developer and AI agent must adhere to these phases in strict sequence. Attempting to bypass these gates or moving directly to implementation without the required architectural artifacts is a violation of governance. All non-compliant work will be summarily blocked by the  **SEAL**  safeguard.This commitment to stability starts with a formal process of inquiry to ensure the "why" and "what" are understood before the "how" is even considered.

#### 2\. Phase 1: Discovery — Understanding the 'Why' and 'What'

The Discovery Phase is the first line of defense against architectural drift. It requires the creation of the  **discovery.md**  artifact, located in .governance/workflow/.The core of this phase is the  **"30+ Questions" protocol** . This is a deliberate psychological and technical friction point. By forcing a minimum of 30 deterministic questions, the developer must identify edge cases, user impacts, and technical constraints that are often overlooked in the rush to build. This "Measure Twice, Cut Once" approach prevents expensive downstream errors by ensuring the project is defined with absolute clarity.

##### When is a Full Discovery Mandatory?

While incremental work may allow for artifact reuse, any  **"New Initiative"** —defined by the following machine-checkable triggers—demands a full, unique discovery process:| Trigger Type | Description || \------ | \------ || **New Top-Level Surface** | Introducing a new page, module, or tool category. || **Auth Changes** | Any modification to the authentication or authorization model. || **New Data Write-Lanes** | Adding a new database table or a new API mutation. || **Design Language** | Creating a new materials system or design language. || **New Integrations** | Connecting to external APIs or county system connections. |  
Clear intent leads naturally into the search for existing knowledge, ensuring we build upon a foundation of evidence.

#### 3\. Phase 2: Research — Evidence-Based Implementation

The Research Phase, documented in  **research.md** , demands a thorough investigation into domain research and "prior art." We do not reinvent the wheel; we align with existing patterns and respect established boundaries.

##### Scoping the Build

Developers must strictly adhere to defined "Lanes" and avoid "Forbidden Zones."**Allowed Scopes (The Green Zones):**

* **Lane A: Core Governance:**  os-platform/core/pilot/**, os-platform/core/types/**, tools/registry/\*\*.  
* **Lane B: OS Shell UI:**  frontend/apps/os-shell/\*\*.  **Note:**  This is the active UI surface and is NOT legacy code.**Forbidden Zones (The No-Go Zones):**  
* **/ARCHIVE/**: Deprecated files.  
* specialized/\*\* and applications/\*\*: Isolated system areas.  
* os-platform/ai-systems/ai-systems/ai-swarm/\*\*: Strictly protected AI infrastructure.  
* frontend/src/\*\*:  **LEGACY ROOT.**  This area contains 97+ legacy errors. Modification is strictly forbidden as it introduces systemic instability.Research findings provide the concrete data needed to build a roadmap that avoids these pitfalls and leverages existing system strengths.

#### 4\. Phase 3: Planning — Mapping the Execution

The  **plan.md**  artifact is the definitive blueprint for development. It must detail the Phases of work, granular Tasks, and a rigorous  **Definition of Done (DoD)** .

##### The Mandate of Rigid Planning

A rigid plan is the only defense against "project deflection." It provides three critical benefits:

1. **Elimination of "Silent Punts":**  It ensures complex problems are solved rather than ignored.  
2. **Team Alignment:**  It serves as the single source of truth for all contributors, human or AI.  
3. **Auditability:**  It provides a clear record of technical decisions for future review.

##### Scope Blocking Protocol (Silent Punt Prevention)

If an agent or developer is blocked by scope rules during planning or execution, they  **must not**  silently deflect. They are required to output the following 4-point protocol:

1. **Attempted path:**  The exact file path targeted.  
2. **Blocking rule:**  The specific rule from the entrypoint governance.  
3. **Legal alternative:**  The nearest sanctioned path (e.g., move from frontend/src to frontend/apps/os-shell).  
4. **Recommendation:**  Whether to request scope expansion or change the implementation approach.With the blueprint finalized and scope verified, the project moves from theory to the actual construction of the feature.

#### 5\. Phase 4: Execution and Progress Updates — The Disciplined Build

Execution is governed by  **Test-Driven Development (TDD)**  and tracked via the  **progress.md**  artifact. This phase is gated by strict technical requirements.

##### Required Gates

No code is considered compliant until it passes these automated checks:

*  pnpm run type-check: Strict typing consistency.  
*  node \--test os-platform/core/tests/phase83-tools.test.mjs: Core tool validation.

##### Zero Tolerance Port Rules

Hardcoded ports are a security failure and a configuration nightmare. You must use environment variables.| Forbidden (Hardcoded) | Allowed (Environment Variables) || \------ | \------ || localhost:3000 | localhost:${TF\_FRONTEND\_PORT:-3102} || localhost:5000 | localhost:${TF\_API\_PORT:-5046} || port=3000 | process.env.TF\_FRONTEND\_PORT \\|\\| 3102 |

##### Mandatory Commit Format

Every commit must provide verifiable evidence of discipline. Use the following code block format:  
type(scope): subject

Evidence:  
\- Tests: \[detailed results\]  
\- Gates: \[pass/fail status\]  
\- Codex: \[score\]/12  
Government: FISMA compliance status  
AI-Collaboration: \[agent\_name\]

This workflow ensures that even the most rapid development remains scalable and transparent to the broader ecosystem.

#### 6\. Efficiency and Scaling: Solo-Dev Mode and Mesh Coordination

The lifecycle rewards those who document thoroughly by providing optimized paths for ongoing work.

##### Solo-Dev Mode (TF\_SOLO\_DEV=1)

When the Solo-Dev flag is active, the system permits  **artifact reuse** . If a discovery.md already exists for a feature, you do not need to repeat the 30 questions for incremental updates. You are only required to create all four documents when starting a completely  **New Initiative** .

##### Agent Mesh (Multi-Agent Coordination)

In multi-agent environments (TF\_AGENT\_MESH=1), roles are strictly defined to prevent chaos:

* **Integrator:**  The sole merge authority; owns the plan and progress documents.  
* **Researcher:**  Dedicated to evidence gathering and domain findings.  
* **Builder:**  Responsible for implementation and TDD.  
* **Reviewer:**  Validates quality gates and governance compliance.

##### Conflict Resolution Rubric

When experts or agents disagree, the Integrator applies a weighted rubric where velocity is the lowest priority:

1. **Correctness**  (Non-negotiable)  
2. **Security**  (Non-negotiable)  
3. **Plan Alignment**  
4. **Simplicity**  
5. **Performance**  
6. **Velocity**  (Lowest Priority)These protocols ensure that even in complex, multi-agent sessions, the Prime Directive is maintained.

#### 7\. Summary: The Governance Safeguard

The rigor of this lifecycle is your greatest asset. It is a protective shield that ensures your work survives the scrutiny of the  **SEAL**  safeguard. Following this path is the difference between contributing to a legacy of technical debt and building a resilient, world-class platform.**The Workflow Sequence:**

1. **Discovery**  
2. **Research**  
3. **Plan**  
4. **Execute**  
5. **Progress Updates**By adhering to this disciplined path, you transform from a coder into a professional software engineer, committed to the highest standards of architectural excellence.

