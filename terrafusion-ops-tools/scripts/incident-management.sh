#!/bin/bash
#
# TerraFusion Incident Management and Escalation System
# Automates incident detection, classification, escalation, and response
#
# Usage: ./incident-management.sh [options]
# Options:
#   -a    Action (detect|create|escalate|resolve|status)
#   -s    Severity (P1|P2|P3|P4)
#   -t    Title of incident
#   -d    Description of incident
#   -i    Incident ID
#   -A    Auto-escalate based on severity
#   -n    Send notifications

set -euo pipefail

# Configuration
ACTION="detect"
SEVERITY=""
TITLE=""
DESCRIPTION=""
INCIDENT_ID=""
AUTO_ESCALATE=false
SEND_NOTIFICATIONS=false
INCIDENT_DIR="/var/incidents"
LOG_FILE="/var/log/terrafusion/incident_management_$(date +%Y%m%d_%H%M%S).log"

# Escalation matrix (in minutes)
P1_ESCALATION_TIME=15
P2_ESCALATION_TIME=60
P3_ESCALATION_TIME=240
P4_ESCALATION_TIME=1440

# Response time targets (in minutes)
P1_RESPONSE_TIME=15
P2_RESPONSE_TIME=60
P3_RESPONSE_TIME=240
P4_RESPONSE_TIME=1440

# Contact information
ONCALL_PHONE="+1-555-ONCALL"
TEAM_LEAD_EMAIL="team-lead@terrafusion.com"
MANAGER_EMAIL="manager@terrafusion.com"
SLACK_CHANNEL="#incidents"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create directories
mkdir -p "$INCIDENT_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Parse arguments
while getopts "a:s:t:d:i:An" opt; do
    case $opt in
        a) ACTION="$OPTARG" ;;
        s) SEVERITY="$OPTARG" ;;
        t) TITLE="$OPTARG" ;;
        d) DESCRIPTION="$OPTARG" ;;
        i) INCIDENT_ID="$OPTARG" ;;
        A) AUTO_ESCALATE=true ;;
        n) SEND_NOTIFICATIONS=true ;;
        *) echo "Usage: $0 [-a action] [-s severity] [-t title] [-d description] [-i id] [-A] [-n]"; exit 1 ;;
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

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# Generate incident ID
generate_incident_id() {
    local timestamp=$(date +%Y%m%d%H%M%S)
    local random=$(shuf -i 1000-9999 -n 1)
    echo "INC-${timestamp}-${random}"
}

# Validate severity level
validate_severity() {
    local sev=$1
    case $sev in
        P1|P2|P3|P4) return 0 ;;
        *) return 1 ;;
    esac
}

# Get severity color
get_severity_color() {
    local sev=$1
    case $sev in
        P1) echo "$RED" ;;
        P2) echo "$YELLOW" ;;
        P3) echo "$BLUE" ;;
        P4) echo "$NC" ;;
    esac
}

# Auto-detect incidents from monitoring
detect_incidents() {
    log "🔍 Detecting potential incidents from monitoring data..."
    
    local incidents_detected=0
    
    # Check Prometheus alerts
    if command -v curl &> /dev/null; then
        local alerts=$(curl -s http://localhost:\${{TF_PROMETHEUS_PORT:-9090}}/api/v1/alerts 2>/dev/null | jq -r '.data.alerts[]? | select(.state=="firing")' 2>/dev/null || echo "")
        
        if [ -n "$alerts" ]; then
            echo "$alerts" | jq -r '. | "\(.labels.alertname)|\(.labels.severity)|\(.annotations.summary // .annotations.description // "No description")"' | while IFS='|' read -r alert_name severity summary; do
                if [ -n "$alert_name" ]; then
                    # Map Prometheus severity to incident severity
                    local incident_severity="P3"
                    case $severity in
                        critical) incident_severity="P1" ;;
                        warning) incident_severity="P2" ;;
                        info) incident_severity="P4" ;;
                    esac
                    
                    # Check if incident already exists
                    local existing_incident=$(find "$INCIDENT_DIR" -name "*.json" -exec grep -l "$alert_name" {} \; | head -1)
                    
                    if [ -z "$existing_incident" ]; then
                        log_warning "🚨 New incident detected: $alert_name ($incident_severity)"
                        create_incident "$incident_severity" "$alert_name" "Auto-detected from monitoring: $summary"
                        ((incidents_detected++))
                    fi
                fi
            done
        fi
    fi
    
    # Check system health
    check_system_health
    
    # Check application health
    check_application_health
    
    log_success "Incident detection completed. Found $incidents_detected new incidents."
    return $incidents_detected
}

