/**
 * TerraFusionPro AI Agents
 * 
 * This module provides AI-powered agents for data validation, comparable property selection,
 * quality control reviews, and market analysis to enhance appraisal accuracy and efficiency.
 */

// Configuration object for agent behavior
const defaultConfig = {
  // Agent activation thresholds and parameters
  thresholds: {
    similarityThreshold: 0.7,     // Minimum similarity score for comparables
    qcScoreThreshold: 0.85,       // Minimum QC score to pass review
    confidenceThreshold: 0.8      // Minimum confidence level for market analysis
  },
  // Weighting factors for scoring algorithms
  weights: {
    location: 0.35,               // Weight for location in similarity scoring
    size: 0.25,                   // Weight for property size in similarity scoring
    age: 0.2,                     // Weight for property age in similarity scoring
    features: 0.2                 // Weight for property features in similarity scoring
  },
  // Adjustment values for comparable calculations
  adjustments: {
    pricePerSqFt: 100,            // Price per square foot ($) for size adjustments
    bedroomValue: 5000,           // Value per bedroom ($)
    bathroomValue: 7500,          // Value per bathroom ($)
    ageValuePerYear: 1000,        // Value per year of age difference ($)
    locationTiers: {              // Location quality tier adjustments
      'A': 50000,                 // Premium location
      'B': 25000,                 // Above average location
      'C': 0,                     // Average location (baseline)
      'D': -25000,                // Below average location
      'E': -50000                 // Poor location
    }
  },
  // Processing options
  options: {
    maxResults: 10,               // Maximum number of results to return
    detailedAnalysis: true,       // Whether to include detailed analysis in results
    cacheResults: true,           // Whether to cache results for reuse
    cacheTTL: 24 * 60 * 60 * 1000 // Cache time-to-live (24 hours)
  }
};

// Agent system singleton
let agentSystem = null;

/**
 * Initialize the agent system with configuration
 * @param {Object} config - Configuration options for the agent system
 * @returns {Object} - The initialized agent system
 */
function initializeAgents(config = {}) {
  if (agentSystem) {
    return agentSystem;
  }
  
  // Merge default config with provided config
  const mergedConfig = {
    ...defaultConfig,
    ...config,
    thresholds: { ...defaultConfig.thresholds, ...config.thresholds },
    weights: { ...defaultConfig.weights, ...config.weights },
    adjustments: { ...defaultConfig.adjustments, ...config.adjustments },
    options: { ...defaultConfig.options, ...config.options }
  };
  
  // Create the agent system
  agentSystem = {
    config: mergedConfig,
    
    // Run a specific agent
    async runAgent(agentType, data, options = {}) {
      const agentOptions = { ...this.config.options, ...options };
      
      switch (agentType) {
        case 'data-validator':
          return await runDataValidator(data, agentOptions);
        case 'comp-selector':
          return await runCompSelector(data, agentOptions);
        case 'qc-reviewer':
          return await runQCReviewer(data, agentOptions);
        case 'market-analyzer':
          return await runMarketAnalyzer(data, agentOptions);
        default:
          throw new Error(`Unknown agent type: ${agentType}`);
      }
    },
    
    // Get current configuration
    getConfig() {
      return { ...this.config };
    },
    
    // Update configuration
    updateConfig(newConfig) {
      this.config = {
        ...this.config,
        ...newConfig,
        thresholds: { ...this.config.thresholds, ...newConfig.thresholds },
        weights: { ...this.config.weights, ...newConfig.weights },
        adjustments: { ...this.config.adjustments, ...newConfig.adjustments },
        options: { ...this.config.options, ...newConfig.options }
      };
      return this.config;
    }
  };
  
  return agentSystem;
}

/**
 * Run a specific agent with provided data
 * @param {string} agentType - Type of agent to run
 * @param {Object} data - Data for the agent to process
 * @param {Object} options - Additional options for the agent
 * @returns {Promise<Object>} - Results from the agent
 */
async function runAgent(agentType, data, options = {}) {
  const agents = initializeAgents();
  return await agents.runAgent(agentType, data, options);
}

/**
 * Run the data validator agent to check data quality and consistency
 * @param {Object} data - Property data to validate
 * @param {Object} options - Agent options
 * @returns {Promise<Object>} - Validation results
 */
async function runDataValidator(data, options) {
  console.log('Running data validator agent...');
  
  // Initialize results
  const results = {
    isValid: true,
    score: 1.0,
    errors: [],
    warnings: [],
    suggestions: []
  };
  
  try {
    // Required fields validation
    const requiredFields = [
      'address', 'city', 'state', 'zipCode', 'propertyType'
    ];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        results.isValid = false;
        results.errors.push({
          field,
          message: `Required field ${field} is missing`
        });
      }
    }
    
    // Numeric fields validation
    const numericFields = [
      { field: 'bedrooms', min: 0, max: 20 },
      { field: 'bathrooms', min: 0, max: 20 },
      { field: 'yearBuilt', min: 1800, max: new Date().getFullYear() }
    ];
    
    for (const { field, min, max } of numericFields) {
      if (data[field]) {
        const value = Number(data[field]);
        if (isNaN(value)) {
          results.warnings.push({
            field,
            message: `Field ${field} should be a number`
          });
        } else if (value < min || value > max) {
          results.warnings.push({
            field,
            message: `Field ${field} should be between ${min} and ${max}`
          });
        }
      }
    }
    
    // Format validation
    const formatValidations = [
      { field: 'zipCode', regex: /^\d{5}(-\d{4})?$/, message: 'ZIP code should be in format XXXXX or XXXXX-XXXX' },
      { field: 'email', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email should be in a valid format' }
    ];
    
    for (const { field, regex, message } of formatValidations) {
      if (data[field] && !regex.test(data[field])) {
        results.warnings.push({ field, message });
      }
    }
    
    // Description and features completeness check
    if (!data.description || data.description.length < 50) {
      results.suggestions.push({
        field: 'description',
        message: 'Add a more detailed property description (at least 50 characters)'
      });
    }
    
    if (!data.features || Object.keys(data.features).length < 3) {
      results.suggestions.push({
        field: 'features',
        message: 'Add more property features (at least 3)'
      });
    }
    
    // Calculate validation score
    const errorPenalty = results.errors.length * 0.2;
    const warningPenalty = results.warnings.length * 0.05;
    results.score = Math.max(0, 1 - errorPenalty - warningPenalty);
    
    return results;
  } catch (error) {
    console.error('Error in data validator agent:', error);
    return {
      isValid: false,
      score: 0,
      errors: [{ 
        field: 'general', 
        message: 'Internal validation error: ' + error.message 
      }],
      warnings: [],
      suggestions: []
    };
  }
}

/**
 * Run the comparable selector agent to find and rank comparable properties
 * @param {Object} data - Property and market data for comp selection
 * @param {Object} options - Agent options
 * @returns {Promise<Object>} - Selected comparables with rankings
 */
