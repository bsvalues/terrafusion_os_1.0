/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFLOW DESIGN ENGINE - PURE CSS VERSION
 * Revolutionary UI ↔ System Synchronization
 * No React type conflicts, maximum compatibility
 * ═══════════════════════════════════════════════════════════════
 */

import { cn } from '@utils/cn';
import React, { useEffect, useState } from 'react';
import './terraflow-tokens.css';

// Design Engine Integration Types
interface TerraFlowMetrics {
  systemHealth: number;
  aiConfidence: number;
  dataIngestionRate: number;
  mcpChannelActivity: boolean;
}

// Revolutionary Color Synchronization System
export const getConfidenceClass = (confidence: number): string => {
  if (confidence > 0.95) return 'high-confidence';
  if (confidence > 0.7) return 'medium-confidence';
  return 'low-confidence';
};

export const getGlowClass = (confidence: number): string => {
  if (confidence > 0.95) return 'terra-glow-high';
  if (confidence > 0.7) return 'terra-glow-medium';
  return 'terra-glow-warning';
};

export const getAmbientClass = (confidence: number): string => {
  if (confidence > 0.95) return 'terra-ambient-high';
  if (confidence > 0.7) return 'terra-ambient-medium';
  return 'terra-ambient-warning';
};

export const getSphereClass = (health: number): string => {
  if (health > 0.8) return 'terra-sphere-high';
  if (health > 0.6) return 'terra-sphere-medium';
  return 'terra-sphere-warning';
};

/**
 * TerraPanel - Glass card with depth & hover lift
 * Revolutionary UI ↔ System synchronization
 */
interface TerraPanelProps {
  children: React.ReactNode;
  systemHealth?: number;
  aiConfidence?: number;
  className?: string;
  onDataIngest?: () => void;
}

export const TerraPanel: React.FC<TerraPanelProps> = ({
  children,
  systemHealth = 0.8,
  aiConfidence = 0.9,
  className,
  onDataIngest,
}) => {
  const [isActive, setIsActive] = useState(false);

  // Glass refraction ripple on data ingestion
  const handleDataIngest = () => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), 400);
    onDataIngest?.();
  };

  return (
    <div
      className={cn(
        'terra-panel',
        getGlowClass(aiConfidence),
        isActive && 'terra-panel-active',
        className
      )}
      onClick={handleDataIngest}
    >
      {children}

      {/* Ambient glow overlay */}
      <div className={cn('terra-ambient-overlay', getAmbientClass(aiConfidence))} />
    </div>
  );
};

/**
 * TerraMetric - Animated number with glow + trend sparkline
 * Living telemetry surface
 */
interface TerraMetricProps {
  value: number;
  label: string;
  trend?: number[];
  confidence?: number;
  unit?: string;
}

