#!/usr/bin/env bash
# TerraFusion Tool Verification & Installation
# Ensures all required tools are available for operations

# Source the TerraFusion ops library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

# =============================================================================
# Tool Definitions
# =============================================================================

declare -A REQUIRED_TOOLS=(
    ["bash"]="GNU Bash shell (version 4.0+)"
    ["jq"]="JSON processor for parsing configuration files"
    ["curl"]="HTTP client for API interactions"
    ["git"]="Version control system"
    ["node"]="Node.js runtime for JavaScript operations"
    ["npm"]="Node Package Manager"
    ["python3"]="Python 3 interpreter for automation scripts"
    ["docker"]="Container runtime for deployment"
)

declare -A OPTIONAL_TOOLS=(
    ["yq"]="YAML processor for advanced configuration parsing"
    ["kubectl"]="Kubernetes command-line tool"
    ["terraform"]="Infrastructure as Code tool"
    ["redis-cli"]="Redis command-line interface"
    ["psql"]="PostgreSQL command-line interface"
    ["aws"]="AWS CLI for cloud operations"
    ["gcloud"]="Google Cloud SDK"
)

declare -A TERRAFUSION_TOOLS=(
    ["powershell"]="PowerShell for Windows script compatibility"
    ["dotnet"]=".NET runtime for TerraFusion OS kernel"
    ["shellcheck"]="Shell script analyzer for quality assurance"
    ["timeout"]="Command timeout utility"
)

# =============================================================================
# Installation Functions
# =============================================================================

install_jq() {
    log_info "Installing jq..."
    
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update && sudo apt-get install -y jq
    elif command -v yum >/dev/null 2>&1; then
        sudo yum install -y jq
    elif command -v brew >/dev/null 2>&1; then
        brew install jq
    elif command -v apk >/dev/null 2>&1; then
        sudo apk add jq
    else
        log_warn "Package manager not found. Please install jq manually."
        log_info "Download from: https://github.com/stedolan/jq/releases"
        return 1
    fi
}

install_yq() {
    log_info "Installing yq..."
    
    local yq_version="v4.35.2"
    local yq_binary="yq_linux_amd64"
    
    # Detect architecture
    case "$(uname -m)" in
        x86_64) yq_binary="yq_linux_amd64" ;;
        aarch64|arm64) yq_binary="yq_linux_arm64" ;;
        armv7l) yq_binary="yq_linux_arm" ;;
        *) log_warn "Architecture $(uname -m) may not be supported" ;;
    esac
    
    # Download and install
    curl -L "https://github.com/mikefarah/yq/releases/download/${yq_version}/${yq_binary}" \
         -o /tmp/yq && \
    sudo mv /tmp/yq /usr/local/bin/yq && \
    sudo chmod +x /usr/local/bin/yq
}

install_node() {
    log_info "Installing Node.js..."
    
    # Try to install via package manager first
    if command -v apt-get >/dev/null 2>&1; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum >/dev/null 2>&1; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs npm
    elif command -v brew >/dev/null 2>&1; then
        brew install node
    else
        log_warn "Please install Node.js manually from: https://nodejs.org/"
        return 1
    fi
}

install_docker() {
    log_info "Installing Docker..."
    
    if command -v apt-get >/dev/null 2>&1; then
        # Ubuntu/Debian
        sudo apt-get update
        sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    elif command -v yum >/dev/null 2>&1; then
        # CentOS/RHEL/Fedora
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io
    else
        log_warn "Please install Docker manually from: https://docs.docker.com/get-docker/"
        return 1
    fi
    
    # Start Docker service
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add current user to docker group
    sudo usermod -aG docker "${USER}"
    log_info "Added ${USER} to docker group. Please log out and back in for changes to take effect."
}

install_powershell() {
    log_info "Installing PowerShell..."
    
    if command -v apt-get >/dev/null 2>&1; then
        # Ubuntu/Debian
        curl -L https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb -o /tmp/packages-microsoft-prod.deb
        sudo dpkg -i /tmp/packages-microsoft-prod.deb
        sudo apt-get update
        sudo apt-get install -y powershell
    elif command -v yum >/dev/null 2>&1; then
        # CentOS/RHEL/Fedora
        curl -L https://packages.microsoft.com/config/rhel/7/prod.repo | sudo tee /etc/yum.repos.d/microsoft.repo
        sudo yum install -y powershell
    else
        log_warn "Please install PowerShell manually from: https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell-core-on-linux"
        return 1
    fi
}

install_dotnet() {
    log_info "Installing .NET..."
    
    if command -v apt-get >/dev/null 2>&1; then
        # Ubuntu/Debian
        curl -L https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb -o /tmp/packages-microsoft-prod.deb
        sudo dpkg -i /tmp/packages-microsoft-prod.deb
        sudo apt-get update
        sudo apt-get install -y dotnet-sdk-8.0
    elif command -v yum >/dev/null 2>&1; then
        # CentOS/RHEL/Fedora
        sudo rpm -Uvh https://packages.microsoft.com/config/fedora/36/packages-microsoft-prod.rpm
        sudo dnf install -y dotnet-sdk-8.0
    else
        log_warn "Please install .NET manually from: https://dotnet.microsoft.com/download"
        return 1
    fi
}

