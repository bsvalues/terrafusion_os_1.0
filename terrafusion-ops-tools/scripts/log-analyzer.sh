#!/bin/bash
#
# TerraFusion Log Analysis Script
# Analyzes application logs for errors, patterns, and insights
#
# Usage: ./log-analyzer.sh [options]
# Options:
#   -f    Log file path (default: auto-detect)
#   -d    Date filter (YYYY-MM-DD or 'today', 'yesterday')
#   -l    Log level filter (ERROR, WARNING, INFO, DEBUG)
#   -s    Service filter (backend, ai-engine, frontend, nginx)
#   -r    Generate HTML report
#   -t    Time range in hours (default: 24)
#   -p    Pattern to search for

set -euo pipefail

# Configuration
LOG_DIRS=("/var/log/terrafusion" "/var/log/nginx" "/var/log/docker")
DEFAULT_LOG_FILE=""
DATE_FILTER=""
LEVEL_FILTER=""
SERVICE_FILTER=""
GENERATE_REPORT=false
TIME_RANGE_HOURS=24
SEARCH_PATTERN=""
OUTPUT_DIR="/var/reports/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Parse arguments
while getopts "f:d:l:s:rt:p:" opt; do
    case $opt in
        f) DEFAULT_LOG_FILE="$OPTARG" ;;
        d) DATE_FILTER="$OPTARG" ;;
        l) LEVEL_FILTER="$OPTARG" ;;
        s) SERVICE_FILTER="$OPTARG" ;;
        r) GENERATE_REPORT=true ;;
        t) TIME_RANGE_HOURS="$OPTARG" ;;
        p) SEARCH_PATTERN="$OPTARG" ;;
        *) echo "Usage: $0 [-f file] [-d date] [-l level] [-s service] [-r] [-t hours] [-p pattern]"; exit 1 ;;
    esac
done

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Find log files
find_log_files() {
    local service=$1
    local files=()
    
    case $service in
        backend)
            files+=("/var/log/terrafusion/backend.log")
            files+=("/var/log/terrafusion/backend_$(date +%Y%m%d).log")
            ;;
        ai-engine)
            files+=("/var/log/terrafusion/ai_engine.log")
            files+=("/var/log/terrafusion/ai_$(date +%Y%m%d).log")
            ;;
        frontend)
            files+=("/var/log/nginx/access.log")
            files+=("/var/log/nginx/error.log")
            ;;
        nginx)
            files+=("/var/log/nginx/access.log")
            files+=("/var/log/nginx/error.log")
            ;;
        *)
            # Find all log files
            for dir in "${LOG_DIRS[@]}"; do
                if [ -d "$dir" ]; then
                    find "$dir" -name "*.log" -type f 2>/dev/null | while read -r file; do
                        files+=("$file")
                    done
                fi
            done
            ;;
    esac
    
    # Filter existing files
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo "$file"
        fi
    done
}

# Parse date filter
parse_date_filter() {
    case $DATE_FILTER in
        today)
            date +%Y-%m-%d
            ;;
        yesterday)
            date -d "yesterday" +%Y-%m-%d
            ;;
        "")
            # No filter
            echo ""
            ;;
        *)
            # Assume it's already in YYYY-MM-DD format
            echo "$DATE_FILTER"
            ;;
    esac
}

# Extract log entries
extract_logs() {
    local log_file=$1
    local temp_file="$OUTPUT_DIR/extracted_logs_$TIMESTAMP.txt"
    
    log "Extracting logs from $log_file..."
    
    # Base command
    local cmd="cat"
    
    # Add date filter if specified
    local date_pattern=$(parse_date_filter)
    if [ -n "$date_pattern" ]; then
        cmd="grep '$date_pattern'"
    fi
    
    # Add time range filter (last N hours)
    if [ "$TIME_RANGE_HOURS" -gt 0 ] && [ -z "$date_pattern" ]; then
        local start_time=$(date -d "$TIME_RANGE_HOURS hours ago" "+%Y-%m-%d %H:%M:%S")
        local end_time=$(date "+%Y-%m-%d %H:%M:%S")
        cmd="awk -v start='$start_time' -v end='$end_time' '\$0 ~ /[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/ && \$1\" \"\$2 >= start && \$1\" \"\$2 <= end'"
    fi
    
    # Add level filter
    if [ -n "$LEVEL_FILTER" ]; then
        cmd="$cmd | grep -i '$LEVEL_FILTER'"
    fi
    
    # Add pattern search
    if [ -n "$SEARCH_PATTERN" ]; then
        cmd="$cmd | grep -i '$SEARCH_PATTERN'"
    fi
    
    # Execute command
    eval "$cmd $log_file" > "$temp_file" 2>/dev/null || true
    
    echo "$temp_file"
}

