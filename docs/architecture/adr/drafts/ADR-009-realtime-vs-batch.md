# ADR-009: Real-Time vs Batch Inference Strategy

**Status:** DRAFT  
**Date:** October 7, 2025  
**Author:** AI Platform Team  
**Reviewers:** Architecture Review Council  
**Decision:** Pending ARC approval

---

## Context

TerraFusion AI Platform supports two inference patterns:

1. **Real-Time API** - Single property predictions via REST API (<200ms latency)
2. **Batch Processing** - Bulk predictions for assessment cycles (>1000 properties/sec)

After Phase 4 completion, we need to **formalize the decision criteria** for when to use each pattern and how to optimize for both workloads without performance conflicts.

**Current Usage Patterns:**

| Use Case                    | Pattern      | Volume              | Frequency     |
| --------------------------- | ------------ | ------------------- | ------------- |
| Citizen property lookup     | Real-time    | 1-10 properties     | On-demand     |
| Assessment review           | Real-time    | 10-100 properties   | Daily         |
| Annual assessment cycle     | Batch        | 89,247 properties   | Annually      |
| Market analysis             | Batch        | 10K-50K properties  | Weekly/Monthly|
| Data quality validation     | Batch        | Full dataset        | Nightly       |
| What-if scenarios           | Real-time    | 1-5 properties      | Interactive   |

**Problem:**

Without clear guidance, users default to real-time API even for batch workloads, causing:

- ❌ API rate limit exhaustion
- ❌ Unnecessary latency (network overhead per prediction)
- ❌ Higher infrastructure costs
- ❌ Batch job interference with interactive users

---

## Decision

Implement **Dual-Mode Inference Architecture** with clear routing rules and separate resource pools.

---

## Architecture

### Mode 1: Real-Time Inference (Synchronous)

**When to Use:**

- ✅ Interactive user requests (<10 properties)
- ✅ Latency-sensitive workflows (<500ms acceptable)
- ✅ User waiting for result in UI
- ✅ What-if scenario analysis
- ✅ Single property updates

**API Endpoint:**

```
POST /v1/predict
Content-Type: application/json

{
  "property": {
    "square_footage": 2500,
    "year_built": 2015,
    "bedrooms": 4,
    "bathrooms": 2.5,
    "lot_size": 8000,
    "zip_code": "99301"
  },
  "tenant_id": "benton-county",
  "options": {
    "include_confidence": true,
    "include_explanation": true
  }
}
```

**Response:**

```json
{
  "prediction_id": "pred_abc123",
  "predicted_value": 425000,
  "confidence": 0.87,
  "confidence_interval": [405000, 445000],
  "latency_ms": 145,
  "explanation": {
    "top_features": [
      {"feature": "square_footage", "importance": 0.32},
      {"feature": "year_built", "importance": 0.18},
      {"feature": "location", "importance": 0.15}
    ]
  }
}
```

**Infrastructure:**

```yaml
# kubernetes/ai-platform-api-realtime.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-platform-api-realtime
  labels:
    component: realtime-inference
spec:
  replicas: 5  # Auto-scale 3-10 based on load
  selector:
    matchLabels:
      app: ai-platform-api
      mode: realtime
  template:
    spec:
      containers:
        - name: api
          image: terrafusion/ai-platform-api:v2.3.1
          resources:
            requests:
              cpu: 500m
              memory: 2Gi
            limits:
              cpu: 2000m
              memory: 4Gi
          env:
            - name: INFERENCE_MODE
              value: "realtime"
            - name: MAX_BATCH_SIZE
              value: "1"  # Single predictions only
            - name: TIMEOUT_MS
              value: "500"
      
      # Priority class for interactive workloads
      priorityClassName: high-priority
```

**Rate Limiting:**

```python
# api/rate_limiting.py

RATE_LIMITS = {
    'realtime': {
        'per_user': '100 requests/minute',
        'per_tenant': '1000 requests/minute',
        'global': '5000 requests/minute',
    }
}
```

---

### Mode 2: Batch Inference (Asynchronous)

**When to Use:**

