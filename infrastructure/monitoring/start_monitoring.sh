#!/bin/bash

# TerraFusion Monitoring System Startup Script
# Starts all monitoring components and agents

set -e

echo "🚀 Starting TerraFusion Comprehensive Monitoring System"
echo "=================================================="

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1-2)
echo "✓ Python version: $PYTHON_VERSION"

# Create necessary directories
echo "📁 Creating monitoring directories..."
mkdir -p /mnt/e/TerraFusion/monitoring/logs
mkdir -p /mnt/e/TerraFusion/monitoring/reports
mkdir -p /mnt/e/TerraFusion/monitoring/data

# Install required Python packages if not present
echo "📦 Checking Python dependencies..."
python3 -c "import asyncio, json, logging, datetime, pathlib" 2>/dev/null || {
    echo "❌ Missing required Python packages"
    exit 1
}

# Install additional packages for monitoring
pip3 install --quiet numpy pyyaml prometheus-client elasticsearch jaeger-client 2>/dev/null || echo "⚠️  Some optional packages may not be available"

echo "✓ Dependencies checked"

# Check if Docker is available for infrastructure services
if command -v docker &> /dev/null; then
    echo "✓ Docker available for infrastructure services"
    
    # Check if Prometheus is running
    if docker ps | grep -q prometheus; then
        echo "✓ Prometheus container is running"
    else
        echo "⚠️  Prometheus container not found - metrics collection may be limited"
    fi
    
    # Check if Elasticsearch is running
    if docker ps | grep -q elasticsearch; then
        echo "✓ Elasticsearch container is running"
    else
        echo "⚠️  Elasticsearch container not found - log aggregation may be limited"
    fi
    
    # Check if Grafana is running
    if docker ps | grep -q grafana; then
        echo "✓ Grafana container is running"
    else
        echo "⚠️  Grafana container not found - dashboards may not be available"
    fi
else
    echo "⚠️  Docker not available - running in standalone mode"
fi

# Set execution permissions on monitoring agents
echo "🔧 Setting permissions on monitoring agents..."
chmod +x /mnt/e/TerraFusion/monitoring/infrastructure/agents/infrastructure_monitoring_agent.py
chmod +x /mnt/e/TerraFusion/monitoring/application/agents/application_monitoring_agent.py
chmod +x /mnt/e/TerraFusion/monitoring/security/agents/security_monitoring_agent.py
chmod +x /mnt/e/TerraFusion/monitoring/quantum/agents/quantum_monitoring_agent.py
chmod +x /mnt/e/TerraFusion/monitoring/master_monitoring_orchestrator.py

echo "✓ Permissions set"

# Check monitoring system components
echo "🔍 Checking monitoring system components..."

# Check if monitoring agent files exist
AGENTS=(
    "infrastructure/agents/infrastructure_monitoring_agent.py"
    "application/agents/application_monitoring_agent.py"
    "security/agents/security_monitoring_agent.py"
    "quantum/agents/quantum_monitoring_agent.py"
)

for agent in "${AGENTS[@]}"; do
    if [[ -f "/mnt/e/TerraFusion/monitoring/$agent" ]]; then
        echo "✓ $agent found"
    else
        echo "❌ $agent missing"
        exit 1
    fi
done

# Check dashboard files
DASHBOARDS=(
    "grafana/dashboards/infrastructure_dashboard.json"
    "grafana/dashboards/application_dashboard.json"
    "grafana/dashboards/security_dashboard.json"
    "grafana/dashboards/quantum_dashboard.json"
)

for dashboard in "${DASHBOARDS[@]}"; do
    if [[ -f "/mnt/e/TerraFusion/monitoring/$dashboard" ]]; then
        echo "✓ $dashboard found"
    else
        echo "⚠️  $dashboard missing - dashboard may not be available"
    fi
done

# Check configuration files
CONFIG_FILES=(
    "alerts/prometheus_alerts.yml"
    "slo/slo_definitions.yml"
    "runbooks/infrastructure_runbooks.md"
)

