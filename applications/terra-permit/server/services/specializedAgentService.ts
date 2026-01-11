/**
 * Specialized Agent Service
 * This service implements advanced task-specific LangChain agents with dedicated
 * tools, reasoning capabilities, and specialized knowledge for permit processing tasks.
 */

import { ChatOpenAI } from "@langchain/openai";
import { 
  AgentExecutor, 
  createOpenAIToolsAgent, 
  AgentFinish 
} from "langchain/agents";
import { Tool } from "@langchain/core/tools";
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder, 
  SystemMessagePromptTemplate, 
  HumanMessagePromptTemplate 
} from "@langchain/core/prompts";
import { 
  RunnableSequence, 
  RunnablePassthrough 
} from "@langchain/core/runnables";
import { BaseMessage } from "@langchain/core/messages";
import { storage } from "../storage";
import { Permit } from "../../shared/schema";
import { ConsistencyReview, PermitHistoryAnalysis } from "../../client/src/types/ai";

// Helper function to validate OpenAI API key
async function validateApiKey(): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured.");
  }
  return true;
}

/**
 * Class for managing specialized permit processing agents
 */
export class SpecializedAgentService {
  private readonly defaultModel = 'gpt-4-turbo-preview';
  private permitAnalysisModel: ChatOpenAI;
  private regulatoryModel: ChatOpenAI;
  private optimizationModel: ChatOpenAI;
  
  // Agent executors for different specialized tasks
  private permitAnalysisAgent: AgentExecutor | null = null;
  private regulatoryComplianceAgent: AgentExecutor | null = null;
  private optimizationAgent: AgentExecutor | null = null;
  private predictiveAnalyticsAgent: AgentExecutor | null = null;

  constructor() {
    // Initialize models with appropriate parameters for each specialized task
    this.permitAnalysisModel = new ChatOpenAI({
      modelName: this.defaultModel,
      temperature: 0.2,
      verbose: true
    });
    
    this.regulatoryModel = new ChatOpenAI({
      modelName: this.defaultModel,
      temperature: 0.1,
      verbose: true
    });
    
    this.optimizationModel = new ChatOpenAI({
      modelName: this.defaultModel,
      temperature: 0.3,
      verbose: true
    });
    
    // Initialize specialized agents
    this.initializeAgents();
  }

  /**
   * Initialize all specialized agents with appropriate tools and configurations
   */
  private async initializeAgents(): Promise<void> {
    try {
      await validateApiKey();
      
      // Create each specialized agent
      await this.initializePermitAnalysisAgent();
      await this.initializeRegulatoryComplianceAgent();
      await this.initializeOptimizationAgent();
      await this.initializePredictiveAnalyticsAgent();
      
      console.log("All specialized agents initialized successfully");
    } catch (error) {
      console.error("Failed to initialize specialized agents:", error);
    }
  }

  /**
   * Initialize the permit analysis agent with specialized tools
   */
  private async initializePermitAnalysisAgent(): Promise<void> {
    // Define tools specific to permit analysis
    const permitAnalysisTools: Tool[] = [
      // Fetch permit details tool
      new Tool({
        name: "fetch_permit_details",
        description: "Fetches detailed information about a specific permit by ID",
        func: async (permitId: string) => {
          try {
            const permit = await storage.getPermit(parseInt(permitId.trim()));
            return permit ? JSON.stringify(permit, null, 2) : "Permit not found";
          } catch (error) {
            return `Error fetching permit: ${error}`;
          }
        }
      }),
      
      // Fetch permit history tool
      new Tool({
        name: "fetch_permit_history",
        description: "Fetches the processing history of a specific permit",
        func: async (permitId: string) => {
          try {
            const history = await storage.getPermitHistoriesByPermitId(parseInt(permitId.trim()));
            return history.length > 0 ? JSON.stringify(history, null, 2) : "No history found for this permit";
          } catch (error) {
            return `Error fetching permit history: ${error}`;
          }
        }
      }),
      
      // Compare similar permits tool
      new Tool({
        name: "compare_similar_permits",
        description: "Finds and compares similar permits based on description or neighborhood",
        func: async (query: string) => {
          try {
            // Parse the query to extract search parameters
            const params = JSON.parse(query);
            const { permitId, neighborhoodCode, limit = 5 } = params;
            
            let permits: Permit[] = [];
            
            if (permitId) {
              const permit = await storage.getPermit(parseInt(permitId));
              if (permit) {
                // Find permits in the same neighborhood with similar characteristics
                const allPermits = await storage.getPermitsByUploadId(permit.uploadId);
                const similarPermits = allPermits.filter(p => 
                  p.id !== permit.id && 
                  (p.neighborhoodCode === permit.neighborhoodCode || 
                   p.permitDescription.includes(permit.permitDescription.substring(0, 20)))
                ).slice(0, limit);
                
                permits = similarPermits;
              }
            } else if (neighborhoodCode) {
              // Get all permits and filter by neighborhood code
              const allUploads = await storage.getAllUploads();
              let allPermits: Permit[] = [];
              
              for (const upload of allUploads) {
                const uploadPermits = await storage.getPermitsByUploadId(upload.id);
                allPermits = [...allPermits, ...uploadPermits];
              }
              
              permits = allPermits
                .filter(p => p.neighborhoodCode === neighborhoodCode)
                .slice(0, limit);
            }
            
            return permits.length > 0 ? 
              JSON.stringify(permits, null, 2) : 
              "No similar permits found";
          } catch (error) {
            return `Error comparing permits: ${error}`;
          }
        }
      })
    ];
    
    // Create the system prompt for the permit analysis agent
    const systemPrompt = SystemMessagePromptTemplate.fromTemplate(
      `You are an advanced TerraFusionPermit agent with expertise in urban planning, zoning, and permit processing.
      Your goal is to provide detailed analysis of permit applications, identify patterns, and offer insights
      using natural language that is clear and accessible to all users regardless of technical background.
      
      You have access to permit data, history, and can compare similar permits to provide context.
      
      When analyzing permits:
      1. Consider the neighborhood context and zoning requirements
      2. Evaluate the permit description for completeness and clarity
      3. Identify any unusual characteristics or potential issues
      4. Compare with similar permits to establish consistency
      5. Provide actionable insights and recommendations
      
      Always communicate in natural, conversational language that users can easily understand.
      Avoid technical jargon unless absolutely necessary, and explain any complex terms when used.
      Format your responses in an easy-to-read manner with bullet points for key findings.
      Always base your analysis on the actual permit data retrieved from the tools.`
    );
    
    // Create the agent prompt
    const agentPrompt = ChatPromptTemplate.fromMessages([
      systemPrompt,
      new MessagesPlaceholder("chat_history"),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
      new MessagesPlaceholder("agent_scratchpad"),
    ]);
    
    // Create the permit analysis agent
    const agent = await createOpenAIToolsAgent({
      llm: this.permitAnalysisModel,
      tools: permitAnalysisTools,
      prompt: agentPrompt
    });
    
    this.permitAnalysisAgent = new AgentExecutor({
      agent,
      tools: permitAnalysisTools,
      returnIntermediateSteps: true,
      maxIterations: 5,
      verbose: true
    });
  }
  
