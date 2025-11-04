/**
 * Reporting Lead Agent
 * 
 * This module implements the Reporting Lead Agent, which is responsible
 * for coordinating and leading the Reporting domain agents.
 * It ensures report quality, insight generation, and visualization standards.
 */

import { ComponentLeadAgent, ComponentDomain } from './ComponentLeadAgent';
import { AgentMessage, EventType } from '../shared/agentProtocol';

/**
 * Configuration options specific to the Reporting Lead Agent
 */
interface ReportingLeadConfig {
  insightGenerationDepth: 'low' | 'medium' | 'high';
  visualizationStandardsLevel: 'basic' | 'advanced' | 'expert';
  reportingPeriods: string[];
  enableComparativeAnalysis: boolean;
  narrativeGenerationEnabled: boolean;
}

/**
 * Default configuration for Reporting Lead Agent
 */
const DEFAULT_REPORTING_CONFIG: ReportingLeadConfig = {
  insightGenerationDepth: 'medium',
  visualizationStandardsLevel: 'advanced',
  reportingPeriods: ['monthly', 'quarterly', 'annual'],
  enableComparativeAnalysis: true,
  narrativeGenerationEnabled: true
};

/**
 * Report type for validation
 */
interface ReportOutput {
  title?: string;
  subtitle?: string;
  sections?: {
    title: string;
    content: string;
    charts?: any[];
  }[];
  summary?: string;
  insights?: string[];
  recommendations?: string[];
  visualizations?: any[];
  metadata?: {
    generatedAt?: string;
    reportPeriod?: string;
    dataSource?: string;
    confidenceLevel?: number;
  };
  [key: string]: any;
}

/**
 * Reporting Lead Agent - Leads the Reporting domain
 */
export class ReportingLeadAgent extends ComponentLeadAgent {
  private reportingConfig: ReportingLeadConfig;
  
  /**
   * Create a new Reporting Lead Agent
   * @param agentId Unique identifier for this agent
   * @param config Configuration options
   * @param reportingConfig Reporting-specific configuration
   */
  constructor(
    agentId: string, 
    config: any = {}, 
    reportingConfig: Partial<ReportingLeadConfig> = {}
  ) {
    super(agentId, ComponentDomain.REPORTING, config);
    
    // Initialize reporting-specific configuration
    this.reportingConfig = {
      ...DEFAULT_REPORTING_CONFIG,
      ...reportingConfig
    };
    
    this.logMessage('Reporting Lead Agent initialized with config: ' + 
      JSON.stringify(this.reportingConfig));
  }
  
  /**
   * Set up agent capabilities
   */
  protected setupCapabilities(): void {
    this.capabilities = [
      'reporting_lead',
      'insight_generation',
      'visualization_standards',
      'narrative_generation',
      'comparative_analysis',
      'report_quality_control',
      'trend_identification'
    ];
  }
  
