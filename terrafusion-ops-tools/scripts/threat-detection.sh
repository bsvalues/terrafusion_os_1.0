#!/bin/bash
#
# TerraFusion Advanced Threat Detection and Log Aggregation System
# Analyzes logs for security threats, anomalies, and suspicious patterns
#
# Usage: ./threat-detection.sh [options]
# Options:
#   -m    Mode (realtime|batch|investigation)
#   -s    Source (all|api|database|system|auth)
#   -t    Threat types (all|bruteforce|injection|anomaly|malware)
#   -p    Time period (1h|6h|24h|7d)
#   -r    Generate threat report
#   -a    Auto-block detected threats
#   -n    Send threat notifications

set -euo pipefail

# Configuration
MODE="batch"
SOURCE="all"
THREAT_TYPES="all"
TIME_PERIOD="24h"
GENERATE_REPORT=false
AUTO_BLOCK=false
SEND_NOTIFICATIONS=false
THREAT_DB="/var/lib/threat-detection"
LOG_AGGREGATION_DIR="/var/log/aggregated"
REPORT_DIR="/var/reports/threat-detection"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/terrafusion/threat_detection_$TIMESTAMP.log"

# Threat detection thresholds
FAILED_LOGIN_THRESHOLD=10
SUSPICIOUS_REQUEST_THRESHOLD=100
SQL_INJECTION_THRESHOLD=5
XSS_ATTEMPT_THRESHOLD=5
ANOMALY_SCORE_THRESHOLD=0.8
RATE_LIMIT_THRESHOLD=1000

# Whitelist patterns
WHITELIST_IPS=("127.0.0.1" "10.0.0.0/8" "172.16.0.0/12" "192.168.0.0/16")
WHITELIST_USERS=("admin" "system" "healthcheck")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create directories
mkdir -p "$THREAT_DB"
mkdir -p "$LOG_AGGREGATION_DIR"
mkdir -p "$REPORT_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Parse arguments
while getopts "m:s:t:p:ran" opt; do
    case $opt in
        m) MODE="$OPTARG" ;;
        s) SOURCE="$OPTARG" ;;
        t) THREAT_TYPES="$OPTARG" ;;
        p) TIME_PERIOD="$OPTARG" ;;
        r) GENERATE_REPORT=true ;;
        a) AUTO_BLOCK=true ;;
        n) SEND_NOTIFICATIONS=true ;;
        *) echo "Usage: $0 [-m mode] [-s source] [-t types] [-p period] [-r] [-a] [-n]"; exit 1 ;;
    esac
done

# Data structures
declare -A THREAT_COUNTS
declare -A BLOCKED_IPS
declare -A SUSPICIOUS_USERS
declare -A ATTACK_PATTERNS
declare -A ANOMALY_SCORES

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

log_threat() {
    echo -e "${PURPLE}[THREAT] $1${NC}" | tee -a "$LOG_FILE"
}

# Check if IP is whitelisted
is_whitelisted_ip() {
    local ip=$1
    for whitelist_range in "${WHITELIST_IPS[@]}"; do
        if [[ "$whitelist_range" == *"/"* ]]; then
            # CIDR notation - simplified check
            local network=$(echo "$whitelist_range" | cut -d'/' -f1)
            local prefix=$(echo "$whitelist_range" | cut -d'/' -f2)
            if [[ "$ip" == "$network"* ]]; then
                return 0
            fi
        else
            if [ "$ip" = "$whitelist_range" ]; then
                return 0
            fi
        fi
    done
    return 1
}

# Check if user is whitelisted
is_whitelisted_user() {
    local user=$1
    for whitelist_user in "${WHITELIST_USERS[@]}"; do
        if [ "$user" = "$whitelist_user" ]; then
            return 0
        fi
    done
    return 1
}

