#!/bin/bash
#
# TerraFusion Capacity Planning and Auto-Scaling Script
# Analyzes resource usage patterns and provides scaling recommendations
#
# Usage: ./capacity-planning.sh [options]
# Options:
#   -a    Analysis type (historical|predictive|realtime)
#   -p    Time period (1h|6h|24h|7d|30d)
#   -s    Service (all|backend|ai-engine|frontend|database)
#   -r    Generate HTML report
#   -A    Enable auto-scaling recommendations
#   -t    Threshold analysis (cpu|memory|disk|network)

set -euo pipefail

# Configuration
ANALYSIS_TYPE="historical"
TIME_PERIOD="24h"
SERVICE="all"
GENERATE_REPORT=false
AUTO_SCALING=false
THRESHOLD_TYPE="all"
REPORT_DIR="/var/reports/capacity-planning"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/terrafusion/capacity_planning_$TIMESTAMP.log"

# Capacity thresholds
CPU_HIGH_THRESHOLD=80
CPU_LOW_THRESHOLD=20
MEMORY_HIGH_THRESHOLD=85
MEMORY_LOW_THRESHOLD=30
DISK_HIGH_THRESHOLD=90
NETWORK_HIGH_THRESHOLD=80

# Auto-scaling parameters
MIN_INSTANCES=2
MAX_INSTANCES=10
SCALE_UP_THRESHOLD=75
SCALE_DOWN_THRESHOLD=30
COOLDOWN_PERIOD=300

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
while getopts "a:p:s:rtA" opt; do
    case $opt in
        a) ANALYSIS_TYPE="$OPTARG" ;;
        p) TIME_PERIOD="$OPTARG" ;;
        s) SERVICE="$OPTARG" ;;
        r) GENERATE_REPORT=true ;;
        t) THRESHOLD_TYPE="$OPTARG" ;;
        A) AUTO_SCALING=true ;;
        *) echo "Usage: $0 [-a type] [-p period] [-s service] [-r] [-t threshold] [-A]"; exit 1 ;;
    esac
done

# Data structures
declare -A METRICS
declare -A PREDICTIONS
declare -A SCALING_RECOMMENDATIONS
declare -A THRESHOLD_VIOLATIONS

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

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

# Convert time period to seconds
time_to_seconds() {
    local period=$1
    case $period in
        1h) echo 3600 ;;
        6h) echo 21600 ;;
        24h) echo 86400 ;;
        7d) echo 604800 ;;
        30d) echo 2592000 ;;
        *) echo 86400 ;;
    esac
}

# Get Prometheus metrics
get_prometheus_metrics() {
    local metric=$1
    local service=$2
    local time_range=$3
    
    if ! command -v curl &> /dev/null; then
        log_error "curl not available for Prometheus queries"
        return 1
    fi
    
    local query_url="http://localhost:9090/api/v1/query_range"
    local end_time=$(date +%s)
    local start_time=$((end_time - time_range))
    
    # Construct query based on service and metric
    local query=""
    case $metric in
        cpu)
            if [ "$service" = "all" ]; then
                query="100 - (avg by (instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)"
            else
                query="rate(container_cpu_usage_seconds_total{name=\"$service\"}[5m]) * 100"
            fi
            ;;
        memory)
            if [ "$service" = "all" ]; then
                query="(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100"
            else
                query="(container_memory_usage_bytes{name=\"$service\"} / container_spec_memory_limit_bytes{name=\"$service\"}) * 100"
            fi
            ;;
        disk)
            query="(1 - (node_filesystem_avail_bytes{mountpoint=\"/\"} / node_filesystem_size_bytes{mountpoint=\"/\"})) * 100"
            ;;
        network_in)
            query="rate(node_network_receive_bytes_total{device!=\"lo\"}[5m]) * 8"
            ;;
        network_out)
            query="rate(node_network_transmit_bytes_total{device!=\"lo\"}[5m]) * 8"
            ;;
    esac
    
    # Execute query
    local response=$(curl -s -G "$query_url" \
        --data-urlencode "query=$query" \
        --data-urlencode "start=$start_time" \
        --data-urlencode "end=$end_time" \
        --data-urlencode "step=300")
    
    echo "$response"
}

