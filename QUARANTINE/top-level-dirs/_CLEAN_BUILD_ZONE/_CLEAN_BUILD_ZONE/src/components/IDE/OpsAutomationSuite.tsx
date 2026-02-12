import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Toolbar,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Settings,
  Refresh,
  CloudDownload,
  Security,
  Monitor,
  Build,
  Storage,
  NetworkCheck,
  BugReport,
  Assessment,
  Speed,
  CloudSync,
  Shield,
  Analytics,
  AutoFixHigh,
  Memory,
  Timeline,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Info,
  ExpandMore,
  Terminal,
  Code,
  DataObject,
  Api,
  Psychology,
  Backup,
  Restore
} from '@mui/icons-material';

// Ops Tool Categories and Tools
interface OpsTool {
  id: string;
  name: string;
  description: string;
  category: OpsCategory;
  icon: React.ComponentType;
  status: 'available' | 'running' | 'completed' | 'error' | 'disabled';
  lastRun?: Date;
  duration?: number;
  command: string;
  parameters?: OpsParameter[];
  outputs?: string[];
  automationLevel: 'manual' | 'scheduled' | 'automated';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiredPermissions?: string[];
  dependencies?: string[];
}

interface OpsParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'file';
  required: boolean;
  description: string;
  defaultValue?: any;
  options?: string[];
}

type OpsCategory = 
  | 'core-infrastructure'
  | 'security-compliance'
  | 'monitoring-observability'
  | 'deployment-cicd'
  | 'data-management'
  | 'operations'
  | 'advanced-infrastructure'
  | 'next-gen-operations'
  | 'ultra-advanced';

interface OpsAutomationSuiteProps {
  onToolExecute?: (toolId: string, parameters?: Record<string, any>) => void;
  onToolSchedule?: (toolId: string, schedule: string) => void;
}

const opsTools: OpsTool[] = [
  // Core Infrastructure (Tools 1-5)
  {
    id: 'production-hardening',
    name: 'Production Hardening',
    description: 'Complete production environment hardening checklist and automation',
    category: 'core-infrastructure',
    icon: Shield,
    status: 'available',
    command: './scripts/production-hardening.sh',
    automationLevel: 'manual',
    riskLevel: 'high',
    requiredPermissions: ['infrastructure:write', 'security:admin']
  },
  {
    id: 'developer-onboarding',
    name: 'Developer Onboarding',
    description: 'Automated developer environment setup and onboarding process',
    category: 'core-infrastructure',
    icon: Code,
    status: 'available',
    command: './scripts/developer-onboarding.sh',
    automationLevel: 'automated',
    riskLevel: 'low',
    parameters: [
      { name: 'developer_name', type: 'string', required: true, description: 'New developer name' },
      { name: 'team', type: 'select', required: true, description: 'Team assignment', options: ['frontend', 'backend', 'devops', 'ai'] },
      { name: 'access_level', type: 'select', required: true, description: 'Access level', options: ['junior', 'senior', 'lead', 'admin'] }
    ]
  },
  {
    id: 'health-check',
    name: 'System Health Check',
    description: 'Comprehensive system health monitoring and diagnostics',
    category: 'core-infrastructure',
    icon: Monitor,
    status: 'available',
    command: './scripts/health-check.sh',
    automationLevel: 'automated',
    riskLevel: 'low',
    parameters: [
      { name: 'deep_scan', type: 'boolean', required: false, description: 'Perform deep system analysis' },
      { name: 'generate_report', type: 'boolean', required: false, description: 'Generate detailed report' }
    ]
  },
  {
    id: 'database-backup',
    name: 'Database Backup',
    description: 'Automated database backup with cloud upload and verification',
    category: 'core-infrastructure',
    icon: Backup,
    status: 'available',
    command: './scripts/db_backup.sh',
    automationLevel: 'scheduled',
    riskLevel: 'medium',
    parameters: [
      { name: 'upload_cloud', type: 'boolean', required: false, description: 'Upload to cloud storage', defaultValue: true },
      { name: 'compression', type: 'boolean', required: false, description: 'Enable compression', defaultValue: true },
      { name: 'test_restore', type: 'boolean', required: false, description: 'Test restore process', defaultValue: false }
    ]
  },
  {
    id: 'docker-setup',
    name: 'Docker Environment',
    description: 'Container orchestration setup and management',
    category: 'core-infrastructure',
    icon: CloudSync,
    status: 'available',
    command: 'docker-compose up -d',
    automationLevel: 'manual',
    riskLevel: 'medium'
  },

  // Security & Compliance (Tools 6-10)
  {
    id: 'security-scan',
    name: 'Security Vulnerability Scan',
    description: 'Comprehensive security scanning with OWASP compliance',
    category: 'security-compliance',
    icon: Security,
    status: 'available',
    command: './scripts/security-scan.sh',
    automationLevel: 'scheduled',
    riskLevel: 'high',
    parameters: [
      { name: 'scan_type', type: 'select', required: true, description: 'Scan type', options: ['quick', 'full', 'critical'] },
      { name: 'generate_report', type: 'boolean', required: false, description: 'Generate report', defaultValue: true },
      { name: 'services', type: 'select', required: false, description: 'Services to scan', options: ['all', 'backend', 'frontend', 'database'] }
    ]
  },
  {
    id: 'api-contract-validation',
    name: 'API Contract Validation',
    description: 'Automated API contract testing and validation',
    category: 'security-compliance',
    icon: Api,
    status: 'available',
    command: './scripts/api-contract-validation.sh',
    automationLevel: 'automated',
    riskLevel: 'medium'
  },
  {
    id: 'vulnerability-assessment',
    name: 'Vulnerability Assessment',
    description: 'Deep vulnerability analysis with remediation suggestions',
    category: 'security-compliance',
    icon: BugReport,
    status: 'available',
    command: './scripts/vulnerability-assessment.sh',
    automationLevel: 'scheduled',
    riskLevel: 'high'
  },
  {
    id: 'access-control-audit',
    name: 'Access Control Audit',
    description: 'Comprehensive access control and permissions audit',
    category: 'security-compliance',
    icon: Shield,
    status: 'available',
    command: './scripts/access-control-audit.sh',
    automationLevel: 'manual',
    riskLevel: 'critical',
    requiredPermissions: ['security:admin', 'audit:read']
  },

  // Monitoring & Observability (Tools 11-15)
  {
    id: 'prometheus-setup',
    name: 'Prometheus Monitoring',
    description: 'Prometheus metrics collection and alerting setup',
    category: 'monitoring-observability',
    icon: Assessment,
    status: 'available',
    command: './scripts/prometheus-setup.sh',
    automationLevel: 'automated',
    riskLevel: 'medium'
  },
  {
    id: 'grafana-dashboards',
    name: 'Grafana Dashboards',
    description: 'Pre-configured Grafana dashboards for system monitoring',
    category: 'monitoring-observability',
    icon: Timeline,
    status: 'available',
    command: './scripts/grafana-setup.sh',
    automationLevel: 'automated',
    riskLevel: 'low'
  },
  {
    id: 'log-analyzer',
    name: 'Log Analysis',
    description: 'Intelligent log analysis with pattern detection',
    category: 'monitoring-observability',
    icon: Analytics,
    status: 'available',
    command: './scripts/log-analyzer.sh',
    automationLevel: 'automated',
    riskLevel: 'low',
    parameters: [
      { name: 'time_range', type: 'select', required: true, description: 'Time range', options: ['1h', '24h', '7d', '30d'] },
      { name: 'pattern', type: 'string', required: false, description: 'Search pattern' },
      { name: 'service', type: 'select', required: false, description: 'Service filter', options: ['all', 'backend', 'frontend', 'database'] }
    ]
  },
  {
    id: 'performance-test',
    name: 'Performance Testing',
    description: 'Load testing and performance benchmarking suite',
    category: 'monitoring-observability',
    icon: Speed,
    status: 'available',
    command: './scripts/performance-test.sh',
    automationLevel: 'manual',
    riskLevel: 'medium',
    parameters: [
      { name: 'test_type', type: 'select', required: true, description: 'Test type', options: ['load', 'stress', 'spike', 'volume'] },
      { name: 'users', type: 'number', required: true, description: 'Concurrent users', defaultValue: 100 },
      { name: 'duration', type: 'number', required: true, description: 'Test duration (seconds)', defaultValue: 300 }
    ]
  },

  // Advanced Infrastructure (Tools 16-25)
  {
    id: 'ai-capacity-planning',
    name: 'AI Capacity Planning',
    description: 'AI-powered capacity planning and auto-scaling optimization',
    category: 'advanced-infrastructure',
    icon: Psychology,
    status: 'available',
    command: './scripts/advanced/capacity-planning.sh',
    automationLevel: 'automated',
    riskLevel: 'medium'
  },
  {
    id: 'sla-monitoring',
    name: 'SLA Monitoring',
    description: 'Advanced SLA monitoring with compliance automation',
    category: 'advanced-infrastructure',
    icon: Assessment,
    status: 'available',
    command: './scripts/advanced/sla-monitoring.sh',
    automationLevel: 'automated',
    riskLevel: 'low'
  },
  {
    id: 'incident-management',
    name: 'Intelligent Incident Management',
    description: 'AI-powered incident detection and automated response',
    category: 'advanced-infrastructure',
    icon: AutoFixHigh,
    status: 'available',
    command: './scripts/advanced/incident-management.sh',
    automationLevel: 'automated',
    riskLevel: 'high'
  },
  {
    id: 'threat-detection',
    name: 'Advanced Threat Detection',
    description: 'ML-based threat detection and log aggregation',
    category: 'advanced-infrastructure',
    icon: Shield,
    status: 'available',
    command: './scripts/advanced/threat-detection.sh',
    automationLevel: 'automated',
    riskLevel: 'high'
  },
  {
    id: 'infrastructure-as-code',
    name: 'Infrastructure as Code',
    description: 'Terraform and CloudFormation template management',
    category: 'advanced-infrastructure',
    icon: Build,
    status: 'available',
    command: './scripts/advanced/infrastructure-as-code.sh',
    automationLevel: 'manual',
    riskLevel: 'critical'
  },

  // Ultra-Advanced Capabilities (Tools 41-45)
  {
    id: 'ai-root-cause-analysis',
    name: 'AI Root Cause Analysis',
    description: 'AI-powered root cause analysis with knowledge graphs',
    category: 'ultra-advanced',
    icon: Psychology,
    status: 'available',
    command: './scripts/advanced/ai-root-cause-analysis.sh',
    automationLevel: 'automated',
    riskLevel: 'low'
  },
  {
    id: 'predictive-failure-detection',
    name: 'Predictive Failure Detection',
    description: 'ML-based predictive failure detection and prevention',
    category: 'ultra-advanced',
    icon: TrendingUp,
    status: 'available',
    command: './scripts/advanced/predictive-failure-detection.sh',
    automationLevel: 'automated',
    riskLevel: 'medium'
  },
  {
    id: 'multi-cloud-orchestration',
    name: 'Multi-Cloud Orchestration',
    description: 'Advanced multi-cloud deployment and migration tools',
    category: 'ultra-advanced',
    icon: CloudSync,
    status: 'available',
    command: './scripts/advanced/multi-cloud-orchestration.sh',
    automationLevel: 'manual',
    riskLevel: 'critical'
  },
  {
    id: 'edge-computing-management',
    name: 'Edge Computing Management',
    description: 'Distributed edge computing deployment and optimization',
    category: 'ultra-advanced',
    icon: NetworkCheck,
    status: 'available',
    command: './scripts/advanced/edge-computing-management.sh',
    automationLevel: 'automated',
    riskLevel: 'high'
  },
  {
    id: 'blockchain-audit-trail',
    name: 'Blockchain Audit Trail',
    description: 'Immutable blockchain-based audit logging system',
    category: 'ultra-advanced',
    icon: DataObject,
    status: 'available',
    command: './scripts/advanced/blockchain-audit-trail.sh',
    automationLevel: 'automated',
    riskLevel: 'medium'
  }
];

