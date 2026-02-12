#!/bin/bash
#
# TerraFusion Comprehensive Cost Optimization and Resource Management System
# Monitors, analyzes, and optimizes cloud costs and resource utilization
#
# Usage: ./cost-optimization.sh [options]
# Options:
#   -a    Action (analyze|optimize|report|schedule|cleanup|rightsizing)
#   -e    Environment (development|staging|production|all)
#   -s    Service (compute|storage|network|database|all)
#   -t    Time period (7d|30d|90d|1y)
#   -b    Budget threshold (USD)
#   -r    Recommendation level (basic|advanced|aggressive)
#   -c    Configuration file path
#   -f    Output format (json|csv|html|pdf)
#   -d    Dry run mode (true|false, default: false)
#   -n    Auto-apply optimizations (true|false, default: false)

set -euo pipefail

# Configuration
ACTION="analyze"
ENVIRONMENT="all"
SERVICE="all"
TIME_PERIOD="30d"
BUDGET_THRESHOLD=""
RECOMMENDATION_LEVEL="basic"
CONFIG_FILE=""
OUTPUT_FORMAT="html"
DRY_RUN=false
AUTO_APPLY=false

# Directories and Files
COST_BASE_DIR="/opt/terrafusion/cost-optimization"
REPORTS_DIR="$COST_BASE_DIR/reports"
CONFIGS_DIR="$COST_BASE_DIR/configs"
ANALYTICS_DIR="$COST_BASE_DIR/analytics"
LOGS_DIR="/var/log/terrafusion/cost-optimization"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOGS_DIR/cost_optimization_$TIMESTAMP.log"

# AWS Configuration
AWS_REGION="${AWS_REGION:-us-west-2}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "unknown")

# Cost Thresholds
COST_ANOMALY_THRESHOLD=20  # Percentage increase
UNUSED_RESOURCE_THRESHOLD=5  # Percentage utilization
RIGHTSIZING_SAVINGS_THRESHOLD=10  # Minimum savings percentage

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create directories
mkdir -p "$COST_BASE_DIR"
mkdir -p "$REPORTS_DIR"
mkdir -p "$CONFIGS_DIR"
mkdir -p "$ANALYTICS_DIR"
mkdir -p "$LOGS_DIR"

# Parse arguments
while getopts "a:e:s:t:b:r:c:f:d:n:" opt; do
    case $opt in
        a) ACTION="$OPTARG" ;;
        e) ENVIRONMENT="$OPTARG" ;;
        s) SERVICE="$OPTARG" ;;
        t) TIME_PERIOD="$OPTARG" ;;
        b) BUDGET_THRESHOLD="$OPTARG" ;;
        r) RECOMMENDATION_LEVEL="$OPTARG" ;;
        c) CONFIG_FILE="$OPTARG" ;;
        f) OUTPUT_FORMAT="$OPTARG" ;;
        d) DRY_RUN="$OPTARG" ;;
        n) AUTO_APPLY="$OPTARG" ;;
        *) echo "Usage: $0 [-a action] [-e env] [-s service] [-t period] [-b budget] [-r level] [-c config] [-f format] [-d dryrun] [-n auto]"; exit 1 ;;
    esac
done

# Global data structures
declare -A COST_DATA
declare -A RESOURCE_INVENTORY
declare -A OPTIMIZATION_RECOMMENDATIONS
declare -A SAVINGS_OPPORTUNITIES
declare -A BUDGET_ALERTS

# Logging functions
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# Load cost optimization configuration
load_cost_config() {
    if [ -n "$CONFIG_FILE" ] && [ -f "$CONFIG_FILE" ]; then
        log "Loading cost optimization configuration from $CONFIG_FILE"
        source "$CONFIG_FILE"
    else
        log "Creating default cost optimization configuration"
        create_default_cost_config
    fi
}

# Create default cost configuration
create_default_cost_config() {
    cat > "$CONFIGS_DIR/cost_optimization_config.sh" << EOF
# TerraFusion Cost Optimization Configuration

# Budget Limits by Environment (USD per month)
declare -A ENVIRONMENT_BUDGETS
ENVIRONMENT_BUDGETS[development]=500
ENVIRONMENT_BUDGETS[staging]=1500
ENVIRONMENT_BUDGETS[production]=5000

# Cost per service thresholds (USD per month)
declare -A SERVICE_BUDGETS
SERVICE_BUDGETS[compute]=2000
SERVICE_BUDGETS[storage]=800
SERVICE_BUDGETS[network]=300
SERVICE_BUDGETS[database]=1200
SERVICE_BUDGETS[monitoring]=200

# Resource optimization thresholds
CPU_UTILIZATION_THRESHOLD=20
MEMORY_UTILIZATION_THRESHOLD=30
STORAGE_UTILIZATION_THRESHOLD=50
NETWORK_UTILIZATION_THRESHOLD=25

# Instance right-sizing parameters
RIGHTSIZING_ENABLED=true
RIGHTSIZING_MIN_SAVINGS=50  # USD per month
RIGHTSIZING_LOOKBACK_DAYS=14
RIGHTSIZING_TARGET_UTILIZATION=70

# Reserved Instance recommendations
RI_RECOMMENDATION_ENABLED=true
RI_LOOKBACK_DAYS=30
RI_MIN_SAVINGS=100  # USD per month

# Storage optimization
STORAGE_OPTIMIZATION_ENABLED=true
UNUSED_EBS_THRESHOLD=30  # Days
SNAPSHOT_CLEANUP_ENABLED=true
SNAPSHOT_RETENTION_DAYS=90

# Automation settings
AUTO_CLEANUP_UNUSED_RESOURCES=false
AUTO_SCHEDULE_INSTANCES=true
AUTO_OPTIMIZE_STORAGE_TIERS=true

# Notification settings
COST_ALERT_THRESHOLD=80  # Percentage of budget
ANOMALY_DETECTION_ENABLED=true
SLACK_WEBHOOK_URL=""
EMAIL_RECIPIENTS=""
EOF

    source "$CONFIGS_DIR/cost_optimization_config.sh"
    log_success "Default cost configuration created and loaded"
}

