
# Grafana Dashboards — Flexible Label Sets

These dashboards are designed to work across different Prometheus label schemas and ingress controllers.

## Variables
- **$ds**: Prometheus datasource
- **$namespace**: Kubernetes namespace
- **$workload**: regex for pods/deployments (default `.*grfe.*`)
- **$ingress_mode**: nginx | envoy | traefik | none
- **$container_metric_set**: cadvisor | ksm

## Metric Sources Covered

### Ingress
- **NGINX**: `nginx_ingress_controller_requests`, `nginx_ingress_controller_request_duration_seconds_bucket`
- **Envoy**: `envoy_http_downstream_rq_total`, `envoy_http_downstream_rq_time_bucket`, `envoy_http_downstream_rq_xx`
- **Traefik**: `traefik_service_requests_total`, `traefik_service_request_duration_seconds_bucket`

### Container / Node
- **cAdvisor-style**: `container_cpu_usage_seconds_total`, `container_memory_usage_bytes`, `container_memory_working_set_bytes`
- **Kube-State-Metrics**: leave the defaults unless you expose usage via kubelet/container exporter;
  for requests/limits add panels using `kube_pod_container_resource_requests` / `kube_pod_container_resource_limits`.

## Tips
- If you only use one ingress, hide the other targets from the legend or fork the dashboard.
- Update the *host* variable query in `golden_ui_flexible.json` if you don’t run NGINX (e.g., query `label_values(envoy_http_downstream_rq_total, envoy_cluster_name)`).
- If your metrics add extra labels (e.g., `job`, `instance`, `cluster`), you can append them to the `sum by (...)` clauses.
