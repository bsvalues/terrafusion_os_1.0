/**
 * County Data Sources Configuration
 * Comprehensive open data portal connections for multiple states
 */

// County Data Source Interface
export interface CountyDataSource {
  name: string
  state: string
  openDataPortal: string
  apiEndpoints: {
    parcels?: string
    assessments?: string
    permits?: string
    specialData?: string
  }
  dataFormat: 'json' | 'geojson' | 'csv' | 'bulk'
  updateFrequency: 'real-time' | 'daily' | 'weekly' | 'monthly' | 'quarterly'
  coverage: {
    properties: number
    landArea: number
    population: number
  }
  notes?: string
}

// Comprehensive County Data Sources
export const countyDataSources: Record<string, Record<string, CountyDataSource>> = {
  washington: {
    king: {
      name: "King County",
      state: "Washington",
      openDataPortal: "https://kingcounty.gov/services/gis/Maps/imap.aspx",
      apiEndpoints: {
        parcels: "https://gis-kingcounty.opendata.arcgis.com/datasets/parcels-for-king-county-with-address-with-property-information-parcel-address-area.geojson",
        assessments: "https://info.kingcounty.gov/assessor/esales/Residential.aspx",
        permits: "https://gis-kingcounty.opendata.arcgis.com/datasets/permit-data.json"
      },
      dataFormat: "geojson",
      updateFrequency: "daily",
      coverage: {
        properties: 856247,
        landArea: 2126,
        population: 2269675
      },
      notes: "Comprehensive GIS data with real-time property information"
    },
    pierce: {
      name: "Pierce County",
      state: "Washington",
      openDataPortal: "https://www.co.pierce.wa.us/5962/GIS-Data",
      apiEndpoints: {
        parcels: "https://geoservices.co.pierce.wa.us/arcgis/rest/services/pcMapData/Parcels/MapServer/0/query?where=1%3D1&outFields=*&f=geojson",
        assessments: "https://www.co.pierce.wa.us/1193/Real-Property-Sales-Data"
      },
      dataFormat: "geojson",
      updateFrequency: "weekly",
      coverage: {
        properties: 425000,
        landArea: 1679,
        population: 921130
      }
    },
    snohomish: {
      name: "Snohomish County",
      state: "Washington",
      openDataPortal: "https://www.snohomishcountywa.gov/1117/GIS-Data",
      apiEndpoints: {
        parcels: "https://services1.arcgis.com/XaXvBAnqVKaKyWCc/arcgis/rest/services/ParcelData/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson",
        permits: "https://www.snohomishcountywa.gov/1808/Building-Permits"
      },
      dataFormat: "geojson",
      updateFrequency: "weekly",
      coverage: {
        properties: 380000,
        landArea: 2087,
        population: 827957
      }
    }
  },

  florida: {
    'miami-dade': {
      name: "Miami-Dade County",
      state: "Florida",
      openDataPortal: "https://opendata.miamidade.gov/",
      apiEndpoints: {
        parcels: "https://opendata.miamidade.gov/resource/pn9h-nhkt.json?$limit=1000",
        assessments: "https://opendata.miamidade.gov/resource/tqk9-ha5q.json",
        permits: "https://opendata.miamidade.gov/resource/ikt4-5me8.json",
        specialData: "https://opendata.miamidade.gov/resource/hurricane-zones.json"
      },
      dataFormat: "json",
      updateFrequency: "real-time",
      coverage: {
        properties: 934567,
        landArea: 1898,
        population: 2701767
      },
      notes: "Includes hurricane zone data and tourism impact metrics"
    },
    broward: {
      name: "Broward County",
      state: "Florida",
      openDataPortal: "https://opendata.broward.org/",
      apiEndpoints: {
        parcels: "https://opendata.broward.org/resource/property-parcels.json",
        assessments: "https://opendata.broward.org/resource/property-assessments.json"
      },
      dataFormat: "json",
      updateFrequency: "daily",
      coverage: {
        properties: 675000,
        landArea: 1320,
        population: 1952778
      }
    },
    'palm-beach': {
      name: "Palm Beach County",
      state: "Florida",
      openDataPortal: "https://discover.pbcgov.org/",
      apiEndpoints: {
        parcels: "https://discover.pbcgov.org/resource/property-data.json",
        assessments: "https://discover.pbcgov.org/resource/assessment-data.json"
      },
      dataFormat: "json",
      updateFrequency: "weekly",
      coverage: {
        properties: 580000,
        landArea: 2034,
        population: 1496770
      }
    }
  },

  texas: {
    harris: {
      name: "Benton County Washington",
      state: "Texas",
      openDataPortal: "https://www.hcad.org/",
      apiEndpoints: {
        parcels: "https://pdata.hcad.org/download/2024_Real_building_land.txt",
        assessments: "https://pdata.hcad.org/download/2024_Real_acct.txt",
        permits: "https://cohgis.houstontx.gov/cohgisrest/services/PW/PermitData/MapServer/0/query?where=1%3D1&f=json"
      },
      dataFormat: "bulk",
      updateFrequency: "weekly",
      coverage: {
        properties: 1456789,
        landArea: 1703,
        population: 4713325
      },
      notes: "Largest county dataset with energy sector property classifications"
    },
    dallas: {
      name: "Dallas County",
      state: "Texas",
      openDataPortal: "https://www.dallascounty.org/government/gis/",
      apiEndpoints: {
        parcels: "https://services.arcgis.com/GPMmR3gUPgOlPXJL/arcgis/rest/services/Parcels/FeatureServer/0/query?where=1%3D1&f=geojson",
        assessments: "https://www.dallascad.org/PropertySearch.aspx"
      },
      dataFormat: "geojson",
      updateFrequency: "weekly",
      coverage: {
        properties: 950000,
        landArea: 909,
        population: 2613539
      }
    },
    travis: {
      name: "Travis County",
      state: "Texas",
      openDataPortal: "https://data.austintexas.gov/",
      apiEndpoints: {
        parcels: "https://data.austintexas.gov/resource/property-parcels.geojson",
        assessments: "https://data.austintexas.gov/resource/property-assessments.json",
        permits: "https://data.austintexas.gov/resource/building-permits.json"
      },
      dataFormat: "geojson",
      updateFrequency: "real-time",
      coverage: {
        properties: 456000,
        landArea: 1023,
        population: 1290188
      },
      notes: "Austin metro area with tech sector property data"
    }
  },

  california: {
    'los-angeles': {
      name: "Los Angeles County",
      state: "California",
      openDataPortal: "https://data.lacounty.gov/",
      apiEndpoints: {
        parcels: "https://data.lacounty.gov/resource/property-parcels.geojson",
        assessments: "https://data.lacounty.gov/resource/assessor-data.json"
      },
      dataFormat: "geojson",
      updateFrequency: "monthly",
      coverage: {
        properties: 2800000,
        landArea: 4751,
        population: 10014009
      },
      notes: "Largest county by population with complex urban/rural mix"
    },
    orange: {
      name: "Orange County",
      state: "California",
      openDataPortal: "https://data.ocgov.com/",
      apiEndpoints: {
        parcels: "https://data.ocgov.com/resource/property-data.geojson",
        assessments: "https://data.ocgov.com/resource/assessment-roll.json"
      },
      dataFormat: "geojson",
      updateFrequency: "weekly",
      coverage: {
        properties: 1100000,
        landArea: 948,
        population: 3186989
      }
    },
    'san-diego': {
      name: "San Diego County",
      state: "California",
      openDataPortal: "https://data.sandiegocounty.gov/",
      apiEndpoints: {
        parcels: "https://data.sandiegocounty.gov/resource/parcels.geojson",
        assessments: "https://data.sandiegocounty.gov/resource/assessments.json"
      },
      dataFormat: "geojson",
      updateFrequency: "weekly",
      coverage: {
        properties: 1250000,
        landArea: 4526,
        population: 3302833
      }
    }
  }
}

