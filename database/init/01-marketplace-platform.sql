-- TerraFusion Marketplace Platform Database Initialization
-- Government Plugin Economy Infrastructure

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Government Plugin Registry
CREATE TABLE IF NOT EXISTS government_plugins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    developer_county VARCHAR(255) NOT NULL,
    price_per_county DECIMAL(10,2) DEFAULT 0.00,
    plugin_tier VARCHAR(50) DEFAULT 'standard',
    government_certified BOOLEAN DEFAULT false,
    fisma_compliant BOOLEAN DEFAULT false,
    fedramp_authorized BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cross-County Plugin Installations
CREATE TABLE IF NOT EXISTS plugin_installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id VARCHAR(255) NOT NULL,
    county_id VARCHAR(255) NOT NULL,
    installed_by VARCHAR(255) NOT NULL,
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    sandbox_id VARCHAR(255),
    FOREIGN KEY (plugin_id) REFERENCES government_plugins(plugin_id)
);

-- Revenue Sharing Tracking
CREATE TABLE IF NOT EXISTS plugin_revenue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id VARCHAR(255) NOT NULL,
    developer_county VARCHAR(255) NOT NULL,
    purchasing_county VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    developer_revenue DECIMAL(10,2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    FOREIGN KEY (plugin_id) REFERENCES government_plugins(plugin_id)
);

-- Plugin Security Compliance
CREATE TABLE IF NOT EXISTS plugin_security_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id VARCHAR(255) NOT NULL,
    audit_type VARCHAR(100) NOT NULL,
    compliance_level VARCHAR(50) NOT NULL,
    findings TEXT,
    passed BOOLEAN NOT NULL,
    audited_by VARCHAR(255) NOT NULL,
    audit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plugin_id) REFERENCES government_plugins(plugin_id)
);

-- Cross-County Collaboration
CREATE TABLE IF NOT EXISTS county_collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_county VARCHAR(255) NOT NULL,
    collaborating_county VARCHAR(255) NOT NULL,
    collaboration_type VARCHAR(100) NOT NULL,
    plugin_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plugin_id) REFERENCES government_plugins(plugin_id)
);

-- Plugin Performance Analytics
CREATE TABLE IF NOT EXISTS plugin_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id VARCHAR(255) NOT NULL,
    county_id VARCHAR(255) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plugin_id) REFERENCES government_plugins(plugin_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_plugin_installations_county ON plugin_installations(county_id);
CREATE INDEX IF NOT EXISTS idx_plugin_revenue_developer ON plugin_revenue(developer_county);
CREATE INDEX IF NOT EXISTS idx_plugin_revenue_date ON plugin_revenue(transaction_date);
CREATE INDEX IF NOT EXISTS idx_plugin_analytics_plugin ON plugin_analytics(plugin_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_plugin_security_plugin ON plugin_security_audits(plugin_id);

-- Insert initial TerraFusion marketplace plugins
INSERT INTO government_plugins (plugin_id, name, version, developer_county, price_per_county, plugin_tier, government_certified, fisma_compliant, fedramp_authorized) VALUES
('terrafusion-core', 'TerraFusion Core OS', '1.0.0', 'Benton County', 0.00, 'foundation', true, true, true),
('costforge-ai', 'CostForge AI Valuation', '1.0.0', 'Benton County', 89.00, 'premium', true, true, false),
('harris-pacs-integration', 'Harris PACS Integration', '1.0.0', 'Benton County', 45.00, 'enterprise', true, true, true),
('gis-core-engine', 'GIS Core Mapping Engine', '1.0.0', 'Benton County', 67.00, 'premium', true, true, false),
('cama-property-system', 'CAMA Property Assessment', '1.0.0', 'Benton County', 78.00, 'enterprise', true, true, true),
('compliance-automation', 'Government Compliance Automation', '1.0.0', 'Benton County', 38.00, 'standard', true, true, true),
('legacy-integration', 'Legacy System Integration', '1.0.0', 'Benton County', 15.00, 'standard', true, true, false);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO terrafusion;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO terrafusion;