install_shellcheck() {
    log_info "Installing ShellCheck..."
    
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update && sudo apt-get install -y shellcheck
    elif command -v yum >/dev/null 2>&1; then
        sudo yum install -y ShellCheck
    elif command -v brew >/dev/null 2>&1; then
        brew install shellcheck
    elif command -v apk >/dev/null 2>&1; then
        sudo apk add shellcheck
    else
        # Install from GitHub releases
        local sc_version="v0.9.0"
        case "$(uname -m)" in
            x86_64) sc_arch="x86_64" ;;
            aarch64|arm64) sc_arch="aarch64" ;;
            *) log_warn "Architecture $(uname -m) may not be supported"; return 1 ;;
        esac
        
        curl -L "https://github.com/koalaman/shellcheck/releases/download/${sc_version}/shellcheck-${sc_version}.linux.${sc_arch}.tar.xz" \
             -o /tmp/shellcheck.tar.xz && \
        tar -xf /tmp/shellcheck.tar.xz -C /tmp && \
        sudo mv "/tmp/shellcheck-${sc_version}/shellcheck" /usr/local/bin/ && \
        sudo chmod +x /usr/local/bin/shellcheck
    fi
}

# =============================================================================
# Tool Checking Functions
# =============================================================================

check_tool_version() {
    local tool="$1"
    local min_version="${2:-}"
    
    case "$tool" in
        "bash")
            local version
            version=$(bash --version | head -n1 | grep -oE '[0-9]+\.[0-9]+')
            if [[ -n "$min_version" ]] && ! version_gte "$version" "$min_version"; then
                log_warn "Bash version $version < $min_version (recommended)"
                return 1
            fi
            log_debug "Bash version: $version"
            ;;
        "node")
            local version
            version=$(node --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
            if [[ -n "$min_version" ]] && ! version_gte "$version" "$min_version"; then
                log_warn "Node.js version $version < $min_version (recommended)"
                return 1
            fi
            log_debug "Node.js version: $version"
            ;;
        "python3")
            local version
            version=$(python3 --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
            if [[ -n "$min_version" ]] && ! version_gte "$version" "$min_version"; then
                log_warn "Python3 version $version < $min_version (recommended)"
                return 1
            fi
            log_debug "Python3 version: $version"
            ;;
        "docker")
            local version
            version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
            if [[ -n "$min_version" ]] && ! version_gte "$version" "$min_version"; then
                log_warn "Docker version $version < $min_version (recommended)"
                return 1
            fi
            log_debug "Docker version: $version"
            ;;
        "dotnet")
            local version
            version=$(dotnet --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
            if [[ -n "$min_version" ]] && ! version_gte "$version" "$min_version"; then
                log_warn ".NET version $version < $min_version (recommended)"
                return 1
            fi
            log_debug ".NET version: $version"
            ;;
    esac
    
    return 0
}

