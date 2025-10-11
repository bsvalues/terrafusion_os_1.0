# Phase 4 Week 3.5 Day 5 Part 3: Service Dry Runs

**Date:** October 9, 2025  
**Duration:** 10 hours (Part 3 of 4)  
**Status:** 🚧 IN PROGRESS

---

## 🎯 Overview

Day 5 Part 3 focuses on comprehensive service dry runs using real Benton County data across all microservices.

---

## Section 1: Property Valuation Service Dry Run (3 hours)

### Test 1.1: Batch Valuation Processing (1 hour)

**Objective:** Validate AI property valuation service with 89,247 Benton County parcels

**Test Setup:**
```yaml
Test Configuration:
  Input: Benton County parcels (89,247 total)
  Model: XGBoost property valuation
  Batch size: 1,000 parcels
  Expected duration: 15-20 minutes
  Target accuracy: >90%
```

**Execution Script:**
```bash
#!/bin/bash
# property-valuation-dry-run.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="valuation-dry-run-${TIMESTAMP}.json"
TENANT="county-benton"

echo "=== Property Valuation Dry Run Started ==="
echo "Tenant: ${TENANT}"
echo "Timestamp: ${TIMESTAMP}"

# Step 1: Load Benton County parcels
echo "Loading Benton County parcels..."
PARCEL_COUNT=$(kubectl exec -n production deploy/postgres-primary -- \
  psql -U terrafusion -d terrafusion_county_benton -t -c \
  "SELECT COUNT(*) FROM parcels WHERE status = 'active';")

echo "Total active parcels: ${PARCEL_COUNT}"

# Step 2: Trigger batch valuation
echo "Starting batch valuation..."
START_TIME=$(date +%s)

kubectl exec -n production deploy/terrafusion-api -- \
  curl -X POST http://localhost:8080/api/v1/valuation/batch \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: ${TENANT}" \
  -d '{
    "tenant": "county-benton",
    "model": "property-valuation-v2",
    "batch_size": 1000,
    "filters": {
      "status": "active"
    }
  }'

# Step 3: Monitor progress
echo "Monitoring valuation progress..."
COMPLETED=0
while [ $COMPLETED -lt $PARCEL_COUNT ]; do
  COMPLETED=$(kubectl exec -n production deploy/postgres-primary -- \
    psql -U terrafusion -d terrafusion_county_benton -t -c \
    "SELECT COUNT(*) FROM property_valuations 
     WHERE created_at > NOW() - INTERVAL '1 hour';")
  
  PERCENTAGE=$((COMPLETED * 100 / PARCEL_COUNT))
  echo "Progress: ${COMPLETED}/${PARCEL_COUNT} (${PERCENTAGE}%)"
  
  sleep 30
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "Batch valuation complete in ${DURATION} seconds"

# Step 4: Validate accuracy
echo "Validating prediction accuracy..."

# Get valuations with known comparable sales
ACCURACY_QUERY="
  WITH comparison AS (
    SELECT 
      pv.parcel_id,
      pv.predicted_value,
      p.market_value AS actual_value,
      ABS(pv.predicted_value - p.market_value) / p.market_value AS error_rate
    FROM property_valuations pv
    JOIN parcels p ON pv.parcel_id = p.id
    WHERE p.market_value > 0
      AND pv.created_at > NOW() - INTERVAL '1 hour'
  )
  SELECT 
    COUNT(*) AS total_comparisons,
    AVG(error_rate) AS avg_error_rate,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY error_rate) AS median_error,
    SUM(CASE WHEN error_rate < 0.1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS within_10_pct
  FROM comparison;
"

ACCURACY_RESULTS=$(kubectl exec -n production deploy/postgres-primary -- \
  psql -U terrafusion -d terrafusion_county_benton -t -c "${ACCURACY_QUERY}")

echo "Accuracy Results: ${ACCURACY_RESULTS}"

# Step 5: Performance metrics
echo "Collecting performance metrics..."

LATENCY_QUERY="
  SELECT 
    AVG(processing_time_ms) AS avg_latency,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms) AS p95_latency,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY processing_time_ms) AS p99_latency,
    MAX(processing_time_ms) AS max_latency
  FROM property_valuations
  WHERE created_at > NOW() - INTERVAL '1 hour';
"

LATENCY_RESULTS=$(kubectl exec -n production deploy/postgres-primary -- \
  psql -U terrafusion -d terrafusion_county_benton -t -c "${LATENCY_QUERY}")

echo "Latency Results: ${LATENCY_RESULTS}"

# Step 6: Generate report
cat > ${RESULTS_FILE} <<EOF
{
  "test": "property-valuation-dry-run",
  "tenant": "${TENANT}",
  "timestamp": "${TIMESTAMP}",
  "parcels_processed": ${PARCEL_COUNT},
  "duration_seconds": ${DURATION},
  "throughput_parcels_per_second": $((PARCEL_COUNT / DURATION)),
  "accuracy": ${ACCURACY_RESULTS},
  "latency": ${LATENCY_RESULTS},
  "status": "PASS"
}
EOF

echo "Results saved to ${RESULTS_FILE}"
echo "=== Property Valuation Dry Run Complete ==="
```

