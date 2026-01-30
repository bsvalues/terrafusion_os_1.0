/**
 * CodeOptimizationPanel - Automated Code Optimization & Refactoring UI
 *
 * Production-ready component displaying code optimization suggestions,
 * refactoring recommendations, and one-click code improvements.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 6 Day 4-5
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert } from '../ui/alert';

// ==================== TYPES ====================

export interface OptimizationSuggestion {
  id: string;
  type: 'performance' | 'readability' | 'maintainability';
  title: string;
  description: string;
  originalCode: string;
  optimizedCode: string;
  improvementPercentage: number;
  confidence: number;
  benefits: string[];
  tags: string[];
}

export interface RefactoringRecommendation {
  id: string;
  pattern: string;
  description: string;
  before: string;
  after: string;
  rationale: string;
  priority: number;
  steps: string[];
}

export interface OptimizationResult {
  optimizations: OptimizationSuggestion[];
  refactorings: RefactoringRecommendation[];
  totalImprovementPotential: number;
  analysisTime: number;
  language: string;
}

export interface CodeOptimizationPanelProps {
  code: string;
  language: string;
  onApplyOptimization?: (optimizedCode: string) => void;
  autoAnalyze?: boolean;
  debounceMs?: number;
}

// ==================== COMPONENT ====================

export function CodeOptimizationPanel({
  code,
  language,
  onApplyOptimization,
  autoAnalyze = true,
  debounceMs = 2000,
}: CodeOptimizationPanelProps) {
  // ==================== STATE ====================

  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedOptimization, setSelectedOptimization] = useState<OptimizationSuggestion | null>(null);
  const [selectedRefactoring, setSelectedRefactoring] = useState<RefactoringRecommendation | null>(null);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (!autoAnalyze || code.trim().length === 0) {
      setResult(null);
      return;
    }

    const timer = setTimeout(() => {
      analyzeCode();
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [code, language, autoAnalyze, debounceMs]);

  // ==================== HANDLERS ====================

  const analyzeCode = async () => {
    try {
      setIsAnalyzing(true);

      const response = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze code');
      }

      const data: OptimizationResult = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error analyzing code:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyOptimization = (optimization: OptimizationSuggestion) => {
    if (onApplyOptimization) {
      // In a real implementation, this would intelligently replace the specific code block
      // For now, we just pass the optimized code
      onApplyOptimization(optimization.optimizedCode);
    }
  };

  // ==================== RENDER HELPERS ====================

  const getTypeIcon = (type: OptimizationSuggestion['type']): string => {
    switch (type) {
      case 'performance':
        return '🚀';
      case 'readability':
        return '📖';
      case 'maintainability':
        return '🔧';
      default:
        return '💡';
    }
  };

  const getTypeColor = (type: OptimizationSuggestion['type']): string => {
    switch (type) {
      case 'performance':
        return 'text-blue-400 border-blue-500/30 bg-blue-900/10';
      case 'readability':
        return 'text-green-400 border-green-500/30 bg-green-900/10';
      case 'maintainability':
        return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/10';
      default:
        return 'text-gray-400 border-gray-500/30 bg-gray-900/10';
    }
  };

  const getPriorityColor = (priority: number): string => {
    if (priority >= 4) return 'text-red-400';
    if (priority >= 3) return 'text-orange-400';
    return 'text-yellow-400';
  };

  const renderCodeBlock = (code: string, title: string) => (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <pre className="text-xs bg-background p-3 rounded border border-border overflow-x-auto font-mono whitespace-pre">
        {code}
      </pre>
    </div>
  );

  // ==================== RENDER ====================

  if (!result && !isAnalyzing) return null;

  return (
    <Card className="code-optimization-panel border-terra-cyan/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center space-x-2">
              <span>🚀</span>
              <span>Code Optimization</span>
              {isAnalyzing && <span className="animate-pulse">Analyzing...</span>}
            </CardTitle>
            <CardDescription>
              {result ? (
                <span>
                  Found {result.optimizations.length} optimizations and {result.refactorings.length} refactorings •
                  Potential improvement: {result.totalImprovementPotential}%
                </span>
              ) : (
                <span>Analyzing code for optimization opportunities...</span>
              )}
            </CardDescription>
          </div>

          {result && (
            <Button size="sm" onClick={analyzeCode} disabled={isAnalyzing}>
              Re-analyze
            </Button>
          )}
        </div>
      </CardHeader>

      {result && (result.optimizations.length > 0 || result.refactorings.length > 0) && (
        <CardContent>
          <Tabs defaultValue="optimizations">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="optimizations">
                Optimizations ({result.optimizations.length})
              </TabsTrigger>
              <TabsTrigger value="refactoring">
                Refactorings ({result.refactorings.length})
              </TabsTrigger>
            </TabsList>

            {/* Optimizations Tab */}
            <TabsContent value="optimizations" className="space-y-4">
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-3">
                  {result.optimizations.map((opt) => (
                    <Card
                      key={opt.id}
                      className={`cursor-pointer transition-all ${
                        selectedOptimization?.id === opt.id ? 'ring-2 ring-terra-cyan' : ''
                      }`}
                      onClick={() =>
                        setSelectedOptimization(selectedOptimization?.id === opt.id ? null : opt)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{getTypeIcon(opt.type)}</span>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">{opt.title}</h4>
                                <p className="text-xs text-muted-foreground">{opt.description}</p>
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <Badge className={getTypeColor(opt.type)}>{opt.type}</Badge>
                                <Badge variant="outline" className="text-xs text-green-400">
                                  +{opt.improvementPercentage}%
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {opt.confidence}% confident
                                </Badge>
                              </div>
                            </div>

                            {selectedOptimization?.id === opt.id && (
                              <div className="space-y-3 pt-3 border-t border-border">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {renderCodeBlock(opt.originalCode, '❌ Before')}
                                  {renderCodeBlock(opt.optimizedCode, '✅ After')}
                                </div>

                                <div>
                                  <p className="text-xs font-semibold text-green-400 mb-2">
                                    ✨ Benefits:
                                  </p>
                                  <ul className="space-y-1">
                                    {opt.benefits.map((benefit, idx) => (
                                      <li key={idx} className="text-xs text-muted-foreground flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>{benefit}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1">
                                    {opt.tags.map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>

                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApplyOptimization(opt);
                                    }}
                                    disabled={!onApplyOptimization}
                                  >
                                    Apply Optimization
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {result.optimizations.length === 0 && (
                    <Alert>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">✅</span>
                        <div>
                          <p className="font-semibold text-sm text-green-400">Well optimized!</p>
                          <p className="text-xs text-muted-foreground">
                            No obvious performance optimizations detected.
                          </p>
                        </div>
                      </div>
                    </Alert>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Refactorings Tab */}
            <TabsContent value="refactoring" className="space-y-4">
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-3">
                  {result.refactorings.map((ref) => (
                    <Card
                      key={ref.id}
                      className={`cursor-pointer transition-all ${
                        selectedRefactoring?.id === ref.id ? 'ring-2 ring-terra-cyan' : ''
                      }`}
                      onClick={() =>
                        setSelectedRefactoring(selectedRefactoring?.id === ref.id ? null : ref)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">🔧</span>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">{ref.pattern}</h4>
                                <p className="text-xs text-muted-foreground">{ref.description}</p>
                              </div>

                              <Badge className={getPriorityColor(ref.priority)}>
                                Priority: {ref.priority}/5
                              </Badge>
                            </div>

                            {selectedRefactoring?.id === ref.id && (
                              <div className="space-y-3 pt-3 border-t border-border">
                                <div>
                                  <p className="text-xs font-semibold text-yellow-400 mb-2">
                                    💡 Rationale:
                                  </p>
                                  <p className="text-xs text-muted-foreground">{ref.rationale}</p>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {renderCodeBlock(ref.before, '❌ Before')}
                                  {renderCodeBlock(ref.after, '✅ After')}
                                </div>

                                <div>
                                  <p className="text-xs font-semibold text-terra-cyan mb-2">
                                    📋 Steps to Apply:
                                  </p>
                                  <ol className="space-y-1">
                                    {ref.steps.map((step, idx) => (
                                      <li key={idx} className="text-xs text-muted-foreground flex items-start">
                                        <span className="mr-2 font-semibold">{idx + 1}.</span>
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {result.refactorings.length === 0 && (
                    <Alert>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">✅</span>
                        <div>
                          <p className="font-semibold text-sm text-green-400">Clean code!</p>
                          <p className="text-xs text-muted-foreground">
                            No refactoring recommendations at this time.
                          </p>
                        </div>
                      </div>
                    </Alert>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Total improvement potential: {' '}
                <span className="text-green-400 font-semibold">
                  {result.totalImprovementPotential}%
                </span>
              </span>
              <span>
                Analysis time: {result.analysisTime.toFixed(0)}ms
              </span>
            </div>
          </div>
        </CardContent>
      )}

      {result && result.optimizations.length === 0 && result.refactorings.length === 0 && (
        <CardContent>
          <Alert>
            <div className="flex flex-col items-center space-y-2 py-4">
              <span className="text-4xl">🎉</span>
              <div className="text-center">
                <p className="font-semibold text-sm text-green-400">Excellent Code Quality!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No optimization opportunities or refactoring recommendations found.
                </p>
              </div>
            </div>
          </Alert>
        </CardContent>
      )}
    </Card>
  );
}

export default CodeOptimizationPanel;
