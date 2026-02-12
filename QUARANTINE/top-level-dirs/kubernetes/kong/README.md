# 🚀 TerraFusion OS - Kong API Gateway Deployment Guide

**THE TERRAFUSION WAY: Enterprise-grade API management and security**

---

## 📋 Overview

This guide walks you through deploying Kong API Gateway for TerraFusion OS, implementing:

- ✅ **Centralized API management** for all 30+ services
- ✅ **Rate limiting** (1,000 req/min per IP)
- ✅ **JWT authentication** for secure API access
- ✅ **CORS policies** for cross-origin requests
- ✅ **SSL/TLS termination** with automatic certificate management
- ✅ **Request/response transformation**
- ✅ **Prometheus metrics** for observability
- ✅ **Bot detection** and security

---

## 🎯 Prerequisites

Before starting, ensure you have:

1. **Kubernetes Cluster** with Istio service mesh deployed
   - Task 2.1 ✅ Complete (Infrastructure Assessment)
   - Task 2.2 ✅ Complete (Istio Service Mesh)

2. **PostgreSQL Database** running in terrafusion-prod namespace
   - Required for Kong configuration storage

3. **Tools Installed:**
   - `kubectl` (configured to connect to your cluster)
   - `helm` (v3.x or later)

4. **Cluster Access:**
   ```bash
   kubectl cluster-info
   kubectl get namespace terrafusion-prod
   ```

---

## 🚀 Installation Steps

### **Step 1: Install Kong API Gateway**

#### **Option A: Linux/macOS**
```bash
cd kubernetes/kong
chmod +x install-kong.sh
./install-kong.sh
```

#### **Option B: Windows PowerShell**
```powershell
cd kubernetes\kong
.\install-kong.ps1
```

**What this does:**
- Adds Kong Helm repository
- Creates `kong` namespace
- Installs Kong with PostgreSQL backend
- Enables Kong Ingress Controller
- Configures 2 replicas for high availability
- Sets resource limits (500m-2000m CPU, 512Mi-2Gi memory)

**Expected Duration:** 3-5 minutes

---

### **Step 2: Verify Kong Installation**

```bash
# Check Kong pods
kubectl get pods -n kong

# Expected output:
# NAME                         READY   STATUS    RESTARTS   AGE
# kong-kong-xxxxxxxx           2/2     Running   0          2m
# kong-kong-xxxxxxxx           2/2     Running   0          2m

# Check services
kubectl get svc -n kong

# Expected output shows LoadBalancer for proxy
```

✅ **Success Indicator:** All pods in `Running` state with 2/2 READY

---

### **Step 3: Get Kong Admin API URL**

```bash
# Get Kong Admin API cluster IP
export KONG_ADMIN_IP=$(kubectl get svc -n kong kong-kong-admin -o jsonpath='{.spec.clusterIP}')
echo "Kong Admin API: http://$KONG_ADMIN_IP:8001"

# Test admin API
curl http://$KONG_ADMIN_IP:8001/
```

**Expected Response:**
```json
{
  "version": "3.x.x",
  "hostname": "kong-...",
  "configuration": {...}
}
```

---

### **Step 4: Apply Kong Configuration**

Deploy services, routes, and plugins:

```bash
cd kubernetes/kong

# Apply service definitions
kubectl apply -f kong-services.yaml

# Apply routing rules
kubectl apply -f kong-routes.yaml

# Apply security plugins
kubectl apply -f kong-plugins.yaml

# (Optional) Apply SSL certificates
kubectl apply -f kong-certificates.yaml
```

**Verify:**
```bash
# Check services
kubectl get kongservices -n kong

# Check routes
kubectl get kongroutes -n kong

# Check plugins
kubectl get kongplugins -n kong
kubectl get kongclusterplugins
```

---

### **Step 5: Get Kong Proxy URL**

```bash
# Get LoadBalancer IP (external access)
kubectl get svc -n kong kong-kong-proxy

# Or get IP directly
export KONG_PROXY_IP=$(kubectl get svc -n kong kong-kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Kong Proxy: http://$KONG_PROXY_IP"
```

**Configure DNS:**
```
api.terrafusion.io → $KONG_PROXY_IP
```

---

## 🔒 Security Features Enabled

### **1. Global Rate Limiting**

**Configuration:**
```yaml
Rate Limit: 1,000 requests per minute per IP
Policy: Local (distributed across Kong instances)
Scope: All routes (global plugin)
```

**What this protects against:**
- ✅ DDoS attacks
- ✅ API abuse
- ✅ Brute force attacks
- ✅ Resource exhaustion

**Test rate limiting:**
```bash
# This should work
for i in {1..100}; do curl http://$KONG_PROXY_IP/api/health; done

# After 1,000 requests in 1 minute, you'll get:
# HTTP 429 Too Many Requests
```

---

### **2. CORS (Cross-Origin Resource Sharing)**

**Configured for:**
- Backend API (`/api`)
- AI Agent (`/ai`)
- MCP Servers (`/mcp`)