async function runCompSelector(data, options) {
  console.log('Running comparable selector agent...');
  
  try {
    const { subject, comparables } = data;
    const { weights, maxResults = 10 } = options;
    
    if (!subject || !comparables || !Array.isArray(comparables)) {
      throw new Error('Invalid input data format');
    }
    
    // Default weights if not provided
    const scoreWeights = weights || {
      location: 0.35,
      size: 0.25,
      age: 0.2,
      features: 0.2
    };
    
    // Calculate similarity scores for each comparable
    const scoredComps = comparables.map(comp => {
      // Calculate individual feature scores
      const locationScore = calculateLocationScore(subject, comp);
      const sizeScore = calculateSizeScore(subject, comp);
      const ageScore = calculateAgeScore(subject, comp);
      const featureScore = calculateFeatureScore(subject, comp);
      
      // Calculate weighted total score
      const totalScore = (
        locationScore * scoreWeights.location +
        sizeScore * scoreWeights.size +
        ageScore * scoreWeights.age +
        featureScore * scoreWeights.features
      );
      
      // Generate adjustments
      const adjustments = generateAdjustments(subject, comp);
      
      // Return comp with scores and adjustments
      return {
        ...comp,
        scores: {
          location: locationScore,
          size: sizeScore,
          age: ageScore,
          features: featureScore,
          total: totalScore
        },
        adjustments,
        adjustedPrice: comp.salePrice ? 
          comp.salePrice + Object.values(adjustments).reduce((sum, val) => sum + val, 0) : 
          null
      };
    });
    
    // Sort by total score and take top results
    const results = scoredComps
      .sort((a, b) => b.scores.total - a.scores.total)
      .slice(0, maxResults);
    
    // Calculate recommended value based on adjusted prices
    const validPrices = results
      .filter(comp => comp.adjustedPrice)
      .map(comp => comp.adjustedPrice);
    
    let recommendedValue = null;
    if (validPrices.length > 0) {
      // Calculate average of adjusted prices
      recommendedValue = Math.round(
        validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length
      );
    }
    
    return {
      subject,
      comparables: results,
      recommendedValue,
      analysisDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in comparable selector agent:', error);
    return {
      error: error.message,
      comparables: [],
      recommendedValue: null,
      analysisDate: new Date().toISOString()
    };
  }
}

function calculateLocationScore(subject, comp) {
  // In a real implementation, this would use geocoding and distance calculations
  // For this example, we'll use a simplified approach
  
  // Same city and state is a base score of 0.7
  let score = 0.7;
  
  // Same zip code adds 0.2
  if (subject.zipCode === comp.zipCode) {
    score += 0.2;
  }
  
  // For the remaining 0.1, we would normally use actual distance
  // Here we'll just add a random factor to simulate variations within a city
  score += Math.random() * 0.1;
  
  return Math.min(score, 1.0);
}

function calculateSizeScore(subject, comp) {
  let score = 1.0;
  
  // Building size difference
  if (subject.buildingSize && comp.buildingSize) {
    const subjectSize = parseFloat(subject.buildingSize);
    const compSize = parseFloat(comp.buildingSize);
    
    if (!isNaN(subjectSize) && !isNaN(compSize) && subjectSize > 0) {
      const sizeDiff = Math.abs(subjectSize - compSize) / subjectSize;
      // Deduct points based on size difference percentage
      if (sizeDiff > 0.3) {
        score -= 0.5;
      } else if (sizeDiff > 0.2) {
        score -= 0.3;
      } else if (sizeDiff > 0.1) {
        score -= 0.1;
      }
    }
  }
  
  // Bedrooms difference
  if (subject.bedrooms && comp.bedrooms) {
    const bedroomDiff = Math.abs(subject.bedrooms - comp.bedrooms);
    if (bedroomDiff >= 2) {
      score -= 0.2;
    } else if (bedroomDiff === 1) {
      score -= 0.1;
    }
  }
  
  // Bathrooms difference
  if (subject.bathrooms && comp.bathrooms) {
    const bathroomDiff = Math.abs(subject.bathrooms - comp.bathrooms);
    if (bathroomDiff >= 2) {
      score -= 0.2;
    } else if (bathroomDiff === 1) {
      score -= 0.1;
    }
  }
  
  return Math.max(score, 0.0);
}

function calculateAgeScore(subject, comp) {
  if (!subject.yearBuilt || !comp.yearBuilt) {
    return 0.5; // Default middle score if we don't have age data
  }
  
  const ageDiff = Math.abs(subject.yearBuilt - comp.yearBuilt);
  
  if (ageDiff <= 5) {
    return 1.0;
  } else if (ageDiff <= 10) {
    return 0.8;
  } else if (ageDiff <= 20) {
    return 0.6;
  } else if (ageDiff <= 30) {
    return 0.4;
  } else {
    return 0.2;
  }
}

function calculateFeatureScore(subject, comp) {
  // For this simplified implementation, we'll use property type as the main feature
  if (subject.propertyType === comp.propertyType) {
    return 1.0;
  } else {
    // Different property types are less similar
    return 0.3;
  }
}

function generateAdjustments(subject, comp) {
  const adjustments = {};
  
  // Size adjustment
  if (subject.buildingSize && comp.buildingSize) {
    const subjectSize = parseFloat(subject.buildingSize);
    const compSize = parseFloat(comp.buildingSize);
    
    if (!isNaN(subjectSize) && !isNaN(compSize)) {
      const sizeDiff = subjectSize - compSize;
      if (Math.abs(sizeDiff) > 0) {
        // Assume $100 per square foot adjustment
        adjustments.buildingSize = Math.round(sizeDiff * 100);
      }
    }
  }
  
  // Bedroom adjustment
  if (subject.bedrooms && comp.bedrooms) {
    const bedroomDiff = subject.bedrooms - comp.bedrooms;
    if (bedroomDiff !== 0) {
      // Assume $5,000 per bedroom
      adjustments.bedrooms = bedroomDiff * 5000;
    }
  }
  
  // Bathroom adjustment
  if (subject.bathrooms && comp.bathrooms) {
    const bathroomDiff = subject.bathrooms - comp.bathrooms;
    if (bathroomDiff !== 0) {
      // Assume $7,500 per bathroom
      adjustments.bathrooms = bathroomDiff * 7500;
    }
  }
  
  // Age adjustment
  if (subject.yearBuilt && comp.yearBuilt) {
    const ageDiff = subject.yearBuilt - comp.yearBuilt;
    if (Math.abs(ageDiff) > 5) {
      // Assume $1,000 per year of age difference beyond 5 years
      adjustments.age = (ageDiff > 5 ? ageDiff - 5 : ageDiff + 5) * 1000;
    }
  }
  
  return adjustments;
}

/**
 * Run the quality control reviewer agent to check report accuracy
 * @param {Object} data - Report data to review
 * @param {Object} options - Agent options
 * @returns {Promise<Object>} - QC review results
 */
async function runQCReviewer(data, options) {
  console.log('Running QC reviewer agent...');
  
  try {
    const { report, properties, comparables } = data;
    
    if (!report || !properties || !comparables) {
      throw new Error('Invalid input data format');
    }
    
    // Check for completeness
    const completenessResults = {
      propertyDescriptionComplete: reportHasMinimalDescription(report),
      propertyFeaturesComplete: report.propertyFeatures && Object.keys(report.propertyFeatures).length >= 5,
      comparablesAdequate: comparables.length >= 3,
      photosAdequate: report.photos && report.photos.length >= 4,
      valuesJustified: !!report.valueJustification && report.valueJustification.length >= 100
    };
    
    // Check for calculations correctness
    const calculationsResults = {
      adjustmentsConsistent: true, // In a real implementation, this would analyze adjustment patterns
      mathAccurate: true, // In a real implementation, this would check the calculations
      priceInMarketRange: true // In a real implementation, this would check against market data
    };
    
    // Check for compliance with guidelines
    const complianceResults = {
      meetsStandards: true,
      followsMethodology: true,
      datesCurrent: report.effectiveDate && (new Date(report.effectiveDate) <= new Date())
    };
    
    // Generate a list of issues that need to be fixed
    const issues = [];
    
    // Completeness issues
    if (!completenessResults.propertyDescriptionComplete) {
      issues.push({ severity: 'high', type: 'completeness', message: 'Property description needs more detail' });
    }
    
    if (!completenessResults.propertyFeaturesComplete) {
      issues.push({ severity: 'medium', type: 'completeness', message: 'Add more property features' });
    }
    
    if (!completenessResults.comparablesAdequate) {
      issues.push({ severity: 'high', type: 'completeness', message: 'Need at least 3 comparables' });
    }
    
    if (!completenessResults.photosAdequate) {
      issues.push({ severity: 'medium', type: 'completeness', message: 'Need more property photos' });
    }
    
    if (!completenessResults.valuesJustified) {
      issues.push({ severity: 'high', type: 'completeness', message: 'Value conclusion needs better justification' });
    }
    
    // Compliance issues
    if (!complianceResults.meetsStandards) {
      issues.push({ severity: 'high', type: 'compliance', message: 'Report does not meet standards' });
    }
    
    if (!complianceResults.followsMethodology) {
      issues.push({ severity: 'medium', type: 'compliance', message: 'Report does not follow prescribed methodology' });
    }
    
    if (!complianceResults.datesCurrent) {
      issues.push({ severity: 'high', type: 'compliance', message: 'Report dates are not current' });
    }
    
    // Calculate overall QC score
    const qcScore = calculateQcScore({
      completeness: completenessResults,
      calculations: calculationsResults,
      compliance: complianceResults
    });
    
    // Determine approval status based on QC score and high-severity issues
    const highSeverityIssues = issues.filter(issue => issue.severity === 'high');
    const approvalStatus = qcScore >= 0.9 && highSeverityIssues.length === 0 ? 'approved' : 'needs_revision';
    
    return {
      score: qcScore,
      status: approvalStatus,
      completeness: completenessResults,
      calculations: calculationsResults,
      compliance: complianceResults,
      issues,
      reviewDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in QC reviewer agent:', error);
    return {
      error: error.message,
      score: 0,
      status: 'error',
      issues: [{ severity: 'high', type: 'system', message: `System error: ${error.message}` }],
      reviewDate: new Date().toISOString()
    };
  }
}

function reportHasMinimalDescription(report) {
  if (!report.description) {
    return false;
  }
  
  // Check length
  if (report.description.length < 200) {
    return false;
  }
  
  // Check for key sections
  const requiredKeywords = [
    'property', 'location', 'condition', 'bedroom', 'bathroom', 'kitchen'
  ];
  
  const descLower = report.description.toLowerCase();
  const missingKeywords = requiredKeywords.filter(keyword => !descLower.includes(keyword));
  
  return missingKeywords.length <= 1; // Allow one missing keyword
}

function calculateQcScore(reviewResults) {
  // Convert boolean results to scores
  const completenessValues = Object.values(reviewResults.completeness);
  const completenessScore = completenessValues.filter(Boolean).length / completenessValues.length;
  
  const calculationsValues = Object.values(reviewResults.calculations);
  const calculationsScore = calculationsValues.filter(Boolean).length / calculationsValues.length;
  
  const complianceValues = Object.values(reviewResults.compliance);
  const complianceScore = complianceValues.filter(Boolean).length / complianceValues.length;
  
  // Weight the scores
  const weightedScore = (
    completenessScore * 0.4 +
    calculationsScore * 0.3 +
    complianceScore * 0.3
  );
  
  return Math.round(weightedScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Run the market analyzer agent to assess market conditions
 * @param {Object} data - Market data to analyze
 * @param {Object} options - Agent options
 * @returns {Promise<Object>} - Market analysis results
 */
async function runMarketAnalyzer(data, options) {
  console.log('Running market analyzer agent...');
  
  try {
    const { location, salesData, timeframe = 12 } = data;
    
    if (!location || !salesData) {
      throw new Error('Invalid input data format');
    }
    
    // Calculate market metrics
    const metrics = calculateMarketMetrics(salesData);
    
    // Analyze market trends
    const trends = analyzeMarketTrends(salesData, timeframe);
    
    // Assess market conditions
    const conditions = assessMarketConditions(metrics, trends);
    
    // Generate market summary
    const summary = generateMarketSummary(location, metrics, conditions);
    
    return {
      location,
      metrics,
      trends,
      conditions,
      summary,
      analysisDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in market analyzer agent:', error);
    return {
      error: error.message,
      metrics: {},
      trends: {},
      conditions: {},
      summary: 'Unable to analyze market due to an error: ' + error.message,
      analysisDate: new Date().toISOString()
    };
  }
}

function calculateMarketMetrics(salesData) {
  // Extract prices
  const prices = salesData.map(sale => sale.price).filter(price => !isNaN(price));
  
  // Bail out if no valid prices
  if (prices.length === 0) {
    return {
      count: 0,
      avgPrice: 0,
      medianPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      avgDaysOnMarket: 0
    };
  }
  
  // Sort prices for median calculation
  const sortedPrices = [...prices].sort((a, b) => a - b);
  
  // Calculate median price
  const middle = Math.floor(sortedPrices.length / 2);
  const medianPrice = sortedPrices.length % 2 === 0
    ? (sortedPrices[middle - 1] + sortedPrices[middle]) / 2
    : sortedPrices[middle];
  
  // Calculate days on market
  const daysOnMarket = salesData
    .map(sale => sale.daysOnMarket)
    .filter(days => !isNaN(days));
  
  const avgDaysOnMarket = daysOnMarket.length > 0
    ? Math.round(daysOnMarket.reduce((sum, days) => sum + days, 0) / daysOnMarket.length)
    : 0;
  
  return {
    count: prices.length,
    avgPrice: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
    medianPrice: Math.round(medianPrice),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    avgDaysOnMarket
  };
}

function analyzeMarketTrends(salesData, timeframe) {
  // Group sales by month
  const salesByMonth = {};
  
  salesData.forEach(sale => {
    const date = new Date(sale.date);
    if (!isNaN(date.getTime())) {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!salesByMonth[monthKey]) {
        salesByMonth[monthKey] = [];
      }
      
      salesByMonth[monthKey].push(sale);
    }
  });
  
  // Calculate monthly averages
  const monthlyAverages = {};
  Object.entries(salesByMonth).forEach(([month, sales]) => {
    const prices = sales.map(sale => sale.price).filter(price => !isNaN(price));
    
    if (prices.length > 0) {
      monthlyAverages[month] = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
    }
  });
  
  // Sort months chronologically
  const sortedMonths = Object.keys(monthlyAverages).sort();
  
  // Need at least 2 months of data for trend calculation
  if (sortedMonths.length < 2) {
    return {
      priceChange: 0,
      percentChange: 0,
      daysOnMarketChange: 0,
      inventoryChange: 0,
      trend: 'Insufficient data'
    };
  }
  
  // Calculate price change from oldest to newest month
  const oldestMonth = sortedMonths[0];
  const newestMonth = sortedMonths[sortedMonths.length - 1];
  
  const oldestAvg = monthlyAverages[oldestMonth];
  const newestAvg = monthlyAverages[newestMonth];
  
  const priceChange = newestAvg - oldestAvg;
  const percentChange = oldestAvg > 0 ? (priceChange / oldestAvg) * 100 : 0;
  
  // In a real implementation, we would calculate these from actual data
  // For this example, we'll simulate these based on price trend
  const daysOnMarketChange = -1 * Math.sign(priceChange) * Math.min(Math.abs(percentChange) * 0.5, 15);
  const inventoryChange = -1 * Math.sign(priceChange) * Math.min(Math.abs(percentChange) * 0.3, 10);
  
  // Determine trend direction
  let trend;
  if (percentChange > 5) {
    trend = 'Strong growth';
  } else if (percentChange > 2) {
    trend = 'Moderate growth';
  } else if (percentChange >= -2) {
    trend = 'Stable';
  } else if (percentChange >= -5) {
    trend = 'Slight decline';
  } else {
    trend = 'Significant decline';
  }
  
  return {
    priceChange,
    percentChange: Math.round(percentChange * 10) / 10, // Round to 1 decimal place
    daysOnMarketChange: Math.round(daysOnMarketChange),
    inventoryChange: Math.round(inventoryChange),
    trend
  };
}

function assessMarketConditions(metrics, trends) {
  // Determine market type
  let marketType;
  if (trends.percentChange > 8 && trends.daysOnMarketChange < -10) {
    marketType = 'Hot Seller\'s Market';
  } else if (trends.percentChange > 3 && trends.daysOnMarketChange < 0) {
    marketType = 'Seller\'s Market';
  } else if (trends.percentChange > -3 && trends.percentChange <= 3) {
    marketType = 'Balanced Market';
  } else if (trends.percentChange > -8) {
    marketType = 'Buyer\'s Market';
  } else {
    marketType = 'Strong Buyer\'s Market';
  }
  
  // Determine demand level
  let demand;
  if (metrics.avgDaysOnMarket < 30 && trends.daysOnMarketChange < 0) {
    demand = 'Very Strong';
  } else if (metrics.avgDaysOnMarket < 45 && trends.daysOnMarketChange <= 0) {
    demand = 'Strong';
  } else if (metrics.avgDaysOnMarket < 60) {
    demand = 'Moderate';
  } else if (metrics.avgDaysOnMarket < 90) {
    demand = 'Weak';
  } else {
    demand = 'Very Weak';
  }
  
  // Determine price trend
  let priceDirection;
  if (trends.percentChange > 8) {
    priceDirection = 'Rising Rapidly';
  } else if (trends.percentChange > 2) {
    priceDirection = 'Rising';
  } else if (trends.percentChange >= -2) {
    priceDirection = 'Stable';
  } else if (trends.percentChange >= -8) {
    priceDirection = 'Declining';
  } else {
    priceDirection = 'Declining Rapidly';
  }
  
  // Determine overall condition
  const overall = getOverallCondition(marketType, demand, priceDirection);
  
  return {
    marketType,
    demand,
    priceDirection,
    overall
  };
}

function getOverallCondition(marketType, demand, priceDirection) {
  // Weighted scoring system for overall condition
  let score = 0;
  
  // Market type score
  if (marketType.includes('Hot Seller')) score += 5;
  else if (marketType.includes('Seller')) score += 4;
  else if (marketType.includes('Balanced')) score += 3;
  else if (marketType.includes('Buyer')) score += 2;
  else score += 1;
  
  // Demand score
  if (demand === 'Very Strong') score += 5;
  else if (demand === 'Strong') score += 4;
  else if (demand === 'Moderate') score += 3;
  else if (demand === 'Weak') score += 2;
  else score += 1;
  
  // Price direction score
  if (priceDirection === 'Rising Rapidly') score += 5;
  else if (priceDirection === 'Rising') score += 4;
  else if (priceDirection === 'Stable') score += 3;
  else if (priceDirection === 'Declining') score += 2;
  else score += 1;
  
  // Convert score to condition
  const avgScore = score / 3;
  
  if (avgScore > 4.5) return 'Excellent';
  if (avgScore > 3.5) return 'Good';
  if (avgScore > 2.5) return 'Fair';
  if (avgScore > 1.5) return 'Challenging';
  return 'Difficult';
}

function generateMarketSummary(location, metrics, conditions) {
  const { city, state, zipCode } = location;
  const { avgPrice, medianPrice, avgDaysOnMarket } = metrics;
  const { marketType, demand, priceDirection, overall } = conditions;
  
  const locationString = zipCode ? `${city}, ${state} ${zipCode}` : `${city}, ${state}`;
  
  return `The ${locationString} real estate market is currently a ${marketType} with ${demand.toLowerCase()} buyer demand. 
Property values are ${priceDirection.toLowerCase()}, with an average price of ${formatCurrency(avgPrice)} and a median price of ${formatCurrency(medianPrice)}. 
The average property spends ${avgDaysOnMarket} days on the market before selling. 
Overall market conditions are ${overall.toLowerCase()}.`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Export the main API functions
export {
  initializeAgents,
  runAgent,
  runDataValidator,
  runCompSelector,
  runQCReviewer,
  runMarketAnalyzer
};