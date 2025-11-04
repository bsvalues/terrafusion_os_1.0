import { TerminologyAgent } from "../../packages/ai-agents/src/agents/terminology-agent";
import { AgentTask } from "../../packages/ai-agents/src/interfaces/agent";
import { storage } from "../storage";
import { RealEstateTerm, InsertRealEstateTerm } from "@shared/schema";

/**
 * Terminology Service
 *
 * Handles integration between the TerminologyAgent, database, and API layer
 * for real estate terminology explanation and contextual understanding.
 */
export class TerminologyService {
  private terminologyAgent: TerminologyAgent;

  constructor() {
    this.terminologyAgent = new TerminologyAgent();
  }

  /**
   * Get contextual explanation for a real estate term
   *
   * @param term The term to explain
   * @param context Optional context about property or situation
   * @param userRole Optional role of the user (appraiser, homeowner, etc.)
   * @returns The explanation with contextual information
   */
  async explainTerm(term: string, context?: string, userRole?: string): Promise<any> {
    try {
      // First, try to get from database
      const storedTerm = await storage.getRealEstateTermByName(term);

      // Create task for the terminology agent
      const task: AgentTask<any> = {
        id: `explain-${Date.now()}`,
        type: "explain_term",
        priority: "normal",
        data: {
          term,
          userContext: context,
          userRole: userRole || "property owner",
          storedDefinition: storedTerm?.definition || null,
        },
      };

      // Get explanation from the agent
      const explanation = await this.terminologyAgent.processTask(task);

      // If we don't have this term in our database, consider adding it
      if (!storedTerm && explanation) {
        this.queueTermForAddition(term, explanation);
      }

      return {
        ...explanation,
        source: storedTerm ? "database" : "ai-generated",
      };
    } catch (error) {
      console.error(`Error explaining term "${term}":`, error);
      throw new Error(`Failed to get explanation for term "${term}"`);
    }
  }

  /**
   * Generate a contextual definition based on specific property details
   *
   * @param term The term to define
   * @param propertyData Property data for context
   * @param assessmentContext Optional assessment context
   * @param audience Target audience for the explanation
   * @returns Contextual definition
   */
  async getContextualDefinition(
    term: string,
    propertyData: any,
    assessmentContext?: string,
    audience?: string
  ): Promise<any> {
    try {
      const task: AgentTask<any> = {
        id: `context-def-${Date.now()}`,
        type: "generate_contextual_definition",
        priority: "normal",
        data: {
          term,
          propertyData,
          assessmentContext,
          targetAudience: audience || "property owner",
        },
      };

      return await this.terminologyAgent.processTask(task);
    } catch (error) {
      console.error(`Error generating contextual definition for "${term}":`, error);
      throw new Error(`Failed to generate contextual definition for "${term}"`);
    }
  }

  /**
   * Find related terms to the given term
   *
   * @param term The main term
   * @param count Number of related terms to find
   * @param knownTerms Array of terms already known (to exclude)
   * @returns Related terms with definitions
   */
  async findRelatedTerms(term: string, count: number = 5, knownTerms: string[] = []): Promise<any> {
    try {
      // First try to get from database
      let storedRelatedTerms: RealEstateTerm[] = [];
      const storedTerm = await storage.getRealEstateTermByName(term);

      if (storedTerm && storedTerm.relatedTerms && storedTerm.relatedTerms.length > 0) {
        // Use the stored related terms to get their definitions
        storedRelatedTerms = await storage.getTermsByNames(storedTerm.relatedTerms as string[]);
      }

      // If we have enough related terms, return them
      if (storedRelatedTerms.length >= count) {
        return {
          sourceTerm: term,
          relatedTerms: storedRelatedTerms.map((t) => ({
            termName: t.term,
            definition: t.definition,
            relationship: "From database",
          })),
          count: storedRelatedTerms.length,
          source: "database",
          timestamp: new Date().toISOString(),
        };
      }

      // Otherwise, use the AI to find related terms
      const task: AgentTask<any> = {
        id: `related-terms-${Date.now()}`,
        type: "find_related_terms",
        priority: "normal",
        data: {
          term,
          count,
          knownTerms: [...knownTerms, ...storedRelatedTerms.map((t) => t.term)],
        },
      };

      const aiResults = await this.terminologyAgent.processTask(task);

      // Queue these terms for potential addition to database
      this.queueRelatedTermsForAddition(term, aiResults.relatedTerms);

      return {
        ...aiResults,
        source: storedRelatedTerms.length > 0 ? "hybrid" : "ai-generated",
      };
    } catch (error) {
      console.error(`Error finding related terms for "${term}":`, error);
      throw new Error(`Failed to find related terms for "${term}"`);
    }
  }

  /**
   * Simplify an explanation for easier understanding
   *
   * @param term The term being explained
   * @param originalExplanation The original explanation to simplify
   * @param readingLevel Target reading level
   * @returns Simplified explanation
   */
  async simplifyExplanation(
    term: string,
    originalExplanation: string,
    readingLevel: string = "middle school"
  ): Promise<any> {
    try {
      const task: AgentTask<any> = {
        id: `simplify-${Date.now()}`,
        type: "simplify_explanation",
        priority: "normal",
        data: {
          term,
          originalExplanation,
          targetReadingLevel: readingLevel,
        },
      };

      return await this.terminologyAgent.processTask(task);
    } catch (error) {
      console.error(`Error simplifying explanation for "${term}":`, error);
      throw new Error(`Failed to simplify explanation for "${term}"`);
    }
  }

  /**
   * Batch enhance terms in the database with AI-generated content
   *
   * @param terms Array of term names to enhance
   * @param detailLevel Level of detail for the enhancements
   * @returns Results of the enhancement process
   */
  async enhanceTermDatabase(terms: string[], detailLevel: string = "comprehensive"): Promise<any> {
    try {
      const task: AgentTask<any> = {
        id: `enhance-db-${Date.now()}`,
        type: "enhance_term_database",
        priority: "low",
        data: {
          terms,
          detailLevel,
        },
      };

      const results = await this.terminologyAgent.processTask(task);

      // Save enhanced terms to database
      const savedTerms: RealEstateTerm[] = [];
      for (const enhancedTerm of results.enhancedTerms) {
        try {
          // Check if term already exists
          const existingTerm = await storage.getRealEstateTermByName(enhancedTerm.term);

          if (existingTerm) {
            // Update existing term
            const updated = await storage.updateRealEstateTerm(existingTerm.id, enhancedTerm);
            if (updated) {
              savedTerms.push(updated);
            }
          } else {
            // Create new term
            const newTerm = await storage.createRealEstateTerm(
              enhancedTerm as InsertRealEstateTerm
            );
            savedTerms.push(newTerm);
          }
        } catch (error) {
          console.error(`Error saving enhanced term "${enhancedTerm.term}":`, error);
        }
      }

      return {
        originalCount: results.count,
        savedCount: savedTerms.length,
        savedTerms,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error enhancing term database:`, error);
      throw new Error(`Failed to enhance term database`);
    }
  }

  /**
   * Queue a term for potential addition to the database
   *
   * @param term The term name
   * @param explanation The explanation containing term details
   */
  private async queueTermForAddition(term: string, explanation: any): Promise<void> {
    // In a production system, this would add to a queue for human review
    // For now, we'll directly add it to the database if it seems valid
    try {
      if (!term || !explanation || !explanation.explanation) {
        return;
      }

      // Extract a definition from the explanation (first sentence)
      const definition = explanation.explanation.split(".")[0] + ".";

      const newTerm: InsertRealEstateTerm = {
        term,
        definition,
        category: "AI-Generated",
        contextualExplanation: explanation.explanation,
        examples: [],
        relatedTerms: [],
        isCommon: false,
        source: "AI Assistant",
      };

      await storage.createRealEstateTerm(newTerm);
      console.log(`Added new term to database: ${term}`);
    } catch (error) {
      console.error(`Error queueing term for addition:`, error);
    }
  }

  /**
   * Queue related terms for potential addition to the database
   *
   * @param sourceTerm The main term
   * @param relatedTerms Array of related terms with definitions
   */
  private async queueRelatedTermsForAddition(
    sourceTerm: string,
    relatedTerms: any[]
  ): Promise<void> {
    try {
      if (!relatedTerms || !Array.isArray(relatedTerms) || relatedTerms.length === 0) {
        return;
      }

      for (const related of relatedTerms) {
        if (!related.termName || !related.definition) {
          continue;
        }

        // Check if term already exists
        const existingTerm = await storage.getRealEstateTermByName(related.termName);
        if (existingTerm) {
          continue;
        }

        // Create new term
        const newTerm: InsertRealEstateTerm = {
          term: related.termName,
          definition: related.definition,
          category: "AI-Generated",
          contextualExplanation: related.relationship || null,
          examples: [],
          relatedTerms: [sourceTerm],
          isCommon: false,
          source: "AI Assistant - Related Term",
        };

        await storage.createRealEstateTerm(newTerm);
        console.log(`Added related term to database: ${related.termName}`);
      }
    } catch (error) {
      console.error(`Error queueing related terms for addition:`, error);
    }
  }
}

// Export singleton instance
export const terminologyService = new TerminologyService();
