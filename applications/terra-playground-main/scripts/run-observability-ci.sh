#!/bin/bash

# Observability CI/CD Pipeline Runner
# This script runs the full observability verification pipeline:
# 1. Lint: Validates all Prometheus and Grafana configuration files
# 2. Test: Performs smoke tests to verify endpoints and functionality
# 3. Deploy: If specified, deploys configs to staging environment

set -e  # Exit on any error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Initialize variables
STAGE=""
SHOULD_DEPLOY=false
SHOULD_TAG=false
TAG_NAME="observability-staging-deployed-$(date +%Y%m%d%H%M%S)"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --lint) STAGE="lint" ;;
        --test) STAGE="test" ;;
        --verify) STAGE="verify" ;;
        --deploy) SHOULD_DEPLOY=true ;;
        --tag) SHOULD_TAG=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Default to verify if no stage specified
if [ -z "$STAGE" ]; then
    STAGE="verify"
fi

echo -e "${MAGENTA}======================================"
echo -e "Observability CI/CD Pipeline"
echo -e "======================================${NC}\n"

# Install required dependencies if needed
echo -e "${BLUE}Checking dependencies...${NC}"
if ! command -v yamllint &> /dev/null; then
    echo -e "${YELLOW}yamllint not found, installing...${NC}"
    pip install yamllint
fi

if ! command -v js-yaml &> /dev/null; then
    echo -e "${YELLOW}js-yaml not found, installing...${NC}"
    npm install -g js-yaml
fi

echo -e "${GREEN}Dependencies ready.${NC}\n"

# Function to run linting
run_lint() {
    echo -e "${BLUE}Running observability linting...${NC}"
    
    # Run our observability linting script
    node scripts/observability-lint.js
    
    LINT_STATUS=$?
    
    if [ $LINT_STATUS -eq 0 ]; then
        echo -e "\n${GREEN}Linting completed successfully!${NC}"
    else
        echo -e "\n${RED}Linting failed with errors.${NC}"
        exit $LINT_STATUS
    fi
}

# Function to run smoke tests
run_test() {
    echo -e "${BLUE}Running observability smoke tests...${NC}"
    
    # Check if the application is running
    if ! curl -s http://localhost:3000/health > /dev/null; then
        echo -e "${YELLOW}Application doesn't seem to be running. Starting it...${NC}"
        # Use appropriate start command based on your project
        if [ -f "package.json" ]; then
            echo -e "${YELLOW}Using 'npm run dev' to start the application...${NC}"
            # Start app in background
            npm run dev &
            APP_PID=$!
            
            # Wait for app to start
            echo "Waiting for application to start..."
            for i in {1..30}; do
                if curl -s http://localhost:3000/health > /dev/null; then
                    echo -e "${GREEN}Application started successfully!${NC}"
                    break
                fi
                
                if [ $i -eq 30 ]; then
                    echo -e "${RED}Timed out waiting for application to start.${NC}"
                    kill $APP_PID
                    exit 1
                fi
                
                echo -n "."
                sleep 1
            done
            echo ""
        else
            echo -e "${RED}Cannot determine how to start the application.${NC}"
            exit 1
        fi
    fi
    
    # Run our observability tests
    node scripts/observability-test.js
    
    TEST_STATUS=$?
    
    # Kill the app if we started it
    if [ ! -z "$APP_PID" ]; then
        echo -e "${YELLOW}Stopping application...${NC}"
        kill $APP_PID
    fi
    
    if [ $TEST_STATUS -eq 0 ]; then
        echo -e "\n${GREEN}Smoke tests completed successfully!${NC}"
    else
        echo -e "\n${RED}Smoke tests failed with errors.${NC}"
        exit $TEST_STATUS
    fi
}

# Function to deploy to staging
deploy_staging() {
    echo -e "${BLUE}Deploying observability configurations to staging...${NC}"
    
    # In a real environment, this would use kubectl, Helm, or your specific
    # deployment mechanism to deploy the configurations to staging
    
    echo -e "${YELLOW}This is a simulated deployment.${NC}"
    echo -e "${YELLOW}In a real environment, this would deploy to staging using:${NC}"
    echo -e "${YELLOW}- kubectl apply -f prometheus/rules/ -n monitoring${NC}"
    echo -e "${YELLOW}- kubectl apply -f prometheus/alerts/ -n monitoring${NC}"
    echo -e "${YELLOW}- kubectl apply -f grafana/provisioning/ -n monitoring${NC}"
    
    # Tag the git commit if requested
    if [ "$SHOULD_TAG" = true ]; then
        echo -e "${BLUE}Tagging commit as ${TAG_NAME}...${NC}"
        # In a real environment, this would tag the git commit
        echo -e "${YELLOW}In a real environment, this would run:${NC}"
        echo -e "${YELLOW}- git tag ${TAG_NAME}${NC}"
        echo -e "${YELLOW}- git push origin ${TAG_NAME}${NC}"
    fi
    
    echo -e "\n${GREEN}Deployment completed successfully!${NC}"
}

# Run the appropriate stage(s)
case $STAGE in
    lint)
        run_lint
        ;;
    test)
        run_test
        ;;
    verify)
        run_lint
        run_test
        if [ "$SHOULD_DEPLOY" = true ]; then
            deploy_staging
        fi
        ;;
    *)
        echo -e "${RED}Unknown stage: $STAGE${NC}"
        exit 1
        ;;
esac

echo -e "\n${MAGENTA}======================================"
echo -e "Pipeline completed successfully!"
echo -e "======================================${NC}"

exit 0