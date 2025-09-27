/**
 * 🔮 Predictive Future Modeling Visualization
 * Advanced AI-powered government future scenario modeling and visualization
 *
 * @version 2.0.0
 * @author MIT PhD Systems Engineer
 * @classification Predictive Government Intelligence Interface
 */

import React, {useState, useEffect, useRef, useMemo} from 'react';
import * as THREE from 'three';
import {Canvas, useFrame} from '@react-three/fiber';
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
  Slider,
  TextField,} from '@mui/material';
import {ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,} from '@mui/icons-material';
import {predictiveFutureEngine,
  FutureScenario,
  GovernmentForecast,
  PredictiveFactor,} from '../engines/PredictiveFutureEngine';

interface FutureVisualizationProps {scenarios: FutureScenario[];
  selectedScenario: FutureScenario | null;
  timeHorizon: number; // months
  onScenarioSelect: (scenario: FutureScenario) => void;}

/**
 * 3D Future Scenario visualization
 */
const FutureScenarios3D: React.FC<FutureVisualizationProps> = ({scenarios,
  selectedScenario,
  timeHorizon,
  onScenarioSelect,}) => {const groupRef = useRef<THREE.Group>(null);
  const [time, setTime] = useState(0);

  useFrame((state, delta) =>{
    setTime(time + delta);
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.01;}
  });

  const getProbabilityColor = (probability: number) => {if (probability > 0.8) return '#00ff00';
    if (probability > 0.6) return '#ffff00';
    if (probability > 0.4) return '#ff8800';
    if (probability > 0.2) return '#ff4400';
    return '#ff0000';};

  const getImpactColor = (impactLevel: FutureScenario['impactLevel']) => {switch (impactLevel) {
      case 'PARADIGM_SHIFT':
        return '#ff00ff';
      case 'TRANSFORMATIVE':
        return '#ff6b6b';
      case 'HIGH':
        return '#ffaa00';
      case 'MEDIUM':
        return '#4ecdc4';
      case 'LOW':
        return '#96ceb4';
      default:
        return '#ffffff';}
  };

  const getScenarioPosition = (index: number, total: number) => {const angle = (index / total) * Math.PI * 2;
    const radius = 8 + index * 0.5;
    return new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(index * 0.2) * 3,
      Math.sin(angle) * radius
    );};

  return (<group ref={groupRef}>{/* Central future nexus */}<mesh position={[0, 0, 0]}><octahedronGeometry args={[2, 2]} /><meshStandardMaterial
          color="#00ffee"
          emissive="#004455"
          emissiveIntensity={0.4}
          transparent
          opacity={0.9} /></mesh>{/* Future probability field */}<mesh><sphereGeometry args={[20, 32, 32]} /><meshBasicMaterial color="#00ffee" transparent opacity={0.03} side={THREE.BackSide} /></mesh>{/* Future scenarios */}
      {scenarios.map((scenario, index) => {
        const position = getScenarioPosition(index, scenarios.length);
        const isSelected = selectedScenario?.id === scenario.id;
        const probabilityRadius = 0.5 + scenario.probability * 1.5;

        return (<group key={scenario.id} position={position}>{/* Main scenario sphere */}<mesh
              onClick={() => onScenarioSelect(scenario)}
              onPointerOver={() => {
                document.body.style.cursor = 'pointer';}}
              onPointerOut={() => {
                document.body.style.cursor = 'default';}}
            ><sphereGeometry args={[probabilityRadius, 16, 16]} /><meshStandardMaterial
                color={getProbabilityColor(scenario.probability)}
                emissive={getProbabilityColor(scenario.probability)}
                emissiveIntensity={isSelected ? 0.6 : 0.3}
                transparent
                opacity={0.8} /></mesh>{/* Probability visualization field */}<mesh><sphereGeometry
                args={[probabilityRadius * 2 + Math.sin(time * 2 + index) * 0.5, 16, 16]} /><meshBasicMaterial
                color={getProbabilityColor(scenario.probability)}
                transparent
                opacity={0.1 + scenario.probability * 0.1}
                side={THREE.BackSide} /></mesh>{/* Impact level indicator */}<mesh position={[0, probabilityRadius + 0.8, 0]}><coneGeometry args={[0.3, 0.8, 6]} /><meshStandardMaterial
                color={getImpactColor(scenario.impactLevel)}
                emissive={getImpactColor(scenario.impactLevel)}
                emissiveIntensity={0.4} /></mesh>{/* Selection indicator */}
            {isSelected && (<group><mesh rotation={[0, time * 3, 0]}><torusGeometry args={[probabilityRadius * 2.5, 0.1, 8, 16]} /><meshBasicMaterial color="#ffffff" emissive="#ffaa00" emissiveIntensity={0.8} /></mesh><mesh rotation={[Math.PI / 2, time * -2, 0]}><torusGeometry args={[probabilityRadius * 2.5, 0.1, 8, 16]} /><meshBasicMaterial color="#ffffff" emissive="#ffaa00" emissiveIntensity={0.8} /></mesh></group>)}

            {/* Time horizon visualization */}<mesh position={[0, -probabilityRadius - 1, 0]}><cylinderGeometry args={[0.1, 0.1, scenario.timeframe.duration / 12, 8]} /><meshStandardMaterial color="#00aaff" transparent opacity={0.6} /></mesh>{/* Key factors visualization */}
            {scenario.keyFactors.slice(0, 3).map((factor, factorIndex) => {
              const factorAngle = (factorIndex / 3) * Math.PI * 2;
              const factorRadius = probabilityRadius + 1.5;
              const factorPos: [number, number, number] = [
                Math.cos(factorAngle) * factorRadius,
                0,
                Math.sin(factorAngle) * factorRadius,
              ];

              return (<mesh key={factor.id} position={factorPos}><octahedronGeometry args={[0.2]} /><meshStandardMaterial
                    color={factor.trend === 'INCREASING'
                        ? '#00ff00'
                        : factor.trend === 'DECREASING'
                          ? '#ff0000'
                          : factor.trend === 'VOLATILE'
                            ? '#ff00ff'
                            : '#ffff00'}
                    emissive={factor.trend === 'INCREASING'
                        ? '#004400'
                        : factor.trend === 'DECREASING'
                          ? '#440000'
                          : factor.trend === 'VOLATILE'
                            ? '#440044'
                            : '#444400'}
                    emissiveIntensity={0.3}
                    transparent
                    opacity={factor.influence} /></mesh>);
            })}

            {/* Scenario name label */}<Billboard position={[0, probabilityRadius + 2, 0]}><Text fontSize={0.4} color="white" anchorX="center" anchorY="middle">{scenario.name}</Text></Billboard>{/* Probability percentage */}<Billboard position={[0, -probabilityRadius - 2, 0]}><Text
                fontSize={0.3}
                color={getProbabilityColor(scenario.probability)}
                anchorX="center"
                anchorY="middle"
              >{(scenario.probability * 100).toFixed(1)}%</Text></Billboard></group>);
      })}

      {/* Timeline connections */}
      {scenarios.map((scenario, index) => {
        const startPos = new THREE.Vector3(0, 0, 0);
        const endPos = getScenarioPosition(index, scenarios.length);

        return (<Line
            key={`timeline-${scenario.id}`}
            points={[startPos, endPos]}
            color="#00ffee"
            lineWidth={2}
            transparent
            opacity={0.2}
            dashed
            dashScale={5}
            gapSize={2} />);
      })}

      {/* Predictive field waves */}
      {Array.from({length: 6}, (_, i) => (<mesh
          key={`wave-${i}`}
          position={[0, 0, 0]}
          rotation={[0, time * 0.2 + (i * Math.PI) / 3, 0]}
        ><torusGeometry args={[12 + i * 2, 0.05, 8, 32]} /><meshBasicMaterial color="#00ffee" transparent opacity={0.08 - i * 0.01} /></mesh>))}

      {/* Central prediction core */}<mesh position={[0, 4, 0]} rotation={[0, time * 0.5, 0]}><dodecahedronGeometry args={[1]} /><meshStandardMaterial
          color="#ff00ff"
          emissive="#440044"
          emissiveIntensity={0.5}
          transparent
          opacity={0.9} /></mesh><Billboard position={[0, 6, 0]}><Text fontSize={0.5} color="#ff00ff" anchorX="center" anchorY="middle">Predictive Core</Text></Billboard></group>
  );
};