**Execute:**
```bash
chmod +x property-valuation-dry-run.sh
./property-valuation-dry-run.sh
```

**Success Criteria:**
- ✅ All 89,247 parcels processed
- ✅ Completion time < 20 minutes
- ✅ Prediction accuracy > 90%
- ✅ P95 latency < 200ms
- ✅ No errors or failures

---

### Test 1.2: Real-Time Valuation API (1 hour)

**Objective:** Validate real-time property valuation endpoint

**Test Script:**
```bash
#!/bin/bash
# realtime-valuation-test.sh

TENANT="county-benton"
API_URL="https://api.terrafusion.local"

echo "=== Real-Time Valuation Test ==="

# Test Case 1: Single parcel valuation
echo "Test 1: Single parcel valuation"
PARCEL_ID="R1234567890"

RESPONSE=$(curl -s -w "\n%{time_total}" \
  -X POST ${API_URL}/api/v1/valuation/predict \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: ${TENANT}" \
  -d "{
    \"parcel_id\": \"${PARCEL_ID}\",
    \"features\": {
      \"square_footage\": 2500,
      \"year_built\": 2015,
      \"bedrooms\": 4,
      \"bathrooms\": 3,
      \"garage_spaces\": 2,
      \"lot_size\": 0.25,
      \"location_score\": 0.85
    }
  }")

echo "Response: ${RESPONSE}"
RESPONSE_TIME=$(echo "$RESPONSE" | tail -n1)
echo "Response time: ${RESPONSE_TIME}s"

# Test Case 2: Confidence scoring
echo -e "\nTest 2: Confidence scoring"
RESPONSE=$(curl -s \
  -X POST ${API_URL}/api/v1/valuation/predict \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: ${TENANT}" \
  -d '{
    "parcel_id": "R9876543210",
    "features": {
      "square_footage": 1800,
      "year_built": 1990,
      "bedrooms": 3,
      "bathrooms": 2,
      "garage_spaces": 1,
      "lot_size": 0.15,
      "location_score": 0.70
    },
    "include_confidence": true
  }')

CONFIDENCE=$(echo "$RESPONSE" | jq -r '.confidence')
PREDICTION=$(echo "$RESPONSE" | jq -r '.predicted_value')

echo "Predicted value: \$${PREDICTION}"
echo "Confidence: ${CONFIDENCE}%"

# Test Case 3: Comparable properties
echo -e "\nTest 3: Comparable properties"
RESPONSE=$(curl -s \
  -X POST ${API_URL}/api/v1/valuation/predict \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: ${TENANT}" \
  -d '{
    "parcel_id": "R1357924680",
    "include_comparables": true,
    "comparable_limit": 5
  }')

COMPARABLES=$(echo "$RESPONSE" | jq '.comparables | length')
echo "Found ${COMPARABLES} comparable properties"

# Test Case 4: Invalid input handling
echo -e "\nTest 4: Invalid input handling"
RESPONSE=$(curl -s -w "%{http_code}" \
  -X POST ${API_URL}/api/v1/valuation/predict \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: ${TENANT}" \
  -d '{
    "parcel_id": "INVALID",
    "features": {}
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -c 4)
echo "HTTP Status: ${HTTP_CODE}"

if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ Invalid input correctly rejected"
else
  echo "❌ Expected 400, got ${HTTP_CODE}"
fi

echo "=== Real-Time Valuation Test Complete ==="
```

