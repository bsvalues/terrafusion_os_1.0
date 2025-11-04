// AI Adapter - Connects to Claude/GPT + MCP Servers
use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::env;

#[derive(Debug, Serialize, Deserialize)]
pub struct AskRequest {
    pub workspace: String,
    pub query: String,
    pub context: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AskResponse {
    pub workspace: String,
    pub query: String,
    pub answer: String,
    pub suggested_next: Vec<String>,
    pub sources: Vec<String>,
}

#[derive(Debug, Serialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: i32,
    messages: Vec<ClaudeMessage>,
    system: String,
}

#[derive(Debug, Serialize)]
struct ClaudeMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ClaudeResponse {
    content: Vec<ClaudeContent>,
}

#[derive(Debug, Deserialize)]
struct ClaudeContent {
    text: String,
}

/// Main AI adapter - routes to appropriate provider
pub async fn ask_ai(request: AskRequest) -> Result<AskResponse, String> {
    // Determine which AI provider to use based on environment
    let provider = env::var("AI_PROVIDER").unwrap_or_else(|_| "claude".to_string());

    match provider.as_str() {
        "claude" => ask_claude(request).await,
        "openai" => ask_openai(request).await,
        "copilot" => ask_copilot(request).await,
        _ => ask_claude(request).await, // Default to Claude
    }
}

/// Ask Claude via Anthropic API
async fn ask_claude(request: AskRequest) -> Result<AskResponse, String> {
    let api_key = env::var("ANTHROPIC_API_KEY").ok();
    
    if api_key.is_none() {
        tracing::warn!("ANTHROPIC_API_KEY not set, using mock response");
        return Ok(generate_mock_response(request));
    }

    let client = Client::new();
    
    // Build context-aware system prompt
    let system_prompt = build_system_prompt(&request.workspace);
    
    // Build user message with workspace context
    let user_message = if let Some(ctx) = &request.context {
        format!(
            "Workspace: {}\n\nContext:\n{}\n\nUser Query: {}",
            request.workspace, ctx, request.query
        )
    } else {
        format!(
            "Workspace: {}\n\nUser Query: {}",
            request.workspace, request.query
        )
    };

    let claude_request = ClaudeRequest {
        model: "claude-3-5-sonnet-20241022".to_string(),
        max_tokens: 4096,
        messages: vec![ClaudeMessage {
            role: "user".to_string(),
            content: user_message,
        }],
        system: system_prompt,
    };

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key.unwrap())
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&claude_request)
        .send()
        .await
        .map_err(|e| format!("Failed to call Claude API: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Claude API error {}: {}", status, text));
    }

    let claude_response: ClaudeResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Claude response: {}", e))?;

    let answer = claude_response
        .content
        .first()
        .map(|c| c.text.clone())
        .unwrap_or_else(|| "No response from Claude".to_string());

    // Extract suggested next steps (simple heuristic)
    let suggested_next = extract_suggested_actions(&answer);

    Ok(AskResponse {
        workspace: request.workspace,
        query: request.query,
        answer,
        suggested_next,
        sources: vec!["Claude 3.5 Sonnet".to_string()],
    })
}

/// Ask OpenAI GPT
async fn ask_openai(request: AskRequest) -> Result<AskResponse, String> {
    // TODO: Implement OpenAI integration
    tracing::warn!("OpenAI integration not yet implemented, using mock");
    Ok(generate_mock_response(request))
}

/// Ask GitHub Copilot
async fn ask_copilot(request: AskRequest) -> Result<AskResponse, String> {
    // TODO: Implement GitHub Copilot integration
    tracing::warn!("Copilot integration not yet implemented, using mock");
    Ok(generate_mock_response(request))
}

