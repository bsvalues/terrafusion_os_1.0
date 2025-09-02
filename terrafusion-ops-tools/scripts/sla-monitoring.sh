#!/bin/bash
#
# TerraFusion SLA Monitoring and Compliance Reporting Script
# Monitors service level agreements and generates compliance reports
#
# Usage: ./sla-monitoring.sh [options]
# Options:
#   -s    Service (all|api|frontend|database|ai-engine)
#   -p    Period (1h|24h|7d|30d)
#   -r    Generate detailed report
#   -t    SLA type (availability|performance|reliability)
#   -c    Compliance check only
#   -a    Alert on SLA violations

set -euo pipefail

# Configuration
SERVICE="all"
PERIOD="24h"
GENERATE_REPORT=false
SLA_TYPE="all"
COMPLIANCE_CHECK=false
ALERT_ON_VIOLATIONS=false
REPORT_DIR="/var/reports/sla-monitoring"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/terrafusion/sla_monitoring_$TIMESTAMP.log"

# SLA Targets
AVAILABILITY_TARGET=99.9  # 99.9% uptime
RESPONSE_TIME_TARGET=500  # 500ms average response time
ERROR_RATE_TARGET=1.0     # Less than 1% error rate
DATABASE_LATENCY_TARGET=100  # 100ms database response time
AI_PROCESSING_TARGET=5000    # 5 seconds for AI predictions

# Alert thresholds (percentage of SLA target)
AVAILABILITY_WARNING=99.5
RESPONSE_TIME_WARNING=750
ERROR_RATE_WARNING=0.5

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
while getopts "s:p:rt:ca" opt; do
    case $opt in
        s) SERVICE="$OPTARG" ;;
        p) PERIOD="$OPTARG" ;;
        r) GENERATE_REPORT=true ;;
        t) SLA_TYPE="$OPTARG" ;;
        c) COMPLIANCE_CHECK=true ;;
        a) ALERT_ON_VIOLATIONS=true ;;
        *) echo "Usage: $0 [-s service] [-p period] [-r] [-t type] [-c] [-a]"; exit 1 ;;
    esac
done

# Data structures
declare -A SLA_METRICS
declare -A SLA_VIOLATIONS
declare -A COMPLIANCE_STATUS
declare -A HISTORICAL_TRENDS

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

# Convert time period to Prometheus query format
get_time_range() {
    case $PERIOD in
        1h) echo "1h" ;;
        24h) echo "24h" ;;
        7d) echo "7d" ;;
        30d) echo "30d" ;;
        *) echo "24h" ;;
    esac
}

# Query Prometheus for metrics
query_prometheus() {
    local query=$1
    local time_range=$2
    
    if ! command -v curl &> /dev/null; then
        log_error "curl not available for Prometheus queries"
        return 1
    fi
    
    local prometheus_url="http://localhost:9090/api/v1/query"
    local response=$(curl -s -G "$prometheus_url" \
        --data-urlencode "query=$query" \
        --data-urlencode "time=$(date +%s)" 2>/dev/null)
    
    echo "$response" | jq -r '.data.result[0].value[1]' 2>/dev/null || echo "0"
}

# Calculate availability SLA
calculate_availability() {
    local service=$1
    local time_range=$(get_time_range)
    
    log "Calculating availability for $service over $time_range..."
    
    # Query for uptime percentage
    local uptime_query
    case $service in
        api|backend)
            uptime_query="avg_over_time(up{job=\"terrafusion-api\"}[$time_range]) * 100"
            ;;
        frontend)
            uptime_query="avg_over_time(up{job=\"terrafusion-frontend\"}[$time_range]) * 100"
            ;;
        database)
            uptime_query="avg_over_time(up{job=\"postgres-exporter\"}[$time_range]) * 100"
            ;;
        ai-engine)
            uptime_query="avg_over_time(up{job=\"terrafusion-ai\"}[$time_range]) * 100"
            ;;
        all)
            uptime_query="avg(avg_over_time(up[$time_range])) * 100"
            ;;
    esac
    
    local availability=$(query_prometheus "$uptime_query" "$time_range")
    SLA_METRICS["${service}_availability"]=$(printf "%.3f" "$availability")
    
    # Check SLA compliance
    if (( $(echo "$availability < $AVAILABILITY_TARGET" | bc -l) )); then
        SLA_VIOLATIONS["${service}_availability"]="Availability ${availability}% below target ${AVAILABILITY_TARGET}%"
        COMPLIANCE_STATUS["${service}_availability"]="VIOLATION"
    elif (( $(echo "$availability < $AVAILABILITY_WARNING" | bc -l) )); then
        SLA_VIOLATIONS["${service}_availability_warning"]="Availability ${availability}% approaching target threshold"
        COMPLIANCE_STATUS["${service}_availability"]="WARNING"
    else
        COMPLIANCE_STATUS["${service}_availability"]="COMPLIANT"
    fi
    
    log_success "$service availability: ${availability}% (target: ${AVAILABILITY_TARGET}%)"
}

