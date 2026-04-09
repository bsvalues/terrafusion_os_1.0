/**
 * Predictive Analytics Service
 * This service provides advanced predictive analytics capabilities for permit processing
 * using machine learning techniques and historical pattern analysis.
 */

import { ChatOpenAI } from "@langchain/openai";
import { storage } from "../storage";
import { Permit } from "../../shared/schema";
import { vectorDatabaseService } from "./vectorDatabaseService";
import { specializedAgentService } from "./specializedAgentService";

// Helper function to validate OpenAI API key
async function validateApiKey(): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured.");
  }
  return true;
}

/**
 * Interface for approval prediction result
 */
export interface ApprovalPrediction {
  permitId: number;
  description: string;
  neighborhood: string;
  approvalLikelihood: string; // Percentage as string
  confidenceLevel: "Low" | "Medium" | "High";
  riskFactors: string[];
  supportingEvidence: {
    similarPermits: Array<{ id: number, description: string, decision: boolean, similarity: number }>;
    neighborhoodStats: { approvalRate: string, permitCount: number };
    keyFactors: string[];
  };
  recommendedActions: string[];
}

/**
 * Interface for historical permit patterns
 */
export interface HistoricalPatterns {
  generalTrends: {
    overallApprovalRate: string;
    trendByNeighborhood: Record<string, string>;
    trendByValueRange: Record<string, string>;
    seasonalPatterns: string[];
  };
  featuresAnalysis: {
    highestImpactFeatures: string[];
    commonApprovalFactors: string[];
    commonDenialFactors: string[];
  };
  insights: string[];
  recommendations: string[];
}

/**
 * PredictiveAnalyticsService provides advanced predictive capabilities
 * for permit processing using machine learning and pattern analysis
 */
