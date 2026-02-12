import { BaseAgent } from "../core/base-agent";
import { AIService } from "../core/ai-service";
import { AgentTask } from "../interfaces/agent";
import { RealEstateTerm } from "@shared/schema";

/**
 * Terminology Agent
 *
 * Specializes in explaining and contextualizing real estate terminology
 * to help users understand complex terms within their specific use case.
 */
export class TerminologyAgent extends BaseAgent {
  private aiService: AIService;
  protected logger: Console;

  /**
   * Constructor
   */
  constructor() {
    super("terminology-agent", "Terminology Explanation Agent");
    this.aiService = new AIService();
    this.logger = console;

    // Register handlers for specific terminology tasks
    this.registerTaskHandler("explain_term", this.explainTerm.bind(this));
    this.registerTaskHandler(
      "generate_contextual_definition",
      this.generateContextualDefinition.bind(this)
    );
    this.registerTaskHandler("find_related_terms", this.findRelatedTerms.bind(this));
    this.registerTaskHandler("simplify_explanation", this.simplifyExplanation.bind(this));
    this.registerTaskHandler("enhance_term_database", this.enhanceTermDatabase.bind(this));
  }

  /**
   * Process a task
   * @param task The task to process
   */
  protected async processTask<T, R>(task: AgentTask<T>): Promise<R> {
    this.logger.info(`TerminologyAgent processing task: ${task.type}`);

    // Call the appropriate handler based on task type
    const handler = this.getTaskHandler(task.type);
    if (!handler) {
      throw new Error(`No handler for task type: ${task.type}`);
    }

    return handler(task);
  }

  /**
   * Explain a real estate term with contextual understanding
   * @param task The task containing the term to explain and context
   */
  private async explainTerm(task: AgentTask<any>): Promise<any> {
    const { term, userContext, userRole, useCase } = task.data;

    if (!term) {
      throw new Error("Term is required for explanation");
    }

    this.logger.info(`Explaining term: ${term} for ${userRole || "general user"}`);

    // Construct the prompt for the AI
    const prompt = `
      Please explain the real estate term "${term}" in a way that's appropriate for ${userRole || "a property owner"}.
      ${userContext ? `Context: ${userContext}` : ""}
      ${useCase ? `The explanation will be used for: ${useCase}` : ""}
      
      Provide the following:
      1. A clear, concise definition (1-2 sentences)
      2. A more detailed explanation with relevant examples
      3. Why this term matters in real estate transactions or assessments
      4. Any common misconceptions about this term
    `;

    // Use the AI service to get an explanation
    const explanation = await this.aiService.getCompletion(prompt);

    return {
      term,
      explanation,
      timestamp: new Date().toISOString(),
      context: userContext || null,
      userRole: userRole || "general",
    };
  }