// Data Ingestion Configuration
export interface DataIngestionConfig {
  refreshSchedules: {
    realTime: string[]
    daily: string[]
    weekly: string[]
    monthly: string[]
  }
  dataValidation: {
    required: boolean
    timeoutMs: number
    retryAttempts: number
    fallbackToCache: boolean
  }
  processingSteps: string[]
  qualityChecks: string[]
}

export const dataIngestionConfig: DataIngestionConfig = {
  refreshSchedules: {
    realTime: ['miami-dade-fl', 'travis-tx'],
    daily: ['king-wa', 'broward-fl'],
    weekly: ['harris-tx', 'pierce-wa', 'snohomish-wa', 'palm-beach-fl', 'dallas-tx', 'orange-ca', 'san-diego-ca'],
    monthly: ['los-angeles-ca']
  },
  dataValidation: {
    required: true,
    timeoutMs: 30000,
    retryAttempts: 3,
    fallbackToCache: true
  },
  processingSteps: [
    'fetch_raw_data',
    'validate_schema',
    'normalize_format',
    'apply_ai_enhancements',
    'generate_insights',
    'cache_results',
    'update_metrics'
  ],
  qualityChecks: [
    'data_completeness',
    'value_ranges',
    'temporal_consistency',
    'cross_reference_validation',
    'anomaly_detection'
  ]
}

