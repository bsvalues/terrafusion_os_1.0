# Application Monitoring Report

Generated: 2025-07-30T01:26:54.231510
Status: stopped

## Monitoring Summary

### APMBot

#### Service Performance

- **v1_foundation**:
  - Response Time (P95): 215.20ms
  - Throughput: 923 req/s
  - Error Rate: 1.27%
- **v2_project_reflex**:
  - Response Time (P95): 407.18ms
  - Throughput: 403 req/s
  - Error Rate: 0.69%
- **v3_cosmic_governance**:
  - Response Time (P95): 444.25ms
  - Throughput: 553 req/s
  - Error Rate: 1.36%

### ErrorBot

- Total Errors: 56
- Unique Errors: 21
- Affected Users: 8

#### Top Errors

- Database connection timeout in v1_foundation (90 occurrences)
- Quantum state decoherence in processor Q7 (13 occurrences)
- AI workflow validation failed for tenant-123 (50 occurrences)

### UserBot

- Active Users: 3107
- Sessions: 2125
- APDEX Score: 0.86
- NPS: 51

## Active Alerts

### Critical Alerts

- [APMBot] Error rate exceeded threshold for v1_foundation
- [ErrorBot] Error threshold exceeded for database

### Warning Alerts

- [APMBot] P95 response time exceeded threshold for v1_foundation
- [APMBot] P95 response time exceeded threshold for v2_project_reflex
- [UserBot] User experience warning: time_to_interactive
- [UserBot] User experience warning: api_response_time
- [UserBot] User experience warning: crash_rate
- [UserBot] Low completion rate for onboarding journey
- [UserBot] Low completion rate for plugin_deployment journey
- [UserBot] Low completion rate for quantum_workflow journey
- [UserBot] APDEX score below target
