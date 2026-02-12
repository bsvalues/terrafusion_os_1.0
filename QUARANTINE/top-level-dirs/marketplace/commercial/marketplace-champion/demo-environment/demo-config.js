// Terrafusion Demo Environment Configuration
const DEMO_CONFIG = {
  // Demo Mode Settings
  isDemoMode: true,
  demoTimeout: 3600000, // 1 hour sessions
  resetInterval: 86400000, // Daily reset
  
  // Feature Flags for Demo
  features: {
    allAppsEnabled: true,
    aiAssistant: true,
    dataExport: false, // Disabled in demo
    realTimeSync: true,
    pluginMarketplace: true,
    customization: 'limited'
  },
  
  // Sample Data Sets
  dataSets: {
    smallCounty: {
      name: "Riverside Township",
      population: 5000,
      properties: 2500,
      annualBudget: "$5M"
    },
    mediumCounty: {
      name: "Jefferson County", 
      population: 50000,
      properties: 25000,
      annualBudget: "$50M"
    },
    largeCounty: {
      name: "Metropolitan District",
      population: 500000,
      properties: 250000,
      annualBudget: "$500M"
    }
  },
  
  // Demo Limitations
  limitations: {
    maxRecords: 1000,
    maxExport: 100,
    maxUsers: 5,
    maxStorage: "100MB"
  },
  
  // Analytics Tracking
  analytics: {
    enabled: true,
    trackEvents: true,
    anonymizeData: true,
    endpoint: "https://analytics.terrafusionmarket.io"
  }
};

// Auto-start demo tours
const DEMO_TOURS = {
  welcome: {
    steps: [
      "Welcome to Terrafusion - The Complete Government Operating System",
      "Navigate through 14 integrated applications",
      "Experience AI-powered automation",
      "See real-time analytics and insights",
      "Explore the plugin marketplace"
    ]
  },
  features: {
    "TerraAgent": "AI assistant for government operations",
    "TerraFlow": "Automated workflow processing",
    "CostForgeAI": "Intelligent cost analysis",
    "GISPRO": "Advanced mapping and spatial analysis"
  }
};

export { DEMO_CONFIG, DEMO_TOURS };
