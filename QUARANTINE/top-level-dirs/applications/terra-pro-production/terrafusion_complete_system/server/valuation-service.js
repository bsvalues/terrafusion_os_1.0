/**
 * Terrafusion AI Valuation Service - Node.js Implementation
 * This implements a Node.js version of the valuation endpoint that was
 * previously implemented in Python. This allows us to avoid cross-server
 * communication issues.
 */

// Mock database for properties (equivalent to the Python implementation)
const PROPERTY_DB = {
  1: {
    address: {
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      zipCode: "90210",
    },
    propertyType: "single-family",
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 2100,
    yearBuilt: 1985,
    lotSize: 0.25,
    features: [{ name: "Hardwood Floors" }, { name: "Fireplace" }],
    condition: "Good",
  },
  2: {
    address: {
      street: "456 Oak Ave",
      city: "Somewhere",
      state: "TX",
      zipCode: "75001",
    },
    propertyType: "townhouse",
    bedrooms: 2,
    bathrooms: 1.5,
    squareFeet: 1500,
    yearBuilt: 2005,
    lotSize: 0.1,
    features: [{ name: "Updated Kitchen" }],
    condition: "Excellent",
  },
};

// Property type adjustment factors
const propertyTypeFactors = {
  "single-family": 1.0,
  condo: 0.85,
  townhouse: 0.9,
  "multi-family": 1.2,
  land: 0.7,
};

// Condition factors
const conditionFactors = {
  Excellent: 1.15,
  Good: 1.0,
  Average: 0.9,
  Fair: 0.75,
  Poor: 0.6,
};

// Feature values
const featureValues = {
  "Hardwood Floors": 5000,
  "Updated Kitchen": 15000,
  Fireplace: 3000,
  Deck: 5000,
  "Swimming Pool": 20000,
  Garage: 10000,
  "Central AC": 7000,
  "New Roof": 8000,
};

/**
 * Predict the value of a property based on its characteristics
 */
function predictValue(propertyData) {
  console.log(`Predicting value for property: ${propertyData.address?.street || "Unknown"}`);

  // Base valuation using heuristics
  const base = 100000; // base heuristic

  // Get property type factor
  const typeFactor = propertyTypeFactors[propertyData.propertyType] || 1.0;

  // Get condition factor
  const conditionFactor = conditionFactors[propertyData.condition] || 1.0;

  // Get square feet factor
  const sizeFactor = propertyData.squareFeet ? propertyData.squareFeet / 1000 : 1.0;

  // Calculate special feature adjustments
  let featureBonus = 0;
  if (Array.isArray(propertyData.features)) {
    featureBonus = propertyData.features.reduce((sum, feature) => {
      const featureName = typeof feature === "string" ? feature : feature.name;
      return sum + (featureValues[featureName] || 0);
    }, 0);
  }

  // Calculate final estimated value
  const estimated = base * typeFactor * conditionFactor * sizeFactor + featureBonus;

  return Math.round(estimated * 100) / 100;
}

/**
 * Generate a basic market analysis narrative
 */
function generateMarketAnalysis(propertyData) {
  const city = propertyData.address?.city || "the area";
  const state = propertyData.address?.state || "";

  return (
    `The real estate market in ${city}, ${state} has been showing moderate growth. ` +
    `Properties similar to this one have been in demand, with average days on market ` +
    `of 35 days. Current interest rates and inventory levels suggest a balanced market ` +
    `for this property type.`
  );
}

/**
 * Generate adjustment details for the valuation
 */
function generateAdjustments(propertyData) {
  const adjustments = [];

  // Property type adjustment
  const propType = propertyData.propertyType;
  if (propType && propertyTypeFactors[propType]) {
    const factor = propertyTypeFactors[propType];
    if (factor !== 1.0) {
      adjustments.push({
        factor: "Property Type",
        description: `Property type: ${propType}`,
        amount: Math.round((factor - 1.0) * 100000 * 100) / 100,
        reasoning: `${propType.charAt(0).toUpperCase() + propType.slice(1)} properties have different base values`,
      });
    }
  }

  // Condition adjustment
  const condition = propertyData.condition;
  if (condition && conditionFactors[condition]) {
    const factor = conditionFactors[condition];
    if (factor !== 1.0) {
      adjustments.push({
        factor: "Condition",
        description: `Property condition: ${condition}`,
        amount: Math.round((factor - 1.0) * 100000 * 100) / 100,
        reasoning: `Property in ${condition} condition affects base value`,
      });
    }
  }

  // Feature adjustments
  const features = propertyData.features || [];
  if (Array.isArray(features)) {
    features.forEach((feature) => {
      // Handle both string features and object features with a name field
      const featureName = typeof feature === "string" ? feature : feature.name;
      const value = featureValues[featureName] || 0;

      if (value > 0) {
        adjustments.push({
          factor: "Special Feature",
          description: featureName,
          amount: value,
          reasoning: `${featureName} adds value to the property`,
        });
      }
    });
  }

  return adjustments;
}

/**
 * Generate a comprehensive valuation report for a property
 */
function generateValuationReport(propertyData) {
  // Get the estimated value
  const estimatedValue = predictValue(propertyData);

  // Generate confidence level (simple implementation)
  let confidenceLevel = "medium";
  if (propertyData.condition && propertyData.squareFeet) {
    confidenceLevel = "high";
  } else if (!propertyData.condition || !propertyData.squareFeet) {
    confidenceLevel = "low";
  }

  // Calculate value range based on confidence
  let rangePercent = 0.1; // default: medium confidence = ±10%
  if (confidenceLevel === "high") {
    rangePercent = 0.05; // ±5%
  } else if (confidenceLevel === "low") {
    rangePercent = 0.15; // ±15%
  }

  const minValue = estimatedValue * (1 - rangePercent);
  const maxValue = estimatedValue * (1 + rangePercent);

  // Generate adjustments
  const adjustments = generateAdjustments(propertyData);

  // Generate market analysis
  const marketAnalysis = generateMarketAnalysis(propertyData);

  // Generate the report
  return {
    estimatedValue,
    confidenceLevel,
    valueRange: {
      min: Math.round(minValue * 100) / 100,
      max: Math.round(maxValue * 100) / 100,
    },
    adjustments,
    marketAnalysis,
    valuationMethodology: "ML-Enhanced Heuristic Model",
    modelVersion: "1.0.0",
    timestamp: new Date().toISOString(),
  };
}

// Export as ES modules
export const getPropertyById = (id) => PROPERTY_DB[id];
export { generateValuationReport, predictValue };
