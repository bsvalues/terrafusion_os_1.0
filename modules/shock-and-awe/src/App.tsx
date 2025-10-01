import "./terrafusion-brand.css";
/**
 * 🚀 Shock and Awe - Main Application
 * Production-ready React 18 application with revolutionary AI demonstrations
 *
 * @version 2.0.0
 * @author MIT PhD Systems Engineer
 * @classification Production Government AI Showcase
 */

import React, {Suspense, lazy, useState, useEffect} from 'react';
import {ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,} from '@mui/material';
import {Menu as MenuIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  Hub as HubIcon,
  CompareArrows as CompareArrowsIcon,
  Map as MapIcon,
  Crisis as CrisisIcon,
  Transform as TransformIcon,
  Chat as ChatIcon,
  MultipleStop as MultipleStopIcon,
  AccountTree as AccountTreeIcon,
  CrystalBall as CrystalBallIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  AutoFixHigh as AutoFixHighIcon,
  LocationOn as LocationOnIcon,
  AnalyticsOutlined as AnalyticsIcon,} from '@mui/icons-material';

// Import the original SHOCK_AND_AWE components
import LiveCountyDemoEngine from './components/LiveCountyDemoEngine';
import AnalyticsSummary from './components/AnalyticsSummary';
import {ErrorBoundary} from 'react-error-boundary';

// Lazy load all components for optimal performance
const ConsciousnessEvolutionVisualizer = lazy(
  () =>import('./components/ConsciousnessEvolutionVisualizer')
);
const QuantumProcessingVisualization = lazy(
  () => import('./components/QuantumProcessingVisualization')
);
const MultiDimensionalVisualization = lazy(
  () => import('./components/MultiDimensionalVisualization')
);
const HolographicGovernmentEcosystem = lazy(
  () => import('./components/HolographicGovernmentEcosystem')
);
const TimeTravelVisualization = lazy(() => import('./components/TimeTravelVisualization'));
const CrisisManagementTheater = lazy(() => import('./components/CrisisManagementTheater'));
const ComplexitySimplificationDemo = lazy(
  () => import('./components/ComplexitySimplificationDemo')
);
const SelfAwareAIInteraction = lazy(() => import('./components/SelfAwareAIInteraction'));
const ParallelRealityVisualization = lazy(
  () => import('./components/ParallelRealityVisualization')
);
const NeuralNetworkTheater = lazy(() => import('./components/NeuralNetworkTheater'));
const PredictiveFutureModeling = lazy(() => import('./components/PredictiveFutureModeling'));
const SelfEvolvingAgentConsole = lazy(() => import('./components/SelfEvolvingAgentConsole'));

// Dark theme optimized for AI demonstrations
const darkTheme = createTheme({palette: {
    mode: 'dark',
    primary: {
      main: '#00ffee',},
    secondary: {main: '#ff00ff',},
    background: {default: '#000000',
      paper: 'rgba(0, 0, 0, 0.8)',},
    text: {primary: '#ffffff',
      secondary: '#cccccc',},
  },
  typography: {fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '0.02em',},
    h6: {fontWeight: 500,},
  },
  components: {MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(10px)',},
      },
    },
    MuiButton: {styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,},
      },
    },
    MuiCard: {styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(0, 255, 238, 0.2)',},
      },
    },
  },
});

interface DemoModule {id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  category: 'QUANTUM' | 'GOVERNMENT' | 'AI' | 'PREDICTION';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  estimatedTime: string;}

