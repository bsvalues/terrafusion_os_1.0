#!/bin/bash

# RAG Drive FTP Hub Deployment Readiness Script
# This script checks if the application is ready for deployment

set -e  # Exit immediately if a command exits with a non-zero status

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print section header
print_header() {
    echo -e "\n${BLUE}=====================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}=====================================================================${NC}\n"
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        if [ -n "$3" ]; then
            echo -e "${RED}  Error: $3${NC}"
        fi
    fi
}

# Check project structure
check_project_structure() {
    print_header "Checking Project Structure"
    
    local missing_files=false
    
    # Essential directories
    for dir in client server shared scripts; do
        if [ -d "$dir" ]; then
            print_status 0 "Directory $dir exists"
        else
            print_status 1 "Directory $dir is missing"
            missing_files=true
        fi
    done
    
    # Essential files
    for file in package.json tsconfig.json drizzle.config.ts .env.example; do
        if [ -f "$file" ]; then
            print_status 0 "File $file exists"
        else
            print_status 1 "File $file is missing"
            missing_files=true
        fi
    done
    
    # Deployment files
    for file in Dockerfile docker-compose.yml; do
        if [ -f "$file" ]; then
            print_status 0 "Deployment file $file exists"
        else
            print_status 1 "Deployment file $file is missing"
            missing_files=true
        fi
    done
    
    if [ "$missing_files" = true ]; then
        echo -e "${RED}Some essential files or directories are missing.${NC}"
        return 1
    fi
    
    return 0
}

# Check environment configuration
check_env_configuration() {
    print_header "Checking Environment Configuration"
    
    if [ -f ".env.example" ]; then
        print_status 0 "Environment template (.env.example) exists"
        
        # Check required variables in .env.example
        local required_vars=(
            "NODE_ENV"
            "PORT"
            "DATABASE_URL"
            "SESSION_SECRET"
            "OPENAI_API_KEY"
        )
        
        local missing_vars=false
        
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" .env.example; then
                print_status 0 "Required variable $var is defined in .env.example"
            else
                print_status 1 "Required variable $var is missing in .env.example"
                missing_vars=true
            fi
        done
        
        if [ "$missing_vars" = true ]; then
            echo -e "${RED}Some required environment variables are missing.${NC}"
            return 1
        fi
    else
        print_status 1 "Environment template (.env.example) is missing"
        return 1
    fi
    
    return 0
}

# Check database schema and migrations
check_database() {
    print_header "Checking Database Configuration"
    
    if [ -f "shared/schema.ts" ]; then
        print_status 0 "Database schema definition exists"
    else
        print_status 1 "Database schema definition is missing"
        return 1
    fi
    
    if [ -f "drizzle.config.ts" ]; then
        print_status 0 "Drizzle configuration exists"
    else
        print_status 1 "Drizzle configuration is missing"
        return 1
    fi
    
    return 0
}

# Check dependencies
check_dependencies() {
    print_header "Checking Dependencies"
    
    # Check for vulnerabilities
    echo "Running npm audit..."
    if npm audit --production 2>/dev/null | grep -q "found 0 vulnerabilities"; then
        print_status 0 "No vulnerabilities found in production dependencies"
    else
        print_status 1 "Vulnerabilities found in production dependencies"
        echo -e "${YELLOW}Run 'npm audit fix' to attempt to fix vulnerabilities${NC}"
    fi
    
    # Check for outdated packages
    echo "Checking for outdated packages..."
    if [ "$(npm outdated --depth=0 2>/dev/null | wc -l)" -eq 0 ]; then
        print_status 0 "All packages are up to date"
    else
        print_status 1 "Some packages are outdated"
        echo -e "${YELLOW}Run 'npm outdated' to see outdated packages${NC}"
    fi
    
    return 0
}

# Run tests
run_tests() {
    print_header "Running Tests"
    
    echo "Running unit and integration tests..."
    if npm test; then
        print_status 0 "All tests passed"
    else
        print_status 1 "Some tests failed"
        return 1
    fi
    
    return 0
}

# Check build process
check_build() {
    print_header "Checking Build Process"
    
    echo "Building the application..."
    if npm run build; then
        print_status 0 "Build successful"
    else
        print_status 1 "Build failed"
        return 1
    fi
    
    # Check if client build files exist
    if [ -d "client/dist" ]; then
        print_status 0 "Client build files exist"
    else
        print_status 1 "Client build files are missing"
        return 1
    fi
    
    return 0
}