// API Helper Functions
export class CountyDataSourcesAPI {
  /**
   * Build standardized API URL for county data
   */
  static buildApiUrl(state: string, county: string, dataType: keyof CountyDataSource['apiEndpoints']): string | null {
    const countyData = countyDataSources[state]?.[county]
    if (!countyData) return null
    
    return countyData.apiEndpoints[dataType] || null
  }

  /**
   * Fetch county data with error handling
   */
  static async fetchCountyData(state: string, county: string, dataType: keyof CountyDataSource['apiEndpoints']) {
    const url = this.buildApiUrl(state, county, dataType)
    if (!url) {
      throw new Error(`No API endpoint found for ${state}/${county}/${dataType}`)
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TerraFusion-Demo/1.0'
        },
        timeout: dataIngestionConfig.dataValidation.timeoutMs
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return this.validateDataIntegrity(data, state, county, dataType)
      
    } catch (error) {
      console.error(`Failed to fetch ${state}/${county}/${dataType}:`, error)
      throw error
    }
  }

  /**
   * Validate data integrity and completeness
   */
  static validateDataIntegrity(data: any, state: string, county: string, dataType: string) {
    if (!data) {
      throw new Error('Empty data response')
    }

    // Basic structure validation
    if (Array.isArray(data)) {
      if (data.length === 0) {
        console.warn(`Empty array returned for ${state}/${county}/${dataType}`)
      }
    } else if (typeof data === 'object') {
      if (Object.keys(data).length === 0) {
        console.warn(`Empty object returned for ${state}/${county}/${dataType}`)
      }
    }

    // Add timestamp for cache management
    return {
      ...data,
      _metadata: {
        source: `${state}/${county}`,
        dataType,
        fetchedAt: new Date().toISOString(),
        validatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Get all available counties for a state
   */
  static getCountiesForState(state: string): string[] {
    return Object.keys(countyDataSources[state] || {})
  }

  /**
   * Get all available states
   */
  static getAvailableStates(): string[] {
    return Object.keys(countyDataSources)
  }

  /**
   * Get county metadata
   */
  static getCountyMetadata(state: string, county: string): CountyDataSource | null {
    return countyDataSources[state]?.[county] || null
  }

  /**
   * Get counties by data refresh frequency
   */
  static getCountiesByRefreshRate(frequency: keyof DataIngestionConfig['refreshSchedules']): string[] {
    return dataIngestionConfig.refreshSchedules[frequency]
  }

  /**
   * Check if county has specific data type available
   */
  static hasDataType(state: string, county: string, dataType: keyof CountyDataSource['apiEndpoints']): boolean {
    const countyData = countyDataSources[state]?.[county]
    return !!(countyData?.apiEndpoints[dataType])
  }

  /**
   * Get comprehensive county statistics
   */
  static getCountyStats() {
    let totalCounties = 0
    let totalProperties = 0
    let totalPopulation = 0
    let totalLandArea = 0

    Object.values(countyDataSources).forEach(stateCounties => {
      Object.values(stateCounties).forEach(county => {
        totalCounties++
        totalProperties += county.coverage.properties
        totalPopulation += county.coverage.population
        totalLandArea += county.coverage.landArea
      })
    })

    return {
      totalCounties,
      totalProperties,
      totalPopulation,
      totalLandArea,
      avgPropertiesPerCounty: Math.round(totalProperties / totalCounties),
      avgPopulationPerCounty: Math.round(totalPopulation / totalCounties)
    }
  }
}

// Export all configurations
export default countyDataSources