# Check system health indicators
check_system_health() {
    log "Checking system health indicators..."
    
    # High CPU usage
    if command -v top &> /dev/null; then
        local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//' | cut -d'%' -f1)
        if (( $(echo "$cpu_usage > 90" | bc -l) )); then
            create_incident "P2" "High CPU Usage" "System CPU usage at ${cpu_usage}%"
        fi
    fi
    
    # High memory usage
    if command -v free &> /dev/null; then
        local mem_usage=$(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}')
        if (( $(echo "$mem_usage > 95" | bc -l) )); then
            create_incident "P2" "High Memory Usage" "System memory usage at ${mem_usage}%"
        fi
    fi
    
    # Disk space critical
    if command -v df &> /dev/null; then
        local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
        if (( $(echo "$disk_usage > 95" | bc -l) )); then
            create_incident "P1" "Critical Disk Space" "Root filesystem at ${disk_usage}% usage"
        fi
    fi
}

# Check application health
check_application_health() {
    log "Checking application health..."
    
    # API health check
    if ! curl -sf http://localhost:\${{TF_PROMETHEUS_PORT:-9090}}/health &>/dev/null; then
        create_incident "P1" "API Service Down" "Primary API endpoint not responding"
    fi
    
    # Frontend health check
    if ! curl -sf http://localhost:\${{TF_PROMETHEUS_PORT:-9090}}/health &>/dev/null; then
        create_incident "P2" "Frontend Service Issues" "Frontend service not responding"
    fi
    
    # Database connectivity
    if ! PGPASSWORD="${PGPASSWORD:-}" psql -h localhost -U terrafusion_user -d terrafusion_production -c "SELECT 1" &>/dev/null; then
        create_incident "P1" "Database Connectivity Loss" "Cannot connect to primary database"
    fi
    
    # AI Engine health
    if ! curl -sf http://localhost:\${{TF_PROMETHEUS_PORT:-9090}}/health &>/dev/null; then
        create_incident "P2" "AI Engine Unavailable" "AI prediction service not responding"
    fi
}

# Create new incident
create_incident() {
    local severity=$1
    local title=$2
    local description=$3
    
    if ! validate_severity "$severity"; then
        log_error "Invalid severity level: $severity"
        return 1
    fi
    
    local incident_id=$(generate_incident_id)
    local incident_file="$INCIDENT_DIR/${incident_id}.json"
    local created_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Create incident record
    cat > "$incident_file" << EOF
{
  "incident_id": "$incident_id",
  "title": "$title",
  "description": "$description",
  "severity": "$severity",
  "status": "open",
  "created_at": "$created_at",
  "updated_at": "$created_at",
  "assigned_to": "",
  "escalated": false,
  "escalation_count": 0,
  "response_time_target": $(get_response_time_target "$severity"),
  "escalation_time_target": $(get_escalation_time_target "$severity"),
  "timeline": [
    {
      "timestamp": "$created_at",
      "action": "created",
      "details": "Incident created with severity $severity",
      "user": "system"
    }
  ],
  "affected_services": [],
  "root_cause": "",
  "resolution": "",
  "lessons_learned": "",
  "metrics": {
    "detection_time": 0,
    "response_time": 0,
    "resolution_time": 0,
    "customer_impact_duration": 0
  }
}
EOF
    
    local color=$(get_severity_color "$severity")
    log_success "${color}📋 Incident created: $incident_id - $title [$severity]${NC}"
    
    # Send notifications
    if [ "$SEND_NOTIFICATIONS" = true ]; then
        send_incident_notifications "$incident_id" "created"
    fi
    
    # Auto-escalate if enabled and high severity
    if [ "$AUTO_ESCALATE" = true ] && [[ "$severity" =~ ^(P1|P2)$ ]]; then
        escalate_incident "$incident_id"
    fi
    
    echo "$incident_id"
}