# Check documentation
check_documentation() {
    print_header "Checking Documentation"
    
    # Check for README
    if [ -f "README.md" ]; then
        print_status 0 "README exists"
    else
        print_status 1 "README is missing"
        return 1
    fi
    
    # Check for deployment guide
    if [ -f "deployment_guide.md" ]; then
        print_status 0 "Deployment guide exists"
    else
        print_status 1 "Deployment guide is missing"
        return 1
    fi
    
    # Check for verification plan
    if [ -f "verification_plan.md" ]; then
        print_status 0 "Verification plan exists"
    else
        print_status 1 "Verification plan is missing"
        return 1
    fi
    
    return 0
}

# Check deployment scripts
check_deployment_scripts() {
    print_header "Checking Deployment Scripts"
    
    # Check for deployment script
    if [ -f "scripts/deploy.sh" ] && [ -x "scripts/deploy.sh" ]; then
        print_status 0 "Deployment script exists and is executable"
    else
        if [ -f "scripts/deploy.sh" ]; then
            print_status 1 "Deployment script exists but is not executable"
            echo -e "${YELLOW}Run 'chmod +x scripts/deploy.sh' to make it executable${NC}"
        else
            print_status 1 "Deployment script is missing"
        fi
        return 1
    fi
    
    # Check for database backup script
    if [ -f "scripts/db-backup.sh" ] && [ -x "scripts/db-backup.sh" ]; then
        print_status 0 "Database backup script exists and is executable"
    else
        if [ -f "scripts/db-backup.sh" ]; then
            print_status 1 "Database backup script exists but is not executable"
            echo -e "${YELLOW}Run 'chmod +x scripts/db-backup.sh' to make it executable${NC}"
        else
            print_status 1 "Database backup script is missing"
        fi
        return 1
    fi
    
    # Check for database restore script
    if [ -f "scripts/db-restore.sh" ] && [ -x "scripts/db-restore.sh" ]; then
        print_status 0 "Database restore script exists and is executable"
    else
        if [ -f "scripts/db-restore.sh" ]; then
            print_status 1 "Database restore script exists but is not executable"
            echo -e "${YELLOW}Run 'chmod +x scripts/db-restore.sh' to make it executable${NC}"
        else
            print_status 1 "Database restore script is missing"
        fi
        return 1
    fi
    
    return 0
}

# Update deployment readiness report
update_deployment_readiness_report() {
    print_header "Updating Deployment Readiness Report"
    
    if [ -f "deployment_readiness_report.md" ]; then
        # Generate current date
        local current_date=$(date +"%Y-%m-%d")
        
        # Update the report date
        sed -i "s/Report Date:.*/Report Date: $current_date/" deployment_readiness_report.md
        
        print_status 0 "Deployment readiness report updated"
    else
        print_status 1 "Deployment readiness report is missing"
        return 1
    fi
    
    return 0
}

# Main function
main() {
    print_header "RAG Drive FTP Hub Deployment Readiness Check"
    echo "This script will check if the application is ready for deployment."
    echo
    
    local checks_passed=true
    
    # Run all checks
    check_project_structure || checks_passed=false
    check_env_configuration || checks_passed=false
    check_database || checks_passed=false
    check_dependencies || checks_passed=false
    
    # Ask before running tests and build as they take time
    echo
    read -p "Do you want to run tests and build the application? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests || checks_passed=false
        check_build || checks_passed=false
    else
        echo -e "${YELLOW}Skipping tests and build process.${NC}"
    fi
    
    check_documentation || checks_passed=false
    check_deployment_scripts || checks_passed=false
    update_deployment_readiness_report || checks_passed=false
    
    # Print final status
    print_header "Deployment Readiness Status"
    
    if [ "$checks_passed" = true ]; then
        echo -e "${GREEN}✓ All checks passed! The application is ready for deployment.${NC}"
        echo
        echo "Next steps:"
        echo "1. Review the deployment readiness report: deployment_readiness_report.md"
        echo "2. Run the deployment script: ./scripts/deploy.sh"
        echo
        echo "For more information, refer to the deployment guide: deployment_guide.md"
    else
        echo -e "${RED}✗ Some checks failed. The application is not ready for deployment.${NC}"
        echo
        echo "Please fix the issues highlighted above before attempting deployment."
    fi
}

# Run the main function
main