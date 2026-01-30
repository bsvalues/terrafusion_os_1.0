/**
 * ErrorPredictionPanel - Real-Time Error Prediction Display
 *
 * Production-ready component that displays AI-predicted errors, warnings,
 * and issues before code execution with suggested fixes.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 6 Day 2
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Alert } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

// ==================== TYPES ====================

export interface ErrorPrediction {
  id: string;
  severity: 'error' | 'warning' | 'info';
  type: 'syntax' | 'runtime' | 'logical' | 'performance' | 'security';
  message: string;
  description: string;
  line: number;
  column: number;
  confidence: number;
  suggestedFix: string;
  codeSnippet: string;
  tags: string[];
}

export interface ErrorPredictionResult {
  predictions: ErrorPrediction[];
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  overallConfidence: number;
  analysisTime: number;
  language: string;
}

export interface ErrorPredictionPanelProps {
  code: string;
  language: string;
  importedModules?: string[];
  definedVariables?: string[];
  definedFunctions?: string[];
  cellContext?: string;
  onFixApply?: (fix: string, line: number) => void;
  onLineClick?: (line: number) => void;
  autoAnalyze?: boolean;
  debounceMs?: number;
}

// ==================== COMPONENT ====================

export function ErrorPredictionPanel({
  code,
  language,
  importedModules = [],
  definedVariables = [],
  definedFunctions = [],
  cellContext = '',
  onFixApply,
  onLineClick,
  autoAnalyze = true,
  debounceMs = 1000,
}: ErrorPredictionPanelProps) {
  // ==================== STATE ====================

  const [result, setResult] = useState<ErrorPredictionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<ErrorPrediction | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

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

      const response = await fetch('/api/ai/predict-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          importedModules,
          definedVariables,
          definedFunctions,
          cellContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze code');
      }

      const data: ErrorPredictionResult = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error analyzing code:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyFix = (prediction: ErrorPrediction) => {
    if (onFixApply) {
      onFixApply(prediction.suggestedFix, prediction.line);
    }
  };

  const handleLineClick = (line: number) => {
    if (onLineClick) {
      onLineClick(line);
    }
  };

  // ==================== COMPUTED ====================

  const filteredPredictions = result?.predictions.filter((p) => {
    if (filterSeverity && p.severity !== filterSeverity) return false;
    if (filterType && p.type !== filterType) return false;
    return true;
  }) || [];

  const severityCounts = {
    error: result?.errors || 0,
    warning: result?.warnings || 0,
    info: result?.info || 0,
  };

  const typeCounts = result?.predictions.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // ==================== RENDER HELPERS ====================

  const getSeverityIcon = (severity: ErrorPrediction['severity']): string => {
    switch (severity) {
      case 'error':
        return '🔴';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  const getSeverityColor = (severity: ErrorPrediction['severity']): string => {
    switch (severity) {
      case 'error':
        return 'text-red-400 border-red-500/30 bg-red-900/10';
      case 'warning':
        return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/10';
      case 'info':
        return 'text-blue-400 border-blue-500/30 bg-blue-900/10';
      default:
        return 'text-gray-400 border-gray-500/30 bg-gray-900/10';
    }
  };

  const getTypeIcon = (type: ErrorPrediction['type']): string => {
    switch (type) {
      case 'syntax':
        return '📝';
      case 'runtime':
        return '⚡';
      case 'logical':
        return '🧩';
      case 'performance':
        return '🚀';
      case 'security':
        return '🔒';
      default:
        return '•';
    }
  };

  const getTypeColor = (type: ErrorPrediction['type']): string => {
    switch (type) {
      case 'syntax':
        return 'text-red-400';
      case 'runtime':
        return 'text-orange-400';
      case 'logical':
        return 'text-yellow-400';
      case 'performance':
        return 'text-blue-400';
      case 'security':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'text-green-400';
    if (confidence >= 75) return 'text-yellow-400';
    if (confidence >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  // ==================== RENDER ====================

  if (!result && !isAnalyzing) return null;

  return (
    <Card className="error-prediction-panel border-terra-cyan/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center space-x-2">
              <span>🤖</span>
              <span>AI Error Prediction</span>
              {isAnalyzing && <span className="animate-pulse">Analyzing...</span>}
            </CardTitle>
            <CardDescription>
              {result ? (
                <span>
                  Found {result.totalIssues} potential issue{result.totalIssues !== 1 ? 's' : ''} in{' '}
                  {result.analysisTime.toFixed(0)}ms
                </span>
              ) : (
                <span>Analyzing code for potential issues...</span>
              )}
            </CardDescription>
          </div>

          {result && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getSeverityColor('error')}>
                {result.errors} errors
              </Badge>
              <Badge variant="outline" className={getSeverityColor('warning')}>
                {result.warnings} warnings
              </Badge>
              <Badge variant="outline" className={getSeverityColor('info')}>
                {result.info} info
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      {result && result.totalIssues > 0 && (
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Filter:</span>

            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant={filterSeverity === null ? 'default' : 'outline'}
                onClick={() => setFilterSeverity(null)}
                className="text-xs h-7"
              >
                All
              </Button>
              {(Object.keys(severityCounts) as Array<keyof typeof severityCounts>).map((severity) => (
                <Button
                  key={severity}
                  size="sm"
                  variant={filterSeverity === severity ? 'default' : 'outline'}
                  onClick={() => setFilterSeverity(severity)}
                  className="text-xs h-7"
                >
                  {severity} ({severityCounts[severity]})
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center space-x-1">
              {Object.entries(typeCounts).map(([type, count]) => (
                <Button
                  key={type}
                  size="sm"
                  variant={filterType === type ? 'default' : 'outline'}
                  onClick={() => setFilterType(filterType === type ? null : type)}
                  className="text-xs h-7"
                >
                  {type} ({count})
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Predictions List */}
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {filteredPredictions.length === 0 ? (
                <Alert>
                  <p className="text-sm text-muted-foreground">No issues match the current filter</p>
                </Alert>
              ) : (
                filteredPredictions.map((prediction) => (
                  <div
                    key={prediction.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(prediction.severity)} cursor-pointer transition-colors ${
                      selectedPrediction?.id === prediction.id ? 'ring-2 ring-terra-cyan' : ''
                    }`}
                    onClick={() =>
                      setSelectedPrediction(
                        selectedPrediction?.id === prediction.id ? null : prediction
                      )
                    }
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getSeverityIcon(prediction.severity)}</span>
                        <span className="text-lg">{getTypeIcon(prediction.type)}</span>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-sm">{prediction.message}</h4>
                              <Badge variant="outline" className="text-xs">
                                Line {prediction.line}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getTypeColor(prediction.type)}`}
                              >
                                {prediction.type}
                              </Badge>
                            </div>

                            <p className="text-xs text-muted-foreground">{prediction.description}</p>
                          </div>

                          <Badge
                            variant="outline"
                            className={`text-xs ${getConfidenceColor(prediction.confidence)}`}
                          >
                            {prediction.confidence}% confident
                          </Badge>
                        </div>

                        {prediction.codeSnippet && (
                          <pre className="text-xs bg-background/50 p-2 rounded border border-border overflow-x-auto font-mono">
                            {prediction.codeSnippet}
                          </pre>
                        )}

                        {selectedPrediction?.id === prediction.id && (
                          <div className="space-y-2 pt-2 border-t border-border">
                            <div>
                              <p className="text-xs font-semibold text-green-400 mb-1">
                                💡 Suggested Fix:
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {prediction.suggestedFix}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplyFix(prediction);
                                }}
                                disabled={!onFixApply}
                              >
                                Apply Fix
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLineClick(prediction.line);
                                }}
                              >
                                Go to Line
                              </Button>
                            </div>

                            {prediction.tags.length > 0 && (
                              <div className="flex items-center space-x-1">
                                {prediction.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Summary */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Overall confidence: {' '}
                <span className={getConfidenceColor(result.overallConfidence)}>
                  {result.overallConfidence.toFixed(0)}%
                </span>
              </span>
              <span>
                Analysis time: {result.analysisTime.toFixed(0)}ms
              </span>
            </div>
          </div>
        </CardContent>
      )}

      {result && result.totalIssues === 0 && (
        <CardContent>
          <Alert>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-sm text-green-400">No issues detected!</p>
                <p className="text-xs text-muted-foreground">
                  Your code looks good. Analysis completed in {result.analysisTime.toFixed(0)}ms.
                </p>
              </div>
            </div>
          </Alert>
        </CardContent>
      )}
    </Card>
  );
}

export default ErrorPredictionPanel;