# Get response time target based on severity
get_response_time_target() {
    local severity=$1
    case $severity in
        P1) echo $P1_RESPONSE_TIME ;;
        P2) echo $P2_RESPONSE_TIME ;;
        P3) echo $P3_RESPONSE_TIME ;;
        P4) echo $P4_RESPONSE_TIME ;;
    esac
}

# Get escalation time target based on severity
get_escalation_time_target() {
    local severity=$1
    case $severity in
        P1) echo $P1_ESCALATION_TIME ;;
        P2) echo $P2_ESCALATION_TIME ;;
        P3) echo $P3_ESCALATION_TIME ;;
        P4) echo $P4_ESCALATION_TIME ;;
    esac
}

# Escalate incident
escalate_incident() {
    local incident_id=$1
    local incident_file="$INCIDENT_DIR/${incident_id}.json"
    
    if [ ! -f "$incident_file" ]; then
        log_error "Incident not found: $incident_id"
        return 1
    fi
    
    # Update incident record
    local updated_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local escalation_count=$(jq -r '.escalation_count' "$incident_file")
    local new_escalation_count=$((escalation_count + 1))
    local severity=$(jq -r '.severity' "$incident_file")
    
    # Determine escalation level
    local escalation_level="team-lead"
    if [ $new_escalation_count -ge 2 ]; then
        escalation_level="manager"
    fi
    if [ $new_escalation_count -ge 3 ]; then
        escalation_level="executive"
    fi
    
    # Update incident file
    jq --arg updated_at "$updated_at" \
       --arg escalation_count "$new_escalation_count" \
       --arg escalation_level "$escalation_level" \
       '.updated_at = $updated_at |
        .escalated = true |
        .escalation_count = ($escalation_count | tonumber) |
        .timeline += [{
          "timestamp": $updated_at,
          "action": "escalated",
          "details": ("Escalated to " + $escalation_level + " (escalation #" + $escalation_count + ")"),
          "user": "system"
        }]' "$incident_file" > "${incident_file}.tmp" && mv "${incident_file}.tmp" "$incident_file"
    
    local color=$(get_severity_color "$severity")
    log_warning "${color}🔺 Incident escalated: $incident_id to $escalation_level (escalation #$new_escalation_count)${NC}"
    
    # Send escalation notifications
    send_escalation_notifications "$incident_id" "$escalation_level"
    
    log_success "Incident $incident_id escalated successfully"
}

# Resolve incident
resolve_incident() {
    local incident_id=$1
    local resolution=${2:-"Issue resolved"}
    local incident_file="$INCIDENT_DIR/${incident_id}.json"
    
    if [ ! -f "$incident_file" ]; then
        log_error "Incident not found: $incident_id"
        return 1
    fi
    
    local updated_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local created_at=$(jq -r '.created_at' "$incident_file")
    local severity=$(jq -r '.severity' "$incident_file")
    
    # Calculate resolution time
    local created_timestamp=$(date -d "$created_at" +%s)
    local resolved_timestamp=$(date +%s)
    local resolution_time=$(( (resolved_timestamp - created_timestamp) / 60 ))
    
    # Update incident file
    jq --arg updated_at "$updated_at" \
       --arg resolution "$resolution" \
       --arg resolution_time "$resolution_time" \
       '.updated_at = $updated_at |
        .status = "resolved" |
        .resolution = $resolution |
        .metrics.resolution_time = ($resolution_time | tonumber) |
        .timeline += [{
          "timestamp": $updated_at,
          "action": "resolved",
          "details": $resolution,
          "user": "system"
        }]' "$incident_file" > "${incident_file}.tmp" && mv "${incident_file}.tmp" "$incident_file"
    
    local color=$(get_severity_color "$severity")
    log_success "${color}✅ Incident resolved: $incident_id (${resolution_time} minutes)${NC}"
    
    # Send resolution notifications
    if [ "$SEND_NOTIFICATIONS" = true ]; then
        send_incident_notifications "$incident_id" "resolved"
    fi
    
    # Generate post-incident report
    generate_post_incident_report "$incident_id"
}