version_gte() {
    local version1="$1"
    local version2="$2"
    
    # Simple version comparison
    if [[ "$version1" == "$version2" ]]; then
        return 0
    fi
    
    local IFS=.
    local i ver1=($version1) ver2=($version2)
    
    for ((i=0; i<${#ver1[@]} || i<${#ver2[@]}; i++)); do
        if [[ ${ver1[i]:-0} -gt ${ver2[i]:-0} ]]; then
            return 0
        fi
        if [[ ${ver1[i]:-0} -lt ${ver2[i]:-0} ]]; then
            return 1
        fi
    done
    
    return 0
}

# =============================================================================
# Main Tool Verification
# =============================================================================

verify_and_install_tools() {
    local install_missing="${1:-false}"
    local missing_tools=()
    local outdated_tools=()
    local installed_tools=()
    
    log_info "TerraFusion Tool Verification Starting..."
    
    # Check required tools
    log_info "Checking required tools..."
    for tool in "${!REQUIRED_TOOLS[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            log_info "✅ Found: $tool - ${REQUIRED_TOOLS[$tool]}"
            installed_tools+=("$tool")
            
            # Check version for specific tools
            case "$tool" in
                "bash") check_tool_version "$tool" "4.0" || outdated_tools+=("$tool") ;;
                "node") check_tool_version "$tool" "16.0.0" || outdated_tools+=("$tool") ;;
                "python3") check_tool_version "$tool" "3.8.0" || outdated_tools+=("$tool") ;;
            esac
        else
            log_warn "❌ Missing: $tool - ${REQUIRED_TOOLS[$tool]}"
            missing_tools+=("$tool")
        fi
    done
    
    # Check TerraFusion-specific tools
    log_info "Checking TerraFusion-specific tools..."
    for tool in "${!TERRAFUSION_TOOLS[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            log_info "✅ Found: $tool - ${TERRAFUSION_TOOLS[$tool]}"
            installed_tools+=("$tool")
            
            case "$tool" in
                "dotnet") check_tool_version "$tool" "8.0.0" || outdated_tools+=("$tool") ;;
                "docker") check_tool_version "$tool" "20.0.0" || outdated_tools+=("$tool") ;;
            esac
        else
            log_warn "❌ Missing: $tool - ${TERRAFUSION_TOOLS[$tool]}"
            missing_tools+=("$tool")
        fi
    done
    
    # Check optional tools
    log_info "Checking optional tools..."
    for tool in "${!OPTIONAL_TOOLS[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            log_info "✅ Found: $tool - ${OPTIONAL_TOOLS[$tool]}"
            installed_tools+=("$tool")
        else
            log_debug "⚪ Optional: $tool - ${OPTIONAL_TOOLS[$tool]}"
        fi
    done
    
    # Install missing tools if requested
    if [[ "$install_missing" == "true" ]] && [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_info "Installing missing tools..."
        
        for tool in "${missing_tools[@]}"; do
            log_info "Installing $tool..."
            case "$tool" in
                "jq") install_jq ;;
                "yq") install_yq ;;
                "node") install_node ;;
                "docker") install_docker ;;
                "powershell") install_powershell ;;
                "dotnet") install_dotnet ;;
                "shellcheck") install_shellcheck ;;
                *)
                    log_warn "No automatic installation available for: $tool"
                    log_info "Please install $tool manually"
                    ;;
            esac
        done
    fi
    
    # Summary report
    log_info "Tool Verification Summary:"
    log_info "  ✅ Installed: ${#installed_tools[@]} tools"
    log_info "  ❌ Missing: ${#missing_tools[@]} tools"
    log_info "  ⚠️  Outdated: ${#outdated_tools[@]} tools"
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_warn "Missing tools: ${missing_tools[*]}"
        log_info "Run with --install flag to automatically install missing tools"
    fi
    
    if [[ ${#outdated_tools[@]} -gt 0 ]]; then
        log_warn "Outdated tools: ${outdated_tools[*]}"
        log_info "Please update these tools for optimal performance"
    fi
    
    # Return non-zero if any required tools are missing
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        return 1
    fi
    
    return 0
}

# =============================================================================
# System Environment Setup
# =============================================================================

setup_terrafusion_environment() {
    log_info "Setting up TerraFusion environment..."
    
    # Create necessary directories
    local dirs=(
        "var/log/ops"
        "var/lock"
        "var/tmp"
        "var/backup"
        "var/cache"
    )
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log_debug "Created directory: $dir"
        fi
    done
    
    # Set proper permissions
    chmod 755 var/log/ops var/lock var/tmp var/backup var/cache
    
    # Create environment file if it doesn't exist
    if [[ ! -f ".env.ops" ]]; then
        cat > .env.ops << EOF
# TerraFusion Operations Environment
TERRAFUSION_VERSION=2.0.0
TERRAFUSION_ENV=development
TERRAFUSION_LOG_LEVEL=INFO
TERRAFUSION_LOG_DIR=./var/log/ops
TERRAFUSION_LOCK_DIR=./var/lock
TERRAFUSION_BACKUP_DIR=./var/backup
TERRAFUSION_AI_AGENTS=50000
TERRAFUSION_ORCHESTRATION_LAYERS=11
TERRAFUSION_MARKETPLACE_REVENUE=5400000

# Tool configurations
SHELLCHECK_OPTS="-e SC1091,SC2034,SC2155"
DOCKER_BUILDKIT=1
COMPOSE_DOCKER_CLI_BUILD=1
EOF
        log_info "Created TerraFusion ops environment file: .env.ops"
    fi
    
    log_info "TerraFusion environment setup complete"
}

# =============================================================================
# Usage & Main Function
# =============================================================================

show_usage() {
    cat << EOF
TerraFusion Tool Verification & Installation

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --install           Automatically install missing tools
    --setup-env         Set up TerraFusion environment directories
    --check-only        Only check tools, don't install anything
    --help              Show this help message

EXAMPLES:
    # Check tools without installing
    $0 --check-only

    # Check and install missing tools
    $0 --install

    # Set up environment only
    $0 --setup-env

    # Full setup (check, install, and setup environment)
    $0 --install --setup-env

EOF
}

main() {
    # Initialize TerraFusion library
    terrafusion_lib_init "ensure-tools" false
    
    local install_missing=false
    local setup_env=false
    local check_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --install)
                install_missing=true
                shift
                ;;
            --setup-env)
                setup_env=true
                shift
                ;;
            --check-only)
                check_only=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown argument: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Default behavior if no flags specified
    if [[ "$install_missing" == "false" ]] && [[ "$setup_env" == "false" ]] && [[ "$check_only" == "false" ]]; then
        install_missing=true
        setup_env=true
    fi
    
    log_info "TerraFusion Tool Verification v$TERRAFUSION_LIB_VERSION"
    
    # Verify and potentially install tools
    if ! verify_and_install_tools "$install_missing"; then
        if [[ "$install_missing" == "false" ]]; then
            log_error "Tool verification failed. Run with --install to fix missing tools."
            exit 1
        fi
    fi
    
    # Set up environment if requested
    if [[ "$setup_env" == "true" ]]; then
        setup_terrafusion_environment
    fi
    
    log_info "Tool verification complete! ✅"
    log_info "TerraFusion operations environment is ready."
    
    return 0
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi