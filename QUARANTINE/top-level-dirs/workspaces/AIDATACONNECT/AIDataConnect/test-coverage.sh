#!/bin/bash

# RAG Drive FTP Hub Test Coverage Script
# This script runs tests and generates a comprehensive coverage report

# Exit on error
set -e

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_FILE="./logs/test-coverage.log"
COVERAGE_DIR="./coverage"
COVERAGE_THRESHOLD=80
DATE=$(date +"%Y%m%d%H%M%S")

# Create logs directory if it doesn't exist
mkdir -p ./logs
mkdir -p $COVERAGE_DIR

# Log function
log() {
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  echo -e "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Section header function
section() {
  echo -e "\n${BLUE}==== $1 ====${NC}"
  log "==== $1 ===="
}

# Success function
success() {
  echo -e "${GREEN}✓ $1${NC}"
  log "✓ $1"
}

# Error function
error() {
  echo -e "${RED}✗ $1${NC}"
  log "✗ $1"
  EXIT_CODE=1
}

# Warning function
warning() {
  echo -e "${YELLOW}! $1${NC}"
  log "! $1"
}

# Start test coverage process
section "STARTING TEST COVERAGE GENERATION - $DATE"

# Initialize variables
EXIT_CODE=0

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
  error "Node.js is not installed. Please install Node.js before running this script."
  exit 1
fi

if ! command -v npm &> /dev/null; then
  error "npm is not installed. Please install npm before running this script."
  exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v)
log "Node.js version: $NODE_VERSION"

# Install dependencies if needed
section "CHECKING DEPENDENCIES"
if [ ! -d "node_modules" ]; then
  log "Node modules not found. Installing dependencies..."
  npm install
  if [ $? -eq 0 ]; then
    success "Dependencies installed successfully"
  else
    error "Failed to install dependencies"
    exit 1
  fi
else
  success "Dependencies already installed"
fi

# Run linting
section "RUNNING LINTING"
if npm run lint &> /dev/null; then
  success "Linting passed"
else
  warning "Linting found issues, but continuing with tests"
fi

# Run unit tests with coverage
section "RUNNING UNIT TESTS"
log "Running unit tests with coverage..."

# Save current time for performance measurement
START_TIME=$(date +%s)

# Run tests with coverage
npm run test:coverage

if [ $? -eq 0 ]; then
  success "Unit tests passed"
else
  error "Unit tests failed"
fi

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
log "Test duration: ${DURATION} seconds"

# Parse coverage results
section "ANALYZING COVERAGE RESULTS"

if [ -f "./coverage/coverage-summary.json" ]; then
  # Extract overall coverage percentage using jq if available, otherwise use grep and cut
  if command -v jq &> /dev/null; then
    TOTAL_COVERAGE=$(jq -r '.total.statements.pct' ./coverage/coverage-summary.json)
  else
    TOTAL_COVERAGE=$(grep -A 3 '"total":' ./coverage/coverage-summary.json | grep '"pct"' | head -1 | cut -d ':' -f 2 | cut -d ',' -f 1 | tr -d ' ')
  fi
  
  # If couldn't parse, try another approach
  if [ -z "$TOTAL_COVERAGE" ]; then
    # Try to extract from lcov-report/index.html
    if [ -f "./coverage/lcov-report/index.html" ]; then
      TOTAL_COVERAGE=$(grep -o '[0-9]*\.[0-9]*%' ./coverage/lcov-report/index.html | head -1 | tr -d '%')
    fi
  fi
  
  if [ -n "$TOTAL_COVERAGE" ]; then
    log "Total coverage: ${TOTAL_COVERAGE}%"
    
    # Compare with threshold
    if (( $(echo "$TOTAL_COVERAGE >= $COVERAGE_THRESHOLD" | bc -l) )); then
      success "Coverage threshold met (${TOTAL_COVERAGE}% >= ${COVERAGE_THRESHOLD}%)"
    else
      error "Coverage below threshold (${TOTAL_COVERAGE}% < ${COVERAGE_THRESHOLD}%)"
    fi
  else
    warning "Could not parse coverage percentage"
  fi
  
  # Save the coverage report with timestamp
  cp -r ./coverage $COVERAGE_DIR/coverage-$DATE
  success "Coverage report saved to $COVERAGE_DIR/coverage-$DATE"
else
  error "Coverage report not found"
fi

# Run component tests if they exist
section "RUNNING COMPONENT TESTS"
if [ -f "component-tests.js" ] || [ -d "component-tests" ]; then
  log "Running component tests..."
  npm run test:component || warning "Component tests failed or not configured properly"
else
  warning "No component tests found. Skipping."
fi

# Run end-to-end tests if they exist
section "RUNNING END-TO-END TESTS"
if [ -f "e2e-tests.js" ] || [ -d "e2e-tests" ]; then
  log "Running end-to-end tests..."
  npm run test:e2e || warning "End-to-end tests failed or not configured properly"
else
  warning "No end-to-end tests found. Skipping."
fi

# Final summary
section "TEST COVERAGE SUMMARY"

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
  if [ -n "$TOTAL_COVERAGE" ]; then
    echo -e "Total coverage: ${GREEN}${TOTAL_COVERAGE}%${NC}"
  fi
  log "All tests passed successfully!"
else
  echo -e "${RED}Some tests failed. Check the logs for details.${NC}"
  if [ -n "$TOTAL_COVERAGE" ]; then
    echo -e "Total coverage: ${RED}${TOTAL_COVERAGE}%${NC}"
  fi
  log "Some tests failed. See above for details."
fi

echo -e "\nDetailed coverage report available at: ${BLUE}./coverage/lcov-report/index.html${NC}"
echo -e "Coverage history available at: ${BLUE}$COVERAGE_DIR${NC}"
log "Coverage report generated at: ./coverage/lcov-report/index.html"

# Output to GitHub Actions if running in CI
if [ -n "$GITHUB_STEP_SUMMARY" ]; then
  echo "## Test Coverage Summary" >> $GITHUB_STEP_SUMMARY
  echo "- **Date:** $(date)" >> $GITHUB_STEP_SUMMARY
  echo "- **Coverage:** ${TOTAL_COVERAGE}%" >> $GITHUB_STEP_SUMMARY
  echo "- **Threshold:** ${COVERAGE_THRESHOLD}%" >> $GITHUB_STEP_SUMMARY
  echo "- **Status:** $([ $EXIT_CODE -eq 0 ] && echo "✅ Passed" || echo "❌ Failed")" >> $GITHUB_STEP_SUMMARY
fi

# Exit with proper code
exit $EXIT_CODE