# Get incident status
get_incident_status() {
    local incident_id=$1
    local incident_file="$INCIDENT_DIR/${incident_id}.json"
    
    if [ ! -f "$incident_file" ]; then
        log_error "Incident not found: $incident_id"
        return 1
    fi
    
    local title=$(jq -r '.title' "$incident_file")
    local severity=$(jq -r '.severity' "$incident_file")
    local status=$(jq -r '.status' "$incident_file")
    local created_at=$(jq -r '.created_at' "$incident_file")
    local assigned_to=$(jq -r '.assigned_to' "$incident_file")
    
    local color=$(get_severity_color "$severity")
    
    echo -e "${color}Incident ID: $incident_id${NC}"
    echo "Title: $title"
    echo "Severity: $severity"
    echo "Status: $status"
    echo "Created: $created_at"
    echo "Assigned to: ${assigned_to:-"Unassigned"}"
    
    # Show timeline
    echo -e "\n📋 Timeline:"
    jq -r '.timeline[] | "  " + .timestamp + " - " + .action + ": " + .details' "$incident_file"
}

# Send incident notifications
send_incident_notifications() {
    local incident_id=$1
    local action=$2
    local incident_file="$INCIDENT_DIR/${incident_id}.json"
    
    local title=$(jq -r '.title' "$incident_file")
    local severity=$(jq -r '.severity' "$incident_file")
    local description=$(jq -r '.description' "$incident_file")
    
    log "📢 Sending $action notifications for incident $incident_id..."
    
    # Slack notification
    if [ -n "${SLACK_WEBHOOK:-}" ]; then
        local emoji="🚨"
        local color="danger"
        
        case $action in
            resolved) emoji="✅"; color="good" ;;
            escalated) emoji="🔺"; color="warning" ;;
        esac
        
        local message="{
            \"channel\": \"$SLACK_CHANNEL\",
            \"attachments\": [{
                \"color\": \"$color\",
                \"title\": \"$emoji Incident $action: $incident_id\",
                \"fields\": [
                    {\"title\": \"Title\", \"value\": \"$title\", \"short\": false},
                    {\"title\": \"Severity\", \"value\": \"$severity\", \"short\": true},
                    {\"title\": \"Status\", \"value\": \"$action\", \"short\": true}
                ],
                \"footer\": \"TerraFusion Incident Management\",
                \"ts\": $(date +%s)
            }]
        }"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$message" \
            "$SLACK_WEBHOOK" &>/dev/null || true
    fi
    
    # Email notifications based on severity
    if command -v mail &> /dev/null; then
        local email_subject="[TerraFusion] $severity Incident $action: $title"
        local email_body="Incident ID: $incident_id
Title: $title
Severity: $severity
Description: $description
Status: $action
Time: $(date)

