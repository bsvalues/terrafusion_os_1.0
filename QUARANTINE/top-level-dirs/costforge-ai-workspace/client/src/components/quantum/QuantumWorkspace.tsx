/**
 * QuantumWorkspace - Primary Immersive Analytics Environment
 * PhD-level spatial + statistical analysis with real-time data visualization
 * 
 * TerraFusion OS - Government. Transcended.
 * 
 * This is the cognitive workspace where elite analysts IMMERSE themselves in data:
 * - SEE: Real-time 3D visualization, geospatial intelligence
 * - ANALYZE: Bayesian inference, Monte Carlo, spatial autocorrelation
 * - BUILD: Custom AI workflows, model fine-tuning
 * - TOOLS: Complete analytical arsenal
 * - SYNC: Multi-device collaboration
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Box,
  BarChart3,
  Clock,
  Network,
  Layers,
  Database,
  Filter,
  Calculator,
  Download,
  Settings,
  Users,
  Eye,
  Brain,
  Workflow,
  Wrench
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { Property } from '@shared/schema';
import GISMapCanvas from '@/components/quantum/GISMapCanvas';
import Property3DCluster from '@/components/quantum/Property3DCluster';
import QuantumStatisticalWorkbench from '@/components/quantum/QuantumStatisticalWorkbench';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type PrimaryView = 'map' | '3d-model' | 'statistical' | 'timeline' | 'network';
type SecondaryView = 'property-detail' | 'comparison' | 'model-tuning' | null;
type OverlayMode = 'metrics' | 'controls' | 'collaboration' | 'none';
type AnalysisMode = 'exploratory' | 'mass-appraisal' | 'comparative' | 'predictive';

interface WorkspaceView {
  primary: PrimaryView;
  secondary?: SecondaryView;
  overlay: OverlayMode;
}

interface WorkspaceProps {
  className?: string;
  initialView?: PrimaryView;
  initialProperties?: Property[]; // Optional: provide initial properties
  onPropertySelect?: (properties: Property[]) => void;
}

interface FloatingMetric {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}

// ============================================================================
// QUANTUM GRID BACKGROUND COMPONENT
// ============================================================================

const QuantumGrid: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* Animated grid lines */}
    <div className="absolute inset-0 opacity-20">
      <div className="grid-lines-horizontal" />
      <div className="grid-lines-vertical" />
    </div>

    {/* Pulsing quantum nodes */}
    <div className="quantum-nodes">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="quantum-node"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>

    <style>{`
      .grid-lines-horizontal,
      .grid-lines-vertical {
        position: absolute;
        inset: 0;
      }
      
      .grid-lines-horizontal {
        background: linear-gradient(
          to bottom,
          transparent 0%,
          transparent calc(100% / 20 - 1px),
          #00ffee 1px,
          transparent calc(100% / 20)
        );
        background-size: 100% calc(100% / 20);
      }
      
      .grid-lines-vertical {
        background: linear-gradient(
          to right,
          transparent 0%,
          transparent calc(100% / 30 - 1px),
          #00ffee 1px,
          transparent calc(100% / 30)
        );
        background-size: calc(100% / 30) 100%;
      }
      
      .quantum-nodes {
        position: absolute;
        inset: 0;
      }
      
      .quantum-node {
        position: absolute;
        width: 4px;
        height: 4px;
        background: #00ffee;
        border-radius: 50%;
        box-shadow: 0 0 10px #00ffee, 0 0 20px #00ffee;
        animation: quantum-pulse 3s ease-in-out infinite;
      }
      
      @keyframes quantum-pulse {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.5); }
      }
    `}</style>
  </div>
);

// ============================================================================
// FLOATING METRICS HUD COMPONENT
// ============================================================================

interface FloatingMetricsHUDProps {
  propertyCount: number;
  analysisMode: AnalysisMode;
  realTimeStats?: {
    meanValue: number;
    confidence: number;
    spatialCorrelation: number;
  };
}