/// Build system prompt based on workspace
fn build_system_prompt(workspace: &str) -> String {
    let base_prompt = r#"You are an AI assistant for the TerraFusion Command Portal, helping users work with government technology workspaces.

You have access to workspaces via MCP (Model Context Protocol) servers. Each workspace represents a government application or service.

When answering questions:
1. Be specific to the workspace context
2. Provide actionable next steps
3. Use plain English for non-technical users
4. Offer to execute actions via MCP servers (test, deploy, query data)
5. Always verify information before making changes

Your goal is to make technical systems accessible to domain experts (tax assessors, legal staff, government analysts) who may not have coding experience."#;

    // Add workspace-specific context
    let workspace_context = match workspace {
        "terra-levy" => r#"

Current Workspace: Terra Levy (Property Tax System)
- Purpose: Property tax assessment, rate calculations, billing cycles, tax roll generation
- Key Features: Zone-based tax rates, exemptions (homestead, senior), state compliance
- Users: Tax assessors, county commissioners, property appraisers
- Common Tasks: Verify tax rates, test calculations, generate reports, update zones"#,
        
        "terra-bank" => r#"

Current Workspace: Terra Bank (Banking & Financial Services)
- Purpose: Government banking operations, payment processing, account management
- Key Features: Transaction processing, account reconciliation, payment confirmations
- Users: Finance department, treasury staff, payment processors
- Common Tasks: Process payments, reconcile accounts, generate financial reports"#,
        
        "terra-collections" => r#"

Current Workspace: Terra Collections (Revenue Collection)
- Purpose: Delinquent account management, collections workflows, payment plans
- Key Features: Delinquency tracking, automated notices, payment plan setup
- Users: Collections agents, revenue officers, account managers
- Common Tasks: Track delinquencies, set up payment plans, generate notices"#,
        
        _ => "\n\nCurrent Workspace: Unknown workspace",
    };

    format!("{}{}", base_prompt, workspace_context)
}

/// Extract suggested actions from AI response
fn extract_suggested_actions(answer: &str) -> Vec<String> {
    // Simple heuristic: look for action-oriented sentences
    let mut actions = Vec::new();
    
    // Look for common action patterns
    let patterns = [
        "you can",
        "you could",
        "would you like",
        "i can",
        "i'll",
        "let me",
        "shall i",
    ];

    for line in answer.lines() {
        let lower = line.to_lowercase();
        if patterns.iter().any(|p| lower.contains(p)) {
            // Extract the action part
            if let Some(action) = line.split(':').nth(1) {
                actions.push(action.trim().to_string());
            } else if line.len() < 100 {
                actions.push(line.trim().to_string());
            }
        }
    }

    // If no actions found, provide generic helpful actions
    if actions.is_empty() {
        actions = vec![
            "Ask another question".to_string(),
            "View workspace documentation".to_string(),
            "Run tests".to_string(),
        ];
    }

    // Limit to 3 suggestions
    actions.truncate(3);
    actions
}

