#!/bin/bash
#
# TerraFusion Advanced API Gateway and Rate Limiting System
# Comprehensive API management with intelligent rate limiting and traffic control
#
# Usage: ./api-gateway.sh [options]
# Options:
#   -a    Action (start|stop|reload|status|configure|monitor)
#   -p    Port (default: 8080)
#   -c    Configuration file
#   -r    Rate limit (requests per minute)
#   -t    Throttling mode (soft|hard|adaptive)
#   -m    Monitoring enabled
#   -s    SSL/TLS enabled

set -euo pipefail

# Configuration
ACTION="status"
GATEWAY_PORT=8080
CONFIG_FILE="/etc/terrafusion/api-gateway.conf"
RATE_LIMIT=1000
THROTTLING_MODE="adaptive"
MONITORING_ENABLED=true
SSL_ENABLED=true
GATEWAY_DIR="/opt/terrafusion/api-gateway"
LOG_FILE="/var/log/terrafusion/api_gateway_$(date +%Y%m%d_%H%M%S).log"
PID_FILE="/var/run/terrafusion/api-gateway.pid"

# Rate limiting configuration
RATE_LIMIT_WINDOW=60
BURST_LIMIT=100
BLACKLIST_THRESHOLD=10000
WHITELIST_FILE="/etc/terrafusion/api-whitelist.conf"
BLACKLIST_FILE="/etc/terrafusion/api-blacklist.conf"

# Load balancing configuration
BACKEND_SERVERS=(
    "backend-1:8001"
    "backend-2:8001"
    "backend-3:8001"
)
HEALTH_CHECK_INTERVAL=30
HEALTH_CHECK_TIMEOUT=5

# Security configuration
WAF_ENABLED=true
DDoS_PROTECTION=true
IP_GEOBLOCKING=false
BOT_PROTECTION=true

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create directories
mkdir -p "$GATEWAY_DIR"
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$PID_FILE")"

# Parse arguments
while getopts "a:p:c:r:t:ms" opt; do
    case $opt in
        a) ACTION="$OPTARG" ;;
        p) GATEWAY_PORT="$OPTARG" ;;
        c) CONFIG_FILE="$OPTARG" ;;
        r) RATE_LIMIT="$OPTARG" ;;
        t) THROTTLING_MODE="$OPTARG" ;;
        m) MONITORING_ENABLED=true ;;
        s) SSL_ENABLED=true ;;
        *) echo "Usage: $0 [-a action] [-p port] [-c config] [-r rate] [-t mode] [-m] [-s]"; exit 1 ;;
    esac
done

# Data structures
declare -A RATE_LIMIT_COUNTERS
declare -A CLIENT_STATS
declare -A BACKEND_HEALTH
declare -A API_METRICS
declare -A BLOCKED_IPS

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

# Generate API Gateway configuration
generate_gateway_config() {
    log "Generating API Gateway configuration..."
    
    cat > "$CONFIG_FILE" << EOF
# TerraFusion API Gateway Configuration
# Generated on $(date)

# Gateway Settings
listen_port = $GATEWAY_PORT
ssl_enabled = $SSL_ENABLED
ssl_cert_path = /etc/ssl/certs/terrafusion.crt
ssl_key_path = /etc/ssl/private/terrafusion.key

# Rate Limiting
rate_limit_enabled = true
rate_limit_requests_per_minute = $RATE_LIMIT
rate_limit_window = $RATE_LIMIT_WINDOW
burst_limit = $BURST_LIMIT
throttling_mode = $THROTTLING_MODE

# Backend Servers
$(printf 'backend_server = %s\n' "${BACKEND_SERVERS[@]}")

# Health Checks
health_check_enabled = true
health_check_interval = $HEALTH_CHECK_INTERVAL
health_check_timeout = $HEALTH_CHECK_TIMEOUT
health_check_path = /health

# Security
waf_enabled = $WAF_ENABLED
ddos_protection = $DDoS_PROTECTION
ip_geoblocking = $IP_GEOBLOCKING
bot_protection = $BOT_PROTECTION

# Monitoring
monitoring_enabled = $MONITORING_ENABLED
metrics_endpoint = /metrics
metrics_port = 9090

# Logging
log_level = INFO
log_file = $LOG_FILE
access_log_enabled = true
access_log_format = combined

# Caching
cache_enabled = true
cache_ttl = 300
cache_max_size = 1GB

# Compression
compression_enabled = true
compression_types = text/html,text/css,text/javascript,application/json,application/xml

EOF
    
    log_success "Configuration generated: $CONFIG_FILE"
}