  /**
   * Generate a contextual definition based on specific property or assessment context
   * @param task The task containing the term and property context
   */
  private async generateContextualDefinition(task: AgentTask<any>): Promise<any> {
    const { term, propertyData, assessmentContext, targetAudience } = task.data;

    if (!term) {
      throw new Error("Term is required for contextual definition");
    }

    this.logger.info(`Generating contextual definition for: ${term}`);

    // Extract relevant property characteristics if provided
    const propertyContext = propertyData
      ? `
      Property Type: ${propertyData.propertyType || "Not specified"}
      Location: ${propertyData.county || ""}, ${propertyData.state || ""}
      Zoning: ${propertyData.zoning || "Not specified"}
      ${propertyData.specialFeatures ? `Special Features: ${propertyData.specialFeatures}` : ""}
    `
      : "";

    // Construct the prompt with property context
    const prompt = `
      Please provide a contextual definition of the real estate term "${term}" that is specifically 
      relevant to the following context:
      
      ${propertyContext}
      ${assessmentContext ? `Assessment Context: ${assessmentContext}` : ""}
      
      The explanation should be tailored for: ${targetAudience || "property owners"}
      
      Please format your response as:
      - Contextual Definition: (2-3 sentences specific to this property/context)
      - Why it matters in this case: (practical significance for this specific property/situation)
      - How it affects value: (impact on property valuation in this specific context)
    `;

    // Get the contextual definition from the AI service
    const contextualDefinition = await this.aiService.getCompletion(prompt);

    return {
      term,
      contextualDefinition,
      propertyType: propertyData?.propertyType || null,
      location: propertyData ? `${propertyData.county || ""}, ${propertyData.state || ""}` : null,
      assessmentContext: assessmentContext || null,
      targetAudience: targetAudience || "property owners",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Find related terms that would be helpful to understand together
   * @param task The task containing the main term
   */
  private async findRelatedTerms(task: AgentTask<any>): Promise<any> {
    const { term, count = 5, knownTerms = [] } = task.data;

    if (!term) {
      throw new Error("Term is required for finding related terms");
    }

    this.logger.info(`Finding ${count} terms related to: ${term}`);

    // Create list of already known terms to avoid redundancy
    const knownTermsList =
      knownTerms.length > 0
        ? `Already known terms (do not repeat these): ${knownTerms.join(", ")}`
        : "";

    // Construct the prompt for related terms
    const prompt = `
      Please identify ${count} real estate terms that are closely related to "${term}" and would be 
      helpful to understand together in a property assessment context.
      ${knownTermsList}
      
      For each related term, please provide:
      1. The term name
      2. A brief definition (1 sentence)
      3. How it relates to "${term}"
      
      Format as a JSON array of objects with properties: termName, definition, relationship
    `;

    // Get the related terms from the AI service
    const relatedTermsText = await this.aiService.getCompletionWithJsonResponse(prompt);

    // Parse the JSON response
    let relatedTerms;
    try {
      relatedTerms = JSON.parse(relatedTermsText);
    } catch (error) {
      this.logger.error(`Error parsing related terms JSON: ${error.message}`);
      relatedTerms = [];
    }

    return {
      sourceTerm: term,
      relatedTerms,
      count: relatedTerms.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Simplify a complex explanation for laypeople
   * @param task The task containing the term and original explanation
   */
  private async simplifyExplanation(task: AgentTask<any>): Promise<any> {
    const { term, originalExplanation, targetReadingLevel = "middle school" } = task.data;

    if (!term || !originalExplanation) {
      throw new Error("Term and original explanation are required for simplification");
    }

    this.logger.info(`Simplifying explanation for "${term}" to ${targetReadingLevel} level`);

    // Construct the prompt for simplification
    const prompt = `
      Please simplify the following real estate term explanation to a ${targetReadingLevel} reading level.
      Use simple everyday language, avoid technical jargon, and include relatable examples.
      
      Term: ${term}
      
      Original Explanation:
      ${originalExplanation}
      
      In your simplified response, please include:
      1. A simple definition a ${targetReadingLevel} student could understand
      2. A real-world comparison or analogy that makes the concept intuitive
      3. Why this matters to someone who owns or wants to buy a home
    `;

    // Get the simplified explanation from the AI service
    const simplifiedExplanation = await this.aiService.getCompletion(prompt);

    return {
      term,
      originalExplanation,
      simplifiedExplanation,
      targetReadingLevel,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Enhance the term database by generating comprehensive definitions and examples
   * @param task The task containing terms to enhance
   */
  private async enhanceTermDatabase(task: AgentTask<any>): Promise<any> {
    const { terms, detailLevel = "comprehensive" } = task.data;

    if (!terms || !Array.isArray(terms) || terms.length === 0) {
      throw new Error("Array of terms is required for database enhancement");
    }

    this.logger.info(`Enhancing ${terms.length} terms in database`);

    const enhancedTerms: Partial<RealEstateTerm>[] = [];

    // Process each term to enhance its definition and metadata
    for (const termName of terms) {
      const prompt = `
        Please create a ${detailLevel} definition entry for the real estate term "${termName}".
        
        Provide your response in the following JSON format:
        {
          "term": "${termName}",
          "definition": "Concise definition (1-2 sentences)",
          "category": "Appropriate category for this term (e.g., Valuation, Legal, Construction, Financing, Taxation)",
          "contextualExplanation": "More detailed explanation (3-5 sentences)",
          "examples": ["Example 1 showing term usage", "Example 2 showing term usage"],
          "relatedTerms": ["Related term 1", "Related term 2", "Related term 3"],
          "isCommon": true/false (Is this a commonly used term?),
          "source": "Source of this definition, if applicable"
        }
      `;

      try {
        // Get enhanced term details
        const enhancedTermJson = await this.aiService.getCompletionWithJsonResponse(prompt);

        try {
          const parsedTerm = JSON.parse(enhancedTermJson);
          enhancedTerms.push(parsedTerm);
        } catch (parseError) {
          this.logger.error(
            `Error parsing enhanced term JSON for ${termName}: ${parseError.message}`
          );
        }
      } catch (error) {
        this.logger.error(`Error enhancing term ${termName}: ${error.message}`);
      }
    }

    return {
      enhancedTerms,
      count: enhancedTerms.length,
      timestamp: new Date().toISOString(),
    };
  }
}
