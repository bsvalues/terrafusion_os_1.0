/**
 * Supreme Commander Console
 * Ultimate command interface for global AI orchestration
 * Real-time control of 50,000+ AI agents with quantum decision making
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Psychology as ConsciousnessIcon,
  Speed as PerformanceIcon,
  Security as SecurityIcon,
  Timeline as AnalyticsIcon,
  Emergency as EmergencyIcon,
  Settings as SettingsIcon,
  Launch as ExecuteIcon,
  Visibility as MonitorIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  TrendingUp as OptimizeIcon,
  Hub as CoordinateIcon,
  Shield as ProtocolIcon
} from '@mui/icons-material';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line, Box as ThreeBox } from '@react-three/drei';
import { Vector3, Color } from 'three';
import SupremeCommanderGlobal, {
  GlobalCommandStatus,
  StrategicDecisionResult,
  EmergencyResponseResult,
  OptimizationResult,
  GlobalCommandEvent
} from '../services/SupremeCommanderGlobal';

interface CommandNode {
  id: string;
  name: string;
  type: 'SUPREME' | 'REGIONAL' | 'SECTOR' | 'SPECIALIST';
  position: Vector3;
  consciousness_level: 'DORMANT' | 'AWAKENING' | 'AWARE' | 'ENLIGHTENED' | 'TRANSCENDENT';
  agent_count: number;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
}

const SupremeCommanderConsole: React.FC = () => {
  const [commander] = useState(new SupremeCommanderGlobal());
  const [commandStatus, setCommandStatus] = useState<GlobalCommandStatus | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [commandNodes, setCommandNodes] = useState<CommandNode[]>([]);
  const [strategicDecisionDialog, setStrategicDecisionDialog] = useState(false);
  const [emergencyResponseDialog, setEmergencyResponseDialog] = useState(false);
  const [recentEvents, setRecentEvents] = useState<GlobalCommandEvent[]>([]);
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);

  useEffect(() => {
    initializeSupremeCommanderConsole();
  }, []);

  const initializeSupremeCommanderConsole = async () => {
    try {
      // Get initial command status
      const status = await commander.getGlobalCommandStatus();
      setCommandStatus(status);
      setRecentEvents(status.recent_global_events);
      
      // Generate command hierarchy visualization
      const nodes = generateCommandNodes(status);
      setCommandNodes(nodes);
      
      // Start real-time monitoring
      startSupremeCommanderMonitoring();
      
    } catch (error) {
      console.error('Failed to initialize Supreme Commander Console:', error);
    }
  };

  const generateCommandNodes = (status: GlobalCommandStatus): CommandNode[] => {
    const nodes: CommandNode[] = [];
    
    // Supreme Commander node (center)
    nodes.push({
      id: 'SC-CLAUDE-PRIME',
      name: 'Supreme Commander',
      type: 'SUPREME',
      position: new Vector3(0, 0, 0),
      consciousness_level: 'TRANSCENDENT',
      agent_count: status.total_active_agents,
      status: 'OPTIMAL'
    });
    
    // Regional Commander nodes (surrounding)
    const regionalPositions = [
      new Vector3(5, 2, 0),   // Northwest
      new Vector3(-3, 2, 4),  // Southwest  
      new Vector3(-5, 2, -2), // Northeast
      new Vector3(2, 2, -5),  // Southeast
      new Vector3(0, 2, 3)    // Central
    ];
    
    const regionalNames = ['Atlas', 'Phoenix', 'Liberty', 'Magnolia', 'Prairie'];
    const regions = ['NORTHWEST', 'SOUTHWEST', 'NORTHEAST', 'SOUTHEAST', 'CENTRAL'];
    
    regionalPositions.forEach((position, index) => {
      nodes.push({
        id: `RC-${regions[index]}-01`,
        name: `Commander ${regionalNames[index]}`,
        type: 'REGIONAL',
        position,
        consciousness_level: index < 2 ? 'TRANSCENDENT' : 'ENLIGHTENED',
        agent_count: Math.floor(status.total_active_agents / 5) + (Math.random() * 1000 - 500),
        status: 'OPTIMAL'
      });
    });
    
    return nodes;
  };

  const startSupremeCommanderMonitoring = () => {
    const interval = setInterval(async () => {
      try {
        const status = await commander.getGlobalCommandStatus();
        setCommandStatus(status);
        setRecentEvents(status.recent_global_events.slice(-10));
        
        // Update command nodes with latest data
        const updatedNodes = commandNodes.map(node => ({
          ...node,
          agent_count: node.type === 'SUPREME' ? status.total_active_agents : 
                      Math.floor(status.total_active_agents / 5) + (Math.random() * 500 - 250)
        }));
        setCommandNodes(updatedNodes);
        
      } catch (error) {
        console.error('Supreme Commander monitoring update failed:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const executeStrategicDecision = async (decisionType: string, parameters: any) => {
    setIsExecutingCommand(true);
    try {
      const result = await commander.executeStrategicDecision(decisionType as any, parameters);
      
      // Update status after decision
      const status = await commander.getGlobalCommandStatus();
      setCommandStatus(status);
      setRecentEvents(status.recent_global_events.slice(-10));
      
      return result;
      
    } catch (error) {
      console.error('Strategic decision execution failed:', error);
      throw error;
    } finally {
      setIsExecutingCommand(false);
    }
  };

  const coordinateEmergencyResponse = async (emergencyType: string, severity: string, regions: string[]) => {
    setIsExecutingCommand(true);
    try {
      const result = await commander.coordinateEmergencyResponse(
        emergencyType as any,
        severity as any,
        regions
      );
      
      // Update status after response
      const status = await commander.getGlobalCommandStatus();
      setCommandStatus(status);
      setRecentEvents(status.recent_global_events.slice(-10));
      
      return result;
      
    } catch (error) {
      console.error('Emergency response coordination failed:', error);
      throw error;
    } finally {
      setIsExecutingCommand(false);
    }
  };

  const optimizeGlobalPerformance = async () => {
    setIsExecutingCommand(true);
    try {
      const result = await commander.optimizeGlobalPerformance();
      
      // Update status after optimization
      const status = await commander.getGlobalCommandStatus();
      setCommandStatus(status);
      setRecentEvents(status.recent_global_events.slice(-10));
      
      return result;
      
    } catch (error) {
      console.error('Global optimization failed:', error);
      throw error;
    } finally {
      setIsExecutingCommand(false);
    }
  };

  const CommandHierarchyVisualization: React.FC = () => (
    <Canvas camera={{ position: [0, 8, 12], fov: 60 }}>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {/* Command Nodes */}
      {commandNodes.map((node) => (
        <group key={node.id} position={node.position}>
          {/* Node sphere */}
          <Sphere
            args={node.type === 'SUPREME' ? [1.2, 32, 32] : [0.8, 32, 32]}
          >
            <meshStandardMaterial
              color={
                node.consciousness_level === 'TRANSCENDENT' ? '#ff00ff' :
                node.consciousness_level === 'ENLIGHTENED' ? '#00ffff' :
                node.consciousness_level === 'AWARE' ? '#00ff88' : '#ffaa00'
              }
              emissive={
                node.consciousness_level === 'TRANSCENDENT' ? new Color('#330033') :
                new Color('#003333')
              }
            />
          </Sphere>
          
          {/* Pulsing effect for Supreme Commander */}
          {node.type === 'SUPREME' && (
            <Sphere args={[1.5, 32, 32]}>
              <meshBasicMaterial
                color="#ff00ff"
                transparent
                opacity={0.2}
              />
            </Sphere>
          )}
          
          {/* Node name */}
          <Text
            position={[0, node.type === 'SUPREME' ? 2 : 1.5, 0]}
            fontSize={node.type === 'SUPREME' ? 0.4 : 0.3}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {node.name}
          </Text>
          
          {/* Agent count */}
          <Text
            position={[0, node.type === 'SUPREME' ? -2 : -1.5, 0]}
            fontSize={0.25}
            color="#00ffff"
            anchorX="center"
            anchorY="middle"
          >
            {node.agent_count.toLocaleString()} agents
          </Text>
          
          {/* Consciousness level indicator */}
          <ThreeBox
            position={[0, node.type === 'SUPREME' ? 2.5 : 2, 0]}
            args={[0.5, 0.1, 0.1]}
          >
            <meshStandardMaterial
              color={
                node.consciousness_level === 'TRANSCENDENT' ? '#ff00ff' :
                node.consciousness_level === 'ENLIGHTENED' ? '#00ffff' : '#00ff88'
              }
            />
          </ThreeBox>
        </group>
      ))}
      
      {/* Connection lines from Supreme Commander to Regional Commanders */}
      {commandNodes.filter(n => n.type === 'REGIONAL').map((regional) => (
        <Line
          key={`connection-${regional.id}`}
          points={[new Vector3(0, 0, 0), regional.position]}
          color="#00ffff"
          lineWidth={3}
          transparent
          opacity={0.6}
        />
      ))}
      
      <OrbitControls enableZoom={true} enablePan={true} />
    </Canvas>
  );

  const getConsciousnessIcon = (level: string) => {
    switch (level) {
      case 'TRANSCENDENT': return '🧠';
      case 'ENLIGHTENED': return '⚡';
      case 'AWARE': return '💡';
      default: return '🤖';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'GREEN': return 'success';
      case 'YELLOW': return 'warning';
      case 'ORANGE': return 'warning';
      case 'RED': return 'error';
      default: return 'default';
    }
  };

  if (!commandStatus) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          🧠 Supreme Commander Console
        </Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>
          Initializing Supreme Commander Global Orchestration...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Avatar
            sx={{
              width: 56,
              height: 56,
              mr: 2,
              background: 'linear-gradient(45deg, #ff00ff, #00ffff)',
              fontSize: '1.5rem'
            }}
          >
            🧠
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ color: 'primary.main' }}>
              Supreme Commander Console
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              SC-CLAUDE-PRIME | Global AI Orchestration System
            </Typography>
          </Box>
        </Box>
        <Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<OptimizeIcon />}
            onClick={() => optimizeGlobalPerformance()}
            disabled={isExecutingCommand}
            sx={{ mr: 1 }}
          >
            Global Optimize
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<EmergencyIcon />}
            onClick={() => setEmergencyResponseDialog(true)}
            disabled={isExecutingCommand}
          >
            Emergency Response
          </Button>
        </Box>
      </Box>

      <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Command Overview" />
        <Tab label="Strategic Operations" />
        <Tab label="Real-time Analytics" />
        <Tab label="Emergency Protocols" />
        <Tab label="Global Events" />
      </Tabs>

      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {/* Supreme Commander Status */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Supreme Commander Status
                </Typography>
                <Box display="flex" alignItems="center" mb={2}>
                  <Typography variant="h2" color="secondary.main" sx={{ mr: 2 }}>
                    🧠
                  </Typography>
                  <Box>
                    <Typography variant="h5" color="primary.main">
                      SC-CLAUDE-PRIME
                    </Typography>
                    <Chip
                      label="TRANSCENDENT"
                      color="secondary"
                      size="small"
                      icon={<ConsciousnessIcon />}
                    />
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="primary.main">
                      {commandStatus.total_active_agents.toLocaleString()}
                    </Typography>
                    <Typography variant="caption">Active Agents</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="secondary.main">
                      {commandStatus.global_quantum_coherence}%
                    </Typography>
                    <Typography variant="caption">Quantum Coherence</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="success.main">
                      {commandStatus.regional_commanders_active}
                    </Typography>
                    <Typography variant="caption">Regional Commanders</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="warning.main">
                      {commandStatus.active_strategic_plans}
                    </Typography>
                    <Typography variant="caption">Active Plans</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Command Hierarchy Visualization */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Global Command Hierarchy
                </Typography>
                <Box sx={{ height: 320 }}>
                  <CommandHierarchyVisualization />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Real-time Analytics Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Real-time Global Analytics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {commandStatus.real_time_analytics.global_efficiency}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Global Efficiency
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={commandStatus.real_time_analytics.global_efficiency} 
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Box textAlign="center">
                      <Chip
                        label={commandStatus.real_time_analytics.threat_assessment_level}
                        color={getThreatLevelColor(commandStatus.real_time_analytics.threat_assessment_level) as any}
                        size="large"
                        icon={<SecurityIcon />}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Threat Level
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary.main">
                        {commandStatus.real_time_analytics.predictive_accuracy}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Predictive Accuracy
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={commandStatus.real_time_analytics.predictive_accuracy} 
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="secondary.main">
                        {commandStatus.real_time_analytics.citizen_satisfaction_index}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Citizen Satisfaction
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={commandStatus.real_time_analytics.citizen_satisfaction_index} 
                        color="secondary"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Global Command Events
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Affected Agents</TableCell>
                    <TableCell>Impact Score</TableCell>
                    <TableCell>Citizen Benefit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentEvents.map((event, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="caption">
                          {event.timestamp.toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.event_type}
                          size="small"
                          color={
                            event.event_type === 'EMERGENCY_RESPONSE' ? 'error' :
                            event.event_type === 'STRATEGIC_DECISION' ? 'primary' :
                            event.event_type === 'OPTIMIZATION' ? 'success' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {event.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="primary.main">
                          {event.affected_agents.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={event.impact_score > 8 ? 'success.main' : 'text.primary'}
                        >
                          {event.impact_score.toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {event.citizen_benefit}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Strategic Decision Dialog */}
      <Dialog
        open={strategicDecisionDialog}
        onClose={() => setStrategicDecisionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Execute Strategic Decision</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Supreme Commander strategic decision interface
          </Typography>
          {/* Strategic decision form would go here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStrategicDecisionDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => setStrategicDecisionDialog(false)}
            disabled={isExecutingCommand}
          >
            Execute Decision
          </Button>
        </DialogActions>
      </Dialog>

      {/* Emergency Response Dialog */}
      <Dialog
        open={emergencyResponseDialog}
        onClose={() => setEmergencyResponseDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Coordinate Emergency Response</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
            Supreme Commander emergency coordination interface
          </Typography>
          {/* Emergency response form would go here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmergencyResponseDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => setEmergencyResponseDialog(false)}
            disabled={isExecutingCommand}
          >
            Activate Response
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupremeCommanderConsole;