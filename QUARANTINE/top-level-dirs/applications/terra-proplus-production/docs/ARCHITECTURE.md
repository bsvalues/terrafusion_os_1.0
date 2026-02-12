# TerraFusionProPlus Architecture Overview

## MCP Server
- Central orchestrator for agentic workflows
- Exposes endpoints: `/agent/intent`, `/agent/suggest`, `/agent/execute`, `/agent/context`, `/agent/feedback`
- Uses plugin registry for microservice integration

## Plugin Trait (Rust)
```rust
pub trait AgentPlugin: Send + Sync {
    fn name(&self) -> &'static str;
    fn can_handle(&self, intent: &str) -> bool;
    fn handle(&self, intent: &str, context: &serde_json::Value) -> serde_json::Value;
}
```

## Plugin Registry
- Register plugins for analytics, compliance, document, and future services
- MCP server delegates requests to plugins based on intent

## Microservice API Contracts

### Analytics Service
- POST `/analyze_market`
- Request: `{ property_id, comps, user_context }`
- Response: `{ summary, trend_chart, suggestions }`

### Compliance Service
- POST `/check_compliance`
- Request: `{ property_id, fields, user_context }`
- Response: `{ compliant, issues, rationale }`

### Document Service
- POST `/upload_document`
- Request: `{ property_id, file_name, file_data, user_context }`
- Response: `{ success, message }`

## Security & Audit
- RBAC, audit logging, encrypted secrets
- All agentic actions are traceable and explainable

## Next Steps
- Integrate plugins in MCP server
- Implement agentic flows: intent → plugin → result → Copilot UI
- Harden security and monitoring
