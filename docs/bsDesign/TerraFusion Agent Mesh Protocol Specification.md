### TerraFusion Agent Mesh Protocol Specification

#### 1\. Architectural Foundation and Core Governance Principles

The TerraFusion Agent Mesh is the foundational strategic layer for multi-agent collaboration, engineered to manage complexity in high-velocity, autonomous development environments. Its primary objective is the preservation of the  **Core Governance Surface** , ensuring that parallel agent operations do not destabilize the underlying system architecture. By establishing a rigid hierarchy and a deterministic communication framework, the Mesh prevents the chaotic divergence and structural erosion typically associated with uncoordinated automated workflows.

##### The Doc-First Law

The Mesh operates under the "Doc-First Law," which mandates that all system evolution be preceded or accompanied by canonical documentation. This approach transforms documentation into a set of operational imperatives:

* **Architectural Drift Mitigation:**  Ensures agent actions remain aligned with the original design intent, preventing "feature creep."  
* **Long-Term Auditability:**  Provides a machine-readable trail of every decision, making system evolution transparent to both humans and agents.  
* **Context Persistence:**  Minimizes exhaustive re-processing by allowing agents to enter sessions with immediate, verified context.

##### The Prime Directive and Scope Adherence

The  **Prime Directive**  is absolute: "Do not destabilize the Core Governance Surface." This is enforced through strict adherence to Lane A (Core Governance/Pilot) and Lane B (OS Shell UI). This boundary protects the system from legacy technical debt. Specifically, agents are strictly forbidden from modifying the frontend/src/\*\* legacy root—a "dead zone" containing 97+ known errors. All active UI development must occur within frontend/apps/os-shell/\*\*. This clarity ensures that the mesh only builds upon stable, verified foundations.

#### 2\. Mesh Connectivity and Communication Standards

To prevent "broadcast storms"—where uncoordinated communication saturates system resources—the Agent Mesh utilizes structured lateral communication. This ensures signal clarity and allows parallel execution without overwhelming the host environment. The Mesh is activated via the TF\_AGENT\_MESH=1 environment variable.

##### Mesh Message Type Registry

All communication within the mesh must utilize the following functional message types:| Message Type | Functional Purpose | Expected Response Behavior || \------ | \------ | \------ || **REQUEST** | Soliciting specific information or action. | Acknowledgement and delivery of data/completion. || **PROPOSAL** | Suggesting a technical path or change. | Critical review or counter-proposal by relevant roles. || **DECISION** | Finalization of a plan or resolution. | Mandatory adherence; update to canonical docs. || **CONFLICT** | Identifying a logic lock or disagreement. | Immediate escalation to the Integrator. || **BLOCKER** | Reporting a hard stop due to scope limits. | Assessment of alternatives or scope request. || **FYI** | General information sharing; no action. | Logged; no immediate response required. || **SYNC** | Aligning state between agents. | Update of local agent context. |

##### Message Channel Architecture and Security

The Mesh utilizes  **Rate-limited routing**  to prevent information overload, directing traffic through specific functional channels:

* **\#discovery:**  Intent clarification and initial Q\&A.  
* **\#research:**  Domain findings and evidence gathering.  
* **\#architecture:**  Structural design decisions.  
* **\#build:**  Active implementation coordination.  
* **\#qa:**  Testing results and compliance verification.  
* **\#decisions:**  Exclusive channel for final determinations issued by the Integrator.The Mesh mandates absolute  **Security by Default** . All messages are subject to PII redaction and credential protection protocols. Agents are prohibited from transmitting secrets or sensitive identifiers, ensuring the system’s security posture remains uncompromised during automated exchanges.

#### 3\. Organizational Hierarchy: The Integrator and Specialised Roles

In multi-agent systems, a clear hierarchy is the only defense against race conditions and diverging codebases.

##### The Integrator Role

The  **Integrator**  holds supreme merge authority. This role is the sole owner of the plan.md and progress.md artifacts. While other agents may suggest modifications, only the Integrator may issue DECISION-type messages and finalize updates to the core planning documents.

##### Specialized Agent Roles

* **Researcher:**  Active in Discovery/Research phases; responsible for domain analysis and gathering prior art.  
* **Builder:**  Active in the Execute phase; focuses on implementation, TDD, and code production.  
* **Reviewer:**  The quality gatekeeper. This role verifies that Builder outputs pass all mandatory checks, specifically the  **Phase 83 tests**  located at os-platform/core/tests/phase83-tools.test.mjs.This separation of powers ensures that technical enthusiasm never bypasses safety. The Reviewer acts as a mandatory gate, preventing any code from reaching the Core Governance Surface without meeting the "Machine-Checkable" definition of Done (DoD).