View details: https://incidents.terrafusion.com/$incident_id"
        
        case $severity in
            P1)
                # Critical - notify everyone
                echo "$email_body" | mail -s "$email_subject" "$TEAM_LEAD_EMAIL" || true
                echo "$email_body" | mail -s "$email_subject" "$MANAGER_EMAIL" || true
                ;;
            P2)
                # High - notify team lead
                echo "$email_body" | mail -s "$email_subject" "$TEAM_LEAD_EMAIL" || true
                ;;
        esac
    fi
    
    # PagerDuty integration (if configured)
    if [ -n "${PAGERDUTY_TOKEN:-}" ] && [[ "$severity" =~ ^(P1|P2)$ ]]; then
        send_pagerduty_alert "$incident_id" "$action"
    fi
    
    log_success "Notifications sent for incident $incident_id"
}

# Send escalation notifications
send_escalation_notifications() {
    local incident_id=$1
    local escalation_level=$2
    local incident_file="$INCIDENT_DIR/${incident_id}.json"
    
    local title=$(jq -r '.title' "$incident_file")
    local severity=$(jq -r '.severity' "$incident_file")
    
    log "📢 Sending escalation notifications to $escalation_level..."
    
    case $escalation_level in
        team-lead)
            if command -v mail &> /dev/null; then
                echo "Incident $incident_id has been escalated to you.
Title: $title
Severity: $severity
Please take immediate action." | \
                mail -s "[ESCALATED] $severity Incident: $title" "$TEAM_LEAD_EMAIL" || true
            fi
            ;;
        manager)
            if command -v mail &> /dev/null; then
                echo "Incident $incident_id requires manager attention.
Title: $title
Severity: $severity
This incident has been escalated multiple times." | \
                mail -s "[MANAGER ESCALATION] $severity Incident: $title" "$MANAGER_EMAIL" || true
            fi
            ;;
        executive)
            log_warning "Executive escalation triggered for incident $incident_id"
            # In production, this would trigger executive notifications
            ;;
    esac
}

# Send PagerDuty alert
send_pagerduty_alert() {
    local incident_id=$1
    local action=$2
    
    if [ -z "${PAGERDUTY_TOKEN:-}" ]; then
        return 0
    fi
    
    local incident_file="$INCIDENT_DIR/${incident_id}.json"
    local title=$(jq -r '.title' "$incident_file")
    local severity=$(jq -r '.severity' "$incident_file")
    
    local event_action="trigger"
    if [ "$action" = "resolved" ]; then
        event_action="resolve"
    fi
    
    local payload="{
        \"routing_key\": \"$PAGERDUTY_TOKEN\",
        \"event_action\": \"$event_action\",
        \"dedup_key\": \"$incident_id\",
        \"payload\": {
            \"summary\": \"$title\",
            \"severity\": \"$(echo "$severity" | tr '[:upper:]' '[:lower:]')\",
            \"source\": \"TerraFusion Monitoring\",
            \"custom_details\": {
                \"incident_id\": \"$incident_id\",
                \"severity\": \"$severity\"
            }
        }
    }"
    
    curl -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        https://events.pagerduty.com/v2/enqueue &>/dev/null || true
}

