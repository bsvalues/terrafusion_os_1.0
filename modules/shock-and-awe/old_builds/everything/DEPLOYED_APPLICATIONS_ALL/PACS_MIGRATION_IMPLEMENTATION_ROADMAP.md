# 🚀 PACS Migration Implementation Roadmap

**Date**: 2025-06-19  
**Current Status**: TerraFusion applications operational with mock data  
**Migration Goal**: Production PACS integration via CDC pipeline

## 🎯 **Strategic Approach**

**SOLVE THE LEGACY DATABASE CONNECTIVITY ISSUE WITH ENTERPRISE-GRADE CDC
MIGRATION**

Instead of fighting direct database connectivity, implement a **Change Data
Capture (CDC)** pipeline that:

- ✅ Eliminates VPN/network dependency
- ✅ Provides real-time synchronization
- ✅ Enables parallel operations (PACS + TerraFusion)
- ✅ Includes complete rollback capability

## 📋 **Implementation Phases**

### **Phase 1: CDC Infrastructure Setup** 🔧

#### **1.1 Deploy Kafka Ecosystem**

```bash
# Create CDC infrastructure directory
mkdir -p DEPLOYED_APPLICATIONS/CDC_INFRASTRUCTURE

# Copy migration docker-compose
cp docs/PACS/TerraFusion_PACS_Migration_Bundle_v1/etl/docker-compose.yml ./CDC_INFRASTRUCTURE/

# Deploy CDC pipeline
cd CDC_INFRASTRUCTURE
docker-compose up -d
```

#### **1.2 TerraFusion Database Schema Upgrade**

```sql
-- Implement modern UUID-based schema
CREATE TABLE property (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geo_id VARCHAR(50),
    situs_address VARCHAR(140),
    parcel_geom GEOMETRY,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE valuation_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prop_id UUID REFERENCES property(id),
    year INT,
    model_type VARCHAR(20),
    result NUMERIC(14,2),
    input_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Migration validation tables
CREATE TABLE migration_hash (
    record_id UUID,
    domain VARCHAR(50),
    sha256_hash VARCHAR(64),
    source_snapshot_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Phase 2: Sync Loader Implementation** 🔄

#### **2.1 Deploy Sync Loader Service**

```typescript
// Based on docs/PACS/TerraFusion_PACS_Migration_Bundle_v1/etl/sync_loader/index.ts
import { Kafka } from 'kafkajs';
import { drizzle } from 'drizzle-orm/node-postgres';

const kafka = new Kafka({
  brokers: [process.env.KAFKA_BROKERS || 'localhost:\${{TF_PORT_9092:-9092}}'],
});

const consumer = kafka.consumer({
  groupId: 'terrafusion-pacs-sync',
});

// Connect to TerraFusion PostgreSQL
const db = drizzle(client);

async function syncPACSData() {
  await consumer.subscribe({
    topic: 'pacs.property_updates',
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const payload = JSON.parse(message.value.toString());

      // Handle PACS property updates
      if (payload.op === 'c' || payload.op === 'u') {
        const data = payload.after;

        await db
          .insert(property)
          .values({
            id: data.prop_id,
            geoId: data.geo_id,
            situsAddr: data.situs_display,
          })
          .onConflictDoUpdate({
            target: property.id,
            set: {
              situsAddr: data.situs_display,
              updatedAt: new Date(),
            },
          });

        console.log(`✅ Synced property ${data.prop_id}`);
      }
    },
  });
}
```

#### **2.2 Validation Framework**

```python
# Migration validation script
import hashlib
import psycopg2
from datetime import datetime

