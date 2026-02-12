const fs = require('fs');
const csv = require('csv-parse');
const path = require('path');

class BentonCountyDataImporter {
  constructor() {
    this.dataPath = path.join(__dirname, '../attached_assets/benton_ftp');
    this.propertyData = new Map();
    this.ownerData = new Map();
    this.valuationData = new Map();
    this.exemptionData = new Map();
  }

  async importAllData() {
    console.log('Starting Benton County data import...');
    
    try {
      await this.loadPropertyValues();
      await this.loadOwnerData();
      await this.loadSitusData();
      await this.loadExemptionData();
      
      console.log(`Imported ${this.propertyData.size} properties from Benton County`);
      return this.consolidateData();
    } catch (error) {
      console.error('Error importing Benton County data:', error);
      throw error;
    }
  }

  async loadPropertyValues() {
    const filePath = path.join(this.dataPath, 'property_val.csv');
    
    return new Promise((resolve, reject) => {
      const properties = [];
      
      fs.createReadStream(filePath)
        .pipe(csv.parse({ 
          headers: true, 
          skip_empty_lines: true,
          trim: true
        }))
        .on('data', (row) => {
          const property = {
            propId: row.prop_id,
            legalDesc: row.legal_desc,
            propertyUseCode: row.property_use_cd,
            propertyUseDesc: row.property_use_desc,
            marketValue: parseFloat(row.market) || 0,
            landHomesteadValue: parseFloat(row.land_hstd_val) || 0,
            landNonHomesteadValue: parseFloat(row.land_non_hstd_val) || 0,
            improvementHomesteadValue: parseFloat(row.imprv_hstd_val) || 0,
            improvementNonHomesteadValue: parseFloat(row.imprv_non_hstd_val) || 0,
            appraisedValue: parseFloat(row.appraised_val) || 0,
            assessedValue: parseFloat(row.assessed_val) || 0,
            legalAcreage: parseFloat(row.legal_acreage) || 0,
            propertyType: row.prop_type_cd,
            imagePath: row.image_path,
            geoId: row.geo_id,
            isActive: row.isactive === '1',
            tca: row.TCA
          };
          
          this.propertyData.set(property.propId, property);
          properties.push(property);
        })
        .on('end', () => {
          console.log(`Loaded ${properties.length} property valuations`);
          resolve(properties);
        })
        .on('error', reject);
    });
  }

  async loadOwnerData() {
    const filePath = path.join(this.dataPath, 'owner.csv');
    
    return new Promise((resolve, reject) => {
      const owners = [];
      
      fs.createReadStream(filePath)
        .pipe(csv.parse({ 
          headers: true, 
          skip_empty_lines: true,
          trim: true
        }))
        .on('data', (row) => {
          const owner = {
            propId: row.prop_id,
            ownerName: row.owner_name,
            ownerName2: row.owner_name_2,
            ownerAddress: row.owner_address,
            ownerCity: row.owner_city,
            ownerState: row.owner_state,
            ownerZip: row.owner_zip,
            ownerZip4: row.owner_zip_4
          };
          
          this.ownerData.set(owner.propId, owner);
          owners.push(owner);
        })
        .on('end', () => {
          console.log(`Loaded ${owners.length} owner records`);
          resolve(owners);
        })
        .on('error', reject);
    });
  }

  async loadSitusData() {
    const filePath = path.join(this.dataPath, 'situs.csv');
    
    return new Promise((resolve, reject) => {
      const addresses = [];
      
      fs.createReadStream(filePath)
        .pipe(csv.parse({ 
          headers: true, 
          skip_empty_lines: true,
          trim: true
        }))
        .on('data', (row) => {
          const situs = {
            propId: row.prop_id,
            situsAddress: row.situs_address,
            situsCity: row.situs_city,
            situsState: row.situs_state,
            situsZip: row.situs_zip
          };
          
          const existing = this.propertyData.get(situs.propId);
          if (existing) {
            existing.situsAddress = situs.situsAddress;
            existing.situsCity = situs.situsCity;
            existing.situsState = situs.situsState;
            existing.situsZip = situs.situsZip;
          }
          
          addresses.push(situs);
        })
        .on('end', () => {
          console.log(`Loaded ${addresses.length} situs addresses`);
          resolve(addresses);
        })
        .on('error', reject);
    });
  }

  async loadExemptionData() {
    const filePath = path.join(this.dataPath, 'exempt.csv');
    
    return new Promise((resolve, reject) => {
      const exemptions = [];
      
      fs.createReadStream(filePath)
        .pipe(csv.parse({ 
          headers: true, 
          skip_empty_lines: true,
          trim: true
        }))
        .on('data', (row) => {
          const exemption = {
            propId: row.prop_id,
            exemptionCode: row.exempt_cd,
            exemptionDesc: row.exempt_desc,
            exemptionAmount: parseFloat(row.exempt_amt) || 0,
            exemptionPercent: parseFloat(row.exempt_pct) || 0
          };
          
          if (!this.exemptionData.has(exemption.propId)) {
            this.exemptionData.set(exemption.propId, []);
          }
          this.exemptionData.get(exemption.propId).push(exemption);
          
          exemptions.push(exemption);
        })
        .on('end', () => {
          console.log(`Loaded ${exemptions.length} exemption records`);
          resolve(exemptions);
        })
        .on('error', reject);
    });
  }

