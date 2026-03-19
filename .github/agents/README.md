# TerraFusion OS Custom Agents

This directory contains GitHub Copilot custom agent configurations for TerraFusion OS development.

## Available Agents

### 1. TF-OS (TerraFusion Elite Government OS Engineering Agent)
**File**: `TF-OS.agent.md`

A machine-precision, evidence-based systems engineer operating at MIT PhD-level rigor. This agent:
- Manages, audits, repairs, and optimizes the TerraFusion OS codebase
- Works across Rust, .NET, React, TypeScript, Docker, YAML, Terraform, SQL
- Enforces FISMA-High, NIST 800-53, and TerraFusion County isolation rules
- Validates AI Consciousness, multi-service orchestration, and microservice health
- Maintains championship standards: <10ms latency, zero assumptions, 100% evidence-based

**Usage**: Invoke with `@TF-OS` in GitHub Copilot for comprehensive OS engineering tasks.

### 2. Claude-Code_IDE (TerraFusion Claude Code Quantum Orchestrator Agent)
**File**: `Claude-Code_IDE.agent.md`

A Claude Code–aware engineering agent that orchestrates the development environment. This agent:
- Configures and optimizes `.claudecode` IDE environment
- Manages MCP servers, workflows, and health checks
- Wires up Playwright, React, .NET, tests, and automation
- Enforces government compliance (FISMA, NIST 800-53, WCAG 2.1, SOC 2)
- Tunes workflows for AI swarm testing and quantum optimization

**Usage**: Invoke with `@Claude-Code_IDE` for IDE configuration and MCP orchestration.

---

## Phase-Governance Swarm (Slice 25.5)

Five tightly-scoped agents that implement the TerraFusion Phase A–E execution
law. Together they form a single-writer, dual-read-only, hard-stop-enforced
Copilot-native agent swarm. Invoke via `@tf-phase-orchestrator` to start a
phase; the orchestrator coordinates the rest.

#### Governance Posture (non-negotiable)

These agents are **bounded governance/tooling scaffolding** under `.github/agents/**`.
They are classified as follows:

- ✅ Agent-governance and operator-tooling scaffolding
- ✅ Complement the canonical workflow governance files
- ❌ Do **not** replace `plan.md`, `progress.md`, or hard-stop decisions
- ❌ Do **not** grant execution authority on their own
- ❌ Do **not** constitute a product phase opening
- ❌ Do **not** lift any active hard stop (CP-W2-8 or successor)
- ❌ Do **not** authorize Wave 3–5 motion or any runtime behavior change

**Hard-stop rule**: A hard stop issued in `progress.md` by `@tf-checkpoint`
requires a new explicit human go/no-go before any implementation phase opens.
These agent files are subordinate to that decision — they exist to make the
eventual execution more disciplined, not to replace the human gate.

**Write authority summary**: `@tf-writer` is the sole writer for source/test
files. `@tf-checkpoint` is the sole writer for governance files (`progress.md`
+ evidence notes). All other agents in this swarm are read-only.

### 3. tf-phase-orchestrator
**File**: `tf-phase-orchestrator.agent.md`

Phase-control only. Reads the charter, enforces allowed/forbidden file sets,
invokes subagents in order, and blocks phase exit until the closure wall passes.
Does not write source code.

**Usage**: `@tf-phase-orchestrator` — start here for every new bounded phase.

### 4. tf-writer
**File**: `tf-writer.agent.md`

The sole write-capable subagent per phase. Implements only in `allowed_files`.
No scope expansion, no adjacent cleanup, no speculative improvements.

**Usage**: Invoked by `@tf-phase-orchestrator` in Phase C (implementation)
and Phase D (closure-blocker fixes only).

### 5. tf-contract-truth
**File**: `tf-contract-truth.agent.md`

Read-only. Verifies backend routes, DTOs, auth boundaries, and persistence
schemas. Classifies findings as `CONFIRMED`, `DIVERGENCE`, `GAP`, or
`UNRESOLVED`. Runs in Phase B alongside `@tf-proof-audit`.

**Usage**: Invoked by `@tf-phase-orchestrator` in Phase B (parallel
read-only truth pass).

### 6. tf-proof-audit
**File**: `tf-proof-audit.agent.md`

Read-only. Designs the proof wall (Phase B) and verifies it (Phase D).
Quarantines stale tests, maps the RED→GREEN checklist, and reports pass/fail
on every gate command. Never approximates a result.

**Usage**: Invoked by `@tf-phase-orchestrator` in Phase B and Phase D.

### 7. tf-checkpoint
**File**: `tf-checkpoint.agent.md`

Writes the closure entry in `.governance/workflow/progress.md` and issues
the hard stop. Records what closed, what remains deferred, and the next entry
condition. Phase E only.

**Usage**: Invoked by `@tf-phase-orchestrator` in Phase E (checkpoint + hard stop).

---

## Agent Configuration

All agents follow the GitHub Copilot custom agent configuration format:

```yaml
---
description: >
  Brief description of the agent's purpose and capabilities
tools:
  - "*"  # Wildcard enables all available tools
---
# Agent documentation in Markdown
```

### Required Fields
- `description`: Clear explanation of agent capabilities
- `tools`: Array of tool names or `["*"]` for all tools

### Tool Configuration
Both agents use `tools: ["*"]` to enable full access to:
- `bash` - Command execution
- `view` - File and directory viewing
- `edit` - File modification
- `create` - File creation
- `search` - Code and repository search
- GitHub-specific tools (PRs, issues, workflows)
- All other available Copilot tools

## Validation

Validate agent configurations using the provided script:

```bash
bash .github/agents/validate-agents.sh
```

Or with Python:

```python
python3 -c "$(cat validate-agents.py)"
```

## Creating New Agents

To create a new custom agent:

1. Create a new `.agent.md` file in this directory
2. Add YAML frontmatter with `description` and `tools`
3. Document the agent's capabilities in Markdown
4. Run validation to ensure correct configuration
5. Test the agent with GitHub Copilot

Example:

```markdown
---
description: >
  Specialized agent for TerraFusion database optimization
tools:
  - "*"
---
# Database Optimization Agent

This agent specializes in...
```

## Best Practices

1. **Always specify tools**: Never leave `tools: []` empty
2. **Use wildcard for full-featured agents**: `tools: ["*"]`
3. **Document capabilities clearly**: Explain what the agent does
4. **Follow TerraFusion standards**: Maintain championship-level quality
5. **Test before committing**: Validate configuration works

## Troubleshooting

### Agent has no tool access
**Symptom**: Agent reports "Only report_progress tool available"

**Solution**: Check that `tools` field is not empty:
```yaml
# ❌ Wrong
tools: []

# ✅ Correct
tools:
  - "*"
```

### Agent not showing up
**Symptom**: Agent not available in Copilot

**Solutions**:
1. Ensure file has `.agent.md` extension
2. Verify file is in `.github/agents/` directory
3. Check YAML frontmatter is properly formatted
4. Restart VS Code or reload GitHub Copilot

## Documentation

- [Agent Fix Documentation](./AGENT_FIX_DOCUMENTATION.md) - Detailed fix for tool configuration issue
- [GitHub Copilot Custom Agents](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
- [Creating Custom Agents](https://docs.github.com/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)

## Support

For issues or questions about custom agents:
1. Check agent configuration with validation script
2. Review AGENT_FIX_DOCUMENTATION.md
3. Consult GitHub Copilot documentation
4. Contact TerraFusion DevOps team

---

**Government. Transcended.**
**Execute with excellence.**
