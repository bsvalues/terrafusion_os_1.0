/**
 * User Settings Component
 * Elite Power User - Personalization Engine & Preferences
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Palette as PaletteIcon,
  Keyboard as KeyboardIcon,
  Dashboard as DashboardIcon,
  Code as CodeIcon,
  SettingsApplications as WorkflowIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateTheme,
  updateDashboardLayout,
  addCustomMetric,
  removeCustomMetric,
  addQueryTemplate,
  removeQueryTemplate,
  addWorkflowTemplate,
  removeWorkflowTemplate,
} from '../../store/slices/userPreferencesSlice';
import type { RootState } from '../../store';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const UserSettings: React.FC = () => {
  const dispatch = useDispatch();
  const preferences = useSelector((state: RootState) => state.userPreferences);
  const [tabValue, setTabValue] = useState(0);
  const [showMetricDialog, setShowMetricDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateType, setTemplateType] = useState<'query' | 'workflow'>('query');
  const [newMetric, setNewMetric] = useState({ name: '', formula: '', description: '' });
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '', description: '' });

  const handleThemeChange = useCallback(
    (newTheme: 'light' | 'dark' | 'auto') => {
      dispatch(updateTheme(newTheme));
    },
    [dispatch]
  );

  const handleSaveMetric = useCallback(() => {
    if (newMetric.name && newMetric.formula) {
      dispatch(
        addCustomMetric({
          id: `metric-${Date.now()}`,
          name: newMetric.name,
          formula: newMetric.formula,
          description: newMetric.description,
        })
      );
      setNewMetric({ name: '', formula: '', description: '' });
      setShowMetricDialog(false);
    }
  }, [dispatch, newMetric]);

  const handleSaveTemplate = useCallback(() => {
    if (newTemplate.name && newTemplate.content) {
      if (templateType === 'query') {
        dispatch(
          addQueryTemplate({
            id: `query-${Date.now()}`,
            name: newTemplate.name,
            sql: newTemplate.content,
            description: newTemplate.description,
            createdAt: new Date().toISOString(),
          })
        );
      } else {
        dispatch(
          addWorkflowTemplate({
            id: `workflow-${Date.now()}`,
            name: newTemplate.name,
            workflowJson: newTemplate.content,
            description: newTemplate.description,
            createdAt: new Date().toISOString(),
          })
        );
      }
      setNewTemplate({ name: '', content: '', description: '' });
      setShowTemplateDialog(false);
    }
  }, [dispatch, newTemplate, templateType]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          User Settings & Personalization
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Customize your experience, create personal metrics, and manage preferences
        </Typography>
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Appearance" icon={<PaletteIcon />} iconPosition="start" />
          <Tab label="Dashboard" icon={<DashboardIcon />} iconPosition="start" />
          <Tab label="Custom Metrics" icon={<CodeIcon />} iconPosition="start" />
          <Tab label="Templates" icon={<WorkflowIcon />} iconPosition="start" />
          <Tab label="Shortcuts" icon={<KeyboardIcon />} iconPosition="start" />
          <Tab label="General" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>

        {/* Appearance Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Theme Settings
                  </Typography>
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Theme</InputLabel>
                    <Select
                      value={preferences.theme || 'dark'}
                      label="Theme"
                      onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'auto')}
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="auto">Auto (System)</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.compactMode || false}
                        onChange={(e) =>
                          dispatch(updateDashboardLayout({ compactMode: e.target.checked }))
                        }
                      />
                    }
                    label="Compact Mode"
                    sx={{ mt: 2 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Color Preferences
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Advanced color customization options will be available in a future update
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Dashboard Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Dashboard Layout
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure your dashboard layout and default panels
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.dashboardLayout?.showStatisticalBreakdown ?? true}
                        onChange={(e) =>
                          dispatch(
                            updateDashboardLayout({ showStatisticalBreakdown: e.target.checked })
                          )
                        }
                      />
                    }
                    label="Show Statistical Breakdown"
                    sx={{ mb: 1, display: 'block' }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.dashboardLayout?.showCorrelationMatrix ?? true}
                        onChange={(e) =>
                          dispatch(
                            updateDashboardLayout({ showCorrelationMatrix: e.target.checked })
                          )
                        }
                      />
                    }
                    label="Show Correlation Matrix"
                    sx={{ mb: 1, display: 'block' }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.dashboardLayout?.showLiveCharts ?? true}
                        onChange={(e) =>
                          dispatch(updateDashboardLayout({ showLiveCharts: e.target.checked }))
                        }
                      />
                    }
                    label="Show Live Charts"
                    sx={{ mb: 1, display: 'block' }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Custom Metrics Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Custom Metrics</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowMetricDialog(true)}
            >
              Create Metric
            </Button>
          </Box>

          {preferences.customMetrics && preferences.customMetrics.length > 0 ? (
            <List>
              {preferences.customMetrics.map((metric) => (
                <Paper key={metric.id} sx={{ mb: 2 }}>
                  <ListItem>
                    <ListItemText
                      primary={metric.name}
                      secondary={metric.description || metric.formula}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => dispatch(removeCustomMetric(metric.id))}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Paper>
              ))}
            </List>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No custom metrics created yet
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setShowMetricDialog(true)}
                sx={{ mt: 2 }}
              >
                Create Your First Metric
              </Button>
            </Paper>
          )}
        </TabPanel>

        {/* Templates Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Templates</Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setTemplateType('query');
                  setShowTemplateDialog(true);
                }}
                sx={{ mr: 1 }}
              >
                Query Template
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setTemplateType('workflow');
                  setShowTemplateDialog(true);
                }}
              >
                Workflow Template
              </Button>
            </Box>
          </Box>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Query Templates ({preferences.queryTemplates?.length || 0})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {preferences.queryTemplates && preferences.queryTemplates.length > 0 ? (
                <List>
                  {preferences.queryTemplates.map((template) => (
                    <Paper key={template.id} sx={{ mb: 1 }}>
                      <ListItem>
                        <ListItemText primary={template.name} secondary={template.description} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => dispatch(removeQueryTemplate(template.id))}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No query templates saved
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Workflow Templates ({preferences.workflowTemplates?.length || 0})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {preferences.workflowTemplates && preferences.workflowTemplates.length > 0 ? (
                <List>
                  {preferences.workflowTemplates.map((template) => (
                    <Paper key={template.id} sx={{ mb: 1 }}>
                      <ListItem>
                        <ListItemText primary={template.name} secondary={template.description} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => dispatch(removeWorkflowTemplate(template.id))}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No workflow templates saved
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        {/* Shortcuts Tab */}
        <TabPanel value={tabValue} index={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Keyboard Shortcuts
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Customizable keyboard shortcuts for power users
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Open Query Builder"
                    secondary="Ctrl/Cmd + K"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Execute Query"
                    secondary="Ctrl/Cmd + Enter"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Toggle Dashboard"
                    secondary="Ctrl/Cmd + D"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Open Settings"
                    secondary="Ctrl/Cmd + ,"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        {/* General Tab */}
        <TabPanel value={tabValue} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    General Preferences
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.autoRefresh || false}
                        onChange={(e) =>
                          dispatch(updateDashboardLayout({ autoRefresh: e.target.checked }))
                        }
                      />
                    }
                    label="Auto Refresh Dashboard"
                    sx={{ display: 'block', mb: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.showNotifications || false}
                        onChange={(e) =>
                          dispatch(updateDashboardLayout({ showNotifications: e.target.checked }))
                        }
                      />
                    }
                    label="Show Notifications"
                    sx={{ display: 'block', mb: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Create Metric Dialog */}
      <Dialog open={showMetricDialog} onClose={() => setShowMetricDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Custom Metric</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Metric Name"
            value={newMetric.name}
            onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Formula"
            value={newMetric.formula}
            onChange={(e) => setNewMetric({ ...newMetric, formula: e.target.value })}
            placeholder="e.g., SUM(payment.amount) / COUNT(DISTINCT account.id)"
            sx={{ mt: 2 }}
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Description"
            value={newMetric.description}
            onChange={(e) => setNewMetric({ ...newMetric, description: e.target.value })}
            sx={{ mt: 2 }}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMetricDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMetric} startIcon={<SaveIcon />}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={showTemplateDialog} onClose={() => setShowTemplateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Create {templateType === 'query' ? 'Query' : 'Workflow'} Template
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Template Name"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label={templateType === 'query' ? 'SQL Query' : 'Workflow JSON'}
            value={newTemplate.content}
            onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
            sx={{ mt: 2 }}
            multiline
            rows={8}
            placeholder={templateType === 'query' ? 'SELECT * FROM...' : '{"nodes": [], "edges": []}'}
          />
          <TextField
            fullWidth
            label="Description"
            value={newTemplate.description}
            onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
            sx={{ mt: 2 }}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTemplate} startIcon={<SaveIcon />}>
            Save Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