/// Generate enhanced response with TerraFusion context when API unavailable
fn generate_mock_response(request: AskRequest) -> AskResponse {
    let answer = match request.workspace.as_str() {
        "master" => format!(
            r#"I'm your AI assistant for the **TerraFusion Master Workspace** (Supreme Commander View).

Your question: "{}"

I can help you with:
• 📊 **System Overview**: Monitor all 57 workspaces across 5 tiers
• 🏗️ **Architecture**: Backend (.NET), Frontend (React), Marketplace (32 apps), OS Platform (12 domains)
• 👥 **AI Swarm**: Coordinate 50,000 agents (1 Supreme Commander, 1220 Field Generals, 48,779 Operational Forces)
• 🔧 **Operations**: Health monitoring, deployment orchestration, cross-pillar integration
• 📈 **Analytics**: Performance metrics, resource utilization, team productivity

**Current Status**: All core pillars operational, 57 workspaces validated
**Active Systems**: TerraFusion Command Portal (this interface), health monitoring, AI coordination

What specific aspect of the TerraFusion ecosystem would you like to explore?"#,
            request.query
        ),
        "backend" => format!(
            r#"I'm your AI assistant for the **TerraFusion .NET Backend** workspace.

Your question: "{}"

**Backend Architecture**:
• 🏗️ **Framework**: ASP.NET Core 8.0 with microservices architecture
• 🔌 **APIs**: RESTful services for all marketplace apps and government portals
• 🗄️ **Database**: PostgreSQL with Entity Framework Core
• 🔐 **Security**: JWT authentication, role-based authorization, audit trails
• 📊 **Monitoring**: Health checks, metrics, distributed tracing

**Key Services**:
• Authentication & Authorization service
• Data access layer for all marketplace apps
• Integration APIs for government systems
• Audit and compliance logging
• Performance monitoring and analytics

I can help with API development, database queries, security implementation, or troubleshooting backend issues."#,
            request.query
        ),
        "frontend" => format!(
            r#"I'm your AI assistant for the **TerraFusion React Frontend** workspace.

Your question: "{}"

**Frontend Architecture**:
• ⚡ **Framework**: React 18 with Next.js 15, TypeScript
• 🎨 **UI**: Tailwind CSS, component library, responsive design  
• 🔄 **State**: SWR for data fetching, Context API for global state
• 🧪 **Testing**: Jest, React Testing Library, Playwright E2E
• 🚀 **Performance**: Code splitting, lazy loading, optimized bundles

**Key Features**:
• 📱 Responsive design for desktop/mobile government staff
• 🔐 Role-based UI with secure authentication flows
• 📊 Real-time dashboards with live data updates
• ♿ Accessibility compliant (WCAG 2.1 AA)
• 🎯 Optimized for government workflow efficiency

I can help with component development, state management, UI/UX optimization, or debugging frontend issues."#,
            request.query
        ),
        "os-platform" => format!(
            r#"I'm your AI assistant for the **TerraFusion OS Platform** workspace.

Your question: "{}"

**OS Platform Domains** (12 specialized systems):
• 🤖 **AI Systems**: Agent coordination, ML pipelines, cognitive services
• 🔐 **Authentication**: SSO, identity management, security protocols
• 🧠 **Consciousness**: System awareness, decision engines, autonomous operations
• 🛠️ **Development**: DevOps tools, CI/CD, code generation, testing frameworks
• ⚙️ **Engines**: Core processing engines, workflow orchestration, job queues
• 🏗️ **Infrastructure**: Cloud resources, containerization, service mesh
• 📊 **Monitoring**: System health, performance metrics, alerting, observability
• ⚡ **Performance**: Optimization services, caching, load balancing
• 🛡️ **Security**: Threat detection, compliance monitoring, vulnerability scanning
• 🔧 **Services**: Shared services, utilities, common libraries
• 🎯 **Specialized**: Domain-specific tools, custom integrations
• 🔒 **Trust**: Certificate management, key rotation, secure communications

**Integration Points**: All platform services integrate with Backend, Frontend, and Marketplace pillars.

I can help with platform architecture, service integration, security implementation, or performance optimization."#,
            request.query
        ),
        "terra-levy" => format!(
            r#"I'm your AI assistant for **Terra Levy** (Property Tax Assessment System).

Your question: "{}"

**System Overview**:
• 🏘️ **Purpose**: Automated property tax assessment and collection for local government
• 📊 **Coverage**: All residential, commercial, and industrial properties in jurisdiction
• 💰 **Tax Zones**: 6 different tax zones with varying rates and rules
• 🏛️ **Compliance**: Fully compliant with State Tax Code §47-2-103
• 📅 **Assessment Cycle**: Annual assessments with quarterly reviews

**Key Features**:
• Property valuation using market data and GIS integration
• Automated tax calculation with exemption processing
• Payment processing and installment plan management
• Appeals workflow and hearing schedule management
• Integration with county assessor and state revenue systems

**Recent Updates**:
• Version 2.1.0 deployed October 10, 2025
• Enhanced GIS integration for improved accuracy
• New appeals portal for property owners
• Performance improvements (40% faster processing)

I can help with tax calculations, property assessments, system configuration, or troubleshooting.

Would you like me to:
1. Show you specific tax rates for a zone
2. Run test calculations with sample properties
3. Generate a tax roll report
4. Explain how a specific feature works

Note: This is a mock response. Connect to Claude/GPT for real answers."#,
            request.query
        ),
        
        "terra-bank" => {
            format!(
                "I can help you with terra-bank (Banking System).\n\nYour question: \"{}\"\n\nHere's what I found:\n• Terra Bank processes all government payments\n• Supports ACH transfers, checks, and card payments\n• Daily reconciliation runs at 11:00 PM\n• Current status: Running (no alerts)\n\nWould you like me to:\n1. Show recent transactions\n2. Run reconciliation report\n3. Process a test payment\n4. Explain payment flow\n\nNote: This is a mock response. Connect to Claude/GPT for real answers.",
                request.query
            )
        },
        
        _ => {
            format!(
                "I can help you with the {} workspace.\n\nYour question: \"{}\"\n\nI don't have specific information about this workspace yet, but I can help you:\n1. Explore the workspace structure\n2. View documentation\n3. Run health checks\n4. Connect to the MCP server\n\nNote: This is a mock response. Connect to Claude/GPT for real answers.",
                request.workspace, request.query
            )
        },
    };

    AskResponse {
        workspace: request.workspace,
        query: request.query,
        answer,
        suggested_next: vec![
            "Generate a report".to_string(),
            "Run tests".to_string(),
            "View documentation".to_string(),
        ],
        sources: vec!["Mock Response (no AI API configured)".to_string()],
    }
}
