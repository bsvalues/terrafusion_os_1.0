
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ArcGISConfig {
  apiKey: string;
  serverUrl: string;
  services: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('ArcGIS sync function started');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { county_fips, sync_layers } = await req.json()
    console.log(`Starting ArcGIS sync for county ${county_fips}...`);

    // Get ArcGIS credentials from environment
    const arcgisConfig: ArcGISConfig = {
      apiKey: Deno.env.get('ARCGIS_API_KEY') ?? '',
      serverUrl: Deno.env.get('ARCGIS_SERVER_URL') ?? '',
      services: sync_layers || ['parcels', 'zoning', 'infrastructure']
    }

    console.log('ArcGIS config:', { 
      hasApiKey: !!arcgisConfig.apiKey,
      serverUrl: arcgisConfig.serverUrl,
      services: arcgisConfig.services 
    });

    if (!arcgisConfig.apiKey || !arcgisConfig.serverUrl) {
      throw new Error('ArcGIS credentials not configured - check ARCGIS_API_KEY and ARCGIS_SERVER_URL');
    }

    // Get county from database
    const { data: county, error: countyError } = await supabaseClient
      .from('counties')
      .select('id, name')
      .eq('fips_code', county_fips)
      .single()

    if (countyError) {
      console.error('County lookup error:', countyError);
      throw new Error(`Failed to find county with FIPS ${county_fips}: ${countyError.message}`);
    }

    if (!county) {
      throw new Error(`County with FIPS ${county_fips} not found in database`);
    }

    console.log(`Found county: ${county.name} (${county.id})`);

    let layersProcessed = 0
    const errors: string[] = []

    // Process each ArcGIS service/layer
    for (const layerName of arcgisConfig.services) {
      try {
        console.log(`Processing ArcGIS layer: ${layerName}`);

        // Construct ArcGIS REST API URL
        const serviceUrl = `${arcgisConfig.serverUrl}/rest/services/${layerName}/FeatureServer/0/query`
        
        const queryParams = new URLSearchParams({
          where: '1=1',
          outFields: '*',
          returnGeometry: 'true',
          f: 'json',
          token: arcgisConfig.apiKey
        })

        console.log(`Querying: ${serviceUrl}`);

        // Fetch data from ArcGIS REST API
        const response = await fetch(`${serviceUrl}?${queryParams}`)
        
        if (!response.ok) {
          throw new Error(`ArcGIS API error: ${response.status} ${response.statusText}`)
        }

        const gisData = await response.json()

        if (gisData.error) {
          throw new Error(`ArcGIS service error: ${gisData.error.message}`)
        }

        console.log(`Retrieved ${gisData.features?.length || 0} features for ${layerName}`);

        // Process features based on layer type
        if (layerName === 'parcels' && gisData.features) {
          await processParcelData(supabaseClient, gisData.features, county.id)
        } else if (layerName === 'zoning' && gisData.features) {
          await processZoningData(supabaseClient, gisData.features, county.id)
        }

        // Create import record
        await supabaseClient
          .from('data_imports')
          .insert({
            import_name: `ArcGIS_${layerName}_${county.name}`,
            import_type: 'arcgis_layer',
            status: 'completed',
            total_records: gisData.features?.length || 0,
            processed_records: gisData.features?.length || 0,
            success_records: gisData.features?.length || 0,
            error_records: 0,
            created_by: 'TerraFusion_ArcGIS',
            metadata: {
              layer_name: layerName,
              service_url: serviceUrl,
              county_id: county.id,
              feature_count: gisData.features?.length || 0,
              sync_time: new Date().toISOString()
            }
          })

        layersProcessed++
        console.log(`Successfully processed ${layerName}: ${gisData.features?.length || 0} features`)

      } catch (layerError) {
        const errorMsg = `Failed to process layer ${layerName}: ${layerError}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    const result = {
      success: errors.length === 0,
      layersProcessed,
      errors,
      timestamp: new Date().toISOString(),
      county: county.name
    }

    console.log('ArcGIS sync completed:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )

  } catch (error) {
    console.error('ArcGIS sync failed:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )
  }
})

async function processParcelData(supabase: any, features: any[], countyId: string) {
  for (const feature of features) {
    const attrs = feature.attributes
    const geometry = feature.geometry

    // Map ArcGIS parcel data to our schema
    const propertyData = {
      parcel_id: attrs.PARCEL_ID || attrs.PIN || attrs.APN,
      address: attrs.SITE_ADDR || attrs.ADDRESS || attrs.PROP_ADDR,
      legal_description: attrs.LEGAL_DESC || attrs.LEGAL,
      coordinates: geometry ? {
        type: 'Point',
        coordinates: [geometry.x, geometry.y]
      } : null,
      county_id: countyId,
      assessed_value: attrs.ASSESSED_VAL || attrs.TOTAL_VAL || 0,
      land_value: attrs.LAND_VAL || 0,
      improvement_value: attrs.IMPROV_VAL || attrs.BLDG_VAL || 0,
      square_feet: attrs.SQ_FT || attrs.BLDG_SF,
      lot_size_acres: attrs.ACRES || attrs.LOT_SIZE,
      year_built: attrs.YEAR_BUILT || attrs.YR_BLT,
      property_type: attrs.PROP_TYPE || 'Residential',
      zoning: attrs.ZONING || attrs.ZONE_CODE
    }

    // Upsert property data
    await supabase
      .from('properties')
      .upsert(propertyData, { onConflict: 'parcel_id,county_id' })
  }
}

async function processZoningData(supabase: any, features: any[], countyId: string) {
  // Process zoning layers - could update property zoning or create zoning districts
  console.log(`Processing ${features.length} zoning features for county ${countyId}`)
}