# Start API Gateway
start_gateway() {
    log "Starting TerraFusion API Gateway..."
    
    if is_gateway_running; then
        log_warning "API Gateway is already running (PID: $(cat "$PID_FILE"))"
        return 0
    fi
    
    # Generate configuration if it doesn't exist
    if [ ! -f "$CONFIG_FILE" ]; then
        generate_gateway_config
    fi
    
    # Check if port is available
    if netstat -tuln 2>/dev/null | grep -q ":$GATEWAY_PORT "; then
        log_error "Port $GATEWAY_PORT is already in use"
        return 1
    fi
    
    # Start the gateway (using nginx as the actual implementation)
    if command -v nginx &> /dev/null; then
        start_nginx_gateway
    else
        # Fallback to simple Python implementation
        start_python_gateway
    fi
}

# Start nginx-based gateway
start_nginx_gateway() {
    log "Starting nginx-based API Gateway..."
    
    # Generate nginx configuration
    local nginx_config="/etc/nginx/sites-available/terrafusion-gateway"
    
    cat > "$nginx_config" << EOF
# TerraFusion API Gateway - Nginx Configuration

upstream terrafusion_backend {
$(for server in "${BACKEND_SERVERS[@]}"; do
    echo "    server $server max_fails=3 fail_timeout=30s;"
done)
    
    # Health check
    keepalive 32;
}

# Rate limiting zones
limit_req_zone \$binary_remote_addr zone=api_rate_limit:10m rate=${RATE_LIMIT}r/m;
limit_req_zone \$binary_remote_addr zone=api_burst:10m rate=${BURST_LIMIT}r/s;

# Connection limiting
limit_conn_zone \$binary_remote_addr zone=api_conn_limit:10m;

server {
    listen $GATEWAY_PORT$([ "$SSL_ENABLED" = true ] && echo " ssl http2" || echo "");
    server_name api.terrafusion.com;
    
    # SSL Configuration
$(if [ "$SSL_ENABLED" = true ]; then
cat << 'SSLEOF'
    ssl_certificate /etc/ssl/certs/terrafusion.crt;
    ssl_certificate_key /etc/ssl/private/terrafusion.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
SSLEOF
fi)
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Rate Limiting
    limit_req zone=api_rate_limit burst=$BURST_LIMIT nodelay;
    limit_req zone=api_burst burst=10 nodelay;
    limit_conn api_conn_limit 20;
    
    # Logging
    access_log /var/log/nginx/terrafusion-gateway-access.log combined;
    error_log /var/log/nginx/terrafusion-gateway-error.log warn;
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Metrics endpoint
    location /metrics {
        access_log off;
        stub_status on;
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        deny all;
    }
    
    # API routes
    location /api/ {
        # Rate limiting with custom response
        limit_req zone=api_rate_limit burst=$BURST_LIMIT nodelay;
        limit_req_status 429;
        
        # CORS headers
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        
        # Proxy settings
        proxy_pass http://terrafusion_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 8k;
        proxy_buffers 8 8k;
        
        # Error handling
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }
    
    # Static files
    location /static/ {
        alias /opt/terrafusion/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip on;
        gzip_types text/css application/javascript application/json;
    }
    
    # Default location
    location / {
        return 404 "Not Found";
    }
    
    # Error pages
    error_page 429 @rate_limit_exceeded;
    error_page 502 503 504 @backend_unavailable;
    
    location @rate_limit_exceeded {
        return 429 '{"error":"Rate limit exceeded","retry_after":60}';
        add_header Content-Type application/json;
    }
    
    location @backend_unavailable {
        return 503 '{"error":"Service temporarily unavailable","retry_after":30}';
        add_header Content-Type application/json;
    }
}
EOF
    
    # Enable the site
    ln -sf "$nginx_config" "/etc/nginx/sites-enabled/terrafusion-gateway"
    
    # Test nginx configuration
    if nginx -t; then
        # Start or reload nginx
        if pgrep nginx > /dev/null; then
            nginx -s reload
            log_success "Nginx API Gateway reloaded"
        else
            nginx
            log_success "Nginx API Gateway started"
        fi
        
        # Store PID
        pgrep nginx | head -1 > "$PID_FILE"
    else
        log_error "Nginx configuration test failed"
        return 1
    fi
}

