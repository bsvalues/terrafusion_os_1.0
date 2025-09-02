#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

FLAG_VERIFY=false
FLAG_RUN_DISCOVERY=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --verify)
      FLAG_VERIFY=true
      shift
      ;;
    --run-discovery)
      FLAG_RUN_DISCOVERY=true
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

cd "$REPO_ROOT"

required=(
  "AI_NAVIGATION.md"
  "START_HERE.md"
  "AI_AGENT_QUICK_START.md"
  "CLAUDE.md"
  "TEST_REGISTRY.md"
  "scripts/discover-all-tests.sh"
)

missing=()
for f in "${required[@]}"; do
  if [[ ! -e "$f" ]]; then
    missing+=("$f")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Required files not found:" >&2
  for m in "${missing[@]}"; do echo " - $m" >&2; done
  exit 1
fi

echo "Single Entry Point: AI_NAVIGATION.md"
echo
echo "Essential Reading Order:"
echo "  1) START_HERE.md"
echo "  2) AI_AGENT_QUICK_START.md"
echo "  3) CLAUDE.md"
echo "  4) TEST_REGISTRY.md"
echo
echo "Most Important Facts:"
echo " - Tests are distributed across 10+ locations, not just /tests/"
echo " - 716 real tests are in /modules/testing-suite/ (91.9% pass rate)"
echo " - Mock tests live in /tests/mock_tests/"
echo " - Championship orchestrators are in the repository root"
echo " - Always read CLAUDE.md first for any development work"
echo
echo "Critical Commands:"
echo "  ./scripts/discover-all-tests.sh"
echo "  cat CLAUDE.md"
echo "  cat TEST_REGISTRY.md"
echo "  ls modules/testing-suite/"
echo
echo "Guidance for AI Agents:"
echo "  Read AI_NAVIGATION.md first, then START_HERE.md, then CLAUDE.md."
echo "  Tests are distributed across 10+ locations — run ./scripts/discover-all-tests.sh"
echo "  to find all 361 tests. The real tests (716) are in /modules/testing-suite/, not /tests/."

if $FLAG_VERIFY; then
  echo
  echo "Verifying key paths..."
  paths=(
    "modules/testing-suite"
    "tests/mock_tests"
  )
  for p in "${paths[@]}"; do
    if [[ -d "$p" ]]; then
      echo "✓ $p"
    else
      echo "✗ Missing directory: $p" >&2
    fi
  done
fi

if $FLAG_RUN_DISCOVERY; then
  echo
  echo "Running test discovery..."
  bash ./scripts/discover-all-tests.sh | cat
fi

echo
echo "Orientation complete."