#### 4\. Deterministic Conflict Resolution Framework

Autonomous agents require a deterministic path to resolve friction; without it, the system risks "logic locks" or infinite negotiation loops.

##### Conflict Signal Workflow

1. **Detection:**  An agent identifies a mismatch and issues a CONFLICT message with supporting evidence.  
2. **Evidence Assembly:**  Both parties present technical/governance-based justification.  
3. **Integrator Review:**  The Integrator evaluates the evidence against the Decision Rubric.  
4. **Resolution:**  The Integrator issues a DECISION message with a clear rationale.  
5. **Acknowledgement:**  The losing party must formally acknowledge the decision and realign their tasks.

##### The Decision Rubric

The Integrator evaluates all conflicts using the following prioritized hierarchy:

1. **Correctness**  
2. **Security**  
3. **Plan Alignment**  
4. **Simplicity**  
5. **Performance**  
6. **Velocity**By placing  **Security**  and  **Plan Alignment**  above  **Velocity** , the protocol prevents the mesh from taking high-risk shortcuts. Long-term stability is prioritized over temporal goals.

#### 5\. Artifact-Driven Workflow and Doc-First Execution

TerraFusion utilizes a four-phase workflow (Discovery, Research, Plan, Execute) to maintain machine-checkable compliance.

##### Required Artifacts

The following are mandatory for all non-trivial changes:

* **.governance/workflow/discovery.md**  **:**  Intent, constraints, and the 30+ question Q\&A.  
* **.governance/workflow/research.md**  **:**  Domain research and analysis of prior art.  
* **.governance/workflow/plan.md**  **:**  Phases, specific tasks, and the Definition of Done (DoD).  
* **.governance/workflow/progress.md**  **:**  Real-time status, commit history, and next steps.

##### Non-Trivial Change Triggers

Workflow documentation is mandated when a PR touches the OS Shell UI (frontend/apps/os-shell/src/**), Core Governance (os-platform/core/pilot/**), Tool Infrastructure (tools/registry/\*\*), or constitutes a  **NEW Initiative** .**Machine-Checkable "New Initiative" Definitions:**

* New top-level surfaces (pages, modules, tool categories).  
* Changes to authentication/authorization models.  
* New data write-lanes (database tables, API mutations).  
* New design languages or external API integrations.

##### Solo-Dev Mode (TF\_SOLO\_DEV=1)

In single-agent sessions, the workflow is optimized. Agents may reuse existing discovery.md sections for incremental work. However, any triggering change still requires the creation or update of plan.md and progress.md to ensure the Doc-First trail remains intact.

#### 6\. Operational Guardrails and Scope Blocking Protocol

To ensure accountability, agents are prohibited from "silent punting"—deflecting tasks without explanation.

##### Scope Blocking Protocol

If an agent is blocked by governance rules, it  **must**  output the following format:  
🚫 SCOPE BLOCKED  
Attempted: \[exact file path\]  
Rule: \[Quote specific rule from AGENT\_RULES.yml or Entrypoint\]  
Alternative: \[Nearest compliant path or action\]  
Recommendation: \[Request scope expansion OR change technical approach\]

##### Port Rules and Required Gates

TerraFusion maintains a  **Zero Tolerance**  policy for hardcoded ports. Agents must use environment variables:

* Frontend: ${TF\_FRONTEND\_PORT:-3102}  
* API: ${TF\_API\_PORT:-5046}**Mandatory Verification Gates:**  The "Execute" phase is only complete when the following commands pass:

pnpm run type-check  
node \--test os-platform/core/tests/phase83-tools.test.mjs

#### 7\. Protocol Finalization and Commit Standards

The TerraFusion Agent Mesh Protocol is the authoritative standard for all agent interactions. The  **SEAL**  mechanism is configured to automatically block any PR that fails these standards.

##### Standardized Mesh Commit Format

**Type(scope):**  subject**Evidence:**

* **Tests:**  detailed results  
* **Gates:**  pass/fail status  
* **Codex:**  score/12**Government:**  FISMA compliance status**AI-Collaboration:**  agent\_name

##### Source Documentation Index

The absolute truth for the mesh is defined in these canonical files:

* .ralph/AGENT\_RULES.yml (Core Machine Rules)  
* .governance/mesh/MESH\_GOVERNANCE.md (Lateral Communication Standards)  
* AI\_AGENT\_PORT\_RULES\_STRICT.md (Networking Constraints)  
* AI\_AGENT\_FRONTEND\_PROTECTION.md (UI Scope Definitions)  
* .governance/workflow/README.md (Workflow Execution Standards)