# Analyze historical metrics
analyze_historical_metrics() {
    log "Analyzing historical metrics for $SERVICE over $TIME_PERIOD..."
    
    local time_range=$(time_to_seconds "$TIME_PERIOD")
    local metrics_to_analyze=(cpu memory)
    
    if [ "$SERVICE" = "all" ]; then
        metrics_to_analyze+=(disk network_in network_out)
    fi
    
    for metric in "${metrics_to_analyze[@]}"; do
        log "Collecting $metric metrics..."
        
        local response=$(get_prometheus_metrics "$metric" "$SERVICE" "$time_range")
        
        if [ -n "$response" ]; then
            # Parse response and calculate statistics
            local values=$(echo "$response" | jq -r '.data.result[]?.values[]?[1]' 2>/dev/null | grep -v null || echo "")
            
            if [ -n "$values" ]; then
                local avg=$(echo "$values" | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
                local max=$(echo "$values" | sort -nr | head -1)
                local min=$(echo "$values" | sort -n | head -1)
                local p95=$(echo "$values" | sort -n | awk '{a[NR]=$1} END {print a[int(NR*0.95)]}')
                local p99=$(echo "$values" | sort -n | awk '{a[NR]=$1} END {print a[int(NR*0.99)]}')
                
                METRICS["${metric}_avg"]=$(printf "%.2f" "$avg")
                METRICS["${metric}_max"]=$(printf "%.2f" "$max")
                METRICS["${metric}_min"]=$(printf "%.2f" "$min")
                METRICS["${metric}_p95"]=$(printf "%.2f" "$p95")
                METRICS["${metric}_p99"]=$(printf "%.2f" "$p99")
                
                log_success "$metric analysis complete - Avg: ${METRICS[${metric}_avg]}%, Max: ${METRICS[${metric}_max]}%"
            else
                log_warning "No data available for $metric"
            fi
        fi
    done
}

# Predict future capacity needs
predict_capacity_needs() {
    log "Predicting future capacity needs using trend analysis..."
    
    # Simple linear regression for trend prediction
    for metric in cpu memory disk; do
        if [ -n "${METRICS[${metric}_avg]:-}" ]; then
            local current_avg=${METRICS[${metric}_avg]}
            local current_max=${METRICS[${metric}_max]}
            
            # Simple trend calculation (assuming 5% monthly growth)
            local growth_rate=0.05
            local periods_ahead=3  # 3 months
            
            local predicted_avg=$(echo "$current_avg * (1 + $growth_rate * $periods_ahead)" | bc -l)
            local predicted_max=$(echo "$current_max * (1 + $growth_rate * $periods_ahead)" | bc -l)
            
            PREDICTIONS["${metric}_avg_3m"]=$(printf "%.2f" "$predicted_avg")
            PREDICTIONS["${metric}_max_3m"]=$(printf "%.2f" "$predicted_max")
            
            log "Predicted $metric in 3 months - Avg: ${PREDICTIONS[${metric}_avg_3m]}%, Max: ${PREDICTIONS[${metric}_max_3m]}%"
        fi
    done
}

# Analyze threshold violations
analyze_threshold_violations() {
    log "Analyzing threshold violations..."
    
    for metric in cpu memory disk; do
        if [ -n "${METRICS[${metric}_max]:-}" ]; then
            local max_value=${METRICS[${metric}_max]}
            local avg_value=${METRICS[${metric}_avg]}
            
            case $metric in
                cpu)
                    if (( $(echo "$max_value > $CPU_HIGH_THRESHOLD" | bc -l) )); then
                        THRESHOLD_VIOLATIONS["cpu_high"]="CPU peaked at ${max_value}% (threshold: ${CPU_HIGH_THRESHOLD}%)"
                    fi
                    if (( $(echo "$avg_value < $CPU_LOW_THRESHOLD" | bc -l) )); then
                        THRESHOLD_VIOLATIONS["cpu_low"]="CPU averaged ${avg_value}% (threshold: ${CPU_LOW_THRESHOLD}%)"
                    fi
                    ;;
                memory)
                    if (( $(echo "$max_value > $MEMORY_HIGH_THRESHOLD" | bc -l) )); then
                        THRESHOLD_VIOLATIONS["memory_high"]="Memory peaked at ${max_value}% (threshold: ${MEMORY_HIGH_THRESHOLD}%)"
                    fi
                    if (( $(echo "$avg_value < $MEMORY_LOW_THRESHOLD" | bc -l) )); then
                        THRESHOLD_VIOLATIONS["memory_low"]="Memory averaged ${avg_value}% (threshold: ${MEMORY_LOW_THRESHOLD}%)"
                    fi
                    ;;
                disk)
                    if (( $(echo "$max_value > $DISK_HIGH_THRESHOLD" | bc -l) )); then
                        THRESHOLD_VIOLATIONS["disk_high"]="Disk usage peaked at ${max_value}% (threshold: ${DISK_HIGH_THRESHOLD}%)"
                    fi
                    ;;
            esac
        fi
    done
    
    log_success "Found ${#THRESHOLD_VIOLATIONS[@]} threshold violations"
}

