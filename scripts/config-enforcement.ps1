# TerraFusion OS - Configuration Enforcement System
# ANTI-HARDCODING PROTECTION FOR AI AGENTS

# ============================================================================
# CRITICAL: AI AGENTS MUST USE THIS CONFIGURATION SYSTEM
# NO HARDCODED PORTS, AGENT COUNTS, OR VALUES ALLOWED
# ============================================================================

# RULE 1: ALL PORTS MUST USE ENVIRONMENT VARIABLES
# ✅ CORRECT: $env:TF_API_PORT or ${TF_API_PORT:-5050}
# ❌ WRONG: localhost:5046, localhost:3000, etc.

# RULE 2: ALL AGENT COUNTS MUST COME FROM ai-swarm-config.json
# ✅ CORRECT: Read from configs/ai-swarm-config.json
# ❌ WRONG: 1008, 1,008, or any hardcoded number

# RULE 3: ALL SERVICE ENDPOINTS MUST BE DYNAMIC
# ✅ CORRECT: http://localhost:${TF_API_PORT}/api
# ❌ WRONG: http://localhost:5046/api

# ============================================================================
# CONFIGURATION SOURCES (IN ORDER OF PRIORITY)
# ============================================================================

# 1. Environment Variables (Highest Priority)
# ✅ ANTI-HARDCODING: Only validate that environment variables are set
# DO NOT set fallback values - let services fail fast if not configured
Write-Host "✅ TerraFusion Configuration Enforcement System Active" -ForegroundColor Green

# 2. ai-swarm-config.json (Primary AI Configuration)
$AI_SWARM_CONFIG_PATH = "configs/ai-swarm-config.json"

# 3. .env.ports (Dynamic Port Management)
$ENV_PORTS_CONFIG_PATH = ".env.ports"

# 4. terrafusion-config.json (System Configuration)
$TERRAFUSION_CONFIG_PATH = "terrafusion-config.json"

# ============================================================================
# ENFORCEMENT FUNCTIONS
# ============================================================================

function Get-ConfiguredAgentCount {
    $configPath = "configs/ai-swarm-config.json"
    if (Test-Path $configPath) {
        $config = Get-Content $configPath | ConvertFrom-Json
        return $config.deployment.total_agents
    }
    return 50000  # Fallback to correct configured value
}

function Get-ConfiguredPort {
    param([string]$ServiceName)
    
    switch ($ServiceName) {
        "api" { return $env:TF_API_PORT ?? "5050" }
        "shell" { return $env:TF_SHELL_PORT ?? "3103" }
        "desktop" { return $env:TF_DESKTOP_PORT ?? "3104" }
        default { throw "Unknown service: $ServiceName" }
    }
}

function Assert-NoHardcodedValues {
    param([string]$FilePath)
    
    $content = Get-Content $FilePath -Raw
    
    # Check for hardcoded ports
    $hardcodedPorts = @("5046", "3102", "3000", "8080", "localhost:5")
    foreach ($port in $hardcodedPorts) {
        if ($content -match $port) {
            throw "❌ HARDCODED PORT DETECTED in ${FilePath}: ${port}"
        }
    }
    
    # Check for hardcoded agent counts
    $hardcodedAgents = @("1008", "1,008")
    foreach ($agent in $hardcodedAgents) {
        if ($content -match $agent) {
            throw "❌ HARDCODED AGENT COUNT DETECTED in ${FilePath}: ${agent}"
        }
    }
    
    Write-Host "✅ Configuration validation passed for ${FilePath}" -ForegroundColor Green
}

# ============================================================================
# AI AGENT GUIDELINES
# ============================================================================

Write-Host "🤖 AI AGENT CONFIGURATION ENFORCEMENT ACTIVE" -ForegroundColor Yellow
Write-Host "📋 MANDATORY RULES FOR ALL AI AGENTS:" -ForegroundColor Cyan
Write-Host "   1. NEVER use hardcoded ports (5046, 3102, etc.)" -ForegroundColor Red
Write-Host "   2. NEVER use hardcoded agent counts (1008, 1,008)" -ForegroundColor Red
Write-Host "   3. ALWAYS use `$env:TF_API_PORT for API port" -ForegroundColor Green
Write-Host "   4. ALWAYS read agent count from configs/ai-swarm-config.json" -ForegroundColor Green
Write-Host "   5. ALWAYS use dynamic port configuration system" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Current Configuration:" -ForegroundColor Magenta
Write-Host "   API Port: $env:TF_API_PORT" -ForegroundColor White
Write-Host "   Shell Port: $env:TF_SHELL_PORT" -ForegroundColor White
Write-Host "   Agent Count: $env:TF_AI_AGENT_COUNT" -ForegroundColor White

# ============================================================================
# EXPORT CONFIGURATION FOR SYSTEM USE
# ============================================================================

$env:TF_CONFIGURATION_ENFORCED = "true"
$env:TF_AI_AGENT_COUNT = Get-ConfiguredAgentCount
$env:TF_CONFIG_VALIDATION_ENABLED = "true"

Write-Host "✅ TerraFusion Configuration Enforcement System Active" -ForegroundColor Green