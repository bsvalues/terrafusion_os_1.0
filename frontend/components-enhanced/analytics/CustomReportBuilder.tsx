import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from 'react-beautiful-dnd';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  Preview as PreviewIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  DragIndicator as DragIcon,
  BarChart as ChartIcon,
  TableChart as TableIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  Map as MapIcon,
  Assessment as MetricIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  ReportConfiguration, 
  ReportElement, 
  ReportSchedule, 
  DataSource,
  ChartConfiguration,
  FilterConfiguration,
  ReportTemplate
} from './types/ReportTypes';
import { useReportBuilder } from './hooks/useReportBuilder';

interface CustomReportBuilderProps {
  jurisdiction: string;
  onSave?: (report: ReportConfiguration) => void;
  onPreview?: (report: ReportConfiguration) => void;
  initialReport?: ReportConfiguration;
}

const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({
  jurisdiction,
  onSave,
  onPreview,
  initialReport
}) => {
  const {
    report,
    setReport,
    availableDataSources,
    availableMetrics,
    availableTemplates,
    isLoading,
    saveReport,
    scheduleReport,
    previewReport,
    exportReport
  } = useReportBuilder(jurisdiction);

  const [activeTab, setActiveTab] = useState(0);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [draggedElement, setDraggedElement] = useState<ReportElement | null>(null);

  // Initialize report from props
  useEffect(() => {
    if (initialReport) {
      setReport(initialReport);
    }
  }, [initialReport, setReport]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === 'available-elements' && destination.droppableId === 'report-canvas') {
      // Add new element to report
      const elementType = result.draggableId as ReportElement['type'];
      const newElement: ReportElement = {
        id: `${elementType}-${Date.now()}`,
        type: elementType,
        title: `New ${elementType.charAt(0).toUpperCase() + elementType.slice(1)}`,
        position: destination.index,
        configuration: getDefaultConfiguration(elementType),
        dataSource: availableDataSources[0]?.id || '',
        filters: []
      };

      setReport(prev => ({
        ...prev,
        elements: [
          ...prev.elements.slice(0, destination.index),
          newElement,
          ...prev.elements.slice(destination.index)
        ]
      }));
    } else if (source.droppableId === 'report-canvas' && destination.droppableId === 'report-canvas') {
      // Reorder elements within report
      const newElements = Array.from(report.elements);
      const [reorderedElement] = newElements.splice(source.index, 1);
      newElements.splice(destination.index, 0, reorderedElement);

      setReport(prev => ({
        ...prev,
        elements: newElements.map((el /* , index */) => ({ ...el, position: index }))
      }));
    }
  }, [report.elements, availableDataSources, setReport]);

  const getDefaultConfiguration = (elementType: ReportElement['type']): any => {
    switch (elementType) {
      case 'chart':
        return {
          chartType: 'bar',
          xAxis: '',
          yAxis: '',
          aggregation: 'sum',
          showLegend: true,
          colors: ['#1976d2', '#dc004e', '#9c27b0']
        };
      case 'table':
        return {
          columns: [],
          sortBy: '',
          sortOrder: 'asc',
          pageSize: 25,
          showPagination: true
        };
      case 'metric':
        return {
          metric: '',
          format: 'currency',
          comparison: 'previous-period',
          showTrend: true,
          thresholds: { warning: 0, critical: 0 }
        };
      case 'filter':
        return {
          filterType: 'dropdown',
          field: '',
          options: [],
          defaultValue: '',
          multiSelect: false
        };
      case 'text':
        return {
          content: 'Enter your text here...',
          fontSize: 14,
          fontWeight: 'normal',
          alignment: 'left'
        };
      default:
        return {};
    }
  };

  const handleElementUpdate = (elementId: string, updates: Partial<ReportElement>) => {
    setReport(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      )
    }));
  };

  const handleElementDelete = (elementId: string) => {
    setReport(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId)
    }));
  };

  const handleSaveReport = async () => {
    try {
      await saveReport(report);
      onSave?.(report);
    } catch (error) {
      console.error('Failed to save report:', error);
    }
  };

  const handlePreviewReport = async () => {
    try {
      await previewReport(report);
      onPreview?.(report);
    } catch (error) {
      console.error('Failed to preview report:', error);
    }
  };

  const renderAvailableElements = () => (
    <Droppable droppableId="available-elements" isDropDisabled={false}>
      {(provided) => (
        <Box ref={provided.innerRef} {...provided.droppableProps}><>

          <Typography variant="h6" gutterBottom>
            Report Elements
          </Typography>
          <Grid
</> container spacing={2}>
            {[
              { type: 'chart', icon: <ChartIcon />, label: 'Chart' },
              { type: 'table', icon: <TableIcon />, label: 'Table' },
              { type: 'metric', icon: <MetricIcon />, label: 'Metric' },
              { type: 'filter', icon: <FilterIcon />, label: 'Filter' },
              { type: 'text', icon: <EditIcon />, label: 'Text' },
              { type: 'map', icon: <MapIcon />, label: 'Map' }
            ].map((element /* , index */) => (
              <Grid item xs={6} key={element.type}>
                <Draggable draggableId={element.type} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      sx={{
                        cursor: 'grab',
                        opacity: snapshot.isDragging ? 0.8 : 1,
                        transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                        '&:hover': { boxShadow: 3 }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        {element.icon}
                        <Typography variant="caption" display="block">
                          {element.label}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              </Grid>
            ))}
          </Grid>
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  );

  const renderReportCanvas = () => (
    <Droppable droppableId="report-canvas">
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.droppableProps}
          sx={{
            minHeight: 400,
            border: '2px dashed',
            borderColor: snapshot.isDraggingOver ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 2,
            backgroundColor: snapshot.isDraggingOver ? 'primary.50' : 'background.paper'
          }}
        >
          {report.elements.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 200,
                color: 'text.secondary'
              }}
            >
              <DragIcon sx={{ fontSize: 48, mb: 2 }} /><>

              <Typography variant="h6">Drag elements here to build your report</Typography>
              <Typography
</> variant="body2">
                Start by dragging charts, tables, or metrics from the left panel
              </Typography>
            </Box>
          ) : (
            report.elements.map((element /* , index */) => (
              <Draggable key={element.id} draggableId={element.id} index={index}>
                {(provided, snapshot) => (
                  <Paper
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    sx={{
                      mb: 2,
                      p: 2,
                      opacity: snapshot.isDragging ? 0.8 : 1,
                      boxShadow: snapshot.isDragging ? 4 : 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box {...provided.dragHandleProps} sx={{ mr: 1, cursor: 'grab' }}><>

                        <DragIcon color="action" />
                      </Box>
                      <Typography
</> variant="h6" sx={{ flexGrow: 1 }}>
                        {element.title}
                      </Typography>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {/* Open element editor */}}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleElementDelete(element.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <ReportElementPreview element={element} />
                  </Paper>
                )}
              </Draggable>
            ))
          )}
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  );

  const renderReportSettings = () => (
    <Box><>

      <Typography variant="h6" gutterBottom>
        Report Settings
      </Typography>
      <Grid
</> container spacing={3}>
        <Grid item xs={12} md={6}><>

          <TextField
            fullWidth
            label="Report Name"
            value={report.name}
            onChange={(e) => setReport(prev => ({ ...prev, name: e.target.value }))}
          />
        </Grid>
        <Grid
</> item xs={12} md={6}><>

          <TextField
            fullWidth
            label="Description"
            value={report.description}
            onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
          />
        </Grid>
        <Grid
</> item xs={12} md={6}>
          <FormControl fullWidth><>

            <InputLabel>Category</InputLabel>
            <Select
</>
              value={report.category}
              onChange={(e) => setReport(prev => ({ ...prev, category: e.target.value }))}
            ><>

              <MenuItem value="revenue">Revenue Analysis</MenuItem>
              <MenuItem
</> value="performance">Performance Metrics</MenuItem><>

              <MenuItem value="compliance">Compliance Reports</MenuItem>
              <MenuItem
</> value="operations">Operations Dashboard</MenuItem>
              <MenuItem value="executive">Executive Summary</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth><>

            <InputLabel>Access Level</InputLabel>
            <Select
</>
              value={report.accessLevel}
              onChange={(e) => setReport(prev => ({ ...prev, accessLevel: e.target.value }))}
            ><>

              <MenuItem value="public">Public</MenuItem>
              <MenuItem
</> value="internal">Internal</MenuItem><>

              <MenuItem value="restricted">Restricted</MenuItem>
              <MenuItem
</> value="confidential">Confidential</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={report.isTemplate}
                onChange={(e) => setReport(prev => ({ ...prev, isTemplate: e.target.checked }))}
              />
            }
            label="Save as Template"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderScheduleDialog = () => (
    <Dialog open={showScheduleDialog} onClose={() => setShowScheduleDialog(false)} maxWidth="md" fullWidth><>

      <DialogTitle>Schedule Report</DialogTitle>
      <DialogContent
</>><>

        <ScheduleConfiguration
          schedule={report.schedule}
          onScheduleChange={(schedule) => setReport(prev => ({ ...prev, schedule }))}
        />
      </DialogContent>
      <DialogActions
</>><>

        <Button onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
        <Button
</>
          variant="contained"
          onClick={async () => {
            await scheduleReport(report);
            setShowScheduleDialog(false);
          }}
        >
          Schedule Report
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><>

              <Typography variant="h4">Custom Report Builder</Typography>
              <Box
</> sx={{ display: 'flex', gap: 1 }}><>

                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={handlePreviewReport}
                  disabled={isLoading}
                >
                  Preview
                </Button>
                <Button
</>
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={() => setShowScheduleDialog(true)}
                >
                  Schedule
                </Button><>

                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  onClick={() => {/* Share functionality */}}
                >
                  Share
                </Button>
                <Button
</>
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveReport}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={20} /> : 'Save Report'}
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Main Content */}
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
            {/* Left Panel - Elements and Settings */}
            <Paper sx={{ width: 300, p: 2, overflow: 'auto' }}>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
              >
                <Tab label="Elements" /><>

                <Tab label="Settings" />
              </Tabs>
              <Box