const categoryConfig = {
  'core-infrastructure': { 
    name: 'Core Infrastructure', 
    color: '#2196F3', 
    icon: Build,
    description: 'Essential infrastructure operations and setup'
  },
  'security-compliance': { 
    name: 'Security & Compliance', 
    color: '#F44336', 
    icon: Security,
    description: 'Security scanning and compliance validation'
  },
  'monitoring-observability': { 
    name: 'Monitoring & Observability', 
    color: '#4CAF50', 
    icon: Monitor,
    description: 'System monitoring and performance analysis'
  },
  'deployment-cicd': { 
    name: 'Deployment & CI/CD', 
    color: '#FF9800', 
    icon: CloudDownload,
    description: 'Automated deployment and continuous integration'
  },
  'data-management': { 
    name: 'Data Management', 
    color: '#9C27B0', 
    icon: Storage,
    description: 'Database operations and data migration'
  },
  'operations': { 
    name: 'Operations', 
    color: '#607D8B', 
    icon: Settings,
    description: 'Operational procedures and maintenance'
  },
  'advanced-infrastructure': { 
    name: 'Advanced Infrastructure', 
    color: '#3F51B5', 
    icon: AutoFixHigh,
    description: 'Next-generation infrastructure automation'
  },
  'next-gen-operations': { 
    name: 'Next-Gen Operations', 
    color: '#00BCD4', 
    icon: Timeline,
    description: 'Machine learning powered operations'
  },
  'ultra-advanced': { 
    name: 'Ultra-Advanced', 
    color: '#8BC34A', 
    icon: Psychology,
    description: 'AI-powered and blockchain-enabled tools'
  }
};