# Start Python-based gateway (fallback)
start_python_gateway() {
    log "Starting Python-based API Gateway..."
    
    # Create Python gateway script
    local gateway_script="$GATEWAY_DIR/gateway.py"
    
    cat > "$gateway_script" << 'EOF'
#!/usr/bin/env python3
import asyncio
import json
import time
import logging
from datetime import datetime, timedelta
from collections import defaultdict, deque
from typing import Dict, List, Optional
import aiohttp
from aiohttp import web, ClientSession
import aiohttp_cors
import ssl

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(deque)
    
    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        client_requests = self.requests[client_id]
        
        # Remove old requests outside the window
        while client_requests and client_requests[0] <= now - self.window_seconds:
            client_requests.popleft()
        
        # Check if under limit
        if len(client_requests) < self.max_requests:
            client_requests.append(now)
            return True
        
        return False
    
    def get_retry_after(self, client_id: str) -> int:
        client_requests = self.requests[client_id]
        if client_requests:
            oldest_request = client_requests[0]
            return max(0, int(oldest_request + self.window_seconds - time.time()))
        return 0

class HealthChecker:
    def __init__(self, backends: List[str], check_interval: int = 30):
        self.backends = backends
        self.check_interval = check_interval
        self.healthy_backends = set(backends)
        self.last_check = {}
    
    async def check_health(self, backend: str) -> bool:
        try:
            async with ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                async with session.get(f"http://{backend}/health") as response:
                    return response.status == 200
        except Exception:
            return False
    
    async def update_health_status(self):
        for backend in self.backends:
            is_healthy = await self.check_health(backend)
            if is_healthy:
                self.healthy_backends.add(backend)
            else:
                self.healthy_backends.discard(backend)
            self.last_check[backend] = datetime.now()
    
    def get_healthy_backends(self) -> List[str]:
        return list(self.healthy_backends)

class APIGateway:
    def __init__(self, config):
        self.config = config
        self.rate_limiter = RateLimiter(
            config['rate_limit_requests_per_minute'],
            config['rate_limit_window']
        )
        self.health_checker = HealthChecker(
            config['backend_servers'],
            config['health_check_interval']
        )
        self.request_count = 0
        self.start_time = time.time()
        
        # Setup logging
        logging.basicConfig(
            level=getattr(logging, config.get('log_level', 'INFO')),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(config.get('log_file', '/var/log/gateway.log')),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    async def handle_request(self, request):
        self.request_count += 1
        client_ip = request.remote
        
        # Rate limiting
        if not self.rate_limiter.is_allowed(client_ip):
            retry_after = self.rate_limiter.get_retry_after(client_ip)
            return web.json_response(
                {"error": "Rate limit exceeded", "retry_after": retry_after},
                status=429,
                headers={"Retry-After": str(retry_after)}
            )
        
        # Get healthy backend
        healthy_backends = self.health_checker.get_healthy_backends()
        if not healthy_backends:
            return web.json_response(
                {"error": "Service unavailable"},
                status=503
            )
        
        # Simple round-robin load balancing
        backend = healthy_backends[self.request_count % len(healthy_backends)]
        
        # Proxy request
        try:
            async with ClientSession() as session:
                proxy_url = f"http://{backend}{request.path_qs}"
                
                async with session.request(
                    method=request.method,
                    url=proxy_url,
                    headers=request.headers,
                    data=await request.read(),
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    
                    body = await response.read()
                    
                    # Create response with CORS headers
                    resp = web.Response(
                        body=body,
                        status=response.status,
                        headers=response.headers
                    )
                    
                    # Add CORS headers
                    resp.headers['Access-Control-Allow-Origin'] = '*'
                    resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
                    resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
                    
                    return resp
                    
        except Exception as e:
            self.logger.error(f"Proxy error: {e}")
            return web.json_response(
                {"error": "Backend error"},
                status=502
            )
    
    async def handle_health(self, request):
        return web.json_response({"status": "healthy", "uptime": time.time() - self.start_time})
    
    async def handle_metrics(self, request):
        healthy_backends = len(self.health_checker.get_healthy_backends())
        total_backends = len(self.health_checker.backends)
        
        metrics = {
            "requests_total": self.request_count,
            "uptime_seconds": time.time() - self.start_time,
            "healthy_backends": healthy_backends,
            "total_backends": total_backends,
            "rate_limit_requests_per_minute": self.config['rate_limit_requests_per_minute']
        }
        
        return web.json_response(metrics)
    
    async def handle_options(self, request):
        return web.Response(
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            }
        )
    
    async def start_background_tasks(self):
        """Start background tasks like health checking"""
        while True:
            await self.health_checker.update_health_status()
            await asyncio.sleep(self.health_checker.check_interval)
    
    def create_app(self):
        app = web.Application()
        
        # Add routes
        app.router.add_route('*', '/health', self.handle_health)
        app.router.add_route('*', '/metrics', self.handle_metrics)
        app.router.add_route('OPTIONS', '/{path:.*}', self.handle_options)
        app.router.add_route('*', '/{path:.*}', self.handle_request)
        
        # Setup CORS
        cors = aiohttp_cors.setup(app, defaults={
            "*": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
                allow_methods="*"
            )
        })
        
        for route in list(app.router.routes()):
            cors.add(route)
        
        return app

def load_config():
    # Default configuration
    return {
        'listen_port': 8080,
        'rate_limit_requests_per_minute': 1000,
        'rate_limit_window': 60,
        'backend_servers': ['localhost:8001', 'localhost:8002'],
        'health_check_interval': 30,
        'log_level': 'INFO',
        'log_file': '/var/log/terrafusion/api-gateway.log'
    }

async def main():
    config = load_config()
    gateway = APIGateway(config)
    app = gateway.create_app()
    
    # Start background tasks
    asyncio.create_task(gateway.start_background_tasks())
    
    # Start server
    runner = web.AppRunner(app)
    await runner.setup()
    
    site = web.TCPSite(runner, '0.0.0.0', config['listen_port'])
    await site.start()
    
    print(f"API Gateway started on port {config['listen_port']}")
    
    # Keep running
    try:
        await asyncio.Future()  # Run forever
    except KeyboardInterrupt:
        print("Shutting down...")
    finally:
        await runner.cleanup()

if __name__ == '__main__':
    asyncio.run(main())
EOF
    
    # Make script executable
    chmod +x "$gateway_script"
    
    # Start the gateway in background
    python3 "$gateway_script" &
    local gateway_pid=$!
    
    # Store PID
    echo "$gateway_pid" > "$PID_FILE"
    
    log_success "Python API Gateway started (PID: $gateway_pid)"
}

