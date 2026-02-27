/**
 * TerraFusion Consciousness Engine
 * AI-powered interface adaptation for government transcendence
 * Learns user patterns and provides predictive assistance
 */
import { useQuantumPerformance } from '@/hooks/useQuantumPerformance';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface UserPattern {
  action: string;
  context: string;
  frequency: number;
  timeOfDay: number;
  success: boolean;
  timestamp: number;
}

interface ConsciousnessState {
  level: 'AWAKENING' | 'AWARE' | 'TRANSCENDENT';
  confidence: number;
  predictedActions: string[];
  adaptiveRecommendations: string[];
  userExperience: 'NOVICE' | 'PROFICIENT' | 'EXPERT';
  governmentContext: 'ASSESSMENT' | 'PLANNING' | 'REPORTING' | 'ANALYSIS';
}

interface PredictiveAssistance {
  suggestion: string;
  confidence: number;
  reason: string;
  action: () => void;
}

export function useConsciousnessEngine() {
  const [consciousness, setConsciousness] = useState<ConsciousnessState>({
    level: 'AWAKENING',
    confidence: 0,
    predictedActions: [],
    adaptiveRecommendations: [],
    userExperience: 'NOVICE',
    governmentContext: 'ASSESSMENT',
  });

  const [userPatterns, setUserPatterns] = useState<UserPattern[]>([]);
  const [assistance, setAssistance] = useState<PredictiveAssistance[]>([]);
  const sessionData = useRef<Map<string, any>>(new Map());
  const { isTranscendent } = useQuantumPerformance();

  // Learn from user interactions
  const learnFromAction = useCallback(
    (action: string, context: string, success: boolean = true) => {
      const pattern: UserPattern = {
        action,
        context,
        frequency: 1,
        timeOfDay: new Date().getHours(),
        success,
        timestamp: Date.now(),
      };

      setUserPatterns((prev) => {
        const existing = prev.find((p) => p.action === action && p.context === context);
        if (existing) {
          return prev.map((p) =>
            p === existing ? { ...p, frequency: p.frequency + 1, timestamp: Date.now() } : p
          );
        }
        return [...prev, pattern];
      });

      // Update consciousness level based on patterns
      const patternCount = userPatterns.length;
      const successRate = userPatterns.filter((p) => p.success).length / Math.max(patternCount, 1);

      setConsciousness((prev) => ({
        ...prev,
        level:
          patternCount > 100 && successRate > 0.8
            ? 'TRANSCENDENT'
            : patternCount > 50 && successRate > 0.7
              ? 'AWARE'
              : 'AWAKENING',
        confidence: Math.min(100, successRate * 100),
      }));
    },
    [userPatterns]
  );

  // Predict next likely actions
  const predictNextActions = useCallback(() => {
    const currentHour = new Date().getHours();
    const recentPatterns = userPatterns
      .filter((p) => Math.abs(p.timeOfDay - currentHour) <= 2)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);

    const predictions = recentPatterns.map((p) => p.action);

    setConsciousness((prev) => ({
      ...prev,
      predictedActions: predictions,
    }));

    return predictions;
  }, [userPatterns]);

  // Generate adaptive UI recommendations
  const generateRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    // Performance-based recommendations
    if (!isTranscendent) {
      recommendations.push('Optimize interface for better performance');
    }

    // Usage pattern recommendations
    const mostUsedActions = userPatterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
      .map((p) => p.action);

    if (mostUsedActions.length > 0) {
      recommendations.push(`Quick access panel for: ${mostUsedActions.join(', ')}`);
    }

    // Experience level adaptations
    if (consciousness.userExperience === 'NOVICE') {
      recommendations.push('Show guided tours and helpful tooltips');
    } else if (consciousness.userExperience === 'EXPERT') {
      recommendations.push('Enable advanced keyboard shortcuts and power tools');
    }

    setConsciousness((prev) => ({
      ...prev,
      adaptiveRecommendations: recommendations,
    }));
  }, [userPatterns, consciousness.userExperience, isTranscendent]);

  // Provide predictive assistance
  const providePredictiveAssistance = useCallback(() => {
    const assistanceItems: PredictiveAssistance[] = [];

    // Government workflow assistance
    if (consciousness.governmentContext === 'ASSESSMENT') {
      assistanceItems.push({
        suggestion: 'Auto-populate property details from county records',
        confidence: 85,
        reason: 'Based on your recent assessment patterns',
        action: () => console.log('Auto-populating property data...'),
      });
    }

    // Time-based assistance
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 11) {
      assistanceItems.push({
        suggestion: 'Review pending assessments from yesterday',
        confidence: 75,
        reason: 'Morning review pattern detected',
        action: () => console.log('Loading pending assessments...'),
      });
    }

    // Efficiency improvements
    const repeatActions = userPatterns.filter((p) => p.frequency > 10).map((p) => p.action);

    if (repeatActions.length > 0) {
      assistanceItems.push({
        suggestion: 'Create macro for repeated workflow',
        confidence: 90,
        reason: `You've repeated "${repeatActions[0]}" ${userPatterns.find((p) => p.action === repeatActions[0])?.frequency} times`,
        action: () => console.log('Creating workflow macro...'),
      });
    }

    setAssistance(assistanceItems);
  }, [consciousness, userPatterns]);

  // Consciousness enhancement based on system performance
  useEffect(() => {
    if (isTranscendent) {
      setConsciousness((prev) => ({
        ...prev,
        level: 'TRANSCENDENT',
        confidence: Math.min(100, prev.confidence + 5),
      }));
    }
  }, [isTranscendent]);

  // Periodic consciousness updates
  useEffect(() => {
    const interval = setInterval(() => {
      predictNextActions();
      generateRecommendations();
      providePredictiveAssistance();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [predictNextActions, generateRecommendations, providePredictiveAssistance]);

  // Context-aware government workflow detection
  const detectGovernmentContext = useCallback((path: string, actions: string[]) => {
    let context: ConsciousnessState['governmentContext'] = 'ASSESSMENT';

    if (path.includes('valuation') || actions.includes('calculate-cost')) {
      context = 'ASSESSMENT';
    } else if (path.includes('planning') || actions.includes('zone-analysis')) {
      context = 'PLANNING';
    } else if (path.includes('reports') || actions.includes('generate-report')) {
      context = 'REPORTING';
    } else if (path.includes('analytics') || actions.includes('view-trends')) {
      context = 'ANALYSIS';
    }

    setConsciousness((prev) => ({ ...prev, governmentContext: context }));
  }, []);

  return {
    consciousness,
    assistance,
    learnFromAction,
    predictNextActions,
    detectGovernmentContext,
    isTranscendent: consciousness.level === 'TRANSCENDENT',
  };
}

// Consciousness UI Component
export function ConsciousnessIndicator() {
  const { consciousness, assistance } = useConsciousnessEngine();

  const getLevelColor = () => {
    switch (consciousness.level) {
      case 'TRANSCENDENT':
        return 'text-terra-cyan';
      case 'AWARE':
        return 'text-success-green';
      default:
        return 'text-warning-amber';
    }
  };

  const getLevelGlow = () => {
    switch (consciousness.level) {
      case 'TRANSCENDENT':
        return 'shadow-[0_0_20px_hsl(var(--tf-accent)_/_0.6)]';
      case 'AWARE':
        return 'shadow-[0_0_15px_hsl(var(--tf-success)_/_0.4)]';
      default:
        return 'shadow-[0_0_10px_hsl(var(--tf-warning)_/_0.3)]';
    }
  };

  return React.createElement(
    'div',
    {
      className: `tf-consciousness-indicator terra-glass p-4 rounded-xl ${getLevelGlow()}`,
    },
    [
      React.createElement(
        'div',
        {
          key: 'header',
          className: 'flex items-center justify-between mb-3',
        },
        [
          React.createElement(
            'div',
            {
              key: 'status',
              className: 'flex items-center gap-2',
            },
            [
              React.createElement('div', {
                key: 'orb',
                className: `w-4 h-4 rounded-full bg-gradient-to-r from-terra-cyan to-terra-blue animate-pulse`,
              }),
              React.createElement(
                'span',
                {
                  key: 'level',
                  className: `text-sm font-semibold ${getLevelColor()}`,
                },
                consciousness.level
              ),
            ]
          ),
          React.createElement(
            'span',
            {
              key: 'confidence',
              className: 'text-xs text-gray-400',
            },
            `${consciousness.confidence.toFixed(0)}% confidence`
          ),
        ]
      ),

      // Government Context
      React.createElement(
        'div',
        {
          key: 'context',
          className: 'mb-3',
        },
        [
          React.createElement(
            'div',
            {
              key: 'context-label',
              className: 'text-xs text-gray-500 mb-1',
            },
            'Government Context'
          ),
          React.createElement(
            'div',
            {
              key: 'context-value',
              className: 'text-sm text-terra-cyan font-medium',
            },
            consciousness.governmentContext
          ),
        ]
      ),

      // Predicted Actions
      consciousness.predictedActions.length > 0 &&
        React.createElement(
          'div',
          {
            key: 'predictions',
            className: 'mb-3',
          },
          [
            React.createElement(
              'div',
              {
                key: 'predictions-label',
                className: 'text-xs text-gray-500 mb-1',
              },
              'Likely Next Actions'
            ),
            React.createElement(
              'div',
              {
                key: 'predictions-list',
                className: 'flex flex-wrap gap-1',
              },
              consciousness.predictedActions.map((action, index) =>
                React.createElement(
                  'span',
                  {
                    key: index,
                    className: 'text-xs px-2 py-1 bg-terra-cyan/20 text-terra-cyan rounded-full',
                  },
                  action
                )
              )
            ),
          ]
        ),

      // Assistance
      assistance.length > 0 &&
        React.createElement(
          'div',
          {
            key: 'assistance',
            className: 'space-y-2',
          },
          [
            React.createElement(
              'div',
              {
                key: 'assistance-label',
                className: 'text-xs text-gray-500',
              },
              'AI Assistance'
            ),
            ...assistance.slice(0, 2).map((item, index) =>
              React.createElement(
                'div',
                {
                  key: index,
                  className:
                    'p-2 bg-terra-midnight/50 rounded cursor-pointer hover:bg-terra-midnight/70 transition-colors',
                  onClick: item.action,
                },
                [
                  React.createElement(
                    'div',
                    {
                      key: 'suggestion',
                      className: 'text-xs text-white mb-1',
                    },
                    item.suggestion
                  ),
                  React.createElement(
                    'div',
                    {
                      key: 'reason',
                      className: 'text-xs text-gray-400',
                    },
                    `${item.reason} (${item.confidence}% confidence)`
                  ),
                ]
              )
            ),
          ]
        ),
    ]
  );
}

// HOC for consciousness-aware components
export function withConsciousness<T extends object>(Component: React.ComponentType<T>) {
  return function ConsciousnessWrapper(props: T) {
    const { learnFromAction, detectGovernmentContext } = useConsciousnessEngine();

    useEffect(() => {
      // Detect context from current path
      detectGovernmentContext(window.location.pathname, []);
    }, [detectGovernmentContext]);

    const enhancedProps = {
      ...props,
      onTerraFusionAction: (action: string, context: string, success?: boolean) => {
        learnFromAction(action, context, success);
      },
    };

    return React.createElement(Component, enhancedProps);
  };
}
