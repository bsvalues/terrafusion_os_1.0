#!/usr/bin/env bash
# TerraFusionPro Smoke Test Script
# Enhanced version with retries and waiting for services

# Set default timeout values
MAX_RETRIES=${MAX_RETRIES:-10}
RETRY_INTERVAL=${RETRY_INTERVAL:-3}
BATCH_TIMEOUT=${BATCH_TIMEOUT:-30}

# Set colors for better readability
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Allow the script to continue even when a service is not healthy
# set -e

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}       TerraFusionPro Platform Smoke Tests          ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo -e "Starting smoke tests with max ${MAX_RETRIES} retries, ${RETRY_INTERVAL}s interval..."
echo ""

# Define an array of existing core services
CORE_SERVICES=(
  "api-gateway:5002"
  "user-service:5004"
  "property-service:5003"
  "form-service:5005"
  "analysis-service:5006"
  "report-service:5007"
)

# Define Apollo Federation Gateway
GATEWAY_SERVICES=(
  "apollo-health:4001" # Health check endpoint (separate port)
)

# Define external integrated services
EXTERNAL_SERVICES=(
  "terrafusionsync:3001" 
  "terrafusionpro:3002" 
  "terraflow:3003" 
  "terraminer:3004" 
  "terraagent:3005"
  "terraf:3006" 
  "terralegislativepulsepub:3007" 
  "bcbscostapp:3008" 
  "bcbsgeoassessmentpro:3009"
  "bcbslevy:3010" 
  "bcbswebhub:3011" 
  "bcbsdataengine:3012" 
  "bcbspacsmapping:3013"
  "geoassessmentpro:3014" 
  "bsbcmaster:3015" 
  "bsincomevaluation:3016" 
  "terrafusionmockup:3017"
)

# Track successes and failures
SUCCESS_COUNT=0
FAILURE_COUNT=0
FAILED_SERVICES=()

# Function to check if a TCP port is open
check_port_open() {
  local host=$1
  local port=$2
  (echo > /dev/tcp/$host/$port) >/dev/null 2>&1
  return $?
}

# Test a service with retries
test_service() {
  local service_name=$1
  local port=$2
  local category=$3
  local retry_count=0
  local success=false
  
  echo -e "${BLUE}Testing ${service_name} (${category}) on port ${port}...${NC}"
  
  # First check if the port is even open
  if ! check_port_open "localhost" "$port"; then
    echo -e "  ${YELLOW}Port $port is not open. Checking if service is starting...${NC}"
  fi

  # Try multiple times with delay
  while [ $retry_count -lt $MAX_RETRIES ]; do
    # Try to access the health endpoint
    if [[ "$service_name" == "api-gateway" ]]; then
      HTTP_ENDPOINT="http://localhost:$port/api/health"
    elif [[ "$service_name" == "apollo-federation-gateway" ]]; then
      # For Apollo Gateway, we check the GraphQL endpoint
      HTTP_ENDPOINT="http://localhost:$port/"
    elif [[ "$service_name" == "apollo-health" ]]; then
      # For Apollo Health, we use the dedicated health port
      HTTP_ENDPOINT="http://localhost:$port/health"
    else
      HTTP_ENDPOINT="http://localhost:$port/health"
    fi
    
    echo -e "  Attempt $(($retry_count+1))/$MAX_RETRIES: Checking $HTTP_ENDPOINT"
    
    # Use a timeout with curl to avoid hanging too long
    HTTP_STATUS=$(curl -s -m 5 -o /tmp/curl_output.txt -w "%{http_code}" $HTTP_ENDPOINT 2>/dev/null || echo "000")
    
    if [[ "$HTTP_STATUS" == "200" ]]; then
      echo -e "  ${GREEN}✅ $service_name is healthy (HTTP 200)${NC}"
      
      # Show first few lines of response if it's not huge
      if [[ -s /tmp/curl_output.txt ]]; then
        response_size=$(wc -c < /tmp/curl_output.txt)
        if [[ $response_size -lt 500 ]]; then
          echo -e "  Response: $(cat /tmp/curl_output.txt)"
        else
          echo -e "  Response received ($(($response_size / 1024))KB)"
        fi
      fi
      
      ((SUCCESS_COUNT++))
      success=true
      break
    elif [[ $retry_count -eq $(($MAX_RETRIES-1)) ]]; then
      # Last attempt failed
      if [[ "$category" == "external" ]]; then
        echo -e "  ${YELLOW}⚠️ $service_name is not available (HTTP $HTTP_STATUS) - expected for external services${NC}"
      else
        echo -e "  ${RED}❌ $service_name is not healthy after $MAX_RETRIES attempts (HTTP $HTTP_STATUS)${NC}"
        ((FAILURE_COUNT++))
        FAILED_SERVICES+=("$service_name")
      fi
    else
      # Still have more retries
      echo -e "  ${YELLOW}Service not ready (HTTP $HTTP_STATUS), retrying in ${RETRY_INTERVAL}s...${NC}"
      sleep $RETRY_INTERVAL
    fi
    
    ((retry_count++))
  done
  
  # Clean up
  rm -f /tmp/curl_output.txt
  
  if [[ "$success" == "true" ]]; then
    return 0
  else
    return 1
  fi
}

