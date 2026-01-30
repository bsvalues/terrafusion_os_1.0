# TerraFusion AI Engineering Prompts

> Standardized slash commands for TerraFusion Elite Government OS development

**Version**: 1.0.0
**Status**: ACTIVE

---

## Available Commands

| Command | Purpose | File |
|---------|---------|------|
| `/tf-execute` | Full build loop with spec-lock, tests, implementation, breaker | [tf-execute.md](tf-execute.md) |
| `/tf-break` | Standalone breaker agent for CI and security reviews | [tf-break.md](tf-break.md) |
| `/tf-speclock` | Create spec-lock + tests only (no implementation) | [tf-speclock.md](tf-speclock.md) |
| `/tf-spec` | Spec-lock template reference | [spec-lock-templates.md](spec-lock-templates.md) |

---

## Quick Reference

### `/tf-execute` — Full Build Loop

```
/tf-execute project=TerraFusion.API feature="SSE diagnostics" area=backend risk=high
```

**Phases**:
1. Baseline (evidence)
2. Spec-Lock (freeze contracts)
3. Success Criteria + Tests (before code)
4. Implementation (Builder Agent)
5. Breaker Agent (attack)
6. Regression + Lock-in

---

### `/tf-break` — Breaker Agent Only

```
/tf-break project=TerraFusion.API scope=full
/tf-break project=grafana scope=spec-lock area=dashboards
```

**Attacks**:
- Authorization bypass
- Input validation fuzzing
- Concurrency / race conditions
- State corruption
- Spec-lock violations
- Resource exhaustion

---

### `/tf-speclock` — Spec + Tests Only (No Implementation)

```
/tf-speclock project=TerraFusion.API surface=api name="Diagnostics SSE" area=backend
/tf-speclock project=os-shell surface=ui name="Intent Panel" area=frontend
```

**Creates**:
- Frozen spec-lock document
- Enforcement tests (fail on drift)
- Auto-registers in INDEX.json

---

### Spec-Lock Templates

| Template | Use For |
|----------|---------|
| API | REST/GraphQL endpoints |
| UI | React components |
| Metrics | Prometheus metrics |
| Dashboard | Grafana dashboards |
| Alerts | Prometheus alerting rules |
| Events | SSE/WebSocket/Message bus |

---

## Philosophy

### Two-Agent Loop

```
┌─────────────┐    ┌─────────────┐
│   Builder   │    │   Breaker   │
│   Agent     │───▶│   Agent     │
│             │    │             │
│ Implements  │◀───│ Attacks +   │
│ features    │    │ finds bugs  │
└─────────────┘    └─────────────┘
      │                   │
      ▼                   ▼
   Tests pass        No exploits
      │                   │
      └───────┬───────────┘
              ▼
         ✅ SHIP IT
```

### Spec-Lock First

```
1. Define contract (spec-lock)
2. Write tests that enforce spec
3. Implement to satisfy tests
4. Breaker attacks implementation
5. Lock spec version + ship
```

### Evidence-Based

- No assumptions
- Commands + results documented
- Logs/traces for debugging
- Failing tests for exploits
- Metrics prove compliance

---

## Integration with Gates

These prompts align with TerraFusion's Gate system:

| Gate | Prompt Phase |
|------|--------------|
| A - Preflight | Phase 0 (Baseline) |
| B - Security | Phase 4 (Breaker) |
| C - Core Bringup | Phase 3 (Builder) |
| D - Swarm Online | — |
| E - API Surface | Phase 1 (Spec-Lock) |
| F - Validate All | Phase 5 (Regression) |

---

## Registration

### Claude Code / Claude Desktop

Add to your MCP config or system prompt.

### GitHub Copilot

Add as a custom instruction in `.github/copilot-instructions.md`:

```markdown
## AI Commands

For TerraFusion development, use these standardized commands:

- `/tf-execute` for full feature implementation
- `/tf-break` for security review
- See `.github/ai-prompts/` for full documentation
```

### VS Code

Create snippets or use prompt files:

```json
{
  "TF Execute": {
    "prefix": "/tf-execute",
    "body": [
      "/tf-execute project=${1:project} feature=\"${2:feature}\" area=${3|backend,frontend,ops,sdk|}"
    ]
  }
}
```

---

## Changelog

### v1.0.0 (2025-01-15)
- Initial release
- `/tf-execute` command
- `/tf-break` command
- Spec-lock template pack (API, UI, Metrics, Dashboard, Alerts, Events)

---

*TerraFusion Elite Government OS — Government. Transcended.*
