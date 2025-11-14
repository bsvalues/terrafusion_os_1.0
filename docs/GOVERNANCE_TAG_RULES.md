# TerraFusion Code Intelligence — Governance Rules

## Required Conventions
1. **Format**: `# [MODULE] TAG: message` for Tier-2 and Tier-3 tags.
2. **Allowed TAGS**: See taxonomy (Tier1/Tier2/Tier3).
3. **COMPLIANCE (TERRA-LEVY)**: Must reference **RCW** or **DOR** in message.
4. **No mixed casing**: Tags are uppercase.
5. **Keep messages actionable**: Start with a verb when possible.

## Tag Taxonomy

### Tier 1: Operational
- **TODO**: Action items and pending work
- **FIXME**: Bugs and issues requiring immediate attention
- **NOTE**: Important information and reminders
- **TEST**: Testing requirements and test cases
- **OPTIMIZE**: Performance improvements needed
- **DOC**: Documentation updates required

### Tier 2: System Intelligence
- **AI**: AI agent coordination, training, optimization
- **SYNC**: Data synchronization and integration
- **DATAFLOW**: Data pipeline and flow management
- **SECURITY**: Security considerations and trust fabric
- **PERFORMANCE**: System performance and optimization
- **UI/UX**: User interface and experience improvements
- **COMPLIANCE**: Regulatory and legal requirements

### Tier 3: Architecture Governance
- **ARCH**: Architecture decisions and patterns
- **FACTOR12**: 12-factor app compliance
- **TRUSTFABRIC**: Trust and security framework
- **QUANTUM**: Quantum optimization features
- **TRANSCENDENCE**: Advanced system capabilities
- **CONSCIOUSNESS**: AI consciousness and coordination

## Module Scopes
Must use one of these predefined module names in `[MODULE]` prefix:
- TERRA-SYNC, TERRA-FLOW, TERRA-LEVY, COSTFORGE-AI
- TERRA-AGENT, TERRA-ASSISTANT, TERRA-DASHBOARD
- BCBS-GIS-PRO, BS-INCOME-VALUATION
- TERRA-PRIMEVIEW, TERRA-ENTERPRISE, TERRA-DEVELOPMENT
- SECURITY, MCP-SERVERS, SYSTEM-PROMPTS-AI-TOOLS, MONITORING

## Review Gates
- PRs fail if **SECURITY** or **FIXME** counts rise vs baseline.
- PRs fail on missing `[MODULE]` for Tier-2/3 tags.
- TERRA-LEVY COMPLIANCE tags must reference RCW or DOR.

## Lifecycle
- Weekly: export `docs/TODO_INTEL.json`, publish quick `docs/STATUS.md`.
- Monthly: update `docs/CODE_INTEL_BASELINE.json` after milestone closure.

## Examples
```
# [TERRA-LEVY] COMPLIANCE: RCW 84.55 levy limit validation
# [TERRA-SYNC] SYNC: backoff + jitter on FTP reconnects
# [COSTFORGE-AI] AI: retrain cost model for MRA inputs
# [TERRAFLOW] DATAFLOW: emit quantum gauge results into bus
# [SECURITY] TRUSTFABRIC: SBOM attest with Cosign before release
```
