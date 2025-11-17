#!/bin/bash
# Agent Configuration Validator for TerraFusion OS
# Validates that custom agents have proper tool configurations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AGENTS_DIR="$REPO_ROOT/.github/agents"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}TerraFusion OS Agent Configuration Validator${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Counters
total_agents=0
valid_agents=0
invalid_agents=0

# Function to validate YAML frontmatter
validate_agent() {
    local agent_file="$1"
    local agent_name=$(basename "$agent_file")
    
    echo -e "${YELLOW}Validating: $agent_name${NC}"
    
    # Check if file exists
    if [ ! -f "$agent_file" ]; then
        echo -e "${RED}  ✗ File not found${NC}"
        return 1
    fi
    
    # Extract YAML frontmatter
    local yaml_content=$(awk '/^---$/{i++}i==1' "$agent_file" | head -n -1 | tail -n +2)
    
    # Check if frontmatter exists
    if [ -z "$yaml_content" ]; then
        echo -e "${RED}  ✗ No YAML frontmatter found${NC}"
        return 1
    fi
    
    # Check for description field
    if ! echo "$yaml_content" | grep -q "description:"; then
        echo -e "${RED}  ✗ Missing 'description' field${NC}"
        return 1
    fi
    
    # Check for tools field
    if ! echo "$yaml_content" | grep -q "tools:"; then
        echo -e "${RED}  ✗ Missing 'tools' field${NC}"
        return 1
    fi
    
    # Check if tools is empty array
    if echo "$yaml_content" | grep -q "tools: \[\]"; then
        echo -e "${RED}  ✗ Tools array is empty - agent will have no tool access!${NC}"
        return 1
    fi
    
    # Check for wildcard or specific tools
    local has_tools=false
    if echo "$yaml_content" | grep -A 1 "tools:" | grep -q '"\*"' || \
       echo "$yaml_content" | grep -A 1 "tools:" | grep -q "  - "; then
        has_tools=true
    fi
    
    if [ "$has_tools" = false ]; then
        echo -e "${RED}  ✗ No tools configured${NC}"
        return 1
    fi
    
    # Check for common required sections
    local content=$(cat "$agent_file")
    
    if ! echo "$content" | grep -q "# "; then
        echo -e "${YELLOW}  ⚠ Warning: No markdown headers found${NC}"
    fi
    
    echo -e "${GREEN}  ✓ Valid configuration${NC}"
    
    # Display configured tools
    echo -e "${BLUE}  Tools:${NC}"
    if echo "$yaml_content" | grep -A 1 "tools:" | grep -q '"\*"'; then
        echo -e "    • All tools enabled (wildcard)"
    else
        echo "$yaml_content" | grep -A 10 "tools:" | grep "  - " | sed 's/  - /    • /'
    fi
    
    echo ""
    return 0
}

# Find all agent files
echo "Searching for agent configuration files in: $AGENTS_DIR"
echo ""

if [ ! -d "$AGENTS_DIR" ]; then
    echo -e "${RED}Error: Agents directory not found at $AGENTS_DIR${NC}"
    exit 1
fi

# Validate each agent file
for agent_file in "$AGENTS_DIR"/*.agent.md; do
    if [ -f "$agent_file" ]; then
        ((total_agents++))
        if validate_agent "$agent_file"; then
            ((valid_agents++))
        else
            ((invalid_agents++))
        fi
    fi
done

# Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Total agents found:    $total_agents"
echo -e "${GREEN}Valid configurations:  $valid_agents${NC}"
if [ $invalid_agents -gt 0 ]; then
    echo -e "${RED}Invalid configurations: $invalid_agents${NC}"
else
    echo -e "Invalid configurations: $invalid_agents"
fi
echo ""

# Exit code
if [ $invalid_agents -gt 0 ]; then
    echo -e "${RED}❌ Validation failed: $invalid_agents agent(s) have invalid configurations${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All agent configurations are valid!${NC}"
    exit 0
fi
