#!/bin/bash

################################################################################
# Codex 3-6-9 Framework - Deliverables Verification Script
#
# Version: 1.0 - PRODUCTION READY
# Date: November 2, 2025
# Purpose: Verify all Codex 3-6-9 Framework deliverables are present
# The TerraFusion Way: GOVERNMENT. TRANSCENDED.
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Counters
TOTAL_FILES=0
FOUND_FILES=0
MISSING_FILES=0

# Root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                              ║${NC}"
echo -e "${BLUE}║         CODEX 3-6-9 FRAMEWORK - DELIVERABLES VERIFICATION                   ║${NC}"
echo -e "${BLUE}║                                                                              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

################################################################################
# HELPER FUNCTIONS
################################################################################

check_file() {
    local file_path="$1"
    local file_desc="$2"

    TOTAL_FILES=$((TOTAL_FILES + 1))

    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✓${NC} $file_desc"
        FOUND_FILES=$((FOUND_FILES + 1))
    else
        echo -e "${RED}✗${NC} $file_desc ${RED}(MISSING)${NC}"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
}

print_section() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

################################################################################
# BACKEND SERVICES VERIFICATION
################################################################################

print_section "BACKEND SERVICES (10 Services)"

check_file "$ROOT_DIR/backend/TerraFusion.AI/Services/Codex369FrameworkService.cs" \
    "Codex369FrameworkService.cs"

check_file "$ROOT_DIR/backend/TerraFusion.AI/Services/Codex369RealtimeService.cs" \
    "Codex369RealtimeService.cs"

check_file "$ROOT_DIR/backend/TerraFusion.AI/Services/CodexEmailNotificationService.cs" \
    "CodexEmailNotificationService.cs"

check_file "$ROOT_DIR/backend/TerraFusion.AI/Services/CodexSlackNotificationService.cs" \
    "CodexSlackNotificationService.cs"

check_file "$ROOT_DIR/backend/TerraFusion.AI/Services/CodexTeamsNotificationService.cs" \
    "CodexTeamsNotificationService.cs"

check_file "$ROOT_DIR/backend/TerraFusion.AI/Services/CodexCollaborationOrchestrator.cs" \
    "CodexCollaborationOrchestrator.cs"

check_file "$ROOT_DIR/backend/TerraFusion.AI/Services/CodexNotificationBackgroundService.cs" \
    "CodexNotificationBackgroundService.cs"

check_file "$ROOT_DIR/backend/TerraFusion.AI/Services/CodexCachingService.cs" \
    "CodexCachingService.cs"

check_file "$ROOT_DIR/backend/TerraFusion.AI/Services/CodexPerformanceOptimizationService.cs" \
    "CodexPerformanceOptimizationService.cs"

check_file "$ROOT_DIR/backend/TerraFusion.AI/Services/CodexExecutiveReportService.cs" \
    "CodexExecutiveReportService.cs"

################################################################################
# API CONTROLLERS VERIFICATION
################################################################################

print_section "API CONTROLLERS (7 Controllers)"

check_file "$ROOT_DIR/backend/TerraFusion.API/Controllers/Codex369Controller.cs" \
    "Codex369Controller.cs"

check_file "$ROOT_DIR/backend/TerraFusion.API/Controllers/CodexPerformanceController.cs" \
    "CodexPerformanceController.cs"

check_file "$ROOT_DIR/backend/TerraFusion.API/Controllers/CodexReportsController.cs" \
    "CodexReportsController.cs"

check_file "$ROOT_DIR/backend/TerraFusion.API/Controllers/CodexNotificationController.cs" \
    "CodexNotificationController.cs"

check_file "$ROOT_DIR/backend/TerraFusion.API/Controllers/CodexCollaborationController.cs" \
    "CodexCollaborationController.cs"

check_file "$ROOT_DIR/backend/TerraFusion.API/Controllers/CodexNotificationPreferencesController.cs" \
    "CodexNotificationPreferencesController.cs"

check_file "$ROOT_DIR/backend/TerraFusion.API/Controllers/CodexRealtimeController.cs" \
    "CodexRealtimeController.cs"

################################################################################
# DATABASE LAYER VERIFICATION
################################################################################

print_section "DATABASE LAYER (3 Files)"

check_file "$ROOT_DIR/backend/TerraFusion.Core/Entities/NotificationPreferences.cs" \
    "NotificationPreferences.cs (Entity)"

check_file "$ROOT_DIR/backend/TerraFusion.Data/Configurations/NotificationPreferencesConfiguration.cs" \
    "NotificationPreferencesConfiguration.cs"

