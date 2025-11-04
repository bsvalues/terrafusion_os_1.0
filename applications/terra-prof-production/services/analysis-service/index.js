/**
 * TerraFusionPro Analysis Service
 * 
 * This service handles property valuation analysis, comparable selection,
 * and market trend calculations.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { create, find, findById, update, remove, query, tables } from '../../packages/shared/storage.js';

// Initialize express app
const app = express();
const PORT = process.env.ANALYSIS_SERVICE_PORT || 5006;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'analysis-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// GraphQL endpoint for Apollo Federation - minimal implementation
app.post('/graphql', async (req, res) => {
  try {
    // Simple schema for now - will be expanded in later phases
    const response = {
      data: {
        _service: {
          sdl: `
            type Query {
              comparable(id: ID!): Comparable
              comparables(propertyId: ID!, limit: Int, offset: Int): [Comparable]
              marketAnalysis(location: String!, propertyType: String!, timeframe: String): MarketAnalysis
              propertyValuation(propertyId: ID!): PropertyValuation
            }
            
            type Comparable @key(fields: "id") {
              id: ID!
              propertyId: ID!
              comparablePropertyId: ID!
              score: Float!
              distance: Float
              adjustments: [Adjustment]
              adjustedValue: Float
              status: String!
              created: String!
            }
            
            type Adjustment {
              factor: String!
              description: String!
              amount: Float!
              percentageChange: Float
            }
            
            type MarketAnalysis @key(fields: "id") {
              id: ID!
              location: String!
              propertyType: String!
              timeframe: String!
              medianPrice: Float!
              averagePrice: Float!
              pricePerSquareFoot: Float
              inventoryLevels: Float
              daysOnMarket: Float
              listToSaleRatio: Float
              marketType: String!
              priceDirection: String!
              demandLevel: String!
              summary: String!
              timestamp: String!
            }
            
            type PropertyValuation @key(fields: "id") {
              id: ID!
              propertyId: ID!
              estimatedValue: Float!
              confidenceScore: Float!
              approachType: String!
              adjustmentsTotal: Float
              reconciliationComments: String
              date: String!
              expirationDate: String
            }
          `
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('GraphQL error:', error);
    res.status(500).json({ errors: [{ message: error.message }] });
  }
});

// Also handle GET requests for schema introspection
app.get('/graphql', (req, res) => {
  res.json({
    data: {
      _service: {
        sdl: `
          type Query {
            comparable(id: ID!): Comparable
            comparables(propertyId: ID!, limit: Int, offset: Int): [Comparable]
            marketAnalysis(location: String!, propertyType: String!, timeframe: String): MarketAnalysis
            propertyValuation(propertyId: ID!): PropertyValuation
          }
          
          type Comparable @key(fields: "id") {
            id: ID!
            propertyId: ID!
            comparablePropertyId: ID!
            score: Float!
            distance: Float
            adjustments: [Adjustment]
            adjustedValue: Float
            status: String!
            created: String!
          }
          
          type Adjustment {
            factor: String!
            description: String!
            amount: Float!
            percentageChange: Float
          }
          
          type MarketAnalysis @key(fields: "id") {
            id: ID!
            location: String!
            propertyType: String!
            timeframe: String!
            medianPrice: Float!
            averagePrice: Float!
            pricePerSquareFoot: Float
            inventoryLevels: Float
            daysOnMarket: Float
            listToSaleRatio: Float
            marketType: String!
            priceDirection: String!
            demandLevel: String!
            summary: String!
            timestamp: String!
          }
          
          type PropertyValuation @key(fields: "id") {
            id: ID!
            propertyId: ID!
            estimatedValue: Float!
            confidenceScore: Float!
            approachType: String!
            adjustmentsTotal: Float
            reconciliationComments: String
            date: String!
            expirationDate: String
          }
        `
      }
    }
  });
});

/**
 * Calculate adjustments between subject and comparable properties
 * @param {Object} subject - Subject property
 * @param {Object} comp - Comparable property
 * @returns {Object} - Adjustments by category
 */