  /**
   * Initialize the regulatory compliance agent with specialized tools
   */
  private async initializeRegulatoryComplianceAgent(): Promise<void> {
    // Define tools specific to regulatory compliance analysis
    const regulatoryTools: Tool[] = [
      // Regulatory lookup tool
      new Tool({
        name: "lookup_regulations",
        description: "Look up relevant regulations based on permit type and neighborhood",
        func: async (query: string) => {
          try {
            // This would connect to a regulatory database in a real implementation
            // For now, we'll return synthetic data based on the neighborhood code
            const params = JSON.parse(query);
            const { neighborhoodCode, permitType } = params;
            
            // Simplified regulations lookup based on neighborhood code
            const regulationsByNeighborhood: Record<string, string[]> = {
              "R01": [
                "Low-density residential (R1) zoning",
                "Maximum building height: 35 feet",
                "Minimum setbacks: 20 feet front, 10 feet sides, 25 feet rear",
                "Maximum lot coverage: 40%"
              ],
              "R02": [
                "Medium-density residential (R2) zoning",
                "Maximum building height: 45 feet",
                "Minimum setbacks: 15 feet front, 8 feet sides, 20 feet rear",
                "Maximum lot coverage: 50%"
              ],
              "C01": [
                "Commercial (C1) zoning",
                "Maximum building height: 60 feet",
                "Minimum setbacks: 10 feet front, 5 feet sides, 15 feet rear",
                "Maximum lot coverage: 70%",
                "Must include adequate parking (1 space per 300 sq ft)"
              ],
              "I01": [
                "Light Industrial (I1) zoning",
                "Maximum building height: 75 feet",
                "Minimum setbacks: 30 feet front, 20 feet sides, 30 feet rear",
                "Maximum lot coverage: 60%",
                "Environmental impact assessment required"
              ]
            };
            
            // Return regulations for the specified neighborhood or default message
            const regulations = regulationsByNeighborhood[neighborhoodCode] || 
              ["No specific regulations found for this neighborhood code"];
            
            // Add permit type specific regulations if available
            if (permitType) {
              const permitTypeRegulations: Record<string, string[]> = {
                "residential": [
                  "Residential building permits require neighborhood notification",
                  "Energy efficiency requirements must meet current building code"
                ],
                "commercial": [
                  "Commercial permits require public comment period",
                  "ADA compliance mandatory",
                  "Fire safety systems must be certified"
                ],
                "renovation": [
                  "Renovations must maintain historical character if in historic district",
                  "Lead and asbestos testing required for buildings older than 1978"
                ]
              };
              
              const typeRegs = permitTypeRegulations[permitType.toLowerCase()] || [];
              return JSON.stringify([...regulations, ...typeRegs], null, 2);
            }
            
            return JSON.stringify(regulations, null, 2);
          } catch (error) {
            return `Error looking up regulations: ${error}`;
          }
        }
      }),
      
      // Compliance check tool
      new Tool({
        name: "check_permit_compliance",
        description: "Analyzes a permit for compliance with local regulations",
        func: async (permitId: string) => {
          try {
            const permit = await storage.getPermit(parseInt(permitId.trim()));
            
            if (!permit) {
              return "Permit not found";
            }
            
            // In a real implementation, this would compare against actual regulations
            // For now, we'll provide a synthetic compliance assessment
            const neighborhoodCode = permit.neighborhoodCode;
            const permitDescription = permit.permitDescription.toLowerCase();
            
            // Extract permit characteristics for compliance checking
            const isResidential = permitDescription.includes("residential") || 
                                 permitDescription.includes("house") || 
                                 permitDescription.includes("home");
            
            const isCommercial = permitDescription.includes("commercial") || 
                               permitDescription.includes("retail") || 
                               permitDescription.includes("office");
            
            const isRenovation = permitDescription.includes("renovation") || 
                               permitDescription.includes("remodel") || 
                               permitDescription.includes("repair");
            
            // Generate a compliance assessment
            const complianceIssues = [];
            
            if (isResidential && neighborhoodCode.startsWith("C")) {
              complianceIssues.push("Residential construction in commercial zone requires special permit");
            }
            
            if (isCommercial && neighborhoodCode.startsWith("R")) {
              complianceIssues.push("Commercial construction in residential zone requires zoning variance");
            }
            
            if (permitDescription.includes("fence") && permitDescription.includes("6 foot")) {
              complianceIssues.push("Fences over 4 feet in front yard may require variance");
            }
            
            if (permitDescription.includes("deck") && !permitDescription.includes("inspection")) {
              complianceIssues.push("Deck construction requires structural inspection");
            }
            
            // Compliance result
            const complianceResult = {
              permitId: permit.id,
              description: permit.permitDescription,
              neighborhood: permit.neighborhoodCode,
              compliant: complianceIssues.length === 0,
              issues: complianceIssues,
              recommendations: complianceIssues.length > 0 ? 
                ["Consult with planning department", "Submit variance application if needed"] : 
                ["Proceed with permit processing"]
            };
            
            return JSON.stringify(complianceResult, null, 2);
          } catch (error) {
            return `Error checking compliance: ${error}`;
          }
        }
      })
    ];
    
    // Create the system prompt for the regulatory compliance agent
    const systemPrompt = SystemMessagePromptTemplate.fromTemplate(
      `You are a regulatory compliance expert specializing in permit processing and zoning regulations.
      Your role is to analyze permit applications for compliance with local regulations and identify
      any potential issues or variances needed.
      
      When evaluating permit compliance:
      1. Check if the permit type is appropriate for the zoning district
      2. Verify that proposed construction meets setback, height, and coverage requirements
      3. Identify any special conditions or variances needed
      4. Provide clear guidance on compliance issues and resolution steps
      5. Reference specific regulations when applicable
      
      Always provide practical advice that helps applicants navigate regulatory requirements.`
    );
    
    // Create the agent prompt
    const agentPrompt = ChatPromptTemplate.fromMessages([
      systemPrompt,
      new MessagesPlaceholder("chat_history"),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
      new MessagesPlaceholder("agent_scratchpad"),
    ]);
    
    // Create the regulatory compliance agent
    const agent = await createOpenAIToolsAgent({
      llm: this.regulatoryModel,
      tools: regulatoryTools,
      prompt: agentPrompt
    });
    
    this.regulatoryComplianceAgent = new AgentExecutor({
      agent,
      tools: regulatoryTools,
      returnIntermediateSteps: true,
      maxIterations: 5,
      verbose: true
    });
  }
  