# Calculate response time SLA
calculate_response_time() {
    local service=$1
    local time_range=$(get_time_range)
    
    log "Calculating response times for $service over $time_range..."
    
    # Query for average response time
    local response_time_query
    case $service in
        api|backend)
            response_time_query="avg_over_time(http_request_duration_seconds_bucket{job=\"terrafusion-api\"}[$time_range]) * 1000"
            ;;
        frontend)
            response_time_query="avg_over_time(http_request_duration_seconds_bucket{job=\"terrafusion-frontend\"}[$time_range]) * 1000"
            ;;
        database)
            response_time_query="avg_over_time(postgres_stat_database_blks_hit_per_sec[$time_range])"
            ;;
        ai-engine)
            response_time_query="avg_over_time(ai_prediction_duration_seconds[$time_range]) * 1000"
            ;;
        all)
            response_time_query="avg(avg_over_time(http_request_duration_seconds_bucket[$time_range])) * 1000"
            ;;
    esac
    
    local response_time=$(query_prometheus "$response_time_query" "$time_range")
    SLA_METRICS["${service}_response_time"]=$(printf "%.2f" "$response_time")
    
    # Check SLA compliance
    local target=$RESPONSE_TIME_TARGET
    if [ "$service" = "ai-engine" ]; then
        target=$AI_PROCESSING_TARGET
    elif [ "$service" = "database" ]; then
        target=$DATABASE_LATENCY_TARGET
    fi
    
    if (( $(echo "$response_time > $target" | bc -l) )); then
        SLA_VIOLATIONS["${service}_response_time"]="Response time ${response_time}ms above target ${target}ms"
        COMPLIANCE_STATUS["${service}_response_time"]="VIOLATION"
    elif (( $(echo "$response_time > $RESPONSE_TIME_WARNING" | bc -l) )); then
        SLA_VIOLATIONS["${service}_response_time_warning"]="Response time ${response_time}ms approaching target threshold"
        COMPLIANCE_STATUS["${service}_response_time"]="WARNING"
    else
        COMPLIANCE_STATUS["${service}_response_time"]="COMPLIANT"
    fi
    
    log_success "$service response time: ${response_time}ms (target: ${target}ms)"
}

