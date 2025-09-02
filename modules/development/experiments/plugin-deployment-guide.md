# Terrafusion Records Plugin Deployment Guide

## Quick Start (Get to RFP-ready in 48 hours)

### Step 1: Deploy Both Plugins (30 minutes)

```bash
# Clone plugins to your Terrafusion installation
cd /opt/terrafusion
git clone https://github.com/terrafusion/land-recording-plugin plugins/land-recording
git clone https://github.com/terrafusion/public-portal-plugin plugins/public-portal

# Run database migrations
docker-compose exec postgres psql -U terrafusion < plugins/land-recording/schema.sql
docker-compose exec postgres psql -U terrafusion < plugins/public-portal/schema.sql

# Update docker-compose.yml (add services)
cat plugins/land-recording/docker-compose.yml >> docker-compose.yml
cat plugins/public-portal/docker-compose.yml >> docker-compose.yml

# Deploy
docker-compose up -d land-recording public-portal

# Verify deployment
curl http://localhost:8082/health  # Land Recording
curl http://localhost:8083/health  # Public Portal
```

### Step 2: Configure Integrations (2 hours)

```yaml
# config/plugins.yml
plugins:
  land_recording:
    enabled: true
    api_endpoint: http://land-recording:8082
    storage: s3  # or 'local'
    s3_bucket: ${S3_BUCKET}
    ocr_enabled: true
    redaction_auto: true
    
  public_portal:
    enabled: true
    api_endpoint: http://public-portal:8083
    public_url: https://records.${COUNTY_DOMAIN}
    foia_deadline_days: 5  # State-specific
    
  integrations:
    # Link recordings to parcels
    sync_to_gis: true
    # Publish to public portal
    auto_publish: true
    # Payment gateway (uses existing Collections)
    payment_gateway: stripe
```

### Step 3: Data Migration (4-8 hours)

```python
# migrate_legacy_recordings.py
import psycopg2
import csv
from datetime import datetime

# Connect to databases
legacy_conn = psycopg2.connect("host=legacy-server dbname=recordings")
terra_conn = psycopg2.connect("host=localhost dbname=terrafusion")

# Migrate document types
with legacy_conn.cursor() as src, terra_conn.cursor() as dst:
    src.execute("SELECT * FROM document_types")
    for row in src.fetchall():
        dst.execute("""
            INSERT INTO land_records.document_types 
            (code, name, category, base_fee, per_page_fee)
            VALUES (%s, %s, %s, %s, %s)
        """, (row['code'], row['name'], row['category'], 
              row['base_fee'], row['per_page_fee']))

# Migrate recordings (with progress bar)
from tqdm import tqdm
src.execute("SELECT COUNT(*) FROM recordings")
total = src.fetchone()[0]

src.execute("SELECT * FROM recordings ORDER BY recording_date")
for row in tqdm(src.fetchall(), total=total):
    # Map legacy fields to new schema
    dst.execute("""
        INSERT INTO land_records.recordings (
            recording_number, legacy_book_page,
            grantor_names, grantee_names,
            recording_date, page_count,
            legal_description, status
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'recorded')
    """, (
        row['doc_number'],
        f"{row['book']}-{row['page']}",
        row['grantor'].split(';'),
        row['grantee'].split(';'),
        row['rec_date'],
        row['pages'],
        row['legal_desc']
    ))

terra_conn.commit()
print(f"✓ Migrated {total} recordings")
```

## Integration Points

### 1. Connect to Existing Terrafusion Modules

```javascript
// api/integrations/parcel-link.js
// Link recordings to parcels in TerraFusionGIS

async function linkRecordingToParcel(recordingId, parcelIds) {
  // Update recording with parcel geometry
  const parcels = await pool.query(
    'SELECT ST_Union(geom) as geom FROM parcels WHERE parcel_id = ANY($1)',
    [parcelIds]
  );
  
  await pool.query(
    'UPDATE land_records.recordings SET property_geom = $1 WHERE id = $2',
    [parcels.rows[0].geom, recordingId]
  );
  
  // Create cross-reference for property timeline
  for (const parcelId of parcelIds) {
    await pool.query(
      'INSERT INTO parcel_recordings (parcel_id, recording_id) VALUES ($1, $2)',
      [parcelId, recordingId]
    );
  }
}
```

