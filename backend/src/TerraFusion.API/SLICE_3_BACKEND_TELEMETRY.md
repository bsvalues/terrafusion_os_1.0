# Slice 3: Backend Telemetry API

## Scope

This slice contains the backend API endpoints for telemetry and system health from Phase 4B.

## Files Included

```
backend/src/TerraFusion.API/Controllers/
  TelemetryController.cs      # Agent telemetry endpoints
  SystemHealthController.cs   # System health endpoints

backend/src/TerraFusion.API/Models/
  Telemetry/
    AgentEventDto.cs          # Agent event data transfer object
    AgentStatusDto.cs         # Agent status DTO
    SystemHealthDto.cs        # System health DTO

backend/tests/TerraFusion.Unit.Tests/
  Telemetry/
    TelemetryControllerTests.cs
    SystemHealthControllerTests.cs
```

## API Endpoints

### Telemetry
- `POST /api/telemetry/events` - Submit agent events
- `GET /api/telemetry/agents/{id}/status` - Get agent status
- `GET /api/telemetry/agents` - List all agents with status

### System Health
- `GET /api/health/system` - Overall system health
- `GET /api/health/components` - Component-level health breakdown
- `GET /api/health/metrics` - Resource utilization metrics

## Integration Points

1. **Frontend Sentinel**: Consumes telemetry endpoints
2. **Policy Contracts**: Validates against v1 schemas
3. **SEAL Gate**: Backend Fast Gate runs unit tests

## Performance Targets

- P95 response time: <50ms for status endpoints
- P95 response time: <100ms for event ingestion
- Throughput: 10,000 events/second

## Related Slices

- Slice 2: Policy contracts (schema definitions)
- Slice 4: OS Shell sentinel (consumes these APIs)

---

*Slice 3 - Backend Telemetry - Phase 4B*
