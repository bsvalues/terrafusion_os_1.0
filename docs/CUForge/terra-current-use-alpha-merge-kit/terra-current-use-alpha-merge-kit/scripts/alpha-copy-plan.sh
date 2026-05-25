#!/usr/bin/env bash
set -euo pipefail

echo "Current Use Alpha Copy Plan"
echo
echo "1. Unzip alpha packs into /tmp/current-use-alpha"
echo "2. Copy src/modules/terra-current-use into repo frontend"
echo "3. Copy backend/TerraFusion.Modules.CurrentUse into repo backend"
echo "4. Add policy, trace, security, observability backend folders"
echo "5. Register DI"
echo "6. Register Workbench tab"
echo "7. Run tests"
echo
echo "This script is a plan, not an automated copier, to avoid overwriting your repo accidentally."
