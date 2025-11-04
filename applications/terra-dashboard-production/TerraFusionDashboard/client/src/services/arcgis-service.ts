const ARCGIS_API_KEY = import.meta.env.VITE_BENTON_COUNTY_ARCGIS_API_KEY;
const BENTON_COUNTY_FEATURE_SERVICE = 'https://services.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/';

export interface ParcelGeometry {
  x: number;
  y: number;
  spatialReference: {
    wkid: number;
  };
}

export interface ParcelAttributes {
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

export interface ParcelFeature {
  geometry: ParcelGeometry;
  attributes: ParcelAttributes;
}

export interface ArcGISQueryResponse {
  features: ParcelFeature[];
  exceededTransferLimit?: boolean;
  count?: number;
}

class ArcGISService {
  private baseUrl = BENTON_COUNTY_FEATURE_SERVICE;
  
  async searchParcels(parcelId?: string, address?: string, bounds?: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  }): Promise<ArcGISQueryResponse> {
    let whereClause = '1=1';
    
    if (parcelId) {
      whereClause = `PARCEL_ID LIKE '%${parcelId}%'`;
    } else if (address) {
      whereClause = `SITE_ADDR LIKE '%${address.toUpperCase()}%'`;
    }
    
    const params = new URLSearchParams({
      f: 'json',
      where: whereClause,
      outFields: '*',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
      token: ARCGIS_API_KEY || '',
      resultRecordCount: '100'
    });
    
    if (bounds) {
      params.append('geometry', `${bounds.xmin},${bounds.ymin},${bounds.xmax},${bounds.ymax}`);
      params.append('geometryType', 'esriGeometryEnvelope');
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}Benton_County_Parcels/FeatureServer/0/query?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error(`ArcGIS API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('ArcGIS query failed:', error);
      throw error;
    }
  }
  
  async getParcelByCoordinates(lat: number, lon: number): Promise<ParcelFeature | null> {
    const params = new URLSearchParams({
      f: 'json',
      geometry: `${lon},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: '*',
      returnGeometry: 'true',
      token: ARCGIS_API_KEY || ''
    });
    
    try {
      const response = await fetch(
        `${this.baseUrl}Benton_County_Parcels/FeatureServer/0/query?${params.toString()}`
      );
      
      const data: ArcGISQueryResponse = await response.json();
      return data.features?.[0] || null;
    } catch (error) {
      console.error('Coordinate-based parcel lookup failed:', error);
      return null;
    }
  }
  
  async getFloodZoneData(bounds: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  }): Promise<any[]> {
    const params = new URLSearchParams({
      f: 'json',
      where: '1=1',
      geometry: `${bounds.xmin},${bounds.ymin},${bounds.xmax},${bounds.ymax}`,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'ZONE_SUBTY,FLOOD_ZONE,SFHA_TF',
      returnGeometry: 'true',
      token: ARCGIS_API_KEY || ''
    });
    
    try {
      const response = await fetch(
        `${this.baseUrl}Flood_Zones/FeatureServer/0/query?${params.toString()}`
      );
      
      const data = await response.json();
      return data.features || [];
    } catch (error) {
      console.error('Flood zone data fetch failed:', error);
      return [];
    }
  }
  
  async getZoningData(bounds: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  }): Promise<any[]> {
    const params = new URLSearchParams({
      f: 'json',
      where: '1=1',
      geometry: `${bounds.xmin},${bounds.ymin},${bounds.xmax},${bounds.ymax}`,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'ZONE_CLASS,ZONE_DESC,ACRES',
      returnGeometry: 'true',
      token: ARCGIS_API_KEY || ''
    });
    
    try {
      const response = await fetch(
        `${this.baseUrl}Zoning/FeatureServer/0/query?${params.toString()}`
      );
      
      const data = await response.json();
      return data.features || [];
    } catch (error) {
      console.error('Zoning data fetch failed:', error);
      return [];
    }
  }
  
  // Convert Web Mercator to WGS84
  webMercatorToGeographic(x: number, y: number): { lat: number; lon: number } {
    const lon = (x / 20037508.34) * 180;
    let lat = (y / 20037508.34) * 180;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
    
    return { lat, lon };
  }
  
  // Get Benton County boundaries for initial map view
  getBentonCountyBounds() {
    return {
      center: { lat: 46.2382, lon: -119.2751 },
      bounds: {
        north: 46.4650,
        south: 45.9380,
        east: -118.8950,
        west: -119.8540
      }
    };
  }
}

export const arcgisService = new ArcGISService();