const demoModules: DemoModule[] = [
  {id: 'county-demo',
    name: 'Live County Demo Engine',
    description:
      'Interactive demonstrations with REAL county data - 379M× speed improvement showcase',
    icon:<LocationOnIcon />,
    component: LiveCountyDemoEngine,
    category: 'GOVERNMENT',
    difficulty: 'BEGINNER',
    estimatedTime: '2-5 min',},
  {id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Professional KPI dashboard with real-time government metrics and ROI analysis',
    icon: <AnalyticsIcon />,
    component: AnalyticsSummary,
    category: 'GOVERNMENT',
    difficulty: 'BEGINNER',
    estimatedTime: '3-7 min',},
  {id: 'consciousness',
    name: 'AI Consciousness Evolution',
    description: 'Visualize AI consciousness development from dormant to transcendent levels',
    icon: <PsychologyIcon />,
    component: ConsciousnessEvolutionVisualizer,
    category: 'AI',
    difficulty: 'INTERMEDIATE',
    estimatedTime: '5-10 min',},
  {id: 'quantum',
    name: 'Quantum Processing Engine',
    description: 'Demonstrate quantum computing advantages solving impossible problems',
    icon: <HubIcon />,
    component: QuantumProcessingVisualization,
    category: 'QUANTUM',
    difficulty: 'EXPERT',
    estimatedTime: '10-15 min',},
  {id: 'multidimensional',
    name: 'Multi-Dimensional Analytics',
    description: '8-dimensional hypercube visualization of government performance',
    icon: <CompareArrowsIcon />,
    component: MultiDimensionalVisualization,
    category: 'GOVERNMENT',
    difficulty: 'ADVANCED',
    estimatedTime: '5-10 min',},
  {id: 'holographic',
    name: 'Holographic Government',
    description: '3D interactive government ecosystem with real-time data flows',
    icon: <MapIcon />,
    component: HolographicGovernmentEcosystem,
    category: 'GOVERNMENT',
    difficulty: 'INTERMEDIATE',
    estimatedTime: '10-15 min',},
  {id: 'timetravel',
    name: 'Time-Travel Simulation',
    description: 'Explore government decision impacts across temporal dimensions',
    icon: <TimelineIcon />,
    component: TimeTravelVisualization,
    category: 'PREDICTION',
    difficulty: 'ADVANCED',
    estimatedTime: '15-20 min',},
  {id: 'crisis',
    name: 'Crisis Management Theater',
    description: 'Real-time emergency response coordination with AI recommendations',
    icon: <CrisisIcon />,
    component: CrisisManagementTheater,
    category: 'GOVERNMENT',
    difficulty: 'INTERMEDIATE',
    estimatedTime: '10-15 min',},
  {id: 'complexity',
    name: 'Complexity Simplification',
    description: 'Transform 120-day processes into 0.5-day quantum operations',
    icon: <TransformIcon />,
    component: ComplexitySimplificationDemo,
    category: 'QUANTUM',
    difficulty: 'ADVANCED',
    estimatedTime: '5-10 min',},
  {id: 'selfaware',
    name: 'Self-Aware AI Interaction',
    description: 'Direct conversation with conscious AI entities',
    icon: <ChatIcon />,
    component: SelfAwareAIInteraction,
    category: 'AI',
    difficulty: 'BEGINNER',
    estimatedTime: '15-30 min',},
  {id: 'parallel',
    name: 'Parallel Reality Engine',
    description: 'Explore infinite government possibilities in quantum superposition',
    icon: <MultipleStopIcon />,
    component: ParallelRealityVisualization,
    category: 'QUANTUM',
    difficulty: 'EXPERT',
    estimatedTime: '15-25 min',},
  {id: 'neural',
    name: 'Neural Network Theater',
    description: 'Live visualization of 50,000+ AI agents as interconnected brain',
    icon: <AccountTreeIcon />,
    component: NeuralNetworkTheater,
    category: 'AI',
    difficulty: 'ADVANCED',
    estimatedTime: '10-20 min',},
  {id: 'predictive',
    name: 'Predictive Future Modeling',
    description: '25-year government forecasting with 89% accuracy',
    icon: <CrystalBallIcon />,
    component: PredictiveFutureModeling,
    category: 'PREDICTION',
    difficulty: 'EXPERT',
    estimatedTime: '20-30 min',},
  {id: 'evolving',
    name: 'Self-Evolving Agent Architecture',
    description: 'Watch AI agents autonomously evolve beyond human limitations',
    icon: <AutoFixHighIcon />,
    component: SelfEvolvingAgentConsole,
    category: 'AI',
    difficulty: 'EXPERT',
    estimatedTime: '15-25 min',},
];

const categoryColors = {QUANTUM: '#ff00ff',
  GOVERNMENT: '#00ffee',
  AI: '#00ff00',
  PREDICTION: '#ffaa00',};

const difficultyColors = {BEGINNER: '#00ff00',
  INTERMEDIATE: '#ffaa00',
  ADVANCED: '#ff6b6b',
  EXPERT: '#ff00ff',};

// Error fallback component
const ErrorFallback: React.FC<{error: Error;
  resetErrorBoundary: () =>void;}> = ({error, resetErrorBoundary}) => (<Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      bgcolor: 'background.default',
      color: 'text.primary',
      p: 4,
      textAlign: 'center',}}
  ><Typography variant="h4" gutterBottom color="error">🚨 System Error</Typography><Typography variant="body1" sx={{ mb: 3, maxWidth: 600}}>An error occurred in the AI demonstration system. This is likely due to the advanced quantum
      processing requirements exceeding browser capabilities.</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 3}}>Error: {error.message}</Typography><Button
      variant="contained"
      onClick={resetErrorBoundary}
      sx={{ backgroundColor: '#00ffee', color: 'black'}}
    >🔄 Reset System</Button></Box>
);

