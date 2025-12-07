/**
 * IntelligentCellSuggestions - AI-Powered Next Cell Recommendations
 *
 * Production-ready component that analyzes notebook context and suggests
 * the next logical code cells based on data science workflow patterns.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 6 Day 1
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';

// ==================== TYPES ====================

export interface CellSuggestion {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  category: 'import' | 'exploration' | 'visualization' | 'transformation' | 'analysis' | 'export';
  confidence: number;
  reasoning: string;
  dependencies?: string[];
  tags?: string[];
}

export interface NotebookContext {
  cells: string[];
  language: string;
  importedModules: string[];
  definedVariables: string[];
  dataFrames: string[];
  lastCellType?: 'import' | 'data-load' | 'exploration' | 'visualization' | 'transformation';
}

export interface IntelligentCellSuggestionsProps {
  context: NotebookContext;
  onAcceptSuggestion: (suggestion: CellSuggestion) => void;
  onDismiss?: () => void;
  maxSuggestions?: number;
  autoShow?: boolean;
  minimumConfidence?: number;
}

// ==================== COMPONENT ====================

export function IntelligentCellSuggestions({
  context,
  onAcceptSuggestion,
  onDismiss,
  maxSuggestions = 5,
  autoShow = true,
  minimumConfidence = 60,
}: IntelligentCellSuggestionsProps) {
  // ==================== STATE ====================

  const [suggestions, setSuggestions] = useState<CellSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<CellSuggestion | null>(null);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (autoShow && context.cells.length > 0) {
      fetchSuggestions();
    }
  }, [context.cells.length, autoShow]);

  // ==================== HANDLERS ====================

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/ai/cell-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cell suggestions');
      }

      const result: CellSuggestion[] = await response.json();

      const filteredSuggestions = result
        .filter((s) => s.confidence >= minimumConfidence)
        .slice(0, maxSuggestions);

      setSuggestions(filteredSuggestions);
      setIsVisible(filteredSuggestions.length > 0);
    } catch (error) {
      console.error('Error fetching cell suggestions:', error);

      // Fallback to client-side suggestions
      const fallbackSuggestions = generateFallbackSuggestions(context);
      setSuggestions(fallbackSuggestions);
      setIsVisible(fallbackSuggestions.length > 0);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackSuggestions = (ctx: NotebookContext): CellSuggestion[] => {
    const suggestions: CellSuggestion[] = [];

    // If no imports, suggest common data science imports
    if (ctx.importedModules.length === 0) {
      suggestions.push({
        id: 'import-basics',
        title: 'Import Essential Libraries',
        description: 'Import NumPy, Pandas, and Matplotlib for data analysis',
        code: 'import numpy as np\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\nprint("Libraries imported successfully!")',
        language: ctx.language,
        category: 'import',
        confidence: 95,
        reasoning: 'No libraries imported yet. These are essential for data science.',
        tags: ['numpy', 'pandas', 'matplotlib'],
      });
    }

    // If imports exist but no data loaded
    if (ctx.importedModules.length > 0 && ctx.dataFrames.length === 0) {
      suggestions.push({
        id: 'load-data',
        title: 'Load Dataset',
        description: 'Load data from a CSV file into a Pandas DataFrame',
        code: '# Load your dataset\ndf = pd.read_csv(\'data.csv\')\nprint(f"Loaded {len(df)} rows and {len(df.columns)} columns")\ndf.head()',
        language: ctx.language,
        category: 'exploration',
        confidence: 90,
        reasoning: 'Libraries imported but no data loaded yet.',
        dependencies: ['pandas'],
        tags: ['data-loading', 'csv'],
      });
    }

    // If data loaded, suggest exploration
    if (ctx.dataFrames.length > 0 && ctx.lastCellType === 'data-load') {
      const dfName = ctx.dataFrames[0];

      suggestions.push({
        id: 'explore-data',
        title: 'Explore Data Structure',
        description: 'Get information about your dataset',
        code: `# Explore the dataset\nprint("Dataset Info:")\nprint("-" * 50)\nprint(${dfName}.info())\nprint("\\nStatistical Summary:")\nprint("-" * 50)\nprint(${dfName}.describe())`,
        language: ctx.language,
        category: 'exploration',
        confidence: 95,
        reasoning: 'Data just loaded. Next step is typically to explore its structure.',
        tags: ['exploration', 'info', 'describe'],
      });

      suggestions.push({
        id: 'check-missing',
        title: 'Check for Missing Values',
        description: 'Identify and visualize missing data',
        code: `# Check for missing values\nmissing = ${dfName}.isnull().sum()\nmissing_pct = 100 * ${dfName}.isnull().sum() / len(${dfName})\nmissing_data = pd.DataFrame({'Missing': missing, 'Percent': missing_pct})\nprint(missing_data[missing_data['Missing'] > 0].sort_values('Percent', ascending=False))`,
        language: ctx.language,
        category: 'exploration',
        confidence: 85,
        reasoning: 'Important to check data quality before analysis.',
        tags: ['missing-values', 'data-quality'],
      });
    }

    // If exploration done, suggest visualization
    if (ctx.lastCellType === 'exploration' && ctx.dataFrames.length > 0) {
      const dfName = ctx.dataFrames[0];

      suggestions.push({
        id: 'visualize-distribution',
        title: 'Visualize Data Distribution',
        description: 'Create histograms for numerical columns',
        code: `# Visualize data distribution\n${dfName}.hist(figsize=(14, 10), bins=30, edgecolor='black')\nplt.suptitle('Data Distribution', fontsize=16, y=1.00)\nplt.tight_layout()\nplt.show()`,
        language: ctx.language,
        category: 'visualization',
        confidence: 88,
        reasoning: 'After exploration, visualizing distributions helps understand data.',
        dependencies: ['matplotlib'],
        tags: ['histogram', 'distribution'],
      });

      suggestions.push({
        id: 'correlation-heatmap',
        title: 'Correlation Heatmap',
        description: 'Visualize relationships between numerical variables',
        code: `# Correlation heatmap\nimport seaborn as sns\n\nplt.figure(figsize=(12, 8))\ncorr = ${dfName}.corr()\nsns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm', center=0)\nplt.title('Correlation Heatmap', fontsize=16)\nplt.tight_layout()\nplt.show()`,
        language: ctx.language,
        category: 'visualization',
        confidence: 82,
        reasoning: 'Correlation analysis reveals relationships between variables.',
        dependencies: ['matplotlib', 'seaborn'],
        tags: ['correlation', 'heatmap'],
      });
    }

    // If visualization done, suggest transformations
    if (ctx.lastCellType === 'visualization' && ctx.dataFrames.length > 0) {
      const dfName = ctx.dataFrames[0];

      suggestions.push({
        id: 'handle-missing',
        title: 'Handle Missing Values',
        description: 'Fill or remove missing values',
        code: `# Handle missing values\n# Option 1: Fill with mean (for numerical columns)\n${dfName}_clean = ${dfName}.copy()\nnumeric_cols = ${dfName}_clean.select_dtypes(include=['float64', 'int64']).columns\n${dfName}_clean[numeric_cols] = ${dfName}_clean[numeric_cols].fillna(${dfName}_clean[numeric_cols].mean())\n\n# Option 2: Drop rows with missing values\n# ${dfName}_clean = ${dfName}.dropna()\n\nprint(f"Original shape: {${dfName}.shape}")\nprint(f"Cleaned shape: {${dfName}_clean.shape}")`,
        language: ctx.language,
        category: 'transformation',
        confidence: 80,
        reasoning: 'After identifying issues, next step is data cleaning.',
        tags: ['missing-values', 'data-cleaning'],
      });

      suggestions.push({
        id: 'feature-engineering',
        title: 'Feature Engineering',
        description: 'Create new features from existing data',
        code: `# Feature engineering example\n${dfName}_features = ${dfName}.copy()\n\n# Example: Create interaction features\n# ${dfName}_features['feature_interaction'] = ${dfName}_features['col1'] * ${dfName}_features['col2']\n\n# Example: Binning numerical features\n# ${dfName}_features['age_group'] = pd.cut(${dfName}_features['age'], bins=[0, 18, 35, 50, 100])\n\nprint("New features created successfully!")`,
        language: ctx.language,
        category: 'transformation',
        confidence: 75,
        reasoning: 'Feature engineering can improve analysis and modeling.',
        tags: ['feature-engineering', 'transformation'],
      });
    }

    return suggestions.slice(0, maxSuggestions);
  };

  const handleAccept = (suggestion: CellSuggestion) => {
    onAcceptSuggestion(suggestion);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handlePreview = (suggestion: CellSuggestion) => {
    setSelectedSuggestion(selectedSuggestion?.id === suggestion.id ? null : suggestion);
  };

  // ==================== RENDER HELPERS ====================

  const getCategoryIcon = (category: CellSuggestion['category']): string => {
    switch (category) {
      case 'import':
        return '📚';
      case 'exploration':
        return '🔍';
      case 'visualization':
        return '📊';
      case 'transformation':
        return '⚙️';
      case 'analysis':
        return '🧮';
      case 'export':
        return '💾';
      default:
        return '📝';
    }
  };

  const getCategoryColor = (category: CellSuggestion['category']): string => {
    switch (category) {
      case 'import':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'exploration':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'visualization':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'transformation':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'analysis':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'export':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'text-green-400';
    if (confidence >= 75) return 'text-yellow-400';
    return 'text-orange-400';
  };

  // ==================== RENDER ====================

  if (!isVisible || suggestions.length === 0) return null;

  return (
    <Card className="ai-cell-suggestions border-terra-cyan/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center space-x-2">
              <span>🤖</span>
              <span>AI Suggestions</span>
              <Badge variant="secondary" className="text-xs">
                {suggestions.length} ideas
              </Badge>
            </CardTitle>
            <CardDescription>
              Based on your notebook context, here's what you might want to do next
            </CardDescription>
          </div>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            ✕
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading && (
          <Alert>
            <div className="flex items-center space-x-2">
              <div className="animate-spin">⚡</div>
              <span className="text-sm">Analyzing notebook context...</span>
            </div>
          </Alert>
        )}

        <ScrollArea className="max-h-96">
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-4 rounded-lg border border-border hover:border-terra-cyan/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-2xl">{getCategoryIcon(suggestion.category)}</span>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getCategoryColor(suggestion.category)}`}
                        >
                          {suggestion.category}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">
                        {suggestion.description}
                      </p>

                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-muted-foreground">Confidence:</span>
                        <span className={`font-semibold ${getConfidenceColor(suggestion.confidence)}`}>
                          {suggestion.confidence}%
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground italic">
                          {suggestion.reasoning}
                        </span>
                      </div>

                      {suggestion.tags && suggestion.tags.length > 0 && (
                        <div className="flex items-center space-x-1 mt-2">
                          {suggestion.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Code Preview */}
                {selectedSuggestion?.id === suggestion.id && (
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-2">Preview:</div>
                    <pre className="text-xs bg-accent p-3 rounded border border-border overflow-x-auto font-mono">
                      {suggestion.code}
                    </pre>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(suggestion)}
                    className="flex-1"
                  >
                    <span className="mr-1">✓</span>
                    Insert Cell
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreview(suggestion)}
                  >
                    {selectedSuggestion?.id === suggestion.id ? 'Hide' : 'Preview'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {suggestions.length === 0 && !isLoading && (
          <Alert>
            <p className="text-sm text-muted-foreground">
              No suggestions available. Keep coding and I'll suggest next steps!
            </p>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default IntelligentCellSuggestions;
