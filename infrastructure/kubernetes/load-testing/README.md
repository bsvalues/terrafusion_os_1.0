# Terrafusion Cosmic Load Testing Framework

This directory contains a comprehensive load testing framework for the
Terrafusion Cosmic Platform, featuring multiple testing tools and chaos
engineering capabilities.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Testing Tools                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│       k6        │     Locust      │      Artillery          │
│  (JavaScript)   │    (Python)     │    (JavaScript)         │
└────────┬────────┴────────┬────────┴────────┬────────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Target Services                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Cosmic API      │ Neural Network  │  Quantum Storage        │
│ Gateway         │   Services      │    Services             │
└─────────────────┴─────────────────┴─────────────────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Chaos Engineering                           │
│                   (Chaos Mesh)                               │
│  • Network Chaos  • Pod Chaos  • Stress Chaos  • IO Chaos   │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. **k6 (Grafana k6)**

- Modern load testing tool
- JavaScript-based test scripts
- Built-in metrics and thresholds
- Kubernetes operator for orchestration
- Real-time results streaming

### 2. **Locust**

- Python-based load testing
- Web UI for real-time monitoring
- Master-worker architecture
- Custom user behaviors
- Distributed load generation

### 3. **Artillery**

- Declarative test scenarios
- WebSocket support
- Plugin ecosystem
- Cloud-native design
- Detailed reporting

### 4. **Chaos Mesh**

- Kubernetes-native chaos engineering
- Multiple chaos types
- Scheduled experiments
- Workflow orchestration
- Safety mechanisms

## Quick Start

### Prerequisites

1. **Install k6 Operator**:

```bash
kubectl apply -f k6-operator.yaml
```

2. **Install Chaos Mesh** (optional):

```bash
helm repo add chaos-mesh https://charts.chaos-mesh.org
helm install chaos-mesh chaos-mesh/chaos-mesh -n chaos-mesh --create-namespace
```

3. **Deploy Load Testing Stack**:

```bash
kubectl apply -k .
```

### Running Tests

#### k6 Tests

1. **Basic Load Test**:

```bash
kubectl apply -f - <<EOF
apiVersion: k6.io/v1alpha1
kind: K6
metadata:
  name: basic-test
  namespace: load-testing
spec:
  parallelism: 2
  script:
    configMap:
      name: k6-cosmic-tests
      file: cosmic-basic.js
  arguments: "--vus 100 --duration 10m"
EOF
```

2. **Stress Test**:

```bash
kubectl create -f k6-tests.yaml
kubectl get k6 -n load-testing
```

3. **Monitor Progress**:

```bash
kubectl logs -n load-testing -l k6_cr=cosmic-basic-test -f
```

#### Locust Tests

1. **Access Web UI**:

```bash
kubectl port-forward -n load-testing svc/locust-master 8089:8089
```

2. **Start Test**:

- Navigate to http://localhost:\${{TF_SERVICE_8089_PORT:-8089}}
- Enter user count and spawn rate
- Start swarming!

3. **Distributed Testing**:

```bash
# Scale workers
kubectl scale deployment locust-worker -n load-testing --replicas=20
```

#### Artillery Tests

1. **Run Test**:

```bash
kubectl create -f artillery-config.yaml
kubectl logs -n load-testing job/artillery-test -f
```

2. **View Reports**:

```bash
kubectl port-forward -n load-testing svc/artillery-dashboard 8080:8080
# Navigate to http://localhost:\${{TF_SERVICE_8089_PORT:-8089}}/reports
```

### Chaos Engineering

1. **Network Delay**:

```bash
kubectl apply -f - <<EOF
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: api-delay
  namespace: load-testing
spec:
  action: delay
  mode: all
  selector:
    namespaces:
      - kong
  delay:
    latency: "200ms"
  duration: "5m"
EOF
```

2. **Pod Failures**:

```bash
kubectl apply -f chaos-mesh.yaml
kubectl get podchaos -n load-testing
```

## Test Scenarios

### Performance Baseline

- 100 concurrent users
- 5-minute duration
- Expected: <500ms p95 latency

### Spike Test

- Ramp from 0 to 1000 users in 2 minutes
- Hold for 5 minutes
- Expected: System recovers gracefully

### Soak Test

- 500 concurrent users
- 24-hour duration
- Expected: No memory leaks, stable performance

### Stress Test

- Increase load until failure
- Identify breaking point
- Expected: Graceful degradation

### Chaos Test

- Normal load + failure injection
- Network partitions, pod failures
- Expected: Self-healing, data integrity

## Metrics and Monitoring

### Key Metrics