/**
 * Scenario details panel
 */
const ScenarioDetailsPanel: React.FC<{scenario: FutureScenario | null;
  onCreateCustomScenario: () =>void;}> = ({scenario, onCreateCustomScenario}) => {
  if (!scenario) {
    return (<Card sx={{ mb: 2, background: 'rgba(0, 0, 0, 0.8)', color: 'white'}}><CardContent><Typography variant="h6" gutterBottom>🔮 Predictive Future Modeling</Typography><Typography variant="body2" color="grey.400">Select a scenario to view detailed predictions</Typography><Button
            variant="contained"
            onClick={onCreateCustomScenario}
            sx={{ mt: 2, backgroundColor: '#00ffee', color: 'black'}}
          >➕ Create Custom Scenario</Button></CardContent></Card>);
  }

  const getImpactLevelColor = (level: FutureScenario['impactLevel']) => {switch (level) {
      case 'PARADIGM_SHIFT':
        return '#ff00ff';
      case 'TRANSFORMATIVE':
        return '#ff6b6b';
      case 'HIGH':
        return '#ffaa00';
      case 'MEDIUM':
        return '#4ecdc4';
      case 'LOW':
        return '#96ceb4';
      default:
        return '#ffffff';}
  };

  return (<Card sx={{ mb: 2, background: 'rgba(0, 0, 0, 0.9)', color: 'white'}}><CardContent><Typography variant="h6" gutterBottom sx={{ color: '#00ffee'}}>🔮 {scenario.name}</Typography><Typography variant="body2" color="grey.400" sx={{ mb: 2}}>{scenario.description}</Typography>{/* Key metrics */}<Grid container spacing={2} sx={{ mb: 3}}><Grid item xs={6} md={3}><Typography variant="caption" color="grey.400">Probability</Typography><Typography
              variant="h6"
              color={scenario.probability >0.8
                  ? '#00ff00'
                  : scenario.probability > 0.6
                    ? '#ffff00'
                    : scenario.probability > 0.4
                      ? '#ff8800'
                      : '#ff4400'}
            >
              {(scenario.probability * 100).toFixed(1)}%</Typography></Grid><Grid item xs={6} md={3}><Typography variant="caption" color="grey.400">Confidence</Typography><Typography variant="h6" color="#00aaff">{scenario.confidence}%</Typography></Grid><Grid item xs={6} md={3}><Typography variant="caption" color="grey.400">Timeframe</Typography><Typography variant="h6" color="#ffaa00">{scenario.timeframe.duration}mo</Typography></Grid><Grid item xs={6} md={3}><Typography variant="caption" color="grey.400">Impact Level</Typography><Chip
              label={scenario.impactLevel.replace(/_/g, ' ')}
              size="small"
              style={{ backgroundColor: getImpactLevelColor(scenario.impactLevel), color: 'white'}} /></Grid></Grid>{/* Key factors */}<Accordion sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.05)'}}><AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white'}} />}><Typography variant="subtitle1" color="white">🎯 Key Predictive Factors ({scenario.keyFactors.length})</Typography></AccordionSummary><AccordionDetails><List dense>{scenario.keyFactors.map(factor => (<ListItem
                  key={factor.id}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    mb: 1,
                    borderRadius: 1,}}
                ><ListItemText
                    primary={factor.name}
                    secondary={<Box><Typography variant="caption" color="grey.400">{factor.category} • {factor.trend} trend •{' '}
                          {(factor.influence * 100).toFixed(0)}% influence</Typography><Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5}}><Typography variant="caption" color="grey.500" sx={{ minWidth: 60}}>Current: {factor.currentValue}</Typography><TrendingUpIcon
                            sx={{
                              mx: 1,
                              color:
                                factor.trend === 'INCREASING'
                                  ? '#00ff00'
                                  : factor.trend === 'DECREASING'
                                    ? '#ff0000'
                                    : '#ffff00',
                              fontSize: 16,}} /><Typography variant="caption" color="grey.500">Predicted: {factor.predictedValue}</Typography></Box><LinearProgress
                          variant="determinate"
                          value={factor.certainty * 100}
                          sx={{
                            mt: 0.5,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: factor.certainty > 0.7 ? '#00ff00' : '#ffaa00',},
                          }}
                        /><Typography variant="caption" color="grey.500">Certainty: {(factor.certainty * 100).toFixed(0)}%</Typography></Box>
                    }
                    primaryTypographyProps={{ color: 'white'}}
                  /></ListItem>))}</List></AccordionDetails></Accordion>{/* Future outcomes */}<Accordion sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.05)'}}><AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white'}} />}><Typography variant="subtitle1" color="white">📈 Predicted Outcomes ({scenario.outcomes.length})</Typography></AccordionSummary><AccordionDetails><List dense>{scenario.outcomes.map(outcome => (<ListItem
                  key={outcome.id}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    mb: 1,
                    borderRadius: 1,}}
                ><ListItemText
                    primary={outcome.description}
                    secondary={<Box><Typography variant="caption" color="grey.400">Domain: {outcome.domain} • Impact:{' '}
                          {outcome.quantifiedImpact > 0 ? '+' : ''}
                          {outcome.quantifiedImpact}%</Typography><Typography variant="caption" display="block" color="grey.500">Timeline: {outcome.timeline.toLocaleDateString()}</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1}}>{outcome.cascadingEffects.slice(0, 3).map((effect, index) => (<Chip
                              key={index}
                              label={effect}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.6rem', height: 20}} />))}</Box></Box>
                    }
                    primaryTypographyProps={{ color: 'white', variant: 'body2'}}
                  /></ListItem>))}</List></AccordionDetails></Accordion>{/* Mitigation strategies */}
        {scenario.mitigationStrategies.length > 0 && (<Accordion sx={{ backgroundColor: 'rgba(255,255,255,0.05)'}}><AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white'}} />}><Typography variant="subtitle1" color="white">🛡️ Mitigation Strategies ({scenario.mitigationStrategies.length})</Typography></AccordionSummary><AccordionDetails><List dense>{scenario.mitigationStrategies.map(strategy => (<ListItem
                    key={strategy.id}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      mb: 1,
                      borderRadius: 1,}}
                  ><ListItemText
                      primary={strategy.name}
                      secondary={<Box><Typography variant="caption" color="grey.400" sx={{ mb: 1}}>{strategy.description}</Typography><Grid container spacing={1}><Grid item xs={6}><Typography variant="caption" color="grey.500">Effectiveness: {strategy.effectivenessScore}%</Typography></Grid><Grid item xs={6}><Typography variant="caption" color="grey.500">Risk Reduction: {strategy.riskReduction}%</Typography></Grid><Grid item xs={6}><Typography variant="caption" color="grey.500">Cost: ${(strategy.implementationCost / 1000000).toFixed(1)}M</Typography></Grid><Grid item xs={6}><Typography variant="caption" color="grey.500">Timeline: {strategy.timeToImplement}mo</Typography></Grid></Grid></Box>
                      }
                      primaryTypographyProps={{ color: 'white', variant: 'body2'}}
                    /></ListItem>))}</List></AccordionDetails></Accordion>)}</CardContent></Card>
  );
};