# Stop API Gateway
stop_gateway() {
    log "Stopping TerraFusion API Gateway..."
    
    if ! is_gateway_running; then
        log_warning "API Gateway is not running"
        return 0
    fi
    
    local pid=$(cat "$PID_FILE")
    
    # Try graceful shutdown first
    if kill -TERM "$pid" 2>/dev/null; then
        log_info "Sent TERM signal to API Gateway (PID: $pid)"
        
        # Wait for graceful shutdown
        local count=0
        while [ $count -lt 10 ] && kill -0 "$pid" 2>/dev/null; do
            sleep 1
            ((count++))
        done
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            log_warning "Graceful shutdown failed, forcing termination"
            kill -KILL "$pid" 2>/dev/null || true
        fi
    fi
    
    # Clean up PID file
    rm -f "$PID_FILE"
    
    log_success "API Gateway stopped"
}

# Check if gateway is running
is_gateway_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        else
            # Stale PID file
            rm -f "$PID_FILE"
        fi
    fi
    return 1
}

# Reload gateway configuration
reload_gateway() {
    log "Reloading API Gateway configuration..."
    
    if ! is_gateway_running; then
        log_error "API Gateway is not running"
        return 1
    fi
    
    # Regenerate configuration
    generate_gateway_config
    
    # Send reload signal
    local pid=$(cat "$PID_FILE")
    
    if command -v nginx &> /dev/null && pgrep nginx > /dev/null; then
        # Nginx reload
        nginx -s reload
        log_success "Nginx configuration reloaded"
    else
        # For Python gateway, restart is needed
        log_info "Restarting Python gateway for configuration reload"
        stop_gateway
        sleep 2
        start_gateway
    fi
}

