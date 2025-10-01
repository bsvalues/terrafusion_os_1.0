#!/bin/bash

# 🚀 TerraFusion Swarm Enhancement Deployment Script
# Transforms 50,000 agents from workers to civilization engine

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SWARM_MODE=${1:-"full-throttle"}
TARGET_AGENTS=${2:-"50000"}
API_ENDPOINT="http://localhost:5046/api/swarm-orchestration"

echo -e "${PURPLE}🚀 TerraFusion Swarm Enhancement Deployment${NC}"
echo -e "${BLUE}Mode: ${SWARM_MODE}${NC}"
echo -e "${BLUE}Target Agents: ${TARGET_AGENTS}${NC}"
echo -e "${YELLOW}Government. Transcended.${NC}"
echo ""

# Function to check API health
check_api_health() {
    echo -e "${BLUE}🔍 Checking TerraFusion API health...${NC}"
    
    if curl -s -f "${API_ENDPOINT}/status" > /dev/null; then
        echo -e "${GREEN}✅ API is healthy${NC}"
    else
        echo -e "${RED}❌ API is not responding${NC}"
        echo -e "${YELLOW}Starting TerraFusion API...${NC}"
        # Start API in background if not running
        cd ../backend/TerraFusion.API
        dotnet run --urls=http://localhost:5046 &
        sleep 10
        cd ../../scripts
    fi
}

# Function to activate full-throttle mode
activate_full_throttle() {
    echo -e "${PURPLE}⚡ ACTIVATING FULL-THROTTLE MODE${NC}"
    
    response=$(curl -s -X POST "${API_ENDPOINT}/full-throttle" \
        -H "Content-Type: application/json" \
        -w "%{http_code}")
    
    if [[ $response == *"200"* ]]; then
        echo -e "${GREEN}🚀 FULL-THROTTLE MODE ACTIVATED${NC}"
        echo -e "${GREEN}   50,000 agents deployed as civilization engine${NC}"
    else
        echo -e "${RED}❌ Full-throttle activation failed${NC}"
        exit 1
    fi
}

# Function to deploy playbook registry
deploy_playbooks() {
    echo -e "${BLUE}📋 Deploying Playbook Registry...${NC}"
    
    # Core county workflows
    playbooks=(
        "property_valuation_complete"
        "appeal_processing_complete"
        "citizen_service_request"
        "permit_application_process"
        "tax_collection_workflow"
        "gis_data_update"
        "public_records_request"
    )
    
    for playbook in "${playbooks[@]}"; do
        echo -e "${YELLOW}   Deploying: ${playbook}${NC}"
        
        # Execute playbook with test parameters
        curl -s -X POST "${API_ENDPOINT}/playbooks/${playbook}/execute" \
            -H "Content-Type: application/json" \
            -d '{"test": true, "mode": "validation"}' > /dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}   ✅ ${playbook} deployed${NC}"
        else
            echo -e "${RED}   ❌ ${playbook} deployment failed${NC}"
        fi
    done
}

# Function to initialize knowledge pools
initialize_knowledge_pools() {
    echo -e "${BLUE}🧠 Initializing Hive-Mind Knowledge Pools...${NC}"
    
    domains=(
        "gis_analytics"
        "valuation_heuristics"
        "procurement_law"
        "ui_ux_patterns"
        "citizen_services"
        "government_compliance"
    )
    
    for domain in "${domains[@]}"; do
        echo -e "${YELLOW}   Initializing: ${domain}${NC}"
        
        response=$(curl -s "${API_ENDPOINT}/knowledge/${domain}")
        
        if [[ $response == *"domain"* ]]; then
            echo -e "${GREEN}   ✅ ${domain} pool initialized${NC}"
        else
            echo -e "${RED}   ❌ ${domain} pool initialization failed${NC}"
        fi
    done
}

# Function to activate golden paths
activate_golden_paths() {
    echo -e "${BLUE}🌟 Activating Golden Path Automation...${NC}"
    
    paths=(
        "parcel_edit_to_resolution"
        "citizen_request_to_completion"
        "appeal_to_final_decision"
        "permit_to_approval"
    )
    
    for path in "${paths[@]}"; do
        echo -e "${YELLOW}   Activating: ${path}${NC}"
        
        curl -s -X POST "${API_ENDPOINT}/golden-paths/${path}/execute" \
            -H "Content-Type: application/json" \
            -d '{"test": true, "mode": "validation"}' > /dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}   ✅ ${path} activated${NC}"
        else
            echo -e "${RED}   ❌ ${path} activation failed${NC}"
        fi
    done
}

# Function to test citizen micro-agents
test_citizen_agents() {
    echo -e "${BLUE}👤 Testing Citizen Micro-Agents...${NC}"
    
    test_queries=(
        "Where is my property tax appeal?"
        "How do I apply for a building permit?"
        "What is my property's current assessed value?"
        "When is the next county commission meeting?"
    )
    
    for query in "${test_queries[@]}"; do
        echo -e "${YELLOW}   Testing: ${query}${NC}"
        
        response=$(curl -s -X POST "${API_ENDPOINT}/citizen-query" \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"${query}\", \"citizenId\": \"test-citizen-001\"}")
        
        if [[ $response == *"success"* ]]; then
            echo -e "${GREEN}   ✅ Query processed successfully${NC}"
        else
            echo -e "${RED}   ❌ Query processing failed${NC}"
        fi
    done
}

# Function to check market intelligence
check_market_intelligence() {
    echo -e "${BLUE}📊 Checking Market Intelligence...${NC}"
    
    response=$(curl -s "${API_ENDPOINT}/market-intelligence")
    
    if [[ $response == *"CompetitorAnalysis"* ]]; then
        echo -e "${GREEN}✅ Market intelligence operational${NC}"
        
        # Extract key metrics
        opportunities=$(echo $response | grep -o '"MarketOpportunities":\[[^]]*\]' | wc -l)
        echo -e "${GREEN}   Market opportunities identified: ${opportunities}${NC}"
    else
        echo -e "${RED}❌ Market intelligence not available${NC}"
    fi
}

# Function to discover revenue opportunities
discover_revenue() {
    echo -e "${BLUE}💰 Discovering Revenue Opportunities...${NC}"
    
    response=$(curl -s "${API_ENDPOINT}/revenue-opportunities")
    
    if [[ $response == *"EstimatedRevenue"* ]]; then
        echo -e "${GREEN}✅ Revenue discovery operational${NC}"
        
        # Count opportunities
        count=$(echo $response | grep -o '"Type"' | wc -l)
        echo -e "${GREEN}   Revenue opportunities found: ${count}${NC}"
    else
        echo -e "${RED}❌ Revenue discovery not available${NC}"
    fi
}

# Function to show enhancement progress
show_progress() {
    echo -e "${BLUE}📈 Checking Enhancement Progress...${NC}"
    
    response=$(curl -s "${API_ENDPOINT}/enhancement-progress")
    
    if [[ $response == *"OverallProgress"* ]]; then
        progress=$(echo $response | grep -o '"OverallProgress":[0-9]*' | cut -d':' -f2)
        echo -e "${GREEN}✅ Enhancement Progress: ${progress}%${NC}"
        
        if [ "$progress" -ge 90 ]; then
            echo -e "${PURPLE}🎉 SWARM ENHANCEMENTS NEARLY COMPLETE!${NC}"
        fi
    else
        echo -e "${RED}❌ Progress data not available${NC}"
    fi
}

# Function to display final status
show_final_status() {
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║     SWARM ORCHESTRATION STATUS      ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════╝${NC}"
    
    response=$(curl -s "${API_ENDPOINT}/status")
    
    if [[ $response == *"TotalAgents"* ]]; then
        total_agents=$(echo $response | grep -o '"TotalAgents":[0-9]*' | cut -d':' -f2)
        active_agents=$(echo $response | grep -o '"ActiveAgents":[0-9]*' | cut -d':' -f2)
        system_health=$(echo $response | grep -o '"SystemHealth":"[^"]*"' | cut -d':' -f2 | tr -d '"')
        mode=$(echo $response | grep -o '"Mode":"[^"]*"' | cut -d':' -f2 | tr -d '"')
        
        echo -e "${GREEN}Total Agents: ${total_agents}${NC}"
        echo -e "${GREEN}Active Agents: ${active_agents}${NC}"
        echo -e "${GREEN}System Health: ${system_health}${NC}"
        echo -e "${GREEN}Mode: ${mode}${NC}"
        
        if [ "$total_agents" -eq 50000 ] && [ "$mode" == "FULL_THROTTLE_ORCHESTRATION" ]; then
            echo ""
            echo -e "${PURPLE}🏛️  GOVERNMENT. TRANSCENDED. 🏛️${NC}"
            echo -e "${GREEN}The 50,000-agent civilization engine is OPERATIONAL!${NC}"
        fi
    else
        echo -e "${RED}❌ Status data not available${NC}"
    fi
    
    echo ""
}

# Main deployment sequence
main() {
    echo -e "${PURPLE}Starting Swarm Enhancement Deployment...${NC}"
    echo ""
    
    # Phase 1: Infrastructure
    check_api_health
    sleep 2
    
    # Phase 2: Core Services
    deploy_playbooks
    sleep 2
    
    initialize_knowledge_pools
    sleep 2
    
    activate_golden_paths
    sleep 2
    
    # Phase 3: Advanced Features
    test_citizen_agents
    sleep 2
    
    check_market_intelligence
    sleep 2
    
    discover_revenue
    sleep 2
    
    # Phase 4: Full Activation
    if [ "$SWARM_MODE" == "full-throttle" ]; then
        activate_full_throttle
        sleep 3
    fi
    
    # Phase 5: Status & Monitoring
    show_progress
    sleep 2
    
    show_final_status
    
    echo -e "${GREEN}🎉 Swarm Enhancement Deployment Complete!${NC}"
    echo -e "${YELLOW}Monitor with: ./monitor-swarm-orchestration.sh${NC}"
}

# Execute main function
main

exit 0
