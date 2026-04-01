/**
 * Risk Assessment Engine
 * 
 * Advanced service for evaluating various risk factors affecting property values.
 * This includes regulatory risks, market risks, environmental risks, and more.
 * The engine provides quantitative risk scores along with confidence metrics.
 */

import { IStorage } from '../storage';
import { LLMService } from './llm-service';

export interface RiskFactor {
  category: string;
  name: string;
  score: number; // 0-100, higher = more risky
  impact: 'low' | 'medium' | 'high' | 'very-high';
  likelihood: 'unlikely' | 'possible' | 'likely' | 'very-likely';
  description: string;
  mitigationStrategies?: string[];
}

export interface RiskAssessment {
  propertyId: string;
  overallRiskScore: number; // 0-100
  confidenceScore: number; // 0-1
  riskFactors: RiskFactor[];
  riskCategories: {
    [category: string]: {
      score: number;
      factors: number;
    }
  };
  assessmentDate: Date;
  recommendations: string[];
}

export interface RegulatoryFramework {
  region: string;
  zoningRegulations: any[];
  buildingCodes: any[];
  environmentalRegulations: any[];
  taxPolicies: any[];
  lastUpdated: Date;
}

export class RiskAssessmentEngine {
  private storage: IStorage;
  private llmService: LLMService | null = null;
  
  // Cache for regulatory frameworks
  private regulatoryCache: Map<string, { data: RegulatoryFramework, timestamp: Date }> = new Map();
  
  constructor(storage: IStorage, llmService?: LLMService) {
    this.storage = storage;
    
    if (llmService) {
      this.llmService = llmService;
    } else {
      // Create a default LLM service if none provided
      this.llmService = new LLMService({
        defaultProvider: 'openai',
        defaultModels: {
          openai: 'gpt-4o',
          anthropic: 'claude-3-opus-20240229'
        }
      });
    }
  }
  
  /**
   * Assess risks for a specific property
   */
  public async assessPropertyRisks(propertyId: string): Promise<RiskAssessment> {
    // Get property data
    const property = await this.storage.getPropertyByPropertyId(propertyId);
    if (!property) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }
    
    // Get property-specific data
    const landRecords = await this.storage.getLandRecordsByPropertyId(propertyId);
    const improvements = await this.storage.getImprovementsByPropertyId(propertyId);
    
    // Get region-specific data
    const regulatoryFramework = await this.getRegulatoryFramework(property.region || 'unknown');
    
    // Get environmental risk data if available
    const environmentalRisks = await this.getEnvironmentalRisks(property);
    
    // Analyze market risks
    const marketRisks = await this.analyzeMarketRisks(property);
    
    // Analyze property-specific risks
    const propertyRisks = await this.analyzePropertyRisks(property, improvements);
    
    // Analyze regulatory risks
    const regulatoryRisks = await this.analyzeRegulatoryRisks(property, regulatoryFramework);
    
    // Analyze environmental risks
    const environmentalRiskFactors = await this.analyzeEnvironmentalRisks(
      property, 
      environmentalRisks
    );
    
    // Compile all risk factors
    const allRiskFactors = [
      ...marketRisks,
      ...propertyRisks,
      ...regulatoryRisks,
      ...environmentalRiskFactors
    ];
    
    // Calculate overall risk score (weighted average)
    const weights = {
      'Market': 0.3,
      'Property': 0.25,
      'Regulatory': 0.25,
      'Environmental': 0.2
    };
    
    // Group by category and calculate weighted scores
    const riskCategories = {};
    let weightedScoreSum = 0;
    let totalWeight = 0;
    
    for (const [category, weight] of Object.entries(weights)) {
      // Get factors for this category
      const categoryFactors = allRiskFactors.filter(f => f.category === category);
      
      if (categoryFactors.length > 0) {
        // Calculate average score for this category
        const categoryScore = categoryFactors.reduce((sum, f) => sum + f.score, 0) / categoryFactors.length;
        
        // Add to weighted sum
        weightedScoreSum += categoryScore * weight;
        totalWeight += weight;
        
        // Save category details
        riskCategories[category] = {
          score: categoryScore,
          factors: categoryFactors.length
        };
      }
    }
    
    // Calculate final score
    const overallRiskScore = Math.round(weightedScoreSum / totalWeight);
    
