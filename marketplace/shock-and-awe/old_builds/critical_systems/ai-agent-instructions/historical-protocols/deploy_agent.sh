#!/bin/bash
# deploy_agent.sh - Deploy individual Claude Code agent

set -euo pipefail

AGENT=${1:-}
CONTEXT_DIR="../context"
PROMPTS_DIR="../prompts"
LOGS_DIR="../logs"

if [[ -z "$AGENT" ]]; then
    echo "Usage: $0 [ALPHA|BRAVO|CHARLIE|DELTA|ECHO]"
    exit 1
fi

echo "🚀 Deploying Agent $AGENT..."

case "$AGENT" in
    ALPHA)
        echo "📦 Alpha Agent: Migration Specialist"
        echo "Context: Application migration and dependency resolution"
        cat "$PROMPTS_DIR/alpha_migration.prompt"
        ;;
    BRAVO)
        echo "🛠️ Bravo Agent: Infrastructure & DevOps"
        echo "Context: Docker, monitoring, and deployment"
        cat "$PROMPTS_DIR/bravo_infrastructure.prompt"
        ;;
    CHARLIE)
        echo "🧪 Charlie Agent: Integration & Testing"
        echo "Context: E2E testing and API validation"
        cat "$PROMPTS_DIR/charlie_testing.prompt"
        ;;
    DELTA)
        echo "🔒 Delta Agent: Security & Validation"
        echo "Context: Security scanning and validation"
        cat "$PROMPTS_DIR/delta_security.prompt"
        ;;
    ECHO)
        echo "📚 Echo Agent: Documentation & Reporting"
        echo "Context: System documentation and reporting"
        echo "Echo prompt pending creation..."
        ;;
    *)
        echo "Unknown agent: $AGENT"
        exit 1
        ;;
esac

echo ""
echo "Agent $AGENT ready for deployment."
echo "Context files available in: $CONTEXT_DIR"
echo "Logs will be written to: $LOGS_DIR/${AGENT,,}_$(date +%Y%m%d_%H%M%S).log"
echo ""
echo "To deploy this agent with Claude Code:"
echo "1. Copy the prompt above"
echo "2. Navigate to /mnt/e/TerraFusion_Master_Workspace"
echo "3. Run: claude code"
echo "4. Paste the prompt when ready"
