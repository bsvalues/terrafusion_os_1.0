import { eq } from 'drizzle-orm';
import { storage } from '../storage.js';

const ARCGIS_API_KEY = process.env.BENTON_COUNTY_ARCGIS_API_KEY;
const BENTON_COUNTY_FEATURE_SERVICE = 'https://services.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/';

interface ParcelGeometry {
  x: number;
  y: number;
  spatialReference: {
    wkid: number;
  };
}

interface ParcelAttributes {
  OBJECTID: number;
  PARCEL_ID: string;
  OWNER_NAME: string;
  SITE_ADDR: string;
  ASSESSED_VAL: number;
  MARKET_VAL: number;
  ACRES: number;
  ZONE_DESC: string;
  FLOOD_ZONE: string;
  TAX_DIST: string;
}

interface ParcelFeature {
  geometry: ParcelGeometry;
  attributes: ParcelAttributes;
}

interface ArcGISQueryResponse {
  features: ParcelFeature[];
  exceededTransferLimit?: boolean;
  count?: number;
}

class ArcGISEnrichmentService {
  // Convert Web Mercator to WGS84
  private webMercatorToGeographic(x: number, y: number): { lat: number; lon: number } {
    const lon = (x / 20037508.34) * 180;
    let lat = (y / 20037508.34) * 180;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
    
    return { lat, lon };
  }

  async searchParcelByParcelId(parcelId: string): Promise<ParcelFeature | null> {
    if (!ARCGIS_API_KEY) {
      console.warn('ArcGIS API key not configured');
      return null;
    }

    const params = new URLSearchParams({
      f: 'json',
      where: `PARCEL_ID='${parcelId}' OR PARCEL_ID LIKE '%${parcelId}%'`,
      outFields: '*',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
      token: ARCGIS_API_KEY,
      resultRecordCount: '1'
    });

    try {
      const response = await fetch(
        `${BENTON_COUNTY_FEATURE_SERVICE}Benton_County_Parcels/FeatureServer/0/query?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`ArcGIS API error: ${response.status}`);
      }

      const data: ArcGISQueryResponse = await response.json();
      return data.features?.[0] || null;
    } catch (error) {
      console.error(`ArcGIS query failed for parcel ${parcelId}:`, error);
      return null;
    }
  }

  async searchParcelByAddress(address: string): Promise<ParcelFeature | null> {
    if (!ARCGIS_API_KEY) {
      console.warn('ArcGIS API key not configured');
      return null;
    }

    const cleanAddress = address.replace(/[^\w\s]/g, '').toUpperCase();
    
    const params = new URLSearchParams({
      f: 'json',
      where: `SITE_ADDR LIKE '%${cleanAddress}%'`,
      outFields: '*',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
      token: ARCGIS_API_KEY,
      resultRecordCount: '1'
    });

    try {
      const response = await fetch(
        `${BENTON_COUNTY_FEATURE_SERVICE}Benton_County_Parcels/FeatureServer/0/query?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`ArcGIS API error: ${response.status}`);
      }

      const data: ArcGISQueryResponse = await response.json();
      return data.features?.[0] || null;
    } catch (error) {
      console.error(`ArcGIS query failed for address ${address}:`, error);
      return null;
    }
  }

  async enrichPropertyWithCoordinates(propertyId: string): Promise<boolean> {
    try {
      // Get property from storage
      const prop = await storage.getProperty(propertyId);
      
      if (!prop) {
        console.error(`Property not found: ${propertyId}`);
        return false;
      }

      // Skip if already has coordinates
      if (prop.coordinates) {
        console.log(`Property ${prop.parcelId} already has coordinates`);
        return true;
      }

      // Try to find parcel by parcel ID first
      let parcelData = await this.searchParcelByParcelId(prop.parcelId);
      
      // If not found by parcel ID, try by address
      if (!parcelData && prop.address) {
        parcelData = await this.searchParcelByAddress(prop.address);
      }

      if (!parcelData || !parcelData.geometry) {
        console.log(`No ArcGIS data found for property ${prop.parcelId}`);
        return false;
      }

      // Convert coordinates
      const coords = this.webMercatorToGeographic(
        parcelData.geometry.x,
        parcelData.geometry.y
      );

      // Update property with coordinates and enriched data
      await storage.updateProperty(propertyId, {
        coordinates: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lon,
          elevation: null
        }),
        // Update other fields if they're more accurate in ArcGIS
        ownerName: parcelData.attributes.OWNER_NAME || prop.ownerName,
        address: parcelData.attributes.SITE_ADDR || prop.address,
        updatedAt: new Date()
      });

      console.log(`Enriched property ${prop.parcelId} with coordinates: ${coords.lat}, ${coords.lon}`);
      return true;
    } catch (error) {
      console.error(`Failed to enrich property ${propertyId}:`, error);
      return false;
    }
  }

  async enrichAllPropertiesBatch(batchSize: number = 10, maxBatches: number = 100): Promise<{
    total: number;
    enriched: number;
    failed: number;
  }> {
    const results = { total: 0, enriched: 0, failed: 0 };
    
    try {
      // Get all properties from storage (using the existing getProperties method)
      const allProperties = await storage.getProperties(batchSize * maxBatches);
      
      // Filter properties without coordinates
      const propertiesWithoutCoords = allProperties.filter(prop => !prop.coordinates);
      const limitedProperties = propertiesWithoutCoords.slice(0, batchSize * maxBatches);

      results.total = limitedProperties.length;
      console.log(`Found ${results.total} properties without coordinates`);

      // Process in batches
      for (let i = 0; i < Math.min(maxBatches, Math.ceil(limitedProperties.length / batchSize)); i++) {
        const batch = limitedProperties.slice(i * batchSize, (i + 1) * batchSize);
        
        console.log(`Processing batch ${i + 1}/${Math.min(maxBatches, Math.ceil(limitedProperties.length / batchSize))} (${batch.length} properties)`);
        
        const batchPromises = batch.map(async (prop: any) => {
          const success = await this.enrichPropertyWithCoordinates(prop.id);
          if (success) {
            results.enriched++;
          } else {
            results.failed++;
          }
          
          // Add delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        await Promise.all(batchPromises);
        
        // Delay between batches
        if (i < maxBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Enrichment complete: ${results.enriched} enriched, ${results.failed} failed`);
      return results;
    } catch (error) {
      console.error('Batch enrichment failed:', error);
      return results;
    }
  }

  async getBentonCountyParcels(limit: number = 100): Promise<ParcelFeature[]> {
    if (!ARCGIS_API_KEY) {
      console.warn('ArcGIS API key not configured');
      return [];
    }

    const params = new URLSearchParams({
      f: 'json',
      where: '1=1',
      outFields: '*',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
      token: ARCGIS_API_KEY,
      resultRecordCount: limit.toString()
    });

    try {
      const response = await fetch(
        `${BENTON_COUNTY_FEATURE_SERVICE}Benton_County_Parcels/FeatureServer/0/query?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`ArcGIS API error: ${response.status}`);
      }

      const data: ArcGISQueryResponse = await response.json();
      return data.features || [];
    } catch (error) {
      console.error('Failed to fetch Benton County parcels:', error);
      return [];
    }
  }
}

export const arcgisEnrichmentService = new ArcGISEnrichmentService();