export const TerraMetric: React.FC<TerraMetricProps> = ({
  value,
  label,
  trend = [],
  confidence = 0.9,
  unit = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  // Animate number counting
  useEffect(() => {
    const duration = 300;
    const steps = 30;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className='terra-metric'>
      <div className={cn('terra-metric-value', getConfidenceClass(confidence))}>
        {displayValue.toLocaleString()}
        {unit}
      </div>
      <div className='terra-metric-label'>{label}</div>

      {/* Trend Sparkline */}
      {trend.length > 0 && (
        <div className='terra-sparkline'>
          {trend.map((point, index) => (
            <div
              key={index}
              className={cn(
                'terra-sparkline-bar',
                `terra-bar-${Math.round((point / Math.max(...trend)) * 10)}`
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * TerraSphere - System health orb
 * Living system consciousness
 */
interface TerraSphereProps {
  systemHealth: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'quantum' | 'glow' | 'pulse' | 'static';
}

export const TerraSphere: React.FC<TerraSphereProps> = ({
  systemHealth,
  size = 'md',
  variant = 'quantum',
}) => {
  return (
    <div
      className={cn(
        'terra-sphere',
        `size-${size}`,
        getSphereClass(systemHealth),
        variant === 'quantum' && 'terra-sphere-quantum',
        variant === 'pulse' && 'terra-sphere-pulse'
      )}
    >
      <div className='terra-sphere-inner' />
      <div className={cn('terra-sphere-content', getConfidenceClass(systemHealth))}>
        {Math.round(systemHealth * 100)}%
      </div>
    </div>
  );
};

/**
 * TerraChat - AI panel with typing animations
 * MCP channel message synchronization
 */
interface TerraChatProps {
  messages: Array<{ text: string; isAI: boolean; confidence?: number }>;
  isTyping?: boolean;
  mcpActive?: boolean;
}

export const TerraChat: React.FC<TerraChatProps> = ({
  messages,
  isTyping = false,
  mcpActive = false,
}) => {
  return (
    <div className='terra-chat'>
      {/* MCP Channel Activity Indicator */}
      {mcpActive && <div className='terra-mcp-indicator' />}

      <div className='terra-chat-messages'>
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              'terra-chat-message',
              message.isAI ? 'ai' : 'user',
              message.isAI && message.confidence && getConfidenceClass(message.confidence),
              `terra-message-delay-${index % 5}`
            )}
          >
            <div className='terra-chat-text'>{message.text}</div>
            {message.isAI && message.confidence && (
              <div className='terra-chat-confidence'>
                Confidence: {Math.round(message.confidence * 100)}%
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className='terra-typing'>
            <div className='terra-typing-dot' />
            <div className='terra-typing-dot' />
            <div className='terra-typing-dot' />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * TerraFlow Design Engine Hook
 * Orchestrates all UI ↔ System synchronization
 */
export const useTerraFlow = () => {
  const [metrics, setMetrics] = useState<TerraFlowMetrics>({
    systemHealth: 0.85,
    aiConfidence: 0.92,
    dataIngestionRate: 1250,
    mcpChannelActivity: false,
  });

  // Mock WebSocket connection for real system events
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        systemHealth: Math.max(0.1, prev.systemHealth + (Math.random() - 0.5) * 0.1),
        aiConfidence: Math.max(0.5, prev.aiConfidence + (Math.random() - 0.5) * 0.05),
        dataIngestionRate: Math.max(0, prev.dataIngestionRate + (Math.random() - 0.5) * 200),
        mcpChannelActivity: Math.random() > 0.7,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { metrics, setMetrics };
};

/**
 * Revolutionary Modal System
 * Government-grade modal interfaces with quantum glassmorphism
 */
interface TerraModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'property' | 'tax' | 'ai';
}

export const TerraModal: React.FC<TerraModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  const getModalContent = () => {
    switch (type) {
      case 'property':
        return (
          <div className='space-y-6'>
            <div className='flex items-center space-x-3'>
              <TerraSphere size='md' systemHealth={0.94} />
              <div>
                <h2 className='text-2xl font-bold text-white'>Property Assessment Module</h2>
                <p className='text-slate-400'>CAMA-powered valuation system</p>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='terra-glass p-4 rounded-lg'>
                <h3 className='text-lg font-semibold text-cyan-300 mb-2'>Quick Assessment</h3>
                <input
                  type='text'
                  placeholder='Enter parcel ID...'
                  className='w-full p-2 bg-slate-800/50 border border-cyan-500/30 rounded text-white placeholder-slate-400'
                />
                <button className='w-full mt-3 p-2 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-300 hover:bg-cyan-500/30 transition-all'>
                  🔍 Analyze Property
                </button>
              </div>

              <div className='terra-glass p-4 rounded-lg'>
                <h3 className='text-lg font-semibold text-emerald-300 mb-2'>Batch Processing</h3>
                <div className='text-sm text-slate-300 mb-2'>Upload property list (.csv)</div>
                <div className='border-2 border-dashed border-slate-600 rounded p-4 text-center text-slate-400'>
                  Drop file here or click to browse
                </div>
              </div>
            </div>

            <div className='terra-glass p-4 rounded-lg'>
              <h3 className='text-lg font-semibold text-white mb-3'>Recent Assessments</h3>
              <div className='space-y-2'>
                {['PAR-2024-001', 'PAR-2024-002', 'PAR-2024-003'].map((parcel) => (
                  <div
                    key={parcel}
                    className='flex justify-between items-center p-2 bg-slate-800/30 rounded'
                  >
                    <span className='text-slate-300'>{parcel}</span>
                    <span className='text-cyan-400'>$284,500</span>
                    <span className='text-emerald-400 text-sm'>✓ Complete</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'tax':
        return (
          <div className='space-y-6'>
            <div className='flex items-center space-x-3'>
              <TerraSphere size='md' systemHealth={0.91} />
              <div>
                <h2 className='text-2xl font-bold text-white'>Tax Report Generator</h2>
                <p className='text-slate-400'>Automated levy and assessment reporting</p>
              </div>
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <div className='terra-glass p-4 rounded-lg'>
                <h3 className='text-lg font-semibold text-emerald-300 mb-2'>Annual Reports</h3>
                <div className='space-y-2'>
                  <button className='w-full p-2 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-300 text-sm hover:bg-emerald-500/30 transition-all'>
                    📄 Assessment Roll
                  </button>
                  <button className='w-full p-2 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-300 text-sm hover:bg-emerald-500/30 transition-all'>
                    💰 Tax Levy Report
                  </button>
                  <button className='w-full p-2 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-300 text-sm hover:bg-emerald-500/30 transition-all'>
                    📊 Revenue Summary
                  </button>
                </div>
              </div>

              <div className='terra-glass p-4 rounded-lg'>
                <h3 className='text-lg font-semibold text-purple-300 mb-2'>Custom Reports</h3>
                <select
                  className='w-full p-2 bg-slate-800/50 border border-purple-500/30 rounded text-white mb-2'
                  title='Select report type'
                >
                  <option>Property Type Analysis</option>
                  <option>Geographic Distribution</option>
                  <option>Revenue Projection</option>
                </select>
                <button className='w-full p-2 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 hover:bg-purple-500/30 transition-all'>
                  🎯 Generate Report
                </button>
              </div>

              <div className='terra-glass p-4 rounded-lg'>
                <h3 className='text-lg font-semibold text-cyan-300 mb-2'>Export Options</h3>
                <div className='space-y-2 text-sm'>
                  <label className='flex items-center space-x-2 text-slate-300'>
                    <input type='checkbox' className='accent-cyan-500' />
                    <span>PDF Format</span>
                  </label>
                  <label className='flex items-center space-x-2 text-slate-300'>
                    <input type='checkbox' className='accent-cyan-500' />
                    <span>Excel Export</span>
                  </label>
                  <label className='flex items-center space-x-2 text-slate-300'>
                    <input type='checkbox' className='accent-cyan-500' />
                    <span>State Compliance</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className='space-y-6'>
            <div className='flex items-center space-x-3'>
              <TerraSphere size='md' systemHealth={0.97} />
              <div>
                <h2 className='text-2xl font-bold text-white'>AI Analysis Center</h2>
                <p className='text-slate-400'>Advanced intelligence and predictive analytics</p>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-6'>
              <div className='space-y-4'>
                <div className='terra-glass p-4 rounded-lg'>
                  <h3 className='text-lg font-semibold text-purple-300 mb-3'>Predictive Models</h3>
                  <div className='space-y-3'>
                    <div className='flex justify-between items-center'>
                      <span className='text-slate-300'>Market Value Prediction</span>
                      <span className='text-emerald-400'>94% Accuracy</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-slate-300'>Tax Collection Forecast</span>
                      <span className='text-cyan-400'>91% Accuracy</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-slate-300'>Appeal Risk Analysis</span>
                      <span className='text-purple-400'>88% Accuracy</span>
                    </div>
                  </div>
                </div>

                <div className='terra-glass p-4 rounded-lg'>
                  <h3 className='text-lg font-semibold text-cyan-300 mb-3'>Data Insights</h3>
                  <div className='text-sm text-slate-300 space-y-2'>
                    <div>• 23% increase in commercial valuations this quarter</div>
                    <div>• Residential market showing strong growth trends</div>
                    <div>• Agricultural properties need reassessment priority</div>
                  </div>
                </div>
              </div>

              <div className='terra-glass p-4 rounded-lg'>
                <h3 className='text-lg font-semibold text-emerald-300 mb-3'>AI Assistant</h3>
                <div className='bg-slate-900/50 rounded p-3 mb-3 max-h-40 overflow-y-auto'>
                  <div className='text-sm space-y-2'>
                    <div className='text-cyan-400'>
                      AI: Ready to assist with analysis. What would you like to explore?
                    </div>
                    <div className='text-slate-300'>
                      You: Show me properties with high appeal risk
                    </div>
                    <div className='text-cyan-400'>
                      AI: Analyzing 1,247 properties... Found 23 high-risk assessments. Would you
                      like detailed breakdown?
                    </div>
                  </div>
                </div>
                <div className='flex space-x-2'>
                  <input
                    type='text'
                    placeholder='Ask AI anything...'
                    className='flex-1 p-2 bg-slate-800/50 border border-emerald-500/30 rounded text-white placeholder-slate-400'
                  />
                  <button className='px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-300 hover:bg-emerald-500/30 transition-all'>
                    🚀
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-6'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' onClick={onClose} />

      {/* Modal */}
      <div className='relative w-full max-w-4xl max-h-[90vh] overflow-y-auto terra-glass rounded-xl p-8'>
        <button
          onClick={onClose}
          className='absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors'
        >
          ✕
        </button>

        {getModalContent()}
      </div>
    </div>
  );
};
