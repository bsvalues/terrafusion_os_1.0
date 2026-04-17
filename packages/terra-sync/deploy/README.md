# TerraFusion Sync v4 — Local Dev Topology

`docker compose -f docker-compose.dev.yml up -d` starts the full phase-2 pipeline dependencies locally.

## Services

| Service | Host URL | Container Network |
| --- | --- | --- |
| Kafka broker | `localhost:29092` | `kafka:9092` |
| Kafka Connect (Debezium 2.7) | `http://localhost:8083` | `connect:8083` |
| RisingWave psql | `postgresql://root@localhost:4566/dev` | `risingwave:4566` |
| RisingWave meta | `localhost:5691` | `risingwave:5691` |
| RisingWave dashboard | `http://localhost:1250` | - |
| OTel Collector (OTLP gRPC) | `localhost:4317` | `otel-collector:4317` |
| OTel Collector (OTLP HTTP) | `localhost:4318` | `otel-collector:4318` |
| Prometheus | `http://localhost:9091` | `prometheus:9090` |
| Grafana | `http://localhost:3001` | - |

Grafana default credentials: `admin` / `admin`.

## Bring up

```bash
cd packages/terra-sync/deploy
docker compose -f docker-compose.dev.yml up -d
```

Wait ~60s for Kafka + Connect to settle, then sanity-check:

```bash
curl -sf http://localhost:8083/ | head -5
# Expected: Kafka Connect worker JSON
curl -sf http://localhost:4566 || true
# RisingWave frontend is psql-only — use a client
```

## Tear down

```bash
docker compose -f docker-compose.dev.yml down -v
```

The `-v` flag removes the named volumes; data is ephemeral in dev mode.

## Notes

- `KAFKA_AUTO_CREATE_TOPICS_ENABLE` is `true` in dev so connectors and producers self-provision. Phase 2 Task 8 provisions topics explicitly with correct partition/retention config.
- RisingWave runs in `playground` (single-node, ephemeral). Phase 2 Task 13 documents a production-shape deployment.
- OTel Collector uses the `debug` exporter — all spans/logs dump to stdout. View with `docker compose logs -f otel-collector`. Production uses Jaeger/Tempo instead.
- Prometheus scrapes `host.docker.internal:9090` (the `terra-sync-control` metrics sidecar running on the host, not in compose). Override via `prometheus.yml` if running in CI or headless.
- The `terra-sync-control` binary itself is NOT in this compose file — you run it on the host so you can iterate on Rust without rebuilding a container. Phase 3 adds a prod-shaped compose with the control-plane containerized.

## Ports summary

- `2181` Zookeeper
- `29092` Kafka (host-facing)
- `8083` Kafka Connect
- `4566/5691/1250` RisingWave
- `4317/4318` OTel Collector
- `9091` Prometheus (9090 inside container; remapped to avoid collision with the control-plane `/metrics` on 9090)
- `3001` Grafana (3000 inside container; remapped to avoid collision with typical dev frontends)