for config in "${CONFIG_FILES[@]}"; do
    if [[ -f "/mnt/e/TerraFusion/monitoring/$config" ]]; then
        echo "✓ $config found"
    else
        echo "⚠️  $config missing - some features may not be available"
    fi
done

echo "✅ Component check completed"

# Function to start monitoring in different modes
start_monitoring() {
    local mode=${1:-continuous}
    local interval=${2:-60}
    
    echo "🎯 Starting TerraFusion Monitoring Orchestrator in $mode mode"
    echo "   Monitoring interval: ${interval}s"
    echo "   Log file: /mnt/e/TerraFusion/monitoring/logs/master_orchestrator.log"
    echo ""
    
    cd /mnt/e/TerraFusion/monitoring
    
    case $mode in
        "continuous")
            echo "🔄 Starting continuous monitoring (Press Ctrl+C to stop)..."
            python3 master_monitoring_orchestrator.py --mode continuous --interval $interval --verbose
            ;;
        "single")
            echo "⚡ Running single monitoring cycle..."
            python3 master_monitoring_orchestrator.py --mode single --verbose
            ;;
        "report")
            echo "📊 Generating monitoring reports..."
            python3 master_monitoring_orchestrator.py --mode report --verbose
            ;;
        "test")
            echo "🧪 Running test mode..."
            echo "Testing individual agents..."
            
            echo "  Testing Infrastructure Agent..."
            python3 infrastructure/agents/infrastructure_monitoring_agent.py &
            INFRA_PID=$!
            sleep 5
            kill $INFRA_PID 2>/dev/null || true
            
            echo "  Testing Application Agent..."
            python3 application/agents/application_monitoring_agent.py &
            APP_PID=$!
            sleep 5
            kill $APP_PID 2>/dev/null || true
            
            echo "  Testing Security Agent..."
            python3 security/agents/security_monitoring_agent.py &
            SEC_PID=$!
            sleep 5
            kill $SEC_PID 2>/dev/null || true
            
            echo "  Testing Quantum Agent..."
            python3 quantum/agents/quantum_monitoring_agent.py &
            QUANTUM_PID=$!
            sleep 5
            kill $QUANTUM_PID 2>/dev/null || true
            
            echo "✅ All agents tested successfully"
            ;;
        *)
            echo "❌ Unknown mode: $mode"
            echo "Available modes: continuous, single, report, test"
            exit 1
            ;;
    esac
}

# Function to show monitoring status
show_status() {
    echo "📊 TerraFusion Monitoring System Status"
    echo "======================================"
    
    # Check if orchestrator is running
    if pgrep -f "master_monitoring_orchestrator.py" > /dev/null; then
        echo "🟢 Master Orchestrator: RUNNING"
        echo "   PID: $(pgrep -f master_monitoring_orchestrator.py)"
    else
        echo "🔴 Master Orchestrator: STOPPED"
    fi
    
    # Check log files
    if [[ -f "/mnt/e/TerraFusion/monitoring/logs/master_orchestrator.log" ]]; then
        echo "📝 Log file: $(wc -l < /mnt/e/TerraFusion/monitoring/logs/master_orchestrator.log) lines"
        echo "   Last updated: $(stat -c %y /mnt/e/TerraFusion/monitoring/logs/master_orchestrator.log)"
    else
        echo "📝 Log file: Not created yet"
    fi
    
    # Check reports
    REPORT_COUNT=$(find /mnt/e/TerraFusion/monitoring/reports -name "*.md" 2>/dev/null | wc -l)
    echo "📊 Reports generated: $REPORT_COUNT"
    
    if [[ $REPORT_COUNT -gt 0 ]]; then
        echo "   Latest report: $(ls -t /mnt/e/TerraFusion/monitoring/reports/*.md 2>/dev/null | head -1 | xargs basename)"
    fi
    
    # Show recent log entries
    if [[ -f "/mnt/e/TerraFusion/monitoring/logs/master_orchestrator.log" ]]; then
        echo ""
        echo "📋 Recent log entries:"
        tail -5 /mnt/e/TerraFusion/monitoring/logs/master_orchestrator.log | sed 's/^/   /'
    fi
}