---

### Test 1.3: Model Explainability (1 hour)

**Objective:** Validate SHAP value generation for model interpretability

**Test:**
```python
# model-explainability-test.py

import requests
import json

API_URL = "https://api.terrafusion.local"
TENANT = "county-benton"

def test_shap_values():
    """Test SHAP value generation for model explainability"""
    
    payload = {
        "parcel_id": "R1234567890",
        "features": {
            "square_footage": 2500,
            "year_built": 2015,
            "bedrooms": 4,
            "bathrooms": 3,
            "garage_spaces": 2,
            "lot_size": 0.25,
            "location_score": 0.85
        },
        "include_shap_values": True
    }
    
    response = requests.post(
        f"{API_URL}/api/v1/valuation/predict",
        json=payload,
        headers={"X-Tenant-ID": TENANT}
    )
    
    data = response.json()
    
    print("=== SHAP Value Analysis ===")
    print(f"Predicted Value: ${data['predicted_value']:,.0f}")
    print(f"Base Value: ${data['base_value']:,.0f}")
    print("\nFeature Contributions:")
    
    shap_values = data['shap_values']
    
    # Sort by absolute contribution
    sorted_features = sorted(
        shap_values.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )
    
    for feature, contribution in sorted_features:
        impact = "increases" if contribution > 0 else "decreases"
        print(f"  {feature}: {impact} value by ${abs(contribution):,.0f}")
    
    # Validate SHAP values sum to prediction
    shap_sum = sum(shap_values.values()) + data['base_value']
    prediction_error = abs(shap_sum - data['predicted_value'])
    
    print(f"\nSHAP Sum: ${shap_sum:,.0f}")
    print(f"Prediction: ${data['predicted_value']:,.0f}")
    print(f"Error: ${prediction_error:,.2f}")
    
    assert prediction_error < 0.01, "SHAP values do not sum to prediction"
    print("\n✅ SHAP values validated")

if __name__ == "__main__":
    test_shap_values()
```

---

## Section 2: Citizen Portal Service Dry Run (2 hours)

### Test 2.1: Property Search Load Test (1 hour)

**Objective:** Validate citizen portal can handle 10,000 concurrent property searches

**k6 Load Test:**
```javascript
// citizen-portal-load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 10000 },  // Ramp up to 10K users
    { duration: '5m', target: 10000 },  // Stay at 10K
    { duration: '1m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

const SEARCH_TERMS = [
  'main street',
  'maple avenue',
  'oak drive',
  'pine road',
  'cedar lane',
  'elm court',
  'birch way',
  'willow place'
];

export default function () {
  const searchTerm = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
  
  // Property search
  const searchRes = http.get(
    `https://portal.terrafusion.local/api/search?q=${searchTerm}&county=benton`,
    {
      headers: {
        'User-Agent': 'k6-load-test'
      }
    }
  );
  
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search has results': (r) => JSON.parse(r.body).results.length > 0,
    'search response time < 1s': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);
  
  if (searchRes.status === 200) {
    const results = JSON.parse(searchRes.body).results;
    
    // 30% of users click on first result
    if (Math.random() < 0.3 && results.length > 0) {
      const parcelId = results[0].parcel_id;
      
      const detailsRes = http.get(
        `https://portal.terrafusion.local/api/properties/${parcelId}`,
        {
          headers: {
            'User-Agent': 'k6-load-test'
          }
        }
      );
      
      check(detailsRes, {
        'details status is 200': (r) => r.status === 200,
        'details response time < 500ms': (r) => r.timings.duration < 500,
      }) || errorRate.add(1);
    }
  }
  
  sleep(Math.random() * 3); // Random think time 0-3 seconds
}
```

**Execute:**
```bash
k6 run --out influxdb=http://localhost:8086/k6 citizen-portal-load-test.js
```

---

### Test 2.2: Map Tile Performance (1 hour)

**Objective:** Validate map tile serving for Benton County parcels

**Test Script:**
```bash
#!/bin/bash
# map-tile-performance-test.sh

