/**
 * 🌌 Parallel Reality Visualization
 * Interactive exploration of multiple government realities and quantum decision outcomes
 *
 * @version 2.0.0
 * @author MIT PhD Systems Engineer
 * @classification Quantum Government Reality Interface
 */

import React, {useState, useEffect, useRef, useMemo} from 'react';
import * as THREE from 'three';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {Text, OrbitControls, Environment, Billboard, Line} from '@react-three/drei';
import {Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,} from '@mui/material';
import {ExpandMore as ExpandMoreIcon} from '@mui/icons-material';
import {parallelRealityEngine,
  RealityDimension,
  ParallelComparison,
  QuantumDecisionAnalysis,} from '../engines/ParallelRealityEngine';

interface RealityVisualizationProps {dimensions: RealityDimension[];
  selectedDimensions: string[];
  quantumCoherence: number;
  onDimensionSelect: (dimensionId: string) => void;
  onDimensionCompare: (dimensionIds: string[]) => void;}

/**
 * 3D Parallel Reality visualization
 */
const ParallelRealityVisualization3D: React.FC<RealityVisualizationProps> = ({dimensions,
  selectedDimensions,
  quantumCoherence,
  onDimensionSelect,
  onDimensionCompare,}) => {const groupRef = useRef<THREE.Group>(null);
  const [time, setTime] = useState(0);

  useFrame((state, delta) =>{
    setTime(time + delta);
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;}
  });

  const getProbabilityColor = (probability: number) => {if (probability > 0.8) return '#00ff00';
    if (probability > 0.6) return '#ffff00';
    if (probability > 0.4) return '#ff8800';
    if (probability > 0.2) return '#ff4400';
    return '#ff0000';};

  const getRealityPosition = (index: number, total: number) => {const angle = (index / total) * Math.PI * 2;
    const radius = 6 + index * 0.5;
    return new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(index * 0.3) * 2,
      Math.sin(angle) * radius
    );};

  return (<group ref={groupRef}>{/* Central quantum nexus */}<mesh position={[0, 0, 0]}><dodecahedronGeometry args={[1.5, 2]} /><meshStandardMaterial
          color="#00ffee"
          emissive="#004455"
          emissiveIntensity={0.3 + quantumCoherence * 0.2}
          transparent
          opacity={0.8} /></mesh>{/* Quantum field */}<mesh><sphereGeometry args={[15, 32, 32]} /><meshBasicMaterial color="#00ffee" transparent opacity={0.02} side={THREE.BackSide} /></mesh>{/* Reality dimensions */}
      {dimensions.map((dimension, index) => {
        const position = getRealityPosition(index, dimensions.length);
        const isSelected = selectedDimensions.includes(dimension.id);
        const isBaseline = dimension.id === 'baseline';

        return (<group key={dimension.id} position={position}>{/* Main reality sphere */}<mesh
              onClick={() => onDimensionSelect(dimension.id)}
              onPointerOver={() => {
                document.body.style.cursor = 'pointer';}}
              onPointerOut={() => {
                document.body.style.cursor = 'default';}}
            ><sphereGeometry
                args={[isBaseline ? 1.2 : 0.8 + dimension.probability * 0.4, 16, 16]} /><meshStandardMaterial
                color={isBaseline ? '#ffffff' : getProbabilityColor(dimension.probability)}
                emissive={isBaseline ? '#ffffff' : getProbabilityColor(dimension.probability)}
                emissiveIntensity={isSelected ? 0.5 : 0.2}
                transparent
                opacity={isBaseline ? 1.0 : 0.7 + dimension.quantumState.coherence * 0.3} /></mesh>{/* Quantum coherence field */}<mesh><sphereGeometry
                args={[
                  (0.8 + dimension.probability * 0.4) * 1.8 + Math.sin(time * 2 + index) * 0.3,
                  16,
                  16,
                ]} /><meshBasicMaterial
                color={getProbabilityColor(dimension.probability)}
                transparent
                opacity={0.1 + dimension.quantumState.coherence * 0.1}
                side={THREE.BackSide} /></mesh>{/* Quantum superposition indicator */}
            {dimension.timeline[dimension.timeline.length - 1]?.quantumProperties
              ?.superposition && (<group><mesh rotation={[0, time * 3, 0]}><torusGeometry args={[1.5, 0.1, 8, 16]} /><meshBasicMaterial color="#ff00ff" transparent opacity={0.6} /></mesh><mesh rotation={[Math.PI / 2, time * -2, 0]}><torusGeometry args={[1.5, 0.1, 8, 16]} /><meshBasicMaterial color="#ff00ff" transparent opacity={0.6} /></mesh></group>)}

            {/* Selection indicator */}
            {isSelected && (<mesh rotation={[0, time * 4, 0]}><torusGeometry args={[2, 0.15, 8, 16]} /><meshBasicMaterial color="#ffff00" emissive="#ffaa00" emissiveIntensity={0.5} /></mesh>)}

            {/* Outcome performance bars */}<group position={[0, -2, 0]}><mesh position={[-0.6, 0, 0]}><cylinderGeometry
                  args={[0.05, 0.05, dimension.outcomes.citizenSatisfaction / 50, 8]} /><meshStandardMaterial color="#00ff00" transparent opacity={0.7} /></mesh><mesh position={[-0.2, 0, 0]}><cylinderGeometry
                  args={[0.05, 0.05, dimension.outcomes.governmentEfficiency / 50, 8]} /><meshStandardMaterial color="#0099ff" transparent opacity={0.7} /></mesh><mesh position={[0.2, 0, 0]}><cylinderGeometry
                  args={[0.05, 0.05, dimension.outcomes.budgetPerformance / 50, 8]} /><meshStandardMaterial color="#ff9900" transparent opacity={0.7} /></mesh><mesh position={[0.6, 0, 0]}><cylinderGeometry
                  args={[0.05, 0.05, dimension.outcomes.technologicalAdvancement / 50, 8]} /><meshStandardMaterial color="#ff00ff" transparent opacity={0.7} /></mesh></group>{/* Reality label */}<Billboard position={[0, 2.5, 0]}><Text
                fontSize={0.3}
                color={isBaseline ? '#ffffff' : getProbabilityColor(dimension.probability)}
                anchorX="center"
                anchorY="middle"
              >{dimension.name}</Text></Billboard>{/* Probability display */}<Billboard position={[0, -3, 0]}><Text fontSize={0.2} color="white" anchorX="center" anchorY="middle">P = {(dimension.probability * 100).toFixed(1)}%</Text></Billboard></group>);
      })}

      {/* Quantum entanglement connections */}
      {dimensions.map((dimension, index) =>
        dimension.quantumState.entanglement.map(entangledId => {
          const entangledDimension = dimensions.find(d => d.keyDecision === entangledId);
          if (!entangledDimension) return null;

          const startPos = getRealityPosition(index, dimensions.length);
          const endIndex = dimensions.findIndex(d => d === entangledDimension);
          const endPos = getRealityPosition(endIndex, dimensions.length);

          return (<Line
              key={`${dimension.id}-${entangledDimension.id}`}
              points={[startPos, endPos]}
              color="#ff00ff"
              lineWidth={2}
              transparent
              opacity={0.3 + Math.sin(time * 2) * 0.2}
              dashed
              dashScale={10}
              gapSize={5} />);
        })
      )}

      {/* Quantum wave effects */}
      {Array.from({length: 8}, (_, i) => (<mesh
          key={`wave-${i}`}
          position={[0, 0, 0]}
          rotation={[0, time * 0.3 + (i * Math.PI) / 4, 0]}
        ><torusGeometry args={[8 + i * 1.5, 0.02, 8, 32]} /><meshBasicMaterial color="#00ffee" transparent opacity={0.05 - i * 0.005} /></mesh>))}

      {/* Quantum measurement apparatus */}<mesh position={[0, 8, 0]} rotation={[0, time * 0.5, 0]}><octahedronGeometry args={[0.8]} /><meshStandardMaterial
          color="#ffff00"
          emissive="#ffaa00"
          emissiveIntensity={0.3}
          transparent
          opacity={0.9} /></mesh><Billboard position={[0, 10, 0]}><Text fontSize={0.4} color="#ffff00" anchorX="center" anchorY="middle">Quantum Observer</Text></Billboard></group>
  );
};