function generateAdjustments(subject, comp) {
  const adjustments = {
    location: calculateLocationAdjustment(subject, comp),
    sizeAndQuality: calculateSizeQualityAdjustment(subject, comp),
    age: calculateAgeAdjustment(subject, comp),
    features: calculateFeaturesAdjustment(subject, comp),
    market: calculateMarketAdjustment(subject, comp)
  };
  
  // Calculate total adjustment
  const totalAdjustment = Object.values(adjustments).reduce((sum, adj) => sum + adj, 0);
  
  // Apply total adjustment to comparable sale price
  const adjustedPrice = comp.sale_price * (1 + totalAdjustment / 100);
  
  return {
    adjustments,
    totalAdjustment,
    originalPrice: comp.sale_price,
    adjustedPrice
  };
}

// Helper functions for adjustments
function calculateLocationAdjustment(subject, comp) {
  // Simple location adjustment based on distance
  if (!comp.distance_in_miles) return 0;
  
  if (comp.distance_in_miles < 0.5) {
    return 0; // Same neighborhood
  } else if (comp.distance_in_miles < 1) {
    return -1; // Slight adjustment
  } else if (comp.distance_in_miles < 3) {
    return -3; // Moderate adjustment
  } else {
    return -5; // Significant adjustment
  }
}

function calculateSizeQualityAdjustment(subject, comp) {
  let adjustment = 0;
  
  // Building size adjustment (per square foot)
  if (subject.building_size && comp.building_size) {
    const subjectSize = parseFloat(subject.building_size);
    const compSize = parseFloat(comp.building_size);
    
    if (!isNaN(subjectSize) && !isNaN(compSize) && compSize > 0) {
      const sizeDiffPercentage = (subjectSize - compSize) / compSize * 100;
      // Apply a 50% factor to the size difference (market doesn't value at 1:1)
      adjustment += sizeDiffPercentage * 0.5;
    }
  }
  
  // Bedroom adjustment
  if (subject.bedrooms && comp.bedrooms) {
    const bedroomDiff = subject.bedrooms - comp.bedrooms;
    // Each bedroom difference is worth about 2-4% of property value
    adjustment += bedroomDiff * 3;
  }
  
  // Bathroom adjustment
  if (subject.bathrooms && comp.bathrooms) {
    const bathroomDiff = subject.bathrooms - comp.bathrooms;
    // Each bathroom difference is worth about 2-5% of property value
    adjustment += bathroomDiff * 4;
  }
  
  return adjustment;
}

function calculateAgeAdjustment(subject, comp) {
  if (!subject.year_built || !comp.year_built) return 0;
  
  const ageDiff = subject.year_built - comp.year_built;
  
  // Newer properties are generally worth more
  // Typical adjustment is 0.5% per year of age difference, but diminishes with older properties
  if (ageDiff > 0) {
    // Subject is newer than comp
    return Math.min(10, ageDiff * 0.5); // Cap at 10%
  } else if (ageDiff < 0) {
    // Subject is older than comp
    return Math.max(-10, ageDiff * 0.5); // Cap at -10%
  }
  
  return 0;
}

function calculateFeaturesAdjustment(subject, comp) {
  // This would normally be a detailed analysis of property features
  // Simplified for demonstration purposes
  return 0;
}

function calculateMarketAdjustment(subject, comp) {
  if (!comp.sale_date) return 0;
  
  // Calculate time adjustment for market changes since sale
  const saleDate = new Date(comp.sale_date);
  const today = new Date();
  
  // Calculate months between sale date and today
  const monthsDiff = (today.getFullYear() - saleDate.getFullYear()) * 12 + 
                     (today.getMonth() - saleDate.getMonth());
  
  // Apply market trend adjustment (assumed 0.5% per month)
  // This would normally be based on actual market data
  return monthsDiff * 0.5;
}

/**
 * Calculate market metrics from property data
 * @param {Array} properties - Property data
 * @param {Object} options - Calculation options
 * @returns {Object} - Market metrics
 */