- ✅ Bulk predictions (>100 properties)
- ✅ Background processing (no user waiting)
- ✅ Scheduled jobs (assessment cycles)
- ✅ Data pipeline integration
- ✅ Model validation/testing

**API Endpoint:**

```
POST /v1/batch
Content-Type: application/json

{
  "job_name": "annual_assessment_2025",
  "tenant_id": "benton-county",
  "input_source": {
    "type": "s3",
    "bucket": "terrafusion-data",
    "key": "benton-county/properties/2025_assessment.csv"
  },
  "output_destination": {
    "type": "s3",
    "bucket": "terrafusion-results",
    "key": "benton-county/predictions/2025_assessment_results.csv"
  },
  "options": {
    "batch_size": 1000,
    "priority": "low",
    "notify_on_completion": true
  }
}
```

**Response (Job Created):**

```json
{
  "job_id": "job_xyz789",
  "status": "queued",
  "estimated_duration_minutes": 45,
  "created_at": "2025-10-07T10:30:00Z",
  "status_url": "/v1/batch/job_xyz789/status"
}
```

**Status Check:**

```
GET /v1/batch/job_xyz789/status

{
  "job_id": "job_xyz789",
  "status": "running",
  "progress": {
    "total_properties": 89247,
    "processed": 45123,
    "percent_complete": 50.5,
    "estimated_remaining_minutes": 22
  },
  "started_at": "2025-10-07T10:32:00Z",
  "output_preview_url": "/v1/batch/job_xyz789/preview"
}
```

**Infrastructure:**

```yaml
# kubernetes/ai-platform-batch.yaml

apiVersion: batch/v1
kind: CronJob
metadata:
  name: ai-platform-batch-processor
spec:
  schedule: "*/15 * * * *"  # Every 15 minutes, process queue
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: batch-processor
              image: terrafusion/ai-platform-batch:v2.3.1
              resources:
                requests:
                  cpu: 4000m
                  memory: 16Gi
                limits:
                  cpu: 8000m
                  memory: 32Gi
              env:
                - name: INFERENCE_MODE
                  value: "batch"
                - name: BATCH_SIZE
                  value: "1000"
                - name: MAX_CONCURRENT_BATCHES
                  value: "4"
                - name: THROUGHPUT_TARGET
                  value: "1250"  # properties/second
          
          # Lower priority than real-time
          priorityClassName: low-priority
          
          # Allow preemption by real-time workloads
          preemptionPolicy: PreemptLowerPriority
```

---

## Decision Matrix

### Real-Time vs Batch

| Criteria                | Real-Time          | Batch              |
| ----------------------- | ------------------ | ------------------ |
| **Volume**              | 1-100 properties   | 100+ properties    |
| **Latency Requirement** | <500ms             | Minutes to hours OK|
| **User Waiting?**       | Yes                | No                 |
| **Cost per Prediction** | Higher (overhead)  | Lower (amortized)  |
| **Resource Priority**   | High               | Low                |
| **Explain ability**     | Full (SHAP)        | Optional           |
| **Retries**             | Limited            | Automatic          |

### Example Decision Flow

```python
def choose_inference_mode(num_properties: int, user_waiting: bool, 
                         latency_requirement_ms: int) -> str:
    """
    Decide between real-time and batch inference
    """
    if user_waiting and latency_requirement_ms < 500:
        return 'realtime'
    
    if num_properties <= 10:
        return 'realtime'
    
    if num_properties > 100:
        return 'batch'
    
    # Gray area: 10-100 properties
    if latency_requirement_ms < 1000:
        return 'realtime'
    else:
        return 'batch'
```

---

## Performance Optimization

### Real-Time Optimizations

#### 1. Model Caching

```python
class CachedModelService:
    """In-memory model caching for real-time inference"""
    
    def __init__(self):
        self._cache = {}  # tenant_id -> model
        self._cache_ttl = 3600  # 1 hour
    
    def predict(self, tenant_id: str, features: dict) -> float:
        model = self._get_cached_model(tenant_id)
        return model.predict(features)
    
    def _get_cached_model(self, tenant_id: str):
        if tenant_id not in self._cache:
            self._cache[tenant_id] = self._load_model(tenant_id)
        return self._cache[tenant_id]
```