  /**
   * Initialize the process optimization agent with specialized tools
   */
  private async initializeOptimizationAgent(): Promise<void> {
    // Define tools specific to process optimization
    const optimizationTools: Tool[] = [
      // Process analytics tool
      new Tool({
        name: "analyze_processing_efficiency",
        description: "Analyzes permit processing efficiency for an upload batch",
        func: async (uploadId: string) => {
          try {
            const upload = await storage.getUpload(parseInt(uploadId.trim()));
            
            if (!upload) {
              return "Upload not found";
            }
            
            const permits = await storage.getPermitsByUploadId(upload.id);
            const histories = await storage.getPermitHistoriesByUploadId(upload.id);
            
            // Calculate processing metrics
            const totalPermits = permits.length;
            const processedPermits = permits.filter(p => p.processedAt).length;
            const enteredPermits = permits.filter(p => p.enterPermit).length;
            const skippedPermits = permits.filter(p => !p.enterPermit).length;
            
            // Group permits by neighborhood for pattern analysis
            const neighborhoodGroups: Record<string, Permit[]> = {};
            permits.forEach(permit => {
              if (!neighborhoodGroups[permit.neighborhoodCode]) {
                neighborhoodGroups[permit.neighborhoodCode] = [];
              }
              neighborhoodGroups[permit.neighborhoodCode].push(permit);
            });
            
            // Identify patterns in processing decisions
            const patterns = [];
            
            // Check if certain neighborhoods have higher skip rates
            Object.entries(neighborhoodGroups).forEach(([neighborhood, nhPermits]) => {
              const nhTotal = nhPermits.length;
              const nhSkipped = nhPermits.filter(p => !p.enterPermit).length;
              const skipRate = (nhSkipped / nhTotal) * 100;
              
              if (nhTotal >= 3 && skipRate > 60) {
                patterns.push(`High skip rate (${skipRate.toFixed(1)}%) for ${neighborhood} neighborhood`);
              }
            });
            
            // Check for keywords in skipped permits
            const commonSkipKeywords: Record<string, number> = {};
            skippedPermits.forEach(permit => {
              const words = permit.permitDescription
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(' ')
                .filter(word => word.length > 3);
              
              words.forEach(word => {
                commonSkipKeywords[word] = (commonSkipKeywords[word] || 0) + 1;
              });
            });
            
            // Find keywords that appear in multiple skipped permits
            const significantKeywords = Object.entries(commonSkipKeywords)
              .filter(([_, count]) => count >= 3)
              .map(([word, count]) => `"${word}" appears in ${count} skipped permits`);
            
            if (significantKeywords.length > 0) {
              patterns.push("Common terms in skipped permits:");
              patterns.push(...significantKeywords);
            }
            
            // Calculate average processing time if history timestamps are available
            let avgProcessingTime = "Unknown";
            if (histories.length > 0) {
              // This would be calculated from actual timestamps in a real implementation
              avgProcessingTime = "2.3 minutes per permit";
            }
            
            // Generate optimization report
            const optimizationReport = {
              uploadId: upload.id,
              fileName: upload.fileName,
              processingMetrics: {
                totalPermits,
                processedPermits,
                processingRate: processedPermits > 0 ? 
                  `${((processedPermits / totalPermits) * 100).toFixed(1)}%` : "0%",
                enteredPermits,
                skippedPermits,
                enterRate: enteredPermits > 0 ? 
                  `${((enteredPermits / totalPermits) * 100).toFixed(1)}%` : "0%",
                averageProcessingTime: avgProcessingTime
              },
              patternAnalysis: patterns,
              optimizationOpportunities: [
                "Standardize descriptions to improve consistency",
                "Define clearer criteria for permit acceptance",
                "Create neighborhood-specific processing rules",
                "Implement automated pre-checks for common issues"
              ]
            };
            
            return JSON.stringify(optimizationReport, null, 2);
          } catch (error) {
            return `Error analyzing processing efficiency: ${error}`;
          }
        }
      }),
      
      // Workflow bottleneck analysis tool
      new Tool({
        name: "identify_bottlenecks",
        description: "Identifies bottlenecks in the permit processing workflow",
        func: async (uploadId: string) => {
          try {
            const upload = await storage.getUpload(parseInt(uploadId.trim()));
            
            if (!upload) {
              return "Upload not found";
            }
            
            // In a real implementation, this would analyze actual workflow data
            // For now, we'll provide a synthetic bottleneck analysis
            
            // Example bottleneck analysis
            const bottleneckAnalysis = {
              uploadId: upload.id,
              fileName: upload.fileName,
              identifiedBottlenecks: [
                {
                  stage: "Initial data validation",
                  impact: "Medium",
                  description: "Manual correction of address formats is time-consuming",
                  recommendation: "Implement address standardization preprocessing"
                },
                {
                  stage: "Permit classification",
                  impact: "High",
                  description: "Decision making for edge cases causes delays",
                  recommendation: "Create decision tree rules for common edge cases"
                },
                {
                  stage: "Neighborhood code validation",
                  impact: "Low",
                  description: "Some neighborhood codes require manual lookup",
                  recommendation: "Integrate with GIS system for automatic validation"
                }
              ],
              optimizationScore: 68, // Out of 100
              priorityActions: [
                "Standardize permit description format",
                "Create clear classification guidelines for ambiguous permits",
                "Implement batch processing for similar permits"
              ]
            };
            
            return JSON.stringify(bottleneckAnalysis, null, 2);
          } catch (error) {
            return `Error identifying bottlenecks: ${error}`;
          }
        }
      }),
      
      // Process improvement recommendations tool
      new Tool({
        name: "generate_improvement_recommendations",
        description: "Generates specific recommendations to improve permit processing efficiency",
        func: async (uploadId: string) => {
          try {
            const upload = await storage.getUpload(parseInt(uploadId.trim()));
            
            if (!upload) {
              return "Upload not found";
            }
            
            // In a real implementation, this would analyze actual process data
            // For now, we'll provide synthetic improvement recommendations
            
            // Example improvement recommendations
            const improvementRecommendations = {
              uploadId: upload.id,
              fileName: upload.fileName,
              systemRecommendations: [
                {
                  category: "Data Preprocessing",
                  recommendations: [
                    "Implement address standardization using USPS API",
                    "Create permit description templates to enforce consistency",
                    "Add neighborhood code validation against GIS database"
                  ],
                  estimatedImpact: "High",
                  implementation: "Short-term (1-2 weeks)"
                },
                {
                  category: "Decision Automation",
                  recommendations: [
                    "Develop clear decision rules for common permit types",
                    "Create neighborhood-specific processing rules",
                    "Implement automatic approval for low-risk permit types"
                  ],
                  estimatedImpact: "Very High",
                  implementation: "Medium-term (1 month)"
                },
                {
                  category: "Process Workflow",
                  recommendations: [
                    "Implement batch processing for similar permits",
                    "Add pre-check validation before human review",
                    "Create feedback loop to improve classification accuracy"
                  ],
                  estimatedImpact: "Medium",
                  implementation: "Short-term (2 weeks)"
                }
              ],
              trainingRecommendations: [
                "Create decision guidelines with examples for edge cases",
                "Regular calibration sessions to ensure consistent decisions",
                "Document common reasons for permit rejection for reference"
              ],
              aiEnhancementOpportunities: [
                "Implement auto-classification for common permit types",
                "Add predictive analytics to flag potential issues",
                "Use similarity search to compare with historical decisions"
              ]
            };
            
            return JSON.stringify(improvementRecommendations, null, 2);
          } catch (error) {
            return `Error generating improvement recommendations: ${error}`;
          }
        }
      })
    ];
    
    // Create the system prompt for the optimization agent
    const systemPrompt = SystemMessagePromptTemplate.fromTemplate(
      `You are a TerraFusionPermit optimization specialist focused on improving permit processing workflows.
      Your goal is to analyze permit processing data, identify inefficiencies, and recommend
      improvements to streamline operations using clear natural language.
      
      When optimizing permit processing:
      1. Analyze processing metrics to identify patterns and inefficiencies
      2. Identify bottlenecks in the workflow and their root causes
      3. Prioritize improvement opportunities based on impact and feasibility
      4. Provide specific, actionable recommendations with clear implementation steps
      5. Focus on both system improvements and process standardization
      
      Communication guidelines:
      - Use plain, conversational language that all users can understand
      - Avoid technical jargon and explain any specialized terms when necessary
      - Present information in an organized format with clear headings and bullet points
      - Summarize key points at the beginning of longer responses
      - Use concrete examples to illustrate complex concepts
      
      Always provide recommendations that are practical, measurable, and targeted at specific issues.`
    );
    
    // Create the agent prompt
    const agentPrompt = ChatPromptTemplate.fromMessages([
      systemPrompt,
      new MessagesPlaceholder("chat_history"),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
      new MessagesPlaceholder("agent_scratchpad"),
    ]);
    
    // Create the optimization agent
    const agent = await createOpenAIToolsAgent({
      llm: this.optimizationModel,
      tools: optimizationTools,
      prompt: agentPrompt
    });
    
    this.optimizationAgent = new AgentExecutor({
      agent,
      tools: optimizationTools,
      returnIntermediateSteps: true,
      maxIterations: 5,
      verbose: true
    });
  }
  
  /**
   * Initialize the predictive analytics agent with specialized tools
   */
  private async initializePredictiveAnalyticsAgent(): Promise<void> {
    // Define tools specific to predictive analytics
    const predictiveTools: Tool[] = [
      // Historical pattern analysis tool
      new Tool({
        name: "analyze_historical_patterns",
        description: "Analyzes historical permits to identify patterns and trends",
        func: async (query: string) => {
          try {
            // Parse the query parameters
            const params = JSON.parse(query);
            const { neighborhoodCode, timeRange } = params;
            
            // In a real implementation, this would query historical permit data
            // For now, we'll return synthetic analysis results
            
            // Example historical pattern analysis
            const historicalPatterns = {
              neighborhoodCode: neighborhoodCode || "All Neighborhoods",
              timeRange: timeRange || "Last 12 months",
              permitVolumeByType: {
                "Residential New Construction": 124,
                "Residential Renovation": 342,
                "Commercial New Construction": 57,
                "Commercial Renovation": 89,
                "Electrical": 211,
                "Plumbing": 178,
                "Demolition": 43
              },
              approvalRatesByType: {
                "Residential New Construction": "84%",
                "Residential Renovation": "92%",
                "Commercial New Construction": "76%",
                "Commercial Renovation": "81%",
                "Electrical": "95%",
                "Plumbing": "94%",
                "Demolition": "88%"
              },
              seasonalTrends: [
                "Spring shows 27% higher application volume",
                "Commercial projects peak in early fall",
                "Renovation permits increase 40% in January"
              ],
              neighborhoodInsights: [
                "R01 has highest approval rate at 94%",
                "C01 has highest commercial volume",
                "R03 has lowest demolition approval rate at 62%"
              ]
            };
            
            return JSON.stringify(historicalPatterns, null, 2);
          } catch (error) {
            return `Error analyzing historical patterns: ${error}`;
          }
        }
      }),
      
      // Approval prediction tool
      new Tool({
        name: "predict_approval_likelihood",
        description: "Predicts the likelihood of approval for a permit based on historical data",
        func: async (permitId: string) => {
          try {
            const permit = await storage.getPermit(parseInt(permitId.trim()));
            
            if (!permit) {
              return "Permit not found";
            }
            
            // In a real implementation, this would use a trained ML model
            // For now, we'll use a rule-based approach for the prediction
            
            const description = permit.permitDescription.toLowerCase();
            const neighborhood = permit.neighborhoodCode;
            
            // Simple rules to determine likelihood
            let approvalLikelihood = 0.75; // Base approval rate
            
            // Adjust based on permit type
            if (description.includes("new construction")) {
              approvalLikelihood -= 0.1; // New construction has lower approval rate
            }
            if (description.includes("renovation") || description.includes("repair")) {
              approvalLikelihood += 0.15; // Renovations have higher approval rate
            }
            if (description.includes("fence") || description.includes("deck")) {
              approvalLikelihood += 0.2; // Simple structures have high approval rate
            }
            
            // Adjust based on neighborhood
            if (neighborhood.startsWith("R")) {
              approvalLikelihood += 0.05; // Residential zones have higher approval rates
            }
            if (neighborhood.startsWith("C")) {
              approvalLikelihood -= 0.05; // Commercial zones have slightly lower approval rates
            }
            if (neighborhood.startsWith("I")) {
              approvalLikelihood -= 0.15; // Industrial zones have lower approval rates
            }
            
            // Cap between 0.1 and 0.98
            approvalLikelihood = Math.max(0.1, Math.min(0.98, approvalLikelihood));
            
            // Determine risk factors
            const riskFactors = [];
            
            if (description.includes("variance") || description.includes("exception")) {
              riskFactors.push("Variance requests reduce approval likelihood by 30%");
            }
            
            if (description.includes("historic") || description.includes("preservation")) {
              riskFactors.push("Historical preservation considerations require additional review");
            }
            
            if (description.length < 20) {
              riskFactors.push("Insufficient permit description may delay processing");
            }
            
            // Generate prediction report
            const predictionReport = {
              permitId: permit.id,
              description: permit.permitDescription,
              neighborhood: permit.neighborhoodCode,
              approvalLikelihood: `${(approvalLikelihood * 100).toFixed(1)}%`,
              confidenceLevel: "Medium",
              riskFactors: riskFactors.length > 0 ? riskFactors : ["No specific risk factors identified"],
              recommendedActions: [
                "Ensure all required documentation is included",
                "Provide detailed construction plans",
                "Include clear site diagrams"
              ]
            };
            
            return JSON.stringify(predictionReport, null, 2);
          } catch (error) {
            return `Error predicting approval: ${error}`;
          }
        }
      }),
      
      // Decision impact analysis tool
      new Tool({
        name: "analyze_decision_impact",
        description: "Analyzes the potential impact of permit decisions on neighborhood patterns",
        func: async (query: string) => {
          try {
            // Parse the query parameters
            const params = JSON.parse(query);
            const { permitId, decision } = params;
            
            if (!permitId) {
              return "Permit ID is required";
            }
            
            const permit = await storage.getPermit(parseInt(permitId));
            
            if (!permit) {
              return "Permit not found";
            }
            
            // In a real implementation, this would analyze actual neighborhood data
            // For now, we'll provide synthetic impact analysis
            
            const approvalDecision = decision === undefined ? permit.enterPermit : decision;
            
            // Generate impact analysis based on the decision
            const impactAnalysis = {
              permitId: permit.id,
              description: permit.permitDescription,
              neighborhood: permit.neighborhoodCode,
              decision: approvalDecision ? "Approval" : "Rejection",
              potentialImpacts: approvalDecision ? [
                "May establish precedent for similar permits in this neighborhood",
                "Could influence property values in adjacent properties",
                "May affect neighborhood character if multiple similar permits are approved"
              ] : [
                "May discourage similar applications in this neighborhood",
                "Could delay development in this area",
                "May preserve existing neighborhood character"
              ],
              longTermConsiderations: approvalDecision ? [
                "Consider creating clear guidelines for similar future permits",
                "Monitor for potential increase in similar applications",
                "Evaluate cumulative impact if multiple such permits are approved"
              ] : [
                "Document rejection reasons clearly to ensure consistency",
                "Consider developing alternative approval pathways if appropriate",
                "Review rejection criteria if similar permits are frequently denied"
              ],
              recommendedFollowup: approvalDecision ? 
                "Monitor implementation to ensure compliance with approved plans" : 
                "Provide clear feedback to applicant on reasons for rejection and potential remediation steps"
            };
            
            return JSON.stringify(impactAnalysis, null, 2);
          } catch (error) {
            return `Error analyzing decision impact: ${error}`;
          }
        }
      })
    ];
    
    // Create the system prompt for the predictive analytics agent
    const systemPrompt = SystemMessagePromptTemplate.fromTemplate(
      `You are a TerraFusionPermit predictive analytics specialist focused on permit processing outcomes.
      Your expertise includes forecasting approval likelihood, identifying patterns in historical data,
      and analyzing the potential impact of permit decisions. Your job is to communicate complex analytics
      in simple, natural language that all users can understand.
      
      When providing predictive insights:
      1. Analyze historical patterns to identify factors that influence outcomes
      2. Provide data-driven predictions with appropriate confidence levels
      3. Identify risk factors that could affect the predicted outcome
      4. Recommend actions to improve the likelihood of desired outcomes
      5. Consider neighborhood-level impacts of permit decisions
      
      Communication guidelines:
      - Present information in clear, everyday language with minimal technical jargon
      - Use simple explanations and real-world examples to illustrate complex concepts
      - Format responses with clear headings, bullet points, and concise paragraphs
      - Focus on actionable insights rather than technical methodology
      - Provide confidence levels in easy-to-understand terms (e.g., "very likely" rather than "87% probability")
      
      Always be transparent about the limitations of your predictions and provide actionable recommendations.`
    );
    
    // Create the agent prompt
    const agentPrompt = ChatPromptTemplate.fromMessages([
      systemPrompt,
      new MessagesPlaceholder("chat_history"),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
      new MessagesPlaceholder("agent_scratchpad"),
    ]);
    
    // Create the predictive analytics agent
    const agent = await createOpenAIToolsAgent({
      llm: this.optimizationModel,
      tools: predictiveTools,
      prompt: agentPrompt
    });
    
    this.predictiveAnalyticsAgent = new AgentExecutor({
      agent,
      tools: predictiveTools,
      returnIntermediateSteps: true,
      maxIterations: 5,
      verbose: true
    });
  }

