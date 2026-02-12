
# TerraFusion XMTP Observability Pack

This pack includes:
- `xmtp_prometheus_rules.yaml`: Recording + alerting rules for XMTP gateway, push worker, AI relay, KMS, and federation.
- `xmtp_mesh_grafana_dashboard.json`: Grafana dashboard for live monitoring.
- Metric contract to implement in services (gateway, push worker, AI router, federation relays).

## Required Metrics (export from your services)

### Counters
- `xmtp_messages_total{consent,scope}` — messages sent/received (scope: dm, case, channel, agent)
- `xmtp_errors_total{component,code}` — error events
- `xmtp_push_deliveries_total{status}` — success|failed sends
- `xmtp_ai_router_requests_total{route}` — AI relay routed requests
- `xmtp_threads_total` — total active threads
- `xmtp_threads_records_enabled` — threads with Records toggle ON

### Gauges
- `xmtp_inbox_state{consent}` — current count of inboxes by consent
- `xmtp_ai_router_capacity` — configured throughput capacity
- `xmtp_federation_link_up{peer}` — 1=up,0=down
- `terrafusion_phase_progress_percent{phase}` — 0–100 readiness per enhancement phase

### Histograms (ms)
- `xmtp_message_latency_ms_bucket`
- `xmtp_push_latency_ms_bucket`
- `xmtp_kms_escrow_latency_ms_bucket`
- `xmtp_federation_link_latency_ms_bucket`

## Import Instructions

### Prometheus
1. Add `xmtp_prometheus_rules.yaml` to your Prometheus server `rule_files`.
2. Reload Prometheus.

### Grafana
1. Import `xmtp_mesh_grafana_dashboard.json` in Grafana → Dashboards → Import.
2. Set the Prometheus data source.

## SLO Targets
- Message p95 latency: **≤ 300 ms**
- Push delivery success: **≥ 99.5%**
- AI router utilization: **≤ 80% sustained**
- Federation link health: **100% up** (alert at < 100%)
- Records coverage (threads with Records ON): **≥ 20%** for record-eligible workflows

## Notes
- `terrafusion_phase_progress_percent{phase="2"}` etc. should be written by your CI or deployment pipeline as gauges (or via Pushgateway) to visualize program progress on the dashboard.
