# Validation Test: Kubernetes Infrastructure Pipeline

**Test Suite:** Phase 4 Week 3.5 - Integration Testing  
**Pipeline:** kubernetes-infrastructure-ci.yml  
**Duration:** 6 hours  
**Date:** October 8, 2025  
**Tester:** DevOps Team

---

## 🎯 Test Objectives

1. **Validate with Real Services:** Test pipeline with actual TerraFusion microservices (not just test pods)
2. **Verify OPA Policy Enforcement:** Ensure security policies block non-compliant deployments
3. **Test Rollback Scenarios:** Validate automatic rollback on deployment failure
4. **Validate Multi-Zone Deployment:** Test high availability across 3 availability zones

---

## 📋 Test Case 1: Real Service Deployment (2 hours)

### Services to Deploy

#### Service 1: notification-service
```yaml
Repository: terrafusion-notification-service
Type: TypeScript Microservice
Deployment:
  replicas: 3
  image: terrafusionacr.azurecr.io/notification-service:test-v1.0.0
  ports:
    - containerPort: 3000
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
  livenessProbe:
    httpGet:
      path: /health
      port: 3000
    initialDelaySeconds: 30
    periodSeconds: 10
  readinessProbe:
    httpGet:
      path: /ready
      port: 3000
    initialDelaySeconds: 5
    periodSeconds: 5
```

#### Service 2: property-valuation-api
```yaml
Repository: terrafusion-property-valuation
Type: Python FastAPI ML Service
Deployment:
  replicas: 2
  image: terrafusionacr.azurecr.io/property-valuation:test-v1.0.0
  ports:
    - containerPort: 8000
  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 2000m
      memory: 4Gi
  env:
    - name: MODEL_PATH
      value: /models/property-valuation-v1.pkl
  volumeMounts:
    - name: models
      mountPath: /models
  livenessProbe:
    httpGet:
      path: /health
      port: 8000
    initialDelaySeconds: 60
    periodSeconds: 30
  readinessProbe:
    httpGet:
      path: /ready
      port: 8000
    initialDelaySeconds: 10
    periodSeconds: 10
```

#### Service 3: citizen-portal-frontend
```yaml
Repository: terrafusion-citizen-portal
Type: Next.js Frontend
Deployment:
  replicas: 4
  image: terrafusionacr.azurecr.io/citizen-portal:test-v1.0.0
  ports:
    - containerPort: 3001
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  env:
    - name: NEXT_PUBLIC_API_URL
      value: https://api.terrafusion.local
    - name: NODE_ENV
      value: production
  livenessProbe:
    httpGet:
      path: /api/health
      port: 3001
    initialDelaySeconds: 30
    periodSeconds: 10
  readinessProbe:
    httpGet:
      path: /api/ready
      port: 3001
    initialDelaySeconds: 5
    periodSeconds: 5
```

### Validation Points

**✅ Checklist:**
- [ ] All Helm charts pass `helm lint`
- [ ] YAML manifests pass `yamllint` and `kubeconform`
- [ ] OPA policies approve all 3 services (37/37 rules pass)
- [ ] Docker images pulled successfully from ACR
- [ ] Pods reach "Running" state within 2 minutes
- [ ] Health checks pass (liveness + readiness)
- [ ] Services are accessible via ClusterIP
- [ ] NetworkPolicies allow expected traffic
- [ ] Resource limits enforced (verify with `kubectl top`)
- [ ] Logs show no errors in initialization
- [ ] Metrics collected by Prometheus

### Test Execution

```bash
# Step 1: Trigger kubernetes-infrastructure pipeline with test branch
git checkout -b test/validation-real-services
git commit --allow-empty -m "test: validate kubernetes pipeline with real services"
git push origin test/validation-real-services

# Step 2: Monitor pipeline execution
# GitHub Actions URL: https://github.com/bsvalues/terrafusion_os_1.0/actions

# Step 3: Verify deployment in AKS
az aks get-credentials --resource-group terrafusion-prod --name terrafusion-aks-prod
kubectl get pods -n terrafusion-staging
kubectl describe pod notification-service-xxx
kubectl describe pod property-valuation-api-xxx
kubectl describe pod citizen-portal-frontend-xxx

# Step 4: Check service health
kubectl port-forward svc/notification-service 3000:3000 -n terrafusion-staging &
curl http://localhost:3000/health

kubectl port-forward svc/property-valuation-api 8000:8000 -n terrafusion-staging &
curl http://localhost:8000/health

kubectl port-forward svc/citizen-portal-frontend 3001:3001 -n terrafusion-staging &
curl http://localhost:3001/api/health

# Step 5: Verify resource usage
kubectl top pods -n terrafusion-staging

# Step 6: Check logs
kubectl logs -n terrafusion-staging -l app=notification-service --tail=50
kubectl logs -n terrafusion-staging -l app=property-valuation-api --tail=50
kubectl logs -n terrafusion-staging -l app=citizen-portal-frontend --tail=50
```