# Generate scaling recommendations
generate_scaling_recommendations() {
    log "Generating auto-scaling recommendations..."
    
    # CPU-based scaling recommendations
    if [ -n "${METRICS[cpu_avg]:-}" ]; then
        local cpu_avg=${METRICS[cpu_avg]}
        local cpu_max=${METRICS[cpu_max]}
        
        if (( $(echo "$cpu_max > $SCALE_UP_THRESHOLD" | bc -l) )); then
            local recommended_instances=$(echo "scale=0; ($cpu_avg / $SCALE_UP_THRESHOLD) * 2 + 1" | bc)
            if [ "$recommended_instances" -gt "$MAX_INSTANCES" ]; then
                recommended_instances=$MAX_INSTANCES
            fi
            SCALING_RECOMMENDATIONS["scale_up"]="Scale up to $recommended_instances instances (CPU: ${cpu_max}%)"
        elif (( $(echo "$cpu_avg < $SCALE_DOWN_THRESHOLD" | bc -l) )); then
            local recommended_instances=$(echo "scale=0; ($cpu_avg / $SCALE_DOWN_THRESHOLD) * 1" | bc)
            if [ "$recommended_instances" -lt "$MIN_INSTANCES" ]; then
                recommended_instances=$MIN_INSTANCES
            fi
            SCALING_RECOMMENDATIONS["scale_down"]="Scale down to $recommended_instances instances (CPU: ${cpu_avg}%)"
        fi
    fi
    
    # Memory-based scaling recommendations
    if [ -n "${METRICS[memory_avg]:-}" ]; then
        local memory_avg=${METRICS[memory_avg]}
        local memory_max=${METRICS[memory_max]}
        
        if (( $(echo "$memory_max > $MEMORY_HIGH_THRESHOLD" | bc -l) )); then
            SCALING_RECOMMENDATIONS["memory_upgrade"]="Consider increasing memory allocation (current max: ${memory_max}%)"
        fi
    fi
    
    # Storage scaling recommendations
    if [ -n "${METRICS[disk_avg]:-}" ]; then
        local disk_avg=${METRICS[disk_avg]}
        
        if (( $(echo "$disk_avg > $DISK_HIGH_THRESHOLD" | bc -l) )); then
            SCALING_RECOMMENDATIONS["storage_upgrade"]="Immediate storage expansion needed (current: ${disk_avg}%)"
        elif (( $(echo "$disk_avg > 70" | bc -l) )); then
            SCALING_RECOMMENDATIONS["storage_warning"]="Plan storage expansion soon (current: ${disk_avg}%)"
        fi
    fi
    
    log_success "Generated ${#SCALING_RECOMMENDATIONS[@]} scaling recommendations"
}