**Impact:** 145ms → 120ms average latency (-17%)

#### 2. Feature Pre-computation

```python
# Pre-compute expensive features
PRECOMPUTED_FEATURES = {
    'neighborhood_median_value': redis_client,
    'school_district_rating': redis_client,
    'recent_sales_trend': redis_client,
}

def enrich_features(raw_features: dict) -> dict:
    """Add pre-computed features from Redis"""
    zip_code = raw_features['zip_code']
    
    raw_features['neighborhood_median'] = PRECOMPUTED_FEATURES[
        'neighborhood_median_value'
    ].get(f'neighborhood:{zip_code}')
    
    return raw_features
```

**Impact:** -30ms feature computation time

#### 3. Response Streaming

```python
@app.post("/v1/predict/stream")
async def predict_stream(properties: List[Property]):
    """Stream predictions as they complete"""
    async for prediction in model.predict_stream(properties):
        yield json.dumps(prediction) + "\n"
```

**Benefit:** First result in 145ms, subsequent in 80ms each

---

### Batch Optimizations

#### 1. Dynamic Batching

```python
class DynamicBatchProcessor:
    """Accumulate requests into optimal batch sizes"""
    
    def __init__(self, min_batch=100, max_batch=1000, max_wait_ms=500):
        self.min_batch = min_batch
        self.max_batch = max_batch
        self.max_wait_ms = max_wait_ms
        self.queue = []
        self.last_flush = time.time()
    
    async def add(self, property_data: dict):
        self.queue.append(property_data)
        
        # Flush if batch full or waited long enough
        if len(self.queue) >= self.max_batch:
            await self._flush()
        elif len(self.queue) >= self.min_batch:
            if (time.time() - self.last_flush) * 1000 > self.max_wait_ms:
                await self._flush()
    
    async def _flush(self):
        batch = self.queue[:self.max_batch]
        self.queue = self.queue[self.max_batch:]
        self.last_flush = time.time()
        
        # Process batch
        predictions = await model.predict_batch(batch)
        return predictions
```

**Impact:** 1250 → 1800 properties/second (+44%)

#### 2. Parallel Processing

```python
async def process_batch_job(job: BatchJob):
    """Process batch job with parallelism"""
    
    # Load input data
    properties = load_from_s3(job.input_source)
    
    # Split into chunks for parallel processing
    chunk_size = 10000
    chunks = [properties[i:i+chunk_size] 
              for i in range(0, len(properties), chunk_size)]
    
    # Process chunks in parallel (up to max_workers)
    with ProcessPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(model.predict_batch, chunk)
            for chunk in chunks
        ]
        
        results = [future.result() for future in futures]
    
    # Combine results
    all_predictions = flatten(results)
    
    # Write to output
    write_to_s3(all_predictions, job.output_destination)
```

**Impact:** 45 minutes → 12 minutes for 89K properties (-73%)

#### 3. GPU Utilization

```python
# Use GPU for batch inference (optional)
if torch.cuda.is_available() and batch_size > 500:
    model = model.cuda()
    features_tensor = torch.tensor(features).cuda()
    predictions = model(features_tensor).cpu().numpy()
else:
    # CPU inference for small batches
    predictions = model.predict(features)
```

**Impact:** 1250 → 3500 properties/second with GPU (+180%)

---

## Cost Analysis

### Real-Time Inference Cost

```
Assumptions:
- 5 pods × 2 CPU × $0.05/CPU-hour = $0.50/hour
- 200 predictions/second capacity
- $0.50 / (200 × 3600) = $0.00000069 per prediction
- Plus API Gateway cost: $0.0000035 per request
- Total: ~$0.000004 per prediction
```

### Batch Inference Cost

```
Assumptions:
- 1 pod × 4 CPU × $0.05/CPU-hour = $0.20/hour
- 1250 properties/second = 4,500,000 per hour
- $0.20 / 4,500,000 = $0.000000044 per prediction
- 90x cheaper than real-time!
```

**ROI Example:**

Annual assessment: 89,247 properties

