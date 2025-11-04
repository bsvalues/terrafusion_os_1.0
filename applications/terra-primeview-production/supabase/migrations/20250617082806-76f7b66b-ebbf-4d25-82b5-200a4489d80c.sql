
-- Create import tracking infrastructure
CREATE TABLE public.data_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_name TEXT NOT NULL,
  import_type TEXT NOT NULL, -- 'counties', 'properties', 'owners', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  success_records INTEGER DEFAULT 0,
  error_records INTEGER DEFAULT 0,
  file_path TEXT,
  error_log JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create import error details table
CREATE TABLE public.import_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID REFERENCES public.data_imports(id) ON DELETE CASCADE,
  row_number INTEGER,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create data mapping configurations table
CREATE TABLE public.data_mapping_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_name TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL, -- 'csv', 'excel', 'api', 'database'
  target_table TEXT NOT NULL,
  field_mappings JSONB NOT NULL, -- Maps source fields to target fields
  validation_rules JSONB DEFAULT '{}'::jsonb,
  transformation_rules JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_data_imports_status ON public.data_imports(status);
CREATE INDEX idx_data_imports_type ON public.data_imports(import_type);
CREATE INDEX idx_import_errors_import_id ON public.import_errors(import_id);
CREATE INDEX idx_data_mapping_configs_active ON public.data_mapping_configs(is_active);

-- Enable RLS for security
ALTER TABLE public.data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_mapping_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now, can be restricted later)
CREATE POLICY "Allow all operations on data_imports" ON public.data_imports FOR ALL USING (true);
CREATE POLICY "Allow all operations on import_errors" ON public.import_errors FOR ALL USING (true);
CREATE POLICY "Allow all operations on data_mapping_configs" ON public.data_mapping_configs FOR ALL USING (true);

-- Create trigger for updated_at on data_mapping_configs
CREATE TRIGGER update_data_mapping_configs_updated_at
    BEFORE UPDATE ON public.data_mapping_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
