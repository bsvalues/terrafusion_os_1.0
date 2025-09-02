# Terrafusion Cosmic API Gateway

This directory contains the Kong API Gateway configuration for the Terrafusion Cosmic Platform, providing advanced API management with cosmic-aware features.

## Architecture Overview

```
Internet → Kong Gateway → Backend Services
              ↓
        [Plugins/Policies]
              ↓
    - Authentication (JWT/OAuth)
    - Authorization (OPA)
    - Rate Limiting (Redis)
    - Caching (Quantum Cache)
    - Routing (Neural Router)
    - Monitoring (Prometheus)
```

## Components

### 1. **Kong Gateway**
- Enterprise-grade API gateway
- Plugin-based architecture
- High-performance proxy
- Kubernetes-native with CRDs
- Cosmic platform extensions

### 2. **PostgreSQL Database**
- Stores Kong configuration
- Route definitions
- Consumer credentials
- Plugin configurations
- Custom cosmic routing tables

### 3. **Redis Cache**
- Rate limiting backend
- Session storage
- Quantum cache implementation
- Neural routing cache
- High-availability with Sentinel

### 4. **Open Policy Agent (OPA)**
- Fine-grained authorization
- Cosmic clearance levels
- Service-to-service policies
- Quantum authentication
- Real-time policy evaluation

### 5. **Custom Plugins**
- **Cosmic Neural Router**: AI-driven request routing
- **Quantum Cache**: 11-dimensional caching system
- **Consciousness Integration**: Awareness-based routing
- **Holographic Mirroring**: Request replication

## Quick Start

### 1. Create Namespace and Secrets

```bash
kubectl create namespace kong

# Create secrets
kubectl create secret generic kong-secrets \
  --from-literal=kong-pg-password=your-secure-password \
  --from-literal=redis-password=your-redis-password \
  --from-literal=jwt-secret=your-jwt-secret \
  --from-literal=admin-token=your-admin-token \
  -n kong
```

### 2. Deploy the Stack

```bash
# Using kustomize
kubectl apply -k .

# Or deploy components individually
kubectl apply -f postgres.yaml
kubectl apply -f redis.yaml
kubectl apply -f opa-policies.yaml
kubectl apply -f kong.yaml
kubectl apply -f kong-plugins.yaml
kubectl apply -f kong-routes.yaml
```

### 3. Wait for Services

```bash
# Check deployment status
kubectl get pods -n kong

# Wait for Kong to be ready
kubectl wait --for=condition=ready pod -l app=kong-proxy -n kong --timeout=300s
```

### 4. Initialize Database

```bash
# Run Kong migrations
kubectl exec -it deployment/kong-proxy -n kong -- kong migrations bootstrap
kubectl exec -it deployment/kong-proxy -n kong -- kong migrations up
```

### 5. Access Services

```bash
# Port-forward for local testing
kubectl port-forward -n kong svc/kong-proxy 8000:80 8443:443

# Admin API (internal only)
kubectl port-forward -n kong svc/kong-admin 8001:8001

# Test the gateway
curl http://localhost:8000/api/v1/cosmic/health
```

## Configuration

### Routes

Routes are defined in `kong-routes.yaml` and support:
- Path-based routing
- Host-based routing
- Method-based routing
- WebSocket support
- Custom cosmic routing

Example route configuration:
```yaml
- path: /api/v1/cosmic
  service: cosmic-orchestrator
  plugins:
    - cosmic-rate-limiting
    - cosmic-jwt
    - cosmic-cors
```

### Plugins

#### Built-in Plugins
- **JWT Authentication**: Token-based auth
- **Rate Limiting**: Request throttling
- **CORS**: Cross-origin support
- **Prometheus**: Metrics collection
- **Request/Response Transformer**: Header manipulation

#### Custom Cosmic Plugins
- **Cosmic Neural Router**: 
  ```lua
  neural_score = calculate_neural_score()
  if neural_score > 0.8 then
    route_to_primary()
  end
  ```

- **Quantum Cache**:
  - 11-dimensional cache keys
  - Quantum state awareness
  - Coherence time management

### Authentication

1. **JWT Tokens**:
   ```bash
   # Generate JWT token
   jwt_token=$(jwt encode \
     --secret "your-jwt-secret" \
     --sub "user123" \
     --exp $(date -d "+1 hour" +%s) \
     '{"cosmic_clearance": 4}')
   
   # Use in requests
   curl -H "Authorization: Bearer $jwt_token" \
     http://localhost:8000/api/v1/cosmic
   ```