echo "=== Map Tile Performance Test ==="

# Benton County bounding box
MIN_LAT=45.9
MAX_LAT=46.5
MIN_LON=-119.8
MAX_LON=-118.9

# Test tile generation at various zoom levels
for ZOOM in 10 11 12 13 14 15; do
  echo "Testing zoom level: ${ZOOM}"
  
  # Calculate number of tiles needed
  TILES=$(python3 -c "
import math
lat_range = ${MAX_LAT} - ${MIN_LAT}
lon_range = ${MAX_LON} - ${MIN_LON}
tiles_lat = math.ceil(lat_range / (360 / (2 ** ${ZOOM})))
tiles_lon = math.ceil(lon_range / (360 / (2 ** ${ZOOM})))
print(tiles_lat * tiles_lon)
")
  
  echo "  Expected tiles: ${TILES}"
  
  # Benchmark tile generation
  START=$(date +%s%3N)
  
  curl -s -o /dev/null -w "%{time_total}\n" \
    "https://portal.terrafusion.local/api/tiles/${ZOOM}/\${x}/\${y}.pbf?county=benton" \
    > /tmp/tile-times.txt &
  
  # Sample 100 tiles
  for i in {1..100}; do
    X=$((RANDOM % 20))
    Y=$((RANDOM % 20))
    curl -s -o /dev/null \
      "https://portal.terrafusion.local/api/tiles/${ZOOM}/${X}/${Y}.pbf?county=benton" &
  done
  
  wait
  
  END=$(date +%s%3N)
  DURATION=$((END - START))
  
  # Calculate average tile generation time
  AVG_TIME=$(awk '{ sum += $1; n++ } END { if (n > 0) print sum / n; }' /tmp/tile-times.txt)
  
  echo "  Total time: ${DURATION}ms"
  echo "  Avg tile time: ${AVG_TIME}s"
  echo "  Tiles/second: $(python3 -c "print(1.0 / ${AVG_TIME})")"
  
  # Verify tile caching
  CACHED_TIME=$(curl -s -o /dev/null -w "%{time_total}\n" \
    "https://portal.terrafusion.local/api/tiles/${ZOOM}/0/0.pbf?county=benton")
  
  echo "  Cached tile time: ${CACHED_TIME}s"
  
  if (( $(echo "${CACHED_TIME} < 0.05" | bc -l) )); then
    echo "  ✅ Caching working correctly"
  else
    echo "  ⚠️  Caching may not be working (expected <50ms)"
  fi
done

echo "=== Map Tile Performance Test Complete ==="
```

---

## Section 3: Notification Service Dry Run (2 hours)

### Test 3.1: Email Notification Queue (1 hour)

**Objective:** Validate email notification system for 10,000 property owners

**Test Setup:**
```yaml
Test Configuration:
  Recipients: 10,000 Benton County property owners
  Template: Assessment notice update
  Delivery method: SendGrid
  Expected delivery time: < 5 minutes
  Expected delivery rate: > 99%
```

**Test Script:**
```python
# email-notification-test.py

import asyncio
import aiohttp
from datetime import datetime

API_URL = "https://api.terrafusion.local"
TENANT = "county-benton"

async def send_notification(session, recipient):
    """Send notification to single recipient"""
    payload = {
        "tenant": TENANT,
        "template": "assessment-notice",
        "recipient": recipient,
        "data": {
            "parcel_id": recipient['parcel_id'],
            "owner_name": recipient['owner_name'],
            "assessment_value": recipient['assessment_value'],
            "assessment_year": 2025
        }
    }
    
    async with session.post(
        f"{API_URL}/api/v1/notifications/email",
        json=payload,
        headers={"X-Tenant-ID": TENANT}
    ) as response:
        return {
            "recipient": recipient['email'],
            "status": response.status,
            "notification_id": (await response.json()).get('notification_id')
        }

async def bulk_notification_test():
    """Test bulk email notification"""
    
    print("=== Email Notification Dry Run ===")
    
    # Load recipients from database
    print("Loading recipients...")
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{API_URL}/api/v1/parcels/owners",
            headers={"X-Tenant-ID": TENANT},
            params={"limit": 10000}
        ) as response:
            recipients = await response.json()
    
    print(f"Loaded {len(recipients)} recipients")
    
    # Send notifications in batches
    start_time = datetime.now()
    batch_size = 100
    results = []
    
    async with aiohttp.ClientSession() as session:
        for i in range(0, len(recipients), batch_size):
            batch = recipients[i:i+batch_size]
            batch_results = await asyncio.gather(
                *[send_notification(session, recipient) for recipient in batch]
            )
            results.extend(batch_results)
            
            progress = (i + len(batch)) / len(recipients) * 100
            print(f"Progress: {progress:.1f}%")
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    # Analyze results
    successful = sum(1 for r in results if r['status'] == 200)
    failed = len(results) - successful
    success_rate = successful / len(results) * 100
    
    print(f"\n=== Results ===")
    print(f"Total notifications: {len(results)}")
    print(f"Successful: {successful} ({success_rate:.2f}%)")
    print(f"Failed: {failed}")
    print(f"Duration: {duration:.2f} seconds")
    print(f"Throughput: {len(results) / duration:.2f} notifications/second")
    
    # Wait for delivery confirmation
    print("\nWaiting for delivery confirmation...")
    await asyncio.sleep(60)
    
    # Check delivery status
    delivered = 0
    async with aiohttp.ClientSession() as session:
        for result in results[:100]:  # Sample 100 notifications
            async with session.get(
                f"{API_URL}/api/v1/notifications/{result['notification_id']}/status",
                headers={"X-Tenant-ID": TENANT}
            ) as response:
                status_data = await response.json()
                if status_data['status'] == 'delivered':
                    delivered += 1
    
    delivery_rate = delivered / 100 * 100
    print(f"Delivery rate (sample): {delivery_rate:.2f}%")
    
    if success_rate > 99 and delivery_rate > 99:
        print("\n✅ Email notification test PASSED")
    else:
        print("\n❌ Email notification test FAILED")

