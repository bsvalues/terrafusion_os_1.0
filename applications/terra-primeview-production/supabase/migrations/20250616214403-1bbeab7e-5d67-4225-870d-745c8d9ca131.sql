
-- Create system_config table for county-specific configuration management
CREATE TABLE public.system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    county_id UUID NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    config_key TEXT NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(county_id, category, config_key)
);

-- Create indexes for performance
CREATE INDEX idx_system_config_county_id ON public.system_config(county_id);
CREATE INDEX idx_system_config_category ON public.system_config(category);
CREATE INDEX idx_system_config_active ON public.system_config(is_active);

-- Add updated_at trigger
CREATE TRIGGER update_system_config_updated_at 
    BEFORE UPDATE ON public.system_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON public.system_config
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample configuration data for existing counties
INSERT INTO public.system_config (county_id, category, config_key, config_value, description) 
SELECT 
    id as county_id,
    'assessment' as category,
    'assessment_frequency' as config_key,
    '"annual"'::jsonb as config_value,
    'How often properties are assessed' as description
FROM public.counties 
WHERE active = true;

INSERT INTO public.system_config (county_id, category, config_key, config_value, description) 
SELECT 
    id as county_id,
    'taxation' as category,
    'base_tax_rate' as config_key,
    '0.0125'::jsonb as config_value,
    'Base property tax rate for the county' as description
FROM public.counties 
WHERE active = true;

INSERT INTO public.system_config (county_id, category, config_key, config_value, description) 
SELECT 
    id as county_id,
    'exemptions' as category,
    'homestead_exemption_amount' as config_key,
    '60000'::jsonb as config_value,
    'Standard homestead exemption amount in cents' as description
FROM public.counties 
WHERE active = true;