# Aggregate logs from various sources
aggregate_logs() {
    log "📥 Aggregating logs from sources: $SOURCE"
    
    local aggregated_file="$LOG_AGGREGATION_DIR/aggregated_$TIMESTAMP.log"
    
    # Clear aggregated file
    > "$aggregated_file"
    
    case $SOURCE in
        all|api)
            # API access logs
            if [ -f "/var/log/nginx/access.log" ]; then
                cat /var/log/nginx/access.log >> "$aggregated_file"
            fi
            if [ -f "/var/log/terrafusion/api.log" ]; then
                cat /var/log/terrafusion/api.log >> "$aggregated_file"
            fi
            ;;& # Fall through
        all|database)
            # Database logs
            if [ -f "/var/log/postgresql/postgresql.log" ]; then
                cat /var/log/postgresql/postgresql.log >> "$aggregated_file"
            fi
            ;;& # Fall through
        all|system)
            # System logs
            if [ -f "/var/log/syslog" ]; then
                tail -10000 /var/log/syslog >> "$aggregated_file"
            fi
            if [ -f "/var/log/auth.log" ]; then
                cat /var/log/auth.log >> "$aggregated_file"
            fi
            ;;& # Fall through
        all|auth)
            # Authentication logs
            if [ -f "/var/log/terrafusion/auth.log" ]; then
                cat /var/log/terrafusion/auth.log >> "$aggregated_file"
            fi
            ;;
    esac
    
    local line_count=$(wc -l < "$aggregated_file" 2>/dev/null || echo 0)
    log_success "Aggregated $line_count log entries"
    
    echo "$aggregated_file"
}

# Detect brute force attacks
detect_brute_force_attacks() {
    local log_file=$1
    
    log "🔍 Detecting brute force attacks..."
    
    # Failed login attempts
    local failed_logins=$(grep -i "failed\|denied\|invalid\|unauthorized" "$log_file" | \
        grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | \
        sort | uniq -c | sort -nr)
    
    if [ -n "$failed_logins" ]; then
        echo "$failed_logins" | while read -r count ip; do
            if [ "$count" -gt "$FAILED_LOGIN_THRESHOLD" ] && ! is_whitelisted_ip "$ip"; then
                log_threat "Brute force attack detected from $ip ($count failed attempts)"
                THREAT_COUNTS["brute_force_$ip"]=$count
                
                if [ "$AUTO_BLOCK" = true ]; then
                    block_ip "$ip" "brute_force"
                fi
            fi
        done
    fi
    
    # SSH brute force
    local ssh_attacks=$(grep "sshd.*Failed password" "$log_file" | \
        grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | \
        sort | uniq -c | sort -nr)
    
    if [ -n "$ssh_attacks" ]; then
        echo "$ssh_attacks" | while read -r count ip; do
            if [ "$count" -gt 5 ] && ! is_whitelisted_ip "$ip"; then
                log_threat "SSH brute force attack from $ip ($count attempts)"
                THREAT_COUNTS["ssh_brute_force_$ip"]=$count
                
                if [ "$AUTO_BLOCK" = true ]; then
                    block_ip "$ip" "ssh_brute_force"
                fi
            fi
        done
    fi
}

# Detect SQL injection attempts
detect_sql_injection() {
    local log_file=$1
    
    log "🔍 Detecting SQL injection attempts..."
    
    # SQL injection patterns
    local sql_patterns=(
        "union.*select"
        "or.*1=1"
        "drop.*table"
        "insert.*into"
        "update.*set"
        "delete.*from"
        "script.*alert"
        "exec.*sp_"
        "char.*chr"
        "convert.*varchar"
    )
    
    for pattern in "${sql_patterns[@]}"; do
        local matches=$(grep -i "$pattern" "$log_file" | \
            grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | \
            sort | uniq -c | sort -nr)
        
        if [ -n "$matches" ]; then
            echo "$matches" | while read -r count ip; do
                if [ "$count" -gt "$SQL_INJECTION_THRESHOLD" ] && ! is_whitelisted_ip "$ip"; then
                    log_threat "SQL injection attempt from $ip ($count attempts, pattern: $pattern)"
                    THREAT_COUNTS["sql_injection_$ip"]=$((${THREAT_COUNTS["sql_injection_$ip"]:-0} + count))
                    ATTACK_PATTERNS["$ip"]="${ATTACK_PATTERNS["$ip"]:-} $pattern"
                    
                    if [ "$AUTO_BLOCK" = true ]; then
                        block_ip "$ip" "sql_injection"
                    fi
                fi
            done
        fi
    done
}

