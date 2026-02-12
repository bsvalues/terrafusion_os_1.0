#!/bin/bash

# FTP Tests Runner Script
# This script runs all FTP-related tests in the correct order
# 
# Usage: ./run-ftp-tests.sh [options]
#   Options:
#     --help           Display this help message
#     --connection     Test FTP connection only
#     --directories    Test directory structure only
#     --processor      Test FTP data processor only
#     --scheduler      Test scheduler and lock mechanism only
#     --all            Run all tests (default)

# Set text formatting options
BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
RESET="\033[0m"

# Track overall success
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Parse command line arguments
RUN_CONNECTION=false
RUN_DIRECTORIES=false
RUN_PROCESSOR=false
RUN_SCHEDULER=false
RUN_ALL=true

if [ "$#" -gt 0 ]; then
  RUN_ALL=false
  for arg in "$@"; do
    case $arg in
      --help)
        echo "FTP Tests Runner Script"
        echo ""
        echo "Usage: ./run-ftp-tests.sh [options]"
        echo "  Options:"
        echo "    --help           Display this help message"
        echo "    --connection     Test FTP connection only"
        echo "    --directories    Test directory structure only"
        echo "    --processor      Test FTP data processor only" 
        echo "    --scheduler      Test scheduler and lock mechanism only"
        echo "    --all            Run all tests (default)"
        echo ""
        exit 0
        ;;
      --connection)
        RUN_CONNECTION=true
        ;;
      --directories)
        RUN_DIRECTORIES=true
        ;;
      --processor)
        RUN_PROCESSOR=true
        ;;
      --scheduler)
        RUN_SCHEDULER=true
        ;;
      --all)
        RUN_ALL=true
        ;;
      *)
        echo "Unknown option: $arg"
        echo "Use --help for usage information"
        exit 1
        ;;
    esac
  done
fi

# If no specific tests were selected, run all tests
if [ "$RUN_CONNECTION" = false ] && [ "$RUN_DIRECTORIES" = false ] && [ "$RUN_PROCESSOR" = false ] && [ "$RUN_SCHEDULER" = false ] && [ "$RUN_ALL" = false ]; then
  RUN_ALL=true
fi

# If --all is specified, run all tests
if [ "$RUN_ALL" = true ]; then
  RUN_CONNECTION=true
  RUN_DIRECTORIES=true
  RUN_PROCESSOR=true
  RUN_SCHEDULER=true
fi

print_header() {
  echo -e "\n${BOLD}${BLUE}==========================================${RESET}"
  echo -e "${BOLD}${BLUE} $1 ${RESET}"
  echo -e "${BOLD}${BLUE}==========================================${RESET}\n"
}

print_subheader() {
  echo -e "\n${BOLD}${YELLOW}>>> $1 ${RESET}"
}

print_success() {
  echo -e "${GREEN}✓ $1${RESET}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

print_failure() {
  echo -e "${RED}✗ $1${RESET}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

run_test() {
  TEST_NAME=$1
  TEST_CMD=$2
  
  print_subheader "Running $TEST_NAME"
  echo "Command: $TEST_CMD"
  
  # Run the test and capture exit code
  eval $TEST_CMD
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    print_success "$TEST_NAME completed successfully"
    return 0
  else
    print_failure "$TEST_NAME failed with exit code $EXIT_CODE"
    return 1
  fi
}

# Start execution
print_header "FTP TESTS"

# Step 1: Check if the required directories exist
print_subheader "Checking required directories"
if [ ! -d "./downloads" ]; then
  mkdir -p ./downloads
  echo "Created downloads directory"
fi

if [ ! -d "./downloads/test-data" ]; then
  mkdir -p ./downloads/test-data
  echo "Created test-data directory"
fi

if [ ! -d "./logs" ]; then
  mkdir -p ./logs
  echo "Created logs directory"
fi
print_success "Directory checks passed"

# Execute tests based on flags
if [ "$RUN_CONNECTION" = true ]; then
  print_header "CONNECTION TESTS"
  # Test FTP connection and small sync 
  run_test "FTP Connection & Small Sync Test" "node scripts/test-ftp-sync.js --small-sync-only"
fi

if [ "$RUN_DIRECTORIES" = true ]; then
  print_header "DIRECTORY STRUCTURE TESTS"
  # Test FTP directory structure
  run_test "FTP Directory Structure Test" "node scripts/test-ftp-sync.js --check-dirs --no-small-sync"
fi

if [ "$RUN_PROCESSOR" = true ]; then
  print_header "DATA PROCESSOR TESTS"
  # Test FTP data processor configurations
  run_test "FTP Data Processor Configurations Test" "node scripts/test-ftp-data-processor.js --test-configs"

  # Test FTP data processor field mappings
  run_test "FTP Data Processor Field Mappings Test" "node scripts/test-ftp-data-processor.js --test-mappings"

  # Test FTP data processor parsing
  run_test "FTP Data Processor Parsing Test" "node scripts/test-ftp-data-processor.js --test-parsing"
fi

if [ "$RUN_SCHEDULER" = true ]; then
  print_header "SCHEDULER TESTS"
  # Test FTP synchronization scheduler
  run_test "FTP Synchronization Scheduler Test" "node scripts/setup-ftp-cron.js --test"

  # Test lock mechanism on scheduler
  run_test "FTP Lock Mechanism Test" "node tests/ftp-agent-scheduler.test.js"
fi

# Print summary
print_header "TEST SUMMARY"
echo -e "Total tests: ${BOLD}$TOTAL_TESTS${RESET}"
echo -e "Tests passed: ${BOLD}${GREEN}$TESTS_PASSED${RESET}"
if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "Tests failed: ${BOLD}${RED}$TESTS_FAILED${RESET}"
  exit 1
else
  echo -e "${BOLD}${GREEN}All tests passed successfully!${RESET}"
  exit 0
fi