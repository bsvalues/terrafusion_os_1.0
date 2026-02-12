# TerraFusionPro Monitoring Setup

This directory contains configurations for setting up comprehensive monitoring for the TerraFusionPro platform using Prometheus and Grafana.

## Overview

The monitoring stack includes:

- **Prometheus**: For metrics collection and alerting
- **Grafana**: For visualization and dashboards
- **AlertManager**: For alert routing and notifications
- **Node Exporter**: For collecting host metrics
- **Kube State Metrics**: For Kubernetes cluster metrics

## Prerequisites

- Kubernetes cluster with Helm installed
- `kubectl` configured to access your cluster
- Sufficient cluster resources for the monitoring stack

## Installation

### 1. Create the monitoring namespace

```bash
kubectl create namespace monitoring
```

### 2. Create required secrets

```bash
# Create secret for Slack webhook
kubectl create secret generic prometheus-alertmanager-slack \
  --namespace monitoring \
  --from-literal=slack-webhook-url=https://hooks.slack.com/services/YOUR_SLACK_WEBHOOK

# Create secret for PagerDuty
kubectl create secret generic prometheus-alertmanager-pagerduty \
  --namespace monitoring \
  --from-literal=pagerduty-service-key=YOUR_PAGERDUTY_KEY

# Create secret for Grafana admin password
kubectl create secret generic grafana-secrets \
  --namespace monitoring \
  --from-literal=admin-password=YOUR_SECURE_PASSWORD \
  --from-literal=smtp-password=YOUR_SMTP_PASSWORD
```

### 3. Deploy Prometheus using Helm

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Deploy Prometheus with custom values
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values prometheus-values.yaml \
  --set alertmanager.config.global.slack_api_url=YOUR_SLACK_WEBHOOK_URL \
  --set alertmanager.config.receivers[0].slack_configs[0].api_url=YOUR_SLACK_WEBHOOK_URL \
  --set alertmanager.config.receivers[1].pagerduty_configs[0].service_key=YOUR_PAGERDUTY_SERVICE_KEY
```

### 4. Deploy Grafana (if not included in kube-prometheus-stack)

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Deploy Grafana with custom values
helm install grafana grafana/grafana \
  --namespace monitoring \
  --values grafana-values.yaml
```

### 5. Verify the installation

```bash
# Check Prometheus pods
kubectl get pods -n monitoring -l app=prometheus

# Check Grafana pods
kubectl get pods -n monitoring -l app.kubernetes.io/name=grafana

# Get the Grafana URL
kubectl get ingress -n monitoring grafana
```

## Accessing the Dashboards

- **Prometheus**: Access via port-forwarding or ingress (if configured)
  ```bash
  kubectl port-forward -n monitoring svc/prometheus-server 9090:9090
  ```

- **Grafana**: Access via the ingress URL or port-forwarding
  ```bash
  kubectl port-forward -n monitoring svc/grafana 3000:80
  ```
  Login with:
  - Username: admin
  - Password: [value from the grafana-secrets]

## Custom Dashboards

The TerraFusionPro-specific dashboards include:

1. **Service Overview**: Overall health and performance of all services
2. **API Gateway**: API Gateway specific metrics
3. **Microservices**: Individual microservice performance
4. **Database**: PostgreSQL database performance
5. **Infrastructure**: Kubernetes cluster and node metrics

## Alert Configuration

Alerts are configured in the `prometheus-values.yaml` file under `additionalPrometheusRules`. Key alerts include:

- Service availability
- High response times
- High error rates
- Database performance issues
- Node resource constraints

Alerts are routed to:
- Slack for warning alerts
- PagerDuty for critical alerts

## Adding Service Monitors

To monitor a new service, add a ServiceMonitor resource:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: new-service-monitor
  namespace: monitoring
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: your-service-name
  namespaceSelector:
    matchNames:
      - your-service-namespace
  endpoints:
    - port: metrics
      path: /metrics
      interval: 15s
```

## Troubleshooting

1. **Prometheus not collecting metrics:**
   - Check ServiceMonitor configurations
   - Ensure services have correct labels
   - Verify metrics endpoints are accessible

2. **Grafana can't connect to Prometheus:**
   - Check Grafana datasource configuration
   - Verify Prometheus service is running

3. **Alerts not firing:**
   - Check AlertManager configuration
   - Verify webhook URLs and service keys

## Further Customization

- Edit `prometheus-values.yaml` to adjust resource limits, retention periods, and alert rules
- Edit `grafana-values.yaml` to add more dashboards or plugins
- Create additional ServiceMonitors for new components