2. **API Keys**:
   ```bash
   # Create consumer
   curl -X POST http://localhost:8001/consumers \
     -d "username=cosmic-user"
   
   # Add API key
   curl -X POST http://localhost:8001/consumers/cosmic-user/key-auth \
     -d "key=your-api-key"
   ```

### Authorization (OPA)

OPA policies support:
- Cosmic clearance levels (1-5)
- Neural network authentication
- Quantum entanglement verification
- Service account permissions

Example policy:
```rego
allow if {
    input.request.headers["X-Cosmic-Clearance"][_] >= 4
    input.request.path == "/api/v1/cosmic/admin"
}
```

## Monitoring

### Metrics

Prometheus metrics available at `/metrics`:
- Request rate
- Latency distribution
- Error rates
- Cache hit/miss ratio
- Neural routing decisions
- Quantum cache efficiency

### Health Checks

```bash
# Gateway health
curl http://localhost:8000/health

# Admin API health
curl http://localhost:8001/status

# Individual service health
curl http://localhost:8100/status
```

### Logging

Logs are sent to Fluentd with cosmic metadata:
- Request ID
- Neural score
- Quantum state
- Routing decisions
- Cache status

## Advanced Features

### Neural Load Balancing

```yaml
neural_routing_enabled: on
neural_model_path: /models/neural
neural_inference_timeout: 100ms
```

The neural router considers:
- Historical performance
- Current load
- Cosmic alignment
- Quantum entanglement state

### Quantum Caching

```yaml
quantum_cache_enabled: on
quantum_dimensions: 11
quantum_coherence_time: 3600s
```

Features:
- Multi-dimensional cache keys
- Quantum state preservation
- Entanglement-based invalidation
- Coherence time management

### Interplanetary Routing

```yaml
interplanetary_mode: enabled
mars_relay_endpoint: mars.terrafusion.cosmic:8443
latency_compensation: adaptive
```

Supports:
- High-latency compensation
- Store-and-forward
- Quantum tunneling
- Predictive routing

## Security

### TLS Configuration

```bash
# Create TLS certificate
kubectl create secret tls cosmic-platform-tls \
  --cert=cert.pem \
  --key=key.pem \
  -n terrafusion-cosmic
```

### Rate Limiting

Configure in `kong-plugins.yaml`:
```yaml
config:
  minute: 100
  hour: 10000
  policy: redis
```

### IP Whitelisting

```yaml
config:
  allow:
    - 10.0.0.0/8
    - 172.16.0.0/12
```

## Troubleshooting

### Common Issues

1. **Database Connection**:
   ```bash
   kubectl logs -n kong deployment/kong-proxy | grep postgres
   ```

2. **Plugin Errors**:
   ```bash
   kubectl exec -n kong deployment/kong-proxy -- kong config db_export
   ```

3. **Route Not Found**:
   ```bash
   curl http://localhost:8001/routes
   ```

### Debug Mode

Enable debug logging:
```bash
kubectl set env deployment/kong-proxy -n kong KONG_LOG_LEVEL=debug
```

### Performance Tuning

1. **Increase Workers**:
   ```yaml
   nginx_worker_processes: 8
   nginx_worker_connections: 32768
   ```

2. **Optimize Buffers**:
   ```yaml
   nginx_http_client_body_buffer_size: 16k
   mem_cache_size: 256m
   ```

3. **Database Connections**:
   ```yaml
   pg_max_concurrent_queries: 200
   ```

## Maintenance

### Backup

```bash
# Backup Kong configuration
kubectl exec -n kong deployment/kong-proxy -- kong config db_export > kong-backup.yaml

# Backup PostgreSQL
kubectl exec -n kong statefulset/postgres -- pg_dump -U kong kong > kong-db-backup.sql
```

### Updates

```bash
# Update Kong version
kubectl set image deployment/kong-proxy -n kong kong-proxy=kong:3.4-alpine

# Update plugins
kubectl apply -f kong-plugins.yaml
```

### Monitoring

- Check metrics: http://localhost:8001/metrics
- View routes: http://localhost:8001/routes
- List consumers: http://localhost:8001/consumers
- Plugin status: http://localhost:8001/plugins

## Support

For issues:
- Check Kong logs: `kubectl logs -n kong -l app=kong-proxy`
- Review OPA decisions: `kubectl logs -n kong -l app=opa`
- Monitor Redis: `kubectl exec -n kong statefulset/redis -- redis-cli ping`
- Contact Cosmic Ops team

🌌 Gateway to the Cosmic Platform! 🌌