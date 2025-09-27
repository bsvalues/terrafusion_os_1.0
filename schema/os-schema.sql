-- TerraFusion Government OS - System Database Schema
-- Core OS tables for kernel, modules, counties, and marketplace

-- OS Modules registry
CREATE TABLE IF NOT EXISTS os_modules (
    module_id TEXT PRIMARY KEY,
    module_name TEXT NOT NULL,
    module_type TEXT NOT NULL,
    version TEXT DEFAULT '1.0.0',
    status TEXT DEFAULT 'LOADED',
    port INTEGER,
    priority INTEGER DEFAULT 3,
    dependencies TEXT, -- JSON array of module dependencies
    manifest TEXT,     -- JSON module manifest
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- County workspaces registry
CREATE TABLE IF NOT EXISTS os_counties (
    county_id TEXT PRIMARY KEY,
    county_name TEXT NOT NULL,
    state_code TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    population INTEGER DEFAULT 0,
    parcels INTEGER DEFAULT 0,
    modules_purchased INTEGER DEFAULT 0,
    modules_developed INTEGER DEFAULT 0,
    monthly_revenue DECIMAL(10,2) DEFAULT 0.00,
    ai_agents_assigned INTEGER DEFAULT 0,
    workspace_path TEXT,
    database_path TEXT,
    config_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Swarm registry
CREATE TABLE IF NOT EXISTS ai_agents (
    agent_id TEXT PRIMARY KEY,
    agent_type TEXT NOT NULL,
    specialization TEXT,
    county_id TEXT,
    status TEXT DEFAULT 'ACTIVE',
    parent_agent TEXT,
    hierarchy_level INTEGER DEFAULT 0,
    capabilities TEXT, -- JSON array of capabilities
    performance_metrics TEXT, -- JSON performance data
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (county_id) REFERENCES os_counties(county_id)
);

-- Marketplace transactions
CREATE TABLE IF NOT EXISTS marketplace_transactions (
    transaction_id TEXT PRIMARY KEY,
    buyer_county TEXT NOT NULL,
    seller_county TEXT,
    module_name TEXT NOT NULL,
    module_version TEXT DEFAULT '1.0.0',
    transaction_type TEXT DEFAULT 'PURCHASE', -- PURCHASE, SALE, LICENSE
    amount DECIMAL(10,2) NOT NULL,
    county_share DECIMAL(10,2), -- 70% to county
    platform_share DECIMAL(10,2), -- 30% to platform
    status TEXT DEFAULT 'COMPLETED',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_county) REFERENCES os_counties(county_id)
);

-- Module catalog for marketplace
CREATE TABLE IF NOT EXISTS module_catalog (
    catalog_id TEXT PRIMARY KEY,
    module_name TEXT NOT NULL,
    developer_county TEXT,
    category TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    downloads INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    tags TEXT, -- JSON array of tags
    requirements TEXT, -- JSON system requirements
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (developer_county) REFERENCES os_counties(county_id)
);

-- System events log
CREATE TABLE IF NOT EXISTS system_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    source TEXT NOT NULL, -- kernel, module, county, marketplace, ai_swarm
    county_id TEXT,
    module_id TEXT,
    event_data TEXT, -- JSON event details
    severity TEXT DEFAULT 'INFO', -- DEBUG, INFO, WARN, ERROR, CRITICAL
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OS configuration
CREATE TABLE IF NOT EXISTS os_config (
    config_key TEXT PRIMARY KEY,
    config_value TEXT NOT NULL,
    config_type TEXT DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default OS configuration
INSERT OR REPLACE INTO os_config (config_key, config_value, config_type, description) VALUES
('os_version', '1.0.0', 'string', 'TerraFusion OS Version'),
('kernel_status', 'OPERATIONAL', 'string', 'Kernel operational status'),
('total_agents', '50000', 'integer', 'Total AI agents in production'),
('active_agents', '1008', 'integer', 'Currently active AI agents'),
('marketplace_economy', '23300000', 'decimal', 'Total marketplace economy ($23.3M)'),
('revenue_split_county', '0.70', 'decimal', 'County revenue share (70%)'),
('revenue_split_platform', '0.30', 'decimal', 'Platform revenue share (30%)'),
('boot_mode', 'production', 'string', 'OS boot mode'),
('log_level', 'INFO', 'string', 'System logging level');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_modules_status ON os_modules(status);
CREATE INDEX IF NOT EXISTS idx_modules_type ON os_modules(module_type);
CREATE INDEX IF NOT EXISTS idx_counties_status ON os_counties(status);
CREATE INDEX IF NOT EXISTS idx_agents_county ON ai_agents(county_id);
CREATE INDEX IF NOT EXISTS idx_agents_type ON ai_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON marketplace_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON system_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_type ON system_events(event_type);