**Settings:**
```yaml
Allowed Origins:
  - https://terrafusion.io
  - https://*.terrafusion.io
  - http://localhost:3000  # Development
  - http://localhost:5173  # Vite dev

Allowed Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Allowed Headers: Authorization, Content-Type, X-Request-ID
Max Age: 3600 seconds (1 hour)
Credentials: Enabled
```

**Test CORS:**
```bash
curl -i -X OPTIONS http://$KONG_PROXY_IP/api \
  -H "Origin: https://terrafusion.io" \
  -H "Access-Control-Request-Method: POST"

# Should return CORS headers
```

---

### **3. JWT Authentication**

**How it works:**
1. Client obtains JWT token from auth service
2. Client includes token in `Authorization: Bearer <token>` header
3. Kong validates token before forwarding to backend

**Enable JWT on a route:**
```bash
# Apply JWT plugin to specific route
kubectl patch kongroute backend-api-route -n kong \
  --type merge \
  -p '{"plugins": ["jwt-auth"]}'
```

**Test JWT authentication:**
```bash
# Without token (should fail)
curl http://$KONG_PROXY_IP/api

# With valid JWT token (should work)
curl http://$KONG_PROXY_IP/api \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

### **4. Request Size Limiting**

**Configuration:**
```yaml
Max Request Size: 10 MB
Applied To: All routes (global)
```

**Protects against:**
- ✅ Large file upload attacks
- ✅ Memory exhaustion
- ✅ Bandwidth abuse

---

### **5. Bot Detection**

**Allowed Bots:**
- Googlebot
- Bingbot

**Blocked:**
- Malicious crawlers
- Scrapers
- DDoS bots

---

### **6. Request ID Correlation**

**Feature:**
- Automatic `X-Request-ID` header generation
- UUID format
- Passed to all upstream services
- Included in response headers

**Benefits:**
- ✅ Distributed tracing
- ✅ Request debugging
- ✅ Log correlation

**Test:**
```bash
curl -i http://$KONG_PROXY_IP/api/health

# Response includes:
# X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

---

## 📊 Routing Configuration

### **Routes Configured**

| Route | Path | Service | Methods | Auth | Rate Limit |
|-------|------|---------|---------|------|------------|
| **Backend API** | `/api`, `/v1` | backend-api | GET, POST, PUT, PATCH, DELETE | Optional JWT | 1000/min |
| **AI Agent** | `/ai` | ai-agent | GET, POST, PUT, DELETE | Optional JWT | 1000/min |
| **MCP Servers** | `/mcp` | mcp-servers | GET, POST | Optional JWT | 1000/min |
| **Health Check** | `/health` | backend-api | GET | None | None |

---

### **Service Timeouts**

| Service | Connect | Write | Read | Retries |
|---------|---------|-------|------|---------|
| **Backend API** | 60s | 60s | 60s | 3 |
| **AI Agent** | 90s | 90s | 90s | 2 |
| **MCP Servers** | 60s | 60s | 60s | 3 |

---

### **Request Flow**

```
Client Request
    ↓
Kong Proxy (LoadBalancer)
    ↓
[Rate Limiting] → Check IP rate limits
    ↓
[CORS] → Validate origin
    ↓
[JWT Auth] → Validate token (if enabled)
    ↓
[Request Transformer] → Add headers (X-Gateway, X-Service-Name)
    ↓
[Request ID] → Generate X-Request-ID
    ↓
Route to Backend Service
    ↓
Istio Service Mesh (mTLS)
    ↓
Backend Service
    ↓
Response
    ↓
Kong Proxy
    ↓
Client Response
```

---

## 🔧 Advanced Configuration

### **Enable JWT Authentication on Specific Route**

```bash
# Create JWT credential
kubectl create secret generic jwt-secret -n kong \
  --from-literal=key=your-consumer-key \
  --from-literal=secret=your-secret-key

# Apply JWT plugin to route
cat <<EOF | kubectl apply -f -
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: jwt-auth-backend
  namespace: kong
config:
  key_claim_name: iss
plugin: jwt
---
apiVersion: configuration.konghq.com/v1
kind: KongRoute
metadata:
  name: backend-api-route
  namespace: kong
  annotations:
    konghq.com/plugins: jwt-auth-backend
spec:
  # ... existing route spec
EOF
```

---

### **Add Custom Rate Limiting Per Route**

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: custom-rate-limit
  namespace: kong
config:
  minute: 500  # 500 requests per minute
  hour: 10000  # 10,000 requests per hour
  policy: local
  limit_by: consumer
plugin: rate-limiting
```

---

### **Enable Maintenance Mode**

```bash
# Apply request termination plugin
kubectl patch kongroute backend-api-route -n kong \
  --type merge \
  -p '{"plugins": ["request-termination-maintenance"]}'

# Disable maintenance mode
kubectl patch kongroute backend-api-route -n kong \
  --type json \
  -p '[{"op": "remove", "path": "/plugins"}]'