# Calculate error rate SLA
calculate_error_rate() {
    local service=$1
    local time_range=$(get_time_range)
    
    log "Calculating error rates for $service over $time_range..."
    
    # Query for error rate percentage
    local error_rate_query
    case $service in
        api|backend)
            error_rate_query="rate(http_requests_total{job=\"terrafusion-api\",status=~\"5..\"}[$time_range]) / rate(http_requests_total{job=\"terrafusion-api\"}[$time_range]) * 100"
            ;;
        frontend)
            error_rate_query="rate(http_requests_total{job=\"terrafusion-frontend\",status=~\"5..\"}[$time_range]) / rate(http_requests_total{job=\"terrafusion-frontend\"}[$time_range]) * 100"
            ;;
        database)
            error_rate_query="rate(postgres_stat_database_deadlocks[$time_range]) * 100"
            ;;
        ai-engine)
            error_rate_query="rate(ai_prediction_errors_total[$time_range]) / rate(ai_predictions_total[$time_range]) * 100"
            ;;
        all)
            error_rate_query="sum(rate(http_requests_total{status=~\"5..\"}[$time_range])) / sum(rate(http_requests_total[$time_range])) * 100"
            ;;
    esac
    
    local error_rate=$(query_prometheus "$error_rate_query" "$time_range")
    SLA_METRICS["${service}_error_rate"]=$(printf "%.3f" "$error_rate")
    
    # Check SLA compliance
    if (( $(echo "$error_rate > $ERROR_RATE_TARGET" | bc -l) )); then
        SLA_VIOLATIONS["${service}_error_rate"]="Error rate ${error_rate}% above target ${ERROR_RATE_TARGET}%"
        COMPLIANCE_STATUS["${service}_error_rate"]="VIOLATION"
    elif (( $(echo "$error_rate > $ERROR_RATE_WARNING" | bc -l) )); then
        SLA_VIOLATIONS["${service}_error_rate_warning"]="Error rate ${error_rate}% approaching target threshold"
        COMPLIANCE_STATUS["${service}_error_rate"]="WARNING"
    else
        COMPLIANCE_STATUS["${service}_error_rate"]="COMPLIANT"
    fi
    
    log_success "$service error rate: ${error_rate}% (target: <${ERROR_RATE_TARGET}%)"
}

# Calculate SLA credits/penalties
calculate_sla_credits() {
    local service=$1
    local availability=${SLA_METRICS["${service}_availability"]:-100}
    
    # SLA credit calculation based on availability
    local credits=0
    if (( $(echo "$availability < 99.0" | bc -l) )); then
        credits=100  # 100% credit for <99% availability
    elif (( $(echo "$availability < 99.5" | bc -l) )); then
        credits=25   # 25% credit for <99.5% availability
    elif (( $(echo "$availability < 99.9" | bc -l) )); then
        credits=10   # 10% credit for <99.9% availability
    fi
    
    SLA_METRICS["${service}_credits"]=$credits
    log "SLA credits for $service: ${credits}%"
}

# Generate historical trend analysis
analyze_historical_trends() {
    log "Analyzing historical SLA trends..."
    
    local periods=("7d" "30d")
    for period in "${periods[@]}"; do
        for service in api database ai-engine; do
            # Get historical availability
            local hist_query="avg_over_time(up{job=\"terrafusion-$service\"}[$period]) * 100"
            local hist_availability=$(query_prometheus "$hist_query" "$period")
            
            HISTORICAL_TRENDS["${service}_${period}_availability"]=$(printf "%.2f" "$hist_availability")
        done
    done
    
    log_success "Historical trend analysis completed"
}

