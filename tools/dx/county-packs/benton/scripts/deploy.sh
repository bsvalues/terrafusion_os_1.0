#!/bin/bash
# TerraFusion OS - Benton County Deployment Script
# Version: 1.0.0
# Classification: Government Infrastructure Deployment

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COUNTY_PACK_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MANIFEST_PATH="$COUNTY_PACK_DIR/county-pack.json"
ENV_CONFIG_PATH="$COUNTY_PACK_DIR/config/environment.json"
SAMPLE_DATA_PATH="$COUNTY_PACK_DIR/data/sample-properties.json"

# Parse arguments
DRY_RUN=true
SKIP_VALIDATION=false
BACKUP=true

while [[ $# -gt 0 ]]; do
  case $1 in
    --execute)
      DRY_RUN=false
      shift
      ;;
    --skip-validation)
      SKIP_VALIDATION=true
      shift
      ;;
    --no-backup)
      BACKUP=false
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Functions
log_info() {
  echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
  log_info "Checking prerequisites..."
  
  # Check for required tools
  for cmd in jq psql redis-cli dotnet; do
    if ! command -v $cmd &> /dev/null; then
      log_error "$cmd is not installed. Please install it first."
      exit 1
    fi
  done
  
  # Check environment variables
  REQUIRED_VARS=(
    "POSTGRES_HOST"
    "POSTGRES_PORT"
    "POSTGRES_DB"
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "REDIS_HOST"
    "REDIS_PORT"
    "JWT_SECRET"
    "ENCRYPTION_KEY"
  )
  
  for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
      log_error "Environment variable $var is not set"
      exit 1
    fi
  done
  
  log_success "All prerequisites met"
}

validate_manifest() {
  log_info "Validating county pack manifest..."
  
  if [ ! -f "$MANIFEST_PATH" ]; then
    log_error "Manifest not found: $MANIFEST_PATH"
    exit 1
  fi
  
  # Validate JSON structure
  if ! jq empty "$MANIFEST_PATH" 2>/dev/null; then
    log_error "Invalid JSON in manifest"
    exit 1
  fi
  
  # Check required fields
  COUNTY_ID=$(jq -r '.countyId' "$MANIFEST_PATH")
  COUNTY_NAME=$(jq -r '.countyName' "$MANIFEST_PATH")
  VERSION=$(jq -r '.version' "$MANIFEST_PATH")
  
  if [ "$COUNTY_ID" == "null" ] || [ "$COUNTY_NAME" == "null" ] || [ "$VERSION" == "null" ]; then
    log_error "Missing required fields in manifest"
    exit 1
  fi
  
  log_success "Manifest validation passed (County: $COUNTY_NAME, Version: $VERSION)"
}

backup_database() {
  if [ "$BACKUP" == true ] && [ "$DRY_RUN" == false ]; then
    log_info "Creating database backup..."
    
    BACKUP_FILE="$COUNTY_PACK_DIR/backups/benton_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p "$COUNTY_PACK_DIR/backups"
    
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
      -h "$POSTGRES_HOST" \
      -p "$POSTGRES_PORT" \
      -U "$POSTGRES_USER" \
      -d "$POSTGRES_DB" \
      -f "$BACKUP_FILE"
    
    log_success "Backup created: $BACKUP_FILE"
  else
    log_warning "Skipping backup (dry-run or --no-backup)"
  fi
}

create_database_schema() {
  log_info "Creating Benton County database schema..."
  
  if [ "$DRY_RUN" == true ]; then
    log_warning "[DRY-RUN] Would create schema: benton"
    return
  fi
  
  # Create schema if it doesn't exist
  PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -h "$POSTGRES_HOST" \
    -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    -c "CREATE SCHEMA IF NOT EXISTS benton;"
  
  log_success "Schema created"
}

run_migrations() {
  log_info "Running database migrations..."
  
  if [ "$DRY_RUN" == true ]; then
    log_warning "[DRY-RUN] Would run Entity Framework migrations"
    return
  fi
  
  # Navigate to backend and run migrations
  BACKEND_DIR="$(cd "$COUNTY_PACK_DIR/../../../../backend" && pwd)"
  cd "$BACKEND_DIR"
  
  dotnet ef database update \
    --project TerraFusion.Data \
    --startup-project TerraFusion.API \
    --context TerraFusionDbContext \
    -- --county=benton
  
  log_success "Migrations completed"
}

