#!/bin/bash
#
# TerraFusion Cost Optimization Report Script
# Analyzes infrastructure costs and provides optimization recommendations
#
# Usage: ./cost-optimization-report.sh [options]
# Options:
#   -p    Time period (day|week|month|quarter)
#   -f    Output format (html|json|csv)
#   -r    Include resource recommendations
#   -t    Include trend analysis

set -euo pipefail

# Configuration
TIME_PERIOD="month"
OUTPUT_FORMAT="html"
INCLUDE_RECOMMENDATIONS=false
INCLUDE_TRENDS=false
REPORT_DIR="/var/reports/cost-optimization"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/terrafusion/cost_report_$TIMESTAMP.log"

# Cost thresholds (in USD)
HIGH_COST_THRESHOLD=1000
UNUSED_RESOURCE_THRESHOLD=50
EFFICIENCY_THRESHOLD=0.7

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create directories
mkdir -p "$REPORT_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Parse arguments
while getopts "p:f:rt" opt; do
    case $opt in
        p) TIME_PERIOD="$OPTARG" ;;
        f) OUTPUT_FORMAT="$OPTARG" ;;
        r) INCLUDE_RECOMMENDATIONS=true ;;
        t) INCLUDE_TRENDS=true ;;
        *) echo "Usage: $0 [-p period] [-f format] [-r] [-t]"; exit 1 ;;
    esac
done

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

# Cost data structures
declare -A AWS_COSTS
declare -A DOCKER_COSTS
declare -A DATABASE_COSTS
declare -A MONITORING_COSTS
declare -A OPTIMIZATION_RECOMMENDATIONS

# Get time range
get_time_range() {
    local end_date=$(date +%Y-%m-%d)
    local start_date
    
    case $TIME_PERIOD in
        day)
            start_date=$(date -d "1 day ago" +%Y-%m-%d)
            ;;
        week)
            start_date=$(date -d "7 days ago" +%Y-%m-%d)
            ;;
        month)
            start_date=$(date -d "30 days ago" +%Y-%m-%d)
            ;;
        quarter)
            start_date=$(date -d "90 days ago" +%Y-%m-%d)
            ;;
        *)
            log_error "Invalid time period: $TIME_PERIOD"
            exit 1
            ;;
    esac
    
    echo "$start_date,$end_date"
}

# Analyze AWS costs
analyze_aws_costs() {
    log "Analyzing AWS costs..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not installed. Skipping AWS cost analysis."
        return
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &>/dev/null; then
        log_error "AWS credentials not configured. Skipping AWS cost analysis."
        return
    fi
    
    local time_range
    IFS=',' read -r start_date end_date <<< "$(get_time_range)"
    
    # Get cost and billing data
    local cost_data=$(aws ce get-cost-and-usage \
        --time-period Start="$start_date",End="$end_date" \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --group-by Type=DIMENSION,Key=SERVICE \
        --output json 2>/dev/null || echo '{"ResultsByTime": []}')
    
    # Parse AWS costs by service
    echo "$cost_data" | jq -r '.ResultsByTime[]?.Groups[]? | "\(.Keys[0])|\(.Metrics.BlendedCost.Amount)"' 2>/dev/null | while IFS='|' read -r service cost; do
        if [ -n "$service" ] && [ -n "$cost" ]; then
            AWS_COSTS["$service"]=$(printf "%.2f" "$cost")
        fi
    done
    
    # Analyze EC2 instance utilization
    analyze_ec2_utilization
    
    # Analyze RDS costs
    analyze_rds_costs
    
    # Analyze S3 costs
    analyze_s3_costs
}