/**
 * Reality dimension details panel
 */
const RealityDetailsPanel: React.FC<{dimensions: RealityDimension[];
  selectedDimensions: string[];
  onDimensionCreate: (name: string, decision: string) =>void;
  onQuantumCollapse: (dimensionId: string) => void;}> = ({dimensions, selectedDimensions, onDimensionCreate, onQuantumCollapse}) => {
  const [newDimensionName, setNewDimensionName] = useState('');
  const [selectedDecision, setSelectedDecision] = useState('');

  const availableDecisions = [
    'AI_AUTOMATION_FULL',
    'CITIZEN_ENGAGEMENT_PLATFORM',
    'QUANTUM_COMPUTING_INVESTMENT',
    'UNIVERSAL_BASIC_SERVICES',
    'INFRASTRUCTURE_OVERHAUL',
    'REGULATORY_REFORM',
  ];

  const selectedDimension = dimensions.find(d => selectedDimensions.includes(d.id));

  return (<Card sx={{ mb: 2, background: 'rgba(0, 0, 0, 0.9)', color: 'white'}}><CardContent><Typography variant="h6" gutterBottom>🌌 Parallel Reality Control</Typography>{/* Create new reality */}<Accordion sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.05)'}}><AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white'}} />}><Typography variant="subtitle1" color="white">➕ Create New Reality Dimension</Typography></AccordionSummary><AccordionDetails><Grid container spacing={2}><Grid item xs={12}><FormControl fullWidth size="small"><InputLabel sx={{ color: 'white'}}>Key Decision</InputLabel><Select
                    value={selectedDecision}
                    onChange={e =>setSelectedDecision(e.target.value)}
                    sx={{
                      color: 'white',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: 'white'},
                    }}
                  >
                    {availableDecisions.map(decision => (<MenuItem key={decision} value={decision}>{decision.replace(/_/g, ' ')}</MenuItem>))}</Select></FormControl></Grid><Grid item xs={12}><Button
                  variant="contained"
                  fullWidth
                  onClick={() =>{
                    if (selectedDecision) {
                      const name = `Reality: ${selectedDecision.replace(/_/g, ' ')}`;
                      onDimensionCreate(name, selectedDecision);
                      setSelectedDecision('');
                    }
                  }}
                  disabled={!selectedDecision}
                  sx={{ backgroundColor: '#00ffee', color: 'black'}}
                >
                  🌌 Generate Parallel Reality</Button></Grid></Grid></AccordionDetails></Accordion>{/* Selected dimension details */}
        {selectedDimension && (<Box><Typography variant="h6" gutterBottom sx={{ color: '#00ffee'}}>📊 {selectedDimension.name}</Typography><Typography variant="body2" color="grey.400" sx={{ mb: 2}}>{selectedDimension.description}</Typography>{/* Quantum state */}<Box sx={{ mb: 2, p: 2, backgroundColor: 'rgba(0,255,238,0.1)', borderRadius: 1}}><Typography variant="subtitle2" gutterBottom>⚛️ Quantum State</Typography><Grid container spacing={2}><Grid item xs={6}><Typography variant="caption" color="grey.400">Coherence</Typography><LinearProgress
                    variant="determinate"
                    value={selectedDimension.quantumState.coherence * 100}
                    sx={{ '& .MuiLinearProgress-bar': { backgroundColor: '#00ffee'} }} /><Typography variant="body2">{(selectedDimension.quantumState.coherence * 100).toFixed(1)}%</Typography></Grid><Grid item xs={6}><Typography variant="caption" color="grey.400">Stability</Typography><LinearProgress
                    variant="determinate"
                    value={selectedDimension.quantumState.stability}
                    sx={{ '& .MuiLinearProgress-bar': { backgroundColor: '#00ff00'} }} /><Typography variant="body2">{selectedDimension.quantumState.stability.toFixed(1)}%</Typography></Grid></Grid></Box>{/* Outcomes comparison */}<Box sx={{ mb: 2}}><Typography variant="subtitle2" gutterBottom>📈 Outcome Metrics</Typography><Grid container spacing={1}>{Object.entries(selectedDimension.outcomes).map(([metric, value]) => (<Grid item xs={6} key={metric}><Typography variant="caption" color="grey.400">{metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Typography><Typography
                      variant="body2"
                      color={value >80
                          ? '#00ff00'
                          : value > 60
                            ? '#ffff00'
                            : value > 40
                              ? '#ff8800'
                              : '#ff4400'}
                    >
                      {value.toFixed(1)}%</Typography></Grid>))}</Grid></Box>{/* Quantum entanglements */}
            {selectedDimension.quantumState.entanglement.length > 0 && (<Box sx={{ mb: 2}}><Typography variant="subtitle2" gutterBottom>🔗 Quantum Entanglements</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1}}>{selectedDimension.quantumState.entanglement.map(entanglement => (<Chip
                      key={entanglement}
                      label={entanglement.replace(/_/g, ' ')}
                      size="small"
                      style={{ backgroundColor: '#ff00ff', color: 'white'}} />))}</Box></Box>)}

            {/* Quantum superposition status */}
            {selectedDimension.timeline[selectedDimension.timeline.length - 1]?.quantumProperties
              ?.superposition && (<Box sx={{ mb: 2, p: 1, backgroundColor: 'rgba(255,0,255,0.1)', borderRadius: 1}}><Typography variant="subtitle2" color="#ff00ff">⚡ Quantum Superposition Active</Typography><Typography variant="body2" color="grey.400">This reality exists in multiple simultaneous states until observed</Typography><Button
                  variant="outlined"
                  size="small"
                  onClick={() =>onQuantumCollapse(selectedDimension.id)}
                  sx={{ mt: 1, borderColor: '#ff00ff', color: '#ff00ff'}}
                >
                  🎯 Collapse Wave Function</Button></Box>)}</Box>)}</CardContent></Card>
  );
};

