# 🗄️ Phase 4: Data Infrastructure Setup

**Date:** October 6, 2025  
**Purpose:** Move data out of Git into proper storage systems  
**Current Issue:** 130MB data/ directory + potential large files in docs

---

## 🎯 OBJECTIVES

1. **Setup Object Storage** - For files, datasets, media
2. **Setup Cold Backup Storage** - For archived backups
3. **Setup Container Registry** - For Docker images
4. **Migrate Data** - Move data from Git to storage
5. **Update Code** - Reference storage instead of local files

---

## 📊 DATA AUDIT

### Current Data in Git (Should NOT be here):

```
data/                          130 MB  ← Move to PostgreSQL/Redis/S3
docs/images/ (if any remain)   ???     ← Move to CDN/S3
*.csv files                    ???     ← Move to S3
*.geojson files                ???     ← Move to S3
*.shp files (GIS)              ???     ← Move to S3
User uploads                   ???     ← Move to S3
```

### Proper Storage Strategy:

```
┌─────────────────────────────────────────────────────────────┐
│                 DATA STORAGE ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GIT (Code Only)           STORAGE (Data)                   │
│  ├── Source code           ├── S3/MinIO (files)            │
│  ├── Configs               ├── PostgreSQL (structured)      │
│  ├── Tests                 ├── MongoDB (documents)          │
│  └── Docs (text)           ├── Redis (cache)               │
│                            ├── Elasticsearch (search)       │
│  REGISTRY (Artifacts)      └── CDN (media)                  │
│  ├── Docker Hub                                             │
│  ├── npm registry          ARCHIVES (Backups)               │
│  └── Maven/NuGet           ├── AWS Glacier                  │
│                            ├── Backblaze B2                 │
│                            └── Azure Cool Storage           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ OPTION A: Self-Hosted (MinIO) - Recommended for Dev

### Why MinIO?
- ✅ S3-compatible API (easy migration to AWS later)
- ✅ Self-hosted (cost-effective for dev)
- ✅ High performance
- ✅ Open source
- ✅ Easy Docker deployment

### Setup MinIO:

```bash
# 1. Create docker-compose.yml for data infrastructure
cat > docker-compose.data-infra.yml << 'EOF'
version: '3.8'

services:
  # Object Storage (S3-compatible)
  minio:
    image: minio/minio:latest
    container_name: terrafusion-minio
    ports:
      - "9000:9000"      # API
      - "9001:9001"      # Console
    environment:
      MINIO_ROOT_USER: terraform_admin
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD:-changeme123!}
    volumes:
      - minio-data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # PostgreSQL (Structured Data)
  postgres:
    image: postgis/postgis:15-3.3
    container_name: terrafusion-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: terrafusion
      POSTGRES_USER: terrafusion
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-terrafusion123!}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U terrafusion"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis (Cache)
  redis:
    image: redis:7-alpine
    container_name: terrafusion-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MongoDB (Documents/NoSQL)
  mongodb:
    image: mongo:7
    container_name: terrafusion-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: terrafusion
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:-terrafusion123!}
    volumes:
      - mongodb-data:/data/db

  # Elasticsearch (Search/Analytics)
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: terrafusion-elasticsearch
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

volumes:
  minio-data:
  postgres-data:
  redis-data:
  mongodb-data:
  elasticsearch-data:

networks:
  default:
    name: terrafusion-data-network
EOF

# 2. Start data infrastructure
docker-compose -f docker-compose.data-infra.yml up -d

# 3. Wait for MinIO to be ready
echo "Waiting for MinIO to start..."
sleep 10

# 4. Install MinIO client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# 5. Configure MinIO client
mc alias set terrafusion http://localhost:9000 terraform_admin changeme123!

# 6. Create buckets
mc mb terrafusion/datasets           # For datasets (CSV, GeoJSON, etc.)
mc mb terrafusion/media              # For images, videos
mc mb terrafusion/user-uploads       # For user-uploaded files
mc mb terrafusion/backups            # For application backups
mc mb terrafusion/temp               # For temporary files

# 7. Set public policy for media (if needed)
mc anonymous set download terrafusion/media

echo "✅ MinIO setup complete!"
echo "MinIO Console: http://localhost:9001"
echo "MinIO API: http://localhost:9000"
```

---

## ☁️ OPTION B: AWS S3 + Glacier - Recommended for Production

### Setup AWS Infrastructure:

```bash
# 1. Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 2. Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Format (json)

