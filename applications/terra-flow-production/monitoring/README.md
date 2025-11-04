# Monitoring & Observability Setup

## Prometheus
- Configured in `prometheus.yml` to scrape metrics from `web`, `db`, and `redis` services.
- Exposed on port `9090` (see `docker-compose.yml`).
- Add `/metrics` endpoint to your Flask app for Prometheus to scrape (use `prometheus_flask_exporter`).

## Grafana
- Exposed on port `3000`.
- Default login: `admin/admin` (change after first login).
- Connect to Prometheus as a data source and import dashboards for Flask, Postgres, and Redis.

## Next Steps
- Add Prometheus exporters to your Flask app and DB if not present.
- Add alerting rules in Prometheus or use Grafana Alerting.
- Expand monitoring to cloud resources as needed.