# Detect XSS attempts
detect_xss_attempts() {
    local log_file=$1
    
    log "🔍 Detecting XSS attempts..."
    
    # XSS patterns
    local xss_patterns=(
        "script.*alert"
        "javascript:"
        "onerror="
        "onload="
        "eval\("
        "document\.cookie"
        "window\.location"
        "iframe.*src"
    )
    
    for pattern in "${xss_patterns[@]}"; do
        local matches=$(grep -i "$pattern" "$log_file" | \
            grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | \
            sort | uniq -c | sort -nr)
        
        if [ -n "$matches" ]; then
            echo "$matches" | while read -r count ip; do
                if [ "$count" -gt "$XSS_ATTEMPT_THRESHOLD" ] && ! is_whitelisted_ip "$ip"; then
                    log_threat "XSS attempt from $ip ($count attempts, pattern: $pattern)"
                    THREAT_COUNTS["xss_$ip"]=$((${THREAT_COUNTS["xss_$ip"]:-0} + count))
                    ATTACK_PATTERNS["$ip"]="${ATTACK_PATTERNS["$ip"]:-} $pattern"
                    
                    if [ "$AUTO_BLOCK" = true ]; then
                        block_ip "$ip" "xss_attempt"
                    fi
                fi
            done
        fi
    done
}