# Real-time capacity monitoring
monitor_realtime_capacity() {
    log "Starting real-time capacity monitoring..."
    
    local duration=300  # 5 minutes
    local interval=30   # 30 seconds
    local iterations=$((duration / interval))
    
    for ((i=1; i<=iterations; i++)); do
        log "Real-time check $i/$iterations..."
        
        # Get current metrics
        if command -v docker &> /dev/null; then
            # Docker container stats
            local container_stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || echo "")
            
            if [ -n "$container_stats" ]; then
                echo "$container_stats" | tail -n +2 | while IFS=$'\t' read -r container cpu mem_usage mem_perc; do
                    cpu_val=$(echo "$cpu" | sed 's/%//')
                    mem_val=$(echo "$mem_perc" | sed 's/%//')
                    
                    if (( $(echo "$cpu_val > $CPU_HIGH_THRESHOLD" | bc -l) )); then
                        log_warning "Container $container CPU high: $cpu"
                    fi
                    
                    if (( $(echo "$mem_val > $MEMORY_HIGH_THRESHOLD" | bc -l) )); then
                        log_warning "Container $container Memory high: $mem_perc"
                    fi
                done
            fi
        fi
        
        # System resource check
        if command -v free &> /dev/null; then
            local mem_usage=$(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}')
            if (( $(echo "$mem_usage > $MEMORY_HIGH_THRESHOLD" | bc -l) )); then
                log_warning "System memory usage high: ${mem_usage}%"
            fi
        fi
        
        if command -v df &> /dev/null; then
            local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
            if (( $(echo "$disk_usage > $DISK_HIGH_THRESHOLD" | bc -l) )); then
                log_warning "System disk usage high: ${disk_usage}%"
            fi
        fi
        
        sleep $interval
    done
    
    log_success "Real-time monitoring completed"
}

# Apply auto-scaling recommendations
apply_auto_scaling() {
    log "Applying auto-scaling recommendations..."
    
    if [ ${#SCALING_RECOMMENDATIONS[@]} -eq 0 ]; then
        log "No scaling recommendations to apply"
        return 0
    fi
    
    for rec_key in "${!SCALING_RECOMMENDATIONS[@]}"; do
        local recommendation="${SCALING_RECOMMENDATIONS[$rec_key]}"
        log "Processing: $recommendation"
        
        case $rec_key in
            scale_up)
                # Extract recommended instance count
                local instances=$(echo "$recommendation" | grep -oE '[0-9]+' | head -1)
                log "Would scale up to $instances instances (dry-run mode)"
                # In production, this would trigger actual scaling:
                # aws ecs update-service --desired-count $instances ...
                ;;
            scale_down)
                local instances=$(echo "$recommendation" | grep -oE '[0-9]+' | head -1)
                log "Would scale down to $instances instances (dry-run mode)"
                ;;
            *)
                log "Recommendation noted: $recommendation"
                ;;
        esac
    done
}

