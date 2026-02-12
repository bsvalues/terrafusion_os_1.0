#!/bin/bash

# Run Tests Script
# This script runs the test suites for the Property Intelligence Platform.

# Set NODE_OPTIONS
export NODE_OPTIONS="--experimental-vm-modules"

# Function to run a specific test
run_test() {
  echo "========================================="
  echo "Running test: $1"
  echo "========================================="
  npx jest $1
  echo ""
}

# Check for specific test to run
if [ "$1" == "app-health" ]; then
  run_test "tests/app-health.test.js"
elif [ "$1" == "property-story" ]; then
  run_test "tests/property-story-generator.test.js"
elif [ "$1" == "pacs" ]; then
  run_test "tests/pacs-module.test.js"
elif [ "$1" == "all" ] || [ -z "$1" ]; then
  # Run all tests
  echo "Running all tests..."
  echo "========================================="
  npx jest
  echo "========================================="
else
  echo "Unknown test: $1"
  echo "Available tests: app-health, property-story, pacs, all"
  exit 1
fi