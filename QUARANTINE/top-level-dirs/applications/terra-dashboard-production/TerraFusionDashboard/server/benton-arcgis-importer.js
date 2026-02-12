import fetch from 'node-fetch';
import { db } from './db.ts';
import { properties } from '../shared/schema.ts';
import { v4 as uuidv4 } from 'uuid';

class BentonArcGISImporter {
  constructor() {
    this.apiKey = process.env.BENTON_COUNTY_ARCGIS_API_KEY;
    this.baseUrl = 'https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services';
    this.propertyServiceUrl = `${this.baseUrl}/Property_Parcels/FeatureServer/0/query`;
    this.batchSize = 1000;
  }

  async importAllProperties() {
    console.log('Starting Benton County ArcGIS property import...');
    
    try {
      // Get total count first
      const totalCount = await this.getPropertyCount();
      console.log(`Found ${totalCount} properties in Benton County ArcGIS`);
      
      // Import in batches
      let imported = 0;
      let offset = 0;
      
      while (offset < totalCount) {
        const batch = await this.fetchPropertyBatch(offset, this.batchSize);
        if (batch.length > 0) {
          await this.insertBatch(batch);
          imported += batch.length;
          console.log(`Imported ${imported}/${totalCount} properties`);
        }
        offset += this.batchSize;
      }
      
      console.log(`Successfully imported ${imported} Benton County properties`);
      return imported;
    } catch (error) {
      console.error('ArcGIS import failed:', error);
      throw error;
    }
  }

  async getPropertyCount() {
    const params = new URLSearchParams({
      where: "1=1",
      returnCountOnly: true,
      f: 'json',
      token: this.apiKey
    });

    const response = await fetch(`${this.propertyServiceUrl}?${params}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`ArcGIS API Error: ${data.error.message}`);
    }
    
    return data.count || 0;
  }

  async fetchPropertyBatch(offset, limit) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "*",
      resultOffset: offset,
      resultRecordCount: limit,
      f: 'json',
      token: this.apiKey
    });

    const response = await fetch(`${this.propertyServiceUrl}?${params}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`ArcGIS API Error: ${data.error.message}`);
    }
    
    return data.features || [];
  }

  async insertBatch(features) {
    const propertyRecords = features.map(feature => this.transformFeature(feature));
    
    if (propertyRecords.length > 0) {
      await db.insert(properties).values(propertyRecords).onConflictDoNothing();
    }
  }

  transformFeature(feature) {
    const attrs = feature.attributes;
    const geometry = feature.geometry;
    
    return {
      id: uuidv4(),
      parcelId: attrs.PARCEL_ID || attrs.PIN || attrs.ACCOUNT_NO || `ARC_${attrs.OBJECTID}`,
      address: this.formatAddress(attrs),
      ownerName: attrs.OWNER_NAME || attrs.OWNER || attrs.PROP_OWNER || null,
      assessedValue: this.parseValue(attrs.ASSESSED_VAL || attrs.TOTAL_VALUE || attrs.APPRAISED_VAL),
      marketValue: this.parseValue(attrs.MARKET_VAL || attrs.MARKET_VALUE),
      landValue: this.parseValue(attrs.LAND_VAL || attrs.LAND_VALUE),
      improvementValue: this.parseValue(attrs.IMPR_VAL || attrs.IMPROVEMENT_VAL || attrs.BUILDING_VAL),
      squareFootage: this.parseNumber(attrs.SQ_FEET || attrs.SQUARE_FEET || attrs.BUILDING_SF),
      yearBuilt: this.parseNumber(attrs.YEAR_BUILT || attrs.YR_BUILT),
      propertyType: this.mapPropertyType(attrs.PROP_TYPE || attrs.PROPERTY_TYPE || attrs.USE_CODE_DESC),
      coordinates: geometry ? {
        lat: geometry.y || geometry.latitude,
        lng: geometry.x || geometry.longitude
      } : null,
      countyName: 'Benton County',
      active: true,
      lastSyncAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  formatAddress(attrs) {
    const parts = [];
    
    if (attrs.HOUSE_NUM || attrs.ADDRESS_NUM) parts.push(attrs.HOUSE_NUM || attrs.ADDRESS_NUM);
    if (attrs.STREET_NAME || attrs.STREET) parts.push(attrs.STREET_NAME || attrs.STREET);
    if (attrs.STREET_TYPE || attrs.ST_TYPE) parts.push(attrs.STREET_TYPE || attrs.ST_TYPE);
    
    let address = parts.join(' ').trim();
    
    if (!address && (attrs.SITUS_ADDR || attrs.SITE_ADDR || attrs.PROPERTY_ADDRESS)) {
      address = attrs.SITUS_ADDR || attrs.SITE_ADDR || attrs.PROPERTY_ADDRESS;
    }
    
    // Add city if available
    const city = attrs.CITY || attrs.MUNICIPALITY || 'Benton County';
    if (address && !address.includes(city)) {
      address += `, ${city}, WA`;
    } else if (!address) {
      address = `${city}, WA`;
    }
    
    return address;
  }

  parseValue(value) {
    if (!value) return "0.00";
    const parsed = parseFloat(value.toString().replace(/[,$]/g, ''));
    return isNaN(parsed) ? "0.00" : parsed.toFixed(2);
  }

  parseNumber(value) {
    if (!value) return null;
    const parsed = parseInt(value.toString().replace(/[,$]/g, ''));
    return isNaN(parsed) ? null : parsed;
  }

  mapPropertyType(type) {
    if (!type) return 'Unknown';
    
    const typeStr = type.toString().toLowerCase();
    
    if (typeStr.includes('residential') || typeStr.includes('single family') || typeStr.includes('sfr')) return 'Residential';
    if (typeStr.includes('commercial') || typeStr.includes('retail') || typeStr.includes('office')) return 'Commercial';
    if (typeStr.includes('industrial') || typeStr.includes('manufacturing') || typeStr.includes('warehouse')) return 'Industrial';
    if (typeStr.includes('agricultural') || typeStr.includes('farm') || typeStr.includes('ag ')) return 'Agricultural';
    if (typeStr.includes('vacant') || typeStr.includes('undeveloped')) return 'Vacant Land';
    if (typeStr.includes('government') || typeStr.includes('public')) return 'Government';
    if (typeStr.includes('school') || typeStr.includes('education')) return 'Educational';
    if (typeStr.includes('church') || typeStr.includes('religious')) return 'Religious';
    
    return type;
  }
}

export { BentonArcGISImporter };