function calculateMarketMetrics(properties, options = {}) {
  if (!properties || properties.length === 0) {
    return {
      count: 0,
      median_price: 0,
      average_price: 0,
      price_per_sqft: 0,
      min_price: 0,
      max_price: 0,
      days_on_market: 0,
      price_range: [0, 0]
    };
  }
  
  // Filter to properties with price data
  const propsWithPrice = properties.filter(p => p.sale_price || p.list_price);
  
  if (propsWithPrice.length === 0) {
    return {
      count: 0,
      median_price: 0,
      average_price: 0,
      price_per_sqft: 0,
      min_price: 0,
      max_price: 0,
      days_on_market: 0,
      price_range: [0, 0]
    };
  }
  
  // Get prices (prefer sale price, fallback to list price)
  const prices = propsWithPrice.map(p => p.sale_price || p.list_price);
  
  // Sort prices for median calculation
  const sortedPrices = [...prices].sort((a, b) => a - b);
  
  // Calculate metrics
  const count = prices.length;
  const sum = prices.reduce((acc, price) => acc + price, 0);
  const average = sum / count;
  const median = count % 2 === 0 
    ? (sortedPrices[count/2 - 1] + sortedPrices[count/2]) / 2
    : sortedPrices[Math.floor(count/2)];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  // Calculate price per square foot
  let pricePerSqFt = 0;
  const propsWithSize = propsWithPrice.filter(p => p.building_size && parseFloat(p.building_size) > 0);
  
  if (propsWithSize.length > 0) {
    const ppsfs = propsWithSize.map(p => {
      const price = p.sale_price || p.list_price;
      const size = parseFloat(p.building_size);
      return price / size;
    });
    pricePerSqFt = ppsfs.reduce((acc, ppsf) => acc + ppsf, 0) / ppsfs.length;
  }
  
  // Calculate average days on market if available
  let daysOnMarket = 0;
  const propsWithDOM = properties.filter(p => p.days_on_market);
  
  if (propsWithDOM.length > 0) {
    const totalDays = propsWithDOM.reduce((acc, p) => acc + p.days_on_market, 0);
    daysOnMarket = totalDays / propsWithDOM.length;
  }
  
  return {
    count,
    median_price: median,
    average_price: average,
    price_per_sqft: pricePerSqFt,
    min_price: min,
    max_price: max,
    days_on_market: daysOnMarket,
    price_range: [min, max]
  };
}

/**
 * Analyze market trends from historical property data
 * @param {Array} salesData - Historical property sales data
 * @param {number} timeframe - Timeframe in months to analyze
 * @returns {Object} - Market trends
 */
function analyzeMarketTrends(salesData, timeframe = 12) {
  if (!salesData || salesData.length === 0) {
    return {
      price_trend: 0,
      inventory_trend: 0,
      days_on_market_trend: 0,
      is_sellers_market: false,
      market_condition: 'unknown'
    };
  }
  
  // Group sales data by month
  const salesByMonth = {};
  
  salesData.forEach(sale => {
    if (!sale.sale_date) return;
    
    const date = new Date(sale.sale_date);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!salesByMonth[monthKey]) {
      salesByMonth[monthKey] = [];
    }
    
    salesByMonth[monthKey].push(sale);
  });
  
  // Sort months chronologically
  const sortedMonths = Object.keys(salesByMonth).sort();
  
  // Limit to specified timeframe
  const monthsToAnalyze = sortedMonths.slice(-timeframe);
  
  if (monthsToAnalyze.length < 2) {
    return {
      price_trend: 0,
      inventory_trend: 0,
      days_on_market_trend: 0,
      is_sellers_market: false,
      market_condition: 'insufficient data'
    };
  }
  
  // Calculate monthly metrics
  const monthlyMetrics = monthsToAnalyze.map(month => {
    const monthSales = salesByMonth[month];
    const metrics = calculateMarketMetrics(monthSales);
    return {
      month,
      ...metrics
    };
  });
  
  // Calculate price trend (simple linear regression)
  const firstMonthPrice = monthlyMetrics[0].median_price;
  const lastMonthPrice = monthlyMetrics[monthlyMetrics.length - 1].median_price;
  const priceTrend = firstMonthPrice > 0 
    ? (lastMonthPrice - firstMonthPrice) / firstMonthPrice * 100
    : 0;
  
  // Calculate inventory trend
  const firstMonthCount = monthlyMetrics[0].count;
  const lastMonthCount = monthlyMetrics[monthlyMetrics.length - 1].count;
  const inventoryTrend = firstMonthCount > 0
    ? (lastMonthCount - firstMonthCount) / firstMonthCount * 100
    : 0;
  
  // Calculate days on market trend
  const firstMonthDOM = monthlyMetrics[0].days_on_market;
  const lastMonthDOM = monthlyMetrics[monthlyMetrics.length - 1].days_on_market;
  const domTrend = firstMonthDOM > 0
    ? (lastMonthDOM - firstMonthDOM) / firstMonthDOM * 100
    : 0;
  
  // Determine market condition
  const isSellerMarket = priceTrend > 0 && inventoryTrend < 0 && domTrend < 0;
  const isBuyerMarket = priceTrend < 0 && inventoryTrend > 0 && domTrend > 0;
  
  let marketCondition = 'balanced';
  if (isSellerMarket) marketCondition = 'sellers';
  if (isBuyerMarket) marketCondition = 'buyers';
  
  return {
    price_trend: priceTrend,
    inventory_trend: inventoryTrend,
    days_on_market_trend: domTrend,
    is_sellers_market: isSellerMarket,
    market_condition: marketCondition,
    monthly_data: monthlyMetrics
  };
}