# Function to test a group of services
test_service_group() {
  local group_name=$1
  local category=$2
  local services=("${!3}")
  local start_time=$(date +%s)
  local services_tested=0
  local services_passed=0
  
  echo -e "\n${BLUE}===== Testing $group_name ($category) =====${NC}"
  
  for service_info in "${services[@]}"; do
    service_name="${service_info%%:*}"
    port="${service_info##*:}"
    
    if test_service "$service_name" "$port" "$category"; then
      ((services_passed++))
    fi
    ((services_tested++))
    
    # Check if we've hit the batch timeout
    local current_time=$(date +%s)
    local elapsed=$((current_time - start_time))
    if [ $elapsed -gt $BATCH_TIMEOUT ]; then
      echo -e "${YELLOW}Batch timeout reached ($BATCH_TIMEOUT seconds), continuing to next group${NC}"
      break
    fi
  done
  
  echo -e "${BLUE}Completed testing $group_name: $services_passed/$services_tested services healthy${NC}"
}

# Test all service groups
echo -e "${BLUE}Starting service health checks...${NC}"

# Core services (expected to be running)
test_service_group "Core Services" "core" CORE_SERVICES[@]

# Gateway services
test_service_group "GraphQL Gateway" "gateway" GATEWAY_SERVICES[@]

# External services (not expected to be running yet)
test_service_group "Integrated Applications" "external" EXTERNAL_SERVICES[@]

# Calculate total services tested
CORE_COUNT=${#CORE_SERVICES[@]}
GATEWAY_COUNT=${#GATEWAY_SERVICES[@]}
EXTERNAL_COUNT=${#EXTERNAL_SERVICES[@]}
TOTAL_SERVICES=$((CORE_COUNT + GATEWAY_COUNT + EXTERNAL_COUNT))
REQUIRED_SERVICES=$((CORE_COUNT + GATEWAY_COUNT))

# Display summary
echo ""
echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}               SMOKE TEST SUMMARY                   ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo -e "Total services checked:     ${TOTAL_SERVICES}"
echo -e "Required services:          ${REQUIRED_SERVICES}"
echo -e "Healthy services:           ${GREEN}${SUCCESS_COUNT}${NC}"

if [ $FAILURE_COUNT -gt 0 ]; then
  echo -e "Unhealthy required services: ${RED}${FAILURE_COUNT}${NC}"
  echo ""
  echo -e "${RED}Failed services:${NC}"
  for service in "${FAILED_SERVICES[@]}"; do
    echo -e "  - ${RED}${service}${NC}"
  done
  
  echo ""
  echo -e "${RED}❌ SMOKE TESTS FAILED${NC}"
  echo -e "${YELLOW}Possible issues:${NC}"
  echo -e "  1. Not all services are running - start them with 'npm run start-all'"
  echo -e "  2. Some services don't have /health endpoints - add them to each service"
  echo -e "  3. Network issues are preventing communication - check for port conflicts"
  echo ""
  echo -e "Run with longer timeouts: MAX_RETRIES=20 RETRY_INTERVAL=5 ./smoke-test.sh"
  exit 1
else
  echo ""
  echo -e "${GREEN}✅ ALL REQUIRED SERVICES HEALTHY${NC}"
  
  # Check if we have any external services running
  EXTERNAL_UP=$((SUCCESS_COUNT - REQUIRED_SERVICES))
  if [ $EXTERNAL_UP -gt 0 ]; then
    echo -e "${GREEN}Found ${EXTERNAL_UP} integrated applications running${NC}"
  else
    echo -e "${YELLOW}No integrated applications detected${NC}"
    echo -e "To start them, use: npx nx run-many --target=serve --projects=<app-name>"
  fi
  
  echo ""
  echo -e "${BLUE}TerraFusionPro platform is ready! 🚀${NC}"
  exit 0
fi