/**
 * Forecast horizon selector and summary
 */
const ForecastDashboard: React.FC<{scenarios: FutureScenario[];
  forecast: GovernmentForecast | null;
  onHorizonChange: (horizon: GovernmentForecast['horizon']) =>void;
  selectedHorizon: GovernmentForecast['horizon'];}> = ({scenarios, forecast, onHorizonChange, selectedHorizon}) => {const horizonLabels = {
    '3_MONTHS': '3 Months',
    '1_YEAR': '1 Year',
    '5_YEARS': '5 Years',
    '10_YEARS': '10 Years',
    '25_YEARS': '25 Years',};

  const getHorizonColor = (horizon: GovernmentForecast['horizon']) => {switch (horizon) {
      case '3_MONTHS':
        return '#00ff00';
      case '1_YEAR':
        return '#ffff00';
      case '5_YEARS':
        return '#ff8800';
      case '10_YEARS':
        return '#ff4400';
      case '25_YEARS':
        return '#ff0000';
      default:
        return '#ffffff';}
  };

  return (<Card sx={{ background: 'rgba(0, 0, 0, 0.8)', color: 'white'}}><CardContent><Typography variant="h6" gutterBottom>🔮 Government Future Forecast</Typography>{/* Horizon selector */}<FormControl fullWidth size="small" sx={{ mb: 3}}><InputLabel sx={{ color: 'white'}}>Forecast Horizon</InputLabel><Select
            value={selectedHorizon}
            onChange={e =>onHorizonChange(e.target.value as GovernmentForecast['horizon'])}
            sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white'} }}
          >
            {Object.entries(horizonLabels).map(([value, label]) => (<MenuItem key={value} value={value}><TimelineIcon
                  sx={{ mr: 1, color: getHorizonColor(value as GovernmentForecast['horizon'])}} />{label}</MenuItem>))}</Select></FormControl>{/* Active scenarios summary */}<Box sx={{ mb: 3}}><Typography variant="subtitle2" gutterBottom>📊 Active Scenarios: {scenarios.length}</Typography><Grid container spacing={1}><Grid item xs={6}><Typography variant="caption" color="grey.400">High Probability</Typography><Typography variant="h6" color="#00ff00">{scenarios.filter(s => s.probability > 0.7).length}</Typography></Grid><Grid item xs={6}><Typography variant="caption" color="grey.400">High Impact</Typography><Typography variant="h6" color="#ff6b6b">{scenarios.filter(s =>
                    ['HIGH', 'TRANSFORMATIVE', 'PARADIGM_SHIFT'].includes(s.impactLevel)
                  ).length}</Typography></Grid></Grid></Box>{/* Wildcard events */}
        {forecast && forecast.wildcardEvents.length > 0 && (<Box sx={{ mb: 3}}><Typography variant="subtitle2" gutterBottom>⚡ Wildcard Events</Typography><List dense>{forecast.wildcardEvents.slice(0, 3).map((event, index) => (<ListItem key={index} sx={{ py: 0}}><ListItemText
                    primary={event.event}
                    secondary={`${(event.probability * 100).toFixed(0)}% probability • ${event.impact}% impact`}
                    primaryTypographyProps={{ variant: 'body2', color: 'white'}}
                    secondaryTypographyProps={{ variant: 'caption', color: 'grey.400'}} /></ListItem>))}</List></Box>)}

        {/* Systemic risks */}
        {forecast && forecast.systemicRisks.length > 0 && (<Box><Typography variant="subtitle2" gutterBottom>⚠️ Systemic Risks</Typography><List dense>{forecast.systemicRisks.slice(0, 2).map((risk, index) => (<ListItem key={index} sx={{ py: 0}}><ListItemText
                    primary={risk.risk}
                    secondary={`${risk.buildupTime}mo buildup • ${risk.cascadePotential}% cascade potential`}
                    primaryTypographyProps={{ variant: 'body2', color: 'white'}}
                    secondaryTypographyProps={{ variant: 'caption', color: 'grey.400'}} /></ListItem>))}</List></Box>)}</CardContent></Card>
  );
};