  /**
   * Initialize domain-specific best practices
   */
  protected initializeBestPractices(): void {
    this.bestPractices = [
      {
        id: 'report-001',
        name: 'Report Structure Completeness',
        description: 'Reports should have essential structural elements',
        checkFunction: (report: ReportOutput): boolean => {
          return !!(
            report.title &&
            Array.isArray(report.sections) && report.sections.length > 0 &&
            report.summary &&
            Array.isArray(report.insights) && report.insights.length > 0 &&
            report.metadata && report.metadata.generatedAt
          );
        },
        fixFunction: undefined, // No automatic fix available
        severity: 'high'
      },
      {
        id: 'report-002',
        name: 'Insight Quality',
        description: 'Reports should contain meaningful, data-driven insights',
        checkFunction: (report: ReportOutput): boolean => {
          // Check if insights exist
          if (!Array.isArray(report.insights) || report.insights.length === 0) {
            return false;
          }
          
          // Check insight quality (length as a proxy)
          const minimumInsightLength = 20; // characters
          for (const insight of report.insights) {
            if (typeof insight !== 'string' || insight.length < minimumInsightLength) {
              return false;
            }
          }
          
          return true;
        },
        fixFunction: undefined, // No automatic fix possible
        severity: 'high'
      },
      {
        id: 'report-003',
        name: 'Visualization Best Practices',
        description: 'Visualizations should follow data visualization best practices',
        checkFunction: (report: ReportOutput): boolean => {
          // Check if visualizations exist
          if (!Array.isArray(report.visualizations) || report.visualizations.length === 0) {
            return false;
          }
          
          // Check each visualization
          for (const viz of report.visualizations) {
            // Must have a title
            if (!viz.title) {
              return false;
            }
            
            // Must have a type
            if (!viz.type) {
              return false;
            }
            
            // Must have data
            if (!viz.data || (Array.isArray(viz.data) && viz.data.length === 0)) {
              return false;
            }
            
            // Check for chart type appropriateness
            if (viz.type === 'pie' && Array.isArray(viz.data) && viz.data.length > 7) {
              // Pie charts shouldn't have too many slices
              return false;
            }
          }
          
          return true;
        },
        fixFunction: undefined, // No automatic fix possible
        severity: 'medium'
      },
      {
        id: 'report-004',
        name: 'Metadata Completeness',
        description: 'Reports should have complete metadata',
        checkFunction: (report: ReportOutput): boolean => {
          return !!(
            report.metadata &&
            typeof report.metadata === 'object' &&
            report.metadata.generatedAt &&
            report.metadata.reportPeriod &&
            report.metadata.dataSource &&
            typeof report.metadata.confidenceLevel === 'number' &&
            report.metadata.confidenceLevel >= 0 &&
            report.metadata.confidenceLevel <= 1
          );
        },
        fixFunction: (report: ReportOutput) => {
          const fixedReport = JSON.parse(JSON.stringify(report));
          
          // Ensure metadata object exists
          fixedReport.metadata = fixedReport.metadata || {};
          
          // Add missing fields with default values
          if (!fixedReport.metadata.generatedAt) {
            fixedReport.metadata.generatedAt = new Date().toISOString();
          }
          
          if (!fixedReport.metadata.reportPeriod) {
            fixedReport.metadata.reportPeriod = 'quarterly';
          }
          
          if (!fixedReport.metadata.dataSource) {
            fixedReport.metadata.dataSource = 'Benton County Property Database';
          }
          
          if (typeof fixedReport.metadata.confidenceLevel !== 'number' ||
              fixedReport.metadata.confidenceLevel < 0 ||
              fixedReport.metadata.confidenceLevel > 1) {
            fixedReport.metadata.confidenceLevel = 0.7; // Default confidence
          }
          
          return fixedReport;
        },
        severity: 'medium'
      },
      {
        id: 'report-005',
        name: 'Actionable Recommendations',
        description: 'Reports should include actionable recommendations',
        checkFunction: (report: ReportOutput): boolean => {
          return !!(
            Array.isArray(report.recommendations) &&
            report.recommendations.length > 0 &&
            report.recommendations.every(r => typeof r === 'string' && r.length >= 30)
          );
        },
        fixFunction: undefined, // No automatic fix possible
        severity: 'low'
      }
    ];
  }
  
  /**
   * Provide domain-specific assistance to requesting agents
   * @param requestMessage The assistance request message
   */
  protected provideDomainAssistance(requestMessage: AgentMessage): void {
    const { payload, correlationId, sourceAgentId } = requestMessage;
    
    let assistance = '';
    let confidence = 0;
    
    // Determine the type of assistance needed
    if (payload.problemDescription.toLowerCase().includes('visualization') || 
        payload.problemDescription.toLowerCase().includes('chart')) {
      assistance = this.provideVisualizationGuidance(payload.context);
      confidence = 0.95;
    } else if (payload.problemDescription.toLowerCase().includes('insight') || 
               payload.problemDescription.toLowerCase().includes('trend')) {
      assistance = this.provideInsightGenerationGuidance(payload.context);
      confidence = 0.9;
    } else if (payload.problemDescription.toLowerCase().includes('narrative') || 
               payload.problemDescription.toLowerCase().includes('text')) {
      assistance = this.provideNarrativeGenerationGuidance(payload.context);
      confidence = 0.85;
    } else if (payload.problemDescription.toLowerCase().includes('comparative') || 
               payload.problemDescription.toLowerCase().includes('comparison')) {
      assistance = this.provideComparativeAnalysisGuidance(payload.context);
      confidence = 0.9;
    } else {
      assistance = this.provideGeneralReportingGuidance(payload.problemDescription);
      confidence = 0.8;
    }
    
    // Send assistance response
    const assistanceMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: correlationId,
      sourceAgentId: this.agentId,
      targetAgentId: sourceAgentId,
      timestamp: new Date().toISOString(),
      eventType: EventType.ASSISTANCE_RESPONSE,
      payload: {
        assistance,
        confidence,
        domain: ComponentDomain.REPORTING,
        references: this.getRelevantReferences(payload.problemDescription)
      }
    };
    