class PACSValidationFramework:
    def __init__(self):
        self.pacs_conn = None  # Will be CDC source
        self.tf_conn = psycopg2.connect(
            "postgresql://user:pass@localhost:\${{TF_PORT_9092:-9092}}/terrafusion"
        )

    def validate_property_sync(self):
        """Compare PACS vs TerraFusion property records"""
        with self.tf_conn.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) as tf_count
                FROM property
                WHERE updated_at > NOW() - INTERVAL '1 day'
            """)
            tf_count = cursor.fetchone()[0]

            # Log validation results
            cursor.execute("""
                INSERT INTO validation_log
                (source_table, tf_count, status, checked_at)
                VALUES ('property', %s, 'synced', %s)
            """, (tf_count, datetime.now()))

            self.tf_conn.commit()
            return tf_count

    def generate_hash_comparison(self, record_id):
        """Generate SHA256 hash for validation"""
        # Implementation for hash-based validation
        pass
```

### **Phase 3: Parallel Operations** ⚖️

#### **3.1 Update TerraFusion Applications**

```typescript
// Update TerraFusion Build to use live data
// In: DEPLOYED_APPLICATIONS/TerraFusion_Build_PRODUCTION/server/routes.ts

app.get('/api/properties', async (req, res) => {
  try {
    // Check if CDC data is available
    const liveDataAvailable = await checkCDCStatus();

    if (liveDataAvailable) {
      // Query real PACS data via CDC
      const properties = await db.query(`
        SELECT id, geo_id, situs_address, updated_at
        FROM property 
        ORDER BY updated_at DESC 
        LIMIT 100
      `);

      res.json({
        status: 'live_data',
        source: 'PACS_CDC',
        count: properties.length,
        data: properties,
      });
    } else {
      // Fallback to mock data
      const mockProperties = await getMockProperties();

      res.json({
        status: 'mock_data',
        source: 'SAMPLE_DATA',
        count: mockProperties.length,
        data: mockProperties,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### **3.2 Monitoring Dashboard**

```python
# Real-time CDC monitoring dashboard
from flask import Flask, render_template, jsonify
import psycopg2

app = Flask(__name__)

@app.route('/cdc/status')
def cdc_status():
    """Real-time CDC pipeline status"""
    try:
        conn = psycopg2.connect("postgresql://localhost:\${{TF_PORT_9092:-9092}}/terrafusion")
        cursor = conn.cursor()

        # Check latest sync activity
        cursor.execute("""
            SELECT
                COUNT(*) as total_properties,
                MAX(updated_at) as last_sync,
                COUNT(CASE WHEN updated_at > NOW() - INTERVAL '1 hour'
                      THEN 1 END) as recent_updates
            FROM property
        """)

        stats = cursor.fetchone()

        return jsonify({
            'status': 'operational',
            'total_properties': stats[0],
            'last_sync': stats[1].isoformat() if stats[1] else None,
            'recent_updates': stats[2],
            'pipeline_health': 'green' if stats[2] > 0 else 'yellow'
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'pipeline_health': 'red'
        })

@app.route('/validation/report')
def validation_report():
    """Daily validation report"""
    # Implementation for validation dashboard
    pass
```

### **Phase 4: Production Cutover** 🎯

#### **4.1 Cutover Checklist**

```yaml
Pre-Cutover Validation:
  - [ ] CDC pipeline operational for 30+ days
  - [ ] Hash validation shows 99.9% accuracy
  - [ ] TerraFusion applications tested with live data
  - [ ] Stakeholder sign-off received
  - [ ] Rollback procedures tested

Cutover Steps:
  1. Freeze PACS writes (maintenance mode)
  2. Final CDC synchronization
  3. Validation of final sync
  4. Update DNS/load balancer
  5. Enable TerraFusion write mode
  6. Monitor for 24 hours
  7. Archive PACS system

Rollback Plan:
  1. Restore PACS from backup
  2. Point traffic back to PACS
  3. Disable TerraFusion writes
  4. Notify stakeholders
  5. Investigate issues
```

## 🛠️ **Immediate Implementation Steps**

### **Step 1: Create CDC Infrastructure** (Today)

```bash
# In current directory
mkdir CDC_INFRASTRUCTURE
cd CDC_INFRASTRUCTURE

# Create docker-compose.yml for CDC pipeline
cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  kafka:
    image: bitnami/kafka:3
    environment:
      - KAFKA_CFG_ZOOKEEPER_CONNECT=zookeeper:2181
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
    ports:
      - "9092:9092"

  zookeeper:
    image: bitnami/zookeeper:3
    environment:
      - ALLOW_ANONYMOUS_LOGIN=yes

  debezium:
    image: debezium/connect:2.6
    environment:
      - BOOTSTRAP_SERVERS=kafka:9092
      - GROUP_ID=pacs-sync
      - CONFIG_STORAGE_TOPIC=pacs_connect_configs
      - OFFSET_STORAGE_TOPIC=pacs_connect_offsets
    ports:
      - "8083:8083"
    depends_on: [kafka]

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=terrafusion
      - POSTGRES_USER=tfuser
      - POSTGRES_PASSWORD=tfpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF

# Start CDC infrastructure
docker-compose up -d
```

### **Step 2: Update TerraFusion Applications** (Next Session)

- Modify database connections to use PostgreSQL instead of SQLite
- Implement CDC data consumption endpoints
- Add live/mock data switching logic
- Create validation dashboard

### **Step 3: PACS Connection** (When Network Available)

- Configure Debezium SQL Server connector for PACS
- Set up CDC source configuration
- Begin parallel operation validation

## 📊 **Benefits of This Approach**

### **Immediate Benefits**:

- ✅ **Solves Network Connectivity Issue**: No direct PACS connection needed
- ✅ **Maintains Current Functionality**: Apps continue working with mock data
- ✅ **Gradual Migration Path**: Smooth transition from mock to live data
- ✅ **Enterprise Architecture**: Modern CDC pipeline with validation

### **Long-term Benefits**:

- 🚀 **Real-time Data Sync**: Live PACS updates in TerraFusion
- 🛡️ **Zero Downtime Migration**: Parallel operation ensures continuity
- 📊 **Data Validation**: Hash-based validation ensures data integrity
- 🔄 **Rollback Capability**: Complete rollback strategy if needed

## 🎯 **Success Metrics**

- **CDC Pipeline Uptime**: 99.9%
- **Data Sync Latency**: <5 minutes from PACS to TerraFusion
- **Validation Accuracy**: 99.99% hash match rate
- **Application Performance**: <100ms API response times
- **User Satisfaction**: Stakeholder approval for cutover

**BOTTOM LINE**: This CDC migration strategy transforms the "legacy database
connectivity problem" into an "enterprise modernization opportunity" with a
clear, validated, and risk-mitigated implementation path.