### 2. Payment Integration with Collections

```javascript
// Use existing Terrafusion Collections for recording fees
const TerraCollections = require('@terrafusion/collections-client');

async function processRecordingPayment(recordingIds) {
  const recordings = await getRecordings(recordingIds);
  
  // Create invoice in Collections
  const invoice = await TerraCollections.createInvoice({
    type: 'RECORDING_FEES',
    lineItems: recordings.map(r => ({
      description: `Recording ${r.recording_number}`,
      amount: r.total_collected,
      parcelId: r.parcel_ids[0] // Link to property account
    })),
    dueDate: new Date()
  });
  
  // Generate payment session
  return TerraCollections.createPaymentSession(invoice.id);
}
```

### 3. AI-Powered Document Processing

```javascript
// Integrate with TerraAgent for intelligent parsing
const TerraAgent = require('@terrafusion/agent-client');

async function enhanceDocumentParsing(ocrText, documentType) {
  // Use TerraAgent to extract structured data
  const analysis = await TerraAgent.analyze({
    task: 'extract_recording_data',
    documentType,
    text: ocrText,
    schema: {
      grantors: 'array<string>',
      grantees: 'array<string>',
      consideration: 'number',
      legal_description: 'string',
      parcel_ids: 'array<string>'
    }
  });
  
  return analysis.extracted_data;
}
```

## Security & Compliance Configuration

### 1. WCAG 2.1 AA Compliance

```javascript
// accessibility-config.js
module.exports = {
  // Automated testing in CI/CD
  a11y: {
    standard: 'WCAG2AA',
    runners: ['axe', 'pa11y'],
    viewports: ['mobile', 'tablet', 'desktop'],
    
    // Pages to test
    urls: [
      '/public-records',
      '/public-records/search',
      '/public-records/foia-request'
    ],
    
    // Allowed violations during transition
    ignore: [
      'color-contrast', // Fix by March 1
      'heading-order'   // Fix by March 15
    ]
  }
};
```

### 2. PII Detection & Redaction

```python
# redaction_service.py
import re
import fitz  # PyMuPDF
from PIL import Image
import pytesseract

class RedactionService:
    # PII patterns to detect
    PATTERNS = {
        'ssn': r'\b\d{3}-\d{2}-\d{4}\b',
        'ein': r'\b\d{2}-\d{7}\b',
        'account': r'\b[A-Z]{2}\d{8,12}\b',
        'dob': r'\b(0[1-9]|1[0-2])/(0[1-9]|[12]\d|3[01])/\d{4}\b',
        'dl': r'\b[A-Z]\d{7,12}\b'  # Driver's license
    }
    
    def auto_redact_pdf(self, input_path, output_path):
        doc = fitz.open(input_path)
        
        for page in doc:
            # Extract text with positions
            words = page.get_text("words")
            
            for word in words:
                text = word[4]
                # Check each pattern
                for pattern_name, pattern in self.PATTERNS.items():
                    if re.match(pattern, text):
                        # Redact matching text
                        rect = fitz.Rect(word[:4])
                        page.add_redact_annot(rect)
            
            # Apply redactions
            page.apply_redactions()
        
        doc.save(output_path)
        return output_path
```

### 3. SSO Integration

```javascript
// sso-config.js for Okta/Azure AD
const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;

// County Okta configuration
passport.use(new SamlStrategy({
    entryPoint: process.env.OKTA_ENTRY_POINT,
    issuer: 'terrafusion-records',
    callbackUrl: 'https://records.county.gov/auth/callback',
    cert: process.env.OKTA_CERT,
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent'
  },
  (profile, done) => {
    // Map Okta groups to Terrafusion roles
    const roles = [];
    if (profile.groups.includes('RecordingClerks')) {
      roles.push('recording_clerk');
    }
    if (profile.groups.includes('FOIAOfficers')) {
      roles.push('foia_officer');
    }
    
    return done(null, {
      id: profile.nameID,
      email: profile.email,
      name: profile.displayName,
      roles: roles
    });
  }
));
```