# Analyze error patterns
analyze_error_patterns() {
    local log_file=$1
    local analysis_file="$OUTPUT_DIR/error_analysis_$TIMESTAMP.txt"
    
    log "Analyzing error patterns..."
    
    {
        echo "=== ERROR PATTERN ANALYSIS ==="
        echo "Timestamp: $(date)"
        echo "Log file: $log_file"
        echo ""
        
        # Error counts by level
        echo "--- Error Counts by Level ---"
        grep -i -E "(ERROR|CRITICAL|FATAL)" "$log_file" 2>/dev/null | \
            sed -E 's/.*\[(ERROR|CRITICAL|FATAL)\].*/\1/' | \
            sort | uniq -c | sort -rn || echo "No errors found"
        echo ""
        
        # Warning counts
        echo "--- Warning Counts ---"
        grep -i "WARNING" "$log_file" 2>/dev/null | wc -l | \
            awk '{print "WARNING: " $1 " occurrences"}' || echo "No warnings found"
        echo ""
        
        # Top error messages
        echo "--- Top 10 Error Messages ---"
        grep -i -E "(ERROR|EXCEPTION)" "$log_file" 2>/dev/null | \
            sed -E 's/.*[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}[^ ]* //' | \
            sort | uniq -c | sort -rn | head -10 || echo "No error messages found"
        echo ""
        
        # Database errors
        echo "--- Database Related Errors ---"
        grep -i -E "(database|connection|sql|psycopg|sqlalchemy)" "$log_file" 2>/dev/null | \
            grep -i error | wc -l | \
            awk '{print "Database errors: " $1 " occurrences"}' || echo "No database errors found"
        echo ""
        
        # Authentication errors
        echo "--- Authentication Errors ---"
        grep -i -E "(auth|login|password|token|unauthorized|forbidden)" "$log_file" 2>/dev/null | \
            grep -i error | wc -l | \
            awk '{print "Auth errors: " $1 " occurrences"}' || echo "No auth errors found"
        echo ""
        
        # Performance issues
        echo "--- Slow Requests (>2s) ---"
        grep -E "duration.*[2-9][0-9]{3}ms|duration.*[0-9]+s" "$log_file" 2>/dev/null | \
            head -10 || echo "No slow requests found"
        echo ""
        
        # Memory/Resource issues
        echo "--- Memory/Resource Issues ---"
        grep -i -E "(memory|out of memory|disk|space|resource)" "$log_file" 2>/dev/null | \
            grep -i -E "(error|warning|critical)" | head -10 || echo "No resource issues found"
        echo ""
        
        # HTTP status codes
        echo "--- HTTP Status Code Summary ---"
        grep -oE "HTTP/[0-9.]* [0-9]{3}" "$log_file" 2>/dev/null | \
            awk '{print $2}' | sort | uniq -c | sort -rn || echo "No HTTP status codes found"
        echo ""
        
        # Recent critical errors (last hour)
        echo "--- Recent Critical Errors (Last Hour) ---"
        local one_hour_ago=$(date -d "1 hour ago" "+%Y-%m-%d %H:%M:%S")
        awk -v since="$one_hour_ago" '
            /[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/ {
                if ($1" "$2 >= since && /ERROR|CRITICAL|FATAL/) print
            }' "$log_file" 2>/dev/null | head -20 || echo "No recent critical errors"
        
    } > "$analysis_file"
    
    echo "$analysis_file"
}

# Analyze access patterns (for web logs)
analyze_access_patterns() {
    local log_file=$1
    local access_file="$OUTPUT_DIR/access_analysis_$TIMESTAMP.txt"
    
    if [[ "$log_file" == *"access.log"* ]]; then
        log "Analyzing access patterns..."
        
        {
            echo "=== ACCESS PATTERN ANALYSIS ==="
            echo "Timestamp: $(date)"
            echo "Log file: $log_file"
            echo ""
            
            # Top IPs
            echo "--- Top 20 IP Addresses ---"
            awk '{print $1}' "$log_file" 2>/dev/null | sort | uniq -c | sort -rn | head -20 || echo "No access data found"
            echo ""
            
            # Top endpoints
            echo "--- Top 20 Requested Endpoints ---"
            awk '{print $7}' "$log_file" 2>/dev/null | sort | uniq -c | sort -rn | head -20 || echo "No endpoint data found"
            echo ""
            
            # Status codes
            echo "--- HTTP Status Codes ---"
            awk '{print $9}' "$log_file" 2>/dev/null | sort | uniq -c | sort -rn || echo "No status codes found"
            echo ""
            
            # User agents
            echo "--- Top 10 User Agents ---"
            awk -F'"' '{print $6}' "$log_file" 2>/dev/null | sort | uniq -c | sort -rn | head -10 || echo "No user agent data found"
            echo ""
            
            # Hourly request distribution
            echo "--- Hourly Request Distribution (Last 24h) ---"
            awk '{
                if (match($4, /\[([0-9]{2})\/[A-Za-z]{3}\/[0-9]{4}:([0-9]{2})/, arr)) {
                    print arr[2]
                }
            }' "$log_file" 2>/dev/null | sort | uniq -c | sort -k2n || echo "No hourly data found"
            echo ""
            
            # Large requests
            echo "--- Large Response Sizes (>1MB) ---"
            awk '$10 > 1048576 {print $4, $7, $10}' "$log_file" 2>/dev/null | head -20 || echo "No large responses found"
            
        } > "$access_file"
        
        echo "$access_file"
    fi
}

# Generate performance metrics
generate_performance_metrics() {
    local log_file=$1
    local perf_file="$OUTPUT_DIR/performance_metrics_$TIMESTAMP.txt"
    
    log "Generating performance metrics..."
    
    {
        echo "=== PERFORMANCE METRICS ==="
        echo "Timestamp: $(date)"
        echo "Log file: $log_file"
        echo ""
        
        # Response time analysis
        echo "--- Response Time Analysis ---"
        grep -oE "duration.*[0-9]+ms" "$log_file" 2>/dev/null | \
            sed 's/duration.*\([0-9]*\)ms/\1/' | \
            awk '{
                sum += $1
                count++
                if ($1 > max) max = $1
                if (min == 0 || $1 < min) min = $1
            } END {
                if (count > 0) {
                    printf "Total requests: %d\n", count
                    printf "Average response time: %.2f ms\n", sum/count
                    printf "Min response time: %d ms\n", min
                    printf "Max response time: %d ms\n", max
                } else {
                    print "No response time data found"
                }
            }'
        echo ""
        
        # Slow queries
        echo "--- Slow Database Queries (>500ms) ---"
        grep -E "duration.*[5-9][0-9]{2}ms|duration.*[0-9]{4,}ms" "$log_file" 2>/dev/null | head -10 || echo "No slow queries found"
        echo ""
        
        # Request rate
        echo "--- Request Rate Analysis ---"
        awk '
            /[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/ {
                hour = substr($2, 1, 2)
                requests[hour]++
            } END {
                for (h in requests) {
                    printf "Hour %s: %d requests\n", h, requests[h]
                }
            }' "$log_file" 2>/dev/null | sort -k2n || echo "No request rate data found"
        echo ""
        
        # Memory usage patterns
        echo "--- Memory Usage Alerts ---"
        grep -i -E "(memory|heap|gc|garbage)" "$log_file" 2>/dev/null | head -10 || echo "No memory usage data found"
        
    } > "$perf_file"
    
    echo "$perf_file"
}

# Generate HTML report
generate_html_report() {
    local extracted_logs=$1
    local error_analysis=$2
    local access_analysis=$3
    local performance_metrics=$4
    local report_file="$OUTPUT_DIR/log_analysis_report_$TIMESTAMP.html"
    
    log "Generating HTML report: $report_file"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Log Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #5cb85c; }
        .error-section { border-left-color: #d9534f; }
        .warning-section { border-left-color: #f0ad4e; }
        pre { background-color: #f8f8f8; padding: 10px; border-radius: 3px; overflow-x: auto; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-value { font-size: 20px; font-weight: bold; }
        .metric-label { color: #666; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .error { color: #d9534f; }
        .warning { color: #f0ad4e; }
        .info { color: #5bc0de; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TerraFusion Log Analysis Report</h1>
        <p>Generated: $(date)</p>
        <p>Time Range: Last $TIME_RANGE_HOURS hours</p>
        $([ -n "$SERVICE_FILTER" ] && echo "<p>Service: $SERVICE_FILTER</p>")
        $([ -n "$LEVEL_FILTER" ] && echo "<p>Level Filter: $LEVEL_FILTER</p>")
        $([ -n "$SEARCH_PATTERN" ] && echo "<p>Search Pattern: $SEARCH_PATTERN</p>")
    </div>
    
    <div class="section">
        <h2>Summary Metrics</h2>
        <div class="metric">
            <div class="metric-value">$(wc -l < "$extracted_logs" 2>/dev/null || echo "0")</div>
            <div class="metric-label">Total Log Entries</div>
        </div>
        <div class="metric">
            <div class="metric-value error">$(grep -ci error "$extracted_logs" 2>/dev/null || echo "0")</div>
            <div class="metric-label">Errors</div>
        </div>
        <div class="metric">
            <div class="metric-value warning">$(grep -ci warning "$extracted_logs" 2>/dev/null || echo "0")</div>
            <div class="metric-label">Warnings</div>
        </div>
    </div>
    
    <div class="section error-section">
        <h2>Error Analysis</h2>
        <pre>$(cat "$error_analysis" 2>/dev/null || echo "No error analysis available")</pre>
    </div>
    
    $([ -n "$access_analysis" ] && cat << 'EOFACCESS'
    <div class="section">
        <h2>Access Pattern Analysis</h2>
        <pre>$(cat "$access_analysis" 2>/dev/null || echo "No access analysis available")</pre>
    </div>
EOFACCESS
)
    
    <div class="section">
        <h2>Performance Metrics</h2>
        <pre>$(cat "$performance_metrics" 2>/dev/null || echo "No performance metrics available")</pre>
    </div>
    
    <div class="section">
        <h2>Recent Log Entries (Last 100)</h2>
        <pre>$(tail -100 "$extracted_logs" 2>/dev/null || echo "No log entries available")</pre>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            $([ "$(grep -ci error "$extracted_logs" 2>/dev/null || echo "0")" -gt 10 ] && echo "<li class='error'>High error count detected. Investigate error patterns immediately.</li>")
            $([ "$(grep -ci "database.*error" "$extracted_logs" 2>/dev/null || echo "0")" -gt 0 ] && echo "<li class='warning'>Database errors detected. Check database connectivity and queries.</li>")
            $([ "$(grep -ci "memory" "$extracted_logs" 2>/dev/null || echo "0")" -gt 0 ] && echo "<li class='warning'>Memory-related issues detected. Monitor system resources.</li>")
            <li>Set up log rotation to prevent disk space issues</li>
            <li>Implement log aggregation for better analysis</li>
            <li>Configure automated alerting for critical errors</li>
        </ul>
    </div>
    
    <div class="footer">
        <p><small>Log files analyzed: $(echo "$@" | tr ' ' ', ')</small></p>
    </div>
</body>
</html>
EOF
    
    log_success "HTML report generated: $report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Log Analysis Started"
    log "========================================="
    
    # Determine log files to analyze
    local log_files=()
    if [ -n "$DEFAULT_LOG_FILE" ]; then
        log_files+=("$DEFAULT_LOG_FILE")
    else
        # Auto-detect log files
        if [ -n "$SERVICE_FILTER" ]; then
            while IFS= read -r file; do
                log_files+=("$file")
            done < <(find_log_files "$SERVICE_FILTER")
        else
            while IFS= read -r file; do
                log_files+=("$file")
            done < <(find_log_files "all")
        fi
    fi
    
    if [ ${#log_files[@]} -eq 0 ]; then
        log_error "No log files found to analyze"
        exit 1
    fi
    
    log "Analyzing ${#log_files[@]} log file(s):"
    for file in "${log_files[@]}"; do
        log "  - $file"
    done
    
    # Process each log file
    local all_extracted_logs="$OUTPUT_DIR/all_logs_$TIMESTAMP.txt"
    > "$all_extracted_logs"  # Clear file
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ]; then
            local extracted=$(extract_logs "$log_file")
            cat "$extracted" >> "$all_extracted_logs"
            rm -f "$extracted"
        fi
    done
    
    # Generate analyses
    local error_analysis=$(analyze_error_patterns "$all_extracted_logs")
    local access_analysis=""
    local performance_metrics=$(generate_performance_metrics "$all_extracted_logs")
    
    # Check for access logs
    for log_file in "${log_files[@]}"; do
        if [[ "$log_file" == *"access.log"* ]]; then
            access_analysis=$(analyze_access_patterns "$log_file")
            break
        fi
    done
    
    # Display summary
    log ""
    log "========================================="
    log "Analysis Summary"
    log "========================================="
    log "Total log entries analyzed: $(wc -l < "$all_extracted_logs")"
    log "Errors found: $(grep -ci error "$all_extracted_logs" 2>/dev/null || echo "0")"
    log "Warnings found: $(grep -ci warning "$all_extracted_logs" 2>/dev/null || echo "0")"
    log ""
    
    # Show top errors
    log "Top 5 Error Messages:"
    grep -i error "$all_extracted_logs" 2>/dev/null | head -5 | while read -r line; do
        log "  - $line"
    done || log "  No errors found"
    
    # Generate HTML report if requested
    if [ "$GENERATE_REPORT" = true ]; then
        generate_html_report "$all_extracted_logs" "$error_analysis" "$access_analysis" "$performance_metrics"
    fi
    
    log ""
    log "Analysis files generated:"
    log "  - Extracted logs: $all_extracted_logs"
    log "  - Error analysis: $error_analysis"
    [ -n "$access_analysis" ] && log "  - Access analysis: $access_analysis"
    log "  - Performance metrics: $performance_metrics"
    
    log "========================================="
    log "Log Analysis Completed"
    log "========================================="
}

# Run main function
main