export class PredictiveAnalyticsService {
  private readonly model = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.2,
    verbose: true
  });
  
  private permitFeatureParsers: Record<string, (description: string) => Record<string, boolean>> = {
    construction: (description: string): Record<string, boolean> => {
      const desc = description.toLowerCase();
      
      return {
        isNewConstruction: desc.includes("new construction") || desc.includes("new build"),
        isRenovation: desc.includes("renovation") || desc.includes("remodel") || desc.includes("repair"),
        isAddition: desc.includes("addition") || desc.includes("expand") || desc.includes("extension"),
        isDemolition: desc.includes("demolition") || desc.includes("demolish") || desc.includes("remove"),
        isUtility: desc.includes("utility") || desc.includes("electrical") || desc.includes("plumbing") || desc.includes("hvac"),
        isExterior: desc.includes("exterior") || desc.includes("facade") || desc.includes("siding") || desc.includes("roof"),
        isInterior: desc.includes("interior") || desc.includes("kitchen") || desc.includes("bathroom") || desc.includes("basement"),
        isCommercial: desc.includes("commercial") || desc.includes("retail") || desc.includes("office") || desc.includes("business"),
        isResidential: desc.includes("residential") || desc.includes("house") || desc.includes("home") || desc.includes("apartment")
      };
    },
    
    structure: (description: string): Record<string, boolean> => {
      const desc = description.toLowerCase();
      
      return {
        isDeck: desc.includes("deck"),
        isFence: desc.includes("fence"),
        isGarage: desc.includes("garage"),
        isPorch: desc.includes("porch"),
        isPool: desc.includes("pool"),
        isShed: desc.includes("shed") || desc.includes("storage building"),
        isDriveway: desc.includes("driveway"),
        isWalkway: desc.includes("walkway") || desc.includes("sidewalk"),
        isLandscaping: desc.includes("landscaping") || desc.includes("grading"),
        isFoundation: desc.includes("foundation"),
        isRoof: desc.includes("roof")
      };
    },
    
    complexity: (description: string): Record<string, boolean> => {
      const desc = description.toLowerCase();
      const wordCount = desc.split(/\s+/).length;
      
      return {
        isComplex: wordCount > 15 || 
                 desc.includes("variance") || 
                 desc.includes("exception") || 
                 desc.includes("special consideration"),
        isHistoric: desc.includes("historic") || 
                  desc.includes("heritage") || 
                  desc.includes("preservation"),
        hasEnvironmentalConcerns: desc.includes("environmental") || 
                                desc.includes("wetland") || 
                                desc.includes("flood plain"),
        requiresInspection: desc.includes("inspection") || 
                          desc.includes("certified") || 
                          desc.includes("engineer approval")
      };
    }
  };
  
  constructor() {
    // Initialization if needed
  }
  
  /**
   * Predict the likelihood of approval for a specific permit
   * @param permitId ID of the permit to analyze
   * @returns Detailed prediction of approval likelihood with supporting evidence
   */
  async predictApprovalLikelihood(permitId: number): Promise<ApprovalPrediction> {
    try {
      await validateApiKey();
      
      // Get the permit details
      const permit = await storage.getPermit(permitId);
      
      if (!permit) {
        throw new Error("Permit not found");
      }
      
      // Use the specialized agent to get a base prediction
      const agentPrediction = await specializedAgentService.predictApprovalLikelihood(permitId);
      
      // Find similar permits to use as evidence
      const similarPermits = await vectorDatabaseService.findNearestNeighbors(permitId, 10);
      
      // Calculate neighborhood statistics
      const neighborhoodStats = await this.calculateNeighborhoodStats(permit.neighborhoodCode);
      
      // Extract key features from the permit description
      const constructionFeatures = this.permitFeatureParsers.construction(permit.permitDescription);
      const structuralFeatures = this.permitFeatureParsers.structure(permit.permitDescription);
      const complexityFeatures = this.permitFeatureParsers.complexity(permit.permitDescription);
      
      // Identify key factors based on feature analysis
      const keyFactors: string[] = [];
      
      // Add construction factors
      if (constructionFeatures.isNewConstruction) keyFactors.push("New construction");
      if (constructionFeatures.isRenovation) keyFactors.push("Renovation/remodel");
      if (constructionFeatures.isCommercial) keyFactors.push("Commercial property");
      if (constructionFeatures.isResidential) keyFactors.push("Residential property");
      
      // Add structural factors
      if (structuralFeatures.isDeck) keyFactors.push("Deck construction");
      if (structuralFeatures.isFence) keyFactors.push("Fence installation");
      if (structuralFeatures.isPool) keyFactors.push("Swimming pool");
      
      // Add complexity factors
      if (complexityFeatures.isComplex) keyFactors.push("Complex project");
      if (complexityFeatures.isHistoric) keyFactors.push("Historic considerations");
      if (complexityFeatures.hasEnvironmentalConcerns) keyFactors.push("Environmental concerns");
      
      // Parse the likelihood from the agent's prediction or calculate based on evidence
      const likelihoodMatch = agentPrediction.predictionAnalysis.match(/(\d+\.?\d*)%/);
      const approvalLikelihood = likelihoodMatch ? likelihoodMatch[0] : "Unknown";
      
      // Parse risk factors from the agent's prediction
      const riskFactors: string[] = [];
      const riskFactorsMatch = agentPrediction.predictionAnalysis.match(/risk factors:(.*?)(?=recommendation|recommendedActions|$)/is);
      
      if (riskFactorsMatch && riskFactorsMatch[1]) {
        const factors = riskFactorsMatch[1].split(/[\n-]+/).map(f => f.trim()).filter(f => f.length > 10);
        riskFactors.push(...factors);
      }
      
      // Determine confidence level based on similar permit count and agreement
      let confidenceLevel: "Low" | "Medium" | "High" = "Medium";
      
      if (similarPermits.length >= 5) {
        const similarDecisions = similarPermits.filter(sp => sp.permit.enterPermit === permit.enterPermit);
        const agreement = similarDecisions.length / similarPermits.length;
        
        if (agreement > 0.8) {
          confidenceLevel = "High";
        } else if (agreement < 0.5) {
          confidenceLevel = "Low";
        }
      } else {
        confidenceLevel = "Low";
      }
      
      // Parse recommended actions from the agent's prediction
      const recommendedActions: string[] = [];
      const actionsMatch = agentPrediction.predictionAnalysis.match(/recommended actions:(.*?)(?=\n\n|$)/is);
      
      if (actionsMatch && actionsMatch[1]) {
        const actions = actionsMatch[1].split(/[\n-]+/).map(a => a.trim()).filter(a => a.length > 10);
        recommendedActions.push(...actions);
      }
      
      // If no actions were found, provide some default ones
      if (recommendedActions.length === 0) {
        recommendedActions.push(
          "Provide comprehensive documentation for the permit request",
          "Ensure all required fields are completed accurately",
          "Consider addressing potential risk factors before submission"
        );
      }
      
      // Create the final prediction result
      const prediction: ApprovalPrediction = {
        permitId: permit.id,
        description: permit.permitDescription,
        neighborhood: permit.neighborhoodCode,
        approvalLikelihood,
        confidenceLevel,
        riskFactors,
        supportingEvidence: {
          similarPermits: similarPermits.map(sp => ({
            id: sp.permit.id,
            description: sp.permit.permitDescription,
            decision: sp.permit.enterPermit,
            similarity: sp.similarity
          })),
          neighborhoodStats,
          keyFactors
        },
        recommendedActions
      };
      
      return prediction;
    } catch (error) {
      console.error("Failed to predict approval likelihood:", error);
      throw error;
    }
  }
  
  /**
   * Analyze historical permit patterns to identify trends and insights
   * @param uploadId Optional upload ID to limit analysis to a specific batch
   * @returns Analysis of historical patterns with insights and recommendations
   */
  async analyzeHistoricalPatterns(uploadId?: number): Promise<HistoricalPatterns> {
    try {
      await validateApiKey();
      
      // Get all uploads or a specific one
      let uploads = await storage.getAllUploads();
      
      if (uploadId) {
        const specificUpload = await storage.getUpload(uploadId);
        if (specificUpload) {
          uploads = [specificUpload];
        } else {
          throw new Error("Upload not found");
        }
      }
      
      // Collect all permits from the selected uploads
      let allPermits: Permit[] = [];
      
      for (const upload of uploads) {
        const permits = await storage.getPermitsByUploadId(upload.id);
        allPermits = [...allPermits, ...permits];
      }
      
      if (allPermits.length === 0) {
        throw new Error("No permits found for analysis");
      }
      
      // Calculate overall approval rate
      const approved = allPermits.filter(p => p.enterPermit).length;
      const overall = allPermits.length;
      const overallApprovalRate = `${((approved / overall) * 100).toFixed(1)}%`;
      
      // Calculate approval rates by neighborhood
      const neighborhoodStats: Record<string, { approved: number, total: number }> = {};
      
      allPermits.forEach(permit => {
        const { neighborhoodCode, enterPermit } = permit;
        
        if (!neighborhoodStats[neighborhoodCode]) {
          neighborhoodStats[neighborhoodCode] = { approved: 0, total: 0 };
        }
        
        neighborhoodStats[neighborhoodCode].total += 1;
        
        if (enterPermit) {
          neighborhoodStats[neighborhoodCode].approved += 1;
        }
      });
      
      const trendByNeighborhood: Record<string, string> = {};
      
      Object.entries(neighborhoodStats).forEach(([code, stats]) => {
        const rate = (stats.approved / stats.total) * 100;
        trendByNeighborhood[code] = `${rate.toFixed(1)}% (${stats.approved}/${stats.total})`;
      });
      
      // Calculate approval rates by value range
      const valueRanges: Record<string, { approved: number, total: number }> = {
        "Low": { approved: 0, total: 0 },
        "Medium": { approved: 0, total: 0 },
        "High": { approved: 0, total: 0 }
      };
      
      allPermits.forEach(permit => {
        let range = "Medium";
        const value = parseFloat(permit.value || "0");
        
        if (value < 10000) {
          range = "Low";
        } else if (value > 100000) {
          range = "High";
        }
        
        valueRanges[range].total += 1;
        
        if (permit.enterPermit) {
          valueRanges[range].approved += 1;
        }
      });
      
      const trendByValueRange: Record<string, string> = {};
      
      Object.entries(valueRanges).forEach(([range, stats]) => {
        if (stats.total > 0) {
          const rate = (stats.approved / stats.total) * 100;
          trendByValueRange[range] = `${rate.toFixed(1)}% (${stats.approved}/${stats.total})`;
        } else {
          trendByValueRange[range] = "N/A";
        }
      });
      
      // Identify seasonal patterns (using issue date)
      const monthlyStats: Record<string, { approved: number, total: number }> = {};
      
      allPermits.forEach(permit => {
        if (!permit.issueDate) return;
        
        const date = new Date(permit.issueDate);
        const month = date.toLocaleString('default', { month: 'long' });
        
        if (!monthlyStats[month]) {
          monthlyStats[month] = { approved: 0, total: 0 };
        }
        
        monthlyStats[month].total += 1;
        
        if (permit.enterPermit) {
          monthlyStats[month].approved += 1;
        }
      });
      
      const seasonalPatterns: string[] = [];
      
      Object.entries(monthlyStats)
        .sort((a, b) => {
          const months = ["January", "February", "March", "April", "May", "June", 
                         "July", "August", "September", "October", "November", "December"];
          return months.indexOf(a[0]) - months.indexOf(b[0]);
        })
        .forEach(([month, stats]) => {
          if (stats.total >= 5) {
            const rate = (stats.approved / stats.total) * 100;
            seasonalPatterns.push(`${month}: ${rate.toFixed(1)}% approval rate (${stats.approved}/${stats.total})`);
          }
        });
      
      // Analyze permit descriptions to identify common factors
      const approvalKeywords: Record<string, number> = {};
      const denialKeywords: Record<string, number> = {};
      
      allPermits.forEach(permit => {
        const words = permit.permitDescription
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 4);
        
        words.forEach(word => {
          if (permit.enterPermit) {
            approvalKeywords[word] = (approvalKeywords[word] || 0) + 1;
          } else {
            denialKeywords[word] = (denialKeywords[word] || 0) + 1;
          }
        });
      });
      
      // Get the most common keywords
      const topApprovalFactors = Object.entries(approvalKeywords)
        .filter(([_, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => `"${word}" (${count} permits)`);
      
      const topDenialFactors = Object.entries(denialKeywords)
        .filter(([_, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => `"${word}" (${count} permits)`);
      
      // Generate recommendations based on analysis
      const insights = [
        `Overall approval rate is ${overallApprovalRate}`,
        Object.keys(neighborhoodStats).length > 1 ? 
          `Approval rates vary significantly by neighborhood (from ${Math.min(...Object.values(neighborhoodStats).map(s => s.approved/s.total*100)).toFixed(1)}% to ${Math.max(...Object.values(neighborhoodStats).map(s => s.approved/s.total*100)).toFixed(1)}%)` : 
          `Single neighborhood analysis limits geographical insights`,
        valueRanges.High.total > 0 && valueRanges.Low.total > 0 ? 
          `${valueRanges.High.approved/valueRanges.High.total > valueRanges.Low.approved/valueRanges.Low.total ? 'Higher' : 'Lower'} value permits have ${valueRanges.High.approved/valueRanges.High.total > valueRanges.Low.approved/valueRanges.Low.total ? 'higher' : 'lower'} approval rates than lower value permits` : 
          `Insufficient value range data for comparison`,
        seasonalPatterns.length > 2 ? 
          `Seasonal patterns show variation in approval rates throughout the year` : 
          `Insufficient date data to establish seasonal patterns`
      ];
      
      // Generate recommendations
      const recommendations = [
        "Standardize permit descriptions to improve consistency in processing",
        "Consider developing neighborhood-specific processing guidelines",
        "Implement pre-processing checks for common rejection reasons",
        "Create decision support tools based on historical approval patterns",
        "Consider value-based processing strategies for different permit scales"
      ];
      
      // Create the final historical analysis
      const historicalAnalysis: HistoricalPatterns = {
        generalTrends: {
          overallApprovalRate,
          trendByNeighborhood,
          trendByValueRange,
          seasonalPatterns
        },
        featuresAnalysis: {
          highestImpactFeatures: [
            "Permit type (new construction vs. renovation)",
            "Neighborhood zoning compatibility",
            "Project scale and complexity",
            "Documentation completeness"
          ],
          commonApprovalFactors: topApprovalFactors,
          commonDenialFactors: topDenialFactors
        },
        insights,
        recommendations
      };
      
      return historicalAnalysis;
    } catch (error) {
      console.error("Failed to analyze historical patterns:", error);
      throw error;
    }
  }
  
  /**
   * Calculate neighborhood-specific permit statistics
   * @param neighborhoodCode The neighborhood code to analyze
   * @returns Statistics for the specified neighborhood
   */
  private async calculateNeighborhoodStats(neighborhoodCode: string): Promise<{ approvalRate: string, permitCount: number }> {
    try {
      // Get all uploads to analyze permits across batches
      const uploads = await storage.getAllUploads();
      
      // Collect all permits with the specified neighborhood code
      let neighborhoodPermits: Permit[] = [];
      
      for (const upload of uploads) {
        const permits = await storage.getPermitsByUploadId(upload.id);
        const filtered = permits.filter(p => p.neighborhoodCode === neighborhoodCode);
        neighborhoodPermits = [...neighborhoodPermits, ...filtered];
      }
      
      // Calculate approval rate
      const approved = neighborhoodPermits.filter(p => p.enterPermit).length;
      const total = neighborhoodPermits.length;
      
      if (total === 0) {
        return { approvalRate: "N/A", permitCount: 0 };
      }
      
      const approvalRate = `${((approved / total) * 100).toFixed(1)}%`;
      
      return { approvalRate, permitCount: total };
    } catch (error) {
      console.error("Failed to calculate neighborhood stats:", error);
      return { approvalRate: "Error", permitCount: 0 };
    }
  }

  /**
   * Get trend analysis for a specific neighborhood
   * @param neighborhood Neighborhood code to analyze
   * @returns Trend analysis for the specified neighborhood
   */
  async getNeighborhoodTrends(neighborhood: string): Promise<NeighborhoodTrends> {
    try {
      await validateApiKey();

      // Get permits for the neighborhood from vector database
      const permits = await vectorDatabaseService.searchByNeighborhood(neighborhood);
      
      if (!permits || permits.length === 0) {
        return {
          neighborhood,
          overallApprovalRate: "0%",
          permitCount: 0,
          trends: {
            byMonth: {},
            byValue: {},
            byType: {}
          },
          riskFactors: [],
          insights: [
            "No permit data available for this neighborhood"
          ],
          recommendedActions: [
            "Upload more permit data for this neighborhood"
          ]
        };
      }

      // Calculate approval rate
      let approvedCount = 0;
      let byMonthData: Record<string, { total: number, approved: number }> = {};
      let byValueData: Record<string, { total: number, approved: number }> = {};
      let byTypeData: Record<string, { total: number, approved: number }> = {};
      
      for (const permit of permits) {
        if (permit.enterPermit) {
          approvedCount++;
        }
        
        // Group by month
        if (permit.issueDate) {
          const monthYear = new Date(permit.issueDate).toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
          });
          
          if (!byMonthData[monthYear]) {
            byMonthData[monthYear] = { total: 0, approved: 0 };
          }
          
          byMonthData[monthYear].total++;
          if (permit.enterPermit) {
            byMonthData[monthYear].approved++;
          }
        }
        
        // Group by value range
        if (permit.value) {
          let valueRange = 'Unknown';
          const valueStr = String(permit.value);
          const value = parseFloat(valueStr);
          
          if (!isNaN(value)) {
            if (value < 10000) valueRange = 'Under $10K';
            else if (value < 50000) valueRange = '$10K-$50K';
            else if (value < 100000) valueRange = '$50K-$100K';
            else if (value < 500000) valueRange = '$100K-$500K';
            else valueRange = 'Over $500K';
          }
          
          if (!byValueData[valueRange]) {
            byValueData[valueRange] = { total: 0, approved: 0 };
          }
          
          byValueData[valueRange].total++;
          if (permit.enterPermit) {
            byValueData[valueRange].approved++;
          }
        }
        
        // Group by description type (extract main type from description)
        if (permit.permitDescription) {
          let type = 'Other';
          const description = permit.permitDescription.toLowerCase();
          
          if (description.includes('residential')) type = 'Residential';
          else if (description.includes('commercial')) type = 'Commercial';
          else if (description.includes('repair')) type = 'Repair';
          else if (description.includes('renovation')) type = 'Renovation';
          else if (description.includes('new construction')) type = 'New Construction';
          
          if (!byTypeData[type]) {
            byTypeData[type] = { total: 0, approved: 0 };
          }
          
          byTypeData[type].total++;
          if (permit.enterPermit) {
            byTypeData[type].approved++;
          }
        }
      }
      
      // Calculate percentages for each group
      const byMonth: Record<string, string> = {};
      const byValue: Record<string, string> = {};
      const byType: Record<string, string> = {};
      
      for (const [month, data] of Object.entries(byMonthData)) {
        byMonth[month] = `${Math.round((data.approved / data.total) * 100)}%`;
      }
      
      for (const [value, data] of Object.entries(byValueData)) {
        byValue[value] = `${Math.round((data.approved / data.total) * 100)}%`;
      }
      
      for (const [type, data] of Object.entries(byTypeData)) {
        byType[type] = `${Math.round((data.approved / data.total) * 100)}%`;
      }
      
      // Generate insights and recommendations
      const insights: string[] = [];
      const riskFactors: string[] = [];
      const recommendedActions: string[] = [];
      
      // Overall approval rate
      const overallRate = permits.length > 0 ? (approvedCount / permits.length) * 100 : 0;
      const overallApprovalRate = `${Math.round(overallRate)}%`;
      
      // Identify key trends and insights
      let highestApprovalType = '';
      let highestApprovalRate = 0;
      let lowestApprovalType = '';
      let lowestApprovalRate = 100;
      
      for (const [type, data] of Object.entries(byTypeData)) {
        const rate = (data.approved / data.total) * 100;
        if (rate > highestApprovalRate && data.total >= 3) {
          highestApprovalRate = rate;
          highestApprovalType = type;
        }
        if (rate < lowestApprovalRate && data.total >= 3) {
          lowestApprovalRate = rate;
          lowestApprovalType = type;
        }
      }
      
      if (highestApprovalType) {
        insights.push(`${highestApprovalType} permits have the highest approval rate at ${Math.round(highestApprovalRate)}%`);
      }
      
      if (lowestApprovalType) {
        insights.push(`${lowestApprovalType} permits have the lowest approval rate at ${Math.round(lowestApprovalRate)}%`);
        riskFactors.push(`${lowestApprovalType} permits face more scrutiny in this neighborhood`);
        recommendedActions.push(`Provide more detailed documentation for ${lowestApprovalType} permits`);
      }
      
      // Check for trends over time
      const monthKeys = Object.keys(byMonth).sort((a, b) => {
        // Sort by date
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      });
      
      if (monthKeys.length >= 3) {
        const recentMonths = monthKeys.slice(-3);
        const recentRates = recentMonths.map(month => {
          return (byMonthData[month].approved / byMonthData[month].total) * 100;
        });
        
        // Check if approval rates are trending up or down
        if (recentRates[2] > recentRates[0] + 10) {
          insights.push(`Approval rates have increased over the past 3 months (${Math.round(recentRates[0])}% → ${Math.round(recentRates[2])}%)`);
        } else if (recentRates[0] > recentRates[2] + 10) {
          insights.push(`Approval rates have decreased over the past 3 months (${Math.round(recentRates[0])}% → ${Math.round(recentRates[2])}%)`);
          riskFactors.push(`Recent decrease in approval rates may indicate stricter review process`);
          recommendedActions.push(`Review recent rejected permits to identify common issues`);
        }
      }
      
      // Check value ranges
      let valueInsight = '';
      for (const [range, rate] of Object.entries(byValue)) {
        const percentage = parseInt(rate.replace('%', ''));
        if (percentage >= 80) {
          valueInsight += `${range} (${rate} approved), `;
        }
      }
      
      if (valueInsight) {
        valueInsight = valueInsight.slice(0, -2); // Remove trailing comma and space
        insights.push(`Highest approval rates by value: ${valueInsight}`);
        recommendedActions.push(`Focus on permits in the ${valueInsight} value range for higher approval chances`);
      }
      
      // Add general insights if few specifics found
      if (insights.length < 2) {
        insights.push(`This neighborhood has an overall ${overallApprovalRate} permit approval rate`);
      }
      
      if (recommendedActions.length < 2) {
        recommendedActions.push(`Analyze similar permits in this neighborhood before submission`);
      }
      
      return {
        neighborhood,
        overallApprovalRate,
        permitCount: permits.length,
        trends: {
          byMonth,
          byValue,
          byType
        },
        riskFactors,
        insights,
        recommendedActions
      };
    } catch (error) {
      console.error("Failed to get neighborhood trends:", error);
      throw error;
    }
  }
}

/**
 * Interface for neighborhood trends analysis
 */
export interface NeighborhoodTrends {
  neighborhood: string;
  overallApprovalRate: string;
  permitCount: number;
  trends: {
    byMonth: Record<string, string>;
    byValue: Record<string, string>;
    byType: Record<string, string>;
  };
  riskFactors: string[];
  insights: string[];
  recommendedActions: string[];
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();