# Analyze EC2 utilization
analyze_ec2_utilization() {
    log "Analyzing EC2 utilization..."
    
    # Get EC2 instances
    local instances=$(aws ec2 describe-instances \
        --filters "Name=instance-state-name,Values=running" \
        --query 'Reservations[].Instances[].[InstanceId,InstanceType,State.Name]' \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$instances" ]; then
        return
    fi
    
    local total_instances=0
    local underutilized_instances=0
    
    while IFS=$'\t' read -r instance_id instance_type state; do
        ((total_instances++))
        
        # Get CPU utilization for the past week
        local cpu_utilization=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/EC2 \
            --metric-name CPUUtilization \
            --dimensions Name=InstanceId,Value="$instance_id" \
            --start-time "$(date -d '7 days ago' --iso-8601)" \
            --end-time "$(date --iso-8601)" \
            --period 3600 \
            --statistics Average \
            --query 'Datapoints[].Average' \
            --output text 2>/dev/null | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
        
        # Check if instance is underutilized
        if (( $(echo "$cpu_utilization < 20" | bc -l) )); then
            ((underutilized_instances++))
            OPTIMIZATION_RECOMMENDATIONS["ec2_$instance_id"]="Instance $instance_id ($instance_type) has low CPU utilization: ${cpu_utilization}%. Consider downsizing or stopping."
        fi
    done <<< "$instances"
    
    if [ $underutilized_instances -gt 0 ]; then
        local savings_estimate=$((underutilized_instances * 50))  # Rough estimate
        OPTIMIZATION_RECOMMENDATIONS["ec2_optimization"]="Found $underutilized_instances underutilized EC2 instances. Potential monthly savings: \$${savings_estimate}"
    fi
}

# Analyze RDS costs
analyze_rds_costs() {
    log "Analyzing RDS costs..."
    
    # Get RDS instances
    local rds_instances=$(aws rds describe-db-instances \
        --query 'DBInstances[].[DBInstanceIdentifier,DBInstanceClass,DBInstanceStatus]' \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$rds_instances" ]; then
        return
    fi
    
    while IFS=$'\t' read -r db_id db_class status; do
        # Get CPU utilization
        local cpu_util=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/RDS \
            --metric-name CPUUtilization \
            --dimensions Name=DBInstanceIdentifier,Value="$db_id" \
            --start-time "$(date -d '7 days ago' --iso-8601)" \
            --end-time "$(date --iso-8601)" \
            --period 3600 \
            --statistics Average \
            --query 'Datapoints[].Average' \
            --output text 2>/dev/null | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
        
        # Get connection count
        local connections=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/RDS \
            --metric-name DatabaseConnections \
            --dimensions Name=DBInstanceIdentifier,Value="$db_id" \
            --start-time "$(date -d '7 days ago' --iso-8601)" \
            --end-time "$(date --iso-8601)" \
            --period 3600 \
            --statistics Average \
            --query 'Datapoints[].Average' \
            --output text 2>/dev/null | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
        
        # Check for optimization opportunities
        if (( $(echo "$cpu_util < 30" | bc -l) )) && (( $(echo "$connections < 10" | bc -l) )); then
            OPTIMIZATION_RECOMMENDATIONS["rds_$db_id"]="RDS instance $db_id ($db_class) has low utilization. CPU: ${cpu_util}%, Avg Connections: ${connections}. Consider downsizing."
        fi
    done <<< "$rds_instances"
}

# Analyze S3 costs
analyze_s3_costs() {
    log "Analyzing S3 costs..."
    
    # Get S3 buckets
    local buckets=$(aws s3api list-buckets --query 'Buckets[].Name' --output text 2>/dev/null || echo "")
    
    if [ -z "$buckets" ]; then
        return
    fi
    
    local total_storage_cost=0
    local old_versions_cost=0
    
    for bucket in $buckets; do
        # Get bucket size and storage class information
        local bucket_size=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/S3 \
            --metric-name BucketSizeBytes \
            --dimensions Name=BucketName,Value="$bucket" Name=StorageType,Value=StandardStorage \
            --start-time "$(date -d '2 days ago' --iso-8601)" \
            --end-time "$(date --iso-8601)" \
            --period 86400 \
            --statistics Average \
            --query 'Datapoints[-1].Average' \
            --output text 2>/dev/null || echo "0")
        
        # Check for versioning and old versions
        local versioning=$(aws s3api get-bucket-versioning --bucket "$bucket" --query 'Status' --output text 2>/dev/null || echo "Disabled")
        
        if [ "$versioning" = "Enabled" ]; then
            # Estimate old version costs (rough calculation)
            local old_versions_size=$(echo "$bucket_size * 0.2" | bc -l)  # Assume 20% are old versions
            old_versions_cost=$(echo "$old_versions_cost + ($old_versions_size / 1073741824 * 0.023)" | bc -l)  # $0.023 per GB
            
            OPTIMIZATION_RECOMMENDATIONS["s3_$bucket"]="Bucket $bucket has versioning enabled. Consider implementing lifecycle policies to delete old versions automatically."
        fi
        
        # Check for infrequent access patterns
        if (( $(echo "$bucket_size > 1073741824" | bc -l) )); then  # > 1GB
            OPTIMIZATION_RECOMMENDATIONS["s3_ia_$bucket"]="Bucket $bucket ($(echo "scale=2; $bucket_size / 1073741824" | bc)GB) might benefit from Intelligent Tiering or IA storage class."
        fi
    done
    
    if (( $(echo "$old_versions_cost > 10" | bc -l) )); then
        OPTIMIZATION_RECOMMENDATIONS["s3_versioning"]="S3 old versions are costing approximately \$$(printf "%.2f" "$old_versions_cost") per month. Implement lifecycle policies."
    fi
}

# Analyze Docker container costs
analyze_docker_costs() {
    log "Analyzing Docker container resource usage..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker not available. Skipping container analysis."
        return
    fi
    
    # Get running containers
    local containers=$(docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | tail -n +2)
    
    if [ -z "$containers" ]; then
        return
    fi
    
    local total_memory_limit=0
    local total_memory_usage=0
    local idle_containers=0
    
    while IFS=$'\t' read -r name image status; do
        # Get container stats
        local stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" "$name" 2>/dev/null | tail -n +2 || echo "")
        
        if [ -n "$stats" ]; then
            local cpu_perc=$(echo "$stats" | awk '{print $2}' | sed 's/%//')
            local mem_usage=$(echo "$stats" | awk '{print $3}' | cut -d'/' -f1 | sed 's/MiB//')
            local mem_limit=$(echo "$stats" | awk '{print $3}' | cut -d'/' -f2 | sed 's/MiB//')
            
            # Check for idle containers
            if (( $(echo "$cpu_perc < 1.0" | bc -l) )); then
                ((idle_containers++))
                OPTIMIZATION_RECOMMENDATIONS["docker_$name"]="Container $name has very low CPU usage (${cpu_perc}%). Consider scaling down or investigating."
            fi
            
            # Memory efficiency check
            if [ -n "$mem_usage" ] && [ -n "$mem_limit" ]; then
                local mem_efficiency=$(echo "scale=2; $mem_usage / $mem_limit" | bc)
                if (( $(echo "$mem_efficiency < 0.5" | bc -l) )); then
                    OPTIMIZATION_RECOMMENDATIONS["docker_mem_$name"]="Container $name is using only $(echo "$mem_efficiency * 100" | bc)% of allocated memory. Consider reducing memory limits."
                fi
            fi
        fi
    done <<< "$containers"
    
    if [ $idle_containers -gt 0 ]; then
        OPTIMIZATION_RECOMMENDATIONS["docker_idle"]="Found $idle_containers containers with very low CPU usage. Review if all containers are necessary."
    fi
}

# Analyze database costs
analyze_database_costs() {
    log "Analyzing database resource costs..."
    
    # Check PostgreSQL connection pool efficiency
    if command -v psql &> /dev/null; then
        local max_connections=$(psql -h localhost -U terrafusion_user -d terrafusion_production -t -c "SELECT setting FROM pg_settings WHERE name = 'max_connections';" 2>/dev/null | xargs || echo "100")
        local active_connections=$(psql -h localhost -U terrafusion_user -d terrafusion_production -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | xargs || echo "0")
        
        if [ "$active_connections" -gt 0 ] && [ "$max_connections" -gt 0 ]; then
            local connection_utilization=$(echo "scale=2; $active_connections / $max_connections" | bc)
            
            if (( $(echo "$connection_utilization < 0.2" | bc -l) )); then
                OPTIMIZATION_RECOMMENDATIONS["db_connections"]="Database connection utilization is low ($(echo "$connection_utilization * 100" | bc)%). Consider reducing max_connections to save memory."
            elif (( $(echo "$connection_utilization > 0.8" | bc -l) )); then
                OPTIMIZATION_RECOMMENDATIONS["db_connections_high"]="Database connection utilization is high ($(echo "$connection_utilization * 100" | bc)%). Consider implementing connection pooling."
            fi
        fi
        
        # Check for unused indexes
        local unused_indexes=$(psql -h localhost -U terrafusion_user -d terrafusion_production -t -c "
        SELECT count(*) FROM pg_stat_user_indexes 
        WHERE idx_scan = 0 AND schemaname = 'public';" 2>/dev/null | xargs || echo "0")
        
        if [ "$unused_indexes" -gt 0 ]; then
            OPTIMIZATION_RECOMMENDATIONS["db_indexes"]="Found $unused_indexes unused indexes consuming disk space. Consider dropping unused indexes."
        fi
        
        # Check database size growth
        local db_size=$(psql -h localhost -U terrafusion_user -d terrafusion_production -t -c "SELECT pg_size_pretty(pg_database_size('terrafusion_production'));" 2>/dev/null | xargs || echo "Unknown")
        DATABASE_COSTS["storage"]="Database size: $db_size"
    fi
    
    # Check Redis memory usage
    if command -v redis-cli &> /dev/null; then
        local redis_memory=$(redis-cli INFO memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r' || echo "Unknown")
        local redis_keys=$(redis-cli DBSIZE 2>/dev/null || echo "0")
        
        if [ "$redis_keys" = "0" ]; then
            OPTIMIZATION_RECOMMENDATIONS["redis_empty"]="Redis cache appears to be empty. Consider if Redis is necessary for current workload."
        fi
        
        DATABASE_COSTS["redis_memory"]="Redis memory usage: $redis_memory, Keys: $redis_keys"
    fi
}

# Analyze monitoring costs
analyze_monitoring_costs() {
    log "Analyzing monitoring stack costs..."
    
    # Check Prometheus storage usage
    if [ -d "/var/lib/prometheus" ]; then
        local prometheus_size=$(du -sh /var/lib/prometheus 2>/dev/null | cut -f1 || echo "Unknown")
        MONITORING_COSTS["prometheus_storage"]="Prometheus storage: $prometheus_size"
        
        # Check retention policy
        local retention=$(docker inspect prometheus 2>/dev/null | jq -r '.[0].Config.Cmd[]' | grep -E "storage.tsdb.retention" | cut -d'=' -f2 || echo "15d")
        if [ "$retention" != "15d" ]; then
            OPTIMIZATION_RECOMMENDATIONS["prometheus_retention"]="Prometheus retention is set to $retention. Consider optimizing retention period based on needs."
        fi
    fi
    
    # Check Grafana usage
    if command -v curl &> /dev/null && curl -sf http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/health &>/dev/null; then
        MONITORING_COSTS["grafana"]="Grafana is running"
        
        # Check if Grafana is being used (this is a simplified check)
        local dashboard_count=$(curl -sf -H "Authorization: Bearer admin:admin" http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/search 2>/dev/null | jq '. | length' || echo "0")
        if [ "$dashboard_count" -eq 0 ]; then
            OPTIMIZATION_RECOMMENDATIONS["grafana_unused"]="Grafana has no dashboards configured. Consider if Grafana is necessary."
        fi
    fi
    
    # Check log retention
    local log_size=$(du -sh /var/log 2>/dev/null | cut -f1 || echo "Unknown")
    MONITORING_COSTS["logs"]="System logs size: $log_size"
    
    if command -v find &> /dev/null; then
        local old_logs=$(find /var/log -name "*.log" -mtime +30 -type f | wc -l)
        if [ "$old_logs" -gt 0 ]; then
            OPTIMIZATION_RECOMMENDATIONS["log_cleanup"]="Found $old_logs log files older than 30 days. Implement log rotation and cleanup."
        fi
    fi
}

# Calculate potential savings
calculate_savings() {
    log "Calculating potential cost savings..."
    
    local total_savings=0
    local monthly_savings=0
    
    # AWS optimization savings (estimates)
    if [ -n "${OPTIMIZATION_RECOMMENDATIONS[ec2_optimization]:-}" ]; then
        local ec2_savings=$(echo "${OPTIMIZATION_RECOMMENDATIONS[ec2_optimization]}" | grep -oE '\$[0-9]+' | sed 's/\$//' || echo "0")
        monthly_savings=$(echo "$monthly_savings + $ec2_savings" | bc)
    fi
    
    # Container optimization savings (estimate $10-50 per container)
    local idle_containers=$(echo "${OPTIMIZATION_RECOMMENDATIONS[docker_idle]:-}" | grep -oE '[0-9]+' | head -1 || echo "0")
    if [ "$idle_containers" -gt 0 ]; then
        local container_savings=$((idle_containers * 25))
        monthly_savings=$(echo "$monthly_savings + $container_savings" | bc)
    fi
    
    # Storage optimization savings
    if [ -n "${OPTIMIZATION_RECOMMENDATIONS[s3_versioning]:-}" ]; then
        local s3_savings=$(echo "${OPTIMIZATION_RECOMMENDATIONS[s3_versioning]}" | grep -oE '\$[0-9.]+' | sed 's/\$//' || echo "0")
        monthly_savings=$(echo "$monthly_savings + $s3_savings" | bc)
    fi
    
    total_savings=$monthly_savings
    
    echo "Monthly potential savings: \$$(printf "%.2f" "$monthly_savings")"
    echo "Annual potential savings: \$$(echo "$monthly_savings * 12" | bc)"
}

# Generate HTML report
generate_html_report() {
    local report_file="$REPORT_DIR/cost_optimization_report_$TIMESTAMP.html"
    
    log "Generating HTML cost optimization report..."
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Cost Optimization Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .summary-card.warning { border-left-color: #ffc107; }
        .summary-card.danger { border-left-color: #dc3545; }
        .summary-card.success { border-left-color: #28a745; }
        .card-value { font-size: 2em; font-weight: bold; color: #007bff; margin-bottom: 5px; }
        .card-label { color: #6c757d; font-size: 0.9em; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 10px 0; }
        .recommendation.high { background: #f8d7da; border-color: #f5c6cb; }
        .recommendation.medium { background: #d1ecf1; border-color: #bee5eb; }
        .cost-breakdown { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .cost-category { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .chart-placeholder { height: 200px; background: #e9ecef; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #6c757d; }
        .savings-highlight { background: linear-gradient(45deg, #28a745, #20c997); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .priority-high { border-left: 4px solid #dc3545; }
        .priority-medium { border-left: 4px solid #ffc107; }
        .priority-low { border-left: 4px solid #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Cost Optimization Report</h1>
            <p>TerraFusion Infrastructure Analysis</p>
            <p>Generated: $(date) | Period: $TIME_PERIOD</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <div class="card-value">\$$(calculate_savings | head -1 | cut -d':' -f2 | tr -d ' ')</div>
                <div class="card-label">Potential Monthly Savings</div>
            </div>
            <div class="summary-card warning">
                <div class="card-value">${#OPTIMIZATION_RECOMMENDATIONS[@]}</div>
                <div class="card-label">Optimization Opportunities</div>
            </div>
            <div class="summary-card success">
                <div class="card-value">$(echo "${#AWS_COSTS[@]} + ${#DOCKER_COSTS[@]} + ${#DATABASE_COSTS[@]} + ${#MONITORING_COSTS[@]}" | bc)</div>
                <div class="card-label">Resources Analyzed</div>
            </div>
            <div class="summary-card">
                <div class="card-value">$TIME_PERIOD</div>
                <div class="card-label">Analysis Period</div>
            </div>
        </div>
        
        <div class="savings-highlight">
            <h2 style="margin: 0;">🎯 Annual Savings Potential</h2>
            <h1 style="margin: 10px 0;">\$$(calculate_savings | tail -1 | cut -d':' -f2 | tr -d ' ')</h1>
            <p style="margin: 0;">Based on identified optimization opportunities</p>
        </div>
        
        <div class="section">
            <h2>📊 Cost Breakdown</h2>
            <div class="cost-breakdown">
EOF
    
    # Add AWS costs if available
    if [ ${#AWS_COSTS[@]} -gt 0 ]; then
        cat >> "$report_file" << EOF
                <div class="cost-category">
                    <h3>☁️ AWS Services</h3>
                    <table>
                        <thead>
                            <tr><th>Service</th><th>Cost</th></tr>
                        </thead>
                        <tbody>
EOF
        for service in "${!AWS_COSTS[@]}"; do
            cat >> "$report_file" << EOF
                            <tr><td>$service</td><td>\$${AWS_COSTS[$service]}</td></tr>
EOF
        done
        cat >> "$report_file" << EOF
                        </tbody>
                    </table>
                </div>
EOF
    fi
    
    # Add database costs
    if [ ${#DATABASE_COSTS[@]} -gt 0 ]; then
        cat >> "$report_file" << EOF
                <div class="cost-category">
                    <h3>🗄️ Database Resources</h3>
                    <table>
                        <thead>
                            <tr><th>Resource</th><th>Usage</th></tr>
                        </thead>
                        <tbody>
EOF
        for resource in "${!DATABASE_COSTS[@]}"; do
            cat >> "$report_file" << EOF
                            <tr><td>$resource</td><td>${DATABASE_COSTS[$resource]}</td></tr>
EOF
        done
        cat >> "$report_file" << EOF
                        </tbody>
                    </table>
                </div>
EOF
    fi
    
    # Add monitoring costs
    if [ ${#MONITORING_COSTS[@]} -gt 0 ]; then
        cat >> "$report_file" << EOF
                <div class="cost-category">
                    <h3>📈 Monitoring Stack</h3>
                    <table>
                        <thead>
                            <tr><th>Component</th><th>Usage</th></tr>
                        </thead>
                        <tbody>
EOF
        for component in "${!MONITORING_COSTS[@]}"; do
            cat >> "$report_file" << EOF
                            <tr><td>$component</td><td>${MONITORING_COSTS[$component]}</td></tr>
EOF
        done
        cat >> "$report_file" << EOF
                        </tbody>
                    </table>
                </div>
EOF
    fi
    
    cat >> "$report_file" << EOF
            </div>
        </div>
        
        <div class="section">
            <h2>🔍 Optimization Recommendations</h2>
EOF
    
    # Add recommendations
    if [ ${#OPTIMIZATION_RECOMMENDATIONS[@]} -gt 0 ]; then
        for rec_key in "${!OPTIMIZATION_RECOMMENDATIONS[@]}"; do
            local priority="medium"
            local rec_text="${OPTIMIZATION_RECOMMENDATIONS[$rec_key]}"
            
            # Determine priority based on content
            if [[ "$rec_text" == *"critical"* ]] || [[ "$rec_text" == *"unused"* ]]; then
                priority="high"
            elif [[ "$rec_text" == *"consider"* ]] || [[ "$rec_text" == *"might"* ]]; then
                priority="low"
            fi
            
            cat >> "$report_file" << EOF
            <div class="recommendation priority-$priority">
                <strong>$(echo "$rec_key" | tr '_' ' ' | sed 's/\b\w/\U&/g'):</strong>
                $rec_text
            </div>
EOF
        done
    else
        cat >> "$report_file" << EOF
            <div class="recommendation">
                <strong>No optimization opportunities found.</strong>
                Your infrastructure appears to be well-optimized based on current analysis.
            </div>
EOF
    fi
    
    cat >> "$report_file" << EOF
        </div>
        
        <div class="section">
            <h2>📈 Next Steps</h2>
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
                <h3 style="margin-top: 0;">Immediate Actions (1-2 weeks)</h3>
                <ul>
                    <li>Review and implement high-priority recommendations</li>
                    <li>Set up automated scaling policies for underutilized resources</li>
                    <li>Implement monitoring for cost anomalies</li>
                </ul>
                
                <h3>Medium-term Goals (1-3 months)</h3>
                <ul>
                    <li>Establish cost budgets and alerts</li>
                    <li>Implement reserved instance planning for predictable workloads</li>
                    <li>Review and optimize data retention policies</li>
                </ul>
                
                <h3>Long-term Strategy (3-12 months)</h3>
                <ul>
                    <li>Regular monthly cost optimization reviews</li>
                    <li>Evaluate and implement FinOps practices</li>
                    <li>Consider multi-cloud or hybrid cloud strategies</li>
                </ul>
            </div>
        </div>
        
        <div class="section">
            <h2>📋 Report Details</h2>
            <table>
                <tr><th>Analysis Date</th><td>$(date)</td></tr>
                <tr><th>Time Period</th><td>$TIME_PERIOD</td></tr>
                <tr><th>Report Format</th><td>$OUTPUT_FORMAT</td></tr>
                <tr><th>Recommendations Included</th><td>$([ "$INCLUDE_RECOMMENDATIONS" = true ] && echo "Yes" || echo "No")</td></tr>
                <tr><th>Trend Analysis</th><td>$([ "$INCLUDE_TRENDS" = true ] && echo "Yes" || echo "No")</td></tr>
                <tr><th>Generated By</th><td>TerraFusion Cost Optimization Tool</td></tr>
            </table>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p><strong>💡 Tip:</strong> Run this report monthly to track your optimization progress and identify new opportunities.</p>
            <p><small>For questions about this report, contact the DevOps team at devops@terrafusion.com</small></p>
        </div>
    </div>
</body>
</html>
EOF
    
    log_success "HTML report generated: $report_file"
    echo "$report_file"
}

# Generate JSON report
generate_json_report() {
    local report_file="$REPORT_DIR/cost_optimization_report_$TIMESTAMP.json"
    
    log "Generating JSON cost optimization report..."
    
    cat > "$report_file" << EOF
{
  "report_metadata": {
    "generated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "time_period": "$TIME_PERIOD",
    "output_format": "$OUTPUT_FORMAT",
    "include_recommendations": $INCLUDE_RECOMMENDATIONS,
    "include_trends": $INCLUDE_TRENDS
  },
  "cost_analysis": {
    "aws_costs": $(printf '%s\n' "${!AWS_COSTS[@]}" | jq -R -s -c 'split("\n") | map(select(length > 0)) | map(split("|")) | map({(.[0]): .[1]}) | add // {}'),
    "database_costs": $(printf '%s\n' "${!DATABASE_COSTS[@]}" | jq -R -s -c 'split("\n") | map(select(length > 0)) | map({(.): "${DATABASE_COSTS[.]}"}) | add // {}'),
    "monitoring_costs": $(printf '%s\n' "${!MONITORING_COSTS[@]}" | jq -R -s -c 'split("\n") | map(select(length > 0)) | map({(.): "${MONITORING_COSTS[.]}"}) | add // {}')
  },
  "optimization_recommendations": $(printf '%s\n' "${!OPTIMIZATION_RECOMMENDATIONS[@]}" | jq -R -s -c 'split("\n") | map(select(length > 0)) | map({(.): "${OPTIMIZATION_RECOMMENDATIONS[.]}"}) | add // {}'),
  "summary": {
    "total_recommendations": ${#OPTIMIZATION_RECOMMENDATIONS[@]},
    "potential_monthly_savings": "$(calculate_savings | head -1 | cut -d':' -f2 | tr -d ' ')",
    "potential_annual_savings": "$(calculate_savings | tail -1 | cut -d':' -f2 | tr -d ' ')"
  }
}
EOF
    
    log_success "JSON report generated: $report_file"
    echo "$report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Cost Optimization Analysis"
    log "Period: $TIME_PERIOD"
    log "Format: $OUTPUT_FORMAT"
    log "========================================="
    
    # Run analysis
    analyze_aws_costs
    analyze_docker_costs
    analyze_database_costs
    analyze_monitoring_costs
    
    # Generate report based on format
    local report_file=""
    case $OUTPUT_FORMAT in
        html)
            report_file=$(generate_html_report)
            ;;
        json)
            report_file=$(generate_json_report)
            ;;
        csv)
            log_error "CSV format not implemented yet"
            exit 1
            ;;
        *)
            log_error "Invalid output format: $OUTPUT_FORMAT"
            exit 1
            ;;
    esac
    
    # Summary
    log ""
    log "========================================="
    log "Cost Optimization Analysis Complete"
    log "========================================="
    log "Report generated: $report_file"
    log "Recommendations found: ${#OPTIMIZATION_RECOMMENDATIONS[@]}"
    
    if [ ${#OPTIMIZATION_RECOMMENDATIONS[@]} -gt 0 ]; then
        log ""
        log "Top recommendations:"
        local count=0
        for rec_key in "${!OPTIMIZATION_RECOMMENDATIONS[@]}"; do
            if [ $count -lt 3 ]; then
                log "  - ${OPTIMIZATION_RECOMMENDATIONS[$rec_key]}"
                ((count++))
            fi
        done
    fi
    
    # Calculate and display savings
    calculate_savings
    
    log ""
    log "Full report available at: $report_file"
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Run main function
main