export const OpsAutomationSuite: React.FC<OpsAutomationSuiteProps> = ({
  onToolExecute,
  onToolSchedule
}) => {
  const [selectedCategory, setSelectedCategory] = useState<OpsCategory>('core-infrastructure');
  const [selectedTool, setSelectedTool] = useState<OpsTool | null>(null);
  const [executionDialog, setExecutionDialog] = useState(false);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [runningTools, setRunningTools] = useState<Set<string>>(new Set());
  const [toolResults, setToolResults] = useState<Record<string, any>>({});
  const [automationEnabled, setAutomationEnabled] = useState<Record<string, boolean>>({});

  // Load automation settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('terrafusion-ops-automation');
    if (savedSettings) {
      setAutomationEnabled(JSON.parse(savedSettings));
    }
  }, []);

  // Save automation settings
  const saveAutomationSettings = useCallback((settings: Record<string, boolean>) => {
    localStorage.setItem('terrafusion-ops-automation', JSON.stringify(settings));
    setAutomationEnabled(settings);
  }, []);

  const handleToolExecution = useCallback(async (tool: OpsTool, params: Record<string, any> = {}) => {
    setRunningTools(prev => new Set(prev).add(tool.id));
    
    try {
      const response = await fetch('/api/ops/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('terrafusion-token')}`
        },
        body: JSON.stringify({
          toolId: tool.id,
          command: tool.command,
          parameters: params,
          riskLevel: tool.riskLevel,
          requiredPermissions: tool.requiredPermissions
        })
      });

      const result = await response.json();
      
      setToolResults(prev => ({
        ...prev,
        [tool.id]: {
          ...result,
          timestamp: new Date(),
          duration: result.executionTime || 0
        }
      }));

      onToolExecute?.(tool.id, params);
      
    } catch (error: unknown) {
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = (error as Error).message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = 'Execution failed';
      }
      
      setToolResults(prev => ({
        ...prev,
        [tool.id]: {
          success: false,
          error: errorMessage,
          timestamp: new Date()
        }
      }));
    } finally {
      setRunningTools(prev => {
        const newSet = new Set(prev);
        newSet.delete(tool.id);
        return newSet;
      });
      setExecutionDialog(false);
    }
  }, [onToolExecute]);

  const handleToolSchedule = useCallback((tool: OpsTool, schedule: string) => {
    // Schedule tool for automated execution
    onToolSchedule?.(tool.id, schedule);
  }, [onToolSchedule]);

  const getToolStatus = (tool: OpsTool) => {
    if (runningTools.has(tool.id)) return 'running';
    const result = toolResults[tool.id];
    if (result) {
      return result.success ? 'completed' : 'error';
    }
    return tool.status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'warning';
      case 'completed': return 'success';
      case 'error': return 'error';
      case 'disabled': return 'default';
      default: return 'primary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <LinearProgress />;
      case 'completed': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      case 'disabled': return <Stop color="disabled" />;
      default: return <PlayArrow color="primary" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#FF5722';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const filteredTools = opsTools.filter(tool => tool.category === selectedCategory);
  const categoryStats = Object.keys(categoryConfig).map(cat => ({
    category: cat as OpsCategory,
    count: opsTools.filter(tool => tool.category === cat).length,
    running: opsTools.filter(tool => tool.category === cat && runningTools.has(tool.id)).length,
    automated: opsTools.filter(tool => tool.category === cat && automationEnabled[tool.id]).length
  }));

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          TerraFusion Ops Automation Suite - 45 Tools
        </Typography>
        
        <Badge badgeContent={runningTools.size} color="warning" sx={{ mr: 2 }}>
          <Chip 
            icon={<Terminal />}
            label={`${runningTools.size} Running`}
            color="warning"
            variant={runningTools.size > 0 ? "filled" : "outlined"}
          />
        </Badge>
        
        <IconButton color="primary">
          <Refresh />
        </IconButton>
      </Toolbar>

      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Category Sidebar */}
        <Paper sx={{ width: 300, borderRight: 1, borderColor: 'divider' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tool Categories
            </Typography>
            
            <List>
              {categoryStats.map(({ category, count, running, automated }) => {
                const config = categoryConfig[category];
                const IconComponent = config.icon;
                
                return (
                  <ListItem
                    key={category}
                    button
                    selected={selectedCategory === category}
                    onClick={() => setSelectedCategory(category)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: `${config.color}20`,
                        borderLeft: `4px solid ${config.color}`
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Badge badgeContent={running} color="warning">
                        <IconComponent sx={{ color: config.color }} />
                      </Badge>
                    </ListItemIcon>
                    <ListItemText
                      primary={config.name}
                      secondary={`${count} tools | ${automated} automated`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Paper>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
          {/* Category Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              {categoryConfig[selectedCategory].name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {categoryConfig[selectedCategory].description}
            </Typography>
          </Box>

          {/* Tools Grid */}
          <Grid container spacing={3}>
            {filteredTools.map((tool) => {
              const IconComponent = tool.icon;
              const status = getToolStatus(tool);
              const result = toolResults[tool.id];

              return (
                <Grid item xs={12} md={6} lg={4} key={tool.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      {/* Tool Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box 
                          sx={{ 
                            mr: 1, 
                            color: categoryConfig[tool.category].color,
                            fontSize: 24,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <IconComponent />
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                            {tool.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={status.toUpperCase()}
                              color={getStatusColor(status)}
                              sx={{ fontSize: '10px' }}
                            />
                            <Chip
                              size="small"
                              label={tool.riskLevel.toUpperCase()}
                              sx={{ 
                                fontSize: '10px',
                                backgroundColor: getRiskColor(tool.riskLevel),
                                color: 'white'
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      {/* Tool Description */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {tool.description}
                      </Typography>

                      {/* Automation Toggle */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Automation: {tool.automationLevel}
                        </Typography>
                        <Switch
                          size="small"
                          checked={automationEnabled[tool.id] || false}
                          onChange={(e) => saveAutomationSettings({
                            ...automationEnabled,
                            [tool.id]: e.target.checked
                          })}
                          disabled={tool.automationLevel === 'manual'}
                        />
                      </Box>

                      {/* Last Run Info */}
                      {result && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="caption" display="block">
                            Last run: {result.timestamp?.toLocaleString()}
                          </Typography>
                          {result.duration && (
                            <Typography variant="caption" display="block">
                              Duration: {result.duration}ms
                            </Typography>
                          )}
                          {result.error && (
                            <Typography variant="caption" color="error" display="block">
                              Error: {result.error}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </CardContent>

                    <CardActions>
                      <Button
                        size="small"
                        startIcon={runningTools.has(tool.id) ? <Stop /> : <PlayArrow />}
                        onClick={() => {
                          if (runningTools.has(tool.id)) {
                            // Stop execution logic
                            setRunningTools(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(tool.id);
                              return newSet;
                            });
                          } else {
                            setSelectedTool(tool);
                            setParameters({});
                            setExecutionDialog(true);
                          }
                        }}
                        disabled={status === 'disabled'}
                        color={runningTools.has(tool.id) ? 'error' : 'primary'}
                      >
                        {runningTools.has(tool.id) ? 'Stop' : 'Execute'}
                      </Button>
                      
                      <Button
                        size="small"
                        startIcon={<Settings />}
                        onClick={() => {
                          setSelectedTool(tool);
                          setExecutionDialog(true);
                        }}
                      >
                        Configure
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Box>

      {/* Execution Dialog */}
      <Dialog
        open={executionDialog}
        onClose={() => setExecutionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Execute: {selectedTool?.name}
        </DialogTitle>
        <DialogContent>
          {selectedTool && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedTool.description}
              </Typography>

              {/* Risk Warning */}
              {selectedTool.riskLevel === 'high' || selectedTool.riskLevel === 'critical' && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This is a {selectedTool.riskLevel} risk operation. Please review carefully before proceeding.
                </Alert>
              )}

              {/* Parameters */}
              {selectedTool.parameters && selectedTool.parameters.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Configuration Parameters
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedTool.parameters.map((param) => (
                      <Grid item xs={12} sm={6} key={param.name}>
                        {param.type === 'select' ? (
                          <FormControl fullWidth size="small">
                            <InputLabel>{param.name}</InputLabel>
                            <Select
                              value={parameters[param.name] || param.defaultValue || ''}
                              label={param.name}
                              onChange={(e) => setParameters(prev => ({
                                ...prev,
                                [param.name]: e.target.value
                              }))}
                            >
                              {param.options?.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : param.type === 'boolean' ? (
                          <Box>
                            <Typography variant="caption">{param.name}</Typography>
                            <Switch
                              checked={parameters[param.name] ?? param.defaultValue ?? false}
                              onChange={(e) => setParameters(prev => ({
                                ...prev,
                                [param.name]: e.target.checked
                              }))}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {param.description}
                            </Typography>
                          </Box>
                        ) : (
                          <TextField
                            fullWidth
                            size="small"
                            label={param.name}
                            helperText={param.description}
                            value={parameters[param.name] || param.defaultValue || ''}
                            onChange={(e) => setParameters(prev => ({
                              ...prev,
                              [param.name]: param.type === 'number' ? Number(e.target.value) : e.target.value
                            }))}
                            type={param.type === 'number' ? 'number' : 'text'}
                            required={param.required}
                          />
                        )}
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Command Preview */}
              <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Command to execute:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 1 }}>
                  {selectedTool.command}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExecutionDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedTool && handleToolExecution(selectedTool, parameters)}
            variant="contained"
            color="primary"
          >
            Execute Tool
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OpsAutomationSuite;