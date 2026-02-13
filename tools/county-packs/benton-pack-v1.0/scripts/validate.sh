#!/usr/bin/env bash

# ============================================================================
# Benton County Pack Validation Script
# TerraFusion OS v1.0
# ============================================================================
#
# Validates the Benton County Pack structure and configuration before
# deployment. Checks file existence, JSON validity, and configuration
# compliance.
#
# Usage:
#   ./scripts/validate.sh [--deployed]
#
# Options:
#   --deployed: Validate deployed county (check database records)
#
# Exit Codes:
#   0: Validation successful
#   1: Validation failed
#
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VALIDATE_DEPLOYED=false
if [ "$1" == "--deployed" ]; then
    VALIDATE_DEPLOYED=true
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TerraFusion OS - County Pack Validation                      ║${NC}"
echo -e "${BLUE}║  County: Benton County (FIPS 53005)                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

VALIDATION_PASSED=true

# ============================================================================
# Check Required Files
# ============================================================================

echo ""
echo -e "${BLUE}[1/5] Checking required files...${NC}"

FILES=(
    "README.md"
    "config/county.json"
    "schemas/properties.sql"
    "seeds/sample-parcels.json"
    "scripts/deploy.sh"
    "scripts/validate.sh"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file ${RED}(missing)${NC}"
        VALIDATION_PASSED=false
    fi
done

# ============================================================================
# Validate county.json
# ============================================================================

echo ""
echo -e "${BLUE}[2/5] Validating county.json...${NC}"

if [ ! -f "config/county.json" ]; then
    echo -e "${RED}✗ config/county.json not found${NC}"
    VALIDATION_PASSED=false
else
    # Check if file is valid JSON
    if jq empty config/county.json 2>/dev/null; then
        echo -e "${GREEN}✓ Valid JSON${NC}"
        
        # Check required fields
        COUNTY_NAME=$(jq -r '.countyName // empty' config/county.json)
        FIPS_CODE=$(jq -r '.fipsCode // empty' config/county.json)
        STATE=$(jq -r '.state // empty' config/county.json)
        TIMEZONE=$(jq -r '.timezone // empty' config/county.json)
        
        if [ -n "$COUNTY_NAME" ]; then
            echo -e "${GREEN}✓ countyName: $COUNTY_NAME${NC}"
        else
            echo -e "${RED}✗ countyName is missing${NC}"
            VALIDATION_PASSED=false
        fi
        
        if [ "$FIPS_CODE" == "53005" ]; then
            echo -e "${GREEN}✓ fipsCode: $FIPS_CODE (valid for Benton County)${NC}"
        else
            echo -e "${RED}✗ fipsCode: $FIPS_CODE (expected 53005)${NC}"
            VALIDATION_PASSED=false
        fi
        
        if [ "$STATE" == "WA" ]; then
            echo -e "${GREEN}✓ state: $STATE${NC}"
        else
            echo -e "${RED}✗ state: $STATE (expected WA)${NC}"
            VALIDATION_PASSED=false
        fi
        
        if [ -n "$TIMEZONE" ]; then
            echo -e "${GREEN}✓ timezone: $TIMEZONE${NC}"
        else
            echo -e "${RED}✗ timezone is missing${NC}"
            VALIDATION_PASSED=false
        fi
        
        # Check features array
        FEATURES_COUNT=$(jq '.features | length' config/county.json)
        if [ "$FEATURES_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✓ features: $FEATURES_COUNT enabled${NC}"
        else
            echo -e "${YELLOW}⚠ features array is empty${NC}"
        fi
        
    else
        echo -e "${RED}✗ Invalid JSON in config/county.json${NC}"
        VALIDATION_PASSED=false
    fi
fi

# ============================================================================
# Validate Sample Parcels JSON
# ============================================================================

echo ""
echo -e "${BLUE}[3/5] Validating sample parcels...${NC}"

if [ ! -f "seeds/sample-parcels.json" ]; then
    echo -e "${RED}✗ seeds/sample-parcels.json not found${NC}"
    VALIDATION_PASSED=false
else
    # Check if file is valid JSON
    if jq empty seeds/sample-parcels.json 2>/dev/null; then
        echo -e "${GREEN}✓ Valid JSON${NC}"
        
        PARCEL_COUNT=$(jq '. | length' seeds/sample-parcels.json)
        
        if [ "$PARCEL_COUNT" -ge 3 ]; then
            echo -e "${GREEN}✓ Parcel count: $PARCEL_COUNT (minimum 3 required)${NC}"
        else
            echo -e "${RED}✗ Parcel count: $PARCEL_COUNT (minimum 3 required)${NC}"
            VALIDATION_PASSED=false
        fi
        
        # Validate each parcel has required fields
        PARCELS_VALID=true
        for i in $(seq 0 $(($PARCEL_COUNT - 1))); do
            PARCEL_NUM=$(jq -r ".[$i].parcel_number // empty" seeds/sample-parcels.json)
            ADDRESS=$(jq -r ".[$i].address // empty" seeds/sample-parcels.json)
            
            if [ -z "$PARCEL_NUM" ] || [ -z "$ADDRESS" ]; then
                echo -e "${RED}✗ Parcel $i missing required fields${NC}"
                PARCELS_VALID=false
            fi
        done
        
        if [ "$PARCELS_VALID" == true ]; then
            echo -e "${GREEN}✓ All parcels have required fields${NC}"
        else
            VALIDATION_PASSED=false
        fi
        
    else
        echo -e "${RED}✗ Invalid JSON in seeds/sample-parcels.json${NC}"
        VALIDATION_PASSED=false
    fi
fi

# ============================================================================
# Check Schema File
# ============================================================================

echo ""
echo -e "${BLUE}[4/5] Checking schema file...${NC}"

if [ ! -f "schemas/properties.sql" ]; then
    echo -e "${RED}✗ schemas/properties.sql not found${NC}"
    VALIDATION_PASSED=false
else
    FILE_SIZE=$(wc -c < "schemas/properties.sql")
    if [ "$FILE_SIZE" -gt 0 ]; then
        echo -e "${GREEN}✓ properties.sql exists ($FILE_SIZE bytes)${NC}"
    else
        echo -e "${RED}✗ properties.sql is empty${NC}"
        VALIDATION_PASSED=false
    fi
fi

# ============================================================================
# Validate Deployed County (Optional)
# ============================================================================

echo ""
echo -e "${BLUE}[5/5] Deployment validation...${NC}"

if [ "$VALIDATE_DEPLOYED" == true ]; then
    echo -e "${YELLOW}   → Skipping deployment validation (stub mode)${NC}"
    echo -e "${YELLOW}   → In production, would check:${NC}"
    echo -e "${YELLOW}     - County exists in database${NC}"
    echo -e "${YELLOW}     - Properties table created${NC}"
    echo -e "${YELLOW}     - Sample data loaded${NC}"
    echo -e "${YELLOW}     - API endpoints responding${NC}"
else
    echo -e "${GREEN}✓ Skipping deployment validation (use --deployed flag)${NC}"
fi

# ============================================================================
# Summary
# ============================================================================

echo ""
if [ "$VALIDATION_PASSED" == true ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ County Pack Validation PASSED                              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "The Benton County Pack is valid and ready for deployment."
    echo ""
    echo "Next steps:"
    echo "  1. Deploy: ./scripts/deploy.sh development"
    echo "  2. Test: curl http://localhost:5000/api/counties/53005/properties"
    echo "  3. Validate deployment: ./scripts/validate.sh --deployed"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ County Pack Validation FAILED                              ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Please fix the errors above before deploying."
    echo ""
    exit 1
fi