# 3. Create S3 buckets
aws s3 mb s3://terrafusion-datasets --region us-east-1
aws s3 mb s3://terrafusion-media --region us-east-1
aws s3 mb s3://terrafusion-user-uploads --region us-east-1
aws s3 mb s3://terrafusion-backups --region us-east-1

# 4. Set lifecycle policies (move to Glacier after 90 days)
cat > lifecycle-policy.json << 'EOF'
{
  "Rules": [
    {
      "Id": "MoveToGlacier",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket terrafusion-backups \
  --lifecycle-configuration file://lifecycle-policy.json

# 5. Enable versioning (for backups bucket)
aws s3api put-bucket-versioning \
  --bucket terrafusion-backups \
  --versioning-configuration Status=Enabled

# 6. Set CORS (if needed for web uploads)
cat > cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://terrafusion.io", "http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket terrafusion-user-uploads \
  --cors-configuration file://cors.json

echo "✅ AWS S3 setup complete!"
```

---

## 🐳 Container Registry Setup

### Option A: Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag and push images
docker tag terrafusion-os:latest bsvalues/terrafusion-os:latest
docker push bsvalues/terrafusion-os:latest
```

### Option B: AWS ECR (Recommended for Production)

```bash
# Create ECR repositories
aws ecr create-repository --repository-name terrafusion-os
aws ecr create-repository --repository-name terrafusion-marketplace
aws ecr create-repository --repository-name terrafusion-modules

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.us-east-1.amazonaws.com

# Push images
docker tag terrafusion-os:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/terrafusion-os:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/terrafusion-os:latest
```

---

## 📦 DATA MIGRATION

### Step 1: Identify Data Files

```bash
#!/bin/bash
# Find all data files that should be in S3

echo "Finding data files to migrate..."

# Find CSV files
find . -name "*.csv" -type f > /tmp/csv-files.txt

# Find GeoJSON files
find . -name "*.geojson" -type f > /tmp/geojson-files.txt

# Find Shapefiles
find . -name "*.shp" -type f > /tmp/shp-files.txt

# Find large images
find . -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | \
  xargs du -sh | \
  awk '$1 ~ /M|G/ {print}' > /tmp/large-images.txt

# Summary
echo "Files found:"
echo "  CSVs: $(wc -l < /tmp/csv-files.txt)"
echo "  GeoJSONs: $(wc -l < /tmp/geojson-files.txt)"
echo "  Shapefiles: $(wc -l < /tmp/shp-files.txt)"
echo "  Large images: $(wc -l < /tmp/large-images.txt)"
```

### Step 2: Upload to MinIO/S3

```bash
#!/bin/bash
# Upload data files to MinIO

echo "Uploading data files..."

# Upload datasets
while IFS= read -r file; do
  filename=$(basename "$file")
  mc cp "$file" terrafusion/datasets/"$filename"
  echo "Uploaded: $filename"
done < /tmp/csv-files.txt

# Upload GeoJSON
while IFS= read -r file; do
  filename=$(basename "$file")
  mc cp "$file" terrafusion/datasets/gis/"$filename"
done < /tmp/geojson-files.txt

# Upload images
find docs/images/ -name "*.png" -o -name "*.jpg" | while read file; do
  mc cp "$file" terrafusion/media/images/
done

echo "✅ Data migration complete!"
```

### Step 3: Update Code References

**Before (reading from Git):**
```javascript
// ❌ WRONG: Reading data from Git repository
const data = require('../data/parcels.json');
const image = '/docs/images/diagram.png';
```

**After (reading from S3):**
```javascript
// ✅ CORRECT: Reading data from S3
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'us-east-1' });

// Fetch data from S3
async function fetchData(key: string) {
  const command = new GetObjectCommand({
    Bucket: 'terrafusion-datasets',
    Key: key
  });
  const response = await s3.send(command);
  return response.Body;
}

// Use CDN URL for images
const image = 'https://cdn.terrafusion.io/images/diagram.png';
```

**Environment Variables:**
```bash
# .env
S3_ENDPOINT=http://localhost:9000  # MinIO for dev
S3_ACCESS_KEY=terraform_admin
S3_SECRET_KEY=changeme123!
S3_BUCKET_DATASETS=terrafusion/datasets
S3_BUCKET_MEDIA=terrafusion/media
CDN_URL=https://cdn.terrafusion.io
```

---

## 🔄 BACKUP STRATEGY

### Application Data Backups:

```bash
#!/bin/bash
# Daily backup script

DATE=$(date +%Y%m%d)

# Backup PostgreSQL
pg_dump terrafusion | gzip > backup-postgres-$DATE.sql.gz
mc cp backup-postgres-$DATE.sql.gz terrafusion/backups/postgres/

# Backup MongoDB
mongodump --out backup-mongo-$DATE
tar -czf backup-mongo-$DATE.tar.gz backup-mongo-$DATE
mc cp backup-mongo-$DATE.tar.gz terrafusion/backups/mongodb/

# Backup Redis (if needed)
redis-cli --rdb backup-redis-$DATE.rdb
mc cp backup-redis-$DATE.rdb terrafusion/backups/redis/

# Upload to Glacier (for long-term storage)
aws s3 cp backup-postgres-$DATE.sql.gz \
  s3://terrafusion-backups/postgres/ \
  --storage-class DEEP_ARCHIVE

echo "✅ Backups complete!"
```

### Setup Automated Backups (Cron):

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh

# Weekly backup verification
0 3 * * 0 /path/to/verify-backups.sh
```

---

## 📊 MONITORING & OBSERVABILITY

### Setup Prometheus + Grafana:

```yaml
# Add to docker-compose.data-infra.yml
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
```

### Monitor Storage Usage:

```bash
# MinIO usage
mc admin info terrafusion

# PostgreSQL size
psql -U terrafusion -c "
  SELECT pg_size_pretty(pg_database_size('terrafusion'));
"

# Redis memory
redis-cli INFO memory | grep used_memory_human
```

---

## ✅ PHASE 4 COMPLETION CHECKLIST

### Infrastructure Setup:
- [ ] MinIO or S3 configured
- [ ] PostgreSQL running
- [ ] Redis running
- [ ] MongoDB configured (if needed)
- [ ] Elasticsearch configured (if needed)
- [ ] Container registry setup

### Data Migration:
- [ ] Identified all data files
- [ ] Uploaded to S3/MinIO
- [ ] Verified uploads successful
- [ ] Updated code to reference S3
- [ ] Updated environment variables
- [ ] Tested data retrieval

### Backups:
- [ ] Backup scripts created
- [ ] Automated backups scheduled
- [ ] Glacier/cold storage configured
- [ ] Backup verification tested
- [ ] Restoration procedure documented

### Documentation:
- [ ] Storage architecture documented
- [ ] Migration guide created
- [ ] Backup procedures documented
- [ ] Monitoring setup documented
- [ ] Cost estimates provided

---

## 💰 COST ESTIMATES

### Development (MinIO Self-Hosted):
- **Infrastructure:** $0 (self-hosted)
- **Storage:** ~$20/month (if using cloud VM)
- **Total:** ~$20/month

### Production (AWS):
- **S3 Storage:** $23/TB/month (Standard)
- **Glacier:** $1/TB/month (Deep Archive)
- **Data Transfer:** $0.09/GB (out)
- **RDS PostgreSQL:** $100-500/month (depending on size)
- **ElastiCache Redis:** $50-200/month
- **Estimated Total:** $200-800/month for small-medium scale

---

## 🎯 SUCCESS METRICS

- ✅ Repository size < 500 MB (no data files)
- ✅ Data retrieval latency < 100ms
- ✅ Backup completion time < 30 minutes
- ✅ 99.9% data availability
- ✅ RPO (Recovery Point Objective) < 24 hours
- ✅ RTO (Recovery Time Objective) < 4 hours

---

## 📚 NEXT STEPS

1. **Choose storage option** (MinIO for dev, AWS for prod)
2. **Run setup scripts** (docker-compose or AWS CLI)
3. **Migrate data** (identify, upload, verify)
4. **Update code** (S3 SDK, environment variables)
5. **Test thoroughly** (data retrieval, backups)
6. **Document** (architecture, procedures)
7. **Monitor** (setup alerts, dashboards)

---

**Status:** ✅ PLAN COMPLETE - Ready for Execution  
**Estimated Time:** 1-2 days for setup + migration  
**Prerequisite:** Phase 3 (polyrepo) completion recommended but not required