/**
 * Custom scenario creator
 */
const CustomScenarioCreator: React.FC<{open: boolean;
  onClose: () => void;
  onCreateScenario: (name: string, description: string, factors: PredictiveFactor[]) => void;}> = ({open, onClose, onCreateScenario}) => {
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [factors, setFactors] = useState<PredictiveFactor[]>([]);

  const addFactor = () =>{
    const newFactor: PredictiveFactor = {
      id: `factor_${Date.now()}`,
      name: 'New Factor',
      category: 'TECHNOLOGICAL',
      currentValue: 50,
      predictedValue: 75,
      trend: 'INCREASING',
      influence: 0.5,
      certainty: 0.7,
      dataQuality: 0.8,
    };
    setFactors([...factors, newFactor]);
  };

  const handleCreate = () => {if (scenarioName && factors.length > 0) {
      onCreateScenario(scenarioName, scenarioDescription, factors);
      setScenarioName('');
      setScenarioDescription('');
      setFactors([]);
      onClose();}
  };

  if (!open) return null;

  return (<Card sx={{ mb: 2, background: 'rgba(0, 0, 0, 0.9)', color: 'white'}}><CardContent><Typography variant="h6" gutterBottom>➕ Create Custom Scenario</Typography><Grid container spacing={2}><Grid item xs={12}><TextField
              fullWidth
              label="Scenario Name"
              value={scenarioName}
              onChange={e => setScenarioName(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)'},
                  '&:hover fieldset': {borderColor: 'rgba(255,255,255,0.5)'},
                  '&.Mui-focused fieldset': {borderColor: '#00ffee'},
                },
                '& .MuiInputLabel-root': {color: 'rgba(255,255,255,0.7)'},
              }}
            /></Grid><Grid item xs={12}><TextField
              fullWidth
              label="Description"
              value={scenarioDescription}
              onChange={e => setScenarioDescription(e.target.value)}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)'},
                  '&:hover fieldset': {borderColor: 'rgba(255,255,255,0.5)'},
                  '&.Mui-focused fieldset': {borderColor: '#00ffee'},
                },
                '& .MuiInputLabel-root': {color: 'rgba(255,255,255,0.7)'},
              }}
            /></Grid></Grid><Box sx={{ mt: 2, mb: 2}}><Button
            variant="outlined"
            size="small"
            onClick={addFactor}
            sx={{ borderColor: '#00ffee', color: '#00ffee'}}
          >Add Predictive Factor</Button></Box><Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end'}}><Button
            variant="outlined"
            size="small"
            onClick={onClose}
            sx={{ borderColor: 'grey.600', color: 'grey.400'}}
          >Cancel</Button><Button
            variant="contained"
            size="small"
            onClick={handleCreate}
            disabled={!scenarioName || factors.length === 0}
            sx={{ backgroundColor: '#00ffee', color: 'black'}}
          >Create Scenario</Button></Box></CardContent></Card>
  );
};