/**
 * Assess market conditions
 * @param {Object} metrics - Market metrics
 * @param {Object} trends - Market trends
 * @returns {Object} - Market conditions assessment
 */
function assessMarketConditions(metrics, trends) {
  // Assess market type
  let marketType = 'balanced';
  if (trends.price_trend > 5) {
    marketType = 'appreciating';
  } else if (trends.price_trend < -5) {
    marketType = 'depreciating';
  }
  
  // Assess demand level
  let demand = 'moderate';
  if (trends.inventory_trend < -10 && trends.days_on_market_trend < -10) {
    demand = 'high';
  } else if (trends.inventory_trend > 10 && trends.days_on_market_trend > 10) {
    demand = 'low';
  }
  
  // Assess price direction
  let priceDirection = 'stable';
  if (trends.price_trend > 2) {
    priceDirection = 'increasing';
  } else if (trends.price_trend < -2) {
    priceDirection = 'decreasing';
  }
  
  // Determine overall market condition
  const overallCondition = getOverallCondition(marketType, demand, priceDirection);
  
  return {
    market_type: marketType,
    demand_level: demand,
    price_direction: priceDirection,
    overall_condition: overallCondition
  };
}

/**
 * Determine overall market condition
 * @param {string} marketType - Market type (appreciating, depreciating, balanced)
 * @param {string} demand - Demand level (high, moderate, low)
 * @param {string} priceDirection - Price direction (increasing, stable, decreasing)
 * @returns {string} - Overall condition
 */
function getOverallCondition(marketType, demand, priceDirection) {
  if (marketType === 'appreciating' && demand === 'high' && priceDirection === 'increasing') {
    return 'strong sellers market';
  } else if (marketType === 'depreciating' && demand === 'low' && priceDirection === 'decreasing') {
    return 'strong buyers market';
  } else if ((marketType === 'appreciating' || priceDirection === 'increasing') && demand !== 'low') {
    return 'sellers market';
  } else if ((marketType === 'depreciating' || priceDirection === 'decreasing') && demand !== 'high') {
    return 'buyers market';
  } else {
    return 'balanced market';
  }
}

/**
 * Generate market summary
 * @param {Object} location - Location information
 * @param {Object} metrics - Market metrics
 * @param {Object} conditions - Market conditions
 * @returns {string} - Market summary
 */
function generateMarketSummary(location, metrics, conditions) {
  const locationStr = `${location.city}, ${location.state}`;
  const priceStr = formatCurrency(metrics.median_price);
  const ppsf = formatCurrency(metrics.price_per_sqft);
  const priceChange = conditions.market_type === 'appreciating'
    ? 'increasing'
    : conditions.market_type === 'depreciating'
      ? 'decreasing'
      : 'stable';
  
  return `
The ${locationStr} real estate market is currently a ${conditions.overall_condition}. 
The median home price is ${priceStr} with an average price per square foot of ${ppsf}.
Property values are ${priceChange}, and buyer demand is ${conditions.demand_level}.
The average time on market is ${Math.round(metrics.days_on_market)} days.
  `.trim();
}

