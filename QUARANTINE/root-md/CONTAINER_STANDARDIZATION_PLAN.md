# 🏆 TerraFusion Container Standardization Plan

## **THE CORE PROBLEM**
Configuration hell caused by misaligned port expectations across multiple layers:
- Rust code hardcoded ports vs Docker environment variables
- Health checks expecting wrong ports
- Gateway routing failures
- Service discovery confusion

## **THE CHAMPIONSHIP SOLUTION: PORT STANDARDIZATION**

### **Standard Port Allocation**
```
CORE SERVICES (8000-8099)
- TerraFusion OS Core: 8080 ✅ (already working)
- Government Compliance: 8082 → 8082 (fix hardcoded 5030)
- County Isolation: 8083 → 8083 (fix hardcoded 8001)
- Quantum Optimizer: 8085 → 8085 (fix hardcoded 8003)

AI SERVICES (3000-3099)
- Consciousness Engine: 3004 ✅ (already working)
- Gateway: 3002 ✅ (already working)

DATA SERVICES (5400-5499)
- PostgreSQL: 5432 ✅ (standard)
- Redis: 6379 ✅ (standard)

MONITORING (9000-9099)
- Prometheus: 9090 ✅ (already working)
- Grafana: 3000 ✅ (already working)
- Jaeger: 16686 ✅ (already working)
```

### **Implementation Strategy**

#### **Phase 1: Fix Rust Service Ports**
1. Update compliance service: 5030 → 8082
2. Update isolation service: 8001 → 8083
3. Update quantum service: 8003 → 8085

#### **Phase 2: Standardize Configuration Loading**
```rust
// Standard configuration pattern for all services
fn get_server_port(default: &str) -> String {
    std::env::var("SERVER_PORT")
        .or_else(|_| std::env::var("PORT"))
        .unwrap_or_else(|_| default.to_string())
}

let port = get_server_port("8082"); // service-specific default
let addr = format!("0.0.0.0:{}", port);
```

#### **Phase 3: Service Discovery Integration**
```yaml
# Docker Compose with service discovery
services:
  terrafusion-compliance:
    ports:
      - "8082:8082"
    environment:
      - SERVER_PORT=8082
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8082/health']
```

#### **Phase 4: Gateway Configuration Sync**
```nginx
# Nginx upstream with standardized ports
upstream compliance {
    server terrafusion-compliance:8082;
}
upstream isolation {
    server terrafusion-isolation:8083;
}
upstream quantum {
    server terrafusion-quantum:8085;
}
```

## **BENEFITS OF STANDARDIZATION**

✅ **Predictable Service Discovery**: All services on expected ports
✅ **Simplified Health Checks**: No port guessing
✅ **Gateway Routing Clarity**: Clear upstream definitions
✅ **Development Consistency**: Same ports in dev/staging/prod
✅ **Monitoring Integration**: Prometheus targets aligned
✅ **Documentation Accuracy**: Ports match reality

## **IMPLEMENTATION ORDER**

1. **Fix Rust hardcoded ports** (immediate)
2. **Rebuild affected containers** (5 minutes)
3. **Restart services** (1 minute)
4. **Validate health endpoints** (immediate)
5. **Test gateway routing** (immediate)

## **LONG-TERM ARCHITECTURE**

### **Configuration Hierarchy**
```
1. Environment Variables (runtime)
2. Service Defaults (compile-time)
3. Container Orchestration (Docker)
4. Infrastructure (Kubernetes/Docker Swarm)
```

### **Service Discovery Pattern**
```
Service Name → Internal Port → External Port (if needed)
compliance   → 8082        → 8082
isolation    → 8083        → 8083
quantum      → 8085        → 8085
```

This eliminates configuration drift and ensures **what you configure is what runs**.

---

**Execute with championship excellence. Government. Transcended.**