# Get gateway status
get_gateway_status() {
    log "Checking API Gateway status..."
    
    if is_gateway_running; then
        local pid=$(cat "$PID_FILE")
        local uptime=$(ps -o etime= -p "$pid" 2>/dev/null | xargs || echo "unknown")
        
        log_success "API Gateway is running (PID: $pid, Uptime: $uptime)"
        
        # Check if port is responding
        if command -v curl &> /dev/null; then
            local health_url="http://localhost:$GATEWAY_PORT/health"
            
            if curl -sf "$health_url" &>/dev/null; then
                log_success "Health check passed: $health_url"
            else
                log_warning "Health check failed: $health_url"
            fi
        fi
        
        # Show backend status
        check_backend_health
        
        return 0
    else
        log_error "API Gateway is not running"
        return 1
    fi
}

# Check backend health
check_backend_health() {
    log "Checking backend server health..."
    
    for backend in "${BACKEND_SERVERS[@]}"; do
        local host=$(echo "$backend" | cut -d':' -f1)
        local port=$(echo "$backend" | cut -d':' -f2)
        local health_url="http://${backend}/health"
        
        if command -v curl &> /dev/null; then
            if curl -sf --connect-timeout 5 "$health_url" &>/dev/null; then
                log_success "Backend healthy: $backend"
                BACKEND_HEALTH["$backend"]="healthy"
            else
                log_error "Backend unhealthy: $backend"
                BACKEND_HEALTH["$backend"]="unhealthy"
            fi
        else
            # Use netcat as fallback
            if nc -z "$host" "$port" 2>/dev/null; then
                log_success "Backend reachable: $backend"
                BACKEND_HEALTH["$backend"]="reachable"
            else
                log_error "Backend unreachable: $backend"
                BACKEND_HEALTH["$backend"]="unreachable"
            fi
        fi
    done
}

# Monitor gateway performance
monitor_gateway() {
    log "Starting API Gateway monitoring..."
    
    if ! is_gateway_running; then
        log_error "API Gateway is not running"
        return 1
    fi
    
    local monitoring_duration=300  # 5 minutes
    local check_interval=10        # 10 seconds
    local iterations=$((monitoring_duration / check_interval))
    
    log_info "Monitoring for $monitoring_duration seconds (checking every $check_interval seconds)"
    
    for ((i=1; i<=iterations; i++)); do
        log_info "Monitor check $i/$iterations"
        
        # Get metrics if available
        if command -v curl &> /dev/null; then
            local metrics_url="http://localhost:$GATEWAY_PORT/metrics"
            
            if metrics=$(curl -sf "$metrics_url" 2>/dev/null); then
                log_info "Gateway metrics: $metrics"
            fi
        fi
        
        # Check system resources
        if command -v top &> /dev/null; then
            local pid=$(cat "$PID_FILE")
            local cpu_usage=$(top -bn1 -p "$pid" 2>/dev/null | tail -1 | awk '{print $9}' || echo "0")
            local mem_usage=$(top -bn1 -p "$pid" 2>/dev/null | tail -1 | awk '{print $10}' || echo "0")
            
            log_info "Resource usage - CPU: ${cpu_usage}%, Memory: ${mem_usage}%"
        fi
        
        # Check connection count
        local connections=$(netstat -an 2>/dev/null | grep ":$GATEWAY_PORT " | wc -l || echo "0")
        log_info "Active connections: $connections"
        
        sleep $check_interval
    done
    
    log_success "Gateway monitoring completed"
}

# Configure rate limiting
configure_rate_limiting() {
    log "Configuring rate limiting..."
    
    # Update whitelist
    if [ -f "$WHITELIST_FILE" ]; then
        log_info "Loading IP whitelist from: $WHITELIST_FILE"
        while IFS= read -r ip; do
            if [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                log_info "Whitelisted IP: $ip"
            fi
        done < "$WHITELIST_FILE"
    else
        # Create default whitelist
        cat > "$WHITELIST_FILE" << EOF
# TerraFusion API Gateway IP Whitelist
# Add trusted IP addresses or CIDR blocks
127.0.0.1
10.0.0.0/8
172.16.0.0/12
192.168.0.0/16
EOF
        log_info "Created default whitelist: $WHITELIST_FILE"
    fi
    
    # Update blacklist
    if [ -f "$BLACKLIST_FILE" ]; then
        log_info "Loading IP blacklist from: $BLACKLIST_FILE"
        while IFS= read -r ip; do
            if [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                BLOCKED_IPS["$ip"]="blacklisted"
                log_warning "Blacklisted IP: $ip"
            fi
        done < "$BLACKLIST_FILE"
    else
        # Create empty blacklist
        touch "$BLACKLIST_FILE"
        log_info "Created empty blacklist: $BLACKLIST_FILE"
    fi
    
    log_success "Rate limiting configuration updated"
}

# Generate monitoring report
generate_monitoring_report() {
    local report_file="/var/reports/api-gateway/gateway_report_$(date +%Y%m%d_%H%M%S).html"
    local report_dir=$(dirname "$report_file")
    
    mkdir -p "$report_dir"
    
    log "Generating API Gateway monitoring report..."
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion API Gateway Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .status-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 20px; }
        .status-card.warning { border-left-color: #ffc107; }
        .status-card.error { border-left-color: #dc3545; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .healthy { color: #28a745; font-weight: bold; }
        .unhealthy { color: #dc3545; font-weight: bold; }
        .config-item { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 4px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 API Gateway Report</h1>
            <p>TerraFusion API Gateway Status and Configuration</p>
            <p>Generated: $(date)</p>
        </div>
        
        <div class="status-card $(is_gateway_running && echo "" || echo "error")">
            <h3>Gateway Status</h3>
            <p><strong>Status:</strong> $(is_gateway_running && echo "Running" || echo "Stopped")</p>
            <p><strong>Port:</strong> $GATEWAY_PORT</p>
            <p><strong>SSL Enabled:</strong> $SSL_ENABLED</p>
            <p><strong>PID:</strong> $([ -f "$PID_FILE" ] && cat "$PID_FILE" || echo "N/A")</p>
        </div>
        
        <div class="section">
            <h2>Backend Health Status</h2>
            <table>
                <thead>
                    <tr>
                        <th>Backend Server</th>
                        <th>Status</th>
                        <th>Last Check</th>
                    </tr>
                </thead>
                <tbody>
EOF
    
    # Add backend health status
    for backend in "${BACKEND_SERVERS[@]}"; do
        local status="${BACKEND_HEALTH[$backend]:-unknown}"
        local status_class=$([ "$status" = "healthy" ] && echo "healthy" || echo "unhealthy")
        
        cat >> "$report_file" << EOF
                    <tr>
                        <td>$backend</td>
                        <td class="$status_class">$status</td>
                        <td>$(date)</td>
                    </tr>
EOF
    done
    
    cat >> "$report_file" << EOF
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>Rate Limiting Configuration</h2>
            <div class="config-item">Rate Limit: $RATE_LIMIT requests per minute</div>
            <div class="config-item">Burst Limit: $BURST_LIMIT requests</div>
            <div class="config-item">Throttling Mode: $THROTTLING_MODE</div>
            <div class="config-item">Blacklist Threshold: $BLACKLIST_THRESHOLD requests</div>
        </div>
        
        <div class="section">
            <h2>Security Configuration</h2>
            <table>
                <tr><th>Feature</th><th>Status</th></tr>
                <tr><td>WAF Protection</td><td>$([ "$WAF_ENABLED" = true ] && echo "Enabled" || echo "Disabled")</td></tr>
                <tr><td>DDoS Protection</td><td>$([ "$DDoS_PROTECTION" = true ] && echo "Enabled" || echo "Disabled")</td></tr>
                <tr><td>IP Geoblocking</td><td>$([ "$IP_GEOBLOCKING" = true ] && echo "Enabled" || echo "Disabled")</td></tr>
                <tr><td>Bot Protection</td><td>$([ "$BOT_PROTECTION" = true ] && echo "Enabled" || echo "Disabled")</td></tr>
            </table>
        </div>
        
        <div class="section">
            <h2>Configuration Files</h2>
            <div class="config-item">Gateway Config: $CONFIG_FILE</div>
            <div class="config-item">Whitelist: $WHITELIST_FILE</div>
            <div class="config-item">Blacklist: $BLACKLIST_FILE</div>
            <div class="config-item">Log File: $LOG_FILE</div>
            <div class="config-item">PID File: $PID_FILE</div>
        </div>
        
        <div class="section">
            <h2>Recommendations</h2>
            <ul>
                $([ ${#BACKEND_HEALTH[@]} -eq 0 ] && echo "<li>Configure backend health monitoring</li>")
                $([ ! -f "$WHITELIST_FILE" ] && echo "<li>Create IP whitelist for trusted sources</li>")
                $([ "$SSL_ENABLED" = false ] && echo "<li>Enable SSL/TLS for secure communications</li>")
                <li>Monitor rate limiting effectiveness and adjust thresholds as needed</li>
                <li>Review and update security configurations regularly</li>
                <li>Implement automated alerting for gateway failures</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p><strong>📞 Support:</strong> For API Gateway issues, contact devops@terrafusion.com</p>
            <p><small>Report generated by TerraFusion API Gateway Management System</small></p>
        </div>
    </div>
</body>
</html>
EOF
    
    log_success "Monitoring report generated: $report_file"
    echo "$report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion API Gateway Management"
    log "Action: $ACTION"
    log "Port: $GATEWAY_PORT"
    log "Rate Limit: $RATE_LIMIT/min"
    log "Throttling Mode: $THROTTLING_MODE"
    log "========================================="
    
    case $ACTION in
        start)
            start_gateway
            ;;
        stop)
            stop_gateway
            ;;
        restart)
            stop_gateway
            sleep 2
            start_gateway
            ;;
        reload)
            reload_gateway
            ;;
        status)
            get_gateway_status
            ;;
        configure)
            generate_gateway_config
            configure_rate_limiting
            ;;
        monitor)
            monitor_gateway
            ;;
        report)
            generate_monitoring_report
            ;;
        *)
            log_error "Invalid action: $ACTION"
            echo "Valid actions: start, stop, restart, reload, status, configure, monitor, report"
            exit 1
            ;;
    esac
    
    log "API Gateway management completed: $ACTION"
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Handle interrupts
trap 'log_error "API Gateway management interrupted!"; exit 1' INT TERM

# Run main function
main