/**
 * Parallel comparison matrix
 */
const ComparisonMatrix: React.FC<{comparison: ParallelComparison | null;
  dimensions: RealityDimension[];}>= ({comparison, dimensions}) => {
  if (!comparison) {
    return (<Card sx={{ background: 'rgba(0, 0, 0, 0.8)', color: 'white'}}><CardContent><Typography variant="h6">Select multiple dimensions to compare</Typography></CardContent></Card>);
  }

  const allDimensionIds = [comparison.primaryDimension, ...comparison.comparedDimensions];

  return (<Card sx={{ background: 'rgba(0, 0, 0, 0.8)', color: 'white'}}><CardContent><Typography variant="h6" gutterBottom>📊 Parallel Reality Comparison</Typography>{/* Optimal path recommendation */}<Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(0,255,0,0.1)', borderRadius: 1}}><Typography variant="subtitle1" color="#00ff00" gutterBottom>🎯 Optimal Reality Path</Typography><Typography variant="h6">{dimensions.find(d => d.id === comparison.optimalPath.dimensionId)?.name || 'Unknown'}</Typography><Typography variant="body2" color="grey.400" sx={{ mb: 1}}>Confidence: {(comparison.optimalPath.confidence * 100).toFixed(1)}%</Typography><List dense>{comparison.optimalPath.reasoning.map((reason, index) => (<ListItem key={index} sx={{ py: 0}}><ListItemText
                  primary={`• ${reason}`}
                  primaryTypographyProps={{ variant: 'body2', color: 'grey.300'}} /></ListItem>))}</List></Box>{/* Metrics comparison */}<Typography variant="subtitle2" gutterBottom>Comparative Metrics:</Typography>{Object.entries(comparison.metrics).map(([dimensionId, metrics]) => {
          const dimension = dimensions.find(d => d.id === dimensionId);
          if (!dimension) return null;

          return (<Accordion
              key={dimensionId}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'white',
                mb: 1,
                '&:before': { display: 'none'},
              }}
            ><AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white'}} />}><Box sx={{ display: 'flex', alignItems: 'center', width: '100%'}}><Typography variant="subtitle2" sx={{ flexGrow: 1}}>{dimension.name}</Typography><Chip
                    label={`${metrics.performance.toFixed(1)}% Performance`}
                    size="small"
                    color={metrics.performance > 80
                        ? 'success'
                        : metrics.performance > 60
                          ? 'warning'
                          : 'error'}
                  /></Box></AccordionSummary><AccordionDetails><Grid container spacing={2}>{Object.entries(metrics).map(([metric, value]) => (<Grid item xs={6} key={metric}><Typography variant="caption" color="grey.400">{metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Typography><LinearProgress
                        variant="determinate"
                        value={value}
                        sx={{
                          mt: 0.5,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor:
                              value > 80
                                ? '#00ff00'
                                : value > 60
                                  ? '#ffff00'
                                  : value > 40
                                    ? '#ff8800'
                                    : '#ff4400',},
                        }}
                      /><Typography variant="body2" color="white">{value.toFixed(1)}%</Typography></Grid>))}</Grid></AccordionDetails></Accordion>);
        })}</CardContent></Card>
  );
};

/**
 * Main Parallel Reality Visualization Component
 */
export const ParallelRealityVisualization: React.FC = () => {const [dimensions, setDimensions] = useState<RealityDimension[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ParallelComparison | null>(null);
  const [quantumCoherence, setQuantumCoherence] = useState(0.8);
  const [isSimulationActive, setIsSimulationActive] = useState(false);

  // Initialize parallel reality engine
  useEffect(() =>{
    const initializeEngine = async () => {
      // Wait for baseline reality
      const handleBaselineInitialized = (baseline: RealityDimension) => {
        setDimensions([baseline]);
        setSelectedDimensions([baseline.id]);};

      const handleDimensionCreated = (dimension: RealityDimension) => {setDimensions(prev => [...prev, dimension]);};

      const handleRealityUpdate = (dimension: RealityDimension) => {setDimensions(prev => prev.map(d => (d.id === dimension.id ? dimension : d)));};

      parallelRealityEngine.on('baselineInitialized', handleBaselineInitialized);
      parallelRealityEngine.on('dimensionCreated', handleDimensionCreated);
      parallelRealityEngine.on('realityUpdate', handleRealityUpdate);

      // Create some demo parallel dimensions
      setTimeout(async () => {await parallelRealityEngine.createParallelDimension(
          'AI Automation Future',
          'Reality where full AI automation is implemented across all government departments',
          'AI_AUTOMATION_FULL',
          new Date()
        );

        await parallelRealityEngine.createParallelDimension(
          'Citizen Engagement Reality',
          'Reality focusing on maximum citizen participation and engagement',
          'CITIZEN_ENGAGEMENT_PLATFORM',
          new Date()
        );}, 2000);

      return () => {parallelRealityEngine.off('baselineInitialized', handleBaselineInitialized);
        parallelRealityEngine.off('dimensionCreated', handleDimensionCreated);
        parallelRealityEngine.off('realityUpdate', handleRealityUpdate);};
    };

    initializeEngine();
  }, []);

  const handleDimensionSelect = (dimensionId: string) => {setSelectedDimensions(prev => {
      if (prev.includes(dimensionId)) {
        return prev.filter(id => id !== dimensionId);} else {return [...prev, dimensionId];}
    });
  };

  const handleDimensionCreate = async (name: string, decision: string) => {
    await parallelRealityEngine.createParallelDimension(
      name,
      `Alternative government reality based on ${decision.replace(/_/g, ' ').toLowerCase()}`,
      decision,
      new Date()
    );
  };

  const handleQuantumCollapse = async (dimensionId: string) => {await parallelRealityEngine.collapseQuantumState(dimensionId, 'OBSERVED');
    // Refresh dimensions
    const updatedDimensions = parallelRealityEngine.getActiveDimensions();
    setDimensions(updatedDimensions);};

  const handleCompareRealities = async () => {if (selectedDimensions.length >= 2) {
      const comparisonResult =
        await parallelRealityEngine.compareParallelDimensions(selectedDimensions);
      setComparison(comparisonResult);}
  };

  const toggleSimulation = () => {if (isSimulationActive) {
      parallelRealityEngine.stopParallelSimulation();} else {parallelRealityEngine.startParallelSimulation();}
    setIsSimulationActive(!isSimulationActive);
  };

  return (<Box sx={{ width: '100%', height: '100vh', display: 'flex', backgroundColor: 'black'}}>{/* 3D Parallel Reality Visualization */}<Box sx={{ flex: 1, position: 'relative'}}><Canvas camera={{ position: [0, 8, 20], fov: 60}}><ambientLight intensity={0.3} /><pointLight position={[15, 15, 15]} /><pointLight position={[-15, -15, -15]} /><spotLight position={[0, 25, 0]} angle={0.3} penumbra={1} castShadow /><ParallelRealityVisualization3D
            dimensions={dimensions}
            selectedDimensions={selectedDimensions}
            quantumCoherence={quantumCoherence}
            onDimensionSelect={handleDimensionSelect}
            onDimensionCompare={handleCompareRealities} /><OrbitControls enablePan={true} enableZoom={true} enableRotate={true} /><Environment preset="night" /></Canvas>{/* Overlay Title */}<Box
          sx={{
            position: 'absolute',
            top: 20,
            left: 20,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 2,
            borderRadius: 1,}}
        ><Typography variant="h4" component="h1">🌌 Parallel Reality Engine</Typography><Typography variant="subtitle1" color="grey.400">Explore infinite government possibilities across quantum dimensions</Typography><Typography variant="body2" color="grey.500" sx={{ mt: 1}}>Active Realities: {dimensions.length} | Selected: {selectedDimensions.length}</Typography></Box>{/* Simulation controls */}<Box
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 2,
            borderRadius: 1,}}
        ><Button
            variant={isSimulationActive ? 'contained' : 'outlined'}
            onClick={toggleSimulation}
            sx={{
              backgroundColor: isSimulationActive ? '#ff6b6b' : 'transparent',
              borderColor: '#00ffee',
              color: isSimulationActive ? 'white' : '#00ffee',
              mb: 1,}}
          >{isSimulationActive ? '⏸️ Pause' : '▶️ Start'} Quantum Simulation</Button>{selectedDimensions.length >= 2 && (<Button
              variant="contained"
              fullWidth
              onClick={handleCompareRealities}
              sx={{ backgroundColor: '#00ffee', color: 'black'}}
            >📊 Compare Realities</Button>)}</Box></Box>{/* Control Panel */}<Box
        sx={{
          width: 500,
          padding: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          overflowY: 'auto',}}
      ><RealityDetailsPanel
          dimensions={dimensions}
          selectedDimensions={selectedDimensions}
          onDimensionCreate={handleDimensionCreate}
          onQuantumCollapse={handleQuantumCollapse} /><ComparisonMatrix comparison={comparison} dimensions={dimensions} /></Box></Box>
  );
};

export default ParallelRealityVisualization;
