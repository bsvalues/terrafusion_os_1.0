
-- Insert Benton County, Washington into the counties table
INSERT INTO public.counties (
  name,
  state,
  fips_code,
  timezone,
  assessment_cycle,
  contact_info,
  configuration,
  active
) VALUES (
  'Benton County',
  'WA',
  '53005',
  'America/Los_Angeles',
  'Annual',
  '{
    "assessor_office": "Benton County Assessor",
    "phone": "(509) 736-3085",
    "address": "7122 W Okanogan Pl, Kennewick, WA 99336",
    "email": "assessor@co.benton.wa.us",
    "website": "https://www.co.benton.wa.us/departments/assessor"
  }'::jsonb,
  '{
    "ftp_enabled": true,
    "arcgis_enabled": true,
    "auto_sync": true,
    "sync_schedule": "daily"
  }'::jsonb,
  true
)
ON CONFLICT (fips_code) DO UPDATE SET
  name = EXCLUDED.name,
  state = EXCLUDED.state,
  timezone = EXCLUDED.timezone,
  assessment_cycle = EXCLUDED.assessment_cycle,
  contact_info = EXCLUDED.contact_info,
  configuration = EXCLUDED.configuration,
  active = EXCLUDED.active,
  updated_at = now();