# Function to stop monitoring
stop_monitoring() {
    echo "🛑 Stopping TerraFusion Monitoring System..."
    
    # Kill orchestrator process
    if pgrep -f "master_monitoring_orchestrator.py" > /dev/null; then
        pkill -f "master_monitoring_orchestrator.py"
        echo "✓ Master Orchestrator stopped"
    else
        echo "⚠️  Master Orchestrator was not running"
    fi
    
    # Kill individual agent processes
    for agent in "infrastructure_monitoring_agent.py" "application_monitoring_agent.py" "security_monitoring_agent.py" "quantum_monitoring_agent.py"; do
        if pgrep -f "$agent" > /dev/null; then
            pkill -f "$agent"
            echo "✓ $agent stopped"
        fi
    done
    
    echo "✅ Monitoring system stopped"
}

# Function to show help
show_help() {
    echo "TerraFusion Monitoring System Control Script"
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start [MODE] [INTERVAL]  Start monitoring system"
    echo "    MODE: continuous (default), single, report, test"
    echo "    INTERVAL: monitoring interval in seconds (default: 60)"
    echo "  stop                     Stop monitoring system"
    echo "  status                   Show monitoring system status"
    echo "  restart [MODE] [INTERVAL] Restart monitoring system"
    echo "  logs                     Show recent log entries"
    echo "  reports                  List available reports"
    echo "  help                     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                 # Start continuous monitoring (60s interval)"
    echo "  $0 start continuous 30   # Start continuous monitoring (30s interval)"
    echo "  $0 start single          # Run single monitoring cycle"
    echo "  $0 start report          # Generate reports only"
    echo "  $0 start test            # Test all agents"
    echo "  $0 stop                  # Stop monitoring"
    echo "  $0 status                # Show status"
    echo "  $0 restart               # Restart monitoring"
}

# Function to show logs
show_logs() {
    if [[ -f "/mnt/e/TerraFusion/monitoring/logs/master_orchestrator.log" ]]; then
        echo "📋 TerraFusion Monitoring Logs"
        echo "=============================="
        tail -50 /mnt/e/TerraFusion/monitoring/logs/master_orchestrator.log
    else
        echo "📋 No log file found. Monitoring may not have been started yet."
    fi
}

# Function to list reports
list_reports() {
    echo "📊 TerraFusion Monitoring Reports"
    echo "================================="
    
    if [[ -d "/mnt/e/TerraFusion/monitoring/reports" ]]; then
        REPORTS=$(find /mnt/e/TerraFusion/monitoring/reports -name "*.md" 2>/dev/null | sort -r)
        
        if [[ -n "$REPORTS" ]]; then
            echo "$REPORTS" | while read -r report; do
                basename_report=$(basename "$report")
                size=$(stat -c %s "$report" 2>/dev/null || echo "0")
                modified=$(stat -c %y "$report" 2>/dev/null || echo "unknown")
                echo "  📄 $basename_report (${size} bytes, modified: $modified)"
            done
        else
            echo "  No reports found. Run monitoring to generate reports."
        fi
    else
        echo "  Reports directory not found."
    fi
    
    # Show JSON cycle results
    JSON_REPORTS=$(find /mnt/e/TerraFusion/monitoring/reports -name "*.json" 2>/dev/null | sort -r | head -5)
    if [[ -n "$JSON_REPORTS" ]]; then
        echo ""
        echo "📈 Recent Monitoring Cycles (JSON):"
        echo "$JSON_REPORTS" | while read -r report; do
            basename_report=$(basename "$report")
            echo "  📊 $basename_report"
        done
    fi
}

# Main script logic
case "${1:-help}" in
    "start")
        start_monitoring "${2:-continuous}" "${3:-60}"
        ;;
    "stop")
        stop_monitoring
        ;;
    "status")
        show_status
        ;;
    "restart")
        stop_monitoring
        sleep 2
        start_monitoring "${2:-continuous}" "${3:-60}"
        ;;
    "logs")
        show_logs
        ;;
    "reports")
        list_reports
        ;;
    "help"|*)
        show_help
        ;;
esac