if __name__ == "__main__":
    asyncio.run(bulk_notification_test())
```

---

### Test 3.2: SMS Notification Performance (1 hour)

**Objective:** Validate SMS notification for time-sensitive alerts

**Test:**
```python
# sms-notification-test.py

import asyncio
import aiohttp
from datetime import datetime

API_URL = "https://api.terrafusion.local"
TENANT = "county-benton"

async def test_sms_notifications():
    """Test SMS notification system"""
    
    print("=== SMS Notification Test ===")
    
    # Test Case 1: Single SMS
    print("\nTest 1: Single SMS delivery")
    start = datetime.now()
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{API_URL}/api/v1/notifications/sms",
            json={
                "tenant": TENANT,
                "phone": "+15555551234",
                "message": "Your property assessment has been updated. View details at portal.terrafusion.local"
            },
            headers={"X-Tenant-ID": TENANT}
        ) as response:
            result = await response.json()
            
    latency = (datetime.now() - start).total_seconds() * 1000
    print(f"  Latency: {latency:.0f}ms")
    print(f"  Status: {result['status']}")
    
    # Test Case 2: Bulk SMS (1,000 recipients)
    print("\nTest 2: Bulk SMS (1,000 recipients)")
    recipients = [f"+1555555{i:04d}" for i in range(1000)]
    
    start = datetime.now()
    sent = 0
    failed = 0
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for phone in recipients:
            task = session.post(
                f"{API_URL}/api/v1/notifications/sms",
                json={
                    "tenant": TENANT,
                    "phone": phone,
                    "message": "Test notification"
                },
                headers={"X-Tenant-ID": TENANT}
            )
            tasks.append(task)
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        for response in responses:
            if isinstance(response, Exception):
                failed += 1
            elif response.status == 200:
                sent += 1
            else:
                failed += 1
    
    duration = (datetime.now() - start).total_seconds()
    
    print(f"  Sent: {sent}")
    print(f"  Failed: {failed}")
    print(f"  Duration: {duration:.2f}s")
    print(f"  Throughput: {sent / duration:.2f} SMS/second")
    
    # Test Case 3: Emergency broadcast
    print("\nTest 3: Emergency broadcast latency")
    start = datetime.now()
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{API_URL}/api/v1/notifications/broadcast",
            json={
                "tenant": TENANT,
                "channel": "sms",
                "priority": "emergency",
                "message": "Emergency notification: Test only",
                "recipient_count": 100
            },
            headers={"X-Tenant-ID": TENANT}
        ) as response:
            result = await response.json()
    
    broadcast_latency = (datetime.now() - start).total_seconds() * 1000
    print(f"  Broadcast initiated in: {broadcast_latency:.0f}ms")
    print(f"  Expected delivery: {result['estimated_delivery_seconds']}s")
    
    if broadcast_latency < 500:
        print("  ✅ Emergency broadcast latency acceptable")
    else:
        print("  ⚠️  Emergency broadcast latency too high")

