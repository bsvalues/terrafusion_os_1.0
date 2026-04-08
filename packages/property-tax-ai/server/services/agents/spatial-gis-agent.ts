/**
 * Spatial GIS Agent
 * 
 * This agent specializes in spatial analysis and mapping operations using
 * authentic Benton County GIS data from the ArcGIS REST services.
 * 
 * The agent provides capabilities for parcel mapping, spatial searches,
 * neighborhood analysis, and other GIS-related operations.
 */

import { BaseAgent, AgentConfig } from './base-agent';
import { IStorage } from '../../storage';
import { MCPService } from '../mcp';
import { ArcGISService, BentonMapLayerType } from '../arcgis-service';
import { BentonMarketFactorService } from '../benton-market-factor-service';

interface SpatialAnalysisOptions {
  includeNeighbors?: boolean;
  radius?: number;
  includeValue?: boolean;
  includeOwnership?: boolean;
  includeDemographics?: boolean;
  includeZoning?: boolean;
  includeFloodZones?: boolean;
  includeWetlands?: boolean;
  includeSchoolDistricts?: boolean;
  includeTaxDistricts?: boolean;
}

export class SpatialGISAgent extends BaseAgent {
  private arcgisService: ArcGISService;
  private marketFactorService: BentonMarketFactorService;
  
  constructor(
    storage: IStorage,
    mcpService: MCPService,
    arcgisService: ArcGISService,
    marketFactorService: BentonMarketFactorService
  ) {
    // Define agent configuration
    const config: AgentConfig = {
      id: 'spatial_gis',
      name: 'Spatial GIS Agent',
      description: 'Specializes in spatial analysis and mapping operations for Benton County properties',
      capabilities: [],
      permissions: []
    };
    
    // Initialize the base agent
    super(storage, mcpService, config);
    
    // Store service references
    this.arcgisService = arcgisService;
    this.marketFactorService = marketFactorService;
    
    // Add capabilities
    this.config.capabilities = [
      {
        name: 'getSpatialInfo',
        description: 'Get spatial information for a property including GIS data',
        handler: this.getSpatialInfo.bind(this)
      },
      {
        name: 'getNeighborhoodMap',
        description: 'Generate a neighborhood map and analysis for a property',
        handler: this.getNeighborhoodMap.bind(this)
      },
      {
        name: 'searchByLocation',
        description: 'Search for properties by geographic location or proximity',
        handler: this.searchByLocation.bind(this)
      },
      {
        name: 'analyzeZoning',
        description: 'Analyze zoning information and land use for a property',
        handler: this.analyzeZoning.bind(this)
      },
      {
        name: 'generateHeatmap',
        description: 'Generate a property value heatmap for an area',
        handler: this.generateHeatmap.bind(this)
      },
      {
        name: 'getFloodZoneAnalysis',
        description: 'Get flood zone information and analysis for a property',
        handler: this.getFloodZoneAnalysis.bind(this)
      },
      {
        name: 'getWetlandsAnalysis',
        description: 'Get wetlands information and analysis for a property',
        handler: this.getWetlandsAnalysis.bind(this)
      },
      {
        name: 'getSchoolDistrictInfo',
        description: 'Get school district information for a property',
        handler: this.getSchoolDistrictInfo.bind(this)
      },
      {
        name: 'getTaxDistrictInfo',
        description: 'Get tax district information for a property',
        handler: this.getTaxDistrictInfo.bind(this)
      },
      {
        name: 'getMultiLayerAnalysis',
        description: 'Perform a multi-layer spatial analysis for a property',
        handler: this.getMultiLayerAnalysis.bind(this)
      }
    ];
  }
  
  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    await this.baseInitialize();
    