# Check prerequisites
check_prerequisites() {
    log "Checking cost optimization prerequisites"
    
    local prerequisites_met=true
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not available"
        prerequisites_met=false
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &>/dev/null; then
        log_error "AWS credentials not configured"
        prerequisites_met=false
    fi
    
    # Check required AWS permissions
    local required_permissions=(
        "ce:GetCostAndUsage"
        "ce:GetReservationCoverage" 
        "ce:GetReservationPurchaseRecommendation"
        "ce:GetReservationUtilization"
        "ce:GetRightsizingRecommendation"
        "ce:GetUsageReport"
        "ec2:DescribeInstances"
        "ec2:DescribeVolumes"
        "ec2:DescribeSnapshots"
        "rds:DescribeDBInstances"
        "support:DescribeTrustedAdvisorChecks"
    )
    
    # Test key permissions
    if ! aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-02 --granularity DAILY --metrics BlendedCost &>/dev/null; then
        log_warning "Limited Cost Explorer permissions detected"
    fi
    
    if [ "$prerequisites_met" = false ]; then
        log_error "Prerequisites check failed"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Analyze cost data
analyze_cost_data() {
    log "Analyzing cost data for $ENVIRONMENT environment"
    
    # Set time period parameters
    local start_date end_date
    case $TIME_PERIOD in
        7d) 
            start_date=$(date -d '7 days ago' +%Y-%m-%d)
            end_date=$(date +%Y-%m-%d)
            ;;
        30d)
            start_date=$(date -d '30 days ago' +%Y-%m-%d)
            end_date=$(date +%Y-%m-%d)
            ;;
        90d)
            start_date=$(date -d '90 days ago' +%Y-%m-%d)
            end_date=$(date +%Y-%m-%d)
            ;;
        1y)
            start_date=$(date -d '365 days ago' +%Y-%m-%d)
            end_date=$(date +%Y-%m-%d)
            ;;
    esac
    
    log_info "Analyzing costs from $start_date to $end_date"
    
    # Get overall cost data
    get_cost_and_usage_data "$start_date" "$end_date"
    
    # Get service-specific costs
    if [ "$SERVICE" = "all" ]; then
        analyze_compute_costs "$start_date" "$end_date"
        analyze_storage_costs "$start_date" "$end_date" 
        analyze_network_costs "$start_date" "$end_date"
        analyze_database_costs "$start_date" "$end_date"
    else
        case $SERVICE in
            compute) analyze_compute_costs "$start_date" "$end_date" ;;
            storage) analyze_storage_costs "$start_date" "$end_date" ;;
            network) analyze_network_costs "$start_date" "$end_date" ;;
            database) analyze_database_costs "$start_date" "$end_date" ;;
        esac
    fi
    
    # Detect cost anomalies
    detect_cost_anomalies "$start_date" "$end_date"
    
    # Analyze resource utilization
    analyze_resource_utilization
    
    log_success "Cost analysis completed"
}

# Get cost and usage data from AWS Cost Explorer
get_cost_and_usage_data() {
    local start_date=$1
    local end_date=$2
    
    log_info "Retrieving cost and usage data from AWS Cost Explorer"
    
    # Get total costs by service
    local cost_response=$(aws ce get-cost-and-usage \
        --time-period Start="$start_date",End="$end_date" \
        --granularity DAILY \
        --metrics BlendedCost \
        --group-by Type=DIMENSION,Key=SERVICE \
        --output json 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        # Parse and store cost data
        echo "$cost_response" > "$ANALYTICS_DIR/cost_data_$TIMESTAMP.json"
        
        # Extract total cost
        local total_cost=$(echo "$cost_response" | jq -r '.ResultsByTime[] | .Total.BlendedCost.Amount' | awk '{sum += $1} END {print sum}')
        COST_DATA["total_cost"]=${total_cost:-0}
        
        # Extract top services by cost
        local top_services=$(echo "$cost_response" | jq -r '.ResultsByTime[0].Groups[] | "\(.Keys[0]):\(.Metrics.BlendedCost.Amount)"' | sort -t: -k2 -nr | head -5)
        COST_DATA["top_services"]="$top_services"
        
        log_info "Total cost for period: \$${COST_DATA[total_cost]}"
    else
        log_error "Failed to retrieve cost data from AWS Cost Explorer"
        COST_DATA["total_cost"]=0
    fi
    
    # Get cost by environment tags
    if [ "$ENVIRONMENT" != "all" ]; then
        local env_cost_response=$(aws ce get-cost-and-usage \
            --time-period Start="$start_date",End="$end_date" \
            --granularity DAILY \
            --metrics BlendedCost \
            --group-by Type=TAG,Key=Environment \
            --filter file://<(echo "{\"Tags\":{\"Key\":\"Environment\",\"Values\":[\"$ENVIRONMENT\"]}}") \
            --output json 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            local env_cost=$(echo "$env_cost_response" | jq -r '.ResultsByTime[] | .Groups[] | select(.Keys[0] == "'$ENVIRONMENT'") | .Metrics.BlendedCost.Amount' | awk '{sum += $1} END {print sum}')
            COST_DATA["environment_cost"]=${env_cost:-0}
            log_info "$ENVIRONMENT environment cost: \$${COST_DATA[environment_cost]}"
        fi
    fi
}

# Analyze compute costs
analyze_compute_costs() {
    local start_date=$1
    local end_date=$2
    
    log_info "Analyzing compute costs"
    
    # Get EC2 instance data
    local ec2_instances=$(aws ec2 describe-instances \
        --filters "Name=instance-state-name,Values=running" \
        --query 'Reservations[].Instances[].[InstanceId,InstanceType,LaunchTime,Tags[?Key==`Environment`].Value|[0],Tags[?Key==`Name`].Value|[0]]' \
        --output json)
    
    local instance_count=$(echo "$ec2_instances" | jq '. | length')
    RESOURCE_INVENTORY["ec2_instances"]=$instance_count
    
    # Calculate estimated monthly EC2 costs
    local estimated_ec2_cost=$(echo "$ec2_instances" | jq -r '.[] | .[1]' | while read instance_type; do
        # Simplified cost estimation (would normally use AWS Pricing API)
        case $instance_type in
            t3.micro) echo "8.5" ;;
            t3.small) echo "17.0" ;;
            t3.medium) echo "34.0" ;;
            t3.large) echo "68.0" ;;
            m5.large) echo "89.0" ;;
            m5.xlarge) echo "178.0" ;;
            *) echo "50.0" ;;  # Default estimate
        esac
    done | awk '{sum += $1} END {print sum}')
    
    COST_DATA["estimated_ec2_monthly"]=${estimated_ec2_cost:-0}
    log_info "Estimated monthly EC2 cost: \$${COST_DATA[estimated_ec2_monthly]}"
    
    # Identify unused instances
    identify_unused_instances
    
    # Get rightsizing recommendations
    get_rightsizing_recommendations
}