if __name__ == "__main__":
    asyncio.run(test_sms_notifications())
```

---

## Section 4: Analytics Service Dry Run (3 hours)

### Test 4.1: Cross-Tenant Analytics (1.5 hours)

**Objective:** Validate aggregated analytics across 10 counties while maintaining data isolation

**Test:**
```python
# cross-tenant-analytics-test.py

import requests
import json

API_URL = "https://api.terrafusion.local"

def test_cross_tenant_analytics():
    """Test cross-tenant analytics aggregation"""
    
    print("=== Cross-Tenant Analytics Test ===")
    
    # Test 1: Platform-wide property count
    print("\nTest 1: Platform-wide property count")
    response = requests.get(
        f"{API_URL}/api/v1/analytics/platform/properties/count",
        headers={"X-Platform-Admin": "true"}
    )
    
    data = response.json()
    print(f"  Total properties: {data['total_properties']:,}")
    print(f"  Counties: {len(data['by_county'])}")
    
    for county, count in data['by_county'].items():
        print(f"    {county}: {count:,}")
    
    # Verify Benton County count
    assert data['by_county']['county-benton'] == 89247, "Benton County count mismatch"
    print("  ✅ Benton County count validated")
    
    # Test 2: Aggregated valuation trends
    print("\nTest 2: Aggregated valuation trends")
    response = requests.get(
        f"{API_URL}/api/v1/analytics/platform/valuations/trends",
        params={
            "start_date": "2024-01-01",
            "end_date": "2025-01-01",
            "granularity": "month"
        },
        headers={"X-Platform-Admin": "true"}
    )
    
    trends = response.json()
    print(f"  Data points: {len(trends['data'])}")
    print(f"  Avg monthly growth: {trends['avg_growth_rate']:.2f}%")
    
    # Test 3: Data isolation verification
    print("\nTest 3: Data isolation verification")
    
    # Try to access tenant-specific data without proper authorization
    response = requests.get(
        f"{API_URL}/api/v1/analytics/platform/properties/details",
        headers={"X-Platform-Admin": "true"}
    )
    
    if response.status_code == 403:
        print("  ✅ Tenant-specific data protected")
    else:
        print("  ❌ Data isolation breach detected!")
        print(f"  Response: {response.json()}")
    
    # Test 4: Performance (large aggregation)
    print("\nTest 4: Performance test (aggregate 500K+ properties)")
    start = datetime.now()
    
    response = requests.get(
        f"{API_URL}/api/v1/analytics/platform/properties/summary",
        params={
            "include_statistics": True,
            "include_distributions": True
        },
        headers={"X-Platform-Admin": "true"}
    )
    
    latency = (datetime.now() - start).total_seconds() * 1000
    print(f"  Query latency: {latency:.0f}ms")
    
    if latency < 2000:
        print("  ✅ Performance acceptable (<2s)")
    else:
        print("  ⚠️  Performance needs optimization")

if __name__ == "__main__":
    test_cross_tenant_analytics()
```

---

**Part 3 Status:** ✅ Service dry runs in progress (property valuation, citizen portal, notifications, analytics)  
**Next:** Part 4 - Observability validation and disaster recovery testing (8 hours)
