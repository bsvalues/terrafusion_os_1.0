
-- Create custom types
CREATE TYPE property_type AS ENUM (
    'Residential',
    'Commercial', 
    'Industrial',
    'Agricultural',
    'Exempt',
    'Utility',
    'PublicUse'
);

CREATE TYPE owner_type AS ENUM (
    'Individual',
    'Corporation',
    'Partnership',
    'LLC',
    'Trust',
    'Government',
    'Nonprofit',
    'Other'
);

CREATE TYPE appeal_status AS ENUM (
    'None',
    'Filed',
    'UnderReview',
    'Approved',
    'Denied',
    'Withdrawn'
);

CREATE TYPE execution_status AS ENUM (
    'Pending',
    'Running',
    'Completed',
    'Failed',
    'Cancelled',
    'Timeout'
);

CREATE TYPE audit_action AS ENUM (
    'Insert',
    'Update',
    'Delete',
    'View'
);

-- Counties table
CREATE TABLE public.counties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    fips_code TEXT UNIQUE NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    assessment_cycle TEXT NOT NULL DEFAULT 'Annual',
    contact_info JSONB DEFAULT '{}',
    configuration JSONB DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Properties table
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id TEXT NOT NULL,
    address TEXT NOT NULL,
    legal_description TEXT,
    assessed_value BIGINT NOT NULL DEFAULT 0, -- stored as cents
    market_value BIGINT,
    land_value BIGINT NOT NULL DEFAULT 0,
    improvement_value BIGINT NOT NULL DEFAULT 0,
    square_feet INTEGER,
    lot_size_acres DECIMAL(10,4),
    year_built INTEGER,
    property_type property_type NOT NULL DEFAULT 'Residential',
    zoning TEXT,
    neighborhood_id UUID,
    coordinates JSONB, -- {latitude: number, longitude: number, elevation?: number}
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_assessment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    next_assessment_due TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 year'),
    county_id UUID NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(parcel_id, county_id)
);

-- Property owners table
CREATE TABLE public.property_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    owner_name TEXT NOT NULL,
    owner_type owner_type NOT NULL DEFAULT 'Individual',
    mailing_address TEXT NOT NULL,
    mailing_city TEXT NOT NULL,
    mailing_state TEXT NOT NULL,
    mailing_zip TEXT NOT NULL,
    percentage_owned SMALLINT NOT NULL DEFAULT 100 CHECK (percentage_owned >= 0 AND percentage_owned <= 100),
    primary_owner BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assessment history table
CREATE TABLE public.assessment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    assessment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    assessed_value BIGINT NOT NULL,
    land_value BIGINT NOT NULL,
    improvement_value BIGINT NOT NULL,
    assessor_id UUID NOT NULL,
    assessment_method TEXT NOT NULL DEFAULT 'Manual',
    ai_confidence_score REAL CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    notes TEXT,
    appeal_status appeal_status DEFAULT 'None',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agent executions table
CREATE TABLE public.agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}',
    result JSONB,
    status execution_status NOT NULL DEFAULT 'Pending',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    error_message TEXT,
    confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_by UUID NOT NULL
);

-- Audit logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action audit_action NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address INET,
    user_agent TEXT,
    reason TEXT
);

-- Create indexes for performance
CREATE INDEX idx_properties_county_id ON public.properties(county_id);
CREATE INDEX idx_properties_parcel_id ON public.properties(parcel_id);
CREATE INDEX idx_properties_address ON public.properties USING gin(to_tsvector('english', address));
CREATE INDEX idx_properties_coordinates ON public.properties USING gin(coordinates);
CREATE INDEX idx_property_owners_property_id ON public.property_owners(property_id);
CREATE INDEX idx_assessment_history_property_id ON public.assessment_history(property_id);
CREATE INDEX idx_assessment_history_date ON public.assessment_history(assessment_date);
CREATE INDEX idx_agent_executions_property_id ON public.agent_executions(property_id);
CREATE INDEX idx_agent_executions_agent_id ON public.agent_executions(agent_id);
CREATE INDEX idx_agent_executions_status ON public.agent_executions(status);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_at ON public.audit_logs(changed_at);

-- Create trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_counties_updated_at BEFORE UPDATE ON public.counties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_owners_updated_at BEFORE UPDATE ON public.property_owners
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (initially permissive for development)
CREATE POLICY "Enable all operations for authenticated users" ON public.counties
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.properties
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.property_owners
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.assessment_history
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.agent_executions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.audit_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample county data
INSERT INTO public.counties (name, state, fips_code, timezone, assessment_cycle, contact_info, configuration) VALUES
('Franklin County', 'OH', '39049', 'America/New_York', 'Annual', 
 '{"phone": "614-462-3000", "email": "assessor@franklincountyohio.gov", "website": "https://www.franklincountyohio.gov"}',
 '{"assessment_ratio": 0.35, "homestead_exemption": 25000, "senior_exemption": 25000}'),
('Hamilton County', 'OH', '39061', 'America/New_York', 'Triennial',
 '{"phone": "513-946-4000", "email": "assessor@hamiltoncountyohio.gov", "website": "https://www.hamiltoncountyohio.gov"}',
 '{"assessment_ratio": 0.35, "homestead_exemption": 25000, "senior_exemption": 25000}');