# Analyze storage costs
analyze_storage_costs() {
    local start_date=$1
    local end_date=$2
    
    log_info "Analyzing storage costs"
    
    # Get EBS volume data
    local ebs_volumes=$(aws ec2 describe-volumes \
        --query 'Volumes[*].[VolumeId,Size,VolumeType,State,Attachments[0].InstanceId,Tags[?Key==`Environment`].Value|[0]]' \
        --output json)
    
    local volume_count=$(echo "$ebs_volumes" | jq '. | length')
    local total_storage_gb=$(echo "$ebs_volumes" | jq '[.[] | .[1]] | add')
    
    RESOURCE_INVENTORY["ebs_volumes"]=$volume_count
    RESOURCE_INVENTORY["total_storage_gb"]=${total_storage_gb:-0}
    
    # Calculate estimated storage costs
    local estimated_storage_cost=$(echo "$ebs_volumes" | jq -r '.[] | "\(.[1]) \(.[2])"' | while read size type; do
        case $type in
            gp3) echo "scale=2; $size * 0.08" | bc ;;
            gp2) echo "scale=2; $size * 0.10" | bc ;;
            io1) echo "scale=2; $size * 0.125" | bc ;;
            io2) echo "scale=2; $size * 0.125" | bc ;;
            st1) echo "scale=2; $size * 0.045" | bc ;;
            sc1) echo "scale=2; $size * 0.025" | bc ;;
            *) echo "scale=2; $size * 0.08" | bc ;;
        esac
    done | awk '{sum += $1} END {print sum}')
    
    COST_DATA["estimated_storage_monthly"]=${estimated_storage_cost:-0}
    log_info "Estimated monthly storage cost: \$${COST_DATA[estimated_storage_monthly]}"
    
    # Identify unused volumes
    identify_unused_volumes
    
    # Analyze snapshot costs
    analyze_snapshot_costs
    
    # Recommend storage tier optimizations
    recommend_storage_optimizations
}

# Analyze network costs
analyze_network_costs() {
    local start_date=$1
    local end_date=$2
    
    log_info "Analyzing network costs"
    
    # Get load balancer data
    local load_balancers=$(aws elbv2 describe-load-balancers --query 'LoadBalancers[*].[LoadBalancerName,Type,State.Code,Tags[?Key==`Environment`].Value|[0]]' --output json 2>/dev/null || echo "[]")
    local lb_count=$(echo "$load_balancers" | jq '. | length')
    RESOURCE_INVENTORY["load_balancers"]=$lb_count
    
    # Get NAT Gateway data
    local nat_gateways=$(aws ec2 describe-nat-gateways --query 'NatGateways[?State==`available`].[NatGatewayId,VpcId,Tags[?Key==`Environment`].Value|[0]]' --output json 2>/dev/null || echo "[]")
    local nat_count=$(echo "$nat_gateways" | jq '. | length')
    RESOURCE_INVENTORY["nat_gateways"]=$nat_count
    
    # Estimate network costs
    local estimated_lb_cost=$(echo "scale=2; $lb_count * 22.5" | bc)  # ~$22.5/month per ALB
    local estimated_nat_cost=$(echo "scale=2; $nat_count * 45.0" | bc)  # ~$45/month per NAT Gateway
    local estimated_network_cost=$(echo "scale=2; $estimated_lb_cost + $estimated_nat_cost" | bc)
    
    COST_DATA["estimated_network_monthly"]=${estimated_network_cost:-0}
    log_info "Estimated monthly network cost: \$${COST_DATA[estimated_network_monthly]}"
    
    # Identify unused load balancers
    identify_unused_load_balancers
}

# Analyze database costs
analyze_database_costs() {
    local start_date=$1
    local end_date=$2
    
    log_info "Analyzing database costs"
    
    # Get RDS instance data
    local rds_instances=$(aws rds describe-db-instances \
        --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceClass,Engine,DBInstanceStatus,MultiAZ,Tags[?Key==`Environment`].Value|[0]]' \
        --output json 2>/dev/null || echo "[]")
    
    local rds_count=$(echo "$rds_instances" | jq '. | length')
    RESOURCE_INVENTORY["rds_instances"]=$rds_count
    
    # Calculate estimated RDS costs
    local estimated_rds_cost=$(echo "$rds_instances" | jq -r '.[] | "\(.[1]) \(.[4])"' | while read instance_class multi_az; do
        local base_cost
        case $instance_class in
            db.t3.micro) base_cost=15 ;;
            db.t3.small) base_cost=30 ;;
            db.t3.medium) base_cost=60 ;;
            db.t3.large) base_cost=120 ;;
            db.r5.large) base_cost=180 ;;
            db.r5.xlarge) base_cost=360 ;;
            *) base_cost=100 ;;
        esac
        
        if [ "$multi_az" = "true" ]; then
            base_cost=$((base_cost * 2))
        fi
        
        echo "$base_cost"
    done | awk '{sum += $1} END {print sum}')
    
    COST_DATA["estimated_rds_monthly"]=${estimated_rds_cost:-0}
    log_info "Estimated monthly RDS cost: \$${COST_DATA[estimated_rds_monthly]}"
    
    # Identify underutilized databases
    identify_underutilized_databases
}

