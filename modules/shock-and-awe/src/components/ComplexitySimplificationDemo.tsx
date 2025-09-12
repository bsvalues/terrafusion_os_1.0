/**
 * 🎯 Complexity Simplification Demonstration
 * Transform impossibly complex government processes into intuitive visualizations
 * 
 * @version 2.0.0
 * @author MIT PhD Systems Engineer
 * @classification Government Complexity Reduction System
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, OrbitControls, Environment, Html } from '@react-three/drei';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Slider, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Grid,
  Chip,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

interface ComplexProcess {
  id: string;
  name: string;
  description: string;
  complexity: {
    departments: number;
    steps: number;
    regulations: number;
    timeframe: number; // days
    documents: number;
    approvals: number;
  };
  simplificationLevels: {
    original: ProcessVisualization;
    intermediate: ProcessVisualization;
    simplified: ProcessVisualization;
    quantum: ProcessVisualization;
  };
  currentLevel: 'original' | 'intermediate' | 'simplified' | 'quantum';
}

interface ProcessVisualization {
  name: string;
  description: string;
  steps: ProcessStep[];
  visualElements: VisualElement[];
  comprehensionScore: number; // 0-100
  timeToComplete: number; // days
  citizenFriendliness: number; // 0-100
  errorReduction: number; // percentage
}

interface ProcessStep {
  id: string;
  name: string;
  description: string;
  department: string;
  duration: number; // days
  complexity: number; // 1-10
  dependencies: string[];
  automated: boolean;
  citizenVisible: boolean;
}

interface VisualElement {
  id: string;
  type: 'node' | 'connection' | 'milestone' | 'decision' | 'automation';
  position: THREE.Vector3;
  color: string;
  size: number;
  label: string;
  metadata?: any;
}

/**
 * 3D Process visualization showing transformation from complex to simple
 */