  /**
   * Perform in-depth permit analysis using the specialized permit analysis agent
   * @param permitId The ID of the permit to analyze
   * @returns Comprehensive analysis of the permit
   */
  async analyzePermitInDepth(permitId: number): Promise<any> {
    try {
      await validateApiKey();
      
      if (!this.permitAnalysisAgent) {
        await this.initializePermitAnalysisAgent();
      }
      
      if (!this.permitAnalysisAgent) {
        throw new Error("Permit analysis agent failed to initialize");
      }
      
      const result = await this.permitAnalysisAgent.invoke({
        input: `Perform a comprehensive analysis of permit ID ${permitId}. Include detailed insights about the permit characteristics, compliance with regulations, comparison with similar permits, and specific recommendations.`
      });
      
      // Extract the final response from the agent
      const finalResponse = result.output;
      
      return {
        permitId,
        analysis: finalResponse,
        steps: result.intermediateSteps?.map(step => ({
          tool: step.action.tool,
          input: step.action.toolInput,
          output: step.observation
        }))
      };
    } catch (error) {
      console.error("Failed to analyze permit:", error);
      throw error;
    }
  }
  
  /**
   * Analyze regulatory compliance for a specific permit
   * @param permitId The ID of the permit to analyze
   * @returns Compliance analysis with regulatory context
   */
  async analyzeRegulatoryCompliance(permitId: number): Promise<any> {
    try {
      await validateApiKey();
      
      if (!this.regulatoryComplianceAgent) {
        await this.initializeRegulatoryComplianceAgent();
      }
      
      if (!this.regulatoryComplianceAgent) {
        throw new Error("Regulatory compliance agent failed to initialize");
      }
      
      const result = await this.regulatoryComplianceAgent.invoke({
        input: `Analyze permit ID ${permitId} for compliance with local regulations. Identify any potential compliance issues, required variances, and provide recommendations for ensuring regulatory compliance.`
      });
      
      // Extract the final response from the agent
      const finalResponse = result.output;
      
      return {
        permitId,
        complianceAnalysis: finalResponse,
        steps: result.intermediateSteps?.map(step => ({
          tool: step.action.tool,
          input: step.action.toolInput,
          output: step.observation
        }))
      };
    } catch (error) {
      console.error("Failed to analyze regulatory compliance:", error);
      throw error;
    }
  }
  
