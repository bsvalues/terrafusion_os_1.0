# Slice 2: Policy Contracts

## Scope

This slice contains all policy schema contracts from Phase 4B telemetry.

## Files Included

```
policy/contracts/agent-events.v1.schema.json    # Agent event schema
policy/contracts/agent-status.v1.schema.json    # Agent status schema
policy/contracts/system-health.v1.schema.json   # System health schema
policy/contracts/examples/                      # Example payloads
```

## Schema Summary

### agent-events.v1
Defines the structure for agent lifecycle events:
- `agent_started`, `agent_stopped`, `agent_error`
- Includes timestamp, agent ID, metadata

### agent-status.v1
Defines agent status reporting:
- Status enum: `idle`, `active`, `busy`, `error`
- Metrics: tasks completed, uptime, memory usage

### system-health.v1
Defines system health aggregation:
- Overall status: `healthy`, `degraded`, `critical`
- Component health breakdown
- Resource utilization metrics

## Contract Guarantees

1. **Backward compatible**: v1 schemas will not break consumers
2. **Additive only**: New fields are optional
3. **Validated at build**: Gates validate payloads against schemas

## Related Slices

- Slice 1: CI/Gates (consumes schemas for validation)
- Slice 3: Backend telemetry (implements these schemas)

---

*Slice 2 - Policy Contracts - Phase 4B*
