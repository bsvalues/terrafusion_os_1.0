# TerraFusionPro Logging Setup

This directory contains configurations for setting up centralized logging for the TerraFusionPro platform using the Elastic Stack (Elasticsearch, Kibana, Filebeat).

## Overview

The logging stack includes:

- **Elasticsearch**: For storing and indexing logs
- **Kibana**: For log visualization and analysis
- **Filebeat**: For collecting and shipping logs from services

## Prerequisites

- Kubernetes cluster with Helm installed
- `kubectl` configured to access your cluster
- Sufficient cluster resources for the logging stack (memory, CPU, storage)

## Installation

### 1. Create the logging namespace

```bash
kubectl create namespace logging
```

### 2. Create required secrets

```bash
# Create secret for Elasticsearch
kubectl create secret generic elasticsearch-credentials \
  --namespace logging \
  --from-literal=password=YOUR_SECURE_PASSWORD

# Create secret for Kibana
kubectl create secret generic kibana-credentials \
  --namespace logging \
  --from-literal=password=YOUR_SECURE_PASSWORD

# Create secret for Filebeat
kubectl create secret generic filebeat-credentials \
  --namespace logging \
  --from-literal=password=YOUR_SECURE_PASSWORD
```

### 3. Deploy Elasticsearch using Helm

```bash
helm repo add elastic https://helm.elastic.co
helm repo update

# Deploy Elasticsearch with custom values
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --values elastic-values.yaml
```

### 4. Deploy Kibana

```bash
# Deploy Kibana with custom values
helm install kibana elastic/kibana \
  --namespace logging \
  --values kibana-values.yaml
```

### 5. Deploy Filebeat

```bash
# Deploy Filebeat with custom values
helm install filebeat elastic/filebeat \
  --namespace logging \
  --values filebeat-values.yaml
```

### 6. Verify the installation

```bash
# Check Elasticsearch pods
kubectl get pods -n logging -l app=elasticsearch-master

# Check Kibana pods
kubectl get pods -n logging -l app=kibana

# Check Filebeat pods
kubectl get pods -n logging -l app=filebeat

# Get the Kibana URL
kubectl get ingress -n logging kibana
```

## Accessing Kibana

Access Kibana via the ingress URL (e.g., https://kibana.terrafusionpro.com) or via port-forwarding:

```bash
kubectl port-forward -n logging svc/kibana-kibana 5601:5601
```

Login with:
- Username: kibana
- Password: [value from the kibana-credentials secret]

## Index Patterns

Filebeat automatically creates index patterns in Kibana for the following log types:

1. **TerraFusionPro services**: `terrafusionpro-*`
2. **Kubernetes logs**: `filebeat-*`

## Dashboards

The following dashboards are available in Kibana:

1. **TerraFusionPro Microservices Logs**: Overview of all microservice logs
2. **API Gateway Logs**: API Gateway specific logs
3. **Database Logs**: PostgreSQL database logs
4. **Kubernetes Logs**: Container and pod logs

## Log Retention

Logs are managed through index lifecycle management (ILM) with the following phases:

- **Hot**: Recent logs, actively written and queried
- **Warm**: Older logs (7+ days), less frequently accessed
- **Cold**: Archive logs (30+ days), rarely accessed
- **Delete**: Logs older than 90 days are automatically deleted

## Adding Custom Log Parsing

To add custom log parsing for new services or specific log formats:

1. Edit the `filebeat-values.yaml` file
2. Add a new processor or module configuration under the `filebeatConfig.filebeat.yml` section
3. Upgrade the Filebeat deployment:

```bash
helm upgrade filebeat elastic/filebeat \
  --namespace logging \
  --values filebeat-values.yaml
```

## Integrating Services with Logging

To ensure your services integrate properly with the logging system:

1. Use structured JSON logging when possible
2. Include relevant metadata in logs (service name, version, environment)
3. Use appropriate log levels (INFO, WARN, ERROR)
4. Ensure container logs are written to stdout/stderr

## Troubleshooting

1. **Elasticsearch cluster yellow/red status:**
   - Check cluster health: `kubectl exec -it -n logging elasticsearch-master-0 -- curl -u elastic:YOUR_PASSWORD http://localhost:9200/_cluster/health?pretty`
   - Verify storage availability and resource limits

2. **Kibana can't connect to Elasticsearch:**
   - Check Elasticsearch service is running
   - Verify Kibana has the correct credentials

3. **Missing logs in Kibana:**
   - Check Filebeat is running on all nodes
   - Verify log paths are correctly configured
   - Check for log format issues

4. **Performance issues:**
   - Review Elasticsearch resource allocation
   - Consider adjusting ILM policies for faster rotation
   - Check disk I/O performance

## Scaling the Logging Stack

For larger deployments, consider:

1. **Elasticsearch:**
   - Increase replicas for better performance and resilience
   - Use dedicated master, data, and coordinating nodes
   - Allocate more resources (CPU, memory, disk)

2. **Filebeat:**
   - Adjust resource limits based on log volume
   - Consider using queue settings for buffering

3. **Kibana:**
   - Increase replicas for high availability
   - Allocate more resources for heavy dashboarding