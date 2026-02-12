import { BENTON_COUNTY_CONFIG } from './benton-county-config'

interface BentonCountyParcel {
  objectId: number
  parcelNumber: string
  ownerName: string
  situsAddress: string
  legalDescription: string
  assessedValue: number
  landValue: number
  improvementValue: number
  taxableValue: number
  propertyType: string
  acreage: number
  yearBuilt?: number
  squareFootage?: number
  bedrooms?: number
  bathrooms?: number
  lastSaleDate?: string
  lastSalePrice?: number
  taxingDistricts: string[]
  zoning: string
  geometry: any
}

export class BentonCountyService {
  private baseUrl = BENTON_COUNTY_CONFIG.gisServices.arcgisServer

  async fetchParcels(params: {
    extent?: number[]
    where?: string
    limit?: number
  } = {}): Promise<{ features: BentonCountyParcel[] }> {
    const { extent, where = '1=1', limit = 1000 } = params
    
    const queryParams = new URLSearchParams({
      f: 'json',
      outFields: '*',
      where,
      resultRecordCount: limit.toString(),
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects'
    })

    if (extent && extent.length === 4) {
      queryParams.append('geometry', extent.join(','))
      queryParams.append('geometryType', 'esriGeometryEnvelope')
    }

    try {
      const response = await fetch(`${BENTON_COUNTY_CONFIG.gisServices.parcelService}/query?${queryParams}`)
      
      if (!response.ok) {
        throw new Error(`ArcGIS service responded with status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(`ArcGIS Error: ${data.error.message}`)
      }

      return {
        features: data.features?.map(this.transformParcelData) || []
      }
    } catch (error) {
      console.error('Error fetching Benton County parcels:', error)
      return { features: [] }
    }
  }

  async fetchParcelByNumber(parcelNumber: string): Promise<BentonCountyParcel | null> {
    const result = await this.fetchParcels({
      where: `PARCEL_NUMBER = '${parcelNumber}'`,
      limit: 1
    })
    
    return result.features[0] || null
  }

  async fetchParcelsByOwner(ownerName: string): Promise<BentonCountyParcel[]> {
    const result = await this.fetchParcels({
      where: `OWNER_NAME LIKE '%${ownerName}%'`,
      limit: 100
    })
    
    return result.features
  }

  async fetchParcelsByAddress(address: string): Promise<BentonCountyParcel[]> {
    const result = await this.fetchParcels({
      where: `SITUS_ADDRESS LIKE '%${address}%'`,
      limit: 50
    })
    
    return result.features
  }

  async fetchTaxingDistricts(): Promise<Array<{
    name: string
    code: string
    taxRate: number
    description: string
  }>> {
    return BENTON_COUNTY_CONFIG.taxingDistricts.map(district => ({
      name: district,
      code: district.replace(/\s+/g, '_').toUpperCase(),
      taxRate: this.getEstimatedTaxRate(district),
      description: `${district} taxing authority`
    }))
  }

  async fetchCityBoundaries(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/CityLimits/FeatureServer/0/query?f=json&where=1=1&outFields=*&returnGeometry=true`)
      
      if (!response.ok) {
        throw new Error(`City boundaries service error: ${response.status}`)
      }

      const data = await response.json()
      return data.features || []
    } catch (error) {
      console.error('Error fetching city boundaries:', error)
      return []
    }
  }

  async fetchZoningData(extent?: number[]): Promise<any> {
    const queryParams = new URLSearchParams({
      f: 'json',
      outFields: '*',
      where: '1=1',
      returnGeometry: 'true'
    })

    if (extent && extent.length === 4) {
      queryParams.append('geometry', extent.join(','))
      queryParams.append('geometryType', 'esriGeometryEnvelope')
      queryParams.append('spatialRel', 'esriSpatialRelIntersects')
    }

    try {
      const response = await fetch(`${BENTON_COUNTY_CONFIG.gisServices.zoningService}/query?${queryParams}`)
      
      if (!response.ok) {
        throw new Error(`Zoning service error: ${response.status}`)
      }

      const data = await response.json()
      return data.features || []
    } catch (error) {
      console.error('Error fetching zoning data:', error)
      return []
    }
  }

  async getPropertyStatistics(): Promise<{
    totalParcels: number
    totalAssessedValue: number
    averageAssessedValue: number
    propertyTypeBreakdown: Record<string, number>
    cityBreakdown: Record<string, number>
  }> {
    try {
      const stats = await fetch(`${BENTON_COUNTY_CONFIG.gisServices.parcelService}/query?f=json&where=1=1&returnCountOnly=true`)
      const statsData = await stats.json()
      
      return {
        totalParcels: statsData.count || 0,
        totalAssessedValue: 0,
        averageAssessedValue: 0,
        propertyTypeBreakdown: {},
        cityBreakdown: BENTON_COUNTY_CONFIG.cities.reduce((acc, city) => {
          acc[city.name] = Math.floor(city.population / 2.5)
          return acc
        }, {} as Record<string, number>)
      }
    } catch (error) {
      console.error('Error fetching property statistics:', error)
      return {
        totalParcels: 0,
        totalAssessedValue: 0,
        averageAssessedValue: 0,
        propertyTypeBreakdown: {},
        cityBreakdown: {}
      }
    }
  }

  private transformParcelData(feature: any): BentonCountyParcel {
    const attrs = feature.attributes || {}
    
    return {
      objectId: attrs.OBJECTID || 0,
      parcelNumber: attrs.PARCEL_NUMBER || attrs.PIN || 'Unknown',
      ownerName: attrs.OWNER_NAME || attrs.OWNERNAME || 'Unknown Owner',
      situsAddress: attrs.SITUS_ADDRESS || attrs.ADDRESS || '',
      legalDescription: attrs.LEGAL_DESCRIPTION || attrs.LEGALDESC || '',
      assessedValue: attrs.ASSESSED_VALUE || attrs.TOTALVALUE || 0,
      landValue: attrs.LAND_VALUE || attrs.LANDVALUE || 0,
      improvementValue: attrs.IMPROVEMENT_VALUE || attrs.IMPVALUE || 0,
      taxableValue: attrs.TAXABLE_VALUE || attrs.TAXVALUE || 0,
      propertyType: attrs.PROPERTY_TYPE || attrs.PROPTYPE || 'Unknown',
      acreage: attrs.ACREAGE || attrs.ACRES || 0,
      yearBuilt: attrs.YEAR_BUILT || attrs.YEARBUILT || undefined,
      squareFootage: attrs.SQUARE_FOOTAGE || attrs.SQFT || undefined,
      bedrooms: attrs.BEDROOMS || attrs.BEDS || undefined,
      bathrooms: attrs.BATHROOMS || attrs.BATHS || undefined,
      lastSaleDate: attrs.LAST_SALE_DATE || attrs.SALEDATE || undefined,
      lastSalePrice: attrs.LAST_SALE_PRICE || attrs.SALEPRICE || undefined,
      taxingDistricts: this.determineTaxingDistricts(attrs),
      zoning: attrs.ZONING || attrs.ZONE || 'Unknown',
      geometry: feature.geometry
    }
  }

  private determineTaxingDistricts(attrs: any): string[] {
    const districts = ['Benton County']
    
    if (attrs.CITY || attrs.MUNICIPALITY) {
      const city = attrs.CITY || attrs.MUNICIPALITY
      districts.push(`City of ${city}`)
      
      const schoolDistrict = this.getSchoolDistrict(city)
      if (schoolDistrict) {
        districts.push(schoolDistrict)
      }
    }
    
    return districts
  }

  private getSchoolDistrict(city: string): string | null {
    const schoolMap: Record<string, string> = {
      'Richland': 'Richland School District',
      'Kennewick': 'Kennewick School District',
      'West Richland': 'Richland School District',
      'Prosser': 'Prosser School District',
      'Benton City': 'Kiona-Benton School District'
    }
    
    return schoolMap[city] || null
  }

  private getEstimatedTaxRate(district: string): number {
    const rateMap: Record<string, number> = {
      'Benton County': 0.0045,
      'City of Richland': 0.0012,
      'City of Kennewick': 0.0014,
      'City of West Richland': 0.0011,
      'City of Prosser': 0.0013,
      'City of Benton City': 0.0010,
      'Richland School District': 0.0065,
      'Kennewick School District': 0.0068,
      'Prosser School District': 0.0062
    }
    
    return rateMap[district] || 0.001
  }
}

export const bentonCountyService = new BentonCountyService()