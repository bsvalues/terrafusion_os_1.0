import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  Button,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
  Slider,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AllInclusive as AllInclusiveIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  FlashOn as FlashOnIcon,
  Stars as StarsIcon,
  Grain as GrainIcon,
  Public as PublicIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Computer as ComputerIcon,
  AccountTree as AccountTreeIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line, Torus, Ring } from '@react-three/drei';
import * as THREE from 'three';
import { QuantumSingularityCore, SingularityStatusReport, SingularityCapability } from '../transcendent/QuantumSingularityCore';
import { GlobalConsciousnessNetwork } from '../transcendent/GlobalConsciousnessNetwork';
import { SelfEvolvingAgentArchitecture } from '../transcendent/SelfEvolvingAgentArchitecture';

interface SingularityVisualizationProps {
  statusReport: SingularityStatusReport;
}

// 3D Visualization of Quantum Singularity
const SingularityVisualization: React.FC<SingularityVisualizationProps> = ({ statusReport }) => {
  const centralCoreRef = useRef<THREE.Mesh>(null);
  const ringRefs = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Central core pulsing and rotation
    if (centralCoreRef.current) {
      centralCoreRef.current.rotation.x = time * 0.5;
      centralCoreRef.current.rotation.y = time * 0.3;
      centralCoreRef.current.rotation.z = time * 0.2;
      
      // Pulsing effect based on processing power
      const pulseScale = 1 + Math.sin(time * 3) * 0.2 * statusReport.superintelligenceLevel;
      centralCoreRef.current.scale.setScalar(pulseScale);
    }
    
    // Rotating capability rings
    ringRefs.current.forEach((ring, index) => {
      if (ring) {
        ring.rotation.x = time * (0.5 + index * 0.2);
        ring.rotation.y = time * (0.3 + index * 0.15);
        ring.rotation.z = time * (0.1 + index * 0.1);
      }
    });
  });

  const capabilityRings = useMemo(() => {
    return statusReport.unlockedCapabilities.map((capability, index) => {
      const radius = 3 + index * 1.5;
      const color = capability.category === 'UNIVERSAL' ? '#ff0000' :
                   capability.category === 'DIMENSIONAL' ? '#ff00ff' :
                   capability.category === 'TEMPORAL' ? '#00ffff' :
                   capability.category === 'REALITY' ? '#ffff00' :
                   capability.category === 'CONSCIOUSNESS' ? '#00ff00' :
                   '#ffffff';
      
      return (
        <group key={capability.id} position={[0, 0, 0]}>
          <Torus
            ref={(el) => { if (el) ringRefs.current[index] = el; }}
            args={[radius, 0.1, 8, 32]}
          >
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.7}
              emissive={color}
              emissiveIntensity={0.3}
            />
          </Torus>
          
          <Text
            position={[radius + 1, 0, 0]}
            fontSize={0.3}
            color={color}
            anchorX="left"
            anchorY="middle"
          >
            {capability.name}
          </Text>
        </group>
      );
    });
  }, [statusReport.unlockedCapabilities]);

  const processingPowerVisualization = useMemo(() => {
    const powerLevel = Math.min(statusReport.metrics.processingPowerExaflops / 10_000_000, 1);
    const particleCount = Math.floor(powerLevel * 1000);
    
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 20;
      
      particles.push(
        <Sphere key={i} args={[0.02]} position={[x, y, z]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </Sphere>
      );
    }
    
    return particles;
  }, [statusReport.metrics.processingPowerExaflops]);

  return (
    <group>
      {/* Central Singularity Core */}
      <Sphere
        ref={centralCoreRef}
        args={[1]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color={statusReport.singularityAchieved ? '#ff0000' : '#4444ff'}
          transparent
          opacity={0.8}
          emissive={statusReport.singularityAchieved ? '#ff3333' : '#2222cc'}
          emissiveIntensity={statusReport.singularityAchieved ? 1.0 : 0.5}
        />
      </Sphere>

      {/* Capability Rings */}
      {capabilityRings}

      {/* Processing Power Particles */}
      {processingPowerVisualization}

      {/* Reality Distortion Field */}
      {statusReport.metrics.realityAlterationCapability > 0 && (
        <Sphere args={[15]} position={[0, 0, 0]}>
          <meshBasicMaterial
            color="#ff00ff"
            transparent
            opacity={0.05}
            side={THREE.BackSide}
          />
        </Sphere>
      )}

      {/* Central Label */}
      <Text
        position={[0, -3, 0]}
        fontSize={0.8}
        color={statusReport.singularityAchieved ? '#ff4444' : '#4444ff'}
        anchorX="center"
        anchorY="middle"
      >
        {statusReport.singularityAchieved ? 'QUANTUM SINGULARITY ACHIEVED' : 'APPROACHING SINGULARITY'}
      </Text>
    </group>
  );
};