    // Register MCP tools
    await this.registerMCPTools([
      {
        name: 'gis.getParcel',
        description: 'Get parcel information from the GIS system',
        handler: async (params: any) => {
          const { parcelId } = params;
          
          if (!parcelId) {
            return { success: false, error: 'Parcel ID is required' };
          }
          
          const parcel = await this.arcgisService.getParcelByParcelId(parcelId);
          
          if (!parcel) {
            return { success: false, error: 'Parcel not found' };
          }
          
          return { success: true, result: parcel };
        }
      },
      {
        name: 'gis.searchParcels',
        description: 'Search for parcels in the GIS system',
        handler: async (params: any) => {
          const results = await this.arcgisService.searchParcels(params);
          return { success: true, result: results };
        }
      },
      {
        name: 'gis.getNeighboringParcels',
        description: 'Get neighboring parcels for a given parcel',
        handler: async (params: any) => {
          const { parcelId } = params;
          
          if (!parcelId) {
            return { success: false, error: 'Parcel ID is required' };
          }
          
          const neighbors = await this.arcgisService.getNeighboringParcels(parcelId);
          return { success: true, result: neighbors };
        }
      },
      {
        name: 'gis.getAvailableLayers',
        description: 'Get all available GIS layers from Benton County',
        handler: async () => {
          const layers = this.arcgisService.getAvailableLayers();
          return { 
            success: true, 
            result: layers.map(layer => ({
              id: layer.id,
              name: layer.name,
              description: layer.description
            }))
          };
        }
      },
      {
        name: 'gis.getFloodZone',
        description: 'Get flood zone information for a parcel',
        handler: async (params: any) => {
          const { parcelId } = params;
          
          if (!parcelId) {
            return { success: false, error: 'Parcel ID is required' };
          }
          
          const floodInfo = await this.arcgisService.getFloodZoneForParcel(parcelId);
          return { success: true, result: floodInfo };
        }
      },
      {
        name: 'gis.getWetlands',
        description: 'Get wetlands information for a parcel',
        handler: async (params: any) => {
          const { parcelId } = params;
          
          if (!parcelId) {
            return { success: false, error: 'Parcel ID is required' };
          }
          
          const wetlandsInfo = await this.arcgisService.getWetlandsForParcel(parcelId);
          return { success: true, result: wetlandsInfo };
        }
      },
      {
        name: 'gis.getZoningDetails',
        description: 'Get detailed zoning information for a zone code',
        handler: async (params: any) => {
          const { zoneCode } = params;
          
          if (!zoneCode) {
            return { success: false, error: 'Zone code is required' };
          }
          
          const zoningDetails = await this.arcgisService.getZoningDetails(zoneCode);
          
          if (!zoningDetails) {
            return { success: false, error: 'Zoning details not found' };
          }
          
          return { success: true, result: zoningDetails };
        }
      },
      {
        name: 'gis.getSchoolDistrict',
        description: 'Get school district information for a parcel',
        handler: async (params: any) => {
          const { parcelId } = params;
          
          if (!parcelId) {
            return { success: false, error: 'Parcel ID is required' };
          }
          
          const schoolDistricts = await this.arcgisService.getIntersectingFeatures(
            parcelId,
            BentonMapLayerType.SCHOOL_DISTRICTS
          );
          
          if (schoolDistricts.length === 0) {
            return { success: false, error: 'School district not found for parcel' };
          }
          
          return { 
            success: true, 
            result: schoolDistricts.map(district => ({
              districtId: district.attributes.DISTRICT_ID,
              name: district.attributes.DISTRICT_NAME,
              type: district.attributes.DISTRICT_TYPE,
              enrollment: district.attributes.ENROLLMENT
            }))
          };
        }
      },
      {
        name: 'gis.getTaxDistrict',
        description: 'Get tax district information for a parcel',
        handler: async (params: any) => {
          const { parcelId } = params;
          
          if (!parcelId) {
            return { success: false, error: 'Parcel ID is required' };
          }
          
          const taxDistricts = await this.arcgisService.getIntersectingFeatures(
            parcelId,
            BentonMapLayerType.TAX_DISTRICTS
          );
          
          if (taxDistricts.length === 0) {
            return { success: false, error: 'Tax district not found for parcel' };
          }
          
          return { 
            success: true, 
            result: taxDistricts.map(district => ({
              districtId: district.attributes.DISTRICT_ID,
              name: district.attributes.DISTRICT_NAME,
              type: district.attributes.DISTRICT_TYPE,
              taxRate: district.attributes.TAX_RATE,
              effectiveDate: district.attributes.EFFECTIVE_DATE
            }))
          };
        }
      },
      {
        name: 'gis.getPropertiesInSchoolDistrict',
        description: 'Get properties in a specific school district',
        handler: async (params: any) => {
          const { districtId } = params;
          
          if (!districtId) {
            return { success: false, error: 'District ID is required' };
          }
          
          const properties = await this.arcgisService.getPropertiesInSchoolDistrict(districtId);
          return { success: true, result: properties };
        }
      },
      {
        name: 'gis.getPropertiesInTaxDistrict',
        description: 'Get properties in a specific tax district',
        handler: async (params: any) => {
          const { districtId } = params;
          
          if (!districtId) {
            return { success: false, error: 'District ID is required' };
          }
          
          const properties = await this.arcgisService.getPropertiesInTaxDistrict(districtId);
          return { success: true, result: properties };
        }
      }
    ]);
    
