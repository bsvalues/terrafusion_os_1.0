# TerraFlow - Workflow Automation Engine Development Guide

## 🏛️ Project Context

TerraFlow is the **workflow orchestration engine** within TerraFusion OS, a complete government operating system serving 39+ Washington State counties. This workspace focuses on **government workflow automation** - coordinating property assessments, tax levy processing, compliance monitoring, and cross-application orchestration across the TerraFusion ecosystem.

**Current Workspace**: Multi-component workflow system with Node.js/TypeScript core, React frontend components, Python integrations, and .NET backend coordination.

## 🏗️ Architecture Overview

### TerraFlow Core Components

- **Workflow Engine** (`workflow-engine/`) - Core orchestration logic with state machines
- **Property Assessment** (`property-assessment/`) - Property valuation and assessment workflows  
- **Tax Levy Processing** (`tax-levy/`) - Tax calculation and levy generation workflows
- **Compliance Workflows** (`compliance-workflows/`) - Regulatory compliance automation
- **Automation Scripts** (`automation-scripts/`) - Cross-app coordination and triggers
- **API Layer** (`api/`) - RESTful endpoints for workflow management

### Integration Points & Data Flow

- **Cross-App Orchestration**: Coordinates 14+ government applications (TerraLevy, TerraAssessor, CostForgeAI, TerraInsight)
- **AI Agent Coordination**: Interfaces with 50,000+ AI agents through TerraFusion.Consciousness
- **Legacy Systems**: Integrates with Harris PACS v12.4.7, Tyler Technologies, Aumentum Systems
- **Database Layer**: PostgreSQL with Entity Framework Core, county data isolation
- **Event-Driven**: Uses triggers, webhooks, and message buses for workflow coordination

## 🛠️ Development Workflows

### TerraFlow Build & Test Commands

```bash
# Build TerraFlow (from terra-flow/ folder)
npm run build:terra-flow

# Test TerraFlow workflows
npm run test:terra-flow

# Test specific workflow types
npm run test:assessment --parcels=100
npm run test:levy --dry-run

# Validate workflow definitions
npm run validate-workflows

# Run compliance validation
npm run validate:compliance
```

### Workflow Development Commands

```bash
# Generate workflow documentation
npm run docs:generate

# Performance benchmark workflows
npm run benchmark --workflows=100 --target-latency=100ms

# Validate integration with backend
./SDK/tools/validate-integration.sh --service=terra-flow --workflow-validation

# Security compliance scan
./SDK/tools/security-scan.sh --service=terra-flow --fisma-moderate --workflow-security
```

## 🎯 TerraFlow-Specific Patterns

### Workflow Definition Pattern

```typescript
// Government workflow definition
interface GovernmentWorkflow {
  id: string;
  name: string;
  type: 'property_assessment' | 'tax_levy' | 'compliance_monitoring' | 'harris_pacs_sync';
  phases: WorkflowPhase[];
  triggers: string[];
  conditions: string[];
  hooks: WorkflowHooks;
}

// Property Assessment workflow example
const propertyAssessmentWorkflow: GovernmentWorkflow = {
  id: 'property-assessment',
  name: 'Property Assessment Workflow', 
  type: 'property_assessment',
  phases: [
    { id: 'data-collection', agentRequirements: ['data_processor'], estimatedDuration: 2000 },
    { id: 'ai-analysis', agentRequirements: ['valuation_ai'], estimatedDuration: 3000 },
    { id: 'human-review', agentRequirements: ['senior_assessor'], estimatedDuration: 1500 }
  ],
  triggers: ['property-created', 'assessment-requested'],
  conditions: ['property-data-complete', 'assessor-available']
};
```

### Cross-App Automation Pattern

```typescript
// Cross-application workflow coordination
class CrossAppAutomation {
  async executePropertyWorkflow(propertyId: string): Promise<WorkflowResult> {
    // 1. TerraAssessor: Property data collection
    const propertyData = await this.terraAssessor.getPropertyData(propertyId);
    
    // 2. CostForgeAI: AI-powered valuation
    const valuation = await this.costForgeAI.calculateValue(propertyData);
    
    // 3. TerraLevy: Tax calculation
    const taxCalculation = await this.terraLevy.calculateTax(valuation);
    
    // 4. TerraInsight: Generate insights
    const insights = await this.terraInsight.generateReport({
      property: propertyData,
      valuation,
      tax: taxCalculation
    });
    
    return { propertyData, valuation, taxCalculation, insights };
  }
}
```

### Government Compliance Workflow Pattern

```typescript
// Compliance monitoring workflow
class ComplianceWorkflow {
  async executeComplianceCheck(): Promise<ComplianceResult> {
    // Daily compliance validation
    const auditResults = await this.webAuditTracker.runAuditChecks();
    
    // Data quality assessment
    const dataQuality = await this.validateDataQuality({
      checks: ['completeness', 'accuracy', 'consistency']
    });
    
    // Generate compliance report
    if (dataQuality.score < 0.95) {
      await this.alertComplianceTeam({
        severity: 'high',
        recipients: ['compliance@terrafusion.com'],
        issue: 'Data quality below threshold'
      });
    }
    
    return {
      complianceScore: dataQuality.score,
      auditStatus: auditResults.status,
      recommendations: auditResults.recommendations
    };
  }
}
```

### Workflow State Management Pattern