# Generate capacity planning report
generate_capacity_report() {
    local report_file="$REPORT_DIR/capacity_planning_report_$TIMESTAMP.html"
    
    log "Generating capacity planning report..."
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Capacity Planning Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 2.5em; }
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
        .metric-row.warning { background-color: #fff3cd; }
        .metric-row.danger { background-color: #f8d7da; }
        .recommendation { background: #e3f2fd; border: 1px solid #2196f3; border-radius: 4px; padding: 15px; margin: 10px 0; }
        .recommendation.critical { background: #ffebee; border-color: #f44336; }
        .chart-placeholder { height: 300px; background: #e9ecef; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #6c757d; margin: 20px 0; }
        .prediction-highlight { background: linear-gradient(45deg, #ff9800, #ffb74d); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Capacity Planning Report</h1>
            <p>TerraFusion Infrastructure Analysis</p>
            <p>Generated: $(date) | Service: $SERVICE | Period: $TIME_PERIOD</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <div class="card-value">${METRICS[cpu_avg]:-0}%</div>
                <div class="card-label">Average CPU Usage</div>
            </div>
            <div class="summary-card $([ "${METRICS[cpu_max]:-0}" -gt "$CPU_HIGH_THRESHOLD" ] && echo "danger" || echo "")">
                <div class="card-value">${METRICS[cpu_max]:-0}%</div>
                <div class="card-label">Peak CPU Usage</div>
            </div>
            <div class="summary-card $([ "${METRICS[memory_max]:-0}" -gt "$MEMORY_HIGH_THRESHOLD" ] && echo "danger" || echo "")">
                <div class="card-value">${METRICS[memory_avg]:-0}%</div>
                <div class="card-label">Average Memory Usage</div>
            </div>
            <div class="summary-card">
                <div class="card-value">${#SCALING_RECOMMENDATIONS[@]}</div>
                <div class="card-label">Scaling Recommendations</div>
            </div>
        </div>
        
        <div class="section">
            <h2>📈 Resource Utilization Analysis</h2>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Average</th>
                        <th>Peak</th>
                        <th>95th Percentile</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
EOF
    
    # Add metrics rows
    for metric in cpu memory disk; do
        local status="normal"
        local row_class=""
        
        if [ -n "${METRICS[${metric}_max]:-}" ]; then
            case $metric in
                cpu)
                    if (( $(echo "${METRICS[${metric}_max]} > $CPU_HIGH_THRESHOLD" | bc -l) )); then
                        status="high"
                        row_class="danger"
                    fi
                    ;;
                memory)
                    if (( $(echo "${METRICS[${metric}_max]} > $MEMORY_HIGH_THRESHOLD" | bc -l) )); then
                        status="high"
                        row_class="danger"
                    fi
                    ;;
                disk)
                    if (( $(echo "${METRICS[${metric}_max]} > $DISK_HIGH_THRESHOLD" | bc -l) )); then
                        status="critical"
                        row_class="danger"
                    fi
                    ;;
            esac
            
            cat >> "$report_file" << EOF
                    <tr class="metric-row $row_class">
                        <td>$(echo "$metric" | tr '[:lower:]' '[:upper:]')</td>
                        <td>${METRICS[${metric}_avg]:-0}%</td>
                        <td>${METRICS[${metric}_max]:-0}%</td>
                        <td>${METRICS[${metric}_p95]:-0}%</td>
                        <td>$status</td>
                    </tr>
EOF
        fi
    done
    
    cat >> "$report_file" << EOF
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>🔮 Capacity Predictions</h2>
            <div class="prediction-highlight">
                <h3 style="margin: 0;">3-Month Capacity Forecast</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 15px;">
                    <div>
                        <h4 style="margin: 5px 0;">CPU</h4>
                        <p style="margin: 0; font-size: 1.2em;">${PREDICTIONS[cpu_avg_3m]:-N/A}% avg</p>
                    </div>
                    <div>
                        <h4 style="margin: 5px 0;">Memory</h4>
                        <p style="margin: 0; font-size: 1.2em;">${PREDICTIONS[memory_avg_3m]:-N/A}% avg</p>
                    </div>
                    <div>
                        <h4 style="margin: 5px 0;">Storage</h4>
                        <p style="margin: 0; font-size: 1.2em;">${PREDICTIONS[disk_avg_3m]:-N/A}% used</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>⚡ Auto-Scaling Recommendations</h2>
EOF
    
    # Add scaling recommendations
    if [ ${#SCALING_RECOMMENDATIONS[@]} -gt 0 ]; then
        for rec_key in "${!SCALING_RECOMMENDATIONS[@]}"; do
            local rec_class="recommendation"
            if [[ "$rec_key" == *"upgrade"* ]] || [[ "$rec_key" == *"critical"* ]]; then
                rec_class="recommendation critical"
            fi
            
            cat >> "$report_file" << EOF
            <div class="$rec_class">
                <strong>$(echo "$rec_key" | tr '_' ' ' | sed 's/\b\w/\U&/g'):</strong>
                ${SCALING_RECOMMENDATIONS[$rec_key]}
            </div>
EOF
        done
    else
        cat >> "$report_file" << EOF
            <div class="recommendation">
                <strong>No immediate scaling needed.</strong>
                Current resource utilization is within acceptable ranges.
            </div>
EOF
    fi
    
    cat >> "$report_file" << EOF
        </div>
        
        <div class="section">
            <h2>🚨 Threshold Violations</h2>
EOF
    
    # Add threshold violations
    if [ ${#THRESHOLD_VIOLATIONS[@]} -gt 0 ]; then
        for violation_key in "${!THRESHOLD_VIOLATIONS[@]}"; do
            cat >> "$report_file" << EOF
            <div class="recommendation critical">
                <strong>$(echo "$violation_key" | tr '_' ' ' | sed 's/\b\w/\U&/g'):</strong>
                ${THRESHOLD_VIOLATIONS[$violation_key]}
            </div>
EOF
        done
    else
        cat >> "$report_file" << EOF
            <div class="recommendation">
                <strong>No threshold violations detected.</strong>
                All metrics are within configured thresholds.
            </div>
EOF
    fi
    
    cat >> "$report_file" << EOF
        </div>
        
        <div class="section">
            <h2>📋 Next Actions</h2>
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
                <h3 style="margin-top: 0;">Immediate (1-7 days)</h3>
                <ul>
                    $([ ${#THRESHOLD_VIOLATIONS[@]} -gt 0 ] && echo "<li>Address critical threshold violations immediately</li>")
                    $([ ${#SCALING_RECOMMENDATIONS[@]} -gt 0 ] && echo "<li>Review and implement scaling recommendations</li>")
                    <li>Monitor real-time capacity metrics for trends</li>
                </ul>
                
                <h3>Short-term (1-4 weeks)</h3>
                <ul>
                    <li>Implement automated scaling policies based on recommendations</li>
                    <li>Set up proactive alerting for capacity thresholds</li>
                    <li>Plan resource procurement based on predictions</li>
                </ul>
                
                <h3>Long-term (1-3 months)</h3>
                <ul>
                    <li>Regular capacity planning reviews and updates</li>
                    <li>Implement predictive scaling based on business patterns</li>
                    <li>Optimize resource allocation and cost efficiency</li>
                </ul>
            </div>
        </div>
        
        <div class="section">
            <h2>📊 Report Metadata</h2>
            <table>
                <tr><th>Analysis Type</th><td>$ANALYSIS_TYPE</td></tr>
                <tr><th>Time Period</th><td>$TIME_PERIOD</td></tr>
                <tr><th>Service</th><td>$SERVICE</td></tr>
                <tr><th>Auto-scaling</th><td>$([ "$AUTO_SCALING" = true ] && echo "Enabled" || echo "Disabled")</td></tr>
                <tr><th>Generated</th><td>$(date)</td></tr>
                <tr><th>Log File</th><td>$LOG_FILE</td></tr>
            </table>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p><strong>💡 Pro Tip:</strong> Run capacity planning analysis weekly and before major releases to ensure optimal resource allocation.</p>
            <p><small>For questions about this report, contact the DevOps team at devops@terrafusion.com</small></p>
        </div>
    </div>
</body>
</html>
EOF
    
    log_success "Capacity planning report generated: $report_file"
    echo "$report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Capacity Planning Analysis"
    log "Type: $ANALYSIS_TYPE"
    log "Period: $TIME_PERIOD"
    log "Service: $SERVICE"
    log "Auto-scaling: $AUTO_SCALING"
    log "========================================="
    
    case $ANALYSIS_TYPE in
        historical)
            analyze_historical_metrics
            predict_capacity_needs
            analyze_threshold_violations
            generate_scaling_recommendations
            ;;
        predictive)
            analyze_historical_metrics
            predict_capacity_needs
            generate_scaling_recommendations
            ;;
        realtime)
            monitor_realtime_capacity
            ;;
        *)
            log_error "Invalid analysis type: $ANALYSIS_TYPE"
            exit 1
            ;;
    esac
    
    # Apply auto-scaling if enabled
    if [ "$AUTO_SCALING" = true ]; then
        apply_auto_scaling
    fi
    
    # Generate report
    if [ "$GENERATE_REPORT" = true ]; then
        generate_capacity_report
    fi
    
    # Summary
    log ""
    log "========================================="
    log "Capacity Planning Analysis Complete"
    log "========================================="
    log "Metrics analyzed: $(echo "${!METRICS[@]}" | wc -w)"
    log "Threshold violations: ${#THRESHOLD_VIOLATIONS[@]}"
    log "Scaling recommendations: ${#SCALING_RECOMMENDATIONS[@]}"
    
    if [ ${#THRESHOLD_VIOLATIONS[@]} -gt 0 ]; then
        log_warning "Threshold violations detected - immediate attention required"
        for violation in "${!THRESHOLD_VIOLATIONS[@]}"; do
            log "  - ${THRESHOLD_VIOLATIONS[$violation]}"
        done
    fi
    
    if [ ${#SCALING_RECOMMENDATIONS[@]} -gt 0 ]; then
        log "Scaling recommendations:"
        for rec in "${!SCALING_RECOMMENDATIONS[@]}"; do
            log "  - ${SCALING_RECOMMENDATIONS[$rec]}"
        done
    fi
    
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Handle interrupts
trap 'log_error "Capacity planning analysis interrupted!"; exit 1' INT TERM

# Run main function
main