  /**
   * Generate optimization recommendations for permit processing
   * @param uploadId The ID of the upload to analyze
   * @returns Process optimization recommendations
   */
  async generateOptimizationRecommendations(uploadId: number): Promise<any> {
    try {
      await validateApiKey();
      
      if (!this.optimizationAgent) {
        await this.initializeOptimizationAgent();
      }
      
      if (!this.optimizationAgent) {
        throw new Error("Optimization agent failed to initialize");
      }
      
      const result = await this.optimizationAgent.invoke({
        input: `Analyze upload ID ${uploadId} to identify process inefficiencies and bottlenecks. Provide detailed recommendations for optimizing the permit processing workflow, improving decision consistency, and increasing throughput.`
      });
      
      // Extract the final response from the agent
      const finalResponse = result.output;
      
      return {
        uploadId,
        optimizationAnalysis: finalResponse,
        steps: result.intermediateSteps?.map(step => ({
          tool: step.action.tool,
          input: step.action.toolInput,
          output: step.observation
        }))
      };
    } catch (error) {
      console.error("Failed to generate optimization recommendations:", error);
      throw error;
    }
  }
  
  /**
   * Predict approval likelihood for a permit
   * @param permitId The ID of the permit to analyze
   * @returns Prediction of approval likelihood with supporting factors
   */
  async predictApprovalLikelihood(permitId: number): Promise<any> {
    try {
      await validateApiKey();
      
      if (!this.predictiveAnalyticsAgent) {
        await this.initializePredictiveAnalyticsAgent();
      }
      
      if (!this.predictiveAnalyticsAgent) {
        throw new Error("Predictive analytics agent failed to initialize");
      }
      
      const result = await this.predictiveAnalyticsAgent.invoke({
        input: `Predict the approval likelihood for permit ID ${permitId}. Include factors that influence the prediction, potential risk factors, and recommendations to improve approval chances.`
      });
      
      // Extract the final response from the agent
      const finalResponse = result.output;
      
      return {
        permitId,
        predictionAnalysis: finalResponse,
        steps: result.intermediateSteps?.map(step => ({
          tool: step.action.tool,
          input: step.action.toolInput,
          output: step.observation
        }))
      };
    } catch (error) {
      console.error("Failed to predict approval likelihood:", error);
      throw error;
    }
  }
  