## E-Recording Partner Integration

### Option A: Simplifile Integration (Quick - 2 weeks)

```javascript
// erecording/simplifile.js
const axios = require('axios');
const xmlbuilder = require('xmlbuilder');

class SimplifileConnector {
  constructor(config) {
    this.apiUrl = config.apiUrl;
    this.username = config.username;
    this.password = config.password;
  }
  
  async receivePackage(priaXml) {
    // Parse PRIA 3.0 XML
    const package = await this.parsePRIA(priaXml);
    
    // Store in queue
    const queueId = await this.queuePackage(package);
    
    // Send acknowledgment
    return this.buildAcknowledgment(package.submissionId);
  }
  
  buildAcknowledgment(submissionId) {
    const ack = xmlbuilder.create('PRIA_RESPONSE')
      .att('xmlns', 'http://pria.org/schemas/3.0')
      .ele('PRIA_RESPONSE_GROUP')
        .ele('RESPONSE_STATUS', 'Received')
        .ele('RESPONSE_ID', submissionId)
        .ele('RESPONSE_DATE', new Date().toISOString())
      .end();
    
    return ack.toString();
  }
}
```

### Option B: Direct Submitter Integration (4 weeks)

```javascript
// erecording/direct-api.js
// RESTful API for major submitters (First American, Fidelity, etc.)

app.post('/api/erecording/v1/submit', authenticate, async (req, res) => {
  const { documents, metadata, payment } = req.body;
  
  // Validate submitter credentials
  const submitter = await validateSubmitter(req.auth);
  
  // Process each document
  const recordings = [];
  for (const doc of documents) {
    const recording = await processErecording({
      document: doc,
      submitter: submitter,
      metadata: metadata
    });
    recordings.push(recording);
  }
  
  // Calculate and charge fees
  const fees = calculateFees(recordings);
  await chargeSubmitter(submitter, fees, payment);
  
  // Return recording numbers
  res.json({
    success: true,
    recordings: recordings.map(r => ({
      recordingNumber: r.recording_number,
      fees: r.total_collected,
      status: 'recorded'
    }))
  });
});
```

## Performance Optimization

### 1. Search Optimization

```sql
-- Optimize recording searches with proper indexes
CREATE INDEX idx_recording_date_brin ON land_records.recordings 
  USING brin(recording_date) WITH (pages_per_range = 128);

-- Partition by year for large counties
CREATE TABLE land_records.recordings_2024 PARTITION OF land_records.recordings
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Materialized view for common searches
CREATE MATERIALIZED VIEW land_records.recent_recordings AS
SELECT * FROM land_records.recordings 
WHERE recording_date >= CURRENT_DATE - INTERVAL '90 days'
WITH DATA;

CREATE INDEX idx_recent_rec_search ON land_records.recent_recordings 
  USING gin(search_vector);

-- Refresh daily
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('refresh-recent', '0 2 * * *', 
  'REFRESH MATERIALIZED VIEW CONCURRENTLY land_records.recent_recordings');
```

### 2. Document Storage Strategy

```javascript
// Hybrid storage: Hot/Cold tiers
class DocumentStorage {
  constructor() {
    this.hotStorage = new S3({ bucket: 'recordings-hot' });  // Last 90 days
    this.coldStorage = new S3({ bucket: 'recordings-cold' }); // Glacier
    this.cache = new Redis();
  }
  
  async store(document, recordingDate) {
    const ageInDays = daysSince(recordingDate);
    
    if (ageInDays < 90) {
      // Hot tier - immediate access
      await this.hotStorage.upload(document);
      await this.cache.set(document.id, document.data, 'EX', 3600);
    } else {
      // Cold tier - Glacier Deep Archive
      await this.coldStorage.upload(document, {
        StorageClass: 'DEEP_ARCHIVE'
      });
    }
  }
  
  async retrieve(documentId, recordingDate) {
    // Check cache first
    const cached = await this.cache.get(documentId);
    if (cached) return cached;
    
    // Determine storage tier
    const ageInDays = daysSince(recordingDate);
    if (ageInDays < 90) {
      return await this.hotStorage.download(documentId);
    } else {
      // Initiate Glacier retrieval (12-48 hours)
      await this.coldStorage.initiateRetrieval(documentId);
      throw new Error('Document retrieval initiated. Please check back in 24 hours.');
    }
  }
}
```