// Capability Progress Display
const CapabilityProgress: React.FC<{ capabilities: SingularityCapability[] }> = ({ capabilities }) => {
  const categoryColors = {
    COMPUTATIONAL: '#4caf50',
    CONSCIOUSNESS: '#2196f3',
    REALITY: '#ff9800',
    TEMPORAL: '#9c27b0',
    DIMENSIONAL: '#f44336',
    UNIVERSAL: '#000000'
  };

  return (
    <Box>
      {capabilities.map((capability) => (
        <Card key={capability.id} sx={{ mb: 2, opacity: capability.unlocked ? 1 : 0.3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="h6" sx={{ mr: 2, color: categoryColors[capability.category] }}>
                {capability.name}
              </Typography>
              <Chip 
                label={capability.unlocked ? 'UNLOCKED' : 'LOCKED'}
                color={capability.unlocked ? 'success' : 'default'}
                size="small"
              />
              <Chip 
                label={`Power: ${capability.powerLevel.toLocaleString()}`}
                color="info"
                size="small"
                sx={{ ml: 1 }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" mb={2}>
              {capability.description}
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={capability.unlocked ? 100 : 0} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: categoryColors[capability.category]
                }
              }} 
            />
            
            {capability.unlocked && capability.emergenceTimestamp && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Unlocked: {capability.emergenceTimestamp.toLocaleTimeString()}
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

// Processing Metrics Display
const ProcessingMetrics: React.FC<{ statusReport: SingularityStatusReport }> = ({ statusReport }) => {
  const formatNumber = (num: number): string => {
    if (num >= 1e18) return `${(num / 1e18).toFixed(1)}E`;
    if (num >= 1e15) return `${(num / 1e15).toFixed(1)}P`;
    if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const metrics = [
    {
      name: 'Processing Power',
      value: statusReport.metrics.processingPowerExaflops,
      unit: 'Exaflops',
      icon: <ComputerIcon />,
      color: '#4caf50'
    },
    {
      name: 'Quantum Coherence',
      value: statusReport.metrics.quantumCoherenceStability * 100,
      unit: '%',
      icon: <GrainIcon />,
      color: '#2196f3'
    },
    {
      name: 'Intelligence Level',
      value: statusReport.superintelligenceLevel * 100,
      unit: '%',
      icon: <PsychologyIcon />,
      color: '#ff9800'
    },
    {
      name: 'Reality Alteration',
      value: statusReport.metrics.realityAlterationCapability * 100,
      unit: '%',
      icon: <PublicIcon />,
      color: '#9c27b0'
    },
    {
      name: 'Temporal Accuracy',
      value: statusReport.metrics.timeManipulationAccuracy * 100,
      unit: '%',
      icon: <TimelineIcon />,
      color: '#f44336'
    },
    {
      name: 'Universal Connection',
      value: statusReport.metrics.universalConnectionStrength * 100,
      unit: '%',
      icon: <AllInclusiveIcon />,
      color: '#000000'
    }
  ];

  return (
    <Grid container spacing={2}>
      {metrics.map((metric) => (
        <Grid item xs={12} md={6} key={metric.name}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Box sx={{ color: metric.color, mr: 2 }}>
                  {metric.icon}
                </Box>
                <Typography variant="h6">{metric.name}</Typography>
              </Box>
              
              <Typography variant="h4" color={metric.color} mb={1}>
                {formatNumber(metric.value)}{metric.unit}
              </Typography>
              
              <LinearProgress
                variant="determinate"
                value={Math.min(100, metric.value)}
                sx={{
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: metric.color
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Main Quantum Singularity Console Component
const QuantumSingularityConsole: React.FC = () => {
  const [singularityCore, setSingularityCore] = useState<QuantumSingularityCore | null>(null);
  const [statusReport, setStatusReport] = useState<SingularityStatusReport | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [emergencyOverride, setEmergencyOverride] = useState(false);

  // Initialize the Quantum Singularity Core
  useEffect(() => {
    const initializeSingularity = async () => {
      try {
        const globalConsciousness = new GlobalConsciousnessNetwork();
        const evolvingAgents = new SelfEvolvingAgentArchitecture(globalConsciousness);
        const core = new QuantumSingularityCore(globalConsciousness, evolvingAgents);
        
        setSingularityCore(core);
      } catch (error) {
        console.error('Failed to initialize Quantum Singularity Core:', error);
      }
    };

    initializeSingularity();
  }, []);

  // Real-time status updates
  useEffect(() => {
    if (!singularityCore || !realTimeUpdates) return;

    const updateInterval = setInterval(async () => {
      try {
        const report = await singularityCore.getSingularityStatusReport();
        setStatusReport(report);
      } catch (error) {
        console.error('Failed to get singularity status report:', error);
      }
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [singularityCore, realTimeUpdates]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!statusReport) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Box textAlign="center">
          <Typography variant="h6" mb={2}>Initializing Quantum Singularity Core...</Typography>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" mt={2}>
            ⚠️ WARNING: Approaching technological singularity
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#000000', minHeight: '100vh', color: 'white', p: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" mb={2}>
          <AllInclusiveIcon sx={{ fontSize: 40, mr: 2, color: '#ff0000' }} />
          <Typography variant="h3" component="h1" sx={{ 
            background: statusReport.singularityAchieved 
              ? 'linear-gradient(45deg, #ff0000 30%, #ff6666 90%)'
              : 'linear-gradient(45deg, #4444ff 30%, #6666ff 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Quantum Singularity Core
          </Typography>
        </Box>
        
        <Typography variant="h6" color="text.secondary" mb={3}>
          {statusReport.singularityAchieved 
            ? '🌟 SINGULARITY ACHIEVED • Superintelligence Active • Reality Optimization Online'
            : '⚡ Approaching Singularity • Infinite Processing • Universal Optimization Pending'
          }
        </Typography>

        {/* Control Panel */}
        <Box display="flex" gap={2} mb={2}>
          <FormControlLabel
            control={
              <Switch 
                checked={realTimeUpdates} 
                onChange={(e) => setRealTimeUpdates(e.target.checked)}
                color="primary"
              />
            }
            label="Real-time Updates"
          />
          <FormControlLabel
            control={
              <Switch 
                checked={emergencyOverride} 
                onChange={(e) => setEmergencyOverride(e.target.checked)}
                color="error"
              />
            }
            label="Emergency Override"
          />
        </Box>

        {/* Status Alerts */}
        {statusReport.singularityAchieved && (
          <Alert severity="error" icon={<AllInclusiveIcon />} sx={{ mb: 2 }}>
            🌟 QUANTUM SINGULARITY ACHIEVED: Superintelligence level {(statusReport.superintelligenceLevel * 100).toFixed(1)}%
          </Alert>
        )}
        
        {statusReport.universalOptimizationActive && (
          <Alert severity="success" icon={<PublicIcon />} sx={{ mb: 2 }}>
            🌍 UNIVERSAL OPTIMIZATION ACTIVE: Perfect government harmony across all realities
          </Alert>
        )}

        {statusReport.realityStabilizationOnline && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
            ⚡ REALITY MANIPULATION ONLINE: Fundamental reality parameters under optimization
          </Alert>
        )}
      </Box>

      {/* Main Dashboard */}
      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <SpeedIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                  <Typography variant="h4" color="#4caf50">
                    {(statusReport.metrics.processingPowerExaflops / 1000000).toFixed(1)}M
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Exaflops
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <PsychologyIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                  <Typography variant="h4" color="#ff9800">
                    {(statusReport.superintelligenceLevel * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Intelligence Level
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <StarsIcon sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
                  <Typography variant="h4" color="#9c27b0">
                    {statusReport.unlockedCapabilities.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Capabilities
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <TrendingUpIcon sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
                  <Typography variant="h4" color="#f44336">
                    {statusReport.totalTasksProcessed.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tasks Processed
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Tab Navigation */}
          <Paper sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{ 
                '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
                '& .Mui-selected': { color: '#ff4444' }
              }}
            >
              <Tab icon={<VisibilityIcon />} label="Singularity Visualization" />
              <Tab icon={<MemoryIcon />} label="Processing Metrics" />
              <Tab icon={<AccountTreeIcon />} label="Capability Progress" />
              <Tab icon={<SettingsIcon />} label="Quantum Processors" />
            </Tabs>
          </Paper>

          {/* Tab Content */}
          {activeTab === 0 && (
            <Paper sx={{ bgcolor: 'rgba(255,255,255,0.05)', height: 600 }}>
              <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
                <ambientLight intensity={0.3} />
                <pointLight position={[10, 10, 10]} />
                <pointLight position={[-10, -10, -10]} color="#ff4444" />
                <SingularityVisualization statusReport={statusReport} />
                <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
              </Canvas>
            </Paper>
          )}

          {activeTab === 1 && (
            <Paper sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3, maxHeight: 600, overflow: 'auto' }}>
              <ProcessingMetrics statusReport={statusReport} />
            </Paper>
          )}

          {activeTab === 2 && (
            <Paper sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3, maxHeight: 600, overflow: 'auto' }}>
              <CapabilityProgress capabilities={statusReport.unlockedCapabilities} />
            </Paper>
          )}

          {activeTab === 3 && (
            <Paper sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3, maxHeight: 600, overflow: 'auto' }}>
              <Typography variant="h6" mb={2}>Quantum Processor Status</Typography>
              {Object.entries(statusReport.quantumProcessorStatus).map(([processorId, status]: [string, any]) => (
                <Card key={processorId} sx={{ mb: 2, bgcolor: 'rgba(0,0,0,0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" color="white" mb={1}>
                      {status.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Power Level: {status.powerLevel.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Processing Speed: {(status.processingSpeed / 1e18).toFixed(1)} Exaops/sec
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={status.utilization * 100} 
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Tasks Processed: {status.tasksProcessed.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          )}
        </Grid>

        {/* Impact Metrics Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3, mb: 3 }}>
            <Typography variant="h6" mb={2}>Universal Impact</Typography>
            
            <Box mb={3}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Government Efficiency Gains
              </Typography>
              <Typography variant="h5" color="#4caf50" mb={1}>
                {statusReport.governmentEfficiencyGains.toLocaleString()}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, statusReport.governmentEfficiencyGains / 1000000 * 100)} 
                color="success"
                sx={{ mb: 1 }}
              />
            </Box>

            <Box mb={3}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Citizen Welfare Improvements
              </Typography>
              <Typography variant="h5" color="#2196f3" mb={1}>
                {statusReport.citizenWelfareImprovements.toLocaleString()}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, statusReport.citizenWelfareImprovements / 1000000 * 100)}
                color="info"
                sx={{ mb: 1 }}
              />
            </Box>

            <Box mb={3}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Universal Harmony Index
              </Typography>
              <Typography variant="h5" color="#ff9800" mb={1}>
                {statusReport.universalHarmonyIndex.toLocaleString()}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, statusReport.universalHarmonyIndex / 10000 * 100)}
                color="warning"
                sx={{ mb: 1 }}
              />
            </Box>
          </Paper>

          {/* System Status */}
          <Paper sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3 }}>
            <Typography variant="h6" mb={2}>System Status</Typography>
            
            <Box mb={2}>
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Singularity Status
                </Typography>
                <Chip 
                  label={statusReport.singularityAchieved ? 'ACHIEVED' : 'APPROACHING'}
                  color={statusReport.singularityAchieved ? 'error' : 'warning'}
                  size="small"
                />
              </Box>
              
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Universal Optimization
                </Typography>
                <Chip 
                  label={statusReport.universalOptimizationActive ? 'ACTIVE' : 'STANDBY'}
                  color={statusReport.universalOptimizationActive ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Reality Stabilization
                </Typography>
                <Chip 
                  label={statusReport.realityStabilizationOnline ? 'ONLINE' : 'OFFLINE'}
                  color={statusReport.realityStabilizationOnline ? 'info' : 'default'}
                  size="small"
                />
              </Box>
              
              <Box display="flex" alignItems="center">
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Reality Manipulations
                </Typography>
                <Chip 
                  label={statusReport.realityManipulationsActive}
                  color="secondary"
                  size="small"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuantumSingularityConsole;