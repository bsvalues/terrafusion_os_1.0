
-- Insert Benton County Washington with specific configuration (fixed syntax)
DO $$
BEGIN
  -- Insert Benton County if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.counties WHERE fips_code = '53005') THEN
    INSERT INTO public.counties (
      name, 
      state, 
      fips_code,
      timezone,
      assessment_cycle,
      active,
      contact_info,
      configuration
    ) VALUES (
      'Benton County',
      'Washington',
      '53005',
      'America/Los_Angeles',
      'Annual',
      true,
      '{
        "assessor_office": {
          "name": "Benton County Assessor",
          "address": "620 Market Street, Prosser, WA 99350",
          "phone": "(509) 786-5600",
          "email": "assessor@co.benton.wa.us",
          "website": "https://www.co.benton.wa.us/departments/assessor"
        },
        "business_hours": {
          "monday_friday": "8:00 AM - 5:00 PM",
          "timezone": "Pacific Time"
        }
      }'::jsonb,
      '{
        "assessment_practices": {
          "revaluation_cycle": "annual",
          "assessment_date": "January 1",
          "tax_year": "current_year",
          "market_value_standard": "fair_market_value",
          "agricultural_use_program": true,
          "senior_citizen_exemption": true,
          "disabled_veteran_exemption": true
        },
        "washington_state_specific": {
          "rcw_compliance": "84.40",
          "dor_ratio_study": true,
          "state_assessed_utilities": true,
          "timber_assessment": true,
          "current_use_taxation": true
        },
        "property_types": {
          "residential_classes": ["Single Family", "Condo", "Townhouse", "Mobile Home"],
          "commercial_classes": ["Office", "Retail", "Industrial", "Warehouse"],
          "agricultural_classes": ["Irrigated Cropland", "Dryland", "Pasture", "Orchard"],
          "special_classes": ["Public Utility", "State Assessed", "Exempt"]
        },
        "ai_assessment_settings": {
          "confidence_threshold": 0.85,
          "auto_approval_threshold": 0.95,
          "manual_review_required": 0.75,
          "market_analysis_radius_miles": 1.5,
          "comparable_sales_timeframe_months": 12
        }
      }'::jsonb
    );
  END IF;
END $$;

-- Insert system configurations for Benton County
DO $$
DECLARE
  county_uuid UUID;
BEGIN
  -- Get Benton County ID
  SELECT id INTO county_uuid FROM public.counties WHERE fips_code = '53005' LIMIT 1;
  
  -- Insert assessment standards
  INSERT INTO public.system_config (county_id, category, config_key, config_value, description, is_active)
  VALUES (
    county_uuid,
    'assessment_standards',
    'washington_rcw_compliance',
    '{"rcw_84_40": true, "dor_guidelines": true, "appraisal_standards": "USPAP"}'::jsonb,
    'Washington State RCW 84.40 compliance settings',
    true
  )
  ON CONFLICT (county_id, category, config_key) DO NOTHING;

  INSERT INTO public.system_config (county_id, category, config_key, config_value, description, is_active)
  VALUES (
    county_uuid,
    'assessment_standards', 
    'market_value_definition',
    '{"standard": "fair_market_value", "definition": "The amount of money a buyer willing but not obligated to buy would pay to a seller willing but not obligated to sell"}'::jsonb,
    'Washington state fair market value definition',
    true
  )
  ON CONFLICT (county_id, category, config_key) DO NOTHING;

  INSERT INTO public.system_config (county_id, category, config_key, config_value, description, is_active)
  VALUES (
    county_uuid,
    'exemptions',
    'senior_citizen_exemption',
    '{"enabled": true, "age_requirement": 61, "income_threshold": 58423, "max_exemption": 70000}'::jsonb,
    'Senior citizen property tax exemption (2024 thresholds)',
    true
  )
  ON CONFLICT (county_id, category, config_key) DO NOTHING;

  INSERT INTO public.system_config (county_id, category, config_key, config_value, description, is_active)
  VALUES (
    county_uuid,
    'exemptions', 
    'disabled_veteran_exemption',
    '{"enabled": true, "disability_rating_required": 100, "max_exemption": "unlimited"}'::jsonb,
    'Disabled veteran property tax exemption',
    true
  )
  ON CONFLICT (county_id, category, config_key) DO NOTHING;

END $$;

-- Create sample neighborhoods for Benton County
DO $$
DECLARE
  county_uuid UUID;
BEGIN
  -- Get Benton County ID
  SELECT id INTO county_uuid FROM public.counties WHERE fips_code = '53005' LIMIT 1;
  
  INSERT INTO public.neighborhoods (county_id, name, characteristics, market_statistics, active)
  VALUES (
    county_uuid,
    'Richland - West Richland',
    '{"type": "urban_residential", "median_home_age": 25, "average_lot_size": 0.25, "school_district": "Richland", "amenities": ["parks", "shopping", "schools"]}'::jsonb,
    '{"median_value": 425000, "price_per_sqft": 185, "days_on_market": 28, "inventory_months": 2.1, "last_updated": "2024-01-01"}'::jsonb,
    true
  )
  ON CONFLICT (county_id, name) DO NOTHING;

  INSERT INTO public.neighborhoods (county_id, name, characteristics, market_statistics, active)
  VALUES (
    county_uuid,
    'Kennewick - Southeast',
    '{"type": "suburban_residential", "median_home_age": 20, "average_lot_size": 0.3, "school_district": "Kennewick", "amenities": ["golf", "shopping", "restaurants"]}'::jsonb,
    '{"median_value": 385000, "price_per_sqft": 175, "days_on_market": 32, "inventory_months": 2.4, "last_updated": "2024-01-01"}'::jsonb,
    true
  )
  ON CONFLICT (county_id, name) DO NOTHING;

  INSERT INTO public.neighborhoods (county_id, name, characteristics, market_statistics, active)
  VALUES (
    county_uuid,
    'Rural Agricultural - Irrigated',
    '{"type": "agricultural", "median_home_age": 35, "average_lot_size": 40, "irrigation": "columbia_river", "crops": ["apples", "grapes", "wheat"]}'::jsonb,
    '{"median_value_per_acre": 12500, "agricultural_income_per_acre": 2800, "water_rights_included": true, "last_updated": "2024-01-01"}'::jsonb,
    true
  )
  ON CONFLICT (county_id, name) DO NOTHING;

END $$;

-- Create sample properties for immediate demonstration
DO $$
DECLARE
  county_uuid UUID;
  richland_neighborhood_uuid UUID;
  kennewick_neighborhood_uuid UUID;
  rural_neighborhood_uuid UUID;
BEGIN
  -- Get IDs
  SELECT id INTO county_uuid FROM public.counties WHERE fips_code = '53005' LIMIT 1;
  SELECT id INTO richland_neighborhood_uuid FROM public.neighborhoods WHERE name = 'Richland - West Richland' LIMIT 1;
  SELECT id INTO kennewick_neighborhood_uuid FROM public.neighborhoods WHERE name = 'Kennewick - Southeast' LIMIT 1;
  SELECT id INTO rural_neighborhood_uuid FROM public.neighborhoods WHERE name = 'Rural Agricultural - Irrigated' LIMIT 1;
  
  -- Insert properties if they don't exist
  IF NOT EXISTS (SELECT 1 FROM public.properties WHERE parcel_id = '001234567') THEN
    INSERT INTO public.properties (
      county_id, neighborhood_id, parcel_id, address, property_type, 
      assessed_value, land_value, improvement_value, market_value,
      square_feet, lot_size_acres, year_built, zoning,
      coordinates, legal_description, active
    )
    VALUES (
      county_uuid, richland_neighborhood_uuid, '001234567', '1425 Maple Street, Richland, WA 99354', 'Residential'::property_type,
      425000, 85000, 340000, 465000,
      2450, 0.25, 1998, 'R-1',
      '{"lat": 46.2857, "lng": -119.2840}'::jsonb,
      'LOT 15, BLOCK 8, RICHLAND MEADOWS SUBDIVISION',
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.properties WHERE parcel_id = '002345678') THEN
    INSERT INTO public.properties (
      county_id, neighborhood_id, parcel_id, address, property_type, 
      assessed_value, land_value, improvement_value, market_value,
      square_feet, lot_size_acres, year_built, zoning,
      coordinates, legal_description, active
    )
    VALUES (
      county_uuid, kennewick_neighborhood_uuid, '002345678', '3210 Canyon View Drive, Kennewick, WA 99337', 'Residential'::property_type,
      385000, 75000, 310000, 420000,
      2280, 0.30, 2005, 'R-1',
      '{"lat": 46.2112, "lng": -119.1372}'::jsonb,
      'LOT 23, BLOCK 3, CANYON HEIGHTS SUBDIVISION',
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.properties WHERE parcel_id = '003456789') THEN
    INSERT INTO public.properties (
      county_id, neighborhood_id, parcel_id, address, property_type, 
      assessed_value, land_value, improvement_value, market_value,
      square_feet, lot_size_acres, year_built, zoning,
      coordinates, legal_description, active
    )
    VALUES (
      county_uuid, rural_neighborhood_uuid, '003456789', '15642 County Road 68, Benton City, WA 99320', 'Agricultural'::property_type,
      850000, 500000, 350000, 925000,
      3200, 40.5, 1985, 'AG-20',
      '{"lat": 46.2605, "lng": -119.4886}'::jsonb,
      'SE 1/4 OF NE 1/4, SECTION 15, T8N, R28E, W.M.',
      true
    );
  END IF;

END $$;

-- Create sample property owners
DO $$
DECLARE
  property_uuid UUID;
BEGIN
  -- Insert owners for each property if they don't exist
  SELECT id INTO property_uuid FROM public.properties WHERE parcel_id = '001234567' LIMIT 1;
  IF property_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.property_owners WHERE property_id = property_uuid) THEN
    INSERT INTO public.property_owners (
      property_id, owner_name, owner_type, mailing_address, mailing_city, mailing_state, mailing_zip,
      percentage_owned, primary_owner
    )
    VALUES (
      property_uuid, 'Johnson, Robert & Mary', 'Individual'::owner_type, '1425 Maple Street', 'Richland', 'WA', '99354',
      100, true
    );
  END IF;

  SELECT id INTO property_uuid FROM public.properties WHERE parcel_id = '002345678' LIMIT 1;
  IF property_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.property_owners WHERE property_id = property_uuid) THEN
    INSERT INTO public.property_owners (
      property_id, owner_name, owner_type, mailing_address, mailing_city, mailing_state, mailing_zip,
      percentage_owned, primary_owner
    )
    VALUES (
      property_uuid, 'Smith Family Trust', 'Trust'::owner_type, '3210 Canyon View Drive', 'Kennewick', 'WA', '99337',
      100, true
    );
  END IF;

  SELECT id INTO property_uuid FROM public.properties WHERE parcel_id = '003456789' LIMIT 1;
  IF property_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.property_owners WHERE property_id = property_uuid) THEN
    INSERT INTO public.property_owners (
      property_id, owner_name, owner_type, mailing_address, mailing_city, mailing_state, mailing_zip,
      percentage_owned, primary_owner
    )
    VALUES (
      property_uuid, 'Columbia River Orchards LLC', 'LLC'::owner_type, 'PO Box 1247', 'Richland', 'WA', '99352',
      100, true
    );
  END IF;

END $$;
