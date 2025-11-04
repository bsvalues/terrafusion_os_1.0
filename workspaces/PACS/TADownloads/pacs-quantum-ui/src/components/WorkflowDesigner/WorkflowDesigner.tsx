/**
 * Workflow Designer Component
 * Elite Power User - Visual Workflow Creation & Management
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  AccountTree as WorkflowIcon,
  Api as ApiIcon,
  DataObject as DataIcon,
  Settings as ConditionIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';

interface WorkflowActivity {
  id: string;
  type: 'action' | 'condition' | 'loop' | 'parallel' | 'error-handler';
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
}

interface WorkflowNode {
  id: string;
  type: string;
  activityId: string;
  position: { x: number; y: number };
  config: Record<string, any>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export const WorkflowDesigner: React.FC = () => {
  const theme = useTheme();
  const [selectedActivity, setSelectedActivity] = useState<WorkflowActivity | null>(null);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([]);
  const [workflowEdges] = useState<WorkflowEdge[]>([]);
  const [testResults, setTestResults] = useState<any>(null);

  const availableActivities: WorkflowActivity[] = [
    {
      id: 'get-accounts',
      type: 'action',
      name: 'Get Accounts',
      description: 'Retrieve accounts using search criteria',
      category: 'PACS Actions',
      icon: <ApiIcon />,
    },
    {
      id: 'get-properties',
      type: 'action',
      name: 'Get Properties',
      description: 'Retrieve properties by account or criteria',
      category: 'PACS Actions',
      icon: <ApiIcon />,
    },
    {
      id: 'execute-payment-import',
      type: 'action',
      name: 'Execute Payment Import',
      description: 'Run payment import process',
      category: 'PACS Actions',
      icon: <ApiIcon />,
    },
    {
      id: 'export-to-excel',
      type: 'action',
      name: 'Export to Excel',
      description: 'Export query results to Excel',
      category: 'Data Actions',
      icon: <DataIcon />,
    },
    {
      id: 'conditional',
      type: 'condition',
      name: 'If/Then/Else',
      description: 'Conditional logic branch',
      category: 'Control Flow',
      icon: <ConditionIcon />,
    },
    {
      id: 'loop',
      type: 'loop',
      name: 'For Each',
      description: 'Loop through collection',
      category: 'Control Flow',
      icon: <WorkflowIcon />,
    },
    {
      id: 'parallel',
      type: 'parallel',
      name: 'Parallel Execution',
      description: 'Execute multiple paths simultaneously',
      category: 'Control Flow',
      icon: <WorkflowIcon />,
    },
    {
      id: 'try-catch',
      type: 'error-handler',
      name: 'Try/Catch',
      description: 'Error handling block',
      category: 'Error Handling',
      icon: <SettingsIcon />,
    },
  ];

  const activityCategories = useMemo(() => {
    const categories = new Set(availableActivities.map((a) => a.category));
    return Array.from(categories);
  }, []);

  const handleAddActivity = useCallback((activity: WorkflowActivity) => {
    setSelectedActivity(activity);
    setShowActivityDialog(true);
  }, []);

  const handleSaveWorkflow = useCallback(() => {
    const workflow = {
      name: workflowName || 'Untitled Workflow',
      description: workflowDescription,
      nodes: workflowNodes,
      edges: workflowEdges,
      createdAt: new Date().toISOString(),
    };
    console.log('Saving workflow:', workflow);
    // TODO: Save to backend
  }, [workflowName, workflowDescription, workflowNodes, workflowEdges]);

  const handleTestWorkflow = useCallback(async () => {
    // Simulate workflow testing
    setTestResults({
      status: 'success',
      executionTime: 1234,
      stepsExecuted: workflowNodes.length,
      errors: [],
    });
  }, [workflowNodes]);

  const handleExecuteWorkflow = useCallback(async () => {
    // Simulate workflow execution
    console.log('Executing workflow:', { nodes: workflowNodes, edges: workflowEdges });
    // TODO: Execute workflow via backend
  }, [workflowNodes, workflowEdges]);

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Workflow Designer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visual workflow creation and management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PlayIcon />}
            onClick={handleTestWorkflow}
            disabled={workflowNodes.length === 0}
          >
            Test
          </Button>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleSaveWorkflow}
            disabled={workflowNodes.length === 0}
          >
            Save
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={handleExecuteWorkflow}
            disabled={workflowNodes.length === 0}
          >
            Execute
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Activity Library Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 200px)', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Activity Library
            </Typography>
            {activityCategories.map((category) => (
              <Accordion key={category} defaultExpanded={category === 'PACS Actions'}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">{category}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {availableActivities
                      .filter((a) => a.category === category)
                      .map((activity) => (
                        <ListItem key={activity.id} disablePadding>
                          <ListItemButton onClick={() => handleAddActivity(activity)}>
                            <ListItemText
                              primary={activity.name}
                              secondary={activity.description}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>

        {/* Workflow Canvas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 200px)', overflow: 'auto', position: 'relative' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Workflow Canvas</Typography>
              <TextField
                size="small"
                placeholder="Workflow Name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                sx={{ mr: 2, width: 200 }}
              />
            </Box>

            {workflowNodes.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '80%',
                  border: `2px dashed ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <WorkflowIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Workflow Activities
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Drag activities from the library or click to add
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    if (availableActivities.length > 0) {
                      handleAddActivity(availableActivities[0]);
                    }
                  }}
                >
                  Add First Activity
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {workflowNodes.length} activities configured
                </Typography>
                {/* Workflow visualization placeholder */}
                <Box sx={{ p: 2, backgroundColor: theme.palette.background.default, borderRadius: 1 }}>
                  <Typography variant="caption">
                    Visual workflow canvas with React Flow - {workflowNodes.length} nodes, {workflowEdges.length} edges
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Properties Panel */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 200px)', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Workflow Properties
            </Typography>

            <TextField
              fullWidth
              label="Name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Description"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Status
              </Typography>
              <Chip label={workflowNodes.length > 0 ? 'Configured' : 'Empty'} color={workflowNodes.length > 0 ? 'success' : 'default'} size="small" />
            </Box>

            {testResults && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Test Results
                  </Typography>
                  <Typography variant="body2">
                    Status: <Chip label={testResults.status} color="success" size="small" sx={{ ml: 1 }} />
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Execution Time: {testResults.executionTime}ms
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Steps Executed: {testResults.stepsExecuted}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add Activity Dialog */}
      <Dialog open={showActivityDialog} onClose={() => setShowActivityDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Configure Activity: {selectedActivity?.name}
        </DialogTitle>
        <DialogContent>
          {selectedActivity && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedActivity.description}
              </Typography>
              <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
                Activity configuration form will be dynamically generated based on activity type
              </Typography>
              {/* Activity-specific configuration fields would go here */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowActivityDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedActivity) {
                const newNode: WorkflowNode = {
                  id: `node-${Date.now()}`,
                  type: selectedActivity.type,
                  activityId: selectedActivity.id,
                  position: { x: Math.random() * 400, y: Math.random() * 300 },
                  config: {},
                };
                setWorkflowNodes([...workflowNodes, newNode]);
                setShowActivityDialog(false);
              }
            }}
          >
            Add to Workflow
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
