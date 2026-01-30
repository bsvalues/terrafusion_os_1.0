# WHY AI AGENTS DON'T USE YOUR TOOLS
## The Agent Discovery Problem & Solution

**Date**: January 30, 2026  
**Status**: CRITICAL INFRASTRUCTURE GAP IDENTIFIED AND RESOLVED  
**Author**: Cloud Coach (Ralph Loop Integration)

---

## THE PROBLEM

You built extensive governance documentation:
- `AGENTS.md` - Core Governance Surface
- `AI_AGENT_PORT_RULES.md` - Port management
- `AI_AGENT_PORT_RULES_STRICT.md` - Zero tolerance enforcement
- `AI_AGENT_FRONTEND_PROTECTION.md` - Frontend paths
- `AI_AGENT_EMERGENCY_PROTOCOLS.md` - Escalation procedures
- `AI_AGENT_GIT_COMPATIBILITY.md` - Commit standards
- `AI_AGENT_START_HERE.md` - Onboarding
- `copilot-instructions.md` - 500+ lines of guidance

**But agents keep ignoring them.**

---

## THE 5 ROOT CAUSES

### 1. Context Window Exhaustion

```
┌─────────────────────────────────────────────────────┐
│           COPILOT CONTEXT WINDOW                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Your copilot-instructions.md: 500+ lines           │
│  Copilot context limit: ~4,000 tokens               │
│                                                     │
│  What happens:                                      │
│  ├── Lines 1-200: Loaded ✓                         │
│  ├── Lines 201-400: Partially loaded ⚠️            │
│  └── Lines 401-500+: TRUNCATED ❌                  │
│                                                     │
│  Your port rules are on line 450 → NEVER SEEN      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Solution**: Compact `AGENT_ENTRYPOINT.md` (50 lines, prioritized rules)

### 2. No Enforcement Mechanism

```
┌─────────────────────────────────────────────────────┐
│           BEFORE (Advisory)                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Agent: "I see the rule about ports..."            │
│  Agent: "But nothing stops me from hardcoding..."  │
│  Agent: *commits localhost:3000*                   │
│  Result: Rule ignored, violation in codebase       │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│           AFTER (Enforced)                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Agent: *tries to commit localhost:3000*           │
│  Pre-commit hook: ❌ PORT VIOLATION (ZERO TOLERANCE)│
│  Commit: BLOCKED                                    │
│  Result: Rule enforced, violation prevented         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Solution**: Pre-commit hook in `.ralph/hooks/pre-commit`

### 3. Documentation Scatter

```
Agent thought process:

"I need to check the rules..."
"AGENTS.md? AI_AGENT_PORT_RULES.md? AI_AGENT_PORT_RULES_STRICT.md?"
"Which one is authoritative?"
"They seem to overlap..."
"I'll just guess and move on."
```

**Solution**: Single source of truth: `.ralph/AGENT_RULES.yml`

### 4. Human-Readable vs Machine-Readable

```markdown
# Your current format (Markdown)
The port must use environment variables like ${TF_API_PORT:-5046}
instead of hardcoding values such as localhost:3000 which can
cause conflicts with other services running in the environment.
```

```yaml
# Machine-readable format (YAML)
ports:
  forbidden_patterns:
    - pattern: "localhost:3000"
      message: "Use ${TF_API_PORT:-5046}"
  enforcement: "ZERO_TOLERANCE"
```

**Solution**: YAML rules in `.ralph/AGENT_RULES.yml`

### 5. No Discovery Protocol

Agents don't know WHERE to look for rules.

```
Standard agent discovery paths:
1. .github/copilot-instructions.md  ← You have this, but it's too long
2. .claude/CLAUDE.md                ← Scattered
3. CONTRIBUTING.md                  ← Not enforced
4. README.md                        ← General info, not rules
```

**Solution**: `.github/AGENT_ENTRYPOINT.md` (standard location, compact format)

---