# Detect anomalous behavior
detect_anomalies() {
    local log_file=$1
    
    log "🔍 Detecting anomalous behavior patterns..."
    
    # High request rate from single IP
    local high_rate_ips=$(grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' "$log_file" | \
        sort | uniq -c | sort -nr | head -20)
    
    if [ -n "$high_rate_ips" ]; then
        echo "$high_rate_ips" | while read -r count ip; do
            if [ "$count" -gt "$RATE_LIMIT_THRESHOLD" ] && ! is_whitelisted_ip "$ip"; then
                local anomaly_score=$(echo "scale=2; $count / $RATE_LIMIT_THRESHOLD" | bc -l)
                
                if (( $(echo "$anomaly_score > $ANOMALY_SCORE_THRESHOLD" | bc -l) )); then
                    log_threat "Anomalous high request rate from $ip ($count requests, score: $anomaly_score)"
                    ANOMALY_SCORES["$ip"]=$anomaly_score
                    THREAT_COUNTS["anomaly_$ip"]=$count
                fi
            fi
        done
    fi
    
    # Unusual user agent patterns
    local suspicious_agents=$(grep -i "user-agent" "$log_file" | \
        grep -E "(bot|crawler|scanner|nikto|sqlmap|nmap)" | \
        grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | \
        sort | uniq -c | sort -nr)
    
    if [ -n "$suspicious_agents" ]; then
        echo "$suspicious_agents" | while read -r count ip; do
            if [ "$count" -gt 5 ] && ! is_whitelisted_ip "$ip"; then
                log_threat "Suspicious user agent from $ip ($count requests)"
                THREAT_COUNTS["suspicious_agent_$ip"]=$count
            fi
        done
    fi
    
    # Unusual time patterns (requests outside business hours)
    local night_requests=$(grep "$(date +%Y-%m-%d)" "$log_file" | \
        awk '$4 ~ /0[0-6]:|2[2-3]:/ {print $1}' | \
        grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | \
        sort | uniq -c | sort -nr)
    
    if [ -n "$night_requests" ]; then
        echo "$night_requests" | while read -r count ip; do
            if [ "$count" -gt 50 ] && ! is_whitelisted_ip "$ip"; then
                log_threat "Unusual activity during off-hours from $ip ($count requests)"
                THREAT_COUNTS["off_hours_$ip"]=$count
            fi
        done
    fi
}

# Detect malware signatures
detect_malware_signatures() {
    local log_file=$1
    
    log "🔍 Detecting malware signatures..."
    
    # Known malware patterns
    local malware_patterns=(
        "c99shell"
        "r57shell"
        "webshell"
        "eval.*base64"
        "system.*cmd"
        "passthru"
        "shell_exec"
        "exec.*rm"
        "wget.*http"
        "curl.*sh"
    )
    
    for pattern in "${malware_patterns[@]}"; do
        local matches=$(grep -i "$pattern" "$log_file")
        
        if [ -n "$matches" ]; then
            echo "$matches" | while IFS= read -r line; do
                local ip=$(echo "$line" | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -1)
                
                if [ -n "$ip" ] && ! is_whitelisted_ip "$ip"; then
                    log_threat "Malware signature detected from $ip (pattern: $pattern)"
                    THREAT_COUNTS["malware_$ip"]=$((${THREAT_COUNTS["malware_$ip"]:-0} + 1))
                    ATTACK_PATTERNS["$ip"]="${ATTACK_PATTERNS["$ip"]:-} $pattern"
                    
                    if [ "$AUTO_BLOCK" = true ]; then
                        block_ip "$ip" "malware"
                    fi
                fi
            done
        fi
    done
}

# Block suspicious IP
block_ip() {
    local ip=$1
    local reason=$2
    
    log_warning "🚫 Blocking IP $ip (reason: $reason)"
    
    # Add to iptables (if available)
    if command -v iptables &> /dev/null; then
        iptables -A INPUT -s "$ip" -j DROP 2>/dev/null || true
    fi
    
    # Add to fail2ban (if available)
    if command -v fail2ban-client &> /dev/null; then
        fail2ban-client set sshd banip "$ip" 2>/dev/null || true
    fi
    
    # Record in blocked IPs database
    echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ")|$ip|$reason|auto-blocked" >> "$THREAT_DB/blocked_ips.log"
    BLOCKED_IPS["$ip"]=$reason
    
    # Send notification
    if [ "$SEND_NOTIFICATIONS" = true ]; then
        send_threat_notification "IP_BLOCKED" "IP $ip blocked for $reason"
    fi
}

# Real-time threat monitoring
realtime_monitoring() {
    log "🔴 Starting real-time threat monitoring..."
    
    # Monitor live logs
    local log_files=("/var/log/nginx/access.log" "/var/log/terrafusion/api.log" "/var/log/auth.log")
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ]; then
            log "Monitoring $log_file in real-time"
            
            # Use tail -f to monitor in background
            tail -f "$log_file" | while IFS= read -r line; do
                # Quick threat pattern matching
                if echo "$line" | grep -qE "(failed|denied|invalid|unauthorized)"; then
                    local ip=$(echo "$line" | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -1)
                    if [ -n "$ip" ] && ! is_whitelisted_ip "$ip"; then
                        log_threat "Real-time threat detected from $ip: $(echo "$line" | cut -c1-100)..."
                    fi
                fi
                
                # Check for immediate SQL injection
                if echo "$line" | grep -qiE "(union.*select|or.*1=1|drop.*table)"; then
                    local ip=$(echo "$line" | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -1)
                    if [ -n "$ip" ] && ! is_whitelisted_ip "$ip"; then
                        log_threat "Real-time SQL injection attempt from $ip"
                        if [ "$AUTO_BLOCK" = true ]; then
                            block_ip "$ip" "realtime_sql_injection"
                        fi
                    fi
                fi
            done &
        fi
    done
    
    # Monitor for duration
    local monitor_duration=3600  # 1 hour
    log "Real-time monitoring active for $monitor_duration seconds..."
    sleep $monitor_duration
    
    # Kill background processes
    jobs -p | xargs -r kill
    log_success "Real-time monitoring completed"
}

# Send threat notifications
send_threat_notification() {
    local threat_type=$1
    local message=$2
    
    log "📢 Sending threat notification: $threat_type"
    
    # Slack notification
    if [ -n "${SLACK_WEBHOOK:-}" ]; then
        local slack_message="{
            \"channel\": \"#security\",
            \"attachments\": [{
                \"color\": \"danger\",
                \"title\": \"🚨 Security Threat Detected\",
                \"fields\": [
                    {\"title\": \"Type\", \"value\": \"$threat_type\", \"short\": true},
                    {\"title\": \"Details\", \"value\": \"$message\", \"short\": false}
                ],
                \"footer\": \"TerraFusion Threat Detection\",
                \"ts\": $(date +%s)
            }]
        }"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$slack_message" \
            "$SLACK_WEBHOOK" &>/dev/null || true
    fi
    
    # Email notification
    if command -v mail &> /dev/null && [ -n "${SECURITY_EMAIL:-}" ]; then
        echo "Threat detected: $message
