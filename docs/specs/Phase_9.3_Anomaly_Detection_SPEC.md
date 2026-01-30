# Phase 9.3: Anomaly Detection & Guard Hardening SPEC

## 1. Overview
Current state: The system is "Sealed" (no jq, strict binding) but "Silent" (no active alerting).
Target state: The system "Screams" when anomalies occur (down, high errors, high latency).

## 2. Success Criteria
1.  **Unit Tests Passing:** `StateMeshGuard` logic verified via `TerraFusion.Tests.Unit`.
2.  **Prometheus Rules Loaded:** `alert_rules.yml` visible in Prometheus UI.
3.  **Chaos Verification:** `trigger_alert.sh` successfully transitions an alert from `INACTIVE` -> `PENDING` -> `FIRING`.

## 3. Implementation Steps

### Task 0: The Guard Test (Hardening)
1.  Refactor `StateMeshGuard` logic into `TerraFusion.API.Utilities.StateMeshGuard` (static class) to enable isolation testing.
2.  Update `StateMeshGuardHostedService` to use the static class.
3.  Create `backend/tests/TerraFusion.Tests.Unit` project.
4.  Implement `StateMeshGuardTests.cs`.
5.  Run `dotnet test`.

### Task 1: Prometheus Rules (The Law)
1.  Create `config/prometheus/alert_rules.yml`.
    - **IronBodyDown**: `up{service_name="terrafusion-iron"} == 0` (Critical)
    - **HighErrorRate**: `rate(http_request_duration_seconds_count{status=~"5.."}[1m]) > 0` (Warning)
    - **CortexLatency**: `http_request_duration_seconds_bucket{le="2.0", service_name="terrafusion-cortex"}` check (Warning)
2.  Update `config/prometheus.yml` to load rules.
3.  Update `docker-compose.observability.yml` to mount rules file.

### Task 2: Chaos Verification (The Drill)
1.  Create `scripts/chaos/trigger_alert.sh`.
    - Hits a 500 endpoint (or non-existent) to generate 4xx/5xx.
    - Polls `localhost:9090` to confirm alert firing.
