# Plandex AI Integration Plan

## Overview

This document outlines the plan for integrating Plandex AI as a coding assistant into the TaxI_AI platform. Plandex AI will complement our existing AI providers (OpenAI, Anthropic, and Perplexity) with specialized code generation, code completion, bug fixing, and code explanation capabilities.

## Background

The TaxI_AI platform currently uses multiple AI providers (OpenAI, Anthropic, and Perplexity) for various AI functionalities. Adding Plandex AI will enhance our code development capabilities with specialized functions for code generation, completion, and analysis.

## Integration Approach

### 1. Plandex AI Service Implementation

Create a new service that will handle interactions with the Plandex AI API:

```typescript
// server/services/plandex-ai-service.ts

import fetch from 'node-fetch';
import { LLMResponse } from './llm-service';

export interface PlandexAIConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
}

export interface CodeGenerationRequest {
  prompt: string;
  language?: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CodeCompletionRequest {
  codePrefix: string;
  language: string;
  maxTokens?: number;
  temperature?: number;
}

export interface BugFixRequest {
  buggyCode: string;
  errorMessage: string;
  language: string;
}

export interface CodeExplanationRequest {
  code: string;
  language: string;
  detailLevel?: 'basic' | 'detailed' | 'comprehensive';
}

export class PlandexAIService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: PlandexAIConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.defaultModel = config.defaultModel;
    this.maxTokens = config.maxTokens || 1024;
    this.temperature = config.temperature || 0.2;
  }

  /**
   * Generate code based on a prompt
   */
  public async generateCode(request: CodeGenerationRequest): Promise<string> {
    const response = await this.makeRequest('/generate', {
      prompt: request.prompt,
      language: request.language || 'typescript',
      context: request.context,
      maxTokens: request.maxTokens || this.maxTokens,
      temperature: request.temperature || this.temperature,
      model: this.defaultModel,
    });

    return response.code;
  }

  /**
   * Complete code based on a prefix
   */
  public async completeCode(request: CodeCompletionRequest): Promise<string> {
    const response = await this.makeRequest('/complete', {
      codePrefix: request.codePrefix,
      language: request.language,
      maxTokens: request.maxTokens || this.maxTokens,
      temperature: request.temperature || this.temperature,
      model: this.defaultModel,
    });

    return response.completion;
  }

  /**
   * Fix bugs in code
   */
  public async fixBugs(request: BugFixRequest): Promise<string> {
    const response = await this.makeRequest('/fix', {
      buggyCode: request.buggyCode,
      errorMessage: request.errorMessage,
      language: request.language,
      model: this.defaultModel,
    });

    return response.fixedCode;
  }

  /**
   * Explain code
   */
  public async explainCode(request: CodeExplanationRequest): Promise<string> {
    const response = await this.makeRequest('/explain', {
      code: request.code,
      language: request.language,
      detailLevel: request.detailLevel || 'detailed',
      model: this.defaultModel,
    });

    return response.explanation;
  }

  /**
   * Make a request to the Plandex AI API
   */
  private async makeRequest(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Plandex AI API error: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error making request to Plandex AI:', error);
      throw error;
    }
  }
}
```

### 2. Integration with AI Code Assistant

Enhance the existing AI Code Assistant to use Plandex AI alongside other providers:

````typescript
// server/services/development/ai-code-assistant.ts

import { PlandexAIService } from '../plandex-ai-service';
import { LLMService } from '../llm-service';
import { AIAssistantService } from '../ai-assistant-service';

export class AICodeAssistant {
  private llmService: LLMService;
  private aiAssistantService: AIAssistantService;
  private plandexAIService: PlandexAIService | null = null;

  constructor(
    llmService: LLMService,
    aiAssistantService: AIAssistantService,
    plandexAIService?: PlandexAIService
  ) {
    this.llmService = llmService;
    this.aiAssistantService = aiAssistantService;
    this.plandexAIService = plandexAIService || null;
  }