### Expected Results

```yaml
Pipeline Duration: <60 minutes
Deployment Success: 100% (3/3 services)
Pod Status: All Running
Health Checks: All Passing
Resource Usage:
  - notification-service: CPU <100m, Memory <200Mi
  - property-valuation-api: CPU <800m, Memory <2Gi
  - citizen-portal-frontend: CPU <200m, Memory <512Mi
```

### Issues Encountered

**Document any issues here:**
- Issue #1:
- Issue #2:
- Issue #3:

---

## 📋 Test Case 2: OPA Policy Enforcement (2 hours)

### Test Scenario 1: Privileged Container (Should Fail)

**Deployment Manifest:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: privileged-test
  namespace: terrafusion-staging
spec:
  replicas: 1
  selector:
    matchLabels:
      app: privileged-test
  template:
    metadata:
      labels:
        app: privileged-test
    spec:
      containers:
      - name: test
        image: nginx:latest
        securityContext:
          privileged: true  # ❌ Should be blocked by OPA
```

**Expected Result:**
```
❌ DENIED by policy: containers-must-not-run-privileged
Error: admission webhook "validation.gatekeeper.sh" denied the request:
[privileged-container-deny] Privileged containers are not allowed.
```

**Test Command:**
```bash
kubectl apply -f test-manifests/privileged-container.yaml
# Expected: Error (blocked by OPA)
```

**Validation:**
- [ ] Deployment blocked by OPA
- [ ] Clear error message provided
- [ ] Audit log captured denial
- [ ] No pod created

---

### Test Scenario 2: Missing Resource Limits (Should Fail)

**Deployment Manifest:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: no-limits-test
  namespace: terrafusion-staging
spec:
  replicas: 1
  selector:
    matchLabels:
      app: no-limits-test
  template:
    metadata:
      labels:
        app: no-limits-test
    spec:
      containers:
      - name: test
        image: nginx:latest
        # ❌ Missing resources.requests and resources.limits
```

**Expected Result:**
```
❌ DENIED by policy: containers-must-have-resource-limits
Error: admission webhook "validation.gatekeeper.sh" denied the request:
[resource-limits-required] All containers must have CPU and memory limits defined.
```

**Test Command:**
```bash
kubectl apply -f test-manifests/no-resource-limits.yaml
# Expected: Error (blocked by OPA)
```

**Validation:**
- [ ] Deployment blocked by OPA
- [ ] Error specifies missing resource limits
- [ ] Audit log captured denial
- [ ] No pod created

---

### Test Scenario 3: Host Network Access (Should Fail)

**Deployment Manifest:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: host-network-test
  namespace: terrafusion-staging
spec:
  replicas: 1
  selector:
    matchLabels:
      app: host-network-test
  template:
    metadata:
      labels:
        app: host-network-test
    spec:
      hostNetwork: true  # ❌ Should be blocked by OPA
      containers:
      - name: test
        image: nginx:latest
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

**Expected Result:**
```
❌ DENIED by policy: host-network-access-denied
Error: admission webhook "validation.gatekeeper.sh" denied the request:
[host-network-deny] Pods must not use host network.
```

**Test Command:**
```bash
kubectl apply -f test-manifests/host-network.yaml
# Expected: Error (blocked by OPA)
```

**Validation:**
- [ ] Deployment blocked by OPA
- [ ] Clear error message
- [ ] Audit log captured
- [ ] No pod created

---

### Test Scenario 4: Compliant Service (Should Succeed)

**Deployment Manifest:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: compliant-test
  namespace: terrafusion-staging
  labels:
    app: compliant-test
    version: v1.0.0
spec:
  replicas: 2
  selector:
    matchLabels:
      app: compliant-test
  template:
    metadata:
      labels:
        app: compliant-test
        version: v1.0.0
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: app
        image: nginx:latest
        ports:
        - containerPort: 80
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Expected Result:**
```
✅ APPROVED by all policies (37/37 rules pass)
deployment.apps/compliant-test created
```