/**
 * Format currency value
 * @param {number} value - Value to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// API endpoints

// Get market analysis
app.get('/market/analysis', async (req, res) => {
  try {
    const { location, propertyType, timeframe = 12 } = req.query;
    
    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }
    
    // Build query for sales data
    const filter = {};
    if (location) {
      if (location.length === 5 && /^\d+$/.test(location)) {
        filter.zip_code = location;
      } else {
        filter.city = location;
      }
    }
    if (propertyType) filter.property_type = propertyType;
    
    // Get comparable sales data (from comparables table)
    const comparables = await find(tables.COMPARABLES, filter);
    
    // Calculate market metrics
    const metrics = calculateMarketMetrics(comparables);
    
    // Analyze market trends
    const trends = analyzeMarketTrends(comparables, parseInt(timeframe));
    
    // Assess market conditions
    const conditions = assessMarketConditions(metrics, trends);
    
    // Generate market summary
    const locationInfo = {
      city: location,
      state: 'CA' // Default for demo
    };
    const summary = generateMarketSummary(locationInfo, metrics, conditions);
    
    res.json({
      metrics,
      trends,
      conditions,
      summary
    });
  } catch (error) {
    console.error('Error getting market analysis:', error);
    res.status(500).json({ error: 'Failed to analyze market data' });
  }
});

// Find comparable properties
app.post('/valuation/find-comps', async (req, res) => {
  try {
    const {
      propertyId,
      maxDistance = 5,
      maxAgeDiff = 10,
      minSqftRatio = 0.7,
      maxSqftRatio = 1.3,
      maxResults = 5,
      excludeIds = []
    } = req.body;
    
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }
    
    // Get the subject property
    const subject = await findById(tables.PROPERTIES, propertyId);
    if (!subject) {
      return res.status(404).json({ error: 'Subject property not found' });
    }
    
    // Build query for potential comps
    const subjectYearBuilt = subject.year_built ? parseInt(subject.year_built) : null;
    const subjectBuildingSize = subject.building_size ? parseFloat(subject.building_size) : null;
    
    // Get all comparable sales (simplified - in real app would use spatial queries)
    const allComps = await find(tables.COMPARABLES, { property_type: subject.property_type });
    
    // Filter and sort comps
    const filteredComps = allComps
      // Exclude specific IDs
      .filter(comp => !excludeIds.includes(comp.id))
      // Apply property filters
      .filter(comp => {
        // Filter by distance (if latitude/longitude available)
        if (subject.latitude && subject.longitude && comp.latitude && comp.longitude) {
          const distance = calculateDistance(
            subject.latitude, subject.longitude,
            comp.latitude, comp.longitude
          );
          if (distance > maxDistance) return false;
          comp.distance_in_miles = distance;
        }
        
        // Filter by year built
        if (subjectYearBuilt && comp.year_built) {
          const yearDiff = Math.abs(subjectYearBuilt - comp.year_built);
          if (yearDiff > maxAgeDiff) return false;
        }
        
        // Filter by size
        if (subjectBuildingSize && comp.building_size) {
          const compSize = parseFloat(comp.building_size);
          const sizeRatio = compSize / subjectBuildingSize;
          if (sizeRatio < minSqftRatio || sizeRatio > maxSqftRatio) return false;
        }
        
        return true;
      })
      // Score comps by similarity
      .map(comp => {
        const locationScore = calculateLocationScore(subject, comp);
        const sizeScore = calculateSizeScore(subject, comp);
        const ageScore = calculateAgeScore(subject, comp);
        const featureScore = calculateFeatureScore(subject, comp);
        
        const totalScore = (locationScore * 0.4) + (sizeScore * 0.3) + (ageScore * 0.2) + (featureScore * 0.1);
        
        return {
          ...comp,
          similarity_score: totalScore,
          score_breakdown: {
            location: locationScore,
            size: sizeScore,
            age: ageScore,
            features: featureScore
          }
        };
      })
      // Sort by score (highest first)
      .sort((a, b) => b.similarity_score - a.similarity_score);
    
    // Take top N results
    const topComps = filteredComps.slice(0, maxResults);
    
    // Generate adjustments for selected comps
    const compsWithAdjustments = topComps.map(comp => ({
      ...comp,
      ...generateAdjustments(subject, comp)
    }));
    
    res.json({
      subject,
      comparables: compsWithAdjustments
    });
  } catch (error) {
    console.error('Error finding comparable properties:', error);
    res.status(500).json({ error: 'Failed to find comparable properties' });
  }
});

// Helper functions for comparable selection
function calculateLocationScore(subject, comp) {
  if (comp.distance_in_miles !== undefined) {
    // Inverse relationship: closer = higher score
    return Math.max(0, Math.min(1, 1 - (comp.distance_in_miles / 10)));
  }
  
  // If no distance, check for same city/zip
  if (subject.zip_code && comp.zip_code && subject.zip_code === comp.zip_code) {
    return 0.9; // Same zip code
  } else if (subject.city && comp.city && subject.city === comp.city) {
    return 0.7; // Same city
  }
  
  return 0.5; // Default
}

function calculateSizeScore(subject, comp) {
  if (subject.building_size && comp.building_size) {
    const subjectSize = parseFloat(subject.building_size);
    const compSize = parseFloat(comp.building_size);
    
    if (isNaN(subjectSize) || isNaN(compSize) || subjectSize === 0) {
      return 0.5;
    }
    
    const ratio = compSize / subjectSize;
    // Score is highest when closest to 1:1 ratio
    return Math.max(0, 1 - Math.abs(ratio - 1));
  }
  
  return 0.5; // Default
}

function calculateAgeScore(subject, comp) {
  if (subject.year_built && comp.year_built) {
    const yearDiff = Math.abs(subject.year_built - comp.year_built);
    // Score decreases as year difference increases
    return Math.max(0, 1 - (yearDiff / 30));
  }
  
  return 0.5; // Default
}

function calculateFeatureScore(subject, comp) {
  let score = 0.5; // Default
  let factors = 0;
  
  // Compare bedroom count
  if (subject.bedrooms && comp.bedrooms) {
    const bedroomDiff = Math.abs(subject.bedrooms - comp.bedrooms);
    const bedroomScore = bedroomDiff === 0 ? 1 : bedroomDiff === 1 ? 0.75 : 0.5;
    score += bedroomScore;
    factors++;
  }
  
  // Compare bathroom count
  if (subject.bathrooms && comp.bathrooms) {
    const bathroomDiff = Math.abs(subject.bathrooms - comp.bathrooms);
    const bathroomScore = bathroomDiff === 0 ? 1 : bathroomDiff <= 0.5 ? 0.75 : 0.5;
    score += bathroomScore;
    factors++;
  }
  
  // Average the factors if we have any
  return factors > 0 ? score / (factors + 1) : score;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula to calculate distance between two points
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate adjustments for a comparable property
app.post('/valuation/calculate-adjustments', async (req, res) => {
  try {
    const { subjectId, compId } = req.body;
    
    if (!subjectId || !compId) {
      return res.status(400).json({ error: 'Subject and comparable property IDs are required' });
    }
    
    // Get the subject property
    const subject = await findById(tables.PROPERTIES, subjectId);
    if (!subject) {
      return res.status(404).json({ error: 'Subject property not found' });
    }
    
    // Get the comparable property
    const comp = await findById(tables.COMPARABLES, compId);
    if (!comp) {
      return res.status(404).json({ error: 'Comparable property not found' });
    }
    
    // Generate adjustments
    const adjustmentResults = generateAdjustments(subject, comp);
    
    res.json(adjustmentResults);
  } catch (error) {
    console.error('Error calculating adjustments:', error);
    res.status(500).json({ error: 'Failed to calculate adjustments' });
  }
});

// Validate property data
app.post('/valuation/validate-data', async (req, res) => {
  try {
    const { propertyData, checkType = 'complete' } = req.body;
    
    if (!propertyData) {
      return res.status(400).json({ error: 'Property data is required' });
    }
    
    const requiredFields = [
      'address', 'city', 'state', 'zip_code', 'property_type'
    ];
    
    const recommendedFields = [
      'year_built', 'bedrooms', 'bathrooms', 'building_size', 'lot_size'
    ];
    
    const missingRequired = [];
    const missingRecommended = [];
    const warnings = [];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!propertyData[field]) {
        missingRequired.push(field);
      }
    });
    
    // Check recommended fields if doing complete validation
    if (checkType === 'complete') {
      recommendedFields.forEach(field => {
        if (!propertyData[field]) {
          missingRecommended.push(field);
        }
      });
    }
    
    // Check for potential data issues
    if (propertyData.year_built) {
      const year = parseInt(propertyData.year_built);
      const currentYear = new Date().getFullYear();
      
      if (isNaN(year)) {
        warnings.push('Year built should be a valid year number');
      } else if (year > currentYear) {
        warnings.push('Year built cannot be in the future');
      } else if (year < 1800) {
        warnings.push('Very old year built detected, please verify');
      }
    }
    
    if (propertyData.building_size) {
      const size = parseFloat(propertyData.building_size);
      
      if (isNaN(size)) {
        warnings.push('Building size should be a valid number');
      } else if (size < 100 || size > 50000) {
        warnings.push('Building size appears unusual, please verify');
      }
    }
    
    // Determine validation status
    const isValid = missingRequired.length === 0;
    const isComplete = isValid && missingRecommended.length === 0 && warnings.length === 0;
    
    res.json({
      isValid,
      isComplete,
      missingRequired,
      missingRecommended,
      warnings
    });
  } catch (error) {
    console.error('Error validating property data:', error);
    res.status(500).json({ error: 'Failed to validate property data' });
  }
});

// Perform quality control check on valuation
app.post('/valuation/quality-check', async (req, res) => {
  try {
    const { reportId } = req.body;
    
    if (!reportId) {
      return res.status(400).json({ error: 'Report ID is required' });
    }
    
    // Get the report
    const report = await findById(tables.APPRAISAL_REPORTS, reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Get the property
    const property = await findById(tables.PROPERTIES, report.property_id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Get the comparables for this report
    const comparables = await find(tables.COMPARABLES, { report_id: reportId });
    
    // Run quality control checks
    const checks = [
      // Check if report has enough comparables
      {
        name: 'comparable_count',
        description: 'Report has adequate number of comparables',
        passed: comparables.length >= 3,
        severity: 'high',
        details: comparables.length < 3 
          ? `Report only has ${comparables.length} comparables, minimum 3 recommended`
          : null
      },
      
      // Check for comparable selection variety
      {
        name: 'comparable_variety',
        description: 'Comparables represent a range of values',
        passed: checkComparableVariety(comparables),
        severity: 'medium',
        details: checkComparableVariety(comparables) 
          ? null
          : 'Comparables have similar prices, more variety recommended'
      },
      
      // Check final value is within range of comparables
      {
        name: 'value_within_range',
        description: 'Final value is within range of comparable sales',
        passed: checkValueWithinRange(report, comparables),
        severity: 'high',
        details: checkValueWithinRange(report, comparables)
          ? null
          : 'Final value falls outside the range of comparable sales prices'
      },
      
      // Check report has sufficient narrative
      {
        name: 'narrative_completeness',
        description: 'Report includes adequate narrative explanation',
        passed: report.comments && report.comments.length > 100,
        severity: 'medium',
        details: !report.comments || report.comments.length <= 100
          ? 'Report narrative is insufficient or missing'
          : null
      },
      
      // Check for time adjustments if comparables are old
      {
        name: 'time_adjustments',
        description: 'Time adjustments applied for older comparables',
        passed: checkTimeAdjustments(comparables),
        severity: 'medium',
        details: checkTimeAdjustments(comparables)
          ? null
          : 'Some comparables are over 6 months old and may need time adjustments'
      }
    ];
    
    // Calculate overall QC score
    const passedChecks = checks.filter(check => check.passed).length;
    const totalChecks = checks.length;
    const score = Math.round((passedChecks / totalChecks) * 100);
    
    // Determine overall status
    let status = 'failed';
    if (score >= 90) {
      status = 'passed';
    } else if (score >= 70) {
      status = 'passed_with_warnings';
    }
    
    res.json({
      report_id: reportId,
      property_id: property.id,
      checks,
      score,
      status,
      review_date: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error performing quality check:', error);
    res.status(500).json({ error: 'Failed to perform quality check' });
  }
});

// Helper functions for quality control
function checkComparableVariety(comparables) {
  if (comparables.length < 2) return false;
  
  const prices = comparables.map(comp => comp.sale_price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  // Check if there's at least 10% variation between min and max
  return (max - min) / min >= 0.1;
}

function checkValueWithinRange(report, comparables) {
  if (!report.final_value || comparables.length === 0) return false;
  
  const prices = comparables.map(comp => comp.sale_price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  // Add a 10% buffer on either end
  const lowerBound = min * 0.9;
  const upperBound = max * 1.1;
  
  return report.final_value >= lowerBound && report.final_value <= upperBound;
}

function checkTimeAdjustments(comparables) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const oldComps = comparables.filter(comp => {
    if (!comp.sale_date) return false;
    const saleDate = new Date(comp.sale_date);
    return saleDate < sixMonthsAgo;
  });
  
  // If there are old comps, check if they have adjustments
  if (oldComps.length > 0) {
    return oldComps.every(comp => 
      comp.adjustments && 
      JSON.parse(comp.adjustments).some(adj => adj.name === 'time' || adj.name === 'market')
    );
  }
  
  return true; // No old comps, so no adjustments needed
}

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Analysis service running on port ${PORT}`);
});

export default app;