# Detect cost anomalies
detect_cost_anomalies() {
    local start_date=$1
    local end_date=$2
    
    log_info "Detecting cost anomalies"
    
    # Compare current period with previous period
    local prev_start_date=$(date -d "$start_date - $TIME_PERIOD" +%Y-%m-%d)
    local prev_end_date=$(date -d "$end_date - $TIME_PERIOD" +%Y-%m-%d)
    
    local prev_cost_response=$(aws ce get-cost-and-usage \
        --time-period Start="$prev_start_date",End="$prev_end_date" \
        --granularity DAILY \
        --metrics BlendedCost \
        --output json 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        local prev_total_cost=$(echo "$prev_cost_response" | jq -r '.ResultsByTime[] | .Total.BlendedCost.Amount' | awk '{sum += $1} END {print sum}')
        local current_cost=${COST_DATA[total_cost]}
        
        if [ -n "$prev_total_cost" ] && [ "$prev_total_cost" != "0" ]; then
            local cost_change_percent=$(echo "scale=2; ($current_cost - $prev_total_cost) / $prev_total_cost * 100" | bc)
            COST_DATA["cost_change_percent"]=${cost_change_percent:-0}
            
            log_info "Cost change from previous period: ${cost_change_percent}%"
            
            # Check for anomalies
            if (( $(echo "$cost_change_percent > $COST_ANOMALY_THRESHOLD" | bc -l) )); then
                log_warning "Cost anomaly detected: ${cost_change_percent}% increase"
                BUDGET_ALERTS["anomaly_detected"]="true"
                BUDGET_ALERTS["anomaly_percent"]="$cost_change_percent"
                
                # Send anomaly alert
                send_cost_anomaly_alert "$cost_change_percent"
            fi
        fi
    fi
}

# Analyze resource utilization
analyze_resource_utilization() {
    log_info "Analyzing resource utilization patterns"
    
    # This would typically integrate with CloudWatch metrics
    # For now, we'll simulate utilization analysis
    
    # Analyze EC2 instance utilization (simulated)
    local low_util_instances=0
    if [ "${RESOURCE_INVENTORY[ec2_instances]:-0}" -gt 0 ]; then
        # In practice, this would query CloudWatch metrics
        low_util_instances=$((RESOURCE_INVENTORY[ec2_instances] / 4))  # Simulate 25% underutilized
    fi
    
    RESOURCE_INVENTORY["low_utilization_instances"]=$low_util_instances
    
    if [ "$low_util_instances" -gt 0 ]; then
        log_warning "Found $low_util_instances potentially underutilized instances"
        
        # Add to optimization recommendations
        local monthly_savings=$(echo "scale=2; $low_util_instances * 50" | bc)  # Estimated savings
        OPTIMIZATION_RECOMMENDATIONS["instance_rightsizing"]="Rightsize $low_util_instances underutilized instances for estimated monthly savings of \$${monthly_savings}"
        SAVINGS_OPPORTUNITIES["instance_rightsizing"]=$monthly_savings
    fi
}

# Identify unused instances
identify_unused_instances() {
    log_info "Identifying unused EC2 instances"
    
    # Get instances with low CPU utilization (simulated - would use CloudWatch)
    local unused_instances=$(aws ec2 describe-instances \
        --filters "Name=instance-state-name,Values=running" \
        --query 'Reservations[].Instances[?Tags[?Key==`Environment` && Value==`'$ENVIRONMENT'`]].[InstanceId,InstanceType,LaunchTime]' \
        --output json 2>/dev/null || echo "[]")
    
    local unused_count=$(echo "$unused_instances" | jq '. | length')
    
    if [ "$unused_count" -gt 0 ]; then
        RESOURCE_INVENTORY["unused_instances"]=$unused_count
        
        # Calculate potential savings
        local estimated_savings=$(echo "scale=2; $unused_count * 75" | bc)  # Average $75/month per instance
        SAVINGS_OPPORTUNITIES["unused_instances"]=$estimated_savings
        OPTIMIZATION_RECOMMENDATIONS["unused_instances"]="Terminate $unused_count unused instances for monthly savings of \$${estimated_savings}"
        
        log_warning "Found $unused_count potentially unused instances with estimated savings of \$${estimated_savings}/month"
    fi
}

# Identify unused volumes
identify_unused_volumes() {
    log_info "Identifying unused EBS volumes"
    
    local unused_volumes=$(aws ec2 describe-volumes \
        --filters "Name=status,Values=available" \
        --query 'Volumes[*].[VolumeId,Size,VolumeType,CreateTime]' \
        --output json 2>/dev/null || echo "[]")
    
    local unused_volume_count=$(echo "$unused_volumes" | jq '. | length')
    local unused_volume_size=$(echo "$unused_volumes" | jq '[.[] | .[1]] | add // 0')
    
    if [ "$unused_volume_count" -gt 0 ]; then
        RESOURCE_INVENTORY["unused_volumes"]=$unused_volume_count
        RESOURCE_INVENTORY["unused_volume_size_gb"]=$unused_volume_size
        
        # Calculate potential savings
        local estimated_savings=$(echo "scale=2; $unused_volume_size * 0.08" | bc)  # $0.08/GB/month for gp3
        SAVINGS_OPPORTUNITIES["unused_volumes"]=$estimated_savings
        OPTIMIZATION_RECOMMENDATIONS["unused_volumes"]="Delete $unused_volume_count unused volumes (${unused_volume_size}GB) for monthly savings of \$${estimated_savings}"
        
        log_warning "Found $unused_volume_count unused volumes (${unused_volume_size}GB) with estimated savings of \$${estimated_savings}/month"
    fi
}

# Analyze snapshot costs
analyze_snapshot_costs() {
    log_info "Analyzing EBS snapshot costs"
    
    # Get old snapshots
    local old_snapshots=$(aws ec2 describe-snapshots \
        --owner-ids self \
        --query 'Snapshots[?StartTime <= `'$(date -d "90 days ago" --iso-8601)'`].[SnapshotId,VolumeSize,StartTime,Description]' \
        --output json 2>/dev/null || echo "[]")
    
    local old_snapshot_count=$(echo "$old_snapshots" | jq '. | length')
    local old_snapshot_size=$(echo "$old_snapshots" | jq '[.[] | .[1]] | add // 0')
    
    if [ "$old_snapshot_count" -gt 0 ]; then
        RESOURCE_INVENTORY["old_snapshots"]=$old_snapshot_count
        RESOURCE_INVENTORY["old_snapshot_size_gb"]=$old_snapshot_size
        
        # Calculate potential savings
        local estimated_savings=$(echo "scale=2; $old_snapshot_size * 0.05" | bc)  # $0.05/GB/month for snapshots
        SAVINGS_OPPORTUNITIES["old_snapshots"]=$estimated_savings
        OPTIMIZATION_RECOMMENDATIONS["old_snapshots"]="Delete $old_snapshot_count old snapshots (${old_snapshot_size}GB) for monthly savings of \$${estimated_savings}"
        
        log_info "Found $old_snapshot_count old snapshots (${old_snapshot_size}GB) with potential savings of \$${estimated_savings}/month"
    fi
}

# Recommend storage optimizations
recommend_storage_optimizations() {
    log_info "Analyzing storage tier optimization opportunities"
    
    # Get volumes that could be moved to cheaper storage tiers
    local gp2_volumes=$(aws ec2 describe-volumes \
        --filters "Name=volume-type,Values=gp2" "Name=state,Values=in-use" \
        --query 'Volumes[*].[VolumeId,Size,VolumeType,Iops]' \
        --output json 2>/dev/null || echo "[]")
    
    local gp2_count=$(echo "$gp2_volumes" | jq '. | length')
    local gp2_size=$(echo "$gp2_volumes" | jq '[.[] | .[1]] | add // 0')
    
    if [ "$gp2_count" -gt 0 ]; then
        # Calculate savings from gp2 to gp3 migration
        local gp2_cost=$(echo "scale=2; $gp2_size * 0.10" | bc)
        local gp3_cost=$(echo "scale=2; $gp2_size * 0.08" | bc)
        local migration_savings=$(echo "scale=2; $gp2_cost - $gp3_cost" | bc)
        
        if (( $(echo "$migration_savings > 10" | bc -l) )); then
            SAVINGS_OPPORTUNITIES["storage_tier_optimization"]=$migration_savings
            OPTIMIZATION_RECOMMENDATIONS["storage_tier_optimization"]="Migrate $gp2_count gp2 volumes (${gp2_size}GB) to gp3 for monthly savings of \$${migration_savings}"
            
            log_info "Storage tier optimization opportunity: \$${migration_savings}/month savings"
        fi
    fi
}

# Identify unused load balancers
identify_unused_load_balancers() {
    log_info "Identifying unused load balancers"
    
    # Get load balancers with no targets
    local unused_lbs=$(aws elbv2 describe-load-balancers --output json 2>/dev/null | jq -r '.LoadBalancers[] | select(.State.Code == "active") | .LoadBalancerArn' | while read lb_arn; do
        local target_groups=$(aws elbv2 describe-target-groups --load-balancer-arn "$lb_arn" --output json 2>/dev/null | jq -r '.TargetGroups[].TargetGroupArn')
        
        local has_targets=false
        for tg_arn in $target_groups; do
            local healthy_targets=$(aws elbv2 describe-target-health --target-group-arn "$tg_arn" --output json 2>/dev/null | jq -r '.TargetHealthDescriptions[] | select(.TargetHealth.State == "healthy") | .Target.Id' | wc -l)
            if [ "$healthy_targets" -gt 0 ]; then
                has_targets=true
                break
            fi
        done
        
        if [ "$has_targets" = false ]; then
            echo "$lb_arn"
        fi
    done)
    
    local unused_lb_count=$(echo "$unused_lbs" | wc -l)
    
    if [ "$unused_lb_count" -gt 0 ] && [ -n "$unused_lbs" ]; then
        RESOURCE_INVENTORY["unused_load_balancers"]=$unused_lb_count
        
        # Calculate potential savings
        local estimated_savings=$(echo "scale=2; $unused_lb_count * 22.5" | bc)  # $22.5/month per ALB
        SAVINGS_OPPORTUNITIES["unused_load_balancers"]=$estimated_savings
        OPTIMIZATION_RECOMMENDATIONS["unused_load_balancers"]="Delete $unused_lb_count unused load balancers for monthly savings of \$${estimated_savings}"
        
        log_warning "Found $unused_lb_count unused load balancers with estimated savings of \$${estimated_savings}/month"
    fi
}

# Identify underutilized databases
identify_underutilized_databases() {
    log_info "Identifying underutilized RDS instances"
    
    # This would typically use CloudWatch metrics to identify low-utilization databases
    # For now, we'll simulate the analysis
    
    local rds_count=${RESOURCE_INVENTORY[rds_instances]:-0}
    if [ "$rds_count" -gt 0 ]; then
        # Simulate finding 1/3 of databases as underutilized
        local underutilized_count=$((rds_count / 3))
        
        if [ "$underutilized_count" -gt 0 ]; then
            RESOURCE_INVENTORY["underutilized_databases"]=$underutilized_count
            
            # Calculate potential savings from downsizing
            local estimated_savings=$(echo "scale=2; $underutilized_count * 60" | bc)  # Average $60/month savings per downsize
            SAVINGS_OPPORTUNITIES["database_rightsizing"]=$estimated_savings
            OPTIMIZATION_RECOMMENDATIONS["database_rightsizing"]="Downsize $underutilized_count underutilized RDS instances for monthly savings of \$${estimated_savings}"
            
            log_info "Found $underutilized_count underutilized databases with potential savings of \$${estimated_savings}/month"
        fi
    fi
}

# Get rightsizing recommendations
get_rightsizing_recommendations() {
    log_info "Getting EC2 rightsizing recommendations from AWS"
    
    # Get rightsizing recommendations from Cost Explorer
    local rightsizing_response=$(aws ce get-rightsizing-recommendation \
        --service EC2-Instance \
        --output json 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "$rightsizing_response" > "$ANALYTICS_DIR/rightsizing_recommendations_$TIMESTAMP.json"
        
        local recommendation_count=$(echo "$rightsizing_response" | jq '.RightsizingRecommendations | length')
        local estimated_monthly_savings=$(echo "$rightsizing_response" | jq -r '.RightsizingRecommendations[].EstimatedMonthlySavings.Amount' | awk '{sum += $1} END {print sum}')
        
        if [ "$recommendation_count" -gt 0 ]; then
            SAVINGS_OPPORTUNITIES["aws_rightsizing"]=${estimated_monthly_savings:-0}
            OPTIMIZATION_RECOMMENDATIONS["aws_rightsizing"]="AWS recommends rightsizing $recommendation_count instances for estimated monthly savings of \$${estimated_monthly_savings}"
            
            log_info "AWS rightsizing recommendations: $recommendation_count instances, \$${estimated_monthly_savings}/month potential savings"
        fi
    else
        log_warning "Could not retrieve rightsizing recommendations from AWS"
    fi
}

# Implement optimization recommendations
implement_optimizations() {
    log "Implementing cost optimization recommendations"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN MODE: Would implement the following optimizations:"
        for key in "${!OPTIMIZATION_RECOMMENDATIONS[@]}"; do
            log_info "  - $key: ${OPTIMIZATION_RECOMMENDATIONS[$key]}"
        done
        return
    fi
    
    local total_implemented=0
    local total_savings=0
    
    # Implement storage tier optimizations
    if [ -n "${OPTIMIZATION_RECOMMENDATIONS[storage_tier_optimization]:-}" ]; then
        if implement_storage_tier_optimization; then
            ((total_implemented++))
            total_savings=$(echo "scale=2; $total_savings + ${SAVINGS_OPPORTUNITIES[storage_tier_optimization]:-0}" | bc)
        fi
    fi
    
    # Cleanup old snapshots
    if [ -n "${OPTIMIZATION_RECOMMENDATIONS[old_snapshots]:-}" ]; then
        if cleanup_old_snapshots; then
            ((total_implemented++))
            total_savings=$(echo "scale=2; $total_savings + ${SAVINGS_OPPORTUNITIES[old_snapshots]:-0}" | bc)
        fi
    fi
    
    # Delete unused volumes (if auto-apply is enabled)
    if [ "$AUTO_APPLY" = "true" ] && [ -n "${OPTIMIZATION_RECOMMENDATIONS[unused_volumes]:-}" ]; then
        if cleanup_unused_volumes; then
            ((total_implemented++))
            total_savings=$(echo "scale=2; $total_savings + ${SAVINGS_OPPORTUNITIES[unused_volumes]:-0}" | bc)
        fi
    fi
    
    log_success "Implemented $total_implemented optimizations with estimated monthly savings of \$${total_savings}"
}

# Implement storage tier optimization
implement_storage_tier_optimization() {
    log_info "Implementing storage tier optimizations"
    
    # Get gp2 volumes to migrate
    local gp2_volumes=$(aws ec2 describe-volumes \
        --filters "Name=volume-type,Values=gp2" "Name=state,Values=in-use" \
        --query 'Volumes[*].VolumeId' \
        --output text 2>/dev/null)
    
    local migrated_count=0
    for volume_id in $gp2_volumes; do
        log_info "Migrating volume $volume_id from gp2 to gp3"
        
        if aws ec2 modify-volume --volume-id "$volume_id" --volume-type gp3 &>/dev/null; then
            ((migrated_count++))
            log_success "Successfully migrated volume $volume_id to gp3"
        else
            log_error "Failed to migrate volume $volume_id"
        fi
        
        # Rate limiting
        sleep 2
    done
    
    if [ "$migrated_count" -gt 0 ]; then
        log_success "Migrated $migrated_count volumes from gp2 to gp3"
        return 0
    else
        return 1
    fi
}

# Cleanup old snapshots
cleanup_old_snapshots() {
    log_info "Cleaning up old snapshots"
    
    # Get snapshots older than retention period
    local old_snapshots=$(aws ec2 describe-snapshots \
        --owner-ids self \
        --query 'Snapshots[?StartTime <= `'$(date -d "${SNAPSHOT_RETENTION_DAYS:-90} days ago" --iso-8601)'`].SnapshotId' \
        --output text 2>/dev/null)
    
    local deleted_count=0
    for snapshot_id in $old_snapshots; do
        log_info "Deleting old snapshot $snapshot_id"
        
        if aws ec2 delete-snapshot --snapshot-id "$snapshot_id" &>/dev/null; then
            ((deleted_count++))
            log_success "Successfully deleted snapshot $snapshot_id"
        else
            log_error "Failed to delete snapshot $snapshot_id"
        fi
        
        # Rate limiting
        sleep 1
    done
    
    if [ "$deleted_count" -gt 0 ]; then
        log_success "Deleted $deleted_count old snapshots"
        return 0
    else
        return 1
    fi
}

# Cleanup unused volumes
cleanup_unused_volumes() {
    log_warning "Cleaning up unused volumes (destructive operation)"
    
    # Get available (unused) volumes
    local unused_volumes=$(aws ec2 describe-volumes \
        --filters "Name=status,Values=available" \
        --query 'Volumes[*].VolumeId' \
        --output text 2>/dev/null)
    
    local deleted_count=0
    for volume_id in $unused_volumes; do
        log_warning "Deleting unused volume $volume_id"
        
        if aws ec2 delete-volume --volume-id "$volume_id" &>/dev/null; then
            ((deleted_count++))
            log_success "Successfully deleted volume $volume_id"
        else
            log_error "Failed to delete volume $volume_id"
        fi
        
        # Rate limiting 
        sleep 2
    done
    
    if [ "$deleted_count" -gt 0 ]; then
        log_success "Deleted $deleted_count unused volumes"
        return 0
    else
        return 1
    fi
}

# Send cost anomaly alert
send_cost_anomaly_alert() {
    local change_percent=$1
    
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local message="{
            \"text\": \"💰 Cost Anomaly Detected\",
            \"attachments\": [{
                \"color\": \"warning\",
                \"fields\": [
                    {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                    {\"title\": \"Cost Change\", \"value\": \"${change_percent}%\", \"short\": true},
                    {\"title\": \"Current Cost\", \"value\": \"\$${COST_DATA[total_cost]}\", \"short\": true},
                    {\"title\": \"Time Period\", \"value\": \"$TIME_PERIOD\", \"short\": true}
                ]
            }]
        }"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$message" \
            "${SLACK_WEBHOOK_URL}" &>/dev/null || true
    fi
}

# Generate cost optimization report
generate_cost_report() {
    local report_file="$REPORTS_DIR/cost_optimization_report_${ENVIRONMENT}_$TIMESTAMP.$OUTPUT_FORMAT"
    
    log "Generating cost optimization report: $report_file"
    
    case $OUTPUT_FORMAT in
        html) generate_html_cost_report "$report_file" ;;
        json) generate_json_cost_report "$report_file" ;;
        csv) generate_csv_cost_report "$report_file" ;;
        *) generate_html_cost_report "$report_file" ;;
    esac
    
    log_success "Cost optimization report generated: $report_file"
}