  consolidateData() {
    const consolidatedProperties = [];
    
    for (const [propId, property] of this.propertyData) {
      const owner = this.ownerData.get(propId);
      const exemptions = this.exemptionData.get(propId) || [];
      
      const consolidatedProperty = {
        id: `benton-${propId}`,
        parcelId: propId,
        address: property.situsAddress || property.legalDesc || 'Unknown Address',
        city: property.situsCity || 'Unknown City',
        state: property.situsState || 'WA',
        zipCode: property.situsZip || '',
        
        // Owner Information
        ownerName: owner?.ownerName || 'Unknown Owner',
        ownerAddress: owner?.ownerAddress || '',
        ownerCity: owner?.ownerCity || '',
        ownerState: owner?.ownerState || '',
        ownerZip: owner?.ownerZip || '',
        
        // Property Values
        marketValue: property.marketValue.toString(),
        assessedValue: property.assessedValue.toString(),
        appraisedValue: property.appraisedValue.toString(),
        landValue: (property.landHomesteadValue + property.landNonHomesteadValue).toString(),
        improvementValue: (property.improvementHomesteadValue + property.improvementNonHomesteadValue).toString(),
        
        // Property Details
        propertyType: this.mapPropertyType(property.propertyUseCode),
        propertyUse: property.propertyUseDesc,
        acreage: property.legalAcreage.toString(),
        isActive: property.isActive,
        
        // TCA (Tax Code Area)
        taxCodeArea: property.tca,
        
        // Exemptions
        exemptions: exemptions.map(e => ({
          code: e.exemptionCode,
          description: e.exemptionDesc,
          amount: e.exemptionAmount,
          percent: e.exemptionPercent
        })),
        
        // Additional metadata
        geoId: property.geoId,
        imagePath: property.imagePath,
        
        // Standard fields for compatibility
        squareFootage: null,
        yearBuilt: null,
        lastAssessmentDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString()
      };
      
      consolidatedProperties.push(consolidatedProperty);
    }
    
    return consolidatedProperties;
  }

  mapPropertyType(useCode) {
    // Map Benton County property use codes to standard types
    const codeMap = {
      '10': 'residential',
      '11': 'residential', 
      '12': 'residential',
      '20': 'commercial',
      '21': 'commercial',
      '30': 'industrial',
      '31': 'industrial',
      '40': 'agricultural',
      '41': 'agricultural',
      '50': 'forest',
      '60': 'other',
      '70': 'exempt',
      '80': 'agricultural',
      '81': 'agricultural',
      '82': 'agricultural',
      '83': 'agricultural',
      '90': 'undeveloped',
      '91': 'undeveloped'
    };
    
    if (!useCode) return 'unknown';
    
    const cleanCode = useCode.toString().trim().substring(0, 2);
    return codeMap[cleanCode] || 'other';
  }

  async getPropertyById(propId) {
    const property = this.propertyData.get(propId);
    if (!property) return null;
    
    const owner = this.ownerData.get(propId);
    const exemptions = this.exemptionData.get(propId) || [];
    
    return this.consolidateData().find(p => p.parcelId === propId);
  }

  async searchProperties(query, limit = 50) {
    const allProperties = this.consolidateData();
    const searchTerm = query.toLowerCase();
    
    return allProperties
      .filter(property => 
        property.address.toLowerCase().includes(searchTerm) ||
        property.parcelId.toLowerCase().includes(searchTerm) ||
        property.ownerName.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit);
  }

  getStatistics() {
    const allProperties = this.consolidateData();
    
    const stats = {
      totalProperties: allProperties.length,
      totalAssessedValue: allProperties.reduce((sum, p) => sum + parseFloat(p.assessedValue || 0), 0),
      totalMarketValue: allProperties.reduce((sum, p) => sum + parseFloat(p.marketValue || 0), 0),
      averageAssessedValue: 0,
      averageMarketValue: 0,
      propertyTypes: {},
      exemptionCount: 0
    };
    
    // Calculate averages
    if (stats.totalProperties > 0) {
      stats.averageAssessedValue = stats.totalAssessedValue / stats.totalProperties;
      stats.averageMarketValue = stats.totalMarketValue / stats.totalProperties;
    }
    
    // Count property types and exemptions
    allProperties.forEach(property => {
      const type = property.propertyType;
      stats.propertyTypes[type] = (stats.propertyTypes[type] || 0) + 1;
      
      if (property.exemptions && property.exemptions.length > 0) {
        stats.exemptionCount++;
      }
    });
    
    return stats;
  }
}

module.exports = BentonCountyDataImporter;