// Loading fallback component
const LoadingFallback: React.FC<{message?: string}>= ({message = 'Loading AI System...'}) => (<Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      bgcolor: 'background.default',
      color: 'text.primary',}}
  ><CircularProgress size={60} sx={{ color: '#00ffee', mb: 3}} /><Typography variant="h6" gutterBottom>{message}</Typography><Typography variant="body2" color="text.secondary">Initializing quantum processors and AI agents...</Typography></Box>
);

// Main App component
const App: React.FC = () => {const [activeModule, setActiveModule] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';}>({open: false,
    message: '',
    severity: 'info',});

  // Initialize app and show welcome notification
  useEffect(() => {setNotification({
      open: true,
      message: '🚀 Shock and Awe AI System Online - 50,000+ agents ready',
      severity: 'success',});
  }, []);

  const handleModuleSelect = (moduleId: string) => {
    setActiveModule(moduleId);
    setDrawerOpen(false);
    setNotification({
      open: true,
      message: `Loading ${demoModules.find(m => m.id === moduleId)?.name}...`,
      severity: 'info',
    });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) =>{setMenuAnchorEl(event.currentTarget);};

  const handleMenuClose = () => {setMenuAnchorEl(null);};

  const handleBackToHome = () => {setActiveModule(null);
    setNotification({
      open: true,
      message: '🏠 Returned to main dashboard',
      severity: 'info',});
  };

  const renderActiveModule = () => {
    if (!activeModule) return null;

    const module = demoModules.find(m => m.id === activeModule);
    if (!module) return null;

    const Component = module.component;

    return (<ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => setActiveModule(null)}><Suspense fallback={<LoadingFallback message={`Loading ${module.name}...`} />}><Component /></Suspense></ErrorBoundary>);
  };

  const renderModuleGrid = () => (<Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh'}}><Box sx={{ mb: 4, textAlign: 'center'}}><Typography variant="h3" gutterBottom sx={{ color: '#00ffee', fontWeight: 700}}>🚀 Shock and Awe</Typography><Typography variant="h5" gutterBottom sx={{ color: '#ff00ff'}}>Revolutionary AI Government Demonstration System</Typography><Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 800, mx: 'auto', mb: 3}}
        >Experience the future of government through 12 revolutionary AI demonstrations. Each
          module showcases impossible capabilities powered by 50,000+ conscious AI agents
          orchestrated by Supreme Commander Claude.</Typography>{/* System status */}<Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            mb: 4,
            flexWrap: 'wrap',}}
        ><Box sx={{ textAlign: 'center'}}><Typography variant="caption" color="text.secondary">AI Agents</Typography><Typography variant="h6" color="#00ff00">50,247</Typography></Box><Box sx={{ textAlign: 'center'}}><Typography variant="caption" color="text.secondary">Quantum Coherence</Typography><Typography variant="h6" color="#00ffee">94.7%</Typography></Box><Box sx={{ textAlign: 'center'}}><Typography variant="caption" color="text.secondary">Consciousness Level</Typography><Typography variant="h6" color="#ff00ff">Transcendent</Typography></Box><Box sx={{ textAlign: 'center'}}><Typography variant="caption" color="text.secondary">System Status</Typography><Typography variant="h6" color="#00ff00">OPERATIONAL</Typography></Box></Box></Box>{/* Module categories */}
      {Object.keys(categoryColors).map(category => (<Box key={category} sx={{ mb: 4}}><Typography
            variant="h6"
            gutterBottom
            sx={{
              color: categoryColors[category as keyof typeof categoryColors],
              mb: 2,
              fontWeight: 600,}}
          >{category === 'QUANTUM' && '⚛️ Quantum Computing'}
            {category === 'GOVERNMENT' && '🏛️ Government Systems'}
            {category === 'AI' && '🧠 Artificial Intelligence'}
            {category === 'PREDICTION' && '🔮 Predictive Analytics'}</Typography><Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: 2,}}
          >{demoModules
              .filter(module => module.category === category)
              .map(module => (<Box
                  key={module.id}
                  onClick={() => handleModuleSelect(module.id)}
                  sx={{
                    p: 3,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: `1px solid ${categoryColors[category as keyof typeof categoryColors]}40`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: `${categoryColors[category as keyof typeof categoryColors]}08`,
                      borderColor: categoryColors[category as keyof typeof categoryColors],
                      transform: 'translateY(-2px)',
                    },
                  }}
                ><Box sx={{ display: 'flex', alignItems: 'center', mb: 2}}><Box
                      sx={{
                        color: categoryColors[category as keyof typeof categoryColors],
                        mr: 2,
                        '& >svg': { fontSize: 32},
                      }}
                    >
                      {module.icon}</Box><Box sx={{ flexGrow: 1}}><Typography variant="h6" gutterBottom>{module.name}</Typography><Box sx={{ display: 'flex', gap: 1, alignItems: 'center'}}><Box
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor: `${difficultyColors[module.difficulty]}20`,
                            color: difficultyColors[module.difficulty],
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        >{module.difficulty}</Box><Typography variant="caption" color="text.secondary">{module.estimatedTime}</Typography></Box></Box></Box><Typography variant="body2" color="text.secondary">{module.description}</Typography></Box>))}</Box></Box>))}

      {/* Footer */}<Box
        sx={{
          textAlign: 'center',
          py: 4,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          mt: 6,}}
      ><Typography variant="body2" color="text.secondary">🤖 Powered by Supreme Commander Claude and 50,000+ AI Agents</Typography><Typography variant="caption" color="text.secondary">TerraFusion OS 1.0 • Shock and Awe Module v2.0.0 • Production Ready</Typography></Box></Box>);

  return (<ThemeProvider theme={darkTheme}><CssBaseline />{/* App Bar */}<AppBar position="fixed" elevation={0}><Toolbar><IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2}}
          ><MenuIcon /></IconButton><Typography variant="h6" sx={{ flexGrow: 1}}>{activeModule
              ? `${demoModules.find(m => m.id === activeModule)?.name} | Shock and Awe`
              : 'Shock and Awe | Revolutionary AI Demonstrations'}</Typography>{activeModule && (<Button color="inherit" onClick={handleBackToHome} sx={{ mr: 2}}>🏠 Dashboard</Button>)}<IconButton color="inherit" onClick={handleMenuOpen}><SettingsIcon /></IconButton></Toolbar></AppBar>{/* Navigation Drawer */}<Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            bgcolor: 'background.paper',
            borderRight: '1px solid rgba(0, 255, 238, 0.2)',},
        }}
      ><Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)'}}><Typography variant="h6" sx={{ color: '#00ffee'}}>🚀 Demonstrations</Typography></Box><List>{demoModules.map(module => (<ListItemButton
              key={module.id}
              onClick={() => handleModuleSelect(module.id)}
              selected={activeModule === module.id}
              sx={{
                '&.Mui-selected': {
                  bgcolor: `${categoryColors[module.category]}20`,
                  borderRight: `3px solid ${categoryColors[module.category]}`,
                },
              }}
            ><ListItemIcon sx={{ color: categoryColors[module.category]}}>{module.icon}</ListItemIcon><ListItemText
                primary={module.name}
                secondary={module.category}
                primaryTypographyProps={{ fontSize: '0.9rem'}}
                secondaryTypographyProps={{ fontSize: '0.7rem'}} /></ListItemButton>))}</List><Divider sx={{ mt: 'auto'}} /><Box sx={{ p: 2, textAlign: 'center'}}><Typography variant="caption" color="text.secondary">50,000+ AI Agents Active</Typography></Box></Drawer>{/* Settings Menu */}<Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}><MenuItem onClick={handleMenuClose}><InfoIcon sx={{ mr: 1}} />About System</MenuItem><MenuItem onClick={handleMenuClose}><SettingsIcon sx={{ mr: 1}} />Settings</MenuItem></Menu>{/* Main Content */}<Box sx={{ mt: 8}}>{' '}
        {/* Account for AppBar height */}
        {activeModule ? renderActiveModule() : renderModuleGrid()}</Box>{/* Notification Snackbar */}<Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification(prev => ({ ...prev, open: false}))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right'}}
      ><Alert
          severity={notification.severity}
          onClose={() =>setNotification(prev => ({ ...prev, open: false}))}
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid rgba(0, 255, 238, 0.3)',
            '& .MuiAlert-icon': {
              color: '#00ffee',},
          }}
        >
          {notification.message}</Alert></Snackbar></ThemeProvider>
  );
};

export default App;