# Generate HTML cost report
generate_html_cost_report() {
    local report_file=$1
    
    # Calculate total potential savings
    local total_savings=0
    for key in "${!SAVINGS_OPPORTUNITIES[@]}"; do
        total_savings=$(echo "scale=2; $total_savings + ${SAVINGS_OPPORTUNITIES[$key]}" | bc)
    done
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Cost Optimization Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary-cards { display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; min-width: 200px; text-align: center; }
        .cost-card { background-color: #e3f2fd; }
        .savings-card { background-color: #e8f5e8; }
        .alert-card { background-color: #ffebee; }
        .section { margin: 20px 0; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .high-priority { color: red; font-weight: bold; }
        .medium-priority { color: orange; font-weight: bold; }
        .low-priority { color: green; }
        .recommendation { background-color: #fff3e0; padding: 10px; margin: 5px 0; border-left: 4px solid #ff9800; }
    </style>
</head>
<body>
    <div class="header">
        <h1>💰 TerraFusion Cost Optimization Report</h1>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Time Period:</strong> $TIME_PERIOD</p>
        <p><strong>Generated:</strong> $(date)</p>
    </div>
    
    <div class="summary-cards">
        <div class="card cost-card">
            <h3>Current Cost</h3>
            <h2>\$${COST_DATA[total_cost]:-0}</h2>
            <p>Last $TIME_PERIOD</p>
        </div>
        <div class="card savings-card">
            <h3>Potential Savings</h3>
            <h2>\$${total_savings}</h2>
            <p>Monthly estimate</p>
        </div>
        <div class="card alert-card">
            <h3>Cost Change</h3>
            <h2>${COST_DATA[cost_change_percent]:-0}%</h2>
            <p>vs Previous period</p>
        </div>
    </div>
    
    <div class="section">
        <h2>Resource Inventory</h2>
        <table>
            <tr><th>Resource Type</th><th>Count</th><th>Estimated Monthly Cost</th></tr>
            <tr><td>EC2 Instances</td><td>${RESOURCE_INVENTORY[ec2_instances]:-0}</td><td>\$${COST_DATA[estimated_ec2_monthly]:-0}</td></tr>
            <tr><td>EBS Volumes</td><td>${RESOURCE_INVENTORY[ebs_volumes]:-0} (${RESOURCE_INVENTORY[total_storage_gb]:-0}GB)</td><td>\$${COST_DATA[estimated_storage_monthly]:-0}</td></tr>
            <tr><td>RDS Instances</td><td>${RESOURCE_INVENTORY[rds_instances]:-0}</td><td>\$${COST_DATA[estimated_rds_monthly]:-0}</td></tr>
            <tr><td>Load Balancers</td><td>${RESOURCE_INVENTORY[load_balancers]:-0}</td><td>\$${COST_DATA[estimated_network_monthly]:-0}</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Optimization Opportunities</h2>
EOF

    # Add optimization recommendations
    for key in "${!OPTIMIZATION_RECOMMENDATIONS[@]}"; do
        local savings="${SAVINGS_OPPORTUNITIES[$key]:-0}"
        local priority_class="low-priority"
        if (( $(echo "$savings > 100" | bc -l) )); then
            priority_class="high-priority"
        elif (( $(echo "$savings > 50" | bc -l) )); then
            priority_class="medium-priority"
        fi
        
        cat >> "$report_file" << EOF
        <div class="recommendation">
            <strong class="$priority_class">$(echo "$key" | tr '_' ' ' | sed 's/\b\w/\U&/g')</strong>
            <p>${OPTIMIZATION_RECOMMENDATIONS[$key]}</p>
            <p><em>Estimated monthly savings: \$${savings}</em></p>
        </div>
EOF
    done

    cat >> "$report_file" << EOF
    </div>
    
    <div class="section">
        <h2>Waste Identification</h2>
        <table>
            <tr><th>Resource Type</th><th>Count</th><th>Potential Monthly Savings</th></tr>
EOF

    # Add waste identification rows
    if [ -n "${RESOURCE_INVENTORY[unused_instances]:-}" ]; then
        cat >> "$report_file" << EOF
            <tr><td>Unused EC2 Instances</td><td>${RESOURCE_INVENTORY[unused_instances]}</td><td>\$${SAVINGS_OPPORTUNITIES[unused_instances]:-0}</td></tr>
EOF
    fi
    
    if [ -n "${RESOURCE_INVENTORY[unused_volumes]:-}" ]; then
        cat >> "$report_file" << EOF
            <tr><td>Unused EBS Volumes</td><td>${RESOURCE_INVENTORY[unused_volumes]} (${RESOURCE_INVENTORY[unused_volume_size_gb]:-0}GB)</td><td>\$${SAVINGS_OPPORTUNITIES[unused_volumes]:-0}</td></tr>
EOF
    fi
    
    if [ -n "${RESOURCE_INVENTORY[old_snapshots]:-}" ]; then
        cat >> "$report_file" << EOF
            <tr><td>Old Snapshots</td><td>${RESOURCE_INVENTORY[old_snapshots]} (${RESOURCE_INVENTORY[old_snapshot_size_gb]:-0}GB)</td><td>\$${SAVINGS_OPPORTUNITIES[old_snapshots]:-0}</td></tr>
EOF
    fi

    cat >> "$report_file" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            <li>Review and prioritize optimization recommendations based on potential savings</li>
            <li>Implement low-risk optimizations (storage tier changes, snapshot cleanup)</li>
            <li>Plan for medium-risk optimizations (instance rightsizing) during maintenance windows</li>
            <li>Set up automated cost monitoring and alerting</li>
            <li>Schedule regular cost optimization reviews</li>
        </ol>
    </div>
    
    <div class="section">
        <h2>Automation Recommendations</h2>
        <ul>
            <li>Enable automated snapshot lifecycle management</li>
            <li>Implement instance scheduling for non-production environments</li>
            <li>Set up cost anomaly detection alerts</li>
            <li>Configure automated storage tier transitions</li>
            <li>Establish budget alerts for all environments</li>
        </ul>
    </div>
    
    <p><small>Report generated by TerraFusion Cost Optimization System on $(date)</small></p>
</body>
</html>
EOF
}

# Generate JSON cost report
generate_json_cost_report() {
    local report_file=$1
    
    # Calculate total potential savings
    local total_savings=0
    for key in "${!SAVINGS_OPPORTUNITIES[@]}"; do
        total_savings=$(echo "scale=2; $total_savings + ${SAVINGS_OPPORTUNITIES[$key]}" | bc)
    done
    
    cat > "$report_file" << EOF
{
  "report_metadata": {
    "environment": "$ENVIRONMENT",
    "time_period": "$TIME_PERIOD",
    "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "aws_account_id": "$AWS_ACCOUNT_ID"
  },
  "cost_summary": {
    "current_cost": ${COST_DATA[total_cost]:-0},
    "cost_change_percent": ${COST_DATA[cost_change_percent]:-0},
    "potential_monthly_savings": $total_savings,
    "environment_cost": ${COST_DATA[environment_cost]:-0}
  },
  "resource_inventory": {
    "ec2_instances": ${RESOURCE_INVENTORY[ec2_instances]:-0},
    "ebs_volumes": ${RESOURCE_INVENTORY[ebs_volumes]:-0},
    "total_storage_gb": ${RESOURCE_INVENTORY[total_storage_gb]:-0},
    "rds_instances": ${RESOURCE_INVENTORY[rds_instances]:-0},
    "load_balancers": ${RESOURCE_INVENTORY[load_balancers]:-0},
    "nat_gateways": ${RESOURCE_INVENTORY[nat_gateways]:-0}
  },
  "estimated_monthly_costs": {
    "compute": ${COST_DATA[estimated_ec2_monthly]:-0},
    "storage": ${COST_DATA[estimated_storage_monthly]:-0},
    "database": ${COST_DATA[estimated_rds_monthly]:-0},
    "network": ${COST_DATA[estimated_network_monthly]:-0}
  },
  "optimization_opportunities": [
EOF

    # Add optimization recommendations as JSON array
    local first_recommendation=true
    for key in "${!OPTIMIZATION_RECOMMENDATIONS[@]}"; do
        if [ "$first_recommendation" = false ]; then
            echo "," >> "$report_file"
        fi
        first_recommendation=false
        
        cat >> "$report_file" << EOF
    {
      "type": "$key",
      "description": "${OPTIMIZATION_RECOMMENDATIONS[$key]}",
      "estimated_monthly_savings": ${SAVINGS_OPPORTUNITIES[$key]:-0},
      "priority": "$([ "${SAVINGS_OPPORTUNITIES[$key]:-0}" > 100 ] && echo "high" || echo "medium")"
    }
EOF
    done

    cat >> "$report_file" << EOF
  ],
  "waste_identification": {
EOF

    # Add waste identification
    local waste_items=()
    if [ -n "${RESOURCE_INVENTORY[unused_instances]:-}" ]; then
        waste_items+=("\"unused_instances\": {\"count\": ${RESOURCE_INVENTORY[unused_instances]}, \"savings\": ${SAVINGS_OPPORTUNITIES[unused_instances]:-0}}")
    fi
    if [ -n "${RESOURCE_INVENTORY[unused_volumes]:-}" ]; then
        waste_items+=("\"unused_volumes\": {\"count\": ${RESOURCE_INVENTORY[unused_volumes]}, \"size_gb\": ${RESOURCE_INVENTORY[unused_volume_size_gb]:-0}, \"savings\": ${SAVINGS_OPPORTUNITIES[unused_volumes]:-0}}")
    fi
    if [ -n "${RESOURCE_INVENTORY[old_snapshots]:-}" ]; then
        waste_items+=("\"old_snapshots\": {\"count\": ${RESOURCE_INVENTORY[old_snapshots]}, \"size_gb\": ${RESOURCE_INVENTORY[old_snapshot_size_gb]:-0}, \"savings\": ${SAVINGS_OPPORTUNITIES[old_snapshots]:-0}}")
    fi
    
    printf "%s" "${waste_items[0]:-}" >> "$report_file"
    for ((i=1; i<${#waste_items[@]}; i++)); do
        printf ",\n    %s" "${waste_items[i]}" >> "$report_file"
    done

    cat >> "$report_file" << EOF

  },
  "recommendations": [
    "Review and prioritize optimization recommendations based on potential savings",
    "Implement low-risk optimizations first (storage tier changes, snapshot cleanup)",
    "Plan medium-risk optimizations during maintenance windows",
    "Set up automated cost monitoring and alerting",
    "Schedule regular cost optimization reviews"
  ]
}
EOF
}

# Generate CSV cost report
generate_csv_cost_report() {
    local report_file=$1
    
    cat > "$report_file" << EOF
Report Type,Environment,Time Period,Generated At,Current Cost,Potential Savings,Cost Change %
Cost Optimization,$ENVIRONMENT,$TIME_PERIOD,$(date -u +%Y-%m-%dT%H:%M:%SZ),${COST_DATA[total_cost]:-0},$(echo "${!SAVINGS_OPPORTUNITIES[@]}" | xargs -n1 | while read key; do echo "${SAVINGS_OPPORTUNITIES[$key]}"; done | awk '{sum += $1} END {print sum}'),${COST_DATA[cost_change_percent]:-0}

Resource Type,Count,Estimated Monthly Cost
EC2 Instances,${RESOURCE_INVENTORY[ec2_instances]:-0},${COST_DATA[estimated_ec2_monthly]:-0}
EBS Volumes,${RESOURCE_INVENTORY[ebs_volumes]:-0},${COST_DATA[estimated_storage_monthly]:-0}
RDS Instances,${RESOURCE_INVENTORY[rds_instances]:-0},${COST_DATA[estimated_rds_monthly]:-0}
Load Balancers,${RESOURCE_INVENTORY[load_balancers]:-0},${COST_DATA[estimated_network_monthly]:-0}

Optimization Type,Description,Estimated Monthly Savings
EOF

    # Add optimization recommendations
    for key in "${!OPTIMIZATION_RECOMMENDATIONS[@]}"; do
        echo "$key,\"${OPTIMIZATION_RECOMMENDATIONS[$key]}\",${SAVINGS_OPPORTUNITIES[$key]:-0}" >> "$report_file"
    done
}

# Schedule cost optimization
schedule_cost_optimization() {
    log "Setting up automated cost optimization schedule"
    
    # Create systemd timer for cost optimization
    cat > "/tmp/cost-optimization.service" << EOF
[Unit]
Description=TerraFusion Cost Optimization
After=network.target

[Service]
Type=oneshot
ExecStart=$COST_BASE_DIR/../scripts/cost-optimization.sh -a analyze -e all -t 30d -f html
User=root
EOF

    cat > "/tmp/cost-optimization.timer" << EOF
[Unit]
Description=Run TerraFusion Cost Optimization weekly
Requires=cost-optimization.service

[Timer]
OnCalendar=weekly
Persistent=true

[Install]
WantedBy=timers.target
EOF

    # Install systemd service and timer
    if command -v systemctl &> /dev/null; then
        sudo mv "/tmp/cost-optimization.service" "/etc/systemd/system/"
        sudo mv "/tmp/cost-optimization.timer" "/etc/systemd/system/"
        sudo systemctl daemon-reload
        sudo systemctl enable cost-optimization.timer
        sudo systemctl start cost-optimization.timer
        
        log_success "Cost optimization scheduled to run weekly"
    else
        # Fallback to cron if systemd is not available
        local cron_entry="0 2 * * 1 $COST_BASE_DIR/../scripts/cost-optimization.sh -a analyze -e all -t 30d -f html >> /var/log/terrafusion/cost-optimization.log 2>&1"
        
        (crontab -l 2>/dev/null; echo "$cron_entry") | crontab -
        log_success "Cost optimization scheduled via cron to run weekly"
    fi
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Cost Optimization System"
    log "Action: $ACTION"
    log "Environment: $ENVIRONMENT"
    log "Service: $SERVICE"
    log "Time Period: $TIME_PERIOD"
    log "========================================="
    
    # Load configuration
    load_cost_config
    
    case $ACTION in
        analyze)
            check_prerequisites
            analyze_cost_data
            generate_cost_report
            ;;
        optimize)
            check_prerequisites
            analyze_cost_data
            implement_optimizations
            generate_cost_report
            ;;
        report)
            check_prerequisites
            analyze_cost_data
            generate_cost_report
            ;;
        schedule)
            schedule_cost_optimization
            ;;
        rightsizing)
            check_prerequisites
            get_rightsizing_recommendations
            generate_cost_report
            ;;
        cleanup)
            check_prerequisites
            cleanup_old_snapshots
            if [ "$AUTO_APPLY" = "true" ]; then
                cleanup_unused_volumes
            fi
            ;;
        *)
            log_error "Invalid action: $ACTION"
            echo "Valid actions: analyze, optimize, report, schedule, rightsizing, cleanup"
            exit 1
            ;;
    esac
    
    log ""
    log "========================================="
    log "Cost Optimization Operation Complete"
    log "Action: $ACTION"
    log "Environment: $ENVIRONMENT"
    log "Total Potential Savings: \$$(echo "${!SAVINGS_OPPORTUNITIES[@]}" | xargs -n1 | while read key; do echo "${SAVINGS_OPPORTUNITIES[$key]:-0}"; done | awk '{sum += $1} END {print sum}')/month"
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Handle interrupts
trap 'log_error "Cost optimization interrupted!"; exit 1' INT TERM

# Run main function
main "$@"