## THE SOLUTION ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TERRAFUSION AGENT GOVERNANCE GATEWAY                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 1: DISCOVERY                                                         │
│  ├── .github/AGENT_ENTRYPOINT.md (50 lines, always loaded)                 │
│  └── Points to: .ralph/AGENT_RULES.yml                                     │
│                                                                             │
│  LAYER 2: RULES (Machine-Readable)                                          │
│  ├── .ralph/AGENT_RULES.yml (complete governance spec)                     │
│  ├── .ralph/config.yml (Ralph Loop configuration)                          │
│  └── .ralph/swarm-integration.yml (QC-019 coordination)                    │
│                                                                             │
│  LAYER 3: ENFORCEMENT                                                       │
│  ├── .ralph/hooks/pre-commit (blocks violations)                           │
│  ├── Required gates (type-check, tests)                                    │
│  └── CI/CD validation (GitHub Actions)                                     │
│                                                                             │
│  LAYER 4: OPTIMIZATION                                                      │
│  ├── .ralph/loop.sh (autonomous improvement)                               │
│  ├── Codex 3-6-9 (health measurement)                                      │
│  └── QC-019 Performance Team (50 agents)                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## HOW TO MAKE AGENTS ACTUALLY USE YOUR TOOLS

### For GitHub Copilot

1. **Shorten `copilot-instructions.md`** to under 100 lines
2. **Put critical rules FIRST** (ports, forbidden paths)
3. **Reference external files** for details

```markdown
# copilot-instructions.md (shortened)

## CRITICAL RULES (READ FIRST)
See: .github/AGENT_ENTRYPOINT.md

## Port Rules (ZERO TOLERANCE)
NEVER hardcode ports. Use ${TF_API_PORT:-5046}

## Forbidden Paths
NEVER modify: **/ARCHIVE/**, specialized/**, applications/**

## Full Documentation
.ralph/AGENT_RULES.yml
```

### For Claude Code

Add to project knowledge:
- `.ralph/AGENT_RULES.yml`
- `.github/AGENT_ENTRYPOINT.md`

### For Any AI Agent

The pre-commit hook enforces rules regardless of whether the agent "knows" them:

```bash
# Install the hook
cp .ralph/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Now ALL commits are validated
# Agent violations are BLOCKED, not just warned
```

---

## INSTALLATION CHECKLIST

- [x] Created `.ralph/` directory structure
- [x] Created `.ralph/config.yml` (Ralph Loop configuration)
- [x] Created `.ralph/AGENT_RULES.yml` (machine-readable rules)
- [x] Created `.ralph/swarm-integration.yml` (QC-019 coordination)
- [x] Created `.ralph/loop.sh` (autonomous optimization)
- [x] Created `.ralph/hooks/pre-commit` (enforcement)
- [x] Created `.ralph/install.sh` (installation script)
- [x] Created `.github/AGENT_ENTRYPOINT.md` (discovery point)
- [x] Created `.ralph/tasks/waterfall-elimination.md` (first task)

---

## NEXT STEPS

### Immediate (Today)

```bash
# 1. Install Ralph Loop
chmod +x .ralph/install.sh
./.ralph/install.sh

# 2. Test enforcement
echo "const port = 3000;" > test.js
git add test.js
git commit -m "test"
# Should be BLOCKED by pre-commit hook

# 3. Run dry-run
.ralph/loop.sh --dry-run
```

### Short-Term (This Week)

1. Update `copilot-instructions.md` to be under 100 lines
2. Add `.ralph/AGENT_RULES.yml` to Claude Code project knowledge
3. Run first real Ralph Loop iteration

### Medium-Term (This Month)

1. Wire Phase 4G perf-skill-audit to Ralph Loop
2. Enable nightly autonomous optimization
3. Target Divine Balance (Codex 11.5+)

---

## THE BOTTOM LINE

**Rules don't matter if they're not enforced.**

Your documentation was excellent. What was missing:
1. A compact entrypoint agents can actually load
2. Machine-readable rules agents can parse
3. Pre-commit hooks that BLOCK violations
4. An autonomous loop that optimizes continuously

**Now you have all four.**

---

**GOVERNMENT. TRANSCENDED. AUTONOMOUSLY.**