**Test Command:**
```bash
kubectl apply -f test-manifests/compliant-service.yaml
# Expected: Success
kubectl get pods -n terrafusion-staging -l app=compliant-test
# Expected: Pods running
```

**Validation:**
- [ ] Deployment approved by OPA
- [ ] Pods created successfully
- [ ] Pods reach Running state
- [ ] Health checks pass
- [ ] Audit log shows approval

---

### Test Scenario 5: Policy Audit Logging

**Objective:** Verify all policy decisions logged to audit trail

**Test Commands:**
```bash
# Check OPA decision logs
kubectl logs -n gatekeeper-system -l control-plane=audit-controller --tail=100

# Check admission controller logs
kubectl logs -n gatekeeper-system -l control-plane=controller-manager --tail=100

# Query audit logs in Azure Monitor
az monitor log-analytics query \
  --workspace terrafusion-logs \
  --query "KubePodInventory | where Namespace == 'gatekeeper-system' | top 50 by TimeGenerated"
```

**Expected Results:**
- [ ] All policy decisions logged (4 denials + 1 approval)
- [ ] Logs include policy name, reason, timestamp
- [ ] Logs include requester identity
- [ ] Logs queryable in Azure Monitor
- [ ] Alert triggered on policy violation

---

## 📋 Test Case 3: Rollback Scenarios (1 hour)

### Rollback Test 1: Failed Health Check

**Scenario:** Deploy v1.0.1 with broken health endpoint → Automatic rollback to v1.0.0

**Steps:**

```bash
# Step 1: Deploy v1.0.0 (working version)
kubectl apply -f test-manifests/service-v1.0.0.yaml
kubectl wait --for=condition=available deployment/test-service -n terrafusion-staging --timeout=120s

# Step 2: Verify v1.0.0 healthy
kubectl get pods -n terrafusion-staging -l app=test-service
curl http://test-service.terrafusion-staging.svc.cluster.local/health
# Expected: 200 OK

# Step 3: Deploy v1.0.1 (broken health check)
kubectl apply -f test-manifests/service-v1.0.1-broken.yaml

# Step 4: Monitor rollout
kubectl rollout status deployment/test-service -n terrafusion-staging --timeout=300s

# Step 5: Verify automatic rollback
kubectl rollout history deployment/test-service -n terrafusion-staging
kubectl get pods -n terrafusion-staging -l app=test-service -o jsonpath='{.items[0].spec.containers[0].image}'
# Expected: v1.0.0 (rolled back)

# Step 6: Check rollout events
kubectl describe deployment test-service -n terrafusion-staging | grep -A 10 "Events:"
```

**Expected Results:**
```yaml
Rollback Trigger: Failed readiness probe (0/2 pods ready after 5 minutes)
Rollback Duration: <3 minutes
Service Availability: Maintained (v1.0.0 pods still serving traffic)
Final State: 100% v1.0.0 pods, 0% v1.0.1 pods
```

**Validation:**
- [ ] v1.0.1 failed to reach ready state
- [ ] Automatic rollback triggered
- [ ] v1.0.0 pods never terminated during rollback
- [ ] No service downtime
- [ ] Rollback completed in <5 minutes
- [ ] Alert sent to on-call

---

### Rollback Test 2: Crash Loop BackOff

**Scenario:** Deploy version that crashes immediately

**Steps:**

```bash
# Deploy version that crashes on startup
kubectl apply -f test-manifests/service-crash-loop.yaml

# Monitor pod status
kubectl get pods -n terrafusion-staging -l app=test-service --watch

# Check pod logs
kubectl logs -n terrafusion-staging -l app=test-service --tail=50

# Verify old version still running
kubectl get replicaset -n terrafusion-staging -l app=test-service

# Manual rollback if automatic doesn't trigger
kubectl rollout undo deployment/test-service -n terrafusion-staging

# Verify rollback
kubectl rollout status deployment/test-service -n terrafusion-staging
```

**Expected Results:**
```yaml
Pod Status: CrashLoopBackOff within 1 minute
Automatic Rollback: Triggered after 3 failed restart attempts
Service Impact: None (old pods continue serving)
Recovery Time: <5 minutes
```

**Validation:**
- [ ] Crash detected within 1 minute
- [ ] Rollback triggered automatically
- [ ] No traffic routed to crashing pods
- [ ] Old pods remain healthy
- [ ] Alert sent to on-call

