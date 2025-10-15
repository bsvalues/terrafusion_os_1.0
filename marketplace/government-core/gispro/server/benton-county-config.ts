export const BENTON_COUNTY_CONFIG = {
  county: {
    name: 'Benton County',
    state: 'Washington',
    fipsCode: '53005',
    countySeat: 'Prosser',
    established: 1905,
    area: {
      totalSqMiles: 1703,
      landSqMiles: 1700,
      waterSqMiles: 3
    },
    population: 206873,
    coordinates: {
      center: [-119.2787, 46.2619],
      bounds: [
        [-119.857, 45.775],
        [-118.951, 46.493]
      ]
    }
  },
  
  assessor: {
    office: 'Benton County Assessor',
    address: '620 Market Street, Prosser, WA 99350',
    phone: '(509) 736-3085',
    website: 'https://www.co.benton.wa.us/departments/assessor',
    currentAssessor: 'Benton County Assessor Office'
  },
  
  gisServices: {
    arcgisServer: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services',
    parcelService: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels/FeatureServer/0',
    taxLotService: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/TaxLots/FeatureServer/0',
    zoningService: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Zoning/FeatureServer/0'
  },
  
  cities: [
    { name: 'Richland', population: 60560, incorporated: 1958 },
    { name: 'Kennewick', population: 83920, incorporated: 1904 },
    { name: 'West Richland', population: 15875, incorporated: 1955 },
    { name: 'Prosser', population: 6062, incorporated: 1899 },
    { name: 'Benton City', population: 3548, incorporated: 1909 }
  ],
  
  economicData: {
    majorIndustries: [
      'Nuclear Energy (Hanford Site)',
      'Agriculture (Wine, Wheat, Potatoes)',
      'Food Processing',
      'Manufacturing',
      'Technology',
      'Tourism'
    ],
    agriculturalProducts: [
      'Wine Grapes',
      'Wheat',
      'Potatoes',
      'Onions',
      'Corn',
      'Alfalfa'
    ]
  },
  
  geography: {
    region: 'Columbia River Valley',
    climate: 'Semi-arid desert',
    elevation: {
      lowest: 285,
      highest: 3600,
      average: 500
    },
    majorWaterways: [
      'Columbia River',
      'Yakima River',
      'Snake River'
    ]
  },
  
  assessmentDistricts: [
    { id: 1, name: 'Richland District', description: 'City of Richland and surrounding areas' },
    { id: 2, name: 'Kennewick District', description: 'City of Kennewick and surrounding areas' },
    { id: 3, name: 'West Richland District', description: 'City of West Richland and surrounding areas' },
    { id: 4, name: 'Prosser District', description: 'City of Prosser and surrounding rural areas' },
    { id: 5, name: 'Rural North District', description: 'Northern rural areas' },
    { id: 6, name: 'Rural South District', description: 'Southern rural and agricultural areas' }
  ],
  
  propertyTypes: [
    { code: 'RES', name: 'Residential', description: 'Single family homes, condos, townhomes' },
    { code: 'COM', name: 'Commercial', description: 'Retail, office, hospitality properties' },
    { code: 'IND', name: 'Industrial', description: 'Manufacturing, warehouses, processing facilities' },
    { code: 'AGR', name: 'Agricultural', description: 'Farms, orchards, vineyards, ranches' },
    { code: 'VAC', name: 'Vacant Land', description: 'Undeveloped lots and acreage' },
    { code: 'UTI', name: 'Utility', description: 'Power plants, substations, transmission lines' },
    { code: 'GOV', name: 'Government', description: 'Federal, state, county, municipal properties' }
  ],
  
  taxingDistricts: [
    'Benton County',
    'City of Richland',
    'City of Kennewick', 
    'City of West Richland',
    'City of Prosser',
    'City of Benton City',
    'Richland School District',
    'Kennewick School District',
    'Prosser School District',
    'Kiona-Benton School District',
    'Finley School District'
  ],
  
  specialAreas: {
    hanfordSite: {
      name: 'Hanford Nuclear Reservation',
      area: 586,
      status: 'Federal cleanup site',
      restrictions: 'Limited public access, environmental remediation ongoing'
    },
    agriculturalAreas: {
      name: 'Columbia Valley Agricultural District',
      area: 400,
      primaryUse: 'Wine grape production and agriculture'
    }
  }
}

export const BENTON_COUNTY_MAP_LAYERS = [
  {
    id: 'parcels',
    name: 'Property Parcels',
    serviceUrl: BENTON_COUNTY_CONFIG.gisServices.parcelService,
    type: 'feature',
    visible: true,
    opacity: 0.8,
    category: 'Property Data'
  },
  {
    id: 'taxlots',
    name: 'Tax Lots',
    serviceUrl: BENTON_COUNTY_CONFIG.gisServices.taxLotService,
    type: 'feature',
    visible: false,
    opacity: 0.7,
    category: 'Property Data'
  },
  {
    id: 'zoning',
    name: 'Zoning Districts',
    serviceUrl: BENTON_COUNTY_CONFIG.gisServices.zoningService,
    type: 'feature',
    visible: false,
    opacity: 0.6,
    category: 'Planning'
  }
]