    // Generate recommendations
    const recommendations = await this.generateRiskMitigationRecommendations(
      property,
      allRiskFactors,
      overallRiskScore
    );
    
    // Construct assessment result
    const assessment: RiskAssessment = {
      propertyId,
      overallRiskScore,
      confidenceScore: this.calculateConfidenceScore(allRiskFactors),
      riskFactors: allRiskFactors,
      riskCategories,
      assessmentDate: new Date(),
      recommendations
    };
    
    return assessment;
  }
  
  /**
   * Get the regulatory framework for a region
   */
  public async getRegulatoryFramework(region: string): Promise<RegulatoryFramework> {
    // Check cache first
    const cacheKey = `regulatory_${region}`;
    const cachedData = this.regulatoryCache.get(cacheKey);
    
    // If we have cached data less than 24 hours old, use it
    if (cachedData && (new Date().getTime() - cachedData.timestamp.getTime()) < 86400000) {
      return cachedData.data;
    }
    
    // Try to fetch from storage
    try {
      const storedFramework = await this.storage.getRegulatoryFramework(region);
      
      if (storedFramework) {
        // Cache the results
        this.regulatoryCache.set(cacheKey, {
          data: storedFramework,
          timestamp: new Date()
        });
        
        return storedFramework;
      }
    } catch (error) {
      console.warn(`Error fetching regulatory framework from storage: ${error.message}`);
    }
    
    // If no stored data, create a placeholder framework (in production this would come from a regulatory API)
    const framework: RegulatoryFramework = {
      region,
      zoningRegulations: [
        {
          code: 'R-1',
          description: 'Single Family Residential',
          restrictions: {
            minLotSize: '7,500 sq ft',
            maxHeight: '35 ft',
            setbacks: {
              front: '20 ft',
              side: '5 ft',
              rear: '20 ft'
            }
          }
        },
        {
          code: 'C-1',
          description: 'Neighborhood Commercial',
          restrictions: {
            maxHeight: '45 ft',
            setbacks: {
              front: '10 ft',
              side: '5 ft',
              rear: '15 ft'
            }
          }
        }
      ],
      buildingCodes: [
        {
          code: 'IBC-2021',
          description: 'International Building Code 2021',
          applicability: 'All commercial structures'
        },
        {
          code: 'IRC-2021',
          description: 'International Residential Code 2021',
          applicability: 'All residential structures'
        }
      ],
      environmentalRegulations: [
        {
          code: 'FEMA-FP',
          description: 'FEMA Floodplain Regulations',
          requirements: 'Elevated structures in flood zones, special permits'
        },
        {
          code: 'WET-1',
          description: 'Wetlands Protection',
          requirements: 'No development within 100ft of designated wetlands'
        }
      ],
      taxPolicies: [
        {
          code: 'PROP-TAX',
          description: 'Property Tax Rate',
          rate: '1.2% of assessed value',
          reassessment: 'Every 2 years'
        },
        {
          code: 'TRAN-TAX',
          description: 'Transfer Tax',
          rate: '0.5% of sale price'
        }
      ],
      lastUpdated: new Date()
    };
    
    // Cache the results
    this.regulatoryCache.set(cacheKey, {
      data: framework,
      timestamp: new Date()
    });
    
    return framework;
  }
  
  /**
   * Get historical regulatory changes for a region
   */
  public async getHistoricalRegulatoryChanges(region: string): Promise<any[]> {
    // Try to fetch from storage
    try {
      const storedChanges = await this.storage.getHistoricalRegulatoryChanges(region);
      
      if (storedChanges && storedChanges.length > 0) {
        return storedChanges;
      }
    } catch (error) {
      console.warn(`Error fetching historical regulatory changes: ${error.message}`);
    }
    
    // If no stored data, create placeholder data (in production this would come from a regulatory database)
    const currentYear = new Date().getFullYear();
    const changes = [
      {
        year: currentYear - 5,
        description: 'Updated zoning regulations for downtown area',
        impact: 'Increased density and mixed-use development',
        category: 'Zoning'
      },
      {
        year: currentYear - 3,
        description: 'New environmental impact assessment requirements',
        impact: 'Extended approval timelines for large developments',
        category: 'Environmental'
      },
      {
        year: currentYear - 2,
        description: 'Property tax rate increase',
        impact: '0.2% increase in property tax rates',
        category: 'Taxation'
      },
      {
        year: currentYear - 1,
        description: 'Updated building codes for energy efficiency',
        impact: 'Higher standards for insulation and HVAC systems',
        category: 'Building Codes'
      }
    ];
    
    return changes;
  }
  
  /**
   * Private: Get environmental risks for a property
   */
  private async getEnvironmentalRisks(property: any): Promise<any> {
    // Try to fetch from storage
    try {
      const storedRisks = await this.storage.getEnvironmentalRisks(property.propertyId);
      
      if (storedRisks) {
        return storedRisks;
      }
    } catch (error) {
      console.warn(`Error fetching environmental risks: ${error.message}`);
    }
    
    // If no stored data, create placeholder risk data (in production, this would come from environmental APIs)
    return {
      floodRisk: {
        zone: 'X',
        description: 'Minimal flood risk',
        score: 15
      },
      earthquakeRisk: {
        zone: 'Low',
        description: 'Low seismic activity area',
        score: 10
      },
      wildfireRisk: {
        zone: 'Moderate',
        description: 'Some wildfire risk in dry seasons',
        score: 40
      },
      soilStability: {
        condition: 'Stable',
        description: 'No known soil stability issues',
        score: 5
      }
    };
  }
  
  /**
   * Private: Analyze market risks
   */
  private async analyzeMarketRisks(property: any): Promise<RiskFactor[]> {
    const marketRisks: RiskFactor[] = [];
    
    // Market volatility risk
    marketRisks.push({
      category: 'Market',
      name: 'Market Volatility',
      score: 45,
      impact: 'medium',
      likelihood: 'possible',
      description: 'Moderate market fluctuations expected based on historical trends'
    });
    
    // Interest rate risk
    marketRisks.push({
      category: 'Market',
      name: 'Interest Rate Increases',
      score: 65,
      impact: 'high',
      likelihood: 'likely',
      description: 'Expected interest rate increases could reduce buyer demand'
    });
    
    // Supply-demand imbalance
    marketRisks.push({
      category: 'Market',
      name: 'Supply-Demand Imbalance',
      score: 40,
      impact: 'medium',
      likelihood: 'possible',
      description: 'Current inventory levels suggest moderate supply-demand balance'
    });
    
    // Economic downturn risk
    marketRisks.push({
      category: 'Market',
      name: 'Economic Recession',
      score: 55,
      impact: 'high',
      likelihood: 'possible',
      description: 'Moderate risk of economic downturn affecting property values'
    });
    
    return marketRisks;
  }
  
  /**
   * Private: Analyze property-specific risks
   */
  private async analyzePropertyRisks(property: any, improvements: any[]): Promise<RiskFactor[]> {
    const propertyRisks: RiskFactor[] = [];
    
    // Age-related risk
    let ageScore = 20; // Default
    let ageDescription = 'Property age related risks are minimal';
    let ageImpact: 'low' | 'medium' | 'high' | 'very-high' = 'low';
    let ageLikelihood: 'unlikely' | 'possible' | 'likely' | 'very-likely' = 'unlikely';
    
    if (property.yearBuilt) {
      const age = new Date().getFullYear() - parseInt(property.yearBuilt);
      
      if (age > 50) {
        ageScore = 75;
        ageDescription = 'Older property with significant age-related maintenance risks';
        ageImpact = 'high';
        ageLikelihood = 'likely';
      } else if (age > 30) {
        ageScore = 60;
        ageDescription = 'Aging property with moderate maintenance needs';
        ageImpact = 'medium';
        ageLikelihood = 'likely';
      } else if (age > 15) {
        ageScore = 40;
        ageDescription = 'Some components may need replacement soon';
        ageImpact = 'medium';
        ageLikelihood = 'possible';
      }
    }
    
    propertyRisks.push({
      category: 'Property',
      name: 'Age-Related Deterioration',
      score: ageScore,
      impact: ageImpact,
      likelihood: ageLikelihood,
      description: ageDescription
    });
    
    // Maintenance risk
    propertyRisks.push({
      category: 'Property',
      name: 'Deferred Maintenance',
      score: 35,
      impact: 'medium',
      likelihood: 'possible',
      description: 'Some maintenance items may affect property value if not addressed'
    });
    
    // Property type risk
    let typeScore = 30;
    let typeDescription = 'Standard property type with average market liquidity';
    
    if (property.propertyType === 'Commercial') {
      typeScore = 45;
      typeDescription = 'Commercial properties face some additional market constraints';
    } else if (property.propertyType === 'Industrial') {
      typeScore = 55;
      typeDescription = 'Industrial properties have more limited buyer pools';
    } else if (property.propertyType === 'Special Purpose') {
      typeScore = 70;
      typeDescription = 'Special purpose properties have very limited buyer pools';
    }
    
    propertyRisks.push({
      category: 'Property',
      name: 'Property Type Marketability',
      score: typeScore,
      impact: typeScore > 50 ? 'high' : 'medium',
      likelihood: typeScore > 60 ? 'likely' : 'possible',
      description: typeDescription
    });
    
    return propertyRisks;
  }
  
  /**
   * Private: Analyze regulatory risks
   */
  private async analyzeRegulatoryRisks(
    property: any, 
    regulatoryFramework: RegulatoryFramework
  ): Promise<RiskFactor[]> {
    const regulatoryRisks: RiskFactor[] = [];
    
    // Zoning change risk
    regulatoryRisks.push({
      category: 'Regulatory',
      name: 'Zoning Changes',
      score: 40,
      impact: 'medium',
      likelihood: 'possible',
      description: 'Potential for zoning regulations to change affecting property use',
      mitigationStrategies: [
        'Monitor local planning commission activities',
        'Participate in community development discussions'
      ]
    });
    
    // Building code risk
    regulatoryRisks.push({
      category: 'Regulatory',
      name: 'Building Code Updates',
      score: 35,
      impact: 'medium',
      likelihood: 'possible',
      description: 'Building code updates may require modifications for future renovations',
      mitigationStrategies: [
        'Stay informed of code update schedules',
        'Plan for retrofits during normal maintenance cycles'
      ]
    });
    
    // Tax policy risk
    regulatoryRisks.push({
      category: 'Regulatory',
      name: 'Property Tax Increases',
      score: 55,
      impact: 'high',
      likelihood: 'likely',
      description: 'Historical trends suggest continued property tax increases',
      mitigationStrategies: [
        'Budget for expected increases',
        'Consider tax appeal if assessment seems inaccurate'
      ]
    });
    
    return regulatoryRisks;
  }
  
  /**
   * Private: Analyze environmental risks
   */
  private async analyzeEnvironmentalRisks(
    property: any, 
    environmentalRisks: any
  ): Promise<RiskFactor[]> {
    const risks: RiskFactor[] = [];
    
    // Flood risk
    if (environmentalRisks.floodRisk) {
      risks.push({
        category: 'Environmental',
        name: 'Flood Risk',
        score: environmentalRisks.floodRisk.score,
        impact: this.scoreToImpact(environmentalRisks.floodRisk.score),
        likelihood: this.scoreToLikelihood(environmentalRisks.floodRisk.score),
        description: `Flood zone ${environmentalRisks.floodRisk.zone}: ${environmentalRisks.floodRisk.description}`,
        mitigationStrategies: [
          'Maintain flood insurance',
          'Consider flood-proofing measures'
        ]
      });
    }
    
    // Earthquake risk
    if (environmentalRisks.earthquakeRisk) {
      risks.push({
        category: 'Environmental',
        name: 'Earthquake Risk',
        score: environmentalRisks.earthquakeRisk.score,
        impact: this.scoreToImpact(environmentalRisks.earthquakeRisk.score),
        likelihood: this.scoreToLikelihood(environmentalRisks.earthquakeRisk.score),
        description: `Seismic zone ${environmentalRisks.earthquakeRisk.zone}: ${environmentalRisks.earthquakeRisk.description}`,
        mitigationStrategies: [
          'Verify structural integrity',
          'Consider seismic retrofitting'
        ]
      });
    }
    
    // Wildfire risk
    if (environmentalRisks.wildfireRisk) {
      risks.push({
        category: 'Environmental',
        name: 'Wildfire Risk',
        score: environmentalRisks.wildfireRisk.score,
        impact: this.scoreToImpact(environmentalRisks.wildfireRisk.score),
        likelihood: this.scoreToLikelihood(environmentalRisks.wildfireRisk.score),
        description: `Wildfire zone ${environmentalRisks.wildfireRisk.zone}: ${environmentalRisks.wildfireRisk.description}`,
        mitigationStrategies: [
          'Maintain defensible space',
          'Use fire-resistant building materials'
        ]
      });
    }
    
    // Soil stability
    if (environmentalRisks.soilStability) {
      risks.push({
        category: 'Environmental',
        name: 'Soil Stability Issues',
        score: environmentalRisks.soilStability.score,
        impact: this.scoreToImpact(environmentalRisks.soilStability.score),
        likelihood: this.scoreToLikelihood(environmentalRisks.soilStability.score),
        description: environmentalRisks.soilStability.description,
        mitigationStrategies: [
          'Monitor for settlement or erosion',
          'Maintain proper drainage'
        ]
      });
    }
    
    // Climate change risk (general)
    risks.push({
      category: 'Environmental',
      name: 'Climate Change Impacts',
      score: 60,
      impact: 'high',
      likelihood: 'likely',
      description: 'Increasing severity of weather events and long-term climate changes',
      mitigationStrategies: [
        'Consider weatherization improvements',
        'Evaluate long-term sustainability'
      ]
    });
    
    return risks;
  }
  
  /**
   * Private: Generate recommendations based on risk assessment
   */
  private async generateRiskMitigationRecommendations(
    property: any,
    riskFactors: RiskFactor[],
    overallRiskScore: number
  ): Promise<string[]> {
    // Start with standard recommendations
    const recommendations: string[] = [
      'Maintain adequate property insurance coverage',
      'Develop a regular property maintenance schedule'
    ];
    
    // Add recommendations based on high-risk factors
    const highRiskFactors = riskFactors.filter(
      factor => factor.score >= 65 || factor.impact === 'high' || factor.impact === 'very-high'
    );
    
    for (const factor of highRiskFactors) {
      if (factor.mitigationStrategies && factor.mitigationStrategies.length > 0) {
        // Add specific mitigation strategies if available
        recommendations.push(...factor.mitigationStrategies);
      } else {
        // Generate a generic recommendation based on the risk factor
        recommendations.push(`Develop specific mitigation strategy for ${factor.name.toLowerCase()} risk`);
      }
    }
    
    // Add recommendations based on property type
    if (property.propertyType === 'Commercial') {
      recommendations.push('Conduct regular market analysis to assess lease rate competitiveness');
      recommendations.push('Review lease agreements to ensure balanced risk allocation');
    } else if (property.propertyType === 'Residential') {
      recommendations.push('Monitor neighborhood development patterns and property values');
      recommendations.push('Consider strategic improvements with highest ROI potential');
    }
    
    // Add recommendation based on overall risk score
    if (overallRiskScore > 70) {
      recommendations.push('Consider comprehensive risk management consultation');
      recommendations.push('Evaluate portfolio diversification to offset property-specific risks');
    } else if (overallRiskScore > 50) {
      recommendations.push('Prioritize addressing highest impact risk factors');
      recommendations.push('Schedule regular risk assessment updates');
    }
    
    // Remove duplicates and return
    return [...new Set(recommendations)];
  }
  
  /**
   * Helper: Calculate confidence score based on risk factors
   */
  private calculateConfidenceScore(riskFactors: RiskFactor[]): number {
    // Start with base confidence
    const baseConfidence = 0.85;
    
    // Calculate average risk score
    const avgRiskScore = riskFactors.reduce((sum, factor) => sum + factor.score, 0) / riskFactors.length;
    
    // Higher risk tends to decrease confidence slightly
    const riskAdjustment = -0.05 * (avgRiskScore / 50);
    
    // More risk factors increases confidence (more data points)
    const factorCountAdjustment = Math.min(0.05, 0.005 * riskFactors.length);
    
    // Calculate final confidence score
    const confidenceScore = baseConfidence + riskAdjustment + factorCountAdjustment;
    
    // Ensure confidence is between 0 and 1
    return Math.min(0.98, Math.max(0.6, confidenceScore));
  }
  
  /**
   * Helper: Convert numeric score to impact category
   */
  private scoreToImpact(score: number): 'low' | 'medium' | 'high' | 'very-high' {
    if (score >= 75) return 'very-high';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }
  
  /**
   * Helper: Convert numeric score to likelihood category
   */
  private scoreToLikelihood(score: number): 'unlikely' | 'possible' | 'likely' | 'very-likely' {
    if (score >= 75) return 'very-likely';
    if (score >= 50) return 'likely';
    if (score >= 25) return 'possible';
    return 'unlikely';
  }
}