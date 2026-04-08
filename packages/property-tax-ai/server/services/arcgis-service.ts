/**
 * ArcGIS REST Service Connector for Benton County
 * 
 * This service connects to the Benton County ArcGIS REST services to fetch
 * authentic GIS data for property assessment and mapping.
 * 
 * Endpoint: https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services
 */

import fetch from 'node-fetch';
import { IStorage } from '../storage';

interface ArcGISServiceConfig {
  baseUrl: string;
  apiKey?: string;
  serviceUrl: string;
  featureServer: string;
  layerId: number;
}

// Define available layer types
export enum BentonMapLayerType {
  PARCELS = 'parcels',
  ZONING = 'zoning',
  FLOOD_ZONES = 'flood_zones',
  WETLANDS = 'wetlands',
  SCHOOL_DISTRICTS = 'school_districts',
  COMMISSIONERS = 'commissioners',
  CENSUS_BLOCKS = 'census_blocks',
  TAX_DISTRICTS = 'tax_districts'
}

// Define the layer configuration
export interface BentonMapLayer {
  id: BentonMapLayerType;
  name: string;
  description: string;
  featureServer: string;
  layerId: number;
  fields: string[];
}

interface BentonParcelProperties {
  OBJECTID: number;
  PARCELID: string;
  SITUS: string;
  OWNER: string;
  ZONING: string;
  ACRES: number;
  TAXCODE: string;
  ASSESSEDVALUE: number;
  LANDVALUE: number;
  IMPROVEMENTVALUE: number;
  YEARBUILT?: number;
  LASTUPDATE: string;
  [key: string]: any;
}

interface BentonParcelFeature {
  attributes: BentonParcelProperties;
  geometry: {
    rings: number[][][];
  };
}

export class ArcGISService {
  private storage: IStorage;
  private config: ArcGISServiceConfig;
  private layers: Map<BentonMapLayerType, BentonMapLayer>;
  
  constructor(storage: IStorage) {
    this.storage = storage;
    
    // Benton County ArcGIS REST service configuration
    this.config = {
      baseUrl: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS',
      serviceUrl: 'rest/services',
      featureServer: 'Parcels_and_Assess/FeatureServer',
      layerId: 0
    };
    
    // Initialize available layers for Benton County
    this.layers = new Map<BentonMapLayerType, BentonMapLayer>([
      [BentonMapLayerType.PARCELS, {
        id: BentonMapLayerType.PARCELS,
        name: 'Parcels',
        description: 'Benton County property parcels with assessment data',
        featureServer: 'Parcels_and_Assess/FeatureServer',
        layerId: 0,
        fields: ['PARCELID', 'SITUS', 'OWNER', 'ZONING', 'ACRES', 'TAXCODE', 'ASSESSEDVALUE', 'LANDVALUE', 'IMPROVEMENTVALUE', 'YEARBUILT']
      }],
      [BentonMapLayerType.ZONING, {
        id: BentonMapLayerType.ZONING,
        name: 'Zoning',
        description: 'Benton County zoning districts and land use designations',
        featureServer: 'Zoning_Districts/FeatureServer',
        layerId: 0,
        fields: ['ZONE_CODE', 'ZONE_NAME', 'ZONE_DESC', 'ZONE_TYPE', 'PERMITTED_USES']
      }],
      [BentonMapLayerType.FLOOD_ZONES, {
        id: BentonMapLayerType.FLOOD_ZONES,
        name: 'Flood Zones',
        description: 'FEMA flood zones within Benton County',
        featureServer: 'Flood_Zones/FeatureServer',
        layerId: 0,
        fields: ['FLD_ZONE', 'ZONE_SUBTY', 'SFHA', 'FIRM_PANEL', 'EFF_DATE']
      }],
      [BentonMapLayerType.WETLANDS, {
        id: BentonMapLayerType.WETLANDS,
        name: 'Wetlands',
        description: 'National Wetlands Inventory for Benton County',
        featureServer: 'Wetlands/FeatureServer',
        layerId: 0,
        fields: ['WETLAND_TYPE', 'ACRES', 'CLASSIFICATION', 'WATER_REGIME']
      }],
      [BentonMapLayerType.SCHOOL_DISTRICTS, {
        id: BentonMapLayerType.SCHOOL_DISTRICTS,
        name: 'School Districts',
        description: 'Benton County school district boundaries',
        featureServer: 'School_Districts/FeatureServer',
        layerId: 0,
        fields: ['DISTRICT_ID', 'DISTRICT_NAME', 'DISTRICT_TYPE', 'ENROLLMENT']
      }],
      [BentonMapLayerType.COMMISSIONERS, {
        id: BentonMapLayerType.COMMISSIONERS,
        name: 'Commissioner Districts',
        description: 'Benton County commissioner district boundaries',
        featureServer: 'Commissioner_Districts/FeatureServer',
        layerId: 0,
        fields: ['DISTRICT_ID', 'COMMISSIONER', 'POPULATION', 'AREA_SQ_MI']
      }],
      [BentonMapLayerType.CENSUS_BLOCKS, {
        id: BentonMapLayerType.CENSUS_BLOCKS,
        name: 'Census Blocks',
        description: 'Census blocks for demographic analysis',
        featureServer: 'Census_Blocks/FeatureServer',
        layerId: 0,
        fields: ['GEOID', 'POPULATION', 'HOUSING_UNITS', 'MEDIAN_INCOME', 'MEDIAN_AGE']
      }],
      [BentonMapLayerType.TAX_DISTRICTS, {
        id: BentonMapLayerType.TAX_DISTRICTS,
        name: 'Tax Districts',
        description: 'Tax districts for property tax assessment',
        featureServer: 'Tax_Districts/FeatureServer',
        layerId: 0,
        fields: ['DISTRICT_ID', 'DISTRICT_NAME', 'DISTRICT_TYPE', 'TAX_RATE', 'EFFECTIVE_DATE']
      }]
    ]);
  }
  