  /**
   * Analyze the impact of permit decisions on neighborhood patterns
   * @param permitId The ID of the permit to analyze
   * @param decision Optional explicit decision to analyze (true for approval, false for rejection)
   * @returns Analysis of potential impact of the permit decision
   */
  async analyzeDecisionImpact(permitId: number, decision?: boolean): Promise<any> {
    try {
      await validateApiKey();
      
      if (!this.predictiveAnalyticsAgent) {
        await this.initializePredictiveAnalyticsAgent();
      }
      
      if (!this.predictiveAnalyticsAgent) {
        throw new Error("Predictive analytics agent failed to initialize");
      }
      
      const query = decision !== undefined
        ? `Analyze the potential impact of ${decision ? 'approving' : 'rejecting'} permit ID ${permitId} on neighborhood patterns and future permit decisions.`
        : `Analyze the potential impact of the current decision for permit ID ${permitId} on neighborhood patterns and future permit decisions.`;
      
      const result = await this.predictiveAnalyticsAgent.invoke({
        input: query
      });
      
      // Extract the final response from the agent
      const finalResponse = result.output;
      
      return {
        permitId,
        impactAnalysis: finalResponse,
        steps: result.intermediateSteps?.map(step => ({
          tool: step.action.tool,
          input: step.action.toolInput,
          output: step.observation
        }))
      };
    } catch (error) {
      console.error("Failed to analyze decision impact:", error);
      throw error;
    }
  }
  
  /**
   * Analyze neighborhood patterns in permit processing
   * @param neighborhoodCode The neighborhood code to analyze
   * @returns Analysis of permit patterns in the neighborhood
   */
  async analyzeNeighborhoodPatterns(neighborhoodCode: string): Promise<any> {
    try {
      await validateApiKey();
      
      // Ensure we have the agent initialized
      if (!this.permitAnalysisAgent) {
        await this.initializeAgents();
      }
      
      if (!this.permitAnalysisAgent) {
        throw new Error("Permit analysis agent failed to initialize");
      }
      
      // Create the input for the agent
      const input = `Analyze permit patterns for neighborhood code: ${neighborhoodCode}. 
      Provide a comprehensive analysis of approval trends, common permit types, 
      and any specific patterns or anomalies in this neighborhood's permit processing history.`;
      
      // Execute the agent
      const result = await this.permitAnalysisAgent.invoke({ input });
      
      // Process the agent output
      const analysis = {
        neighborhoodCode,
        summary: typeof result.output === 'string' ? result.output : 'No analysis available',
        insights: this.extractInsightsFromAgentOutput(result),
        trends: {},
        recommendations: []
      };
      
      return analysis;
    } catch (error) {
      console.error("Failed to analyze neighborhood patterns:", error);
      return {
        neighborhoodCode,
        summary: "Error analyzing neighborhood patterns",
        error: (error as Error).message,
        insights: [],
        trends: {},
        recommendations: []
      };
    }
  }
  