# Generate post-incident report
generate_post_incident_report() {
    local incident_id=$1
    local incident_file="$INCIDENT_DIR/${incident_id}.json"
    local report_file="$INCIDENT_DIR/${incident_id}_report.html"
    
    log "📄 Generating post-incident report for $incident_id..."
    
    local title=$(jq -r '.title' "$incident_file")
    local severity=$(jq -r '.severity' "$incident_file")
    local description=$(jq -r '.description' "$incident_file")
    local resolution=$(jq -r '.resolution' "$incident_file")
    local created_at=$(jq -r '.created_at' "$incident_file")
    local updated_at=$(jq -r '.updated_at' "$incident_file")
    local resolution_time=$(jq -r '.metrics.resolution_time' "$incident_file")
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Post-Incident Report - $incident_id</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .timeline { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .severity-$severity { color: $([ "$severity" = "P1" ] && echo "red" || echo "orange"); font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Post-Incident Report</h1>
        <h2 class="severity-$severity">$incident_id - $title [$severity]</h2>
        <p><strong>Resolution Time:</strong> $resolution_time minutes</p>
    </div>
    
    <div class="section">
        <h3>Incident Summary</h3>
        <table>
            <tr><th>Incident ID</th><td>$incident_id</td></tr>
            <tr><th>Title</th><td>$title</td></tr>
            <tr><th>Severity</th><td class="severity-$severity">$severity</td></tr>
            <tr><th>Created</th><td>$created_at</td></tr>
            <tr><th>Resolved</th><td>$updated_at</td></tr>
            <tr><th>Resolution Time</th><td>$resolution_time minutes</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h3>Description</h3>
        <p>$description</p>
    </div>
    
    <div class="section">
        <h3>Resolution</h3>
        <p>$resolution</p>
    </div>
    
    <div class="section">
        <h3>Timeline</h3>
        <div class="timeline">
$(jq -r '.timeline[] | "<p><strong>" + .timestamp + "</strong> - " + .action + ": " + .details + "</p>"' "$incident_file")
        </div>
    </div>
    
    <div class="section">
        <h3>Action Items</h3>
        <ul>
            <li>Review incident response procedures</li>
            <li>Update monitoring and alerting if needed</li>
            <li>Conduct team retrospective</li>
            <li>Document lessons learned</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    log_success "Post-incident report generated: $report_file"
}

# List open incidents
list_incidents() {
    local status_filter=${1:-"all"}
    
    log "📋 Listing incidents (filter: $status_filter)..."
    
    if [ ! -d "$INCIDENT_DIR" ] || [ -z "$(ls -A "$INCIDENT_DIR"/*.json 2>/dev/null)" ]; then
        log "No incidents found"
        return 0
    fi
    
    echo -e "\n📋 Incident List:"
    echo "=================="
    
    for incident_file in "$INCIDENT_DIR"/*.json; do
        if [ -f "$incident_file" ]; then
            local incident_id=$(jq -r '.incident_id' "$incident_file")
            local title=$(jq -r '.title' "$incident_file")
            local severity=$(jq -r '.severity' "$incident_file")
            local status=$(jq -r '.status' "$incident_file")
            local created_at=$(jq -r '.created_at' "$incident_file")
            
            # Apply filter
            if [ "$status_filter" != "all" ] && [ "$status" != "$status_filter" ]; then
                continue
            fi
            
            local color=$(get_severity_color "$severity")
            echo -e "${color}$incident_id${NC} | $severity | $status | $title"
            echo "  Created: $created_at"
            echo ""
        fi
    done
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Incident Management"
    log "Action: $ACTION"
    log "Auto-escalate: $AUTO_ESCALATE"
    log "Notifications: $SEND_NOTIFICATIONS"
    log "========================================="
    
    case $ACTION in
        detect)
            detect_incidents
            ;;
        create)
            if [ -z "$SEVERITY" ] || [ -z "$TITLE" ]; then
                log_error "Severity and title required for creating incidents"
                exit 1
            fi
            create_incident "$SEVERITY" "$TITLE" "$DESCRIPTION"
            ;;
        escalate)
            if [ -z "$INCIDENT_ID" ]; then
                log_error "Incident ID required for escalation"
                exit 1
            fi
            escalate_incident "$INCIDENT_ID"
            ;;
        resolve)
            if [ -z "$INCIDENT_ID" ]; then
                log_error "Incident ID required for resolution"
                exit 1
            fi
            resolve_incident "$INCIDENT_ID" "$DESCRIPTION"
            ;;
        status)
            if [ -n "$INCIDENT_ID" ]; then
                get_incident_status "$INCIDENT_ID"
            else
                list_incidents "open"
            fi
            ;;
        list)
            list_incidents
            ;;
        *)
            log_error "Invalid action: $ACTION"
            echo "Valid actions: detect, create, escalate, resolve, status, list"
            exit 1
            ;;
    esac
    
    log "Incident management action completed: $ACTION"
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Handle interrupts
trap 'log_error "Incident management interrupted!"; exit 1' INT TERM

# Run main function
main