## Monitoring & Analytics

### 1. Dashboard Metrics

```javascript
// metrics/dashboard.js
const metrics = {
  // Real-time metrics
  realtime: {
    recordingsToday: 'SELECT COUNT(*) FROM recordings WHERE DATE(recording_date) = CURRENT_DATE',
    revenueToday: 'SELECT SUM(total_collected) FROM recordings WHERE DATE(recording_date) = CURRENT_DATE',
    erecordingQueue: 'SELECT COUNT(*) FROM erecording_queue WHERE package_status = "processing"',
    
    // FOIA metrics
    foiaOverdue: `SELECT COUNT(*) FROM records_requests 
                  WHERE status NOT IN ('completed', 'denied', 'withdrawn') 
                  AND response_deadline < CURRENT_DATE`,
    foiaDueThisWeek: `SELECT COUNT(*) FROM records_requests 
                       WHERE response_deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + 7`
  },
  
  // KPIs for monthly reporting
  monthly: {
    avgResponseTime: `SELECT AVG(time_to_complete) FROM records_requests 
                       WHERE actual_response_date >= DATE_TRUNC('month', CURRENT_DATE)`,
    documentTypesBreakdown: `SELECT document_type, COUNT(*), SUM(total_collected) 
                              FROM recordings 
                              WHERE recording_date >= DATE_TRUNC('month', CURRENT_DATE)
                              GROUP BY document_type`,
    foiaCompletionRate: `SELECT 
                          COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*)
                          FROM records_requests 
                          WHERE request_date >= DATE_TRUNC('month', CURRENT_DATE)`
  }
};
```

### 2. Alerting Rules

```yaml
# prometheus-alerts.yml
groups:
  - name: recording_alerts
    rules:
      - alert: HighRedactionQueue
        expr: redaction_queue_pending > 50
        for: 1h
        annotations:
          summary: "High redaction queue: {{ $value }} documents pending"
          
      - alert: ErecordingBacklog
        expr: erecording_queue_age_minutes > 60
        annotations:
          summary: "E-recording package waiting > 60 minutes"
          
      - alert: FOIADeadlineMissed
        expr: foia_overdue_count > 0
        annotations:
          summary: "{{ $value }} FOIA requests past deadline"
          priority: high
```

## RFP Response Templates

### 1. Feature Compliance Matrix

| Requirement | Terrafusion Status | Notes |
|------------|-------------------|--------|
| Land Recording System | ✅ Ready | Full e-recording, indexing, cashiering |
| Public Records Portal | ✅ Ready | FOIA management, document search |
| Document Imaging | ✅ Ready | OCR, auto-indexing, redaction |
| E-Recording Integration | ✅ Ready | PRIA 3.0 compliant, major vendors |
| Payment Processing | ✅ Native | PCI compliant via Collections module |
| GIS Integration | ✅ Native | PostGIS, parcel linking |
| SSO/MFA | ✅ Ready | SAML 2.0, OIDC support |
| WCAG 2.1 AA | 🔄 In Progress | Compliance by March 2025 |
| Offline Operation | ✅ Native | Full offline mode with sync |
| AI/ML Capabilities | ✅ Native | TerraAgent for document parsing |

### 2. Implementation Timeline

**Week 1-2: Core Deployment**
- Deploy Land Recording & Public Portal plugins
- Configure SSO integration
- Set up payment gateway

**Week 3-4: Data Migration**
- Migrate historical recordings
- Import document types & fee schedules
- Convert legacy book/page references

**Week 5-6: Integration & Testing**
- Connect to existing Terrafusion modules
- E-recording partner testing
- User acceptance testing