```

---

## 📈 Monitoring

### **Prometheus Metrics**

Kong automatically exposes Prometheus metrics:

```bash
# Access metrics
kubectl port-forward -n kong svc/kong-kong-admin 8001:8001
curl http://localhost:8001/metrics
```

**Metrics Available:**
- Request rate per route
- Latency (p50, p95, p99)
- Bandwidth (ingress/egress)
- Status codes (2xx, 4xx, 5xx)
- Upstream health

---

### **Kong Admin API**

```bash
# Get all services
curl http://$KONG_ADMIN_IP:8001/services

# Get all routes
curl http://$KONG_ADMIN_IP:8001/routes

# Get all plugins
curl http://$KONG_ADMIN_IP:8001/plugins

# Check Kong health
curl http://$KONG_ADMIN_IP:8001/status
```

---

## 🐛 Troubleshooting

### **Problem: Kong pods not starting**

**Check:**
```bash
kubectl describe pod -n kong <pod-name>
kubectl logs -n kong <pod-name>
```

**Common Issues:**
- PostgreSQL not accessible
- Database not initialized
- Resource limits too low

**Fix:**
```bash
# Check PostgreSQL connection
kubectl exec -it -n kong <kong-pod> -- kong health

# Verify database
kubectl exec -it -n terrafusion-prod postgres-0 -- psql -U postgres -c "\l"
```

---

### **Problem: Routes not working**

**Check:**
```bash
# Verify route exists
kubectl get kongroutes -n kong

# Check Kong admin API
curl http://$KONG_ADMIN_IP:8001/routes
```

**Fix:**
```bash
# Re-apply route configuration
kubectl apply -f kong-routes.yaml
```

---

### **Problem: Rate limiting not working**

**Check:**
```bash
# Verify plugin is enabled
kubectl get kongclusterplugins global-rate-limiting -o yaml
```

**Test:**
```bash
# Generate traffic to trigger rate limit
for i in {1..1100}; do 
  curl -s -o /dev/null -w "%{http_code}\n" http://$KONG_PROXY_IP/api/health
done
# Should see 429 errors after 1,000 requests
```

---

### **Problem: SSL/TLS not working**

**Check:**
```bash
# Verify certificate exists
kubectl get secret -n kong terrafusion-tls-cert

# Check certificate details
kubectl get kongcertificate -n kong
```

**Fix:**
```bash
# Create certificate from Let's Encrypt (requires cert-manager)
kubectl apply -f kong-certificates.yaml
```

---

## 🎯 Success Criteria

✅ **Kong installed successfully:**
```bash
kubectl get pods -n kong
# All pods Running with 2/2 READY
```

✅ **Routes configured:**
```bash
kubectl get kongroutes -n kong
# Shows backend-api-route, ai-agent-route, mcp-servers-route
```

✅ **Plugins enabled:**
```bash
kubectl get kongclusterplugins
# Shows rate-limiting, cors, prometheus, etc.
```

✅ **API accessible:**
```bash
curl http://$KONG_PROXY_IP/api/health
# Returns 200 OK
```

✅ **Rate limiting active:**
```bash
# After 1,000 requests in 1 minute:
# Returns HTTP 429 Too Many Requests
```

✅ **Metrics exposed:**
```bash
curl http://$KONG_ADMIN_IP:8001/metrics
# Returns Prometheus metrics
```

---

## 🚀 Next Steps

After Kong is deployed:

1. **Task 2.4:** Deploy Observability Stack (4 hours)
   - Prometheus + Grafana dashboards
   - Loki log aggregation
   - Jaeger distributed tracing

2. **Task 2.5:** Configure Auto-Scaling (3 hours)
   - Horizontal Pod Autoscaler (HPA)
   - Cluster autoscaler
   - Resource optimization

3. **Configure DNS:**
   ```
   api.terrafusion.io → Kong LoadBalancer IP
   ```

4. **Set up SSL Certificates:**
   - Install cert-manager
   - Configure Let's Encrypt
   - Automatic certificate renewal

---

## 📚 Additional Resources

- [Kong Documentation](https://docs.konghq.com/)
- [Kong Kubernetes Ingress Controller](https://docs.konghq.com/kubernetes-ingress-controller/)
- [Kong Plugin Hub](https://docs.konghq.com/hub/)
- [Kong Admin API Reference](https://docs.konghq.com/gateway/latest/admin-api/)

---

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║          🚀 KONG API GATEWAY: PRODUCTION-READY! 🚀                ║
║                                                                    ║
║              Centralized API Management ✅                         ║
║              Rate Limiting: 1,000 req/min ✅                       ║
║              CORS Policies: Configured ✅                          ║
║              JWT Authentication: Ready ✅                          ║
║              SSL/TLS: Supported ✅                                 ║
║              Prometheus Metrics: Enabled ✅                        ║
║                                                                    ║
║           THE TERRAFUSION WAY: API Gateway Excellence! 💪          ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

**THE TERRAFUSION WAY: Enterprise API Gateway deployed! 🎉**
