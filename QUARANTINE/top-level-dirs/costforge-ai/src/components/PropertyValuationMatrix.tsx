import { Float, OrbitControls, Text3D } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

// TerraFusion Quantum Types
interface QuantumAnalyticsProps {
  accuracyTarget: number;
  optimizationFactor: number;
  agentCount: number;
  researchMode: 'phd_analysis' | 'championship_research' | 'transcendent_discovery';
}

interface PropertyValuationData {
  id: string;
  address: string;
  marketValue: number;
  quantumValue: number;
  confidenceScore: number;
  dimensions: {
    temporal: number;
    market: number;
    quantum: number;
    social: number;
  };
  modelPredictions: ModelPrediction[];
}

interface ModelPrediction {
  algorithmName: string;
  accuracy: number;
  confidence: number;
  processingTime: number;
  quantumEnhanced: boolean;
}

// Quantum Glass Morphism Component
const QuantumGlassCard: React.FC<{
  complexity: number;
  analysisDepth: number;
  children: React.ReactNode;
  className?: string;
}> = ({ complexity, analysisDepth, children, className = '' }) => {
  const getAdaptiveBlur = (complexity: number) => {
    if (complexity <= 3) return 'sm';
    if (complexity <= 6) return 'md';
    if (complexity <= 8) return 'lg';
    return 'xl';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`
        tf-quantum-glass-card
        backdrop-blur-${getAdaptiveBlur(complexity)}
        border border-[#00ffee]/30
        bg-gradient-to-br from-[#0b1020]/80 via-[#0099ff]/10 to-[#00ffee]/5
        shadow-[0_25px_50px_rgba(0,255,238,0.15)]
        hover:shadow-[0_35px_70px_rgba(0,255,238,0.25)]
        transform hover:-translate-y-2
        transition-all duration-500 ease-out
        relative overflow-hidden
        rounded-2xl
        ${analysisDepth > 5 ? 'border-[#ffcc00]/40' : ''}
        ${className}
      `}
    >
      {/* Quantum Scanning Animation */}
      <div className="tf-quantum-scan absolute inset-0
        bg-gradient-to-r from-transparent via-[#00ffee]/20 to-transparent
        -translate-x-full hover:translate-x-full
        transition-transform duration-1500 ease-in-out" />

      {/* Mathematical Grid Overlay */}
      <div className="tf-mathematical-grid absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2300ffee' stroke-width='1'%3E%3Cpath d='M0 0h40v40H0z'/%3E%3Cpath d='M0 20h40M20 0v40'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />

      {/* Content with Quantum Enhancement */}
      <div className="relative z-10 p-8">
        {children}
      </div>

      {/* PhD Achievement Corner Badge */}
      {analysisDepth > 8 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="absolute top-4 right-4 w-6 h-6
            bg-[#ffcc00]/80 rounded-full
            shadow-[0_0_20px_rgba(255,204,0,0.6)]
            animate-pulse"
        />
      )}
    </motion.div>
  );
};

