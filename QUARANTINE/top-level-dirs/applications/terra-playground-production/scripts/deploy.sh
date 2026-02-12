#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
ENV_FILE=".env"
NGINX_SSL_DIR="./nginx/ssl"
CERT_FILE="$NGINX_SSL_DIR/cert.pem"
KEY_FILE="$NGINX_SSL_DIR/key.pem"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

# --- Helper Functions ---
log_info() {
  echo -e "\e[32mINFO:\e[0m $1"
}

log_error() {
  echo -e "\e[31mERROR:\e[0m $1" >&2
}

check_dependency() {
  command -v $1 >/dev/null 2>&1 || { log_error "$1 is not installed. Please install it to proceed."; exit 1; }
}

verify_env_vars() {
  log_info "Verifying required environment variables..."
  if [ ! -f "$ENV_FILE" ]; then
    log_error "$ENV_FILE not found. Please create it based on .env.example."
    exit 1
  fi
  # Add specific checks for critical variables if needed, e.g.:
  # grep -q "DB_HOST=" "$ENV_FILE" || { log_error "DB_HOST not set in $ENV_FILE"; exit 1; }
  log_info "Environment variables check passed."
}

verify_ssl_certs() {
  log_info "Verifying SSL certificates..."
  if [ ! -d "$NGINX_SSL_DIR" ]; then
    log_error "Nginx SSL directory '$NGINX_SSL_DIR' not found. Please create it."
    exit 1
  fi
  if [ ! -f "$CERT_FILE" ]; then
    log_error "SSL certificate '$CERT_FILE' not found. Please place your cert.pem in $NGINX_SSL_DIR."
    exit 1
  fi
  if [ ! -f "$KEY_FILE" ]; then
    log_error "SSL key '$KEY_FILE' not found. Please place your key.pem in $NGINX_SSL_DIR."
    exit 1
  fi
  log_info "SSL certificates check passed."
}

# --- Main Deployment Steps ---
log_info "Starting TerraFusion Civil Infrastructure Brain deployment..."

# 1. Check Dependencies
check_dependency "docker"
check_dependency "docker-compose"
check_dependency "bash"

# 2. Verify Environment and SSL
verify_env_vars
verify_ssl_certs

# 3. Build Docker Images
log_info "Building Docker images..."
docker-compose -f "$DOCKER_COMPOSE_FILE" build || { log_error "Docker image build failed. Check your Dockerfiles and network connectivity."; exit 1; }
log_info "Docker images built successfully."

# 4. Start Services
log_info "Starting Docker services..."
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d || { log_error "Failed to start Docker services. Check logs for details."; exit 1; }
log_info "Docker services started successfully in detached mode."

# 5. Post-Deployment Verification (Basic Health Checks)
log_info "Performing post-deployment health checks..."
sleep 10 # Give services a moment to start up

# Example health check for a web service (adjust service_name and port/path)
# Replace 'your_web_service' and '80' with actual service and port
# docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q 'your_web_service.*Up' || { log_error "Web service not running."; exit 1; }
# curl -sS http://localhost:80/health || { log_error "Web service health check failed."; exit 1; }

# For a more robust check, iterate through services
SERVICES=$(docker-compose -f "$DOCKER_COMPOSE_FILE" config --services)
for service in $SERVICES; do
  log_info "Checking health of service: $service"
  # This is a generic check for container status.
  # For specific service health, add `curl` or `exec` commands here.
  # Example: if [[ "$service" == "frontend" ]]; then curl -f http://localhost:3000/health || { log_error "Frontend health check failed!"; exit 1; }; fi
  docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q "$service" | xargs docker inspect --format='{{.State.Health.Status}}' | grep -q 'healthy' || \
  docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q "$service" | xargs docker inspect --format='{{.State.Status}}' | grep -q 'running' || { log_error "Service '$service' is not healthy/running."; exit 1; }
done
log_info "All services appear to be healthy and running."

log_info "TerraFusion Civil Infrastructure Brain deployed successfully!"
log_info "You can now access your application. Refer to documentation for exact URL."
log_info "To check logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f [service_name]"
log_info "To stop services: docker-compose -f $DOCKER_COMPOSE_FILE down" 