1. **Performance Metrics**:
   - Request rate (req/s)
   - Response time (p50, p95, p99)
   - Error rate (%)
   - Throughput (MB/s)

2. **Cosmic Platform Metrics**:
   - Neural processing latency
   - Quantum storage efficiency
   - Consciousness query time
   - Holographic projection speed

3. **Resource Metrics**:
   - CPU utilization
   - Memory usage
   - Network I/O
   - Disk I/O

### Dashboards

Access Grafana dashboards:

```bash
kubectl port-forward -n monitoring svc/grafana 3000:3000
```

Available dashboards:

- k6 Load Testing Results
- Locust Performance Metrics
- Artillery Test Reports
- Chaos Experiment Status
- Cosmic Platform Health

## Advanced Features

### Custom k6 Extensions

```javascript
import { CosmicClient } from './cosmic-client.js';

export default function () {
  const client = new CosmicClient({
    baseURL: __ENV.BASE_URL,
    neuralModel: 'quantum-enhanced',
  });

  const response = client.quantumCompute({
    dimensions: 11,
    entanglement: true,
  });

  check(response, {
    'quantum computation successful': r => r.status === 200,
    'coherence maintained': r => r.json('coherence') > 0.95,
  });
}
```

### Locust Custom Users

```python
class QuantumUser(FastHttpUser):
    @task
    def quantum_entanglement(self):
        # Create entangled pair
        pair = self.client.post("/quantum/entangle", json={
            "dimensions": random.randint(1, 11),
            "particles": 2
        })

        # Measure one particle
        self.client.post(f"/quantum/measure/{pair.json()['id']}/A")

        # Verify entanglement
        state = self.client.get(f"/quantum/state/{pair.json()['id']}/B")
        assert state.json()["collapsed"] == True
```

### Artillery Plugins

```javascript
module.exports = {
  beforeScenario: function (context, ee, next) {
    // Setup quantum encryption
    context.vars.quantumKey = generateQuantumKey();
    return next();
  },

  afterResponse: function (req, res, context, ee, next) {
    // Verify cosmic headers
    if (!res.headers['x-cosmic-trace-id']) {
      ee.emit('error', 'Missing cosmic trace');
    }
    return next();
  },
};
```

## Best Practices

1. **Test Isolation**: Run load tests in dedicated namespace
2. **Resource Limits**: Set appropriate limits for load generators
3. **Gradual Ramp-up**: Start small and increase load gradually
4. **Monitor Everything**: Watch both load generators and target services
5. **Data Cleanup**: Remove test data after completion
6. **Result Storage**: Archive test results for trend analysis
7. **Chaos Safety**: Use chaos experiments carefully in production

## Troubleshooting

### Common Issues

1. **k6 Tests Not Starting**:

```bash
kubectl describe k6 test-name -n load-testing
kubectl logs -n load-testing k6-operator-*
```

2. **Locust Workers Not Connecting**:

```bash
kubectl logs -n load-testing deployment/locust-worker
kubectl exec -n load-testing deployment/locust-worker -- nslookup locust-master
```

3. **Artillery Timeout**:

```bash
# Increase timeout in config
kubectl edit configmap artillery-scenarios -n load-testing
```

4. **Chaos Experiments Stuck**:

```bash
kubectl delete chaos --all -n load-testing
```

### Performance Tuning

1. **Increase Load Generator Resources**:

```yaml
resources:
  requests:
    cpu: 4000m
    memory: 8Gi
  limits:
    cpu: 8000m
    memory: 16Gi
```

2. **Node Affinity for Load Generators**:

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - key: workload-type
              operator: In
              values:
                - load-testing
```

3. **Network Optimization**:

```bash
# Increase connection limits
sysctl -w net.ipv4.ip_local_port_range="1024 65535"
sysctl -w net.core.somaxconn=65535
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Test
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - name: Run k6 Test
        run: |
          kubectl apply -f k6-tests.yaml
          kubectl wait --for=condition=complete job/k6-test --timeout=3600s
          kubectl logs job/k6-test > results.txt

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.txt
```

## Reporting

### Generate Reports

1. **k6 HTML Report**:

```bash
k6 run --out json=results.json cosmic-basic.js
k6-reporter results.json --out report.html
```

2. **Locust Report**:

```bash
kubectl cp load-testing/locust-master-0:/stats/report.html ./locust-report.html
```

3. **Artillery Report**:

```bash
artillery report results.json --output report.html
```

## Support

For issues:

- Check pod logs: `kubectl logs -n load-testing -l app=<tool>`
- Review metrics in Grafana
- Check chaos experiment status
- Contact Performance Engineering team

🚀 Load test the cosmic platform to infinity and beyond! 🌌