    this.sendMessage(assistanceMessage);
    this.logMessage(`Provided reporting assistance to ${sourceAgentId}`);
  }
  
  /**
   * Provide guidance on data visualization
   * @param context Context information
   * @returns Visualization guidance
   */
  private provideVisualizationGuidance(context: any): string {
    return `
      Data Visualization Guidance:
      
      1. Chart type selection guidelines:
         - Time series data: Line charts for trends, bar charts for discrete periods
         - Categorical comparisons: Bar/column charts, or dot plots for many categories
         - Part-to-whole relationships: Stacked bars (preferred) or pie charts (≤6 categories)
         - Distributions: Histograms, box plots, or violin plots
         - Correlations: Scatter plots, bubble charts, or heat maps
         - Spatial data: Maps with appropriate color scales or symbol variations
         - Multi-dimensional: Radar charts (≤8 dimensions) or parallel coordinate plots
      
      2. Visual design principles:
         - Minimize chart junk (decorative elements that don't convey data)
         - Use color purposefully and considerately (colorblind-friendly palettes)
         - Start Y-axis at zero for bar/column charts
         - Label directly when possible rather than using legends
         - Ensure text is readable (font size, contrast)
         - Use consistent scales when comparing multiple charts
         - Include descriptive titles that convey the insight
      
      3. Real estate specific visualization standards:
         - Market trends: Use line charts with consistent time intervals
         - Property comparisons: Use grouped bar charts or radar charts
         - Geographic insights: Use choropleth maps with meaningful color scales
         - Income analysis: Use waterfall charts to show income composition
         - Risk assessments: Use heat maps or bubble charts
      
      4. Interactive visualization best practices:
         - Provide clear interaction cues
         - Use tooltips for detailed information
         - Enable filtering and drilling down
         - Maintain visual consistency during transitions
         - Provide reset/default view options
    `;
  }
  
  /**
   * Provide guidance on insight generation
   * @param context Context information
   * @returns Insight generation guidance
   */
  private provideInsightGenerationGuidance(context: any): string {
    return `
      Insight Generation Guidance:
      
      1. Analytical frameworks to apply:
         - Comparative analysis: Current vs. historical, actual vs. projected
         - Trend analysis: Direction, magnitude, acceleration, seasonality
         - Outlier investigation: Causes, implications, and significance
         - Correlation discovery: Related metrics and potential causation
         - Segmentation analysis: Performance differences across categories
         - Root cause analysis: Factors driving key metrics
      
      2. Property valuation insight categories:
         - Market dynamics: Supply/demand shifts, pricing power trends
         - Economic indicators: Interest rates, employment, growth impacts
         - Demographic shifts: Population changes affecting property demand
         - Regulatory impacts: Zoning, tax, or policy effects on values
         - Competitive landscape: New developments, competing properties
         - Risk factors: Exposure to market changes, tenant concentration
      
      3. Insight quality criteria:
         - Relevance: Directly applicable to business questions
         - Novelty: Provides new information beyond common knowledge
         - Actionability: Suggests clear actions or decisions
         - Significance: Represents material impact, not trivial patterns
         - Validity: Based on sound analysis with appropriate confidence
         - Clarity: Expressed in clear, concise language
      
      4. Insight communication best practices:
         - Lead with the insight, then support with data
         - Quantify impact when possible (percentages, dollar amounts)
         - Express confidence level transparently
         - Connect to business objectives and decisions
         - Use plain language accessible to all stakeholders
         - Pair with appropriate visualizations
    `;
  }
  
  /**
   * Provide guidance on narrative generation
   * @param context Context information
   * @returns Narrative generation guidance
   */
  private provideNarrativeGenerationGuidance(context: any): string {
    return `
      Narrative Generation Guidance:
      
      1. Report narrative structure:
         - Executive summary: Key findings and implications (1-2 paragraphs)
         - Context setting: Relevant background and objectives
         - Key findings: Lead with insights, support with data
         - Supporting evidence: Data points, charts, and analysis details
         - Implications: What the findings mean for stakeholders
         - Recommendations: Clear, actionable next steps
         - Limitations: Transparent disclosure of constraints
      
      2. Writing style guidelines:
         - Clarity: Use precise, simple language
         - Conciseness: Eliminate unnecessary words
         - Active voice: "Property values increased by 5%" vs. "A 5% increase in property values was observed"
         - Objective tone: Present facts before interpretations
         - Appropriate technical level: Match audience expertise
         - Consistency: Maintain consistent terminology and measurements
      
      3. Narrative enhancement techniques:
         - Contextual framing: Place findings in broader market context
         - Comparative analysis: Present meaningful benchmarks
         - Progressive disclosure: From high-level to detailed information
         - Exception highlighting: Emphasize significant deviations
         - Causal explanations: Connect observations to likely causes
         - Forward-looking statements: Project implications with appropriate confidence
      
      4. Real estate reporting best practices:
         - Define technical terms on first use
         - Express time periods consistently
         - Clarify geographic scope for all analyses
         - Specify property types in all comparisons
         - Include data recency information
         - Note methodology changes from previous reports
    `;
  }
  
  /**
   * Provide guidance on comparative analysis
   * @param context Context information
   * @returns Comparative analysis guidance
   */
  private provideComparativeAnalysisGuidance(context: any): string {
    return `
      Comparative Analysis Guidance:
      
      1. Comparison framework selection:
         - Temporal comparisons: Current vs. historical periods
         - Peer comparisons: Similar properties or markets
         - Benchmark comparisons: Against industry standards or targets
         - Scenario comparisons: Actual vs. projected
         - Variance analysis: Budget vs. actual performance
      
      2. Comparison design principles:
         - Ensure comparison fairness: Control for key variables
         - Select appropriate time frames: Match to decision cycles
         - Choose relevant peers: Similar characteristics and contexts
         - Apply consistent metrics: Same calculations across entities
         - Normalize data when appropriate: Per square foot, per unit
      
      3. Real estate comparative metrics:
         - Performance metrics: Cap rate, cash-on-cash return, ROI
         - Valuation metrics: Price per square foot, GRM, replacement cost
         - Operational metrics: Occupancy rate, expense ratio, revenue growth
         - Market metrics: Absorption rate, days on market, inventory levels
         - Risk metrics: Tenant concentration, lease expiration exposure
      
      4. Comparative visualization techniques:
         - Side-by-side bar charts for direct comparisons
         - Slope charts for before/after comparisons
         - Radar charts for multidimensional comparisons
         - Heat maps for large comparison sets
         - Diverging bar charts for variance analysis
         - Small multiples for time series comparisons
      
      5. Common pitfalls to avoid:
         - Selection bias: Cherry-picking favorable comparisons
         - Inappropriate time periods: Too short or misaligned
         - Ignoring contextual factors: Market conditions, property differences
         - Over-generalization: Applying conclusions beyond similar cases
         - Confusing correlation with causation
    `;
  }
  
  /**
   * Provide general reporting guidance
   * @param problemDescription Description of the problem
   * @returns General reporting guidance
   */
  private provideGeneralReportingGuidance(problemDescription: string): string {
    return `
      General Property Reporting Guidance:
      
      1. Report structure best practices:
         - Hierarchical organization: Summary → key findings → details
         - Progressive disclosure: Most important information first
         - Logical flow: Guide reader through the narrative
         - Consistent sectioning: Standardized headings and subheadings
         - Appropriate length: Executive summaries (1-2 pages), detailed reports (5-20 pages)
      
      2. Report quality checklist:
         - Accuracy: All data has been verified
         - Completeness: All required information is included
         - Clarity: Information is presented in understandable format
         - Relevance: Content addresses key stakeholder needs
         - Consistency: Terminology and calculations are uniform
         - Timeliness: Information is current and applicable
      
      3. Property valuation reporting elements:
         - Value conclusion with confidence level
         - Methodology explanation
         - Key assumptions and limitations
         - Market context and conditions
         - Comparable property analysis
         - Income approach calculations
         - Future outlook and risk factors
      
      4. Stakeholder adaptation guidelines:
         - Executive audience: Focus on implications and decisions
         - Technical audience: Include detailed methodologies
         - Investment audience: Emphasize financial metrics
         - Operational audience: Highlight performance drivers
         - Regulatory audience: Demonstrate compliance and standards
      
      5. Report distribution and follow-up:
         - Provide executive summary for time-constrained stakeholders
         - Include appendices for supporting details
         - Enable digital exploration when appropriate
         - Document sources for all data
         - Offer context for unexpected findings
         - Schedule follow-up for key questions
    `;
  }
  
  /**
   * Get relevant references for a problem description
   * @param problemDescription Description of the problem
   * @returns Array of references
   */
  private getRelevantReferences(problemDescription: string): any[] {
    // In a real implementation, this would query a knowledge base
    const references = [
      {
        title: "BCBS Property Reporting Standards Guide",
        section: "4.2 - Visualization Guidelines",
        relevance: 0.9
      },
      {
        title: "Effective Property Insights",
        section: "Chapter 5: From Data to Decisions",
        relevance: 0.85
      },
      {
        title: "Real Estate Reporting Excellence",
        section: "Best Practices for Clear Communication",
        relevance: 0.8
      }
    ];
    
    return references;
  }
}