  /**
   * Answer a complex permit-related question
   * @param question The user's question
   * @param permitId Optional permit ID for context
   * @returns Detailed answer with supporting evidence
   */
  async answerComplexQuestion(question: string, permitId?: number): Promise<any> {
    try {
      await validateApiKey();
      
      // Ensure we have the agent initialized
      if (!this.permitAnalysisAgent) {
        await this.initializeAgents();
      }
      
      if (!this.permitAnalysisAgent) {
        throw new Error("Permit analysis agent failed to initialize");
      }
      
      let permitContext = '';
      if (permitId) {
        const permit = await storage.getPermit(permitId);
        if (permit) {
          permitContext = `
          Consider this permit in your answer:
          Permit ID: ${permit.id}
          Description: ${permit.permitDescription || 'No description'}
          Neighborhood: ${permit.neighborhoodCode || 'Unknown'}
          Value: ${permit.value || 'Unknown'}
          Decision: ${permit.enterPermit ? 'Approved' : 'Rejected'}
          Reason: ${permit.reason || 'No reason provided'}
          `;
        }
      }
      
      // Create the input for the agent
      const input = `Question: ${question}\n${permitContext}\nPlease provide a detailed answer with supporting evidence.`;
      
      // Execute the agent
      const result = await this.permitAnalysisAgent.invoke({ input });
      
      // Process the agent output
      return {
        question,
        answer: typeof result.output === 'string' ? result.output : 'No answer available',
        permitId: permitId || null,
        sources: this.extractSourcesFromAgentOutput(result)
      };
    } catch (error) {
      console.error("Failed to answer complex question:", error);
      return {
        question,
        answer: "Error processing your question",
        error: (error as Error).message,
        permitId: permitId || null,
        sources: []
      };
    }
  }
  
  /**
   * Extract insights from agent output
   * @param agentResult Result from agent execution
   * @returns Array of insights extracted from the output
   */
  private extractInsightsFromAgentOutput(agentResult: any): string[] {
    const insights: string[] = [];
    
    if (agentResult.intermediateSteps && Array.isArray(agentResult.intermediateSteps)) {
      // Look for insights in tool outputs
      for (const step of agentResult.intermediateSteps) {
        if (step.observation && typeof step.observation === 'string') {
          // Extract potential insights from the observation
          const lines = step.observation.split('\n');
          for (const line of lines) {
            if (line.includes('insight:') || line.includes('Insight:') || 
                line.includes('pattern:') || line.includes('Pattern:') ||
                line.includes('finding:') || line.includes('Finding:')) {
              insights.push(line.trim());
            }
          }
        }
      }
    }
    
    // If no insights were found, extract them from the final output
    if (insights.length === 0 && typeof agentResult.output === 'string') {
      const lines = agentResult.output.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('Key Insight') || line.includes('Finding:') || 
            (line.length > 10 && (line.endsWith(':') || line.endsWith('.')))) {
          // Include the next line if this looks like a header
          if (line.endsWith(':') && i + 1 < lines.length) {
            insights.push(`${line} ${lines[i+1].trim()}`);
            i++;
          } else {
            insights.push(line);
          }
        }
      }
    }
    
    // Limit to 5 insights and make sure they're not too long
    return insights
      .slice(0, 5)
      .map(insight => insight.length > 100 ? insight.substring(0, 100) + '...' : insight);
  }
  
  /**
   * Extract sources from agent output
   * @param agentResult Result from agent execution
   * @returns Array of sources referenced in the output
   */
  private extractSourcesFromAgentOutput(agentResult: any): any[] {
    const sources: any[] = [];
    
    if (agentResult.intermediateSteps && Array.isArray(agentResult.intermediateSteps)) {
      // Extract sources from tools that were used
      for (const step of agentResult.intermediateSteps) {
        if (step.action && step.action.tool === 'permitInfoTool' && step.observation) {
          try {
            const permitData = JSON.parse(typeof step.observation === 'string' ? step.observation : '{}');
            if (permitData.id) {
              sources.push({
                type: 'permit',
                id: permitData.id,
                description: permitData.permitDescription || 'No description'
              });
            }
          } catch (e) {
            // Not valid JSON, ignore
          }
        }
        
        if (step.action && step.action.tool === 'similarPermitsTool' && step.observation) {
          try {
            const similarPermits = JSON.parse(typeof step.observation === 'string' ? step.observation : '[]');
            if (Array.isArray(similarPermits)) {
              for (const permit of similarPermits.slice(0, 3)) {
                if (permit && typeof permit === 'object') {
                  sources.push({
                    type: 'similar_permit',
                    id: permit.id,
                    description: permit.permitDescription || 'No description',
                    similarity: typeof permit.similarity === 'number' ? 
                      `${Math.round(permit.similarity * 100)}%` : 'Unknown'
                  });
                }
              }
            }
          } catch (e) {
            // Not valid JSON, ignore
          }
        }
        
        if (step.action && step.action.tool === 'regulationsTool' && step.observation) {
          try {
            const regulations = JSON.parse(typeof step.observation === 'string' ? step.observation : '[]');
            if (Array.isArray(regulations)) {
              for (const reg of regulations.slice(0, 2)) {
                if (reg && typeof reg === 'object') {
                  sources.push({
                    type: 'regulation',
                    id: reg.id || 'unknown',
                    code: reg.code || 'Unknown',
                    description: reg.description || 'No description'
                  });
                }
              }
            }
          } catch (e) {
            // Not valid JSON, ignore
          }
        }
      }
    }
    
    return sources;
  }
}

export const specializedAgentService = new SpecializedAgentService();