  /**
   * Test the connection to the ArcGIS REST service
   */
  public async testConnection(): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/${this.config.serviceUrl}/${this.config.featureServer}/${this.config.layerId}?f=json`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        return data && data.name ? true : false;
      }
      
      return false;
    } catch (error) {
      console.error('Error testing ArcGIS connection:', error);
      return false;
    }
  }
  
  /**
   * Get all available Benton County map layers
   */
  public getAvailableLayers(): BentonMapLayer[] {
    return Array.from(this.layers.values());
  }
  
  /**
   * Get layer by type
   */
  public getLayerByType(layerType: BentonMapLayerType): BentonMapLayer | undefined {
    return this.layers.get(layerType);
  }
  
  /**
   * Get available layers from the Benton County ArcGIS service
   */
  public async getLayers(): Promise<any[]> {
    try {
      const url = `${this.config.baseUrl}/${this.config.serviceUrl}/${this.config.featureServer}?f=json`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        return data.layers || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching ArcGIS layers:', error);
      return [];
    }
  }
  
  /**
   * Get a parcel by its Parcel ID
   */
  public async getParcelByParcelId(parcelId: string): Promise<BentonParcelFeature | null> {
    try {
      const url = `${this.config.baseUrl}/${this.config.serviceUrl}/${this.config.featureServer}/${this.config.layerId}/query`;
      
      const params = new URLSearchParams({
        where: `PARCELID='${parcelId}'`,
        outFields: '*',
        returnGeometry: 'true',
        f: 'json'
      });
      
      const response = await fetch(`${url}?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          return data.features[0];
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching parcel ${parcelId} from ArcGIS:`, error);
      return null;
    }
  }
  
  /**
   * Get data for a specific feature in a specific layer
   */
  public async getFeatureByLayerAndId(layerType: BentonMapLayerType, featureId: string, idField: string = 'OBJECTID'): Promise<any | null> {
    try {
      const layer = this.layers.get(layerType);
      if (!layer) {
        throw new Error(`Layer type ${layerType} not found`);
      }
      
      const url = `${this.config.baseUrl}/${this.config.serviceUrl}/${layer.featureServer}/${layer.layerId}/query`;
      
      const params = new URLSearchParams({
        where: `${idField}='${featureId}'`,
        outFields: '*',
        returnGeometry: 'true',
        f: 'json'
      });
      
      const response = await fetch(`${url}?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          return data.features[0];
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching feature ${featureId} from layer ${layerType}:`, error);
      return null;
    }
  }
  
  /**
   * Search for parcels by various criteria
   */
  public async searchParcels(query: {
    parcelId?: string;
    owner?: string;
    address?: string;
    minValue?: number;
    maxValue?: number;
    zoning?: string;
  }): Promise<BentonParcelFeature[]> {
    try {
      const url = `${this.config.baseUrl}/${this.config.serviceUrl}/${this.config.featureServer}/${this.config.layerId}/query`;
      
      // Build WHERE clause based on query parameters
      const whereConditions: string[] = [];
      
      if (query.parcelId) {
        whereConditions.push(`PARCELID='${query.parcelId}'`);
      }
      
      if (query.owner) {
        whereConditions.push(`OWNER LIKE '%${query.owner}%'`);
      }
      
      if (query.address) {
        whereConditions.push(`SITUS LIKE '%${query.address}%'`);
      }
      
      if (query.minValue) {
        whereConditions.push(`ASSESSEDVALUE >= ${query.minValue}`);
      }
      
      if (query.maxValue) {
        whereConditions.push(`ASSESSEDVALUE <= ${query.maxValue}`);
      }
      
      if (query.zoning) {
        whereConditions.push(`ZONING='${query.zoning}'`);
      }
      
      const where = whereConditions.length > 0 
        ? whereConditions.join(' AND ')
        : '1=1'; // Return all parcels if no conditions
      
      const params = new URLSearchParams({
        where,
        outFields: '*',
        returnGeometry: 'true',
        f: 'json'
      });
      
      const response = await fetch(`${url}?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.features || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error searching parcels in ArcGIS:', error);
      return [];
    }
  }
  
  /**
   * Get features from a specific layer by search criteria
   */
  public async searchLayer(layerType: BentonMapLayerType, query: { [key: string]: any }): Promise<any[]> {
    try {
      const layer = this.layers.get(layerType);
      if (!layer) {
        throw new Error(`Layer type ${layerType} not found`);
      }
      
      const url = `${this.config.baseUrl}/${this.config.serviceUrl}/${layer.featureServer}/${layer.layerId}/query`;
      
      // Build WHERE clause based on query parameters
      const whereConditions: string[] = [];
      
      Object.entries(query).forEach(([key, value]) => {
        if (typeof value === 'string') {
          whereConditions.push(`${key} LIKE '%${value}%'`);
        } else if (typeof value === 'number') {
          whereConditions.push(`${key} = ${value}`);
        }
      });
      
      const where = whereConditions.length > 0 
        ? whereConditions.join(' AND ')
        : '1=1'; // Return all features if no conditions
      
      const params = new URLSearchParams({
        where,
        outFields: '*',
        returnGeometry: 'true',
        f: 'json'
      });
      
      const response = await fetch(`${url}?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.features || [];
      }
      
      return [];
    } catch (error) {
      console.error(`Error searching layer ${layerType}:`, error);
      return [];
    }
  }
  
  /**
   * Get neighboring parcels for a given parcel
   */
  public async getNeighboringParcels(parcelId: string): Promise<BentonParcelFeature[]> {
    try {
      // First, get the target parcel to extract its geometry
      const targetParcel = await this.getParcelByParcelId(parcelId);
      
      if (!targetParcel) {
        return [];
      }
      
      // Create a buffer around the parcel geometry
      // This is a simplification - in a real implementation, we would use the ArcGIS geometry service
      // to create a buffer, but for now we'll use a simpler approach
      
      const url = `${this.config.baseUrl}/${this.config.serviceUrl}/${this.config.featureServer}/${this.config.layerId}/query`;
      
      // Get the centroid of the parcel (simplified approach)
      let centroidX = 0;
      let centroidY = 0;
      
      if (targetParcel.geometry && targetParcel.geometry.rings && targetParcel.geometry.rings.length > 0) {
        const ring = targetParcel.geometry.rings[0];
        let sumX = 0;
        let sumY = 0;
        
        ring.forEach(point => {
          sumX += point[0];
          sumY += point[1];
        });
        
        centroidX = sumX / ring.length;
        centroidY = sumY / ring.length;
      }
      
      // Search for parcels within a certain distance of the centroid
      const params = new URLSearchParams({
        geometryType: 'esriGeometryPoint',
        geometry: `${centroidX},${centroidY}`,
        distance: '100', // 100 meters buffer
        units: 'esriSRUnit_Meter',
        inSR: '4326',
        outSR: '4326',
        outFields: '*',
        returnGeometry: 'true',
        where: `PARCELID <> '${parcelId}'`, // Exclude the target parcel
        f: 'json'
      });
      
      const response = await fetch(`${url}?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.features || [];
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching neighboring parcels for ${parcelId}:`, error);
      return [];
    }
  }
  
  /**
   * Get intersecting features from another layer for a given parcel
   */
  public async getIntersectingFeatures(parcelId: string, layerType: BentonMapLayerType): Promise<any[]> {
    try {
      // First, get the target parcel to extract its geometry
      const targetParcel = await this.getParcelByParcelId(parcelId);
      
      if (!targetParcel || !targetParcel.geometry || !targetParcel.geometry.rings) {
        return [];
      }
      
      const layer = this.layers.get(layerType);
      if (!layer) {
        throw new Error(`Layer type ${layerType} not found`);
      }
      
      // Convert rings to a simplified polygon for the query
      const ring = targetParcel.geometry.rings[0];
      const points = ring.map(point => `${point[0]},${point[1]}`).join(';');
      
      const url = `${this.config.baseUrl}/${this.config.serviceUrl}/${layer.featureServer}/${layer.layerId}/query`;
      
      // Search for features that intersect with the parcel geometry
      const params = new URLSearchParams({
        geometryType: 'esriGeometryPolygon',
        geometry: `{"rings":[[[${points}]]]}`,
        spatialRel: 'esriSpatialRelIntersects',
        inSR: '4326',
        outSR: '4326',
        outFields: '*',
        returnGeometry: 'true',
        f: 'json'
      });
      
      const response = await fetch(`${url}?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.features || [];
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching intersecting features for ${parcelId} from layer ${layerType}:`, error);
      return [];
    }
  }
  
  /**
   * Get properties in a specific school district
   */
  public async getPropertiesInSchoolDistrict(districtId: string): Promise<any[]> {
    try {
      // First, get the school district boundary
      const district = await this.getFeatureByLayerAndId(
        BentonMapLayerType.SCHOOL_DISTRICTS, 
        districtId, 
        'DISTRICT_ID'
      );
      
      if (!district || !district.geometry || !district.geometry.rings) {
        return [];
      }
      
      // Now search for parcels within this district boundary
      const ring = district.geometry.rings[0];
      const points = ring.map(point => `${point[0]},${point[1]}`).join(';');
      
      const url = `${this.config.baseUrl}/${this.config.serviceUrl}/${this.config.featureServer}/${this.config.layerId}/query`;
      
      const params = new URLSearchParams({
        geometryType: 'esriGeometryPolygon',
        geometry: `{"rings":[[[${points}]]]}`,
        spatialRel: 'esriSpatialRelIntersects',
        inSR: '4326',
        outSR: '4326',
        outFields: '*',
        returnGeometry: 'true',
        f: 'json'
      });
      
      const response = await fetch(`${url}?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        const parcels = data.features || [];
        
        // Convert to properties
        return parcels.map(parcel => this.convertToProperty(parcel)).filter(Boolean);
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching properties in school district ${districtId}:`, error);
      return [];
    }
  }
  
  /**
   * Get properties in a specific tax district
   */
  public async getPropertiesInTaxDistrict(districtId: string): Promise<any[]> {
    try {
      // First, get the tax district boundary
      const district = await this.getFeatureByLayerAndId(
        BentonMapLayerType.TAX_DISTRICTS, 
        districtId, 
        'DISTRICT_ID'
      );
      
      if (!district || !district.geometry || !district.geometry.rings) {
        return [];
      }
      
      // Now search for parcels within this district boundary
      const ring = district.geometry.rings[0];
      const points = ring.map(point => `${point[0]},${point[1]}`).join(';');
      
      const url = `${this.config.baseUrl}/${this.config.serviceUrl}/${this.config.featureServer}/${this.config.layerId}/query`;
      
      const params = new URLSearchParams({
        geometryType: 'esriGeometryPolygon',
        geometry: `{"rings":[[[${points}]]]}`,
        spatialRel: 'esriSpatialRelIntersects',
        inSR: '4326',
        outSR: '4326',
        outFields: '*',
        returnGeometry: 'true',
        f: 'json'
      });
      
      const response = await fetch(`${url}?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        const parcels = data.features || [];
        
        // Convert to properties
        return parcels.map(parcel => this.convertToProperty(parcel)).filter(Boolean);
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching properties in tax district ${districtId}:`, error);
      return [];
    }
  }
  
  /**
   * Get flood zone information for a parcel
   */
  public async getFloodZoneForParcel(parcelId: string): Promise<any> {
    try {
      const floodZones = await this.getIntersectingFeatures(parcelId, BentonMapLayerType.FLOOD_ZONES);
      
      if (floodZones.length === 0) {
        return { inFloodZone: false, zones: [] };
      }
      
      return {
        inFloodZone: true,
        zones: floodZones.map(zone => ({
          zone: zone.attributes.FLD_ZONE,
          subtype: zone.attributes.ZONE_SUBTY,
          isSpecialFloodHazardArea: zone.attributes.SFHA === 'Y',
          firmPanel: zone.attributes.FIRM_PANEL,
          effectiveDate: zone.attributes.EFF_DATE
        }))
      };
    } catch (error) {
      console.error(`Error fetching flood zone for parcel ${parcelId}:`, error);
      return { inFloodZone: false, zones: [], error: 'Failed to retrieve flood zone data' };
    }
  }
  
  /**
   * Get wetland information for a parcel
   */
  public async getWetlandsForParcel(parcelId: string): Promise<any> {
    try {
      const wetlands = await this.getIntersectingFeatures(parcelId, BentonMapLayerType.WETLANDS);
      
      if (wetlands.length === 0) {
        return { hasWetlands: false, wetlands: [] };
      }
      
      return {
        hasWetlands: true,
        wetlands: wetlands.map(wetland => ({
          type: wetland.attributes.WETLAND_TYPE,
          acres: wetland.attributes.ACRES,
          classification: wetland.attributes.CLASSIFICATION,
          waterRegime: wetland.attributes.WATER_REGIME
        }))
      };
    } catch (error) {
      console.error(`Error fetching wetlands for parcel ${parcelId}:`, error);
      return { hasWetlands: false, wetlands: [], error: 'Failed to retrieve wetland data' };
    }
  }
  
  /**
   * Convert ArcGIS parcel to our internal property format
   */
  public convertToProperty(parcel: BentonParcelFeature): any {
    if (!parcel || !parcel.attributes) {
      return null;
    }
    
    const attr = parcel.attributes;
    
    return {
      propertyId: `BC-${attr.PARCELID.replace(/[^0-9]/g, '')}`,
      address: attr.SITUS || '',
      parcelNumber: attr.PARCELID || '',
      propertyType: this.determinePropertyType(attr.ZONING || ''),
      acres: attr.ACRES || 0,
      value: attr.ASSESSEDVALUE || 0,
      status: 'active',
      extraFields: {
        yearBuilt: attr.YEARBUILT || 0,
        squareFootage: attr.SQFOOT || 0,
        owner: attr.OWNER || '',
        zoning: attr.ZONING || '',
        taxCode: attr.TAXCODE || '',
        lastUpdateDate: attr.LASTUPDATE || '',
        landValue: attr.LANDVALUE || 0,
        improvementValue: attr.IMPROVEMENTVALUE || 0,
        dataSource: 'Benton County ArcGIS REST Service'
      }
    };
  }
  
  /**
   * Get detailed zoning information for a zone code
   */
  public async getZoningDetails(zoneCode: string): Promise<any> {
    try {
      const results = await this.searchLayer(BentonMapLayerType.ZONING, { ZONE_CODE: zoneCode });
      
      if (results.length === 0) {
        return null;
      }
      
      const zoning = results[0].attributes;
      
      return {
        code: zoning.ZONE_CODE,
        name: zoning.ZONE_NAME,
        description: zoning.ZONE_DESC,
        type: zoning.ZONE_TYPE,
        permittedUses: zoning.PERMITTED_USES ? zoning.PERMITTED_USES.split(',').map((use: string) => use.trim()) : []
      };
    } catch (error) {
      console.error(`Error fetching zoning details for code ${zoneCode}:`, error);
      return null;
    }
  }
  
  /**
   * Determine property type based on zoning code
   */
  private determinePropertyType(zoning: string): string {
    // Expanded mapping of Benton County zoning codes to property types
    const zoningMap: { [key: string]: string } = {
      // Residential zones
      'R-1': 'Residential',
      'R-2': 'Residential',
      'R-3': 'Residential',
      'RL-1': 'Residential',
      'RL-5': 'Residential',
      'RM-10': 'Residential',
      'RM-20': 'Residential',
      'RPUD': 'Residential',
      
      // Commercial zones
      'C-1': 'Commercial',
      'C-2': 'Commercial',
      'CO': 'Commercial',
      'CG': 'Commercial',
      'CN': 'Commercial',
      'CPUD': 'Commercial',
      
      // Industrial zones
      'I-1': 'Industrial',
      'I-2': 'Industrial',
      'IL': 'Industrial',
      'IH': 'Industrial',
      
      // Agricultural zones
      'A-1': 'Agricultural',
      'AG': 'Agricultural',
      'AG-20': 'Agricultural',
      'AG-40': 'Agricultural',
      
      // Other zones
      'PF': 'Public Facility',
      'OS': 'Open Space',
      'MU': 'Mixed Use'
    };
    
    return zoningMap[zoning] || 'Unknown';
  }
}

// Export singleton instance
export const arcgisService = new ArcGISService(null as any);