</> sx={{ mt: 2 }}>
                {activeTab === 0 && renderAvailableElements()}
                {activeTab === 1 && renderReportSettings()}
              </Box>
            </Paper>

            {/* Center Panel - Report Canvas */}
            <Box sx={{ flexGrow: 1 }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Report Canvas
                </Typography>
                {renderReportCanvas()}
              </Paper>
            </Box>
          </Box>

          {/* Dialogs */}
          {renderScheduleDialog()}
        </Box>
      </DragDropContext>
    </LocalizationProvider>
  );
};

// Supporting Components
const ReportElementPreview: React.FC<{ element: ReportElement }> = ({ element }) => {
  const renderPreview = () => {
    switch (element.type) {
      case 'chart':
        return (
          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50' }}>
            <ChartIcon sx={{ fontSize: 48, color: 'grey.400' }} />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              Chart Preview
            </Typography>
          </Box>
        );
      case 'table':
        return (
          <Box sx={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50' }}>
            <TableIcon sx={{ fontSize: 48, color: 'grey.400' }} />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              Table Preview
            </Typography>
          </Box>
        );
      case 'metric':
        return (
          <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}><>

            <Typography variant="h4" color="primary">
              $1,234,567
            </Typography>
            <Typography
</> variant="body2" color="text.secondary">
              Sample Metric
            </Typography>
          </Box>
        );
      default:
        return (
          <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary">
              {element.type} element
            </Typography>
          </Box>
        );
    }
  };

  return renderPreview();
};