  /**
   * Complete code based on a prefix
   */
  public async completeCode(codePrefix: string, language: string): Promise<string> {
    // Try Plandex AI first if available
    if (this.plandexAIService) {
      try {
        return await this.plandexAIService.completeCode({
          codePrefix,
          language,
        });
      } catch (error) {
        console.warn('Plandex AI completion failed, falling back to other providers:', error);
        // Fall back to other providers
      }
    }

    // Use other providers as fallback
    const providers = this.aiAssistantService.getAvailableProviders();

    // Build prompt
    const promptMessage = `Complete the following ${language} code:
\`\`\`${language}
${codePrefix}
\`\`\`
Continue the code in a natural and efficient way. Only output the code completion, not the original code.`;

    // Try each available provider
    for (const provider of providers) {
      try {
        console.log(`Attempting to complete code using provider: ${provider}`);

        const response = await this.aiAssistantService.generateResponse({
          message: promptMessage,
          provider: provider,
          options: {
            temperature: 0.2,
            maxTokens: 1500,
          },
        });

        // Extract code from response
        const codeRegex = /```(?:\w*\n)?([\s\S]*?)```/g;
        const match = codeRegex.exec(response.message);
        return match ? match[1].trim() : response.message;
      } catch (error) {
        console.error(`Error completing code with provider ${provider}:`, error);
        // Continue to the next provider
      }
    }

    // If all providers failed, return a basic implementation
    console.warn('All AI providers failed, returning fallback implementation');
    return `// Failed to generate completion with available AI providers`;
  }

  /**
   * Generate code based on a prompt
   */
  public async generateCode(prompt: string, language: string = 'typescript'): Promise<string> {
    // Try Plandex AI first if available
    if (this.plandexAIService) {
      try {
        return await this.plandexAIService.generateCode({
          prompt,
          language,
        });
      } catch (error) {
        console.warn('Plandex AI generation failed, falling back to other providers:', error);
        // Fall back to other providers
      }
    }

    // Use existing implementation as fallback
    // ... (existing code)
  }

  /**
   * Fix bugs in code
   */
  public async fixBugs(
    buggyCode: string,
    errorMessage: string,
    language: string = 'typescript'
  ): Promise<string> {
    // Try Plandex AI first if available
    if (this.plandexAIService) {
      try {
        return await this.plandexAIService.fixBugs({
          buggyCode,
          errorMessage,
          language,
        });
      } catch (error) {
        console.warn('Plandex AI bug fixing failed, falling back to other providers:', error);
        // Fall back to other providers
      }
    }

    // Use existing implementation as fallback
    // ... (existing code)
  }

  /**
   * Explain code
   */
  public async explainCode(code: string, language: string = 'typescript'): Promise<string> {
    // Try Plandex AI first if available
    if (this.plandexAIService) {
      try {
        return await this.plandexAIService.explainCode({
          code,
          language,
        });
      } catch (error) {
        console.warn('Plandex AI explanation failed, falling back to other providers:', error);
        // Fall back to other providers
      }
    }

    // Use existing implementation as fallback
    // ... (existing code)
  }
}
````

### 3. API Routes for Plandex AI

Add new API routes to handle Plandex AI-specific requests:

```typescript
// server/routes/plandex-ai-routes.ts

import express from 'express';
import { getPlandexAIService, getAICodeAssistant } from '../services';

const router = express.Router();

// Check if Plandex AI is available
router.get('/status', (req, res) => {
  const plandexService = getPlandexAIService();
  res.json({ available: !!plandexService });
});

// Generate code
router.post('/generate', async (req, res) => {
  try {
    const { prompt, language } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const codeAssistant = getAICodeAssistant();
    const generatedCode = await codeAssistant.generateCode(prompt, language || 'typescript');

    res.json({ code: generatedCode });
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

// Complete code
router.post('/complete', async (req, res) => {
  try {
    const { codePrefix, language } = req.body;

    if (!codePrefix) {
      return res.status(400).json({ error: 'Missing code prefix' });
    }

    const codeAssistant = getAICodeAssistant();
    const completedCode = await codeAssistant.completeCode(codePrefix, language || 'typescript');

    res.json({ completion: completedCode });
  } catch (error) {
    console.error('Error completing code:', error);
    res.status(500).json({ error: 'Failed to complete code' });
  }
});

// Fix bugs
router.post('/fix', async (req, res) => {
  try {
    const { buggyCode, errorMessage, language } = req.body;

    if (!buggyCode || !errorMessage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const codeAssistant = getAICodeAssistant();
    const fixedCode = await codeAssistant.fixBugs(
      buggyCode,
      errorMessage,
      language || 'typescript'
    );

    res.json({ fixedCode });
  } catch (error) {
    console.error('Error fixing bugs:', error);
    res.status(500).json({ error: 'Failed to fix bugs' });
  }
});

// Explain code
router.post('/explain', async (req, res) => {
  try {
    const { code, language, detailLevel } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Missing code' });
    }

    const codeAssistant = getAICodeAssistant();
    const explanation = await codeAssistant.explainCode(code, language || 'typescript');

    res.json({ explanation });
  } catch (error) {
    console.error('Error explaining code:', error);
    res.status(500).json({ error: 'Failed to explain code' });
  }
});

export default router;
```

### 4. Frontend Integration

Create a new frontend service to interact with the Plandex AI API:

```typescript
// client/src/services/plandex-ai-service.ts

import { apiRequest } from '@/lib/queryClient';

export interface CodeGenerationRequest {
  prompt: string;
  language?: string;
}

export interface CodeCompletionRequest {
  codePrefix: string;
  language: string;
}

export interface BugFixRequest {
  buggyCode: string;
  errorMessage: string;
  language: string;
}

export interface CodeExplanationRequest {
  code: string;
  language: string;
  detailLevel?: 'basic' | 'detailed' | 'comprehensive';
}

export class PlandexAIClientService {
  /**
   * Check if Plandex AI is available
   */
  public static async checkAvailability(): Promise<boolean> {
    try {
      const response = await apiRequest('GET', '/api/plandex-ai/status');
      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Error checking Plandex AI availability:', error);
      return false;
    }
  }

  /**
   * Generate code based on a prompt
   */
  public static async generateCode(request: CodeGenerationRequest): Promise<string> {
    const response = await apiRequest('POST', '/api/plandex-ai/generate', request);
    const data = await response.json();
    return data.code;
  }

  /**
   * Complete code based on a prefix
   */
  public static async completeCode(request: CodeCompletionRequest): Promise<string> {
    const response = await apiRequest('POST', '/api/plandex-ai/complete', request);
    const data = await response.json();
    return data.completion;
  }

  /**
   * Fix bugs in code
   */
  public static async fixBugs(request: BugFixRequest): Promise<string> {
    const response = await apiRequest('POST', '/api/plandex-ai/fix', request);
    const data = await response.json();
    return data.fixedCode;
  }

  /**
   * Explain code
   */
  public static async explainCode(request: CodeExplanationRequest): Promise<string> {
    const response = await apiRequest('POST', '/api/plandex-ai/explain', request);
    const data = await response.json();
    return data.explanation;
  }
}
```

### 5. Monaco Editor Integration

Integrate Plandex AI with the Monaco Editor for code completion:

```typescript
// client/src/components/code-editor/PlandexAICompletionProvider.tsx

import { useEffect, useState } from 'react';
import { editor } from 'monaco-editor';
import { PlandexAIClientService } from '@/services/plandex-ai-service';

interface PlandexAICompletionProviderProps {
  editorInstance: editor.IStandaloneCodeEditor | null;
  language: string;
}

export function PlandexAICompletionProvider({
  editorInstance,
  language,
}: PlandexAICompletionProviderProps) {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Check if Plandex AI is available
    const checkAvailability = async () => {
      const available = await PlandexAIClientService.checkAvailability();
      setIsAvailable(available);
    };

    checkAvailability();
  }, []);

  useEffect(() => {
    if (!editorInstance || !isAvailable) return;

    // Register completion provider
    const disposable = editorInstance.getModel()?.onDidChangeContent(async event => {
      // Only trigger on certain conditions (typing a period, space after keywords, etc.)
      const position = editorInstance.getPosition();
      if (!position) return;

      const model = editorInstance.getModel();
      if (!model) return;

      // Get current line
      const line = model.getLineContent(position.lineNumber);

      // Simple heuristic: only trigger if user typed a period or is after specific keywords
      const shouldTrigger =
        (event.changes.length === 1 && event.changes[0].text === '.') ||
        /\b(function|class|interface|const|let|var|return|if|for|while)\s+$/.test(
          line.substring(0, position.column)
        );

      if (!shouldTrigger) return;

      // Get code up to cursor position for context
      const codePrefix = model.getValue().substring(0, model.getOffsetAt(position));

      try {
        // Get completion from Plandex AI
        const completion = await PlandexAIClientService.completeCode({
          codePrefix,
          language,
        });

        if (completion) {
          // Insert completion (implement as suggestion or direct insertion based on UX preference)
          // For direct insertion:
          editorInstance.executeEdits('plandex-ai', [
            {
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
              text: completion,
              forceMoveMarkers: true,
            },
          ]);
        }
      } catch (error) {
        console.error('Error getting Plandex AI completion:', error);
      }
    });

    return () => {
      disposable?.dispose();
    };
  }, [editorInstance, isAvailable, language]);

  return null; // This is a behavior component, not a visual one
}
```

### 6. Create UI Components for Code Generation

Add UI components for Plandex AI code generation:

```typescript
// client/src/components/development/PlandexAICodeGenerator.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Code, Wand2 } from 'lucide-react';
import { PlandexAIClientService } from '@/services/plandex-ai-service';

interface PlandexAICodeGeneratorProps {
  onCodeGenerated: (code: string) => void;
}

export function PlandexAICodeGenerator({ onCodeGenerated }: PlandexAICodeGeneratorProps) {
  const [prompt, setPrompt] = useState<string>('');
  const [language, setLanguage] = useState<string>('typescript');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleGenerateCode = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const generatedCode = await PlandexAIClientService.generateCode({
        prompt,
        language
      });

      onCodeGenerated(generatedCode);
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Plandex AI Code Generator
        </CardTitle>
        <CardDescription>
          Describe what you want to generate and get AI-powered code suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Programming Language</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="csharp">C#</SelectItem>
                <SelectItem value="go">Go</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Describe the code you need</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'Create a function to calculate property tax based on assessed value and tax rate'"
              rows={5}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGenerateCode}
          disabled={!prompt.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Code className="mr-2 h-4 w-4" />
              Generate Code
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## API Key Integration

Add Plandex AI configuration to the environment:

```shell
# Add to environment variables
PLANDEX_API_KEY=your_api_key
PLANDEX_API_BASE_URL=https://api.plandex.ai/v1
PLANDEX_DEFAULT_MODEL=plandex-code-v1
```

Create a factory function for the Plandex AI service:

```typescript
// server/services/index.ts

import { PlandexAIService, PlandexAIConfig } from './plandex-ai-service';

let plandexAIServiceInstance: PlandexAIService | null = null;

export function getPlandexAIService(): PlandexAIService | null {
  if (!plandexAIServiceInstance && process.env.PLANDEX_API_KEY) {
    const config: PlandexAIConfig = {
      apiKey: process.env.PLANDEX_API_KEY,
      baseUrl: process.env.PLANDEX_API_BASE_URL || 'https://api.plandex.ai/v1',
      defaultModel: process.env.PLANDEX_DEFAULT_MODEL || 'plandex-code-v1',
      maxTokens: 1024,
      temperature: 0.2,
    };

    plandexAIServiceInstance = new PlandexAIService(config);
  }

  return plandexAIServiceInstance;
}
```

## Implementation Plan

1. **Phase 1: Core Integration**

   - Implement the Plandex AI service
   - Update the AI Code Assistant to use Plandex AI
   - Add API routes for Plandex AI

2. **Phase 2: Frontend Integration**

   - Create the frontend service for Plandex AI
   - Add the PlandexAICodeGenerator component

3. **Phase 3: Advanced Features**
   - Implement the Monaco Editor integration
   - Add advanced features like code optimization and test generation

## Dependencies

- Plandex AI API key and access
- Monaco Editor integration (already in place)
- Existing AI assistant services

## Conclusion

Integrating Plandex AI as a specialized coding assistant will significantly enhance the TaxI_AI development environment. By providing specialized code generation, completion, bug fixing, and explanation capabilities, Plandex AI will complement our existing AI providers and make the platform more powerful for assessment agency developers.