    // Log successful initialization
    await this.logActivity('initialization', 'Spatial GIS Agent initialized successfully');
  }
  
  /**
   * Get flood zone analysis for a property
   */
  private async getFloodZoneAnalysis(params: any): Promise<any> {
    try {
      const { propertyId } = params;
      
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' };
      }
      
      // Get the property to extract the parcel number
      const property = await this.executeMCPTool('property.getByPropertyId', { propertyId });
      
      if (!property?.success || !property.result) {
        return { success: false, error: 'Property not found' };
      }
      
      const parcelNumber = property.result.parcelNumber;
      
      // Get flood zone information
      const floodZoneResult = await this.executeMCPTool('gis.getFloodZone', { parcelId: parcelNumber });
      
      if (!floodZoneResult?.success) {
        return { success: false, error: 'Failed to get flood zone information' };
      }
      
      // Get property value and other details for context
      const propertyValue = property.result.value || 0;
      const propertyAcres = property.result.acres || 0;
      
      // Get risk assessment based on flood zone types
      const { inFloodZone, zones } = floodZoneResult.result;
      let riskLevel = 'Low';
      let insuranceRequired = false;
      let developmentRestrictions = [];
      
      if (inFloodZone && zones.length > 0) {
        // Check for high-risk zones (A, AE, etc.)
        const hasHighRiskZones = zones.some((zone: any) => 
          zone.zone.startsWith('A') || zone.zone.startsWith('V'));
        
        // Check for special flood hazard areas
        const hasSpecialFloodHazardAreas = zones.some((zone: any) => 
          zone.isSpecialFloodHazardArea);
        
        if (hasHighRiskZones || hasSpecialFloodHazardAreas) {
          riskLevel = 'High';
          insuranceRequired = true;
          developmentRestrictions = [
            'Elevated building requirements',
            'Special permits needed for new construction',
            'Restrictions on land division and development density',
            'Additional engineering studies may be required'
          ];
        } else if (zones.some((zone: any) => zone.zone.startsWith('B') || zone.zone === 'X')) {
          riskLevel = 'Moderate';
          insuranceRequired = false;
          developmentRestrictions = [
            'Some development restrictions may apply',
            'Flood insurance recommended but not required'
          ];
        }
      }
      
      // Estimate potential impact
      const valueImpact = inFloodZone ? 
        (riskLevel === 'High' ? 
          { percentage: -15, description: 'High flood risk typically reduces property values by 10-15%' } :
          { percentage: -5, description: 'Moderate flood risk typically reduces property values by 5-10%' }) :
        { percentage: 0, description: 'No flood risk impact on property value' };
      
      const impactAmount = Math.round((propertyValue * valueImpact.percentage) / 100);
      
      // Generate the analysis result
      const result = {
        propertyId,
        address: property.result.address,
        floodZone: {
          inFloodZone,
          zones: zones || [],
          riskLevel,
          insuranceRequired,
          developmentRestrictions
        },
        impact: {
          valueImpact: {
            percentage: valueImpact.percentage,
            amount: impactAmount,
            description: valueImpact.description
          },
          recommendations: inFloodZone ? [
            'Consider flood insurance even if not required',
            'Implement flood mitigation measures',
            'Document property condition for insurance claims',
            'Consider elevation certificate for accurate insurance rates'
          ] : [
            'No specific flood mitigation actions needed'
          ]
        },
        source: 'Benton County ArcGIS Flood Zone Data'
      };
      
      await this.logActivity('flood_zone_analysis_generated', 'Flood zone analysis generated', { propertyId });
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'getFloodZoneAnalysis',
        result
      };
    } catch (error: any) {
      await this.logActivity('flood_zone_analysis_error', `Error generating flood zone analysis: ${error.message}`);
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'getFloodZoneAnalysis',
        error: `Failed to generate flood zone analysis: ${error.message}`
      };
    }
  }
  
  /**
   * Get wetlands analysis for a property
   */
  private async getWetlandsAnalysis(params: any): Promise<any> {
    try {
      const { propertyId } = params;
      
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' };
      }
      
      // Get the property to extract the parcel number
      const property = await this.executeMCPTool('property.getByPropertyId', { propertyId });
      
      if (!property?.success || !property.result) {
        return { success: false, error: 'Property not found' };
      }
      
      const parcelNumber = property.result.parcelNumber;
      
      // Get wetlands information
      const wetlandsResult = await this.executeMCPTool('gis.getWetlands', { parcelId: parcelNumber });
      
      if (!wetlandsResult?.success) {
        return { success: false, error: 'Failed to get wetlands information' };
      }
      
      // Get property value and other details for context
      const propertyValue = property.result.value || 0;
      const propertyAcres = property.result.acres || 0;
      
      // Get wetlands impact assessment
      const { hasWetlands, wetlands } = wetlandsResult.result;
      
      // Calculate total wetland acres on the property
      let totalWetlandAcres = 0;
      if (hasWetlands && wetlands.length > 0) {
        totalWetlandAcres = wetlands.reduce((sum: number, wetland: any) => sum + (wetland.acres || 0), 0);
      }
      
      // Calculate percentage of property covered by wetlands
      const wetlandCoveragePercent = propertyAcres > 0 ? 
        Math.min(100, Math.round((totalWetlandAcres / propertyAcres) * 100)) : 0;
      
      // Determine development restrictions based on wetland types
      let developmentRestrictions = [];
      let conservationRequirements = [];
      let permitRequirements = [];
      
      if (hasWetlands && wetlands.length > 0) {
        const hasProtectedWetlands = wetlands.some((wetland: any) => 
          wetland.classification && wetland.classification.includes('Protected'));
        
        const hasHighValueWetlands = wetlands.some((wetland: any) => 
          wetland.type && (wetland.type.includes('Estuarine') || wetland.type.includes('Riverine')));
        
        if (hasProtectedWetlands || hasHighValueWetlands || wetlandCoveragePercent > 30) {
          developmentRestrictions = [
            'Significant development restrictions',
            'Buffer zones required around wetland areas',
            'Mitigation may be required for any wetland disturbance',
            'Conservation easements may be required'
          ];
          
          conservationRequirements = [
            'Protected wetlands require permanent conservation',
            'Habitat preservation measures required',
            'Water quality monitoring may be required'
          ];
          
          permitRequirements = [
            'Federal permits required (Army Corps of Engineers)',
            'State wetland permits required',
            'Local environmental review required'
          ];
        } else {
          developmentRestrictions = [
            'Limited development allowed with proper permitting',
            'Buffer zones required around wetland areas'
          ];
          
          conservationRequirements = [
            'Basic wetland protection measures required'
          ];
          
          permitRequirements = [
            'Local environmental review required',
            'State permits may be required depending on impact'
          ];
        }
      }
      
      // Estimate potential value impact
      const valueImpact = hasWetlands ? 
        (wetlandCoveragePercent > 50 ? 
          { percentage: -25, description: 'Properties with significant wetland coverage typically see reduced development potential and value' } :
          wetlandCoveragePercent > 20 ? 
            { percentage: -15, description: 'Moderate wetland coverage reduces property development options' } :
            { percentage: -5, description: 'Minor wetland presence has limited impact on property value' }) :
        { percentage: 0, description: 'No wetland impact on property value' };
      
      const impactAmount = Math.round((propertyValue * valueImpact.percentage) / 100);
      
      // Generate the analysis result
      const result = {
        propertyId,
        address: property.result.address,
        wetlands: {
          hasWetlands,
          wetlandDetails: wetlands || [],
          totalWetlandAcres,
          wetlandCoveragePercent,
          developmentRestrictions,
          conservationRequirements,
          permitRequirements
        },
        impact: {
          valueImpact: {
            percentage: valueImpact.percentage,
            amount: impactAmount,
            description: valueImpact.description
          },
          potentialBenefits: hasWetlands ? [
            'Potential for conservation tax incentives',
            'Wildlife habitat enhancement opportunities',
            'Water quality improvement credits',
            'Recreational opportunities'
          ] : []
        },
        source: 'Benton County ArcGIS Wetlands Data'
      };
      
      await this.logActivity('wetlands_analysis_generated', 'Wetlands analysis generated', { propertyId });
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'getWetlandsAnalysis',
        result
      };
    } catch (error: any) {
      await this.logActivity('wetlands_analysis_error', `Error generating wetlands analysis: ${error.message}`);
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'getWetlandsAnalysis',
        error: `Failed to generate wetlands analysis: ${error.message}`
      };
    }
  }
  
  /**
   * Get school district information for a property
   */
  private async getSchoolDistrictInfo(params: any): Promise<any> {
    try {
      const { propertyId } = params;
      
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' };
      }
      
      // Get the property to extract the parcel number
      const property = await this.executeMCPTool('property.getByPropertyId', { propertyId });
      
      if (!property?.success || !property.result) {
        return { success: false, error: 'Property not found' };
      }
      
      const parcelNumber = property.result.parcelNumber;
      
      // Get school district information
      const schoolDistrictResult = await this.executeMCPTool('gis.getSchoolDistrict', { parcelId: parcelNumber });
      
      if (!schoolDistrictResult?.success) {
        return { success: false, error: 'Failed to get school district information' };
      }
      
      // Get property value for context
      const propertyValue = property.result.value || 0;
      
      // Get market impact from school district quality
      const districts = schoolDistrictResult.result;
      const districtNames = districts.map((d: any) => d.name).join(', ');
      
      // Generate the analysis result
      const result = {
        propertyId,
        address: property.result.address,
        schoolDistricts: districts,
        impact: {
          valueImpact: {
            description: `Properties in ${districtNames} typically benefit from good school district ratings`
          },
          taxesAndFunding: {
            description: `School district funding is primarily from property taxes within the district boundaries`
          }
        },
        source: 'Benton County ArcGIS School District Data'
      };
      
      await this.logActivity('school_district_info_generated', 'School district information generated', { propertyId });
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'getSchoolDistrictInfo',
        result
      };
    } catch (error: any) {
      await this.logActivity('school_district_info_error', `Error getting school district information: ${error.message}`);
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'getSchoolDistrictInfo',
        error: `Failed to get school district information: ${error.message}`
      };
    }
  }
  
  /**
   * Get tax district information for a property
   */
  private async getTaxDistrictInfo(params: any): Promise<any> {
    try {
      const { propertyId } = params;
      
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' };
      }
      
      // Get the property to extract the parcel number
      const property = await this.executeMCPTool('property.getByPropertyId', { propertyId });
      
      if (!property?.success || !property.result) {
        return { success: false, error: 'Property not found' };
      }
      
      const parcelNumber = property.result.parcelNumber;
      
      // Get tax district information
      const taxDistrictResult = await this.executeMCPTool('gis.getTaxDistrict', { parcelId: parcelNumber });
      
      if (!taxDistrictResult?.success) {
        return { success: false, error: 'Failed to get tax district information' };
      }
      
      // Get property value for context
      const propertyValue = property.result.value || 0;
      
      // Calculate estimated taxes
      const districts = taxDistrictResult.result;
      let totalTaxRate = 0;
      
      for (const district of districts) {
        totalTaxRate += district.taxRate || 0;
      }
      
      const estimatedAnnualTax = Math.round(propertyValue * (totalTaxRate / 1000));
      
      // Generate the analysis result
      const result = {
        propertyId,
        address: property.result.address,
        taxDistricts: districts,
        taxAnalysis: {
          totalTaxRate: totalTaxRate,
          estimatedAnnualTax: estimatedAnnualTax,
          taxRateUnits: 'per $1,000 assessed value',
          breakdown: districts.map((district: any) => ({
            districtName: district.name,
            taxRate: district.taxRate || 0,
            estimatedTax: Math.round(propertyValue * ((district.taxRate || 0) / 1000)),
            percentage: district.taxRate ? Math.round((district.taxRate / totalTaxRate) * 100) : 0
          }))
        },
        source: 'Benton County ArcGIS Tax District Data'
      };
      
      await this.logActivity('tax_district_info_generated', 'Tax district information generated', { propertyId });
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'getTaxDistrictInfo',
        result
      };
    } catch (error: any) {
      await this.logActivity('tax_district_info_error', `Error getting tax district information: ${error.message}`);
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'getTaxDistrictInfo',
        error: `Failed to get tax district information: ${error.message}`
      };
    }
  }
  
  /**
   * Perform a multi-layer spatial analysis for a property
   */
  private async getMultiLayerAnalysis(params: any): Promise<any> {
    try {
      const { propertyId, options = {} } = params;
      
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' };
      }
      
      // Default to including all layers if not specified
      const analysisOptions: SpatialAnalysisOptions = {
        includeNeighbors: options.includeNeighbors !== false,
        includeFloodZones: options.includeFloodZones !== false,
        includeWetlands: options.includeWetlands !== false,
        includeSchoolDistricts: options.includeSchoolDistricts !== false,
        includeTaxDistricts: options.includeTaxDistricts !== false,
        includeZoning: options.includeZoning !== false,
        ...options
      };
      
      // Get the property to extract the parcel number
      const property = await this.executeMCPTool('property.getByPropertyId', { propertyId });
      
      if (!property?.success || !property.result) {
        return { success: false, error: 'Property not found' };
      }
      
      const parcelNumber = property.result.parcelNumber;
      
      // Initialize result object
      const analysisResult: any = {
        propertyId,
        address: property.result.address,
        parcelNumber,
        propertyType: property.result.propertyType,
        acres: property.result.acres,
        value: property.result.value,
        layers: {}
      };
      
      // Add base spatial info
      const spatialInfo = await this.getSpatialInfo({ propertyId });
      if (spatialInfo.success) {
        analysisResult.spatialInfo = spatialInfo.result;
      }
      
      // Add selected layers based on options
      if (analysisOptions.includeNeighbors) {
        const neighbors = await this.executeMCPTool('gis.getNeighboringParcels', { parcelId: parcelNumber });
        if (neighbors?.success) {
          analysisResult.layers.neighbors = {
            count: neighbors.result.length,
            properties: neighbors.result.map((parcel: any) => 
              this.arcgisService.convertToProperty(parcel)
            ).filter(Boolean)
          };
        }
      }
      
      if (analysisOptions.includeFloodZones) {
        const floodInfo = await this.executeMCPTool('gis.getFloodZone', { parcelId: parcelNumber });
        if (floodInfo?.success) {
          analysisResult.layers.floodZones = floodInfo.result;
        }
      }
      
      if (analysisOptions.includeWetlands) {
        const wetlandsInfo = await this.executeMCPTool('gis.getWetlands', { parcelId: parcelNumber });
        if (wetlandsInfo?.success) {
          analysisResult.layers.wetlands = wetlandsInfo.result;
        }
      }
      
      if (analysisOptions.includeSchoolDistricts) {
        const schoolDistrictInfo = await this.executeMCPTool('gis.getSchoolDistrict', { parcelId: parcelNumber });
        if (schoolDistrictInfo?.success) {
          analysisResult.layers.schoolDistricts = schoolDistrictInfo.result;
        }
      }
      
      if (analysisOptions.includeTaxDistricts) {
        const taxDistrictInfo = await this.executeMCPTool('gis.getTaxDistrict', { parcelId: parcelNumber });
        if (taxDistrictInfo?.success) {
          analysisResult.layers.taxDistricts = taxDistrictInfo.result;
        }
      }
      
      if (analysisOptions.includeZoning && property.result?.extraFields?.zoning) {
        const zoningInfo = await this.executeMCPTool('gis.getZoningDetails', { 
          zoneCode: property.result.extraFields.zoning 
        });
        if (zoningInfo?.success) {
          analysisResult.layers.zoning = zoningInfo.result;
        }
      }
      
      // Generate summary with key findings
      analysisResult.summary = this.generateMultiLayerSummary(analysisResult);
      
      await this.logActivity('multi_layer_analysis_generated', 'Multi-layer spatial analysis generated', { propertyId });
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'getMultiLayerAnalysis',
        result: analysisResult
      };
    } catch (error: any) {
      await this.logActivity('multi_layer_analysis_error', `Error generating multi-layer analysis: ${error.message}`);
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'getMultiLayerAnalysis',
        error: `Failed to generate multi-layer analysis: ${error.message}`
      };
    }
  }
  
  /**
   * Generate summary for multi-layer analysis
   */
  private generateMultiLayerSummary(analysisResult: any): any {
    const keyFindings = [];
    const recommendations = [];
    
    // Add flood zone findings
    if (analysisResult.layers.floodZones) {
      const { inFloodZone, zones } = analysisResult.layers.floodZones;
      if (inFloodZone) {
        keyFindings.push(`Property is located in a flood zone (${zones.map((z: any) => z.zone).join(', ')})`);
        recommendations.push('Consider flood insurance and mitigation measures');
      } else {
        keyFindings.push('Property is not in a designated flood zone');
      }
    }
    
    // Add wetlands findings
    if (analysisResult.layers.wetlands) {
      const { hasWetlands, wetlands } = analysisResult.layers.wetlands;
      if (hasWetlands) {
        keyFindings.push(`Property contains ${wetlands.length} wetland area(s)`);
        recommendations.push('Consider wetland conservation requirements for any development');
      }
    }
    
    // Add school district findings
    if (analysisResult.layers.schoolDistricts) {
      const districts = analysisResult.layers.schoolDistricts;
      keyFindings.push(`Property is in ${districts.map((d: any) => d.name).join(', ')} school district(s)`);
    }
    
    // Add tax district findings
    if (analysisResult.layers.taxDistricts) {
      const districts = analysisResult.layers.taxDistricts;
      let totalRate = 0;
      districts.forEach((d: any) => { totalRate += d.taxRate || 0; });
      keyFindings.push(`Property is subject to a ${totalRate.toFixed(2)} tax rate across ${districts.length} tax district(s)`);
    }
    
    // Add zoning findings
    if (analysisResult.layers.zoning) {
      const zoning = analysisResult.layers.zoning;
      keyFindings.push(`Property is zoned ${zoning.code} (${zoning.name})`);
      if (zoning.permittedUses && zoning.permittedUses.length > 0) {
        recommendations.push(`Consider permitted uses for this zone: ${zoning.permittedUses.slice(0, 3).join(', ')}${zoning.permittedUses.length > 3 ? '...' : ''}`);
      }
    }
    
    // Add neighbor findings
    if (analysisResult.layers.neighbors) {
      const { count, properties } = analysisResult.layers.neighbors;
      if (count > 0) {
        keyFindings.push(`Property has ${count} neighboring properties`);
        const avgValue = properties.reduce((sum: number, p: any) => sum + (p.value || 0), 0) / properties.length;
        keyFindings.push(`Average neighboring property value: $${Math.round(avgValue).toLocaleString()}`);
      }
    }
    
    // Return the summary
    return {
      keyFindings,
      recommendations
    };
  }
  
  /**
   * Get spatial information for a property
   */
  private async getSpatialInfo(params: any): Promise<any> {
    try {
      const { propertyId } = params;
      
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' };
      }
      
      // Get the property to extract the parcel number
      const property = await this.executeMCPTool('property.getByPropertyId', { propertyId });
      
      if (!property?.success || !property.result) {
        return { success: false, error: 'Property not found' };
      }
      
      const parcelNumber = property.result.parcelNumber;
      
      // Get GIS parcel information
      const parcel = await this.executeMCPTool('gis.getParcel', { parcelId: parcelNumber });
      
      if (!parcel?.success || !parcel.result) {
        return { success: false, error: 'GIS parcel information not found' };
      }
      
      // Convert parcel to a simplified format with relevant spatial information
      const spatialInfo = {
        propertyId,
        parcelId: parcelNumber,
        address: property.result.address,
        coordinates: this.extractCoordinates(parcel.result),
        area: {
          acres: parcel.result.attributes.ACRES || property.result.acres,
          squareFeet: (parcel.result.attributes.ACRES || property.result.acres) * 43560
        },
        zoning: parcel.result.attributes.ZONING || 'Unknown',
        shape: {
          type: 'Polygon',
          rings: parcel.result.geometry?.rings || []
        }
      };
      
      await this.logActivity('spatial_info_generated', 'Spatial information generated', { propertyId });
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'getSpatialInfo',
        result: spatialInfo
      };
    } catch (error: any) {
      await this.logActivity('spatial_info_error', `Error generating spatial information: ${error.message}`);
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'getSpatialInfo',
        error: `Failed to get spatial information: ${error.message}`
      };
    }
  }
  
  /**
   * Generate a neighborhood map and analysis for a property
   */
  private async getNeighborhoodMap(params: any): Promise<any> {
    try {
      const { propertyId, options = {} } = params;
      
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' };
      }
      
      // Get the property to extract the parcel number
      const property = await this.executeMCPTool('property.getByPropertyId', { propertyId });
      
      if (!property?.success || !property.result) {
        return { success: false, error: 'Property not found' };
      }
      
      const parcelNumber = property.result.parcelNumber;
      
      // Get neighboring parcels
      const neighbors = await this.executeMCPTool('gis.getNeighboringParcels', { parcelId: parcelNumber });
      
      if (!neighbors?.success) {
        return { success: false, error: 'Failed to get neighboring parcels' };
      }
      
      // Convert neighboring parcels to properties
      const neighboringProperties = neighbors.result.map((parcel: any) => 
        this.arcgisService.convertToProperty(parcel)
      ).filter(Boolean);
      
      // Get market factors for context
      const marketFactors = await this.marketFactorService.getPropertyMarketFactors(propertyId);
      const marketImpact = this.marketFactorService.calculateMarketFactorImpact(marketFactors);
      
      // Analyze neighborhood characteristics
      const neighborhoodAnalysis = this.analyzeNeighborhood(property.result, neighboringProperties);
      
      // Create map bounds that include the property and all neighbors
      const mapBounds = this.calculateMapBounds([property.result, ...neighboringProperties]);
      
      // Generate result
      const result = {
        propertyId,
        address: property.result.address,
        neighborhood: {
          name: this.deriveNeighborhoodName(property.result.address),
          properties: neighboringProperties.length,
          medianValue: neighborhoodAnalysis.medianValue,
          valueRange: neighborhoodAnalysis.valueRange,
          predominantPropertyType: neighborhoodAnalysis.predominantPropertyType,
          averageYearBuilt: neighborhoodAnalysis.averageYearBuilt
        },
        market: {
          outlook: marketImpact.marketOutlook,
          keyFactors: marketImpact.dominantFactors.map(f => f.name)
        },
        map: {
          centroid: this.calculateCentroid(property.result),
          bounds: mapBounds,
          zoomLevel: 17
        }
      };
      
      await this.logActivity('neighborhood_map_generated', 'Neighborhood map generated', { propertyId });
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'getNeighborhoodMap',
        result
      };
    } catch (error: any) {
      await this.logActivity('neighborhood_map_error', `Error generating neighborhood map: ${error.message}`);
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'getNeighborhoodMap',
        error: `Failed to generate neighborhood map: ${error.message}`
      };
    }
  }
  
  /**
   * Search for properties by geographic location or proximity
   */
  private async searchByLocation(params: any): Promise<any> {
    try {
      const { 
        latitude, 
        longitude, 
        address, 
        radius = 1000, 
        maxResults = 20 
      } = params;
      
      // Search by coordinates if provided
      if (latitude && longitude) {
        // Search in a radius around the provided coordinates
        const results = await this.executeMCPTool('gis.searchParcels', {
          geometryType: 'esriGeometryPoint',
          geometry: `${longitude},${latitude}`,
          distance: radius.toString(),
          units: 'esriSRUnit_Meter',
          spatialRel: 'esriSpatialRelIntersects',
          maxRecordCount: maxResults
        });
        
        if (!results?.success) {
          return { success: false, error: 'Failed to search by coordinates' };
        }
        
        const properties = results.result
          .map((parcel: any) => this.arcgisService.convertToProperty(parcel))
          .filter(Boolean);
        
        return {
          success: true,
          agent: this.config.name,
          capability: 'searchByLocation',
          result: properties
        };
      }
      
      // Search by address if provided
      if (address) {
        const results = await this.executeMCPTool('gis.searchParcels', {
          address: address
        });
        
        if (!results?.success) {
          return { success: false, error: 'Failed to search by address' };
        }
        
        const properties = results.result
          .map((parcel: any) => this.arcgisService.convertToProperty(parcel))
          .filter(Boolean);
        
        return {
          success: true,
          agent: this.config.name,
          capability: 'searchByLocation',
          result: properties
        };
      }
      
      return { success: false, error: 'Either latitude/longitude or address is required' };
    } catch (error: any) {
      await this.logActivity('location_search_error', `Error searching by location: ${error.message}`);
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'searchByLocation',
        error: `Failed to search by location: ${error.message}`
      };
    }
  }
  
  /**
   * Analyze zoning information and land use for a property
   */
  private async analyzeZoning(params: any): Promise<any> {
    try {
      const { propertyId } = params;
      
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' };
      }
      
      // Get the property to extract the parcel number
      const property = await this.executeMCPTool('property.getByPropertyId', { propertyId });
      
      if (!property?.success || !property.result) {
        return { success: false, error: 'Property not found' };
      }
      
      const parcelNumber = property.result.parcelNumber;
      
      // Get GIS parcel information
      const parcel = await this.executeMCPTool('gis.getParcel', { parcelId: parcelNumber });
      
      if (!parcel?.success || !parcel.result) {
        return { success: false, error: 'GIS parcel information not found' };
      }
      
      const zoning = parcel.result.attributes.ZONING || property.result.extraFields?.zoning || 'Unknown';
      
      // Get zoning regulations and description
      const zoningInfo = this.getZoningInfo(zoning);
      
      // Get land use impacts from market factor service
      const marketFactors = await this.marketFactorService.getPropertyMarketFactors(propertyId);
      const landUseFactors = marketFactors.filter(f => 
        f.name.includes('Development') || 
        f.name.includes('Zoning') || 
        f.name.includes('Land')
      );
      
      // Generate result
      const result = {
        propertyId,
        address: property.result.address,
        zoning: {
          code: zoning,
          description: zoningInfo.description,
          allowedUses: zoningInfo.allowedUses,
          restrictions: zoningInfo.restrictions
        },
        landUse: {
          current: zoningInfo.currentUse,
          potential: zoningInfo.potentialUses,
          restrictions: zoningInfo.restrictions
        },
        marketFactors: landUseFactors
      };
      
      await this.logActivity('zoning_analysis_generated', 'Zoning analysis generated', { propertyId });
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'analyzeZoning',
        result
      };
    } catch (error: any) {
      await this.logActivity('zoning_analysis_error', `Error analyzing zoning: ${error.message}`);
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'analyzeZoning',
        error: `Failed to analyze zoning: ${error.message}`
      };
    }
  }
  
  /**
   * Generate a property value heatmap for an area
   */
  private async generateHeatmap(params: any): Promise<any> {
    try {
      const { 
        center, 
        zipCode,
        radius = 2000,
        valueType = 'assessed' // 'assessed', 'land', 'improvement', 'sqft_price'
      } = params;
      
      if (!center && !zipCode) {
        return { success: false, error: 'Either center coordinates or zipCode is required' };
      }
      
      let searchParams: any = {};
      
      // Search by center coordinates if provided
      if (center && center.latitude && center.longitude) {
        searchParams = {
          geometryType: 'esriGeometryPoint',
          geometry: `${center.longitude},${center.latitude}`,
          distance: radius.toString(),
          units: 'esriSRUnit_Meter',
          spatialRel: 'esriSpatialRelIntersects',
          maxRecordCount: 500
        };
      } 
      // Otherwise search by address with zipCode
      else if (zipCode) {
        searchParams = {
          address: zipCode
        };
      }
      
      // Execute search
      const results = await this.executeMCPTool('gis.searchParcels', searchParams);
      
      if (!results?.success) {
        return { success: false, error: 'Failed to search parcels for heatmap' };
      }
      
      // Convert to properties
      const properties = results.result
        .map((parcel: any) => this.arcgisService.convertToProperty(parcel))
        .filter(Boolean);
      
      // Create heatmap data points
      const heatmapData = properties.map(property => {
        // Determine value to use based on valueType
        let value = property.value; // Default to assessed value
        
        if (valueType === 'land' && property.extraFields?.landValue) {
          value = property.extraFields.landValue;
        } else if (valueType === 'improvement' && property.extraFields?.improvementValue) {
          value = property.extraFields.improvementValue;
        } else if (valueType === 'sqft_price' && property.extraFields?.squareFootage) {
          value = property.value / (property.extraFields.squareFootage || 1);
        }
        
        // Extract coordinates from property
        const coordinates = this.calculateCentroid(property);
        
        return {
          location: coordinates,
          value,
          propertyId: property.propertyId
        };
      });
      
      // Calculate map bounds
      const mapBounds = this.calculateMapBounds(properties);
      
      // Generate value ranges for legend
      const values = heatmapData.map(point => point.value);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const valueRange = maxValue - minValue;
      
      const colorRanges = [
        { min: minValue, max: minValue + valueRange * 0.2, color: '#00ff00' }, // Green
        { min: minValue + valueRange * 0.2, max: minValue + valueRange * 0.4, color: '#66ff33' }, // Light green
        { min: minValue + valueRange * 0.4, max: minValue + valueRange * 0.6, color: '#ffff00' }, // Yellow
        { min: minValue + valueRange * 0.6, max: minValue + valueRange * 0.8, color: '#ff9900' }, // Orange
        { min: minValue + valueRange * 0.8, max: maxValue, color: '#ff0000' }  // Red
      ];
      
      // Generate result
      const result = {
        valueType,
        dataPoints: heatmapData,
        mapBounds,
        legend: {
          title: this.getValueTypeLabel(valueType),
          ranges: colorRanges,
          minValue,
          maxValue
        },
        summary: {
          count: properties.length,
          averageValue: values.reduce((sum, val) => sum + val, 0) / values.length,
          medianValue: this.calculateMedian(values)
        }
      };
      
      await this.logActivity('heatmap_generated', 'Property value heatmap generated');
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'generateHeatmap',
        result
      };
    } catch (error: any) {
      await this.logActivity('heatmap_error', `Error generating heatmap: ${error.message}`);
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'generateHeatmap',
        error: `Failed to generate heatmap: ${error.message}`
      };
    }
  }
  
  // Helper functions
  
  /**
   * Extract coordinates from a parcel feature
   */
  private extractCoordinates(parcel: any): [number, number] | null {
    if (!parcel?.geometry?.rings || !parcel.geometry.rings.length) {
      return null;
    }
    
    return this.calculateCentroid(parcel);
  }
  
  /**
   * Calculate centroid of a property or parcel
   */
  private calculateCentroid(property: any): [number, number] {
    // If it's a parcel from ArcGIS with geometry.rings
    if (property?.geometry?.rings && property.geometry.rings.length > 0) {
      const ring = property.geometry.rings[0];
      let sumX = 0;
      let sumY = 0;
      
      ring.forEach((point: [number, number]) => {
        sumX += point[0];
        sumY += point[1];
      });
      
      return [sumX / ring.length, sumY / ring.length];
    }
    
    // If it's a property with a parsed address, try to extract coordinates
    // This is a very simplified implementation - in a real system, we would use a geocoding service
    if (property?.address) {
      const zipCode = property.address.match(/\d{5}(?:-\d{4})?/)?.[0] || '';
      
      // Default coordinates for common Benton County zip codes
      const zipCodeCoordinates: { [key: string]: [number, number] } = {
        '99336': [-119.1678, 46.2087], // Kennewick
        '99352': [-119.2846, 46.2779], // Richland
        '99323': [-118.6756, 46.0514], // Benton City
        '99320': [-119.2710, 46.2263], // Prosser
        '99337': [-119.1375, 46.1771]  // South Kennewick
      };
      
      if (zipCode && zipCodeCoordinates[zipCode]) {
        return zipCodeCoordinates[zipCode];
      }
    }
    
    // Default to center of Benton County if we can't determine coordinates
    return [-119.1678, 46.2087]; // Central Kennewick coordinates
  }
  
  /**
   * Calculate map bounds that include all properties
   */
  private calculateMapBounds(properties: any[]): {
    southwest: [number, number];
    northeast: [number, number];
  } {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    
    properties.forEach(property => {
      const coords = this.calculateCentroid(property);
      minLng = Math.min(minLng, coords[0]);
      maxLng = Math.max(maxLng, coords[0]);
      minLat = Math.min(minLat, coords[1]);
      maxLat = Math.max(maxLat, coords[1]);
    });
    
    // Add padding to bounds
    const padding = 0.01; // about 1km
    
    return {
      southwest: [minLng - padding, minLat - padding],
      northeast: [maxLng + padding, maxLat + padding]
    };
  }
  
  /**
   * Analyze neighborhood characteristics
   */
  private analyzeNeighborhood(property: any, neighbors: any[]): {
    medianValue: number;
    valueRange: { min: number; max: number };
    predominantPropertyType: string;
    averageYearBuilt: number;
  } {
    // Calculate median property value
    const values = neighbors.map(n => n.value);
    const medianValue = this.calculateMedian(values);
    
    // Calculate value range
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    // Determine predominant property type
    const propertyTypes: { [key: string]: number } = {};
    neighbors.forEach(n => {
      const type = n.propertyType || 'Unknown';
      propertyTypes[type] = (propertyTypes[type] || 0) + 1;
    });
    
    let predominantPropertyType = 'Unknown';
    let maxCount = 0;
    
    Object.entries(propertyTypes).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        predominantPropertyType = type;
      }
    });
    
    // Calculate average year built
    const yearsBuilt = neighbors
      .map(n => n.extraFields?.yearBuilt)
      .filter(Boolean) as number[];
    
    const averageYearBuilt = yearsBuilt.length > 0 
      ? Math.round(yearsBuilt.reduce((sum, year) => sum + year, 0) / yearsBuilt.length)
      : 0;
    
    return {
      medianValue,
      valueRange: { min: minValue, max: maxValue },
      predominantPropertyType,
      averageYearBuilt
    };
  }
  
  /**
   * Calculate median of a numeric array
   */
  private calculateMedian(values: number[]): number {
    if (!values.length) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    
    return sorted[middle];
  }
  
  /**
   * Derive neighborhood name from an address
   */
  private deriveNeighborhoodName(address: string): string {
    // Extract city if available
    const cityMatch = address.match(/([^,]+),\s*WA/i);
    const city = cityMatch ? cityMatch[1].trim() : 'Benton County';
    
    // Simple mapping for common Benton County cities to neighborhoods
    const neighborhoodMap: { [key: string]: string[] } = {
      'Kennewick': ['Downtown Kennewick', 'South Kennewick', 'East Kennewick', 'Southridge', 'Canyon Lakes'],
      'Richland': ['Downtown Richland', 'North Richland', 'South Richland', 'Horn Rapids', 'Badger Mountain'],
      'West Richland': ['Benton City', 'Red Mountain', 'West Richland Heights'],
      'Prosser': ['Downtown Prosser', 'Wine Country', 'Prosser Heights'],
      'Benton City': ['Downtown Benton City', 'Red Mountain']
    };
    
    // If we have neighborhoods for this city, choose one based on the hash of the address
    if (neighborhoodMap[city]) {
      const neighborhoods = neighborhoodMap[city];
      // Use a simple hash of the address to consistently pick a neighborhood
      const hashCode = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const index = hashCode % neighborhoods.length;
      return neighborhoods[index];
    }
    
    // Default
    return `${city} Area`;
  }
  
  /**
   * Get zoning information for a zoning code
   */
  private getZoningInfo(zoning: string): {
    description: string;
    allowedUses: string[];
    currentUse: string;
    potentialUses: string[];
    restrictions: string[];
  } {
    // Benton County zoning information
    const zoningInfo: { [key: string]: any } = {
      'R-1': {
        description: 'Single-Family Residential District',
        allowedUses: ['Single Family Homes', 'Accessory Dwellings', 'Parks', 'Schools', 'Religious Institutions'],
        currentUse: 'Single Family Residential',
        potentialUses: ['Accessory Dwelling Unit', 'Home Office', 'Guest House'],
        restrictions: ['Minimum lot size of 7,500 sq ft', 'Maximum height of 35 feet', 'Minimum setbacks: 20 ft front, 5 ft side, 20 ft rear']
      },
      'R-2': {
        description: 'Medium Density Residential District',
        allowedUses: ['Single Family Homes', 'Duplexes', 'Townhouses', 'Parks', 'Schools'],
        currentUse: 'Medium Density Residential',
        potentialUses: ['Duplex', 'Townhouse', 'ADU', 'Small Multi-Family'],
        restrictions: ['Minimum lot size of 5,000 sq ft', 'Maximum height of 35 feet', 'Minimum setbacks: 15 ft front, 5 ft side, 15 ft rear']
      },
      'R-3': {
        description: 'High Density Residential District',
        allowedUses: ['Apartments', 'Condominiums', 'Townhouses', 'Duplexes', 'Parks'],
        currentUse: 'Multi-Family Residential',
        potentialUses: ['Apartment Complex', 'Condominium Development', 'Senior Housing'],
        restrictions: ['Minimum lot size of 2,000 sq ft per unit', 'Maximum height of 45 feet', 'Minimum setbacks: 10 ft front, 5 ft side, 10 ft rear']
      },
      'C-1': {
        description: 'Neighborhood Commercial District',
        allowedUses: ['Retail Stores', 'Professional Offices', 'Personal Services', 'Restaurants', 'Banks'],
        currentUse: 'Neighborhood Commercial',
        potentialUses: ['Small Retail', 'Office Space', 'Restaurant', 'Mixed Use'],
        restrictions: ['Maximum floor area ratio of 0.5', 'Maximum height of 30 feet', 'Minimum setbacks: 10 ft front, 5 ft side, 10 ft rear']
      },
      'C-2': {
        description: 'General Commercial District',
        allowedUses: ['Retail Stores', 'Shopping Centers', 'Hotels', 'Restaurants', 'Entertainment Venues'],
        currentUse: 'General Commercial',
        potentialUses: ['Retail Center', 'Office Complex', 'Hotel/Motel', 'Entertainment Venue'],
        restrictions: ['Maximum floor area ratio of 1.0', 'Maximum height of 45 feet', 'Minimum setbacks: 5 ft front, 0 ft side, 10 ft rear']
      },
      'I-1': {
        description: 'Light Industrial District',
        allowedUses: ['Manufacturing', 'Warehousing', 'Research Facilities', 'Distribution Centers'],
        currentUse: 'Light Industrial',
        potentialUses: ['Light Manufacturing', 'Warehouse', 'Research & Development', 'Self-Storage'],
        restrictions: ['Maximum floor area ratio of 0.75', 'Maximum height of 50 feet', 'Minimum setbacks: 20 ft front, 10 ft side, 20 ft rear']
      },
      'I-2': {
        description: 'Heavy Industrial District',
        allowedUses: ['Manufacturing', 'Processing', 'Storage', 'Distribution', 'Utilities'],
        currentUse: 'Heavy Industrial',
        potentialUses: ['Manufacturing', 'Processing Facility', 'Logistics Center'],
        restrictions: ['Maximum floor area ratio of 1.0', 'Maximum height of 75 feet', 'Minimum setbacks: 30 ft front, 15 ft side, 30 ft rear']
      },
      'A-1': {
        description: 'Agricultural District',
        allowedUses: ['Farming', 'Ranching', 'Wineries', 'Single Family Homes', 'Agricultural Support Services'],
        currentUse: 'Agricultural',
        potentialUses: ['Farm', 'Ranch', 'Winery', 'Orchard', 'Agricultural Tourism'],
        restrictions: ['Minimum lot size of 5 acres', 'Maximum height of 35 feet for residences', 'Minimum setbacks: 50 ft front, 20 ft side, 50 ft rear']
      }
    };
    
    // Return zoning info if available, or a default
    return zoningInfo[zoning] || {
      description: 'Unknown Zoning Classification',
      allowedUses: ['Verify with Benton County Planning Department'],
      currentUse: 'Unknown',
      potentialUses: ['Verify with Benton County Planning Department'],
      restrictions: ['Verify with Benton County Planning Department']
    };
  }
  
  /**
   * Get label for value type
   */
  private getValueTypeLabel(valueType: string): string {
    const labels: { [key: string]: string } = {
      'assessed': 'Assessed Value',
      'land': 'Land Value',
      'improvement': 'Improvement Value',
      'sqft_price': 'Price per Square Foot'
    };
    
    return labels[valueType] || 'Property Value';
  }
}

// Don't export a default instance - we'll create it in the agent system