const ScheduleConfiguration: React.FC<{
  schedule?: ReportSchedule;
  onScheduleChange: (schedule: ReportSchedule) => void;
}> = ({ schedule, onScheduleChange }) => {
  const [localSchedule, setLocalSchedule] = useState<ReportSchedule>(
    schedule || {
      enabled: false,
      frequency: 'daily',
      time: '09:00',
      timezone: 'America/New_York',
      recipients: [],
      format: 'pdf'
    }
  );

  useEffect(() => {
    onScheduleChange(localSchedule);
  }, [localSchedule, onScheduleChange]);

  return (
    <Box sx={{ mt: 2 }}>
      <FormControlLabel
        control={
          <Switch
            checked={localSchedule.enabled}
            onChange={(e) => setLocalSchedule(prev => ({ ...prev, enabled: e.target.checked }))}
          />
        }
        label="Enable Scheduled Reports"
      />
      
      {localSchedule.enabled && (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth><>

              <InputLabel>Frequency</InputLabel>
              <Select
</>
                value={localSchedule.frequency}
                onChange={(e) => setLocalSchedule(prev => ({ ...prev, frequency: e.target.value as any }))}
              ><>

                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem
</> value="weekly">Weekly</MenuItem><>

                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem
</> value="quarterly">Quarterly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}><>

            <TextField
              fullWidth
              type="time"
              label="Time"
              value={localSchedule.time}
              onChange={(e) => setLocalSchedule(prev => ({ ...prev, time: e.target.value }))}
            />
          </Grid>
          <Grid
</> item xs={12}>
            <TextField
              fullWidth
              label="Recipients (comma-separated emails)"
              value={localSchedule.recipients.join(', ')}
              onChange={(e) => setLocalSchedule(prev => ({ 
                ...prev, 
                recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
              }))}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default CustomReportBuilder;