**Week 7-8: Training & Go-Live**
- Staff training (2 days)
- Soft launch with parallel running
- Full cutover

### 3. Pricing Model

```
Terrafusion Records Suite Pricing
==================================
One-Time Setup:
- Plugin Deployment & Config: $15,000
- Data Migration (up to 1M records): $25,000
- E-Recording Integration: $10,000
- Training (up to 20 users): $5,000

Annual Subscription:
- Base Platform: $48,000/year
- Land Recording Module: $36,000/year
- Public Portal Module: $24,000/year
- E-Recording Gateway: $12,000/year
- Support & Maintenance (20%): $24,000/year

Total Year 1: $199,000
Annual Renewal: $144,000

Optional Add-ons:
- STR Compliance Module: $18,000/year
- Business Licensing Portal: $24,000/year
- Advanced Analytics: $12,000/year
```

## Support & Maintenance

### Weekly Health Checks

```bash
#!/bin/bash
# health-check.sh - Run weekly

echo "=== Terrafusion Records Health Check ==="

# Check services
for service in land-recording public-portal postgres redis; do
  if docker-compose ps $service | grep -q "Up"; then
    echo "✓ $service: Running"
  else
    echo "✗ $service: DOWN - Restarting..."
    docker-compose restart $service
  fi
done

# Check disk space
USAGE=$(df -h /data/recordings | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $USAGE -gt 80 ]; then
  echo "⚠ Storage at $USAGE% - Archive old recordings"
fi

# Check database
docker-compose exec postgres psql -U terrafusion -c "
  SELECT 'Recordings today:', COUNT(*) FROM land_records.recordings 
  WHERE DATE(recording_date) = CURRENT_DATE;
  
  SELECT 'FOIA overdue:', COUNT(*) FROM public_portal.records_requests 
  WHERE status NOT IN ('completed','denied') AND response_deadline < CURRENT_DATE;
"

# Check SSL certificates
echo "SSL Certificate expires:"
echo | openssl s_client -servername records.county.gov -connect records.county.gov:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter
```

### Disaster Recovery

```yaml
# backup-restore.yml
backup:
  schedule: "0 2 * * *"  # 2 AM daily
  retention:
    daily: 7
    weekly: 4
    monthly: 12
  
  databases:
    - name: terrafusion
      schemas: [land_records, public_portal]
      format: custom  # pg_dump -Fc
      compression: 9
  
  documents:
    - path: /data/recordings
      destination: s3://backup-bucket/recordings/
      incremental: true
  
restore_test:
  schedule: "0 3 * * 0"  # Weekly Sunday 3 AM
  target: staging-server
  verify:
    - row_counts
    - document_samples
    - search_functionality
```

## Go-Live Checklist

- [ ] **Infrastructure**
  - [ ] Production servers provisioned
  - [ ] SSL certificates installed
  - [ ] Firewall rules configured
  - [ ] Backup systems tested

- [ ] **Data**
  - [ ] Historical records migrated
  - [ ] Document images transferred
  - [ ] Fee schedules configured
  - [ ] User accounts created

- [ ] **Integrations**
  - [ ] Payment gateway live
  - [ ] E-recording tested with vendors
  - [ ] GIS parcel linking verified
  - [ ] SSO/MFA working

- [ ] **Compliance**
  - [ ] WCAG 2.1 AA scan passed
  - [ ] PCI compliance verified
  - [ ] Security scan completed
  - [ ] Penetration test passed

- [ ] **Training**
  - [ ] Clerk staff trained
  - [ ] FOIA officers trained
  - [ ] IT staff trained
  - [ ] User guides distributed

- [ ] **Rollback Plan**
  - [ ] Legacy system on standby
  - [ ] Data sync scripts ready
  - [ ] Rollback procedure documented
  - [ ] Communication plan prepared

---

**Support Contact**: support@terrafusion.ai | 1-800-TERRA-FN
**Documentation**: https://docs.terrafusion.ai/records
**Status Page**: https://status.terrafusion.ai