seed_data() {
  log_info "Seeding sample data..."
  
  if [ "$DRY_RUN" == true ]; then
    log_warning "[DRY-RUN] Would seed data from: $SAMPLE_DATA_PATH"
    return
  fi
  
  if [ -f "$SAMPLE_DATA_PATH" ]; then
    # Import sample properties
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
      -h "$POSTGRES_HOST" \
      -p "$POSTGRES_PORT" \
      -U "$POSTGRES_USER" \
      -d "$POSTGRES_DB" \
      -c "\\copy benton.properties FROM '$SAMPLE_DATA_PATH' WITH (FORMAT json);"
    
    log_success "Sample data seeded"
  else
    log_warning "Sample data file not found, skipping"
  fi
}

configure_integrations() {
  log_info "Configuring integrations..."
  
  # Check Harris PACS integration
  if [ -n "${HARRIS_PACS_URL:-}" ] && [ -n "${HARRIS_PACS_API_KEY:-}" ]; then
    log_info "Harris PACS 9.0 integration configured"
    
    if [ "$DRY_RUN" == false ]; then
      # Test connectivity
      HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $HARRIS_PACS_API_KEY" \
        "$HARRIS_PACS_URL/health" || echo "000")
      
      if [ "$HTTP_STATUS" == "200" ]; then
        log_success "Harris PACS connection successful"
      else
        log_warning "Harris PACS connection failed (HTTP $HTTP_STATUS)"
      fi
    fi
  else
    log_warning "Harris PACS integration not configured (environment variables missing)"
  fi
}

run_post_deployment_validation() {
  log_info "Running post-deployment validation..."
  
  if [ "$DRY_RUN" == true ]; then
    log_warning "[DRY-RUN] Would run validation tests"
    return
  fi
  
  # Check database connectivity
  if PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -h "$POSTGRES_HOST" \
    -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    -c "SELECT 1 FROM benton.properties LIMIT 1;" &> /dev/null; then
    log_success "Database connectivity confirmed"
  else
    log_error "Database validation failed"
    exit 1
  fi
  
  # Check Redis connectivity
  if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" PING &> /dev/null; then
    log_success "Redis connectivity confirmed"
  else
    log_error "Redis validation failed"
    exit 1
  fi
}

print_summary() {
  echo ""
  echo "======================================"
  echo "  Benton County Deployment Summary"
  echo "======================================"
  echo ""
  echo "County:       $(jq -r '.countyName' "$MANIFEST_PATH")"
  echo "County ID:    $(jq -r '.countyId' "$MANIFEST_PATH")"
  echo "FIPS Code:    $(jq -r '.countyFips' "$MANIFEST_PATH")"
  echo "Version:      $(jq -r '.version' "$MANIFEST_PATH")"
  echo ""
  echo "Database:     $POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
  echo "Schema:       benton"
  echo "Redis:        $REDIS_HOST:$REDIS_PORT"
  echo ""
  
  if [ "$DRY_RUN" == true ]; then
    log_warning "DRY-RUN MODE: No changes were made"
    echo ""
    echo "To execute deployment, run with --execute flag:"
    echo "  $0 --execute"
  else
    log_success "Deployment completed successfully"
    echo ""
    echo "Next steps:"
    echo "  1. Start TerraFusion API: cd backend && dotnet run --project TerraFusion.API"
    echo "  2. Verify deployment: tdc county info benton"
    echo "  3. Access UI: ${FRONTEND_URL:-http://localhost:3000}"
  fi
  
  echo ""
  echo "======================================"
}

# Main execution
main() {
  echo ""
  log_info "Starting Benton County deployment..."
  echo ""
  
  if [ "$DRY_RUN" == true ]; then
    log_warning "Running in DRY-RUN mode (no changes will be made)"
  fi
  
  # Step 1: Prerequisites
  check_prerequisites
  
  # Step 2: Validation
  if [ "$SKIP_VALIDATION" == false ]; then
    validate_manifest
  fi
  
  # Step 3: Backup
  backup_database
  
  # Step 4: Database setup
  create_database_schema
  run_migrations
  
  # Step 5: Data seeding
  seed_data
  
  # Step 6: Integrations
  configure_integrations
  
  # Step 7: Post-deployment validation
  run_post_deployment_validation
  
  # Step 8: Summary
  print_summary
}

# Execute
main