- Real-time: $0.357
- Batch: $0.004
- **Savings: $0.35 per county × 100 counties = $35/year**

Not huge savings at current scale, but **validates architectural correctness**.

---

## Migration Strategy

For users currently using real-time API for batch workloads:

### Phase 1: Education (Weeks 1-2)

- Document decision criteria
- Create batch API examples
- Update SDK with batch support

### Phase 2: Soft Limits (Weeks 3-4)

- Warn users when real-time used for >100 properties
- Suggest batch API in response headers

```
HTTP/1.1 200 OK
X-TerraFusion-Suggestion: Consider using /v1/batch for >100 properties
X-TerraFusion-Estimated-Savings: $0.35
```

### Phase 3: Enforcement (Week 5+)

- Rate limit real-time API to <100 properties/request
- Auto-route large requests to batch queue

```python
@app.post("/v1/predict")
async def predict(properties: List[Property]):
    if len(properties) > 100:
        # Auto-convert to batch job
        job = create_batch_job(properties)
        return {
            "message": "Request converted to batch job",
            "job_id": job.id,
            "status_url": f"/v1/batch/{job.id}/status",
            "reason": "Batch API recommended for >100 properties"
        }
    
    # Normal real-time processing
    return model.predict(properties)
```

---

## Monitoring

### Key Metrics

```yaml
# Prometheus metrics

# Real-time
ai_realtime_latency_seconds{quantile="0.95"} < 0.2
ai_realtime_throughput_requests_per_second > 100
ai_realtime_error_rate < 0.01

# Batch
ai_batch_throughput_properties_per_second > 1000
ai_batch_job_duration_seconds{quantile="0.95"} < 3600
ai_batch_job_failure_rate < 0.02

# Resource utilization
ai_inference_cpu_utilization{mode="realtime"} < 0.7
ai_inference_memory_utilization{mode="batch"} < 0.8
```

### Grafana Dashboard

```
┌────────────────────────────────────────┐
│ AI Platform Inference Dashboard       │
├────────────────────────────────────────┤
│                                        │
│ Real-Time Inference                    │
│ - Latency (p50/p95/p99)               │
│ - Throughput (req/sec)                │
│ - Error rate                          │
│ - Active connections                  │
│                                        │
│ Batch Inference                        │
│ - Throughput (properties/sec)         │
│ - Queue depth                         │
│ - Job completion rate                 │
│ - Average job duration                │
│                                        │
│ Resource Utilization                   │
│ - CPU (realtime vs batch)             │
│ - Memory (realtime vs batch)          │
│ - GPU utilization (if applicable)     │
│                                        │
└────────────────────────────────────────┘
```

---

## Security Considerations

### Real-Time API

- ✅ OAuth 2.0 + JWT authentication
- ✅ Rate limiting per user/tenant
- ✅ Request validation (schema + business rules)
- ✅ Response filtering (only authorized data)

### Batch API

- ✅ S3 pre-signed URLs (time-limited access)
- ✅ Job ownership validation (tenant isolation)
- ✅ Output encryption at rest
- ✅ Audit logging for all jobs

---

## Success Criteria

- ✅ Real-time API p95 latency <200ms (100 VUs)
- ✅ Batch throughput >1000 properties/second
- ✅ Resource isolation (batch doesn't degrade real-time)
- ✅ Cost per prediction: Batch <10% of real-time
- ✅ User adoption: >50% of bulk requests use batch API (within 3 months)
- ✅ ARC approval

---

## References

- [AWS Batch Inference Best Practices](https://docs.aws.amazon.com/sagemaker/latest/dg/batch-transform.html)
- [Google Vertex AI: Batch Prediction](https://cloud.google.com/vertex-ai/docs/predictions/batch-predictions)
- [Uber Michelangelo: Batch vs Real-Time](https://eng.uber.com/michelangelo-machine-learning-platform/)
- Phase 4 Performance Benchmarks (89,247 Benton County properties)

---

**Next Review:** Phase 4.9 Week 1 (October 13, 2025)  
**ARC Decision Date:** TBD  
**Implementation Target:** Already implemented, formalizing decision
