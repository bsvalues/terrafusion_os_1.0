import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, Warning, DollarSign, Users, Shield, Zap, Eye  } from '@mui/icons-material';

interface Discovery {
  type: 'corruption' | 'efficiency' | 'compliance' | 'revenue' | 'pattern' | 'prediction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact?: string;
  savings?: string;
  risk?: string;
  recommendation?: string;
  confidence: number;
  timestamp: Date;
}

interface AIInsightsProps {
  discoveries: Discovery[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ discoveries: initialDiscoveries }) => {
  const [discoveries, setDiscoveries] = useState<Discovery[]>(initialDiscoveries);
  const [selectedDiscovery, setSelectedDiscovery] = useState<Discovery | null>(null);
  const [newDiscoveryAlert, setNewDiscoveryAlert] = useState(false);

  // Simulate real-time discoveries
  useEffect(() => {
    const interval = setInterval(() => {
      const randomDiscoveries: Discovery[] = [
        {
          type: 'revenue',
          severity: 'high',
          title: 'Uncollected Revenue Opportunity Detected',
          description: 'AI identified 234 properties with outdated valuations',
          savings: '$1.2M annually',
          recommendation: 'Automated revaluation could recover revenue immediately',
          confidence: 92,
          timestamp: new Date()
        },
        {
          type: 'pattern',
          severity: 'medium',
          title: 'Unusual Permit Approval Pattern',
          description: 'Permits from specific ZIP codes approved 5x faster',
          impact: 'Potential bias in approval process',
          recommendation: 'Review approval criteria for consistency',
          confidence: 87,
          timestamp: new Date()
        },
        {
          type: 'prediction',
          severity: 'low',
          title: 'Infrastructure Maintenance Prediction',
          description: 'Based on permit history, 3 bridges will need inspection next month',
          impact: 'Preventive maintenance opportunity',
          recommendation: 'Schedule inspections proactively',
          confidence: 94,
          timestamp: new Date()
        }
      ];

      // Randomly add a new discovery
      if (Math.random() > 0.7) {
        const newDiscovery = randomDiscoveries[Math.floor(Math.random() * randomDiscoveries.length)];
        setDiscoveries(prev => [newDiscovery, ...prev].slice(0, 10)); // Keep max 10
        setNewDiscoveryAlert(true);
        setTimeout(() => setNewDiscoveryAlert(false), 3000);
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'corruption': return <Warning className="w-5 h-5" />;
      case 'efficiency': return <TrendingUp className="w-5 h-5" />;
      case 'compliance': return <Shield className="w-5 h-5" />;
      case 'revenue': return <DollarSign className="w-5 h-5" />;
      case 'pattern': return <Eye className="w-5 h-5" />;
      case 'prediction': return <Brain className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-500/50';
      case 'high': return 'text-orange-400 bg-orange-900/30 border-orange-500/50';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50';
      case 'low': return 'text-blue-400 bg-blue-900/30 border-blue-500/50';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500/50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'corruption': return 'SUSPICIOUS ACTIVITY';
      case 'efficiency': return 'EFFICIENCY GAIN';
      case 'compliance': return 'COMPLIANCE ISSUE';
      case 'revenue': return 'REVENUE OPPORTUNITY';
      case 'pattern': return 'PATTERN DETECTED';
      case 'prediction': return 'AI PREDICTION';
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="relative">
      {/* New Discovery Alert */}
      <AnimatePresence>
        {newDiscoveryAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute -top-16 left-0 right-0 z-50"
          >
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center justify-center gap-3">
              <Brain className="w-5 h-5 animate-pulse" />
              <span className="font-semibold">AI found something new!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discovery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {discoveries.map((discovery /* , index */) => (
          <motion.div
            key={`${discovery.title}-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03 }}
            onClick={() => setSelectedDiscovery(discovery)}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${getSeverityColor(discovery.severity)}`}
          >
            {/* Confidence Badge */}
            <div className="absolute top-4 right-4">
              <div className="text-xs font-bold text-white/60">
                {discovery.confidence}% confidence
              </div>
            </div>

            {/* Icon and Type */}
            <div className="flex items-center gap-3 mb-3"><>

              <div className="p-2 rounded-lg bg-white/10">
                {getIcon(discovery.type)}
              </div>
              <span
</>
className="text-xs font-bold tracking-wider opacity-80">
                {getTypeLabel(discovery.type)}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold mb-2 text-white">
              {discovery.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-white/70 mb-4">
              {discovery.description}
            </p>

            {/* Impact Metrics */}
            <div className="space-y-2">
              {discovery.savings && (
                <div className="flex items-center gap-2 text-green-400">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-semibold">{discovery.savings}</span>
                </div>
              )}
              {discovery.impact && (
                <div className="flex items-center gap-2 text-blue-400">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{discovery.impact}</span>
                </div>
              )}
              {discovery.risk && (
                <div className="flex items-center gap-2 text-red-400">
                  <Warning className="w-4 h-4" />
                  <span className="text-sm">{discovery.risk}</span>
                </div>
              )}
            </div>

            {/* Animated Pulse Effect for Critical Items */}
            {discovery.severity === 'critical' && (
              <div className="absolute inset-0 rounded-xl bg-red-500/20 animate-pulse pointer-events-none" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Detailed View Modal */}
      <AnimatePresence>
        {selectedDiscovery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDiscovery(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-8 max-w-2xl w-full border border-purple-500/30"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4"><>

                  <div className={`p-3 rounded-xl ${getSeverityColor(selectedDiscovery.severity)}`}>
                    {getIcon(selectedDiscovery.type)}
                  </div>
                  <div
</>
</>><>

                    <div className="text-sm font-bold text-white/60 mb-1">
                      {getTypeLabel(selectedDiscovery.type)}
                    </div>
                    <h2
</>
className="text-2xl font-bold text-white">
                      {selectedDiscovery.title}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDiscovery(null)}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-lg text-white/80 mb-6">
                {selectedDiscovery.description}
              </p>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedDiscovery.savings && (
                  <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30"><>

                    <div className="text-sm text-green-400 mb-1">Potential Savings</div>
                    <div
</>
className="text-2xl font-bold text-white">{selectedDiscovery.savings}</div>
                  </div>
                )}
                {selectedDiscovery.confidence && (
                  <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/30"><>

                    <div className="text-sm text-purple-400 mb-1">AI Confidence</div>
                    <div
</>
className="text-2xl font-bold text-white">{selectedDiscovery.confidence}%</div>
                  </div>
                )}
              </div>

              {/* Recommendation */}
              {selectedDiscovery.recommendation && (
                <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30 mb-6">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-blue-400 mt-1" />
                    <div><>

                      <div className="text-sm font-bold text-blue-400 mb-2">AI Recommendation</div>
                      <p
</>
className="text-white/80">{selectedDiscovery.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4"><>

                <button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:scale-105 transition-transform">
                  Take Action Now
                </button>
                <button
</>
className="flex-1 bg-white/10 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                  Schedule for Later
                </button>
              </div>

              <div className="mt-6 text-center text-sm text-white/40">
                Discovered by AI at {selectedDiscovery.timestamp.toLocaleTimeString()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};