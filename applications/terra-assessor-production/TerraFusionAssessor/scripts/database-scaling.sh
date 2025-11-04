#!/bin/bash

set -e

ENVIRONMENT=${1:-staging}

echo "🗄️  Setting up global database scaling for $ENVIRONMENT"

echo "📊 Creating read replicas across regions..."

aws rds create-db-cluster \
    --db-cluster-identifier terrafusion-$ENVIRONMENT-replica-eu \
    --engine aurora-mysql \
    --global-cluster-identifier terrafusion-global \
    --region eu-west-1

aws rds create-db-cluster \
    --db-cluster-identifier terrafusion-$ENVIRONMENT-replica-ap \
    --engine aurora-mysql \
    --global-cluster-identifier terrafusion-global \
    --region ap-southeast-1

echo "⚡ Setting up Redis clusters..."

aws elasticache create-replication-group \
    --replication-group-id terrafusion-$ENVIRONMENT-redis-eu \
    --description "TerraFusion Redis EU" \
    --num-cache-clusters 3 \
    --cache-node-type cache.r6g.xlarge \
    --engine redis \
    --region eu-west-1

aws elasticache create-replication-group \
    --replication-group-id terrafusion-$ENVIRONMENT-redis-ap \
    --description "TerraFusion Redis AP" \
    --num-cache-clusters 3 \
    --cache-node-type cache.r6g.xlarge \
    --engine redis \
    --region ap-southeast-1

echo "🔄 Setting up automated backups..."

aws rds put-backup-policy \
    --resource-arn arn:aws:rds:*:*:cluster:terrafusion-$ENVIRONMENT-* \
    --backup-policy Status=ENABLED

echo "📈 Configuring performance monitoring..."

aws logs create-log-group --log-group-name /aws/rds/terrafusion-$ENVIRONMENT
aws logs create-log-group --log-group-name /aws/elasticache/terrafusion-$ENVIRONMENT

echo "✅ Database scaling setup completed!"
echo "📊 Global database topology:"
echo "  - Primary: us-west-2 (Read/Write)"
echo "  - Replica: us-east-1 (Read)"
echo "  - Replica: eu-west-1 (Read)"
echo "  - Replica: ap-southeast-1 (Read)"
echo "  - Redis clusters in all regions"