```typescript
// Workflow state persistence and recovery
class WorkflowStateManager {
  async persistWorkflowState(workflowId: string, state: WorkflowState): Promise<void> {
    // Store in Redis for quick access
    await this.redis.set(`workflow:${workflowId}:state`, JSON.stringify(state));
    
    // Store in PostgreSQL for durability
    await this.db.workflows.update(workflowId, { 
      currentState: state,
      lastUpdated: new Date(),
      auditTrail: [...state.auditTrail, this.createAuditEntry(state)]
    });
  }
  
  async recoverWorkflow(workflowId: string): Promise<WorkflowState> {
    // Try Redis first for performance
    const cached = await this.redis.get(`workflow:${workflowId}:state`);
    if (cached) return JSON.parse(cached);
    
    // Fallback to database
    const workflow = await this.db.workflows.findById(workflowId);
    return workflow.currentState;
  }
}
```

## 🎨 TerraFlow UI/UX Patterns

### Workflow Builder Component Structure

```tsx
// Workflow visual builder with drag-and-drop
interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'database';
  name: string;
  position: { x: number; y: number };
  config: Record<string, any>;
}

// Government workflow templates
const governmentTemplates = [
  {
    id: 'property-assessment',
    name: 'Property Assessment Workflow',
    category: 'Property Management',
    tags: ['assessment', 'valuation', 'government'],
    nodes: [
      { type: 'trigger', name: 'Property Created', config: { table: 'properties', event: 'insert' }},
      { type: 'action', name: 'Collect Market Data', config: { service: 'market-analysis' }},
      { type: 'action', name: 'AI Valuation', config: { model: 'property_valuation_v2' }},
      { type: 'condition', name: 'Confidence Check', config: { threshold: 0.90 }},
      { type: 'action', name: 'Human Review', config: { assignee: 'senior_assessor' }}
    ]
  }
];
```

### TerraFlow Brand Integration

```tsx
// TerraFlow-specific UI components with government branding
const TerraFlowCard = ({ workflow }: { workflow: Workflow }) => (
  <Card className="tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/20 
    rounded-2xl shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1">
    <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent
      via-[#00ffee]/20 to-transparent" />
    <div className="p-6">
      <h3 className="text-lg font-bold bg-gradient-to-r from-[#0099ff] via-[#00ffee] 
        to-[#00ffaa] bg-clip-text text-transparent">
        {workflow.name}
      </h3>
      <p className="text-sm text-gray-400">{workflow.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="tf-status-badge">{workflow.status}</span>
        <span className="text-xs text-[#00ffee]">
          {workflow.runCount} executions • {workflow.successRate}% success
        </span>
      </div>
    </div>
  </Card>
);
```

## 🚨 Critical Rules & Constraints

### Government Workflow Requirements

- **County Data Isolation**: All workflows must respect county boundaries - data from Benton County cannot mix with Yakima County
- **Audit Trail Mandatory**: Every workflow execution must generate complete audit trail for government compliance (FISMA, NIST 800-53)
- **Harris PACS Integration**: Never modify Harris PACS sync workflows without county approval - these are production-critical
- **Workflow Persistence**: All workflow state must be persisted to handle system restarts and failures gracefully

### TerraFlow Development Constraints

- **Cross-App Dependencies**: Always validate that target applications (TerraLevy, CostForgeAI, etc.) are available before workflow execution
- **Performance Targets**: Workflow latency must stay under 100ms for simple workflows, 300ms for complex multi-app workflows  
- **State Management**: Use Redis for active workflow state, PostgreSQL for persistence, never rely on memory-only state
- **Error Handling**: Implement circuit breakers for external service calls and graceful degradation for non-critical steps

### Workflow Definition Standards

- **Template Validation**: All workflow templates must pass schema validation before deployment
- **Government Compliance**: Include required compliance steps (data validation, approval chains, notification requirements)
- **AI Integration**: When using AI agents, always specify consciousness level requirements and fallback procedures
- **Resource Limits**: Set timeouts and resource limits for all workflow steps to prevent runaway processes

## 📁 Key File Locations

### TerraFlow Core Components

- **Workflow Engine**: `workflow-engine/src/` - Core orchestration logic and state machines
- **Government Templates**: `workflow-engine/templates/` - Pre-built government workflow definitions
- **Property Workflows**: `property-assessment/src/` - Property valuation and assessment logic
- **Tax Workflows**: `tax-levy/src/` - Tax calculation and levy processing
- **Compliance Engine**: `compliance-workflows/src/` - Regulatory compliance automation
- **Cross-App Coordination**: `automation-scripts/src/` - Inter-application workflow triggers

### Configuration & Integration

- **Workflow Config**: `config/terra-flow.json` - Workflow engine configuration
- **Government Templates**: `templates/government/` - County-specific workflow templates
- **API Endpoints**: `api/routes/` - RESTful workflow management endpoints
- **Test Workflows**: `testing/workflows/` - Workflow validation and testing suite

## 🔧 Debug Entry Points

- **Workflow Status**: Check active workflow status and execution logs
- **Cross-App Health**: Validate connectivity to TerraLevy, CostForgeAI, TerraAssessor services
- **State Validation**: Verify workflow state persistence in Redis and PostgreSQL
- **Performance Metrics**: Monitor workflow execution times and resource usage
- **Compliance Audit**: Validate audit trail generation and government compliance
- **Template Validation**: Test workflow template definitions and deployment readiness

This guide focuses on TerraFlow workflow development within the broader TerraFusion government operating system ecosystem.
