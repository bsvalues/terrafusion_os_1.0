-- TerraFusion cOS 2.0 - Database Initialization
-- MIT PhD Systems Design Engineer Standards

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS ai_swarm;
CREATE SCHEMA IF NOT EXISTS costforge;
CREATE SCHEMA IF NOT EXISTS sync;
CREATE SCHEMA IF NOT EXISTS flow;
CREATE SCHEMA IF NOT EXISTS security;
CREATE SCHEMA IF NOT EXISTS vendor;

-- AI Swarm Tables
CREATE TABLE IF NOT EXISTS ai_swarm.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_type VARCHAR(50) NOT NULL,
    hierarchy_level INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    capabilities JSONB,
    performance_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_swarm.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES ai_swarm.agents(id),
    task_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CostForge Tables
CREATE TABLE IF NOT EXISTS costforge.financial_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID,
    metric_type VARCHAR(100) NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS costforge.optimization_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID,
    recommendation_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    potential_savings DECIMAL(15,2),
    confidence_score DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync Tables
CREATE TABLE IF NOT EXISTS sync.data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID,
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    connection_config JSONB,
    sync_frequency INTEGER DEFAULT 300, -- seconds
    last_sync TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync.sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES sync.data_sources(id),
    sync_type VARCHAR(50) NOT NULL,
    records_processed INTEGER DEFAULT 0,
    records_successful INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_details JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Flow Tables
CREATE TABLE IF NOT EXISTS flow.workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID,
    workflow_name VARCHAR(255) NOT NULL,
    workflow_definition JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flow.workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES flow.workflows(id),
    execution_status VARCHAR(20) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_details JSONB
);

-- Security Tables
CREATE TABLE IF NOT EXISTS security.compliance_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID,
    check_type VARCHAR(100) NOT NULL,
    standard VARCHAR(50) NOT NULL, -- FISMA, NIST, etc.
    status VARCHAR(20) NOT NULL,
    details JSONB,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor Tables
CREATE TABLE IF NOT EXISTS vendor.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255),
    api_credentials JSONB,
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor.integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES vendor.vendors(id),
    integration_name VARCHAR(255) NOT NULL,
    integration_type VARCHAR(100) NOT NULL,
    configuration JSONB,
    status VARCHAR(20) DEFAULT 'active',
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_type ON ai_swarm.agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_agents_status ON ai_swarm.agents(status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON ai_swarm.tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON ai_swarm.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON ai_swarm.tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_financial_metrics_vendor ON costforge.financial_metrics(vendor_id);
CREATE INDEX IF NOT EXISTS idx_financial_metrics_type ON costforge.financial_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_financial_metrics_period ON costforge.financial_metrics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_data_sources_vendor ON sync.data_sources(vendor_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_status ON sync.data_sources(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_source_id ON sync.sync_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync.sync_logs(started_at);

CREATE INDEX IF NOT EXISTS idx_workflows_vendor ON flow.workflows(vendor_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON flow.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON flow.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON flow.workflow_executions(execution_status);

CREATE INDEX IF NOT EXISTS idx_compliance_checks_vendor ON security.compliance_checks(vendor_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_standard ON security.compliance_checks(standard);
CREATE INDEX IF NOT EXISTS idx_audit_logs_vendor ON security.audit_logs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON security.audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendor.vendors(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendors_type ON vendor.vendors(vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendor.vendors(status);
CREATE INDEX IF NOT EXISTS idx_integrations_vendor ON vendor.integrations(vendor_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON ai_swarm.agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON flow.workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendor.vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO vendor.vendors (vendor_name, vendor_type, contact_email, subscription_tier) VALUES
('Harris Computer Systems', 'Government Software', 'contact@harriscomputer.com', 'enterprise'),
('Tyler Technologies', 'Government Software', 'contact@tylertech.com', 'enterprise'),
('Esri', 'GIS Software', 'contact@esri.com', 'enterprise'),
('Woolpert', 'Federal Consulting', 'contact@woolpert.com', 'professional')
ON CONFLICT DO NOTHING;

-- Insert initial AI agents
INSERT INTO ai_swarm.agents (agent_type, hierarchy_level, status, capabilities) VALUES
('supreme_commander', 1, 'active', '{"consciousness_level": 5, "decision_capacity": 1000}'),
('ai_council', 2, 'active', '{"specialization": "strategic_planning", "agents_managed": 32}'),
('quantum_commanders', 2, 'active', '{"specialization": "quantum_optimization", "agents_managed": 256}'),
('domain_generals', 2, 'active', '{"specialization": "domain_expertise", "agents_managed": 932}'),
('process_coordinators', 3, 'active', '{"specialization": "workflow_management", "agents_managed": 12000}'),
('expert_specialists', 3, 'active', '{"specialization": "technical_expertise", "agents_managed": 15000}'),
('adaptive_executors', 3, 'active', '{"specialization": "execution", "agents_managed": 11779}'),
('micro_optimizers', 3, 'active', '{"specialization": "optimization", "agents_managed": 10000}')
ON CONFLICT DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW ai_swarm.agent_summary AS
SELECT 
    agent_type,
    COUNT(*) as total_agents,
    COUNT(*) FILTER (WHERE status = 'active') as active_agents,
    AVG((capabilities->>'agents_managed')::int) as avg_agents_managed
FROM ai_swarm.agents
GROUP BY agent_type;

CREATE OR REPLACE VIEW costforge.vendor_financial_summary AS
SELECT 
    v.vendor_name,
    COUNT(fm.id) as metric_count,
    SUM(fm.value) as total_value,
    AVG(fm.value) as avg_value
FROM vendor.vendors v
LEFT JOIN costforge.financial_metrics fm ON v.id = fm.vendor_id
GROUP BY v.id, v.vendor_name;

-- Grant permissions
GRANT USAGE ON SCHEMA ai_swarm TO terrafusion;
GRANT USAGE ON SCHEMA costforge TO terrafusion;
GRANT USAGE ON SCHEMA sync TO terrafusion;
GRANT USAGE ON SCHEMA flow TO terrafusion;
GRANT USAGE ON SCHEMA security TO terrafusion;
GRANT USAGE ON SCHEMA vendor TO terrafusion;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ai_swarm TO terrafusion;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA costforge TO terrafusion;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA sync TO terrafusion;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA flow TO terrafusion;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA security TO terrafusion;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA vendor TO terrafusion;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ai_swarm TO terrafusion;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA costforge TO terrafusion;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA sync TO terrafusion;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA flow TO terrafusion;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA security TO terrafusion;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA vendor TO terrafusion;
