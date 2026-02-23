/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFLOW DESIGN ENGINE
 * Revolutionary UI ↔ System Synchronization
 * Where every visual motion ties to real system events
 * ═══════════════════════════════════════════════════════════════
 */

import { cn } from '@utils/cn';
import { motion, useAnimation } from 'framer-motion';
import React, { useEffect, useState } from 'react';

// Design Engine Integration Types
interface TerraFlowMetrics {
  systemHealth: number;
  aiConfidence: number;
  dataIngestionRate: number;
  mcpChannelActivity: boolean;
}

interface TerraMotionConfig {
  duration: { fast: number; medium: number; slow: number };
  easing: { out: number[]; inOut: number[] };
  spring: { stiffness: number; damping: number };
}

// Revolutionary Motion Constants (Design Tokens)
export const terraMotion: TerraMotionConfig = {
  duration: { fast: 150, medium: 300, slow: 400 },
  easing: { out: [0.25, 0.1, 0.25, 1.0], inOut: [0.42, 0, 0.58, 1.0] },
  spring: { stiffness: 120, damping: 18 },
};

// Depth System (Z-Layers)
export const terraDepth = {
  background: 0,
  baseCards: 100,
  panels: 200,
  alerts: 300,
  terraSphere: 400,
};

// Revolutionary Color Synchronization System
export const getTerraGlow = (confidence: number): string => {
  if (confidence > 0.95) return 'hsl(var(--tf-cyan-hs) 50% / 0.8)'; // Terra Cyan
  if (confidence > 0.7) return 'hsl(var(--tf-green-hs) 50% / 0.6)'; // Terra Green
  return 'hsl(var(--tf-amber-hs) 50% / 0.6)'; // Amber warning
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
  const controls = useAnimation();
  const [glowIntensity, setGlowIntensity] = useState(0.3);

  // Panel pulse based on system health
  useEffect(() => {
    const pulseIntensity = Math.max(0.2, systemHealth);
    setGlowIntensity(pulseIntensity);

    controls.start({
      boxShadow: `0 0 ${20 + systemHealth * 20}px ${getTerraGlow(aiConfidence)}`,
      transition: { duration: terraMotion.duration.medium },
    });
  }, [systemHealth, aiConfidence, controls]);

  // Glass refraction ripple on data ingestion
  const handleDataIngest = () => {
    controls.start({
      scale: [1, 1.02, 1],
      boxShadow: [
        `0 0 20px ${getTerraGlow(aiConfidence)}`,
        `0 0 40px ${getTerraGlow(aiConfidence)}`,
        `0 0 20px ${getTerraGlow(aiConfidence)}`,
      ],
      transition: { duration: terraMotion.duration.slow, ease: terraMotion.easing.out },
    });
    onDataIngest?.();
  };

  return (
    <motion.div
      animate={controls}
      whileHover={{ y: -2, scale: 1.01 }}
      className={cn(
        // Base glass styling
        'relative backdrop-blur-md bg-gradient-to-br from-slate-900/40 to-slate-800/40',
        'border border-slate-700/30 rounded-xl p-6',
        // Dynamic glow based on system state
        'shadow-lg transition-all duration-300',
        className
      )}
      style={{
        zIndex: terraDepth.baseCards,
        boxShadow: `0 0 20px ${getTerraGlow(aiConfidence)}`,
      }}
      onClick={handleDataIngest}
    >
      {children}

      {/* Ambient glow overlay */}
      <div
        className={cn(
          'terra-ambient-overlay',
          aiConfidence > 0.95 && 'terra-ambient-high',
          aiConfidence > 0.7 && aiConfidence <= 0.95 && 'terra-ambient-medium',
          aiConfidence <= 0.7 && 'terra-ambient-warning'
        )}
      />
    </motion.div>
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
    const duration = terraMotion.duration.medium;
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
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className='text-center'
      >
        <div className='text-3xl font-bold mb-2' style={{ color: getTerraGlow(confidence) }}>
          {displayValue.toLocaleString()}
          {unit}
        </div>
        <div className='text-sm text-slate-400 mb-2'>{label}</div>

        {/* Trend Sparkline */}
        {trend.length > 0 && (
          <div className='h-8 flex items-end justify-center space-x-1'>
            {trend.map((point, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${(point / Math.max(...trend)) * 100}%` }}
                transition={{ delay: index * 0.05 }}
                className='w-1 bg-gradient-to-t from-slate-600 to-cyan-400 rounded-full'
                style={{ minHeight: '2px' }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

/**
 * TerraSphere - System health orb (WebGL shader)
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
  const controls = useAnimation();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  useEffect(() => {
    if (variant === 'quantum') {
      controls.start({
        rotate: 360,
        scale: [1, 1.1, 1],
        transition: {
          rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
          scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        },
      });
    }
  }, [variant, controls]);

  return (
    <motion.div
      animate={controls}
      className={cn('relative rounded-full flex items-center justify-center', sizeClasses[size])}
      style={{
        background: `conic-gradient(from 0deg, ${getTerraGlow(systemHealth)}, var(--tf-accent-indigo), ${getTerraGlow(systemHealth)})`,
        zIndex: terraDepth.terraSphere,
      }}
    >
      <div className='absolute inset-1 rounded-full bg-slate-900/80 backdrop-blur-sm' />
      <div className='relative text-xs font-bold' style={{ color: getTerraGlow(systemHealth) }}>
        {Math.round(systemHealth * 100)}%
      </div>
    </motion.div>
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
    <div className='terra-chat relative'>
      {/* MCP Channel Activity Indicator */}
      {mcpActive && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
          className='absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full'
        />
      )}

      <div className='space-y-3 max-h-96 overflow-y-auto'>
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'p-3 rounded-lg max-w-[80%]',
              message.isAI
                ? 'bg-slate-800/60 border border-cyan-500/30 ml-auto'
                : 'bg-slate-700/60 border border-slate-600/30 mr-auto'
            )}
            style={{
              boxShadow: message.isAI
                ? `0 0 10px ${getTerraGlow(message.confidence || 0.9)}`
                : undefined,
            }}
          >
            <div className='text-sm text-slate-200'>{message.text}</div>
            {message.isAI && message.confidence && (
              <div className='text-xs text-slate-400 mt-1'>
                Confidence: {Math.round(message.confidence * 100)}%
              </div>
            )}
          </motion.div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='flex space-x-1 p-3'
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                className='w-2 h-2 bg-cyan-400 rounded-full'
              />
            ))}
          </motion.div>
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
