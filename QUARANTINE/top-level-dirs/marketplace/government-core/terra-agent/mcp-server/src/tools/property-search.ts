/**
 * Property Search Tool for TerraAgent MCP Server
 * Comprehensive property search with advanced filtering capabilities
 */

import { MCPTool, ToolExecutionContext, CacheConfig } from '../types/mcp-types';
import { JSONSchema7 } from 'json-schema';

export class PropertySearchTool implements MCPTool {
  public readonly name = 'property-search';
  public readonly description = 'Search for properties using various criteria including address, location, characteristics, and market filters';
  
  public readonly inputSchema: JSONSchema7 = {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Property address (partial matches supported)',
      },
      parcelId: {
        type: 'string',
        description: 'Specific parcel identification number',
      },
      location: {
        type: 'object',
        properties: {
          boundingBox: {
            type: 'object',
            properties: {
              northEast: {
                type: 'object',
                properties: {
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                },
                required: ['latitude', 'longitude'],
              },
              southWest: {
                type: 'object',
                properties: {
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                },
                required: ['latitude', 'longitude'],
              },
            },
            required: ['northEast', 'southWest'],
          },
          radius: {
            type: 'object',
            properties: {
              center: {
                type: 'object',
                properties: {
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                },
                required: ['latitude', 'longitude'],
              },
              radiusMiles: {
                type: 'number',
                minimum: 0.1,
                maximum: 50,
              },
            },
            required: ['center', 'radiusMiles'],
          },
          zipCodes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of ZIP codes to search within',
          },
          municipalities: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of municipalities to search within',
          },
        },
      },
      filters: {
        type: 'object',
        properties: {
          propertyTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['residential', 'commercial', 'industrial', 'agricultural', 'vacant_land', 'mixed_use', 'other'],
            },
          },
          priceRange: {
            type: 'object',
            properties: {
              min: { type: 'number', minimum: 0 },
              max: { type: 'number', minimum: 0 },
            },
          },
          squareFootageRange: {
            type: 'object',
            properties: {
              min: { type: 'number', minimum: 0 },
              max: { type: 'number', minimum: 0 },
            },
          },
          yearBuiltRange: {
            type: 'object',
            properties: {
              min: { type: 'number', minimum: 1800 },
              max: { type: 'number', maximum: new Date().getFullYear() },
            },
          },
          bedrooms: {
            type: 'object',
            properties: {
              min: { type: 'number', minimum: 0 },
              max: { type: 'number', minimum: 0 },
            },
          },
          bathrooms: {
            type: 'object',
            properties: {
              min: { type: 'number', minimum: 0 },
              max: { type: 'number', minimum: 0 },
            },
          },
        },
      },
      pagination: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
        },
      },
      sort: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              enum: ['address', 'price', 'squareFootage', 'yearBuilt', 'assessedValue', 'lastSaleDate'],
            },
            direction: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'asc',
            },
          },
          required: ['field'],
        },
      },
      includeDetails: {
        type: 'boolean',
        default: false,
        description: 'Include detailed property information in results',
      },
    },
    anyOf: [
      { required: ['address'] },
      { required: ['parcelId'] },
      { required: ['location'] },
      { required: ['filters'] },
    ],
  };

  public readonly cacheConfig: CacheConfig = {
    ttlSeconds: 300, // 5 minutes
    enabled: true,
    tags: ['property-search', 'property-data'],
  };

  public async execute(args: any, context: ToolExecutionContext): Promise<any> {
    context.logger.info(`Executing property search with criteria`, args);

    try {
      // Build search parameters
      const searchParams = this.buildSearchParameters(args);
      
      // Execute search against backend API
      const searchResults = await this.performSearch(searchParams, context);
      
      // Process and enrich results
      const processedResults = await this.processSearchResults(searchResults, args, context);
      
      context.logger.info(`Property search completed`, {
        totalResults: processedResults.pagination.total,
        returnedResults: processedResults.items.length,
      });

      return {
        success: true,
        results: processedResults.items,
        pagination: processedResults.pagination,
        searchCriteria: searchParams,
        executionTime: Date.now() - context.timestamp.getTime(),
      };

    } catch (error) {
      context.logger.error(`Property search failed`, error);
      throw new Error(`Property search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSearchParameters(args: any): any {
    const params: any = {};

    // Address search
    if (args.address) {
      params.address = args.address;
    }

    // Parcel ID search
    if (args.parcelId) {
      params.parcelId = args.parcelId;
    }

    // Location-based search
    if (args.location) {
      if (args.location.boundingBox) {
        params.boundingBox = args.location.boundingBox;
      }
      if (args.location.radius) {
        params.radius = args.location.radius;
      }
      if (args.location.zipCodes) {
        params.zipCodes = args.location.zipCodes;
      }
      if (args.location.municipalities) {
        params.municipalities = args.location.municipalities;
      }
    }

    // Filters
    if (args.filters) {
      params.filters = args.filters;
    }

    // Pagination
    params.pagination = {
      page: args.pagination?.page || 1,
      limit: Math.min(args.pagination?.limit || 20, 100),
    };

    // Sorting
    if (args.sort && args.sort.length > 0) {
      params.sort = args.sort;
    }

    // Include details flag
    params.includeDetails = args.includeDetails || false;

    return params;
  }

  private async performSearch(searchParams: any, context: ToolExecutionContext): Promise<any> {
    // Simulate API call to backend service
    // In real implementation, this would call the TerraAgent backend API
    
    const mockResults = {
      items: [
        {
          id: 'prop_001',
          parcelId: 'R123456789',
          address: {
            street: '123 Main St',
            city: 'Benton City',
            state: 'WA',
            zipCode: '99320',
            county: 'Benton',
            fullAddress: '123 Main St, Benton City, WA 99320',
          },
          characteristics: {
            propertyType: 'residential',
            landUse: 'Single Family Residential',
            yearBuilt: 1995,
            squareFootage: 2400,
            lotSize: 0.25,
            bedrooms: 4,
            bathrooms: 2.5,
            stories: 2,
            condition: 'good',
          },
          location: {
            latitude: 46.2632,
            longitude: -119.4894,
            zoning: 'R-1',
            schoolDistrict: 'Kiona-Benton School District',
          },
          assessment: {
            assessmentYear: 2024,
            totalValue: 425000,
            landValue: 125000,
            improvementValue: 300000,
          },
          lastSale: {
            saleDate: new Date('2023-06-15'),
            salePrice: await DynamicPropertyService.GetPropertyCountAsync(countyCode)0,
            pricePerSqFt: 187.50,
          },
        },
        {
          id: 'prop_002',
          parcelId: 'R123456790',
          address: {
            street: '456 Oak Ave',
            city: 'Richland',
            state: 'WA',
            zipCode: '99352',
            county: 'Benton',
            fullAddress: '456 Oak Ave, Richland, WA 99352',
          },
          characteristics: {
            propertyType: 'residential',
            landUse: 'Single Family Residential',
            yearBuilt: 2010,
            squareFootage: 3200,
            lotSize: 0.35,
            bedrooms: 5,
            bathrooms: 3,
            stories: 2,
            condition: 'excellent',
          },
          location: {
            latitude: 46.2857,
            longitude: -119.2844,
            zoning: 'R-1',
            schoolDistrict: 'Richland School District',
          },
          assessment: {
            assessmentYear: 2024,
            totalValue: 675000,
            landValue: 175000,
            improvementValue: 500000,
          },
          lastSale: {
            saleDate: new Date('2022-09-20'),
            salePrice: 650000,
            pricePerSqFt: 203.13,
          },
        },
      ],
      pagination: {
        page: searchParams.pagination.page,
        limit: searchParams.pagination.limit,
        total: 2,
        pages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };

    // Apply filters (simplified for mock)
    let filteredItems = mockResults.items;

    if (searchParams.filters?.propertyTypes) {
      filteredItems = filteredItems.filter(item => 
        searchParams.filters.propertyTypes.includes(item.characteristics.propertyType)
      );
    }

    if (searchParams.filters?.priceRange) {
      const { min, max } = searchParams.filters.priceRange;
      filteredItems = filteredItems.filter(item => {
        const price = item.lastSale?.salePrice || item.assessment?.totalValue || 0;
        return (!min || price >= min) && (!max || price <= max);
      });
    }

    // Update pagination
    mockResults.items = filteredItems;
    mockResults.pagination.total = filteredItems.length;

    context.logger.debug(`Search performed`, {
      searchParams,
      resultCount: mockResults.items.length,
    });

    return mockResults;
  }

  private async processSearchResults(results: any, args: any, context: ToolExecutionContext): Promise<any> {
    // Add computed fields and enrich data
    for (const item of results.items) {
      // Calculate price per square foot if not available
      if (!item.lastSale?.pricePerSqFt && item.lastSale?.salePrice && item.characteristics?.squareFootage) {
        item.lastSale.pricePerSqFt = item.lastSale.salePrice / item.characteristics.squareFootage;
      }

      // Add market indicators
      item.marketIndicators = this.calculateMarketIndicators(item);

      // Add detailed information if requested
      if (args.includeDetails) {
        item.detailedInfo = await this.getDetailedPropertyInfo(item.id, context);
      }
    }

    return results;
  }

  private calculateMarketIndicators(property: any): any {
    const indicators: any = {};

    // Price trend indicator (simplified)
    if (property.lastSale && property.assessment) {
      const salePrice = property.lastSale.salePrice;
      const assessedValue = property.assessment.totalValue;
      const ratio = salePrice / assessedValue;
      
      if (ratio > 1.1) {
        indicators.priceTrend = 'above_market';
      } else if (ratio < 0.9) {
        indicators.priceTrend = 'below_market';
      } else {
        indicators.priceTrend = 'at_market';
      }
    }

    // Age category
    if (property.characteristics?.yearBuilt) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - property.characteristics.yearBuilt;
      
      if (age <= 5) {
        indicators.ageCategory = 'new';
      } else if (age <= 15) {
        indicators.ageCategory = 'recent';
      } else if (age <= 30) {
        indicators.ageCategory = 'established';
      } else {
        indicators.ageCategory = 'mature';
      }
    }

    return indicators;
  }

  private async getDetailedPropertyInfo(propertyId: string, context: ToolExecutionContext): Promise<any> {
    // Simulate fetching detailed property information
    context.logger.debug(`Fetching detailed info for property ${propertyId}`);
    
    return {
      taxHistory: [
        { year: 2024, amount: 8500 },
        { year: 2023, amount: 8200 },
        { year: 2022, amount: 7800 },
      ],
      permits: [
        {
          date: new Date('2023-03-15'),
          type: 'Electrical',
          description: 'Panel upgrade',
          value: 2500,
        },
      ],
      utilities: {
        electricity: 'Available',
        gas: 'Available',
        water: 'City',
        sewer: 'City',
        internet: 'Fiber available',
      },
      nearby: {
        schools: ['Benton Elementary', 'Desert Hills Middle School'],
        shopping: ['Columbia Center Mall'],
        medical: ['Kadlec Regional Medical Center'],
      },
    };
  }
}