const FloatingMetricsHUD: React.FC<FloatingMetricsHUDProps> = ({
  propertyCount,
  analysisMode,
  realTimeStats,
}) => {
  const metrics: FloatingMetric[] = useMemo(() => [
    {
      label: 'Properties Selected',
      value: propertyCount.toLocaleString(),
      color: '#00ffee',
      icon: <Database className="w-4 h-4" />,
    },
    {
      label: 'Analysis Mode',
      value: analysisMode.replace('-', ' ').toUpperCase(),
      color: '#00ffaa',
      icon: <Brain className="w-4 h-4" />,
    },
    {
      label: 'Mean Value',
      value: realTimeStats?.meanValue
        ? `$${(realTimeStats.meanValue / 1000).toFixed(0)}K`
        : '--',
      color: '#0099ff',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      label: 'Confidence',
      value: realTimeStats?.confidence
        ? `${(realTimeStats.confidence * 100).toFixed(1)}%`
        : '--',
      color: '#00ffaa',
      icon: <Eye className="w-4 h-4" />,
    },
  ], [propertyCount, analysisMode, realTimeStats]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 left-4 right-4 z-20 pointer-events-none"
    >
      <div className="flex flex-wrap gap-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="pointer-events-auto"
          >
            <Card
              className="bg-black/70 backdrop-blur-md border-[#00ffee]/30 hover:border-[#00ffee]/60 transition-all duration-300"
              style={{ borderColor: `${metric.color}40` }}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${metric.color}20`, color: metric.color }}
                >
                  {metric.icon}
                </div>
                <div>
                  <div className="text-xs text-white/60 uppercase tracking-wider">
                    {metric.label}
                  </div>
                  <div
                    className="text-lg font-bold font-mono"
                    style={{ color: metric.color }}
                  >
                    {metric.value}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ============================================================================
// TOOL PALETTE COMPONENT
// ============================================================================

interface ToolPaletteProps {
  activeView: PrimaryView;
  onViewChange: (view: PrimaryView) => void;
  analysisMode: AnalysisMode;
}

const ToolPalette: React.FC<ToolPaletteProps> = ({
  activeView,
  onViewChange,
  analysisMode,
}) => {
  const tools = [
    { id: 'map' as PrimaryView, label: 'GIS Map', icon: MapPin, color: '#00ffee' },
    { id: '3d-model' as PrimaryView, label: '3D Space', icon: Box, color: '#0099ff' },
    { id: 'statistical' as PrimaryView, label: 'Statistics', icon: BarChart3, color: '#00ffaa' },
    { id: 'timeline' as PrimaryView, label: 'Timeline', icon: Clock, color: '#ff00ff' },
    { id: 'network' as PrimaryView, label: 'Network', icon: Network, color: '#ff9900' },
  ];

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="absolute left-0 top-1/2 -translate-y-1/2 z-30"
    >
      <Card className="bg-[#0f1419]/90 backdrop-blur-xl border-r border-t border-b border-[#00ffee]/20 rounded-r-lg shadow-2xl">
        <CardContent className="p-3 space-y-2">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={activeView === tool.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange(tool.id)}
              className={`w-full justify-start gap-2 ${activeView === tool.id
                  ? 'bg-[#00ffee]/20 text-[#00ffee] border border-[#00ffee]/50'
                  : 'text-white/70 hover:text-[#00ffee] hover:bg-[#00ffee]/10'
                }`}
            >
              <tool.icon className="w-4 h-4" style={{ color: tool.color }} />
              <span className="text-xs font-medium">{tool.label}</span>
            </Button>
          ))}

          <div className="border-t border-[#00ffee]/20 my-2 pt-2">
            <div className="text-xs text-[#00ffee]/60 uppercase tracking-wider px-2 mb-2">
              Mode
            </div>
            <Badge
              variant="outline"
              className="w-full justify-center border-[#00ffaa]/30 text-[#00ffaa]"
            >
              {analysisMode.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ============================================================================
// COMMAND BAR COMPONENT
// ============================================================================

interface CommandBarProps {
  onCommand: (command: string) => void;
}

const CommandBar: React.FC<CommandBarProps> = ({ onCommand }) => {
  const [commandInput, setCommandInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandInput.trim()) {
      onCommand(commandInput.trim());
      setCommandInput('');
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-3xl px-4"
    >
      <Card className="bg-black/80 backdrop-blur-xl border-[#00ffee]/30 shadow-2xl">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type command or use Ctrl+K for quick actions..."
                className="w-full bg-white/5 border border-[#00ffee]/30 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#00ffee] focus:ring-2 focus:ring-[#00ffee]/20"
              />
            </div>
            <Button
              type="submit"
              className="bg-[#00ffee] text-black hover:bg-[#00ffaa] font-bold"
            >
              Execute
            </Button>
            <Button
              variant="outline"
              className="border-[#00ffee]/30 text-[#00ffee]"
              onClick={() => console.log('AI Assistant opened')}
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Assist
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ============================================================================
// MAIN QUANTUM WORKSPACE COMPONENT
// ============================================================================

export const QuantumWorkspace: React.FC<WorkspaceProps> = ({
  className = '',
  initialView = 'map',
  initialProperties,
  onPropertySelect,
}) => {
  const [view, setView] = useState<WorkspaceView>({
    primary: initialView,
    overlay: 'metrics',
  });

  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('exploratory');

  // Fetch property data from API (only if not provided via props)
  const { data: apiProperties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties', 100],
    queryFn: async () => {
      const response = await fetch('/api/properties?limit=100');
      if (!response.ok) throw new Error('Failed to fetch properties');
      const result = await response.json();
      return result.data as Property[];
    },
    enabled: !initialProperties, // Only fetch if no properties provided
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Use provided properties or fetched properties
  const allProperties = initialProperties || apiProperties || [];

  // Use all properties for workspace availability
  const availableProperties = useMemo(() => {
    return allProperties;
  }, [allProperties]);

  const handlePropertySelect = useCallback((properties: Property[]) => {
    setSelectedProperties(properties);
    onPropertySelect?.(properties);
  }, [onPropertySelect]);

  const handleSinglePropertySelect = useCallback((propertyId: string) => {
    // Find property by ID and add to selection
    const property = allProperties.find(p => p.propertyId === propertyId);
    if (property) {
      handlePropertySelect([property]);
    }
  }, [allProperties, handlePropertySelect]);

  // Extract selected property IDs for components that need them
  const selectedPropertyIds = useMemo(
    () => selectedProperties.map(p => p.propertyId),
    [selectedProperties]
  );

  // Map analysis mode for GISMapCanvas (it doesn't support 'predictive')
  const gisAnalysisMode = useMemo(() =>
    analysisMode === 'predictive' ? 'statistical' : analysisMode,
    [analysisMode]
  ) as 'exploratory' | 'mass-appraisal' | 'comparative' | 'statistical';

  const handleViewChange = useCallback((primary: PrimaryView) => {
    setView(prev => ({ ...prev, primary }));
  }, []);

  const handleCommand = useCallback((command: string) => {
    console.log('Command executed:', command);
    // TODO: Implement command processing logic
  }, []);

  // Mock real-time stats (will be replaced with actual data)
  const realTimeStats = useMemo(() => {
    if (availableProperties.length === 0) {
      return { meanValue: 0, confidence: 0, spatialCorrelation: 0 };
    }

    const values = availableProperties
      .map(p => p.assessedValue || p.totalValue || 0)
      .filter(v => v > 0);

    const meanValue = values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;

    const avgConfidence = availableProperties
      .map(p => p.aiConfidenceScore || 0.95)
      .reduce((a, b) => a + b, 0) / availableProperties.length;

    return {
      meanValue: Math.round(meanValue),
      confidence: avgConfidence,
      spatialCorrelation: 0.76, // Will be calculated from actual spatial analysis
    };
  }, [availableProperties]);

  return (
    <div className={`h-screen w-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a] overflow-hidden relative ${className}`}>
      {/* Quantum Grid Background */}
      <QuantumGrid />

      {/* Loading State Overlay */}
      {propertiesLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b1020]/90 backdrop-blur-sm z-50"
        >
          <Database className="w-16 h-16 text-[#00ffee] animate-pulse mb-4" />
          <div className="text-[#00ffee] text-xl font-light tracking-wider mb-2">
            Loading Property Intelligence
          </div>
          <div className="text-[#00ffaa] text-sm">
            Quantum neural network initializing {availableProperties.length} properties...
          </div>
        </motion.div>
      )}

      {/* Primary Visualization Canvas */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view.primary}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 z-10"
        >
          {/* Render actual visualization components */}
          {view.primary === 'map' && (
            <GISMapCanvas
              properties={availableProperties.length > 0 ? availableProperties : selectedProperties}
              onPropertySelect={handlePropertySelect}
              analysisMode={gisAnalysisMode}
            />
          )}

          {view.primary === '3d-model' && (
            <Property3DCluster
              properties={availableProperties.length > 0 ? availableProperties : selectedProperties}
              onPropertySelect={handleSinglePropertySelect}
              selectedProperties={selectedPropertyIds}
              clusterBy="value"
            />
          )}

          {view.primary === 'statistical' && (
            <QuantumStatisticalWorkbench
              properties={availableProperties.length > 0 ? availableProperties : selectedProperties}
              onExportResults={(results, method) => {
                console.log('Export results:', method, results);
                // TODO: Implement actual export functionality
              }}
            />
          )}

          {view.primary === 'timeline' && (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#0b1020] to-[#1a2332]">
              <Card className="bg-black/40 backdrop-blur-md border-[#00ffee]/30 p-8">
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">⏱️</div>
                  <h2 className="text-3xl font-bold text-[#00ffee]">
                    TEMPORAL ANALYSIS
                  </h2>
                  <p className="text-white/70 max-w-md">
                    Historical trends, market cycles, predictive modeling
                  </p>
                  <Badge variant="outline" className="border-[#00ffee]/30 text-[#00ffee] mt-4">
                    Component: TimelineVisualization
                  </Badge>
                </div>
              </Card>
            </div>
          )}

          {view.primary === 'network' && (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#0b1020] to-[#1a2332]">
              <Card className="bg-black/40 backdrop-blur-md border-[#00ffee]/30 p-8">
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">🕸️</div>
                  <h2 className="text-3xl font-bold text-[#00ffee]">
                    PROPERTY NETWORK
                  </h2>
                  <p className="text-white/70 max-w-md">
                    Relationship mapping, influence analysis, connectivity metrics
                  </p>
                  <Badge variant="outline" className="border-[#00ffee]/30 text-[#00ffee] mt-4">
                    Component: NetworkGraph
                  </Badge>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Floating Metrics HUD */}
      <FloatingMetricsHUD
        propertyCount={availableProperties.length}
        analysisMode={analysisMode}
        realTimeStats={realTimeStats}
      />

      {/* Left Sidebar - Tool Palette */}
      <ToolPalette
        activeView={view.primary}
        onViewChange={handleViewChange}
        analysisMode={analysisMode}
      />

      {/* Right Sidebar - Context Panel (slides in when needed) */}
      <AnimatePresence>
        {view.secondary && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 h-full w-[400px] bg-black/40 backdrop-blur-xl border-l border-[#00ffee]/20 z-20 overflow-y-auto"
          >
            <Card className="m-4 bg-[#0f1419]/90 border-[#00ffee]/30">
              <CardHeader>
                <CardTitle className="text-[#00ffee]">
                  {view.secondary === 'property-detail' && 'Property Deep Dive'}
                  {view.secondary === 'comparison' && 'Comparative Analysis'}
                  {view.secondary === 'model-tuning' && 'AI Model Tuning'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/70">
                <p>Context panel implementation for: {view.secondary}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Command Bar */}
      <CommandBar onCommand={handleCommand} />
    </div>
  );
};

export default QuantumWorkspace;