/**
 * Main Predictive Future Modeling Component
 */
export const PredictiveFutureModeling: React.FC = () => {const [scenarios, setScenarios] = useState<FutureScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<FutureScenario | null>(null);
  const [forecast, setForecast] = useState<GovernmentForecast | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<GovernmentForecast['horizon']>('5_YEARS');
  const [timeHorizon, setTimeHorizon] = useState(60); // months
  const [showCustomCreator, setShowCustomCreator] = useState(false);

  // Initialize predictive engine
  useEffect(() =>{
    const initializeEngine = async () => {
      const handleScenariosGenerated = (initialScenarios: FutureScenario[]) => {
        setScenarios(initialScenarios);
        if (initialScenarios.length > 0) {
          setSelectedScenario(initialScenarios[0]);}
      };

      const handleScenarioCreated = (scenario: FutureScenario) => {setScenarios(prev => [...prev, scenario]);};

      const handlePredictionUpdated = (scenario: FutureScenario) => {setScenarios(prev => prev.map(s => (s.id === scenario.id ? scenario : s)));
        if (selectedScenario?.id === scenario.id) {
          setSelectedScenario(scenario);}
      };

      predictiveFutureEngine.on('baselineScenariosGenerated', handleScenariosGenerated);
      predictiveFutureEngine.on('customScenarioCreated', handleScenarioCreated);
      predictiveFutureEngine.on('predictionUpdated', handlePredictionUpdated);

      // Generate forecast for initial horizon
      try {const initialForecast =
          await predictiveFutureEngine.generateGovernmentForecast(selectedHorizon);
        setForecast(initialForecast);} catch (error) {console.warn('Could not generate initial forecast:', error);}

      return () => {predictiveFutureEngine.off('baselineScenariosGenerated', handleScenariosGenerated);
        predictiveFutureEngine.off('customScenarioCreated', handleScenarioCreated);
        predictiveFutureEngine.off('predictionUpdated', handlePredictionUpdated);};
    };

    initializeEngine();
  }, []);

  const handleHorizonChange = async (horizon: GovernmentForecast['horizon']) => {setSelectedHorizon(horizon);

    const horizonMonths = {
      '3_MONTHS': 3,
      '1_YEAR': 12,
      '5_YEARS': 60,
      '10_YEARS': 120,
      '25_YEARS': 300,}[horizon];

    setTimeHorizon(horizonMonths);

    try {const newForecast = await predictiveFutureEngine.generateGovernmentForecast(horizon);
      setForecast(newForecast);} catch (error) {console.warn('Could not generate forecast:', error);}
  };

  const handleCreateCustomScenario = async (
    name: string,
    description: string,
    factors: PredictiveFactor[]
  ) => {try {
      const customScenario = await predictiveFutureEngine.createCustomScenario(
        name,
        description,
        timeHorizon,
        factors
      );
      console.log('Custom scenario created:', customScenario);} catch (error) {console.error('Failed to create custom scenario:', error);}
  };

  return (<Box sx={{ width: '100%', height: '100vh', display: 'flex', backgroundColor: 'black'}}>{/* 3D Future Scenarios Visualization */}<Box sx={{ flex: 1, position: 'relative'}}><Canvas camera={{ position: [0, 8, 25], fov: 60}}><ambientLight intensity={0.2} /><pointLight position={[20, 20, 20]} /><pointLight position={[-20, -20, -20]} /><spotLight position={[0, 30, 0]} angle={0.3} penumbra={1} castShadow /><FutureScenarios3D
            scenarios={scenarios}
            selectedScenario={selectedScenario}
            timeHorizon={timeHorizon}
            onScenarioSelect={setSelectedScenario} /><OrbitControls enablePan={true} enableZoom={true} enableRotate={true} /><Environment preset="night" /></Canvas>{/* Overlay Title */}<Box
          sx={{
            position: 'absolute',
            top: 20,
            left: 20,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 2,
            borderRadius: 1,}}
        ><Typography variant="h4" component="h1">🔮 Predictive Future Modeling</Typography><Typography variant="subtitle1" color="grey.400">AI-powered government future scenario analysis and prediction</Typography><Typography variant="body2" color="grey.500" sx={{ mt: 1}}>Horizon: {selectedHorizon.replace(/_/g, ' ')} | Scenarios: {scenarios.length}</Typography></Box></Box>{/* Control Panel */}<Box
        sx={{
          width: 500,
          padding: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          overflowY: 'auto',}}
      ><ForecastDashboard
          scenarios={scenarios}
          forecast={forecast}
          onHorizonChange={handleHorizonChange}
          selectedHorizon={selectedHorizon} />{showCustomCreator && (<CustomScenarioCreator
            open={showCustomCreator}
            onClose={() =>setShowCustomCreator(false)}
            onCreateScenario={handleCreateCustomScenario}
          />
        )}<ScenarioDetailsPanel
          scenario={selectedScenario}
          onCreateCustomScenario={() => setShowCustomCreator(true)}
        /></Box></Box>
  );
};

export default PredictiveFutureModeling;
