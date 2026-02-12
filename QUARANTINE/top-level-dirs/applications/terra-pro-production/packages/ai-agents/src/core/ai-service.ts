import Anthropic from "@anthropic-ai/sdk";

/**
 * AI Service
 *
 * Provides a unified interface for interacting with AI models.
 * Currently supports Anthropic's Claude models.
 */
export class AIService {
  private anthropic: Anthropic;
  private defaultModel: string;

  constructor() {
    // Initialize the Anthropic client
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    this.defaultModel = "claude-3-7-sonnet-20250219";
  }

  /**
   * Get a text completion from the AI model
   *
   * @param prompt The text prompt for the AI
   * @param model Optional model override
   * @param maxTokens Optional token limit
   * @returns The AI-generated text response
   */
  async getCompletion(prompt: string, model?: string, maxTokens?: number): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: model || this.defaultModel,
        max_tokens: maxTokens || 1024,
        messages: [{ role: "user", content: prompt }],
      });

      // Extract and return the content
      if (response.content && response.content.length > 0) {
        return response.content[0].text;
      } else {
        throw new Error("Empty response from AI model");
      }
    } catch (error) {
      console.error("AI Service error getting completion:", error);
      throw new Error(`Failed to get AI completion: ${error.message}`);
    }
  }

  /**
   * Get a JSON-formatted response from the AI model
   *
   * @param prompt The text prompt requesting JSON response
   * @param model Optional model override
   * @param maxTokens Optional token limit
   * @returns The AI-generated JSON as a string
   */
  async getCompletionWithJsonResponse(
    prompt: string,
    model?: string,
    maxTokens?: number
  ): Promise<string> {
    try {
      // Update the prompt to explicitly request JSON format
      const jsonPrompt = `${prompt}\n\nPlease respond ONLY with valid, well-formed JSON.`;

      const systemPrompt =
        "You are a helpful AI that responds exclusively in valid JSON format. Your responses should be structured to parse properly as JSON. Never include explanations or text outside of the JSON.";

      const response = await this.anthropic.messages.create({
        model: model || this.defaultModel,
        max_tokens: maxTokens || 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: jsonPrompt }],
      });

      // Extract and return the content
      if (response.content && response.content.length > 0) {
        const content = response.content[0].text;

        // Validate that the response is valid JSON
        try {
          // This will throw if not valid JSON
          JSON.parse(content);
          return content;
        } catch (jsonError) {
          console.warn("AI returned invalid JSON:", content);

          // Try to extract JSON from the response by looking for text between { and }
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedJson = jsonMatch[0];
            // Verify this is valid JSON
            JSON.parse(extractedJson);
            return extractedJson;
          }

          throw new Error("AI did not return valid JSON.");
        }
      } else {
        throw new Error("Empty response from AI model");
      }
    } catch (error) {
      console.error("AI Service error getting JSON completion:", error);
      throw new Error(`Failed to get AI JSON completion: ${error.message}`);
    }
  }
}
