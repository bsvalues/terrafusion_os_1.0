import OpenAI from 'openai';
import { Config } from '../utils/config';
import { ToolRegistry } from '../tools/toolRegistry';
import { ContextManager } from '../context/contextManager';

interface AICompletionOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  contextItems?: string[];
  toolNames?: string[];
}

interface AIResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
  }>;
}

/**
 * Service for interacting with OpenAI models
 */
export class AIService {
  private openai: OpenAI;
  private config: Config;
  private toolRegistry: ToolRegistry;
  private contextManager: ContextManager;

  constructor(config: Config, toolRegistry: ToolRegistry, contextManager: ContextManager) {
    this.config = config;
    this.toolRegistry = toolRegistry;
    this.contextManager = contextManager;

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || config.apiKey,
    });
  }

  /**
   * Get a completion from the AI model
   */
  async getCompletion(options: AICompletionOptions): Promise<AIResponse> {
    const {
      prompt,
      model = this.config.model,
      temperature = this.config.temperature,
      maxTokens = this.config.maxTokens,
      contextItems = [],
      toolNames = [],
    } = options;

    // Include relevant context if requested
    let context = '';
    if (contextItems && contextItems.length > 0) {
      context = contextItems.join('\n\n');
    }

    // Prepare tools if any are requested
    const tools =
      toolNames.length > 0
        ? toolNames
            .map(name => {
              const tool = this.toolRegistry.getTool(name);
              if (!tool) {
                console.warn(`Tool "${name}" not found, skipping in AI request`);
                return null;
              }

              return {
                type: 'function' as const,
                function: {
                  name: tool.name,
                  description: tool.description,
                  parameters: this.convertToolParametersToJsonSchema(tool.parameters),
                },
              };
            })
            .filter(Boolean)
        : undefined;

    // Construct the system message
    const systemContent = `You are CodeAgent, an advanced AI coding assistant.
Your goal is to help the user with coding tasks, analysis, and other development needs.
${context ? 'Here is some relevant context from the project:\n\n' + context : ''}
${this.generateToolInstructions(toolNames)}`;

    try {
      // Make the API request
      const completion = await this.openai.chat.completions.create({
        model, // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'system',
            content: systemContent,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature,
        tools: tools as any,
        tool_choice: tools && tools.length > 0 ? 'auto' : undefined,
      });

      const message = completion.choices[0].message;

      // Extract tool calls if any
      const toolCalls = message.tool_calls
        ? message.tool_calls.map(call => ({
            name: call.function.name,
            arguments: JSON.parse(call.function.arguments),
          }))
        : undefined;

      return {
        content: message.content || '',
        toolCalls,
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  /**
   * Execute a conversation including tool calls
   */
  async executeConversation(
    prompt: string,
    contextItems: string[] = [],
    availableTools: string[] = []
  ): Promise<string> {
    // Initial completion request
    const response = await this.getCompletion({
      prompt,
      contextItems,
      toolNames: availableTools,
    });

    // If there are no tool calls, just return the response
    if (!response.toolCalls || response.toolCalls.length === 0) {
      return response.content;
    }

    // Execute tool calls and collect results
    const toolResults = await Promise.all(
      response.toolCalls.map(async call => {
        try {
          const result = await this.toolRegistry.executeTool(call.name, call.arguments);
          return {
            name: call.name,
            success: result.success,
            output: result.output,
            arguments: call.arguments,
          };
        } catch (error) {
          return {
            name: call.name,
            success: false,
            output: `Error executing tool: ${error.message}`,
            arguments: call.arguments,
          };
        }
      })
    );

    // Get the final response incorporating tool results
    const finalCompletion = await this.openai.chat.completions.create({
      model: this.config.model, // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: `You are CodeAgent, an advanced AI coding assistant.
Your goal is to help the user with coding tasks, analysis, and other development needs.
${contextItems.length > 0 ? 'Here is some relevant context from the project:\n\n' + contextItems.join('\n\n') : ''}
${this.generateToolInstructions(availableTools)}`,
        },
        {
          role: 'user',
          content: prompt,
        },
        {
          role: 'assistant',
          content: response.content || "I'll help you with that.",
          tool_calls: response.toolCalls.map((call /* , index */) => ({
            id: `call_${index}`,
            type: 'function',
            function: {
              name: call.name,
              arguments: JSON.stringify(call.arguments),
            },
          })),
        },
        ...toolResults.map((result /* , index */) => ({
          role: 'tool' as const,
          tool_call_id: `call_${index}`,
          content: JSON.stringify({
            output: result.output,
            success: result.success,
          }),
        })),
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    });

    return finalCompletion.choices[0].message.content || '';
  }

  /**
   * Generate code completion
   */
  async generateCode(
    prompt: string,
    language: string,
    contextItems: string[] = []
  ): Promise<string> {
    const response = await this.getCompletion({
      prompt: `Generate code in ${language}:\n${prompt}`,
      contextItems,
      temperature: 0.2, // Lower temperature for code generation
    });

    return this.extractCodeFromResponse(response.content, language);
  }

  /**
   * Analyze code and provide insights
   */
  async analyzeCode(
    code: string,
    language: string,
    analysisType: 'bugs' | 'performance' | 'security' | 'style' | 'general' = 'general'
  ): Promise<string> {
    // Build the prompt based on analysis type
    let prompt = `Analyze the following ${language} code`;

    switch (analysisType) {
      case 'bugs':
        prompt += ' for potential bugs and logical errors';
        break;
      case 'performance':
        prompt += ' for performance issues and optimizations';
        break;
      case 'security':
        prompt += ' for security vulnerabilities';
        break;
      case 'style':
        prompt += ' for style issues and best practices';
        break;
      default:
        prompt += ' and provide general feedback';
    }

    prompt += `:\n\`\`\`${language}\n${code}\n\`\`\``;

    const response = await this.getCompletion({
      prompt,
      temperature: 0.3, // Lower temperature for analysis
    });

    return response.content;
  }

  /**
   * Extract and format code from response
   */
  private extractCodeFromResponse(response: string, language: string): string {
    // Look for code blocks with the specified language
    const codeBlockRegex = new RegExp(`\`\`\`(?:${language})?\n([\\s\\S]*?)\n\`\`\``, 'i');
    const match = response.match(codeBlockRegex);

    if (match && match[1]) {
      return match[1];
    }

    // If no code block with language is found, try to find any code block
    const anyCodeBlockRegex = /```\n?([\s\S]*?)\n?```/;
    const anyMatch = response.match(anyCodeBlockRegex);

    if (anyMatch && anyMatch[1]) {
      return anyMatch[1];
    }

    // If no code block is found, return the original response
    return response;
  }

  /**
   * Convert tool parameters to JSON Schema format expected by OpenAI
   */
  private convertToolParametersToJsonSchema(parameters: Record<string, any>): any {
    // Create a JSON Schema object
    const schema: any = {
      type: 'object',
      properties: {},
      required: [],
    };

    // Convert each parameter to JSON Schema format
    for (const [name, param] of Object.entries(parameters)) {
      schema.properties[name] = {
        type: param.type,
        description: param.description,
      };

      // Add enum if available
      if (param.enum) {
        schema.properties[name].enum = param.enum;
      }

      // Add default if available
      if (param.default !== undefined) {
        schema.properties[name].default = param.default;
      }

      // Add to required list if necessary
      if (param.required) {
        schema.required.push(name);
      }

      // Handle nested properties for objects
      if (param.type === 'object' && param.properties) {
        schema.properties[name].properties = this.convertToolParametersToJsonSchema(
          param.properties
        ).properties;
      }

      // Handle array items
      if (param.type === 'array' && param.items) {
        schema.properties[name].items = {
          type: param.items.type,
        };
      }
    }

    return schema;
  }

  /**
   * Generate instructions for using tools
   */
  private generateToolInstructions(toolNames: string[]): string {
    if (!toolNames || toolNames.length === 0) {
      return '';
    }

    const tools = toolNames.map(name => this.toolRegistry.getTool(name)).filter(Boolean);

    if (tools.length === 0) {
      return '';
    }

    let instructions = 'You have access to the following tools:\n\n';

    for (const tool of tools) {
      instructions += `- ${tool.name}: ${tool.description}\n`;
    }

    instructions += "\nUse these tools when appropriate to complete the user's request.";

    return instructions;
  }
}
