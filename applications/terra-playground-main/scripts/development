#!/bin/bash

# TaxI_AI Development Tools Setup Script
# This script helps set up and manage the TaxI_AI Development Platform tools

# Display banner
echo "=============================================="
echo "   TaxI_AI Development Platform Setup Tool    "
echo "=============================================="
echo ""

# Check if required packages are installed
check_packages() {
  echo "Checking required packages..."
  
  # Check for commander
  if ! npm list -g commander >/dev/null 2>&1; then
    echo "Installing commander..."
    npm install -g commander
  fi
  
  # Check for chalk
  if ! npm list -g chalk >/dev/null 2>&1; then
    echo "Installing chalk..."
    npm install -g chalk
  fi
  
  # Check for inquirer
  if ! npm list -g inquirer >/dev/null 2>&1; then
    echo "Installing inquirer..."
    npm install -g inquirer
  fi
  
  # Check for node-fetch
  if ! npm list -g node-fetch >/dev/null 2>&1; then
    echo "Installing node-fetch..."
    npm install -g node-fetch
  fi
  
  echo "All required packages are installed."
}

# Setup database tables
setup_database() {
  echo "Setting up database tables..."
  node setup-development-tools-db.js
}

# Run tests
run_tests() {
  echo "Running API tests..."
  node test-development-tools-api.js
}

# Make CLI executable
setup_cli() {
  echo "Setting up CLI tool..."
  chmod +x taxi-dev-tools-cli.js
  
  # Create symlink to bin folder if it doesn't exist
  if [ ! -d "./node_modules/.bin" ]; then
    mkdir -p ./node_modules/.bin
  fi
  
  # Create symlink if it doesn't exist
  if [ ! -f "./node_modules/.bin/taxi-dev" ]; then
    ln -s ../../taxi-dev-tools-cli.js ./node_modules/.bin/taxi-dev
    echo "CLI tool installed as 'taxi-dev'"
  fi
}

# Print help
print_help() {
  echo "Usage: $0 [OPTION]"
  echo ""
  echo "Options:"
  echo "  --setup          Setup everything (database, CLI, etc.)"
  echo "  --db             Setup database tables only"
  echo "  --cli            Setup CLI tool only"
  echo "  --test           Run API tests"
  echo "  --help           Display this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --setup       Setup everything"
  echo "  $0 --test        Run API tests"
}

# Main script logic
if [ $# -eq 0 ]; then
  print_help
  exit 0
fi

case "$1" in
  --setup)
    check_packages
    setup_database
    setup_cli
    echo ""
    echo "Setup complete! The TaxI_AI Development Platform is ready to use."
    echo "To use the CLI tool, run: taxi-dev <command>"
    echo "See docs/development-tools-guide.md for more information."
    ;;
  --db)
    setup_database
    ;;
  --cli)
    check_packages
    setup_cli
    ;;
  --test)
    run_tests
    ;;
  --help)
    print_help
    ;;
  *)
    echo "Unknown option: $1"
    print_help
    exit 1
    ;;
esac