---

## 📋 Test Case 4: Multi-Zone Deployment (1 hour)

### Test: High Availability Across 3 Availability Zones

**Deployment Configuration:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: multi-zone-test
  namespace: terrafusion-staging
spec:
  replicas: 6
  selector:
    matchLabels:
      app: multi-zone-test
  template:
    metadata:
      labels:
        app: multi-zone-test
    spec:
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: multi-zone-test
      containers:
      - name: app
        image: nginx:latest
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

**Test Steps:**

```bash
# Step 1: Deploy multi-zone service
kubectl apply -f test-manifests/multi-zone-deployment.yaml

# Step 2: Verify pod distribution across zones
kubectl get pods -n terrafusion-staging -l app=multi-zone-test \
  -o custom-columns=NAME:.metadata.name,ZONE:.spec.nodeName | \
  while read pod node; do
    az vm show -g terrafusion-prod -n $node --query "zones[0]" -o tsv
  done

# Expected: 2 pods in each of 3 zones (zone-1, zone-2, zone-3)

# Step 3: Simulate zone failure (cordon all nodes in zone-1)
kubectl get nodes -l topology.kubernetes.io/zone=zone-1 -o name | \
  xargs -I {} kubectl cordon {}

# Step 4: Monitor service availability
kubectl get pods -n terrafusion-staging -l app=multi-zone-test --watch

# Step 5: Verify service still accessible
kubectl port-forward svc/multi-zone-test 8080:80 -n terrafusion-staging &
for i in {1..10}; do
  curl -s http://localhost:8080 > /dev/null && echo "Request $i: OK" || echo "Request $i: FAILED"
  sleep 1
done

# Step 6: Uncordon nodes
kubectl get nodes -l topology.kubernetes.io/zone=zone-1 -o name | \
  xargs -I {} kubectl uncordon {}

# Step 7: Verify pods redistribute
kubectl get pods -n terrafusion-staging -l app=multi-zone-test -o wide
```

**Expected Results:**
```yaml
Initial Distribution:
  - Zone 1: 2 pods
  - Zone 2: 2 pods
  - Zone 3: 2 pods

During Zone 1 Failure:
  - Zone 1: 0 pods (nodes cordoned)
  - Zone 2: 3 pods
  - Zone 3: 3 pods
  - Service Availability: 100% (4/6 pods still serving)
  - Failover Time: <30 seconds

After Recovery:
  - Zone 1: 2 pods
  - Zone 2: 2 pods
  - Zone 3: 2 pods
  - Rebalance Time: <2 minutes
```

**Validation:**
- [ ] Pods evenly distributed initially (2-2-2)
- [ ] Service available during zone failure
- [ ] Failover completed in <30 seconds
- [ ] No request failures during failover
- [ ] Pods rebalanced after recovery
- [ ] Alert triggered on zone failure

---

## 📊 Test Results Summary

### Overall Status
- [ ] Test Case 1: Real Service Deployment - PASSED / FAILED
- [ ] Test Case 2: OPA Policy Enforcement - PASSED / FAILED
- [ ] Test Case 3: Rollback Scenarios - PASSED / FAILED
- [ ] Test Case 4: Multi-Zone Deployment - PASSED / FAILED

### Metrics Achieved
```yaml
Pipeline Duration: ___ minutes (target: <60 min)
Deployment Success Rate: ___% (target: 100%)
OPA Policy Enforcement: ___/37 rules passed (target: 37/37)
Rollback Time: ___ minutes (target: <5 min)
Multi-Zone Failover: ___ seconds (target: <30 sec)
Service Availability: ___% (target: >99%)
```

### Issues Discovered
1. **Issue #1:**
   - Description:
   - Severity: Critical / High / Medium / Low
   - Root Cause:
   - Resolution:
   - Status: Open / In Progress / Resolved

2. **Issue #2:**
   - Description:
   - Severity:
   - Root Cause:
   - Resolution:
   - Status:

### Lessons Learned
1. **What Worked Well:**
   -
   -

2. **What Could Be Improved:**
   -
   -

3. **Recommendations for Domain Pipelines:**
   -
   -

---

## 📝 Sign-off

**Tested By:** _________________________  
**Date:** _________________________  
**Status:** ☐ Approved  ☐ Approved with Conditions  ☐ Rejected  
**Comments:**

---

**Next Test:** Observability Pipeline Validation (5 hours)
