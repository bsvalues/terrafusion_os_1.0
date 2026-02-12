
-- Create neighborhoods table for geographic and market analysis
CREATE TABLE public.neighborhoods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    county_id UUID NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
    boundary JSONB, -- GeoJSON polygon data for neighborhood boundaries
    characteristics JSONB NOT NULL DEFAULT '{}', -- development_era, housing_type, average_lot_size, etc.
    market_statistics JSONB NOT NULL DEFAULT '{}', -- median_home_value, price_per_sqft, market_trend, etc.
    last_analyzed TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(name, county_id)
);

-- Create indexes for performance
CREATE INDEX idx_neighborhoods_county_id ON public.neighborhoods(county_id);
CREATE INDEX idx_neighborhoods_name ON public.neighborhoods(name);
CREATE INDEX idx_neighborhoods_active ON public.neighborhoods(active);
CREATE INDEX idx_neighborhoods_boundary ON public.neighborhoods USING gin(boundary);

-- Add updated_at trigger
CREATE TRIGGER update_neighborhoods_updated_at 
    BEFORE UPDATE ON public.neighborhoods
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON public.neighborhoods
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample neighborhood data for existing counties
INSERT INTO public.neighborhoods (name, county_id, characteristics, market_statistics, last_analyzed) 
SELECT 
    'Downtown District' as name,
    id as county_id,
    jsonb_build_object(
        'development_era', '1940s-1950s',
        'housing_type', 'Mixed Use',
        'average_lot_size', 0.25,
        'walkability_score', 85,
        'transit_access', 'High'
    ) as characteristics,
    jsonb_build_object(
        'median_home_value', 425000,
        'price_per_sqft', 185,
        'market_trend', 'stable',
        'days_on_market', 45,
        'price_change_1y', 0.03
    ) as market_statistics,
    now() - INTERVAL '30 days' as last_analyzed
FROM public.counties 
WHERE active = true;

INSERT INTO public.neighborhoods (name, county_id, characteristics, market_statistics, last_analyzed) 
SELECT 
    'Suburban Heights' as name,
    id as county_id,
    jsonb_build_object(
        'development_era', '1990s-2000s',
        'housing_type', 'Suburban',
        'average_lot_size', 0.35,
        'walkability_score', 65,
        'transit_access', 'Medium'
    ) as characteristics,
    jsonb_build_object(
        'median_home_value', 385000,
        'price_per_sqft', 165,
        'market_trend', 'growing',
        'days_on_market', 32,
        'price_change_1y', 0.08
    ) as market_statistics,
    now() - INTERVAL '15 days' as last_analyzed
FROM public.counties 
WHERE active = true;

INSERT INTO public.neighborhoods (name, county_id, characteristics, market_statistics, last_analyzed) 
SELECT 
    'Historic Quarter' as name,
    id as county_id,
    jsonb_build_object(
        'development_era', '1920s-1930s',
        'housing_type', 'Historic',
        'average_lot_size', 0.18,
        'walkability_score', 90,
        'transit_access', 'High'
    ) as characteristics,
    jsonb_build_object(
        'median_home_value', 525000,
        'price_per_sqft', 220,
        'market_trend', 'appreciating',
        'days_on_market', 28,
        'price_change_1y', 0.12
    ) as market_statistics,
    now() - INTERVAL '7 days' as last_analyzed
FROM public.counties 
WHERE active = true;