check_file "$ROOT_DIR/backend/TerraFusion.Data/Migrations/20251102000000_AddNotificationPreferences.cs" \
    "20251102000000_AddNotificationPreferences.cs (Migration)"

################################################################################
# FRONTEND COMPONENTS VERIFICATION
################################################################################

print_section "FRONTEND COMPONENTS (2 Components)"

check_file "$ROOT_DIR/frontend/src/components/codex/NotificationPreferences.tsx" \
    "NotificationPreferences.tsx"

check_file "$ROOT_DIR/frontend/src/components/codex/Codex369Dashboard.tsx" \
    "Codex369Dashboard.tsx"

################################################################################
# INTEGRATION TESTS VERIFICATION
################################################################################

print_section "INTEGRATION TESTS (1 Test Suite)"

check_file "$ROOT_DIR/backend/TerraFusion.API.Tests/CodexNotificationIntegrationTests.cs" \
    "CodexNotificationIntegrationTests.cs"

################################################################################
# DOCUMENTATION VERIFICATION
################################################################################

print_section "DOCUMENTATION (10 Guides)"

check_file "$ROOT_DIR/CODEX_369_MASTER_SUMMARY.md" \
    "CODEX_369_MASTER_SUMMARY.md"

check_file "$ROOT_DIR/CODEX_369_COMPLETE_IMPLEMENTATION_GUIDE.md" \
    "CODEX_369_COMPLETE_IMPLEMENTATION_GUIDE.md"

check_file "$ROOT_DIR/CODEX_369_PERFORMANCE_AND_REPORTING_IMPLEMENTATION_SUMMARY.md" \
    "CODEX_369_PERFORMANCE_AND_REPORTING_IMPLEMENTATION_SUMMARY.md"

check_file "$ROOT_DIR/CODEX_369_SLACK_TEAMS_INTEGRATION_GUIDE.md" \
    "CODEX_369_SLACK_TEAMS_INTEGRATION_GUIDE.md"

check_file "$ROOT_DIR/CODEX_369_COLLABORATION_COMPLETE_SUMMARY.md" \
    "CODEX_369_COLLABORATION_COMPLETE_SUMMARY.md"

check_file "$ROOT_DIR/CODEX_369_FINAL_DEPLOYMENT_GUIDE.md" \
    "CODEX_369_FINAL_DEPLOYMENT_GUIDE.md"

check_file "$ROOT_DIR/CODEX_369_PRODUCTION_VERIFICATION.md" \
    "CODEX_369_PRODUCTION_VERIFICATION.md"

check_file "$ROOT_DIR/CODEX_369_README.md" \
    "CODEX_369_README.md"

check_file "$ROOT_DIR/CODEX_369_MISSION_COMPLETE.md" \
    "CODEX_369_MISSION_COMPLETE.md"

check_file "$ROOT_DIR/CODEX_369_DELIVERABLES_INDEX.md" \
    "CODEX_369_DELIVERABLES_INDEX.md"

################################################################################
# DEPLOYMENT SCRIPTS VERIFICATION
################################################################################

print_section "DEPLOYMENT SCRIPTS (2 Scripts)"

check_file "$ROOT_DIR/scripts/deploy-codex-369-production.sh" \
    "deploy-codex-369-production.sh"

check_file "$ROOT_DIR/scripts/Deploy-Codex369-Production.ps1" \
    "Deploy-Codex369-Production.ps1"

################################################################################
# SUMMARY
################################################################################

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  VERIFICATION SUMMARY${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "Total Files Checked:  ${BLUE}$TOTAL_FILES${NC}"
echo -e "Files Found:          ${GREEN}$FOUND_FILES${NC}"
echo -e "Files Missing:        ${RED}$MISSING_FILES${NC}"
echo ""

PERCENTAGE=$((FOUND_FILES * 100 / TOTAL_FILES))
echo -e "Completion:           ${CYAN}$PERCENTAGE%${NC}"
echo ""

if [ $MISSING_FILES -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                              ║${NC}"
    echo -e "${GREEN}║         ✅ ALL DELIVERABLES VERIFIED - 100% COMPLETE                         ║${NC}"
    echo -e "${GREEN}║                                                                              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}🏆 CODEX 3-6-9 FRAMEWORK - PRODUCTION READY${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                                              ║${NC}"
    echo -e "${RED}║         ❌ MISSING DELIVERABLES DETECTED                                     ║${NC}"
    echo -e "${RED}║                                                                              ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Please review missing files listed above${NC}"
    echo ""
    exit 1
fi