# Send SLA violation alerts
send_sla_alerts() {
    log "Checking for SLA violations requiring alerts..."
    
    if [ ${#SLA_VIOLATIONS[@]} -eq 0 ]; then
        log "No SLA violations detected"
        return 0
    fi
    
    for violation_key in "${!SLA_VIOLATIONS[@]}"; do
        local violation="${SLA_VIOLATIONS[$violation_key]}"
        
        # Skip warnings if not critical
        if [[ "$violation_key" == *"warning"* ]]; then
            continue
        fi
        
        log_warning "SLA VIOLATION: $violation"
        
        # Send Slack notification (if webhook configured)
        if [ -n "${SLACK_WEBHOOK:-}" ]; then
            local message="🚨 SLA Violation: $violation"
            curl -X POST -H 'Content-type: application/json' \
                --data "{\"text\":\"$message\"}" \
                "$SLACK_WEBHOOK" 2>/dev/null || true
        fi
        
        # Send email alert (if configured)
        if command -v mail &> /dev/null && [ -n "${ALERT_EMAIL:-}" ]; then
            echo "SLA Violation detected: $violation" | \
                mail -s "TerraFusion SLA Violation Alert" "$ALERT_EMAIL" || true
        fi
    done
    
    log_success "SLA violation alerts processed"
}

# Generate comprehensive SLA report
generate_sla_report() {
    local report_file="$REPORT_DIR/sla_monitoring_report_$TIMESTAMP.html"
    
    log "Generating comprehensive SLA monitoring report..."
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion SLA Monitoring Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .sla-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .sla-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; }
        .sla-card.warning { border-left-color: #ffc107; background-color: #fff8e1; }
        .sla-card.violation { border-left-color: #dc3545; background-color: #ffebee; }
        .sla-value { font-size: 2.2em; font-weight: bold; margin-bottom: 5px; }
        .sla-value.compliant { color: #28a745; }
        .sla-value.warning { color: #ffc107; }
        .sla-value.violation { color: #dc3545; }
        .sla-label { color: #6c757d; font-size: 0.9em; margin-bottom: 10px; }
        .sla-target { font-size: 0.8em; color: #6c757d; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .status-compliant { color: #28a745; font-weight: bold; }
        .status-warning { color: #ffc107; font-weight: bold; }
        .status-violation { color: #dc3545; font-weight: bold; }
        .violation-alert { background: #ffebee; border: 1px solid #f44336; border-radius: 4px; padding: 15px; margin: 10px 0; }
        .trend-chart { height: 200px; background: #e9ecef; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #6c757d; margin: 20px 0; }
        .credits-highlight { background: linear-gradient(45deg, #ff5722, #ff7043); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 SLA Monitoring Report</h1>
            <p>Service Level Agreement Compliance Dashboard</p>
            <p>Generated: $(date) | Service: $SERVICE | Period: $PERIOD</p>
        </div>
        
        <div class="sla-summary">
EOF
    
    # Add SLA summary cards
    local services=("api" "database" "ai-engine")
    if [ "$SERVICE" != "all" ]; then
        services=("$SERVICE")
    fi
    
    for service in "${services[@]}"; do
        local availability=${SLA_METRICS["${service}_availability"]:-0}
        local response_time=${SLA_METRICS["${service}_response_time"]:-0}
        local error_rate=${SLA_METRICS["${service}_error_rate"]:-0}
        local credits=${SLA_METRICS["${service}_credits"]:-0}
        
        # Determine overall status
        local status="compliant"
        local card_class="sla-card"
        
        if [ "${COMPLIANCE_STATUS["${service}_availability"]:-}" = "VIOLATION" ] || 
           [ "${COMPLIANCE_STATUS["${service}_response_time"]:-}" = "VIOLATION" ] || 
           [ "${COMPLIANCE_STATUS["${service}_error_rate"]:-}" = "VIOLATION" ]; then
            status="violation"
            card_class="sla-card violation"
        elif [ "${COMPLIANCE_STATUS["${service}_availability"]:-}" = "WARNING" ] || 
             [ "${COMPLIANCE_STATUS["${service}_response_time"]:-}" = "WARNING" ] || 
             [ "${COMPLIANCE_STATUS["${service}_error_rate"]:-}" = "WARNING" ]; then
            status="warning"
            card_class="sla-card warning"
        fi
        
        cat >> "$report_file" << EOF
            <div class="$card_class">
                <div class="sla-label">$(echo "$service" | tr '[:lower:]' '[:upper:]') Service</div>
                <div class="sla-value $status">${availability}%</div>
                <div class="sla-target">Target: ${AVAILABILITY_TARGET}% availability</div>
                <div style="margin-top: 10px; font-size: 0.9em;">
                    <div>Response: ${response_time}ms</div>
                    <div>Errors: ${error_rate}%</div>
                    $([ "$credits" -gt 0 ] && echo "<div style='color: #ff5722; font-weight: bold;'>Credits: ${credits}%</div>")
                </div>
            </div>
EOF
    done
    
    cat >> "$report_file" << EOF
        </div>
        
        <div class="section">
            <h2>📈 Detailed SLA Metrics</h2>
            <table>
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Availability</th>
                        <th>Response Time</th>
                        <th>Error Rate</th>
                        <th>Overall Status</th>
                        <th>SLA Credits</th>
                    </tr>
                </thead>
                <tbody>
EOF
    
    # Add detailed metrics rows
    for service in "${services[@]}"; do
        local availability=${SLA_METRICS["${service}_availability"]:-0}
        local response_time=${SLA_METRICS["${service}_response_time"]:-0}
        local error_rate=${SLA_METRICS["${service}_error_rate"]:-0}
        local credits=${SLA_METRICS["${service}_credits"]:-0}
        
        # Determine overall status
        local overall_status="COMPLIANT"
        local status_class="status-compliant"
        
        if [ "${COMPLIANCE_STATUS["${service}_availability"]:-}" = "VIOLATION" ] || 
           [ "${COMPLIANCE_STATUS["${service}_response_time"]:-}" = "VIOLATION" ] || 
           [ "${COMPLIANCE_STATUS["${service}_error_rate"]:-}" = "VIOLATION" ]; then
            overall_status="VIOLATION"
            status_class="status-violation"
        elif [ "${COMPLIANCE_STATUS["${service}_availability"]:-}" = "WARNING" ] || 
             [ "${COMPLIANCE_STATUS["${service}_response_time"]:-}" = "WARNING" ] || 
             [ "${COMPLIANCE_STATUS["${service}_error_rate"]:-}" = "WARNING" ]; then
            overall_status="WARNING"
            status_class="status-warning"
        fi
        
        cat >> "$report_file" << EOF
                    <tr>
                        <td>$(echo "$service" | tr '[:lower:]' '[:upper:]')</td>
                        <td>${availability}% (${AVAILABILITY_TARGET}%)</td>
                        <td>${response_time}ms ($([ "$service" = "ai-engine" ] && echo "$AI_PROCESSING_TARGET" || echo "$RESPONSE_TIME_TARGET")ms)</td>
                        <td>${error_rate}% (<${ERROR_RATE_TARGET}%)</td>
                        <td class="$status_class">$overall_status</td>
                        <td>$([ "$credits" -gt 0 ] && echo "${credits}%" || echo "0%")</td>
                    </tr>
EOF
    done
    
    cat >> "$report_file" << EOF
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>🚨 SLA Violations & Alerts</h2>
EOF
    
    # Add violations
    if [ ${#SLA_VIOLATIONS[@]} -gt 0 ]; then
        for violation_key in "${!SLA_VIOLATIONS[@]}"; do
            cat >> "$report_file" << EOF
            <div class="violation-alert">
                <strong>$(echo "$violation_key" | tr '_' ' ' | sed 's/\b\w/\U&/g'):</strong>
                ${SLA_VIOLATIONS[$violation_key]}
            </div>
EOF
        done
    else
        cat >> "$report_file" << EOF
            <div style="background: #e8f5e8; border: 1px solid #28a745; border-radius: 4px; padding: 15px; margin: 10px 0;">
                <strong>✅ No SLA violations detected.</strong>
                All services are meeting their SLA targets.
            </div>
EOF
    fi
    
    cat >> "$report_file" << EOF
        </div>
        
        <div class="section">
            <h2>📊 Historical Trends</h2>
            <table>
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>7-Day Trend</th>
                        <th>30-Day Trend</th>
                        <th>Trend Analysis</th>
                    </tr>
                </thead>
                <tbody>
EOF
    
    # Add historical trends
    for service in "${services[@]}"; do
        local trend_7d=${HISTORICAL_TRENDS["${service}_7d_availability"]:-0}
        local trend_30d=${HISTORICAL_TRENDS["${service}_30d_availability"]:-0}
        local current=${SLA_METRICS["${service}_availability"]:-0}
        
        # Simple trend analysis
        local trend_analysis="Stable"
        if (( $(echo "$current > $trend_7d + 0.1" | bc -l) )); then
            trend_analysis="Improving"
        elif (( $(echo "$current < $trend_7d - 0.1" | bc -l) )); then
            trend_analysis="Declining"
        fi
        
        cat >> "$report_file" << EOF
                    <tr>
                        <td>$(echo "$service" | tr '[:lower:]' '[:upper:]')</td>
                        <td>${trend_7d}%</td>
                        <td>${trend_30d}%</td>
                        <td>$trend_analysis</td>
                    </tr>
EOF
    done
    
    cat >> "$report_file" << EOF
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>💰 SLA Credits Summary</h2>
            <div class="credits-highlight">
                <h3 style="margin: 0;">Total SLA Credits This Period</h3>
                <h1 style="margin: 10px 0;">$(echo "${SLA_METRICS[@]}" | grep -o '[0-9]*credits' | cut -d'c' -f1 | awk '{sum += $1} END {print sum+0}')%</h1>
                <p style="margin: 0;">Based on availability SLA violations</p>
            </div>
        </div>
        
        <div class="section">
            <h2>📋 Recommendations</h2>
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
                <h3 style="margin-top: 0;">Immediate Actions</h3>
                <ul>
                    $([ ${#SLA_VIOLATIONS[@]} -gt 0 ] && echo "<li>Address all SLA violations immediately to prevent customer impact</li>")
                    <li>Review alerting thresholds and ensure proper escalation procedures</li>
                    <li>Implement automated remediation for common SLA violations</li>
                </ul>
                
                <h3>Process Improvements</h3>
                <ul>
                    <li>Establish regular SLA review meetings with stakeholders</li>
                    <li>Implement predictive alerting to prevent SLA violations</li>
                    <li>Create runbooks for rapid incident response</li>
                    <li>Consider implementing chaos engineering for resilience testing</li>
                </ul>
            </div>
        </div>
        
        <div class="section">
            <h2>📊 Report Metadata</h2>
            <table>
                <tr><th>Monitoring Period</th><td>$PERIOD</td></tr>
                <tr><th>Services Monitored</th><td>$SERVICE</td></tr>
                <tr><th>SLA Type</th><td>$SLA_TYPE</td></tr>
                <tr><th>Alert Status</th><td>$([ "$ALERT_ON_VIOLATIONS" = true ] && echo "Enabled" || echo "Disabled")</td></tr>
                <tr><th>Generated</th><td>$(date)</td></tr>
                <tr><th>Log File</th><td>$LOG_FILE</td></tr>
            </table>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p><strong>📞 Support:</strong> For SLA questions or violations, contact support@terrafusion.com</p>
            <p><small>This report is generated automatically and should be reviewed by operations team</small></p>
        </div>
    </div>
</body>
</html>
EOF
    
    log_success "SLA monitoring report generated: $report_file"
    echo "$report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion SLA Monitoring"
    log "Service: $SERVICE"
    log "Period: $PERIOD"
    log "SLA Type: $SLA_TYPE"
    log "========================================="
    
    # Define services to monitor
    local services_to_monitor=()
    if [ "$SERVICE" = "all" ]; then
        services_to_monitor=("api" "database" "ai-engine")
    else
        services_to_monitor=("$SERVICE")
    fi
    
    # Monitor each service
    for service in "${services_to_monitor[@]}"; do
        case $SLA_TYPE in
            availability)
                calculate_availability "$service"
                ;;
            performance)
                calculate_response_time "$service"
                ;;
            reliability)
                calculate_error_rate "$service"
                ;;
            all)
                calculate_availability "$service"
                calculate_response_time "$service"
                calculate_error_rate "$service"
                calculate_sla_credits "$service"
                ;;
        esac
    done
    
    # Historical trend analysis
    analyze_historical_trends
    
    # Send alerts if enabled
    if [ "$ALERT_ON_VIOLATIONS" = true ]; then
        send_sla_alerts
    fi
    
    # Generate report if requested
    if [ "$GENERATE_REPORT" = true ]; then
        generate_sla_report
    fi
    
    # Summary
    log ""
    log "========================================="
    log "SLA Monitoring Complete"
    log "========================================="
    log "Services monitored: ${#services_to_monitor[@]}"
    log "SLA violations: ${#SLA_VIOLATIONS[@]}"
    
    local total_violations=0
    local total_warnings=0
    
    for violation_key in "${!SLA_VIOLATIONS[@]}"; do
        if [[ "$violation_key" == *"warning"* ]]; then
            ((total_warnings++))
        else
            ((total_violations++))
        fi
    done
    
    if [ $total_violations -gt 0 ]; then
        log_error "$total_violations critical SLA violations detected"
        exit 1
    elif [ $total_warnings -gt 0 ]; then
        log_warning "$total_warnings SLA warnings detected"
    else
        log_success "All SLAs are within compliance"
    fi
    
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Handle interrupts
trap 'log_error "SLA monitoring interrupted!"; exit 1' INT TERM

# Run main function
main