// Quantum Metric Display Component
const QuantumMetric: React.FC<{
  label: string;
  value: string;
  target: string;
  status: 'optimal' | 'exceeding' | 'championship' | 'transcendent';
  gradient: 'success' | 'clarity' | 'consciousness' | 'quantum';
}> = ({ label, value, target, status, gradient }) => {
  const getGradientClass = (gradient: string) => {
    switch (gradient) {
      case 'success': return 'from-[#00ffaa] to-[#00ffee]';
      case 'clarity': return 'from-[#0099ff] via-[#00ffee] to-[#00ffaa]';
      case 'consciousness': return 'from-[#6600ff] via-[#0099ff] to-[#00ffee]';
      case 'quantum': return 'from-[#ffcc00] via-[#00ffee] to-[#0b1020]';
      default: return 'from-[#0099ff] to-[#00ffee]';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return '#0099ff';
      case 'exceeding': return '#00ffaa';
      case 'championship': return '#ffcc00';
      case 'transcendent': return '#6600ff';
      default: return '#00ffee';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="tf-quantum-metric bg-[#0b1020]/60 backdrop-blur-md
        border border-[#00ffee]/20 rounded-xl p-4 text-center
        hover:border-[#00ffee]/40 transition-all duration-300"
    >
      <div className="text-sm text-[#c0c0c0] mb-2">{label}</div>
      <div className={`text-2xl font-bold bg-gradient-to-r ${getGradientClass(gradient)}
        bg-clip-text text-transparent mb-1`}>
        {value}
      </div>
      <div className="text-xs text-[#00ffee]/60">Target: {target}</div>
      <div className="mt-2 flex justify-center">
        <div
          className="w-2 h-2 rounded-full shadow-lg"
          style={{
            backgroundColor: getStatusColor(status),
            boxShadow: `0 0 10px ${getStatusColor(status)}`
          }}
        />
      </div>
    </motion.div>
  );
};

// Multi-Dimensional Property Valuation Matrix Component
const PropertyValuationMatrix: React.FC<QuantumAnalyticsProps> = ({
  accuracyTarget,
  optimizationFactor,
  agentCount,
  researchMode
}) => {
  const [propertyData, setPropertyData] = useState<PropertyValuationData[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    accuracy: 99.7,
    processingSpeed: 23,
    modelConfidence: 97.8,
    agentCoordination: agentCount
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeMetrics(prev => ({
        accuracy: prev.accuracy + (Math.random() - 0.5) * 0.1,
        processingSpeed: Math.max(15, prev.processingSpeed + (Math.random() - 0.5) * 5),
        modelConfidence: prev.modelConfidence + (Math.random() - 0.5) * 0.2,
        agentCoordination: agentCount
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [agentCount]);

  return (
    <QuantumGlassCard complexity={9} analysisDepth={10}>
      <div className="tf-valuation-matrix space-y-6">
        {/* Quantum Algorithm Status */}
        <div className="flex items-center justify-between">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold bg-gradient-to-r from-[#6600ff] via-[#0099ff] to-[#00ffee]
              bg-clip-text text-transparent"
          >
            QUANTUM VALUATION ENGINE
          </motion.h3>
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="tf-quantum-indicator w-3 h-3 bg-[#00ffaa]
                rounded-full shadow-[0_0_15px_rgba(0,255,170,0.8)]"
            />
            <span className="text-[#00ffee] font-mono text-sm">
              FACTOR {optimizationFactor} ACTIVE
            </span>
          </div>
        </div>

        {/* Real-Time Accuracy Metrics */}
        <div className="grid grid-cols-4 gap-6">
          <QuantumMetric
            label="Accuracy Score"
            value={`${realTimeMetrics.accuracy.toFixed(1)}%`}
            target={`${accuracyTarget}%`}
            status="exceeding"
            gradient="success"
          />
          <QuantumMetric
            label="Processing Speed"
            value={`${Math.round(realTimeMetrics.processingSpeed)}ms`}
            target="<50ms"
            status="optimal"
            gradient="clarity"
          />
          <QuantumMetric
            label="Model Confidence"
            value={`${realTimeMetrics.modelConfidence.toFixed(1)}%`}
            target="95%"
            status="championship"
            gradient="consciousness"
          />
          <QuantumMetric
            label="Agent Coordination"
            value={realTimeMetrics.agentCoordination.toLocaleString()}
            target="1,000"
            status="transcendent"
            gradient="quantum"
          />
        </div>

        {/* Interactive 3D Valuation Visualization */}
        <div className="h-96 bg-[#0b1020]/40 rounded-xl border border-[#00ffee]/20 overflow-hidden">
          <Canvas camera={{ position: [0, 0, 10] }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

            {/* 3D Data Points */}
            {[...Array(20)].map((_, i) => (
              <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh
                  position={[
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10
                  ]}
                >
                  <sphereGeometry args={[0.1, 16, 16]} />
                  <meshStandardMaterial
                    color={new THREE.Color(`hsl(${180 + Math.random() * 60}, 100%, 50%)`)}
                    emissive={new THREE.Color(`hsl(${180 + Math.random() * 60}, 100%, 20%)`)}
                  />
                </mesh>
              </Float>
            ))}

            {/* 3D Text Labels */}
            <Text3D
              font="/fonts/helvetiker_regular.typeface.json"
              position={[-5, 4, 0]}
              size={0.3}
              height={0.1}
            >
              QUANTUM ANALYSIS
              <meshStandardMaterial color="#00ffee" />
            </Text3D>
          </Canvas>
        </div>

        {/* Advanced Model Fine-Tuning Interface */}
        <div className="bg-[#0b1020]/60 rounded-xl p-6 border border-[#00ffee]/20">
          <h4 className="text-lg font-semibold text-[#00ffee] mb-4">
            Model Fine-Tuning Console ({researchMode})
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#c0c0c0]">Learning Rate</label>
              <input
                type="range"
                min="0.001"
                max="0.1"
                step="0.001"
                className="w-full h-2 bg-[#0b1020] rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-[#00ffee] [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#c0c0c0]">Quantum Factor</label>
              <input
                type="range"
                min="900"
                max="999"
                defaultValue={optimizationFactor}
                className="w-full h-2 bg-[#0b1020] rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-[#ffcc00] [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#c0c0c0]">Batch Size</label>
              <input
                type="range"
                min="32"
                max="1024"
                step="32"
                className="w-full h-2 bg-[#0b1020] rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-[#00ffaa] [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-4 flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa]
                text-white font-semibold rounded-full shadow-lg hover:shadow-xl
                transition-all duration-300"
            >
              APPLY QUANTUM OPTIMIZATION
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 border border-[#00ffee]/40 text-[#00ffee]
                rounded-full hover:bg-[#00ffee]/10 transition-all duration-300"
            >
              VALIDATE CHAMPIONSHIP STANDARDS
            </motion.button>
          </div>
        </div>
      </div>
    </QuantumGlassCard>
  );
};

export default PropertyValuationMatrix;