Type: $threat_type
Time: $(date)
Source: TerraFusion Threat Detection System" | \
        mail -s "[SECURITY ALERT] $threat_type" "$SECURITY_EMAIL" || true
    fi
    
    # PagerDuty for critical threats
    if [ -n "${PAGERDUTY_TOKEN:-}" ] && [[ "$threat_type" =~ (malware|sql_injection|brute_force) ]]; then
        local pagerduty_payload="{
            \"routing_key\": \"$PAGERDUTY_TOKEN\",
            \"event_action\": \"trigger\",
            \"payload\": {
                \"summary\": \"Security Threat: $threat_type\",
                \"severity\": \"critical\",
                \"source\": \"TerraFusion Security\",
                \"custom_details\": {
                    \"threat_type\": \"$threat_type\",
                    \"message\": \"$message\"
                }
            }
        }"
        
        curl -X POST \
            -H "Content-Type: application/json" \
            -d "$pagerduty_payload" \
            https://events.pagerduty.com/v2/enqueue &>/dev/null || true
    fi
}

# Generate comprehensive threat report
generate_threat_report() {
    local report_file="$REPORT_DIR/threat_detection_report_$TIMESTAMP.html"
    
    log "📄 Generating comprehensive threat detection report..."
    
    local total_threats=$(echo "${!THREAT_COUNTS[@]}" | wc -w)
    local blocked_ips_count=$(echo "${!BLOCKED_IPS[@]}" | wc -w)
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Threat Detection Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .threat-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .threat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; }
        .threat-card.warning { border-left-color: #ffc107; }
        .threat-card.info { border-left-color: #2196f3; }
        .card-value { font-size: 2.2em; font-weight: bold; color: #dc3545; margin-bottom: 5px; }
        .card-label { color: #6c757d; font-size: 0.9em; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .threat-high { background-color: #ffebee; color: #c62828; font-weight: bold; }
        .threat-medium { background-color: #fff3e0; color: #ef6c00; }
        .threat-low { background-color: #e8f5e8; color: #2e7d32; }
        .blocked-ip { background-color: #ffcdd2; font-weight: bold; }
        .attack-pattern { font-family: monospace; background: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Threat Detection Report</h1>
            <p>Security Analysis and Threat Intelligence</p>
            <p>Generated: $(date) | Period: $TIME_PERIOD | Source: $SOURCE</p>
        </div>
        
        <div class="threat-summary">
            <div class="threat-card">
                <div class="card-value">$total_threats</div>
                <div class="card-label">Total Threats Detected</div>
            </div>
            <div class="threat-card warning">
                <div class="card-value" style="color: #ff9800;">$blocked_ips_count</div>
                <div class="card-label">IPs Blocked</div>
            </div>
            <div class="threat-card info">
                <div class="card-value" style="color: #2196f3;">$(echo "${!ATTACK_PATTERNS[@]}" | wc -w)</div>
                <div class="card-label">Attack Patterns</div>
            </div>
            <div class="threat-card info">
                <div class="card-value" style="color: #2196f3;">$(echo "${!ANOMALY_SCORES[@]}" | wc -w)</div>
                <div class="card-label">Anomalies Detected</div>
            </div>
        </div>
        
        <div class="section">
            <h2>🚨 Detected Threats</h2>
            <table>
                <thead>
                    <tr>
                        <th>Threat Type</th>
                        <th>Source IP</th>
                        <th>Count</th>
                        <th>Severity</th>
                        <th>Status</th>
                        <th>Attack Patterns</th>
                    </tr>
                </thead>
                <tbody>
EOF
    
    # Add threat details
    for threat_key in "${!THREAT_COUNTS[@]}"; do
        local threat_type=$(echo "$threat_key" | cut -d'_' -f1-2)
        local source_ip=$(echo "$threat_key" | cut -d'_' -f3-)
        local count=${THREAT_COUNTS[$threat_key]}
        local patterns=${ATTACK_PATTERNS[$source_ip]:-"N/A"}
        
        # Determine severity
        local severity="Low"
        local severity_class="threat-low"
        if [ "$count" -gt 100 ]; then
            severity="High"
            severity_class="threat-high"
        elif [ "$count" -gt 20 ]; then
            severity="Medium"
            severity_class="threat-medium"
        fi
        
        # Check if IP is blocked
        local status="Active"
        local row_class=""
        if [ -n "${BLOCKED_IPS[$source_ip]:-}" ]; then
            status="Blocked"
            row_class="blocked-ip"
        fi
        
        cat >> "$report_file" << EOF
                    <tr class="$row_class">
                        <td>$(echo "$threat_type" | tr '_' ' ' | sed 's/\b\w/\U&/g')</td>
                        <td>$source_ip</td>
                        <td>$count</td>
                        <td class="$severity_class">$severity</td>
                        <td>$status</td>
                        <td class="attack-pattern">$(echo "$patterns" | cut -c1-50)...</td>
                    </tr>
EOF
    done
    
    cat >> "$report_file" << EOF
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>🔒 Blocked IPs</h2>
            <table>
                <thead>
                    <tr>
                        <th>IP Address</th>
                        <th>Block Reason</th>
                        <th>Threat Score</th>
                        <th>Geographic Location</th>
                    </tr>
                </thead>
                <tbody>
EOF
    
    # Add blocked IPs
    for blocked_ip in "${!BLOCKED_IPS[@]}"; do
        local reason=${BLOCKED_IPS[$blocked_ip]}
        local threat_score=${ANOMALY_SCORES[$blocked_ip]:-"N/A"}
        
        # Simple GeoIP lookup (would be enhanced in production)
        local geo_location="Unknown"
        if command -v whois &> /dev/null; then
            geo_location=$(whois "$blocked_ip" 2>/dev/null | grep -i country | head -1 | cut -d':' -f2 | xargs || echo "Unknown")
        fi
        
        cat >> "$report_file" << EOF
                    <tr>
                        <td>$blocked_ip</td>
                        <td>$(echo "$reason" | tr '_' ' ' | sed 's/\b\w/\U&/g')</td>
                        <td>$threat_score</td>
                        <td>$geo_location</td>
                    </tr>
EOF
    done
    
    cat >> "$report_file" << EOF
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>📊 Threat Intelligence Summary</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3>Most Common Attack Types</h3>
                    <ul>
EOF
    
    # Calculate attack type frequency
    declare -A attack_type_counts
    for threat_key in "${!THREAT_COUNTS[@]}"; do
        local attack_type=$(echo "$threat_key" | cut -d'_' -f1)
        attack_type_counts[$attack_type]=$((${attack_type_counts[$attack_type]:-0} + 1))
    done
    
    # Sort and display top attack types
    for attack_type in "${!attack_type_counts[@]}"; do
        echo "$attack_type:${attack_type_counts[$attack_type]}"
    done | sort -t: -k2 -nr | head -5 | while IFS=: read -r type count; do
        cat >> "$report_file" << EOF
                        <li>$(echo "$type" | tr '_' ' ' | sed 's/\b\w/\U&/g'): $count incidents</li>
EOF
    done
    
    cat >> "$report_file" << EOF
                    </ul>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3>Security Recommendations</h3>
                    <ul>
                        <li>Implement rate limiting for high-traffic IPs</li>
                        <li>Update WAF rules based on detected patterns</li>
                        <li>Review and strengthen authentication mechanisms</li>
                        <li>Consider implementing CAPTCHA for suspicious activity</li>
                        <li>Enhance monitoring for off-hours activity</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>📋 Next Actions</h2>
            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800;">
                <h3 style="margin-top: 0;">Immediate Actions (0-24 hours)</h3>
                <ul>
                    $([ $blocked_ips_count -gt 0 ] && echo "<li>Review and validate all blocked IPs</li>")
                    $([ $total_threats -gt 10 ] && echo "<li>Investigate high-severity threats immediately</li>")
                    <li>Update firewall rules based on threat patterns</li>
                    <li>Notify security team of critical findings</li>
                </ul>
                
                <h3>Short-term Actions (1-7 days)</h3>
                <ul>
                    <li>Enhance monitoring rules based on new attack patterns</li>
                    <li>Review and update security policies</li>
                    <li>Conduct security awareness training for team</li>
                    <li>Implement additional security controls as needed</li>
                </ul>
            </div>
        </div>
        
        <div class="section">
            <h2>📊 Report Metadata</h2>
            <table>
                <tr><th>Analysis Period</th><td>$TIME_PERIOD</td></tr>
                <tr><th>Log Sources</th><td>$SOURCE</td></tr>
                <tr><th>Threat Types</th><td>$THREAT_TYPES</td></tr>
                <tr><th>Auto-blocking</th><td>$([ "$AUTO_BLOCK" = true ] && echo "Enabled" || echo "Disabled")</td></tr>
                <tr><th>Generated</th><td>$(date)</td></tr>
                <tr><th>Log File</th><td>$LOG_FILE</td></tr>
            </table>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #ffebee; border-radius: 8px;">
            <p><strong>⚠️ Security Notice:</strong> This report contains sensitive security information. Handle with appropriate confidentiality.</p>
            <p><small>For security incidents, contact security@terrafusion.com immediately</small></p>
        </div>
    </div>
</body>
</html>
EOF
    
    log_success "Threat detection report generated: $report_file"
    echo "$report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Threat Detection System"
    log "Mode: $MODE"
    log "Source: $SOURCE"
    log "Threat Types: $THREAT_TYPES"
    log "Period: $TIME_PERIOD"
    log "========================================="
    
    case $MODE in
        realtime)
            realtime_monitoring
            ;;
        batch)
            # Aggregate logs
            local aggregated_log=$(aggregate_logs)
            
            # Run threat detection based on types
            case $THREAT_TYPES in
                all)
                    detect_brute_force_attacks "$aggregated_log"
                    detect_sql_injection "$aggregated_log"
                    detect_xss_attempts "$aggregated_log"
                    detect_anomalies "$aggregated_log"
                    detect_malware_signatures "$aggregated_log"
                    ;;
                bruteforce)
                    detect_brute_force_attacks "$aggregated_log"
                    ;;
                injection)
                    detect_sql_injection "$aggregated_log"
                    detect_xss_attempts "$aggregated_log"
                    ;;
                anomaly)
                    detect_anomalies "$aggregated_log"
                    ;;
                malware)
                    detect_malware_signatures "$aggregated_log"
                    ;;
            esac
            
            # Clean up aggregated log
            rm -f "$aggregated_log"
            ;;
        investigation)
            log "Investigation mode - analyzing specific patterns..."
            # This would be enhanced for forensic analysis
            ;;
        *)
            log_error "Invalid mode: $MODE"
            exit 1
            ;;
    esac
    
    # Generate report if requested
    if [ "$GENERATE_REPORT" = true ]; then
        generate_threat_report
    fi
    
    # Send notifications for high-severity threats
    if [ "$SEND_NOTIFICATIONS" = true ] && [ ${#THREAT_COUNTS[@]} -gt 0 ]; then
        send_threat_notification "MULTIPLE_THREATS" "Detected ${#THREAT_COUNTS[@]} security threats"
    fi
    
    # Summary
    log ""
    log "========================================="
    log "Threat Detection Analysis Complete"
    log "========================================="
    log "Total threats detected: ${#THREAT_COUNTS[@]}"
    log "IPs blocked: ${#BLOCKED_IPS[@]}"
    log "Attack patterns identified: ${#ATTACK_PATTERNS[@]}"
    
    if [ ${#THREAT_COUNTS[@]} -gt 0 ]; then
        log_warning "Security threats detected - review report immediately"
    else
        log_success "No security threats detected in this analysis"
    fi
    
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Handle interrupts
trap 'log_error "Threat detection interrupted!"; exit 1' INT TERM

# Run main function
main