const ProcessVisualization3D: React.FC<{
  process: ComplexProcess;
  animationProgress: number;
}> = ({ process, animationProgress }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [morphProgress, setMorphProgress] = useState(0);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
    
    // Animate morphing between complexity levels
    setMorphProgress(animationProgress);
  });

  const currentVisualization = process.simplificationLevels[process.currentLevel];
  
  // Interpolate between visualization levels
  const getInterpolatedElements = () => {
    if (morphProgress === 0) return currentVisualization.visualElements;
    
    // Simple interpolation for demonstration
    return currentVisualization.visualElements.map((element, index) => ({
      ...element,
      position: new THREE.Vector3(
        element.position.x * (1 - morphProgress * 0.3),
        element.position.y,
        element.position.z * (1 - morphProgress * 0.3)
      ),
      size: element.size * (1 + morphProgress * 0.5)
    }));
  };

  const visualElements = getInterpolatedElements();

  return (
    <group ref={groupRef}>
      {/* Process complexity visualization */}
      {visualElements.map((element, index) => (
        <group key={element.id} position={element.position}>
          {/* Main element */}
          <mesh>
            {element.type === 'node' && <sphereGeometry args={[element.size, 16, 16]} />}
            {element.type === 'decision' && <octahedronGeometry args={[element.size]} />}
            {element.type === 'milestone' && <coneGeometry args={[element.size, element.size * 2, 6]} />}
            {element.type === 'automation' && <icosahedronGeometry args={[element.size]} />}
            
            <meshStandardMaterial
              color={element.color}
              emissive={element.color}
              emissiveIntensity={0.2}
              transparent
              opacity={0.8}
            />
          </mesh>

          {/* Automation indicators */}
          {element.type === 'automation' && (
            <mesh rotation={[0, morphProgress * Math.PI * 2, 0]}>
              <torusGeometry args={[element.size * 1.5, element.size * 0.2, 8, 16]} />
              <meshBasicMaterial
                color="#00ffee"
                transparent
                opacity={0.6}
              />
            </mesh>
          )}

          {/* Element labels */}
          <Html position={[0, element.size + 0.5, 0]} center>
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}>
              {element.label}
            </div>
          </Html>

          {/* Complexity reduction indicators */}
          {process.currentLevel !== 'original' && (
            <mesh position={[0, element.size + 1, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
              <meshStandardMaterial
                color="#00ff00"
                emissive="#004400"
                emissiveIntensity={0.3}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* Connections between elements */}
      {currentVisualization.steps.map((step, index) => {
        const nextStep = currentVisualization.steps[index + 1];
        if (!nextStep) return null;

        const startElement = visualElements.find(e => e.id === step.id);
        const endElement = visualElements.find(e => e.id === nextStep.id);
        
        if (!startElement || !endElement) return null;

        return (
          <line key={`connection-${step.id}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([
                  startElement.position.x, startElement.position.y, startElement.position.z,
                  endElement.position.x, endElement.position.y, endElement.position.z
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={step.automated ? '#00ffee' : '#ffffff'}
              transparent
              opacity={step.automated ? 0.8 : 0.4}
            />
          </line>
        );
      })}

      {/* Simplification field effect */}
      {process.currentLevel !== 'original' && (
        <mesh>
          <sphereGeometry args={[15, 32, 32]} />
          <meshBasicMaterial
            color="#00ff88"
            transparent
            opacity={0.05}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* AI Processing indicators */}
      {Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const radius = 8 + Math.sin(morphProgress * Math.PI * 4 + i) * 2;
        return (
          <mesh
            key={`ai-${i}`}
            position={[
              Math.cos(angle) * radius,
              Math.sin(morphProgress * Math.PI * 2 + i * 0.5) * 3,
              Math.sin(angle) * radius
            ]}
          >
            <tetrahedronGeometry args={[0.1]} />
            <meshBasicMaterial
              color="#00ffee"
              transparent
              opacity={0.6}
            />
          </mesh>
        );
      })}

      {/* Central AI processor */}
      <group position={[0, 5, 0]}>
        <mesh rotation={[0, morphProgress * Math.PI, 0]}>
          <dodecahedronGeometry args={[1]} />
          <meshStandardMaterial
            color="#00ffee"
            emissive="#004455"
            emissiveIntensity={0.4}
            transparent
            opacity={0.9}
          />
        </mesh>
        <Text
          position={[0, -2, 0]}
          fontSize={0.5}
          color="#00ffee"
          anchorX="center"
          anchorY="middle"
        >
          AI Simplification Engine
        </Text>
      </group>
    </group>
  );
};

/**
 * Complexity comparison metrics
 */
const ComplexityMetrics: React.FC<{
  process: ComplexProcess;
  onLevelChange: (level: ComplexProcess['currentLevel']) => void;
}> = ({ process, onLevelChange }) => {
  const currentViz = process.simplificationLevels[process.currentLevel];
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'original': return '#ff6b6b';
      case 'intermediate': return '#ffaa00';
      case 'simplified': return '#6bcf7f';
      case 'quantum': return '#00ffee';
      default: return '#888888';
    }
  };

  return (
    <Card sx={{ mb: 2, background: 'rgba(0, 0, 0, 0.9)', color: 'white' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🎯 Complexity Simplification Metrics
        </Typography>

        {/* Level selector */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Simplification Level:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {(['original', 'intermediate', 'simplified', 'quantum'] as const).map(level => (
              <Button
                key={level}
                variant={process.currentLevel === level ? 'contained' : 'outlined'}
                size="small"
                onClick={() => onLevelChange(level)}
                sx={{
                  backgroundColor: process.currentLevel === level ? getLevelColor(level) : 'transparent',
                  borderColor: getLevelColor(level),
                  color: process.currentLevel === level ? 'black' : getLevelColor(level),
                  '&:hover': {
                    backgroundColor: getLevelColor(level),
                    color: 'black'
                  }
                }}
              >
                {level.toUpperCase()}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Current level metrics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="grey.400">Comprehension</Typography>
            <Typography variant="h6" style={{ color: getLevelColor(process.currentLevel) }}>
              {currentViz.comprehensionScore}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={currentViz.comprehensionScore}
              sx={{ '& .MuiLinearProgress-bar': { backgroundColor: getLevelColor(process.currentLevel) } }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="grey.400">Time to Complete</Typography>
            <Typography variant="h6" style={{ color: getLevelColor(process.currentLevel) }}>
              {currentViz.timeToComplete} days
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="grey.400">Citizen Friendliness</Typography>
            <Typography variant="h6" style={{ color: getLevelColor(process.currentLevel) }}>
              {currentViz.citizenFriendliness}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={currentViz.citizenFriendliness}
              sx={{ '& .MuiLinearProgress-bar': { backgroundColor: '#6bcf7f' } }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="grey.400">Error Reduction</Typography>
            <Typography variant="h6" style={{ color: getLevelColor(process.currentLevel) }}>
              {currentViz.errorReduction}%
            </Typography>
          </Grid>
        </Grid>

        {/* Process description */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Process Description:
          </Typography>
          <Typography variant="body2" color="grey.300">
            {currentViz.description}
          </Typography>
        </Box>

        {/* Simplification benefits */}
        {process.currentLevel !== 'original' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              🚀 AI Simplification Benefits:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label="Automated Steps" size="small" color="primary" />
              <Chip label="Reduced Paperwork" size="small" color="success" />
              <Chip label="Real-time Status" size="small" color="info" />
              <Chip label="Predictive Assistance" size="small" style={{ backgroundColor: '#00ffee', color: 'black' }} />
              {process.currentLevel === 'quantum' && (
                <Chip label="Quantum Optimization" size="small" style={{ backgroundColor: '#ff00ff', color: 'white' }} />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Step-by-step process breakdown
 */
const ProcessStepBreakdown: React.FC<{
  process: ComplexProcess;
}> = ({ process }) => {
  const currentViz = process.simplificationLevels[process.currentLevel];
  const [activeStep, setActiveStep] = useState(0);

  return (
    <Card sx={{ mb: 2, background: 'rgba(0, 0, 0, 0.8)', color: 'white' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📋 Process Step Breakdown
        </Typography>

        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 2 }}>
          {currentViz.steps.map((step, index) => (
            <Step key={step.id}>
              <StepLabel
                sx={{ 
                  color: 'white',
                  '& .MuiStepLabel-label': { color: 'white' },
                  '& .MuiStepIcon-root': { 
                    color: step.automated ? '#00ffee' : '#888888'
                  }
                }}
              >
                {step.name}
                {step.automated && <Chip label="AI Automated" size="small" sx={{ ml: 1, backgroundColor: '#00ffee', color: 'black' }} />}
              </StepLabel>
              {index === activeStep && (
                <Box sx={{ ml: 3, mt: 1, p: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                  <Typography variant="body2" color="grey.300" sx={{ mb: 1 }}>
                    {step.description}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="grey.400">Department:</Typography>
                      <Typography variant="body2">{step.department}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="grey.400">Duration:</Typography>
                      <Typography variant="body2">{step.duration} days</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="grey.400">Complexity:</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={step.complexity * 10}
                        sx={{
                          mt: 0.5,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: step.complexity > 7 ? '#ff6b6b' : step.complexity > 4 ? '#ffaa00' : '#6bcf7f'
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Step>
          ))}
        </Stepper>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            sx={{ borderColor: '#00aaff', color: '#00aaff' }}
          >
            Previous
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setActiveStep(Math.min(currentViz.steps.length - 1, activeStep + 1))}
            disabled={activeStep === currentViz.steps.length - 1}
            sx={{ borderColor: '#00aaff', color: '#00aaff' }}
          >
            Next
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setActiveStep(0)}
            sx={{ backgroundColor: '#00ffee', color: 'black', ml: 'auto' }}
          >
            Reset
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Before/After comparison
 */
const BeforeAfterComparison: React.FC<{
  process: ComplexProcess;
}> = ({ process }) => {
  const original = process.simplificationLevels.original;
  const current = process.simplificationLevels[process.currentLevel];

  const improvements = [
    {
      metric: 'Steps Required',
      before: original.steps.length,
      after: current.steps.length,
      unit: '',
      improvement: ((original.steps.length - current.steps.length) / original.steps.length) * 100
    },
    {
      metric: 'Time to Complete',
      before: original.timeToComplete,
      after: current.timeToComplete,
      unit: ' days',
      improvement: ((original.timeToComplete - current.timeToComplete) / original.timeToComplete) * 100
    },
    {
      metric: 'Citizen Friendliness',
      before: original.citizenFriendliness,
      after: current.citizenFriendliness,
      unit: '%',
      improvement: current.citizenFriendliness - original.citizenFriendliness
    },
    {
      metric: 'Error Rate',
      before: 100 - original.errorReduction,
      after: 100 - current.errorReduction,
      unit: '%',
      improvement: (100 - original.errorReduction) - (100 - current.errorReduction)
    }
  ];

  return (
    <Card sx={{ background: 'rgba(0, 0, 0, 0.8)', color: 'white' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📊 Before & After Comparison
        </Typography>

        {improvements.map((item, index) => (
          <Accordion 
            key={index}
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              color: 'white',
              mb: 1,
              '&:before': { display: 'none' }
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  {item.metric}
                </Typography>
                <Chip
                  label={`${item.improvement > 0 ? '+' : ''}${item.improvement.toFixed(1)}%`}
                  size="small"
                  color={item.improvement > 0 ? 'success' : item.improvement < 0 ? 'error' : 'default'}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, backgroundColor: 'rgba(255,0,0,0.1)' }}>
                    <Typography variant="caption" color="grey.400">BEFORE</Typography>
                    <Typography variant="h6" color="#ff6b6b">
                      {item.before}{item.unit}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, backgroundColor: 'rgba(0,255,0,0.1)' }}>
                    <Typography variant="caption" color="grey.400">AFTER</Typography>
                    <Typography variant="h6" color="#6bcf7f">
                      {item.after}{item.unit}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              <Typography variant="body2" color="grey.300" sx={{ mt: 2 }}>
                {item.improvement > 0 ? 
                  `🎉 Improvement of ${item.improvement.toFixed(1)}% achieved through AI simplification` :
                  `📈 Maintained performance with ${Math.abs(item.improvement).toFixed(1)}% variance`
                }
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
};

/**
 * Main Complexity Simplification Demo Component
 */
export const ComplexitySimplificationDemo: React.FC = () => {
  const [selectedProcess, setSelectedProcess] = useState<ComplexProcess | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize demo processes
  useEffect(() => {
    initializeDemoProcesses();
  }, []);

  const initializeDemoProcesses = () => {
    const buildingPermitProcess: ComplexProcess = {
      id: 'building_permit',
      name: 'Building Permit Application',
      description: 'Complete process for obtaining a residential building permit',
      complexity: {
        departments: 6,
        steps: 23,
        regulations: 47,
        timeframe: 120,
        documents: 15,
        approvals: 8
      },
      currentLevel: 'original',
      simplificationLevels: {
        original: {
          name: 'Traditional Process',
          description: '23-step manual process requiring visits to 6 different departments, extensive paperwork, and multiple approval cycles',
          steps: Array.from({ length: 23 }, (_, i) => ({
            id: `step_${i}`,
            name: `Manual Step ${i + 1}`,
            description: `Traditional manual process step requiring human intervention`,
            department: ['Planning', 'Building', 'Fire', 'Engineering', 'Environmental', 'Assessor'][i % 6],
            duration: Math.floor(Math.random() * 10) + 1,
            complexity: Math.floor(Math.random() * 10) + 1,
            dependencies: i > 0 ? [`step_${i - 1}`] : [],
            automated: false,
            citizenVisible: true
          })),
          visualElements: Array.from({ length: 23 }, (_, i) => ({
            id: `step_${i}`,
            type: 'node' as const,
            position: new THREE.Vector3(
              (Math.cos((i / 23) * Math.PI * 6) * (5 + i * 0.2)),
              Math.sin(i * 0.3) * 2,
              (Math.sin((i / 23) * Math.PI * 6) * (5 + i * 0.2))
            ),
            color: '#ff6b6b',
            size: 0.3,
            label: `Step ${i + 1}`
          })),
          comprehensionScore: 25,
          timeToComplete: 120,
          citizenFriendliness: 35,
          errorReduction: 15
        },
        intermediate: {
          name: 'Digital Integration',
          description: 'Digitized 16-step process with online portal and automated document verification',
          steps: Array.from({ length: 16 }, (_, i) => ({
            id: `int_step_${i}`,
            name: `Digital Step ${i + 1}`,
            description: `Partially automated step with digital assistance`,
            department: ['Planning', 'Building', 'Engineering'][i % 3],
            duration: Math.floor(Math.random() * 5) + 1,
            complexity: Math.floor(Math.random() * 7) + 1,
            dependencies: i > 0 ? [`int_step_${i - 1}`] : [],
            automated: i % 3 === 0,
            citizenVisible: true
          })),
          visualElements: Array.from({ length: 16 }, (_, i) => ({
            id: `int_step_${i}`,
            type: i % 3 === 0 ? 'automation' as const : 'node' as const,
            position: new THREE.Vector3(
              Math.cos((i / 16) * Math.PI * 4) * 4,
              Math.sin(i * 0.4) * 1.5,
              Math.sin((i / 16) * Math.PI * 4) * 4
            ),
            color: i % 3 === 0 ? '#00ffee' : '#ffaa00',
            size: 0.35,
            label: `Step ${i + 1}`
          })),
          comprehensionScore: 65,
          timeToComplete: 45,
          citizenFriendliness: 70,
          errorReduction: 45
        },
        simplified: {
          name: 'AI-Assisted Process',
          description: 'Streamlined 8-step process with AI guidance, predictive assistance, and automated compliance checking',
          steps: Array.from({ length: 8 }, (_, i) => ({
            id: `simp_step_${i}`,
            name: `Smart Step ${i + 1}`,
            description: `AI-guided step with intelligent automation and citizen assistance`,
            department: ['Integrated Services', 'AI Review'][i % 2],
            duration: Math.floor(Math.random() * 3) + 1,
            complexity: Math.floor(Math.random() * 4) + 1,
            dependencies: i > 0 ? [`simp_step_${i - 1}`] : [],
            automated: i % 2 === 1,
            citizenVisible: true
          })),
          visualElements: Array.from({ length: 8 }, (_, i) => ({
            id: `simp_step_${i}`,
            type: i % 2 === 1 ? 'automation' as const : 'milestone' as const,
            position: new THREE.Vector3(
              Math.cos((i / 8) * Math.PI * 2) * 3,
              Math.sin(i * 0.5) * 1,
              Math.sin((i / 8) * Math.PI * 2) * 3
            ),
            color: i % 2 === 1 ? '#00ffee' : '#6bcf7f',
            size: 0.4,
            label: `Step ${i + 1}`
          })),
          comprehensionScore: 85,
          timeToComplete: 12,
          citizenFriendliness: 90,
          errorReduction: 78
        },
        quantum: {
          name: 'Quantum-Optimized Process',
          description: 'Revolutionary 3-step quantum-assisted process with instantaneous compliance verification and predictive approval',
          steps: Array.from({ length: 3 }, (_, i) => ({
            id: `quantum_step_${i}`,
            name: `Quantum Step ${i + 1}`,
            description: `Quantum-optimized step with instantaneous processing and predictive outcomes`,
            department: 'Quantum Government Services',
            duration: 0.1,
            complexity: 1,
            dependencies: i > 0 ? [`quantum_step_${i - 1}`] : [],
            automated: true,
            citizenVisible: true
          })),
          visualElements: Array.from({ length: 3 }, (_, i) => ({
            id: `quantum_step_${i}`,
            type: 'automation' as const,
            position: new THREE.Vector3(
              Math.cos((i / 3) * Math.PI * 2) * 2,
              0,
              Math.sin((i / 3) * Math.PI * 2) * 2
            ),
            color: '#ff00ff',
            size: 0.5,
            label: `Quantum ${i + 1}`
          })),
          comprehensionScore: 98,
          timeToComplete: 0.5,
          citizenFriendliness: 99,
          errorReduction: 97
        }
      }
    };

    setSelectedProcess(buildingPermitProcess);
  };

  const handleLevelChange = (level: ComplexProcess['currentLevel']) => {
    if (!selectedProcess) return;

    setIsAnimating(true);
    setAnimationProgress(0);

    // Animate transition
    const animateTransition = () => {
      setAnimationProgress(prev => {
        if (prev >= 1) {
          setSelectedProcess(prev => prev ? { ...prev, currentLevel: level } : null);
          setIsAnimating(false);
          return 0;
        }
        return prev + 0.02;
      });
    };

    const animation = setInterval(animateTransition, 16);
    setTimeout(() => {
      clearInterval(animation);
      setIsAnimating(false);
      setAnimationProgress(0);
    }, 2000);
  };

  if (!selectedProcess) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: 'black',
        color: 'white'
      }}>
        <Typography variant="h4">🎯 Loading Complexity Simplification Demo...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', backgroundColor: 'black' }}>
      {/* 3D Process Visualization */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <Canvas camera={{ position: [0, 8, 15], fov: 60 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} />
          <pointLight position={[-10, -10, -10]} />
          <spotLight position={[0, 20, 0]} angle={0.3} penumbra={1} castShadow />
          
          <ProcessVisualization3D
            process={selectedProcess}
            animationProgress={animationProgress}
          />
          
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          <Environment preset="night" />
        </Canvas>
        
        {/* Overlay Title */}
        <Box sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 2,
          borderRadius: 1
        }}>
          <Typography variant="h4" component="h1">
            🎯 Complexity Simplification Engine
          </Typography>
          <Typography variant="subtitle1" color="grey.400">
            Transform impossible complexity into intuitive simplicity
          </Typography>
          <Typography variant="body2" color="grey.500" sx={{ mt: 1 }}>
            Process: {selectedProcess.name}
          </Typography>
        </Box>

        {/* Animation status */}
        {isAnimating && (
          <Box sx={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 2,
            borderRadius: 1
          }}>
            <Typography variant="body2" color="white" gutterBottom>
              🔄 AI Simplification in Progress...
            </Typography>
            <LinearProgress
              variant="determinate"
              value={animationProgress * 100}
              sx={{ '& .MuiLinearProgress-bar': { backgroundColor: '#00ffee' } }}
            />
          </Box>
        )}
      </Box>

      {/* Control Panel */}
      <Box sx={{ 
        width: 600, 
        padding: 2, 
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        overflowY: 'auto'
      }}>
        <ComplexityMetrics
          process={selectedProcess}
          onLevelChange={handleLevelChange}
        />
        
        <ProcessStepBreakdown process={selectedProcess} />
        
        <BeforeAfterComparison process={selectedProcess} />
      </Box>
    </Box>
  );
};

export default ComplexitySimplificationDemo;