/**
 * AIDebuggingPanel - AI-Powered Debugging Assistant UI
 *
 * Production-ready component providing intelligent debugging assistance,
 * error analysis, variable inspection, and execution path visualization.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 7 Day 1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert } from '../ui/alert';

// ==================== TYPES ====================

export interface DebugSuggestion {
  id: string;
  type: 'info' | 'warning' | 'error' | 'fix';
  title: string;
  description: string;
  lineNumber?: number;
  suggestedFix: string;
  confidence: number;
  relatedVariables: string[];
  category: string;
}

export interface VariableInspection {
  name: string;
  type: string;
  value: string;
  scope: 'local' | 'global' | 'parameter';
  isMutable: boolean;
  possibleIssues: string[];
  recommendation: string;
}

export interface ExecutionPath {
  id: string;
  lineNumbers: number[];
  pathDescription: string;
  probability: number;
  conditions: string[];
  outcome: string;
  isErrorPath: boolean;
}

export interface BreakpointAnalysis {
  lineNumber: number;
  context: string;
  availableVariables: string[];
  suggestedInspections: string[];
  reasoning: string;
  usefulness: number;
}

export interface DebugAnalysisResult {
  suggestions: DebugSuggestion[];
  variableInspections: VariableInspection[];
  possiblePaths: ExecutionPath[];
  breakpointAnalyses: BreakpointAnalysis[];
  rootCauseAnalysis: string;
  quickFixes: string[];
  analysisTime: number;
}

export interface AIDebuggingPanelProps {
  code: string;
  errorMessage?: string;
  lineNumber?: number;
  variables?: Record<string, any>;
  breakpoints?: number[];
  onFixApply?: (fix: string, lineNumber?: number) => void;
  autoAnalyze?: boolean;
}

// ==================== COMPONENT ====================

export function AIDebuggingPanel({
  code,
  errorMessage = '',
  lineNumber,
  variables = {},
  breakpoints = [],
  onFixApply,
  autoAnalyze = false,
}: AIDebuggingPanelProps) {
  // ==================== STATE ====================

  const [result, setResult] = useState<DebugAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [selectedSuggestion, setSelectedSuggestion] = useState<DebugSuggestion | null>(null);
  const [selectedPath, setSelectedPath] = useState<ExecutionPath | null>(null);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (autoAnalyze && errorMessage && code.trim().length > 0) {
      analyzeDebug();
    }
  }, [code, errorMessage, autoAnalyze]);

  // ==================== HANDLERS ====================

  const analyzeDebug = async () => {
    try {
      setIsAnalyzing(true);

      const response = await fetch('/api/ai/debug/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: 'python',
          lineNumber,
          variables,
          errorMessage,
          breakpoints,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze code for debugging');
      }

      const data: DebugAnalysisResult = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error analyzing debug:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyFix = useCallback(
    (fix: string, line?: number) => {
      if (onFixApply) {
        onFixApply(fix, line);
      }
    },
    [onFixApply]
  );

  // ==================== RENDER HELPERS ====================

  const getTypeIcon = (type: DebugSuggestion['type']): string => {
    switch (type) {
      case 'error':
        return '🔴';
      case 'warning':
        return '⚠️';
      case 'fix':
        return '🔧';
      case 'info':
        return '💡';
      default:
        return '❓';
    }
  };

  const getTypeColor = (type: DebugSuggestion['type']): string => {
    switch (type) {
      case 'error':
        return 'text-red-400 border-red-500/30 bg-red-900/10';
      case 'warning':
        return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/10';
      case 'fix':
        return 'text-green-400 border-green-500/30 bg-green-900/10';
      case 'info':
        return 'text-blue-400 border-blue-500/30 bg-blue-900/10';
      default:
        return 'text-gray-400 border-gray-500/30 bg-gray-900/10';
    }
  };

  const getScopeColor = (scope: VariableInspection['scope']): string => {
    switch (scope) {
      case 'global':
        return 'text-purple-400';
      case 'parameter':
        return 'text-blue-400';
      case 'local':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const renderCodeBlock = (code: string) => (
    <pre className="text-xs bg-background p-3 rounded border border-border overflow-x-auto font-mono whitespace-pre">
      {code}
    </pre>
  );

  // ==================== RENDER ====================

  if (!errorMessage && !result && !isAnalyzing) {
    return (
      <Card className="ai-debugging-panel border-terra-cyan/30">
        <CardContent className="py-8">
          <div className="text-center space-y-3">
            <span className="text-4xl">🐛</span>
            <p className="text-sm text-muted-foreground">
              No errors detected. Start debugging by running your code or click Analyze.
            </p>
            <Button size="sm" onClick={analyzeDebug} disabled={code.trim().length === 0}>
              Analyze Code
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="ai-debugging-panel border-terra-cyan/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center space-x-2">
              <span>🐛</span>
              <span>AI Debugging Assistant</span>
              {isAnalyzing && <span className="animate-pulse text-xs">Analyzing...</span>}
            </CardTitle>
            {result && (
              <CardDescription>
                {result.suggestions.length} suggestions • {result.variableInspections.length}{' '}
                variables • {result.possiblePaths.length} execution paths
              </CardDescription>
            )}
          </div>

          <Button size="sm" onClick={analyzeDebug} disabled={isAnalyzing}>
            Re-analyze
          </Button>
        </div>
      </CardHeader>

      {result && (
        <CardContent>
          {/* Root Cause Analysis */}
          {result.rootCauseAnalysis && (
            <Alert className="mb-4 border-red-500/30 bg-red-900/10">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-red-400 flex items-center space-x-2">
                  <span>🎯</span>
                  <span>Root Cause Analysis</span>
                </p>
                <p className="text-xs text-muted-foreground">{result.rootCauseAnalysis}</p>
              </div>
            </Alert>
          )}

          {/* Quick Fixes */}
          {result.quickFixes.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs font-semibold text-green-400 flex items-center space-x-2">
                <span>⚡</span>
                <span>Quick Fixes</span>
              </p>
              <div className="space-y-2">
                {result.quickFixes.map((fix, idx) => (
                  <Card key={idx} className="bg-background/50">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between space-x-3">
                        <div className="flex-1">
                          {renderCodeBlock(fix)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApplyFix(fix)}
                          disabled={!onFixApply}
                        >
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Detailed Analysis Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="suggestions">
                Suggestions ({result.suggestions.length})
              </TabsTrigger>
              <TabsTrigger value="variables">
                Variables ({result.variableInspections.length})
              </TabsTrigger>
              <TabsTrigger value="paths">Paths ({result.possiblePaths.length})</TabsTrigger>
              <TabsTrigger value="breakpoints">
                Breakpoints ({result.breakpointAnalyses.length})
              </TabsTrigger>
            </TabsList>

            {/* Suggestions Tab */}
            <TabsContent value="suggestions" className="space-y-4">
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-3">
                  {result.suggestions.map((suggestion) => (
                    <Card
                      key={suggestion.id}
                      className={`cursor-pointer transition-all ${
                        selectedSuggestion?.id === suggestion.id ? 'ring-2 ring-terra-cyan' : ''
                      }`}
                      onClick={() =>
                        setSelectedSuggestion(
                          selectedSuggestion?.id === suggestion.id ? null : suggestion
                        )
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{getTypeIcon(suggestion.type)}</span>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">
                                  {suggestion.title}
                                  {suggestion.lineNumber && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      Line {suggestion.lineNumber}
                                    </span>
                                  )}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {suggestion.description}
                                </p>
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <Badge className={getTypeColor(suggestion.type)}>
                                  {suggestion.type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.confidence}% confident
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {suggestion.category}
                                </Badge>
                              </div>
                            </div>

                            {selectedSuggestion?.id === suggestion.id && suggestion.suggestedFix && (
                              <div className="space-y-3 pt-3 border-t border-border">
                                <div>
                                  <p className="text-xs font-semibold text-green-400 mb-2">
                                    ✅ Suggested Fix:
                                  </p>
                                  {renderCodeBlock(suggestion.suggestedFix)}
                                </div>

                                {suggestion.relatedVariables.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-blue-400 mb-2">
                                      Related Variables:
                                    </p>
                                    <div className="flex items-center space-x-1">
                                      {suggestion.relatedVariables.map((varName) => (
                                        <Badge key={varName} variant="outline" className="text-xs">
                                          {varName}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApplyFix(suggestion.suggestedFix, suggestion.lineNumber);
                                  }}
                                  disabled={!onFixApply}
                                >
                                  Apply Fix
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {result.suggestions.length === 0 && (
                    <Alert>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">✅</span>
                        <div>
                          <p className="font-semibold text-sm text-green-400">
                            No Issues Detected
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Code appears to be error-free.
                          </p>
                        </div>
                      </div>
                    </Alert>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Variables Tab */}
            <TabsContent value="variables" className="space-y-4">
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-3">
                  {result.variableInspections.map((inspection, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-sm font-mono">{inspection.name}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Type: <span className="font-mono">{inspection.type}</span> •
                                Value: <span className="font-mono">{inspection.value}</span>
                              </p>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Badge className={getScopeColor(inspection.scope)}>
                                {inspection.scope}
                              </Badge>
                              {inspection.isMutable && (
                                <Badge variant="outline" className="text-xs">
                                  mutable
                                </Badge>
                              )}
                            </div>
                          </div>

                          {inspection.possibleIssues.length > 0 && (
                            <div className="pt-2 border-t border-border">
                              <p className="text-xs font-semibold text-yellow-400 mb-1">
                                ⚠️ Possible Issues:
                              </p>
                              <ul className="space-y-1">
                                {inspection.possibleIssues.map((issue, i) => (
                                  <li key={i} className="text-xs text-muted-foreground flex">
                                    <span className="mr-2">•</span>
                                    <span>{issue}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {inspection.recommendation && (
                            <div className="pt-2">
                              <p className="text-xs font-semibold text-blue-400 mb-1">
                                💡 Recommendation:
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {inspection.recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Execution Paths Tab */}
            <TabsContent value="paths" className="space-y-4">
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-3">
                  {result.possiblePaths.map((path) => (
                    <Card
                      key={path.id}
                      className={`cursor-pointer transition-all ${
                        selectedPath?.id === path.id ? 'ring-2 ring-terra-cyan' : ''
                      } ${path.isErrorPath ? 'border-red-500/30' : ''}`}
                      onClick={() => setSelectedPath(selectedPath?.id === path.id ? null : path)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-sm">
                                {path.isErrorPath && <span className="mr-2">🔴</span>}
                                {path.pathDescription}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">{path.outcome}</p>
                            </div>

                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                path.probability > 70 ? 'text-green-400' : 'text-yellow-400'
                              }`}
                            >
                              {path.probability}% likely
                            </Badge>
                          </div>

                          {selectedPath?.id === path.id && (
                            <div className="pt-3 border-t border-border space-y-2">
                              {path.conditions.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-blue-400 mb-1">
                                    Conditions:
                                  </p>
                                  <ul className="space-y-1">
                                    {path.conditions.map((condition, idx) => (
                                      <li
                                        key={idx}
                                        className="text-xs text-muted-foreground font-mono"
                                      >
                                        • {condition}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div>
                                <p className="text-xs font-semibold text-terra-cyan mb-1">
                                  Line Execution Sequence:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {path.lineNumbers.slice(0, 20).map((line) => (
                                    <Badge key={line} variant="secondary" className="text-xs">
                                      {line}
                                    </Badge>
                                  ))}
                                  {path.lineNumbers.length > 20 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{path.lineNumbers.length - 20} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Breakpoints Tab */}
            <TabsContent value="breakpoints" className="space-y-4">
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-3">
                  {result.breakpointAnalyses.map((analysis, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-sm">
                                Line {analysis.lineNumber}
                                <span className="ml-2 text-xs text-muted-foreground font-mono">
                                  {analysis.context}
                                </span>
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {analysis.reasoning}
                              </p>
                            </div>

                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                analysis.usefulness > 70
                                  ? 'text-green-400'
                                  : analysis.usefulness > 40
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {analysis.usefulness}% useful
                            </Badge>
                          </div>

                          {analysis.suggestedInspections.length > 0 && (
                            <div className="pt-2 border-t border-border">
                              <p className="text-xs font-semibold text-blue-400 mb-1">
                                💡 Suggested Inspections:
                              </p>
                              <ul className="space-y-1">
                                {analysis.suggestedInspections.map((inspection, i) => (
                                  <li key={i} className="text-xs text-muted-foreground flex">
                                    <span className="mr-2">•</span>
                                    <span>{inspection}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {analysis.availableVariables.length > 0 && (
                            <div className="pt-2">
                              <p className="text-xs font-semibold text-terra-cyan mb-1">
                                Variables in Scope ({analysis.availableVariables.length}):
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {analysis.availableVariables.map((varName) => (
                                  <Badge key={varName} variant="secondary" className="text-xs">
                                    {varName}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {result.breakpointAnalyses.length === 0 && (
                    <Alert>
                      <div className="text-center py-4">
                        <span className="text-2xl">📍</span>
                        <p className="font-semibold text-sm mt-2">No Breakpoints Set</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Add breakpoints to analyze their effectiveness
                        </p>
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
                Analysis completed in{' '}
                <span className="text-terra-cyan font-semibold">
                  {result.analysisTime.toFixed(0)}ms
                </span>
              </span>
              <span className="text-green-400">🐛 AI-Powered Debugging</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default AIDebuggingPanel;
