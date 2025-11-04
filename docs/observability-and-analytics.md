## Observability & Analytics Design — TerraFusion Quantum Research

Purpose
- Provide an enterprise-grade telemetry and analytics architecture for experiment and agent observability that supports both real-time UI needs (SignalR + metrics) and deep post-hoc analysis (batch/OLAP).

Goals
- Low-latency ingest for live UI (<= 3s), high-throughput collection for thousands of agents.
- Reproducible experiment analytics: every experiment produces a canonical summary and raw telemetry archive.
- Strong correlation across traces, metrics, and logs via a single traceId/experimentId/agentId tagging strategy.

Architecture components (recommended)
- Metrics/Monitoring: Prometheus for realtime metrics scraping; use PushGateway for ephemeral workers if needed.
- Tracing: OpenTelemetry (server + agents) -> Jaeger (dev) and OTLP -> collector -> to long-term storage (Tempo/Jaeger + object storage snapshots).
- Logs: Structured Serilog (backend) + application/json to file and to a central shipper (Loki or ELK). Include tags: experimentId, agentId, countyId, userId.
- Long-term telemetry store: ClickHouse or TimescaleDB for high-cardinality agent telemetry and fast analytics.
- Dashboards: Grafana for system & experiment dashboards; embed key Grafana panels into the UI via read-only tokens.

Event tagging and IDs (contract)
- experimentId: UUID for the run; included in all metrics/logs/traces for that run.
- agentId: UUID per agent instance.
- traceId: OpenTelemetry trace id for request/agent lifecycle.
- countyId: tenant context; must be present on any data touching county data.

Metric naming conventions
- tera.experiment.<experimentId>.metric.<name> (use label-based metrics in Prometheus: experiment_id, agent_id, county_id)
- tera.agent.cpu_seconds_total{experiment_id, agent_id}
- tera.agent.inference_time_seconds{experiment_id, agent_id}

SignalR + Live UX
- Use ` /hubs/experiments` to broadcast ExperimentUpdate events. For high-volume agent telemetry send aggregate deltas over SignalR and push detailed telemetry to ClickHouse; UI links to drill-down via REST endpoints.

Experiment provenance & storage
- Store experiment manifest (JSON) in Experiments table. Include dataset pointer (S3 path), model pointer (registry id), commit hash, seed, env, and package versions.
- Archive raw telemetry: push per-run telemetry to a bucket (S3/MinIO) with path `experiments/{experimentId}/telemetry/` and keep a canonical summary in DB for quick UI use.

Analytics pipeline
1. Ingest: agents push metrics/logs to Prometheus/Loki/OpenTelemetry collector.
2. Enrichment: Collector attaches experimentId/agentId/countyId and forwards to ClickHouse/Timescale for analysis and to Grafana for dashboards.
3. Batch analysis: TerraFusion.StatisticalEngine consumes archived telemetry and computes ratio-studies, bootstraps, COD/PRD and stores summaries in DB.
4. Notification: If metrics breach thresholds (Prometheus alerting), trigger canary rollback automation.

Dashboards (must-have)
- System Overview: active agents, host utilization, active experiments
- Experiment Summary: reward curves, median/mean metrics, p95 latency, agent health
- Statistical Diagnostics: ratio-study results (median, COD, PRD), calibration plots
- Compliance: audit events and data access by county

Privacy and retention
- County data must be redacted/hashed for research views if policy requires. Retention rules controlled by tenant config; archive raw telemetry to cold storage.

Quick implementation checklist (first sprint)
- Add OpenTelemetry SDK to backend services and agent runtime.
- Create Prometheus scrape config for API, Consciousness, AI modules.
- Provision Grafana with initial dashboards and set up dashboard JSON in repo under `docs/grafana/` for versioning.
- Add telemetry labels to existing SignalR/agent messages: experimentId, agentId, countyId.

Notes
- Use existing `TerraFusion.Consciousness` and `TerraFusion.AI` to instrument agent lifecycle. Prioritize tagging and trace propagation.
