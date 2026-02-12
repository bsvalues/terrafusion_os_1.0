-- ═══════════════════════════════════════════════════════════════════════════
-- TERRAFUSION OS - SOVEREIGN DATA LAYER SCHEMA
-- The foundational database schema for all Generation 2 applications
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Database: terrafusion_os
-- Owner: terrafusion_admin
-- Version: 1.0.0
-- Created: 2026-01-10
-- 
-- GOVERNMENT-GRADE REQUIREMENTS:
-- ✓ Multi-county data isolation
-- ✓ Complete audit trail
-- ✓ Role-based access control
-- ✓ FISMA-HIGH compliance ready
-- ═══════════════════════════════════════════════════════════════════════════

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: CORE IDENTITY & MULTI-TENANCY
-- ═══════════════════════════════════════════════════════════════════════════

-- Counties table (multi-tenant isolation)
CREATE TABLE IF NOT EXISTS counties (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code            VARCHAR(10) UNIQUE NOT NULL,        -- e.g., 'benton', 'franklin'
    name            VARCHAR(100) NOT NULL,               -- e.g., 'Benton County'
    state           VARCHAR(2) NOT NULL DEFAULT 'WA',
    timezone        VARCHAR(50) DEFAULT 'America/Los_Angeles',
    config          JSONB DEFAULT '{}',                  -- County-specific configuration
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (synced from OS Shell identity)
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id     VARCHAR(255) UNIQUE,                 -- External auth provider ID
    email           VARCHAR(255) UNIQUE NOT NULL,
    display_name    VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'analyst',  -- admin, assessor, analyst, citizen
    county_id       UUID REFERENCES counties(id),
    permissions     JSONB DEFAULT '[]',                  -- Array of permission strings
    preferences     JSONB DEFAULT '{}',                  -- User preferences
    last_login_at   TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table (for API authentication)
CREATE TABLE IF NOT EXISTS sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,               -- Hashed session token
    expires_at      TIMESTAMPTZ NOT NULL,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: TERRADOSSIER - NOTEBOOKS & DOCUMENTS
-- ═══════════════════════════════════════════════════════════════════════════

-- Notebooks table
CREATE TABLE IF NOT EXISTS notebooks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    county_id       UUID NOT NULL REFERENCES counties(id),
    title           VARCHAR(500) NOT NULL DEFAULT 'Untitled Notebook',
    icon            VARCHAR(10),                         -- Emoji icon
    description     TEXT,
    tags            JSONB DEFAULT '[]',                  -- Array of tag strings
    is_favorite     BOOLEAN DEFAULT FALSE,
    is_archived     BOOLEAN DEFAULT FALSE,
    is_template     BOOLEAN DEFAULT FALSE,               -- Template notebooks
    template_category VARCHAR(100),                      -- e.g., 'assessment', 'compliance'
    metadata        JSONB DEFAULT '{}',                  -- Extensible metadata
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notebooks_user ON notebooks(user_id);
CREATE INDEX idx_notebooks_county ON notebooks(county_id);
CREATE INDEX idx_notebooks_favorite ON notebooks(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_notebooks_template ON notebooks(is_template) WHERE is_template = TRUE;

-- Notebook blocks table (the content units)
CREATE TABLE IF NOT EXISTS notebook_blocks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notebook_id     UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    block_type      VARCHAR(50) NOT NULL,                -- text, heading, ai-prompt, ai-response, table, chart, code
    content         TEXT NOT NULL DEFAULT '',
    position        INTEGER NOT NULL DEFAULT 0,          -- Order within notebook
    metadata        JSONB DEFAULT '{}',                  -- Type-specific metadata
    ai_model_used   VARCHAR(100),                        -- For AI-generated blocks
    ai_prompt_id    UUID,                                -- Link to the prompt that generated this
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blocks_notebook ON notebook_blocks(notebook_id);
CREATE INDEX idx_blocks_position ON notebook_blocks(notebook_id, position);
CREATE INDEX idx_blocks_type ON notebook_blocks(block_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: AI SWARM INTEGRATION
-- ═══════════════════════════════════════════════════════════════════════════

-- AI conversations (chat sessions with the Swarm)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    county_id       UUID NOT NULL REFERENCES counties(id),
    notebook_id     UUID REFERENCES notebooks(id) ON DELETE SET NULL,  -- Optional link to notebook
    gpt_config_id   INTEGER,                             -- Reference to GPTConfiguration (legacy .NET)
    title           VARCHAR(500),
    model_provider  VARCHAR(50) NOT NULL DEFAULT 'openai',  -- openai, anthropic, local
    model_name      VARCHAR(100) NOT NULL DEFAULT 'gpt-4o',
    total_tokens    INTEGER DEFAULT 0,
    total_cost      DECIMAL(18, 6) DEFAULT 0,
    status          VARCHAR(50) DEFAULT 'active',        -- active, archived, deleted
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_conv_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_conv_notebook ON ai_conversations(notebook_id);

-- AI messages (individual messages in conversations)
CREATE TABLE IF NOT EXISTS ai_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,                -- user, assistant, system
    content         TEXT NOT NULL,
    prompt_tokens   INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens    INTEGER DEFAULT 0,
    cost            DECIMAL(18, 8) DEFAULT 0,
    response_time_ms INTEGER,                            -- Latency tracking
    model_used      VARCHAR(100),
    finish_reason   VARCHAR(50),                         -- stop, length, function_call
    rag_documents   JSONB,                               -- Documents used for RAG
    rag_score       DECIMAL(5, 4),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_msg_conv ON ai_messages(conversation_id);
CREATE INDEX idx_ai_msg_role ON ai_messages(role);
CREATE INDEX idx_ai_msg_created ON ai_messages(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4: AUDIT & COMPLIANCE
-- ═══════════════════════════════════════════════════════════════════════════

-- Audit log (FISMA requirement - all data changes logged)
CREATE TABLE IF NOT EXISTS audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    county_id       UUID REFERENCES counties(id),
    session_id      UUID REFERENCES sessions(id),
    action          VARCHAR(50) NOT NULL,                -- create, read, update, delete, export
    entity_type     VARCHAR(100) NOT NULL,               -- notebooks, ai_conversations, etc.
    entity_id       UUID,
    old_values      JSONB,                               -- Previous state (for updates)
    new_values      JSONB,                               -- New state
    ip_address      INET,
    user_agent      TEXT,
    request_id      UUID,                                -- For request tracing
    duration_ms     INTEGER,                             -- Operation duration
    success         BOOLEAN DEFAULT TRUE,
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_county ON audit_log(county_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- Partition audit_log by month for performance (optional, enable in production)
-- CREATE TABLE audit_log_2026_01 PARTITION OF audit_log 
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 5: SYSTEM CONFIGURATION
-- ═══════════════════════════════════════════════════════════════════════════

-- System configuration (key-value store)
CREATE TABLE IF NOT EXISTS system_config (
    key             VARCHAR(255) PRIMARY KEY,
    value           JSONB NOT NULL,
    description     TEXT,
    is_secret       BOOLEAN DEFAULT FALSE,               -- Encrypted at rest
    updated_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    is_enabled      BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0,                -- 0-100 for gradual rollout
    county_overrides JSONB DEFAULT '{}',                 -- Per-county overrides
    user_overrides  JSONB DEFAULT '{}',                  -- Per-user overrides
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 6: INITIAL DATA
-- ═══════════════════════════════════════════════════════════════════════════

-- Insert default county (Benton County - primary development target)
INSERT INTO counties (code, name, state) 
VALUES ('benton', 'Benton County', 'WA')
ON CONFLICT (code) DO NOTHING;

-- Insert system user
INSERT INTO users (email, display_name, role, permissions)
VALUES ('system@terrafusion.os', 'TerraFusion System', 'admin', '["*"]')
ON CONFLICT (email) DO NOTHING;

-- Insert default feature flags
INSERT INTO feature_flags (name, description, is_enabled) VALUES
    ('gen2_apps', 'Enable Generation 2 native applications', TRUE),
    ('ai_swarm', 'Enable AI Swarm integration', TRUE),
    ('rag_enabled', 'Enable RAG document retrieval', TRUE),
    ('audit_logging', 'Enable comprehensive audit logging', TRUE),
    ('multi_county', 'Enable multi-county support', FALSE)
ON CONFLICT (name) DO NOTHING;

-- Insert system config
INSERT INTO system_config (key, value, description) VALUES
    ('os.version', '"1.0.0"', 'TerraFusion OS version'),
    ('os.generation', '2', 'Current application generation'),
    ('ai.default_model', '"gpt-4o"', 'Default AI model for new conversations'),
    ('ai.default_provider', '"openai"', 'Default AI provider')
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 7: FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (Run after migration)
-- ═══════════════════════════════════════════════════════════════════════════

-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM counties;
-- SELECT * FROM users;
-- SELECT * FROM feature_flags;
-- SELECT * FROM system_config;

-- ═══════════════════════════════════════════════════════════════════════════
-- SCHEMA VERSION TRACKING
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS schema_migrations (
    version         VARCHAR(50) PRIMARY KEY,
    description     TEXT,
    applied_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schema_migrations (version, description) 
VALUES ('1.0.0', 'Initial OS Data Layer schema - Generation 2 foundation')
ON CONFLICT (version) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════
