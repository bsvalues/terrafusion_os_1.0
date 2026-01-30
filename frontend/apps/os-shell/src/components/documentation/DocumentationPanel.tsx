/**
 * DocumentationPanel - AI-Powered Documentation Generator
 *
 * Production-ready component for automatic documentation generation,
 * docstring creation, README generation, and API docs.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 8 Day 2
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Alert } from '../ui/alert';
import { Separator } from '../ui/separator';

// ==================== TYPES ====================

export interface FunctionDocumentation {
  functionName: string;
  lineNumber: number;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    defaultValue: string;
    isOptional: boolean;
  }>;
  return: {
    type: string;
    description: string;
  };
  examples: string[];
  complexity: string;
}

export interface ClassDocumentation {
  className: string;
  lineNumber: number;
  description: string;
  attributes: string[];
  methods: FunctionDocumentation[];
  inherits: string;
}

export interface ModuleDocumentation {
  moduleName: string;
  description: string;
  imports: string[];
  functions: FunctionDocumentation[];
  classes: ClassDocumentation[];
  constants: Record<string, string>;
  dependencies: string[];
}

export interface ReadmeContent {
  title: string;
  description: string;
  features: string[];
  installation: string;
  usage: string;
  examples: string[];
  apiReference: string;
}

export interface DocumentationResult {
  module: ModuleDocumentation;
  functions: FunctionDocumentation[];
  classes: ClassDocumentation[];
  readme: ReadmeContent;
  generatedDocstring: string;
  suggestions: string[];
  coveragePercentage: number;
  generationTime: number;
}

export interface DocumentationPanelProps {
  code: string;
  language?: string;
  projectName?: string;
  onInsert?: (documentation: string) => void;
}

// ==================== COMPONENT ====================

export function DocumentationPanel({
  code,
  language = 'python',
  projectName = 'Project',
  onInsert,
}: DocumentationPanelProps) {
  // ==================== STATE ====================

  const [result, setResult] = useState<DocumentationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [docType, setDocType] = useState<'docstring' | 'readme' | 'api'>('docstring');
  const [error, setError] = useState<string | null>(null);

  // ==================== HANDLERS ====================

  const generateDocumentation = async (type: 'docstring' | 'readme' | 'api') => {
    try {
      setIsGenerating(true);
      setError(null);
      setDocType(type);

      const response = await fetch('/api/ai/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          documentationType: type,
          options: { projectName },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate documentation');
      }

      const data: DocumentationResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Documentation error:', err);
      setError('Failed to generate documentation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = (content: string) => {
    if (onInsert) {
      onInsert(content);
    }
  };

  // ==================== RENDER ====================

  return (
    <Card className="documentation-panel border-terra-cyan/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center space-x-2">
              <span>📚</span>
              <span>Documentation Generator</span>
              {isGenerating && <span className="animate-pulse text-xs">Generating...</span>}
            </CardTitle>
            {result && (
              <CardDescription className="mt-1">
                {result.functions.length} functions • {result.classes.length} classes •{' '}
                {result.coveragePercentage}% coverage
              </CardDescription>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateDocumentation('docstring')}
              disabled={isGenerating}
            >
              Docstring
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateDocumentation('readme')}
              disabled={isGenerating}
            >
              README
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateDocumentation('api')}
              disabled={isGenerating}
            >
              API Docs
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-500/30 bg-red-900/10">
            <p className="text-sm text-red-400">{error}</p>
          </Alert>
        )}

        {!result && !error && (
          <div className="text-center py-8">
            <span className="text-4xl">📚</span>
            <p className="text-sm text-muted-foreground mt-2">Click a button above to generate documentation</p>
          </div>
        )}

        {result && (
          <Tabs defaultValue={docType === 'readme' ? 'readme' : 'functions'}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="functions">Functions ({result.functions.length})</TabsTrigger>
              <TabsTrigger value="classes">Classes ({result.classes.length})</TabsTrigger>
              <TabsTrigger value="readme">README</TabsTrigger>
              <TabsTrigger value="suggestions">Tips ({result.suggestions.length})</TabsTrigger>
            </TabsList>

            {/* Functions Tab */}
            <TabsContent value="functions" className="space-y-4">
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {result.functions.map((func, idx) => (
                    <Card key={idx} className="bg-background/50">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-semibold font-mono">{func.functionName}()</h4>
                              <p className="text-xs text-muted-foreground mt-1">{func.description}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {func.complexity}
                            </Badge>
                          </div>

                          {func.parameters.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-blue-400 mb-1">Parameters:</p>
                              <div className="space-y-1">
                                {func.parameters.map((param, i) => (
                                  <div key={i} className="text-xs flex items-start">
                                    <span className="font-mono text-terra-cyan mr-2">{param.name}</span>
                                    <span className="text-muted-foreground">
                                      ({param.type}): {param.description}
                                      {param.isOptional && (
                                        <span className="text-yellow-400 ml-1">(optional)</span>
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="text-xs font-semibold text-green-400">
                              Returns: {func.return.type}
                            </p>
                            <p className="text-xs text-muted-foreground">{func.return.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {result.functions.length === 0 && (
                    <Alert>
                      <p className="text-sm text-muted-foreground">No functions found in code</p>
                    </Alert>
                  )}
                </div>
              </ScrollArea>

              {result.generatedDocstring && docType === 'docstring' && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">Generated Docstring:</p>
                    <Button size="sm" onClick={() => handleInsert(result.generatedDocstring)}>
                      Insert
                    </Button>
                  </div>
                  <pre className="text-xs bg-background p-3 rounded border border-border overflow-x-auto font-mono whitespace-pre">
                    {result.generatedDocstring}
                  </pre>
                </div>
              )}
            </TabsContent>

            {/* Classes Tab */}
            <TabsContent value="classes" className="space-y-4">
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {result.classes.map((cls, idx) => (
                    <Card key={idx} className="bg-background/50">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-semibold font-mono">{cls.className}</h4>
                              {cls.inherits && (
                                <Badge variant="secondary" className="text-xs">
                                  extends {cls.inherits}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{cls.description}</p>
                          </div>

                          {cls.attributes.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-purple-400 mb-1">Attributes:</p>
                              <div className="flex flex-wrap gap-1">
                                {cls.attributes.map((attr, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {attr}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {cls.methods.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-blue-400 mb-1">
                                Methods ({cls.methods.length}):
                              </p>
                              <div className="space-y-1">
                                {cls.methods.map((method, i) => (
                                  <div key={i} className="text-xs font-mono text-muted-foreground">
                                    • {method.functionName}()
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {result.classes.length === 0 && (
                    <Alert>
                      <p className="text-sm text-muted-foreground">No classes found in code</p>
                    </Alert>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* README Tab */}
            <TabsContent value="readme" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Generated README.md</p>
                  <Button size="sm" onClick={() => handleInsert(generateReadmeMarkdown(result.readme))}>
                    Copy Markdown
                  </Button>
                </div>

                <ScrollArea className="max-h-[500px]">
                  <Card className="bg-background/50">
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h1 className="text-2xl font-bold">{result.readme.title}</h1>
                        <p className="text-sm text-muted-foreground mt-2">{result.readme.description}</p>
                      </div>

                      {result.readme.features.length > 0 && (
                        <div>
                          <h2 className="text-lg font-semibold mb-2">Features</h2>
                          <ul className="space-y-1">
                            {result.readme.features.map((feature, idx) => (
                              <li key={idx} className="text-sm flex items-start">
                                <span className="mr-2">✨</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Separator />

                      <div>
                        <h2 className="text-lg font-semibold mb-2">Installation</h2>
                        <pre className="text-xs bg-background p-3 rounded border border-border overflow-x-auto">
                          {result.readme.installation}
                        </pre>
                      </div>

                      <Separator />

                      <div>
                        <h2 className="text-lg font-semibold mb-2">Usage</h2>
                        <pre className="text-xs bg-background p-3 rounded border border-border overflow-x-auto">
                          {result.readme.usage}
                        </pre>
                      </div>

                      {result.readme.examples.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h2 className="text-lg font-semibold mb-2">Examples</h2>
                            <div className="space-y-2">
                              {result.readme.examples.map((example, idx) => (
                                <pre
                                  key={idx}
                                  className="text-xs bg-background p-3 rounded border border-border overflow-x-auto"
                                >
                                  {example}
                                </pre>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Suggestions Tab */}
            <TabsContent value="suggestions" className="space-y-4">
              <div className="space-y-3">
                {result.suggestions.map((suggestion, idx) => (
                  <Alert key={idx} className="border-blue-500/30 bg-blue-900/10">
                    <div className="flex items-start space-x-2">
                      <span className="text-xl">💡</span>
                      <p className="text-sm">{suggestion}</p>
                    </div>
                  </Alert>
                ))}
              </div>

              <Card className="bg-background/50 mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Documentation Coverage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall Coverage</span>
                      <span className="text-2xl font-bold text-terra-cyan">
                        {result.coveragePercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2">
                      <div
                        className="bg-terra-cyan h-2 rounded-full transition-all"
                        style={{ width: `${result.coveragePercentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {result && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Generated in{' '}
                <span className="text-terra-cyan font-semibold">{result.generationTime.toFixed(0)}ms</span>
              </span>
              <span className="text-green-400">📚 AI-Powered Documentation</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== HELPER FUNCTIONS ====================

function generateReadmeMarkdown(readme: ReadmeContent): string {
  const sections: string[] = [];

  sections.push(`# ${readme.title}\n`);
  sections.push(`${readme.description}\n`);

  if (readme.features.length > 0) {
    sections.push('## Features\n');
    readme.features.forEach((feature) => {
      sections.push(`- ${feature}`);
    });
    sections.push('');
  }

  sections.push('## Installation\n');
  sections.push(readme.installation);
  sections.push('');

  sections.push('## Usage\n');
  sections.push(readme.usage);
  sections.push('');

  if (readme.examples.length > 0) {
    sections.push('## Examples\n');
    readme.examples.forEach((example) => {
      sections.push(example);
      sections.push('');
    });
  }

  return sections.join('\n');
}

export default DocumentationPanel;
