import type { Property } from '@shared/schema';

interface ArcGISGeocodeResponse {
  candidates: Array<{
    address: string;
    location: {
      x: number;
      y: number;
    };
    score: number;
    attributes: Record<string, any>;
  }>;
  spatialReference: {
    wkid: number;
    latestWkid: number;
  };
}

interface ArcGISFeatureResponse {
  features: Array<{
    attributes: Record<string, any>;
    geometry: {
      x: number;
      y: number;
    };
  }>;
}

class BentonGISService {
  private apiKey: string;
  private baseUrl = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer';
  private bentonCountyUrl = 'https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services';

  constructor() {
    this.apiKey = process.env.BENTON_COUNTY_ARCGIS_API_KEY || '';
  }

  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
    try {
      const params = new URLSearchParams({
        singleLine: `${address}, Benton County, WA`,
        f: 'json',
        token: this.apiKey,
        outFields: 'Addr_type,Match_addr,StAddr,City',
        maxLocations: '1',
        bbox: '-120.5,45.8,-118.9,46.8' // Benton County bounds
      });

      const response = await fetch(`${this.baseUrl}/findAddressCandidates?${params}`);
      const data: ArcGISGeocodeResponse = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        return {
          latitude: candidate.location.y,
          longitude: candidate.location.x,
          accuracy: candidate.score
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  async enrichPropertyWithCoordinates(property: Property): Promise<Property | null> {
    if (!property.address) {
      return null;
    }

    // Skip if coordinates already exist and are within Benton County bounds
    if (property.coordinates && 
        typeof property.coordinates === 'object' && 
        'latitude' in property.coordinates && 
        'longitude' in property.coordinates) {
      const coords = property.coordinates as { latitude: number; longitude: number };
      if (coords.latitude >= 45.8 && coords.latitude <= 46.8 && 
          coords.longitude >= -120.5 && coords.longitude <= -118.9) {
        return property;
      }
    }

    const geoResult = await this.geocodeAddress(property.address);
    if (geoResult && geoResult.accuracy > 80) {
      return {
        ...property,
        coordinates: {
          latitude: geoResult.latitude,
          longitude: geoResult.longitude,
          accuracy: geoResult.accuracy,
          source: 'ArcGIS Geocoding Service'
        }
      };
    }

    return null;
  }

  async getParcelBoundaries(parcelId: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        where: `PARCEL_ID='${parcelId}'`,
        outFields: '*',
        outSR: '4326',
        f: 'json',
        token: this.apiKey
      });

      const response = await fetch(`${this.bentonCountyUrl}/Parcels/FeatureServer/0/query?${params}`);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        return data.features[0];
      }

      return null;
    } catch (error) {
      console.error('Parcel boundary error:', error);
      return null;
    }
  }

  async getNearbyComparables(latitude: number, longitude: number, radius: number = 1000): Promise<Property[]> {
    try {
      // Create buffer around point
      const bufferParams = new URLSearchParams({
        geometries: JSON.stringify({
          geometryType: 'esriGeometryPoint',
          geometries: [{
            x: longitude,
            y: latitude,
            spatialReference: { wkid: 4326 }
          }]
        }),
        distances: radius.toString(),
        unit: 'esriSRUnit_Meter',
        bufferSpatialReference: '4326',
        outSpatialReference: '4326',
        f: 'json',
        token: this.apiKey
      });

      // This would typically query the county's parcel service
      // For now, return empty array as we'd need specific Benton County service URLs
      return [];
    } catch (error) {
      console.error('Comparables search error:', error);
      return [];
    }
  }

  async getZoningInfo(latitude: number, longitude: number): Promise<string | null> {
    try {
      const params = new URLSearchParams({
        geometry: JSON.stringify({
          x: longitude,
          y: latitude,
          spatialReference: { wkid: 4326 }
        }),
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'ZONE_CLASS,ZONE_DESC',
        returnGeometry: 'false',
        f: 'json',
        token: this.apiKey
      });

      // This would query Benton County's zoning layer
      // Return null for now as we'd need the specific service URL
      return null;
    } catch (error) {
      console.error('Zoning query error:', error);
      return null;
    }
  }

  async getElevation(latitude: number, longitude: number): Promise<number | null> {
    try {
      const params = new URLSearchParams({
        geometry: JSON.stringify({
          x: longitude,
          y: latitude,
          spatialReference: { wkid: 4326 }
        }),
        geometries: JSON.stringify([{
          x: longitude,
          y: latitude
        }]),
        sr: '4326',
        f: 'json',
        token: this.apiKey
      });

      const response = await fetch(`https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer/getSamples?${params}`);
      const data = await response.json();

      if (data.samples && data.samples.length > 0) {
        return data.samples[0].value;
      }

      return null;
    } catch (error) {
      console.error('Elevation query error:', error);
      return null;
    }
  }

  async batchGeocodeProperties(properties: Property[], batchSize: number = 10): Promise<Property[]> {
    const enrichedProperties: Property[] = [];
    
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      const batchPromises = batch.map(property => this.enrichPropertyWithCoordinates(property));
      
      const results = await Promise.allSettled(batchPromises);
      
      results.forEach((result /* , index */) => {
        if (result.status === 'fulfilled' && result.value) {
          enrichedProperties.push(result.value);
        } else {
          // Keep original property if enrichment fails
          enrichedProperties.push(batch[index]);
        }
      });

      // Add delay to respect rate limits
      if (i + batchSize < properties.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return enrichedProperties;
  }

  async getMapLayers(): Promise<any> {
    return {
      satellite: {
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
        type: 'tiled'
      },
      parcels: {
        url: `${this.bentonCountyUrl}/Parcels/FeatureServer/0`,
        type: 'feature',
        token: this.apiKey
      },
      zoning: {
        url: `${this.bentonCountyUrl}/Zoning/FeatureServer/0`,
        type: 'feature',
        token: this.apiKey
      },
      floodZones: {
        url: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHLWMS/MapServer',
        type: 'wms'
      }
    };
  }

  isValidBentonCountyLocation(latitude: number, longitude: number): boolean {
    return latitude >= 45.8 && latitude <= 46.8 && 
           longitude >= -120.5 && longitude <= -118.9;
  }
}

export const bentonGISService = new BentonGISService();