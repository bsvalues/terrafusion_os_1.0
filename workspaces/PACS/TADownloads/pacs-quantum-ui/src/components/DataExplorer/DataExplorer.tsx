/**
 * Data Explorer Component
 * Elite Power User - Advanced Data Visualization & Analysis
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ScatterPlot as ScatterPlotIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  Map as MapIcon,
  AccountTree as NetworkIcon,
  TableChart as TableIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useExecuteSqlQueryMutation } from '../../store/api/pacsApi';
import { exportToExcel, exportToCSV, exportToJSON } from '../../utils/exportUtils';
import type { SqlQueryResult } from '../../types/pacs';

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

export const DataExplorer: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [selectedTable, setSelectedTable] = useState<string>('account');
  const [chartType, setChartType] = useState<string>('bar');
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filterConditions, setFilterConditions] = useState<string[]>([]);
  const [executeQuery] = useExecuteSqlQueryMutation();

  const availableTables = useMemo(
    () => [
      { value: 'account', label: 'Account', icon: <TableIcon /> },
      { value: 'property', label: 'Property', icon: <TableIcon /> },
      { value: 'payment', label: 'Payment', icon: <TableIcon /> },
      { value: 'task', label: 'Task', icon: <TableIcon /> },
      { value: 'workflow', label: 'Workflow', icon: <TableIcon /> },
    ],
    []
  );

  const chartTypes = useMemo(
    () => [
      { value: 'bar', label: 'Bar Chart', icon: <BarChartIcon /> },
      { value: 'line', label: 'Line Chart', icon: <TimelineIcon /> },
      { value: 'pie', label: 'Pie Chart', icon: <PieChartIcon /> },
      { value: 'scatter', label: 'Scatter Plot', icon: <ScatterPlotIcon /> },
      { value: 'map', label: 'Geographic Map', icon: <MapIcon /> },
      { value: 'network', label: 'Network Graph', icon: <NetworkIcon /> },
    ],
    []
  );

  const handleTableChange = useCallback(
    async (table: string) => {
      setSelectedTable(table);
      setIsLoading(true);

      try {
        // Generate a sample query for the selected table
        const query = `SELECT TOP 100 * FROM ${table}`;
        const result = await executeQuery({ query }).unwrap();
        setQueryResult(result);
      } catch (error) {
        console.error('Error executing query:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [executeQuery]
  );

  useEffect(() => {
    // Load initial data
    handleTableChange(selectedTable);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = useCallback(
    (format: 'excel' | 'csv' | 'json') => {
      if (!queryResult) return;

      const filename = `data-explorer-${selectedTable}-${new Date().toISOString().split('T')[0]}`;

      switch (format) {
        case 'excel':
          exportToExcel(queryResult, `${filename}.xlsx`);
          break;
        case 'csv':
          exportToCSV(queryResult, `${filename}.csv`);
          break;
        case 'json':
          exportToJSON(queryResult, `${filename}.json`);
          break;
      }
    },
    [queryResult, selectedTable]
  );

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Data Explorer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Advanced data visualization and multi-dimensional analysis
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => handleTableChange(selectedTable)} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filter Options">
            <IconButton onClick={() => setShowFilterDialog(true)}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Controls */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Table</InputLabel>
            <Select
              value={selectedTable}
              label="Select Table"
              onChange={(e) => handleTableChange(e.target.value)}
            >
              {availableTables.map((table) => (
                <MenuItem key={table.value} value={table.value}>
                  {table.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Chart Type</InputLabel>
            <Select value={chartType} label="Chart Type" onChange={(e) => setChartType(e.target.value)}>
              {chartTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('excel')}
              disabled={!queryResult}
            >
              Excel
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleExport('csv')}
              disabled={!queryResult}
            >
              CSV
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleExport('json')}
              disabled={!queryResult}
            >
              JSON
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Filter Chips */}
      {filterConditions.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {filterConditions.map((condition, index) => (
            <Chip
              key={index}
              label={condition}
              onDelete={() => {
                setFilterConditions(filterConditions.filter((_, i) => i !== index));
              }}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      )}

      {/* Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Visualizations" icon={<BarChartIcon />} iconPosition="start" />
          <Tab label="Pivot Table" icon={<TableIcon />} iconPosition="start" />
          <Tab label="Statistical Analysis" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Time Series" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Geographic Map" icon={<MapIcon />} iconPosition="start" />
          <Tab label="Network Graph" icon={<NetworkIcon />} iconPosition="start" />
        </Tabs>

        {/* Visualizations Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {chartTypes.find((t) => t.value === chartType)?.label} Visualization
            </Typography>
            {isLoading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography>Loading data...</Typography>
              </Box>
            ) : queryResult ? (
              <Box sx={{ mt: 2, p: 2, backgroundColor: theme.palette.background.default, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Chart placeholder - {queryResult.columnNames.length} columns, {queryResult.resultRows.length} rows
                </Typography>
                <Typography variant="caption">
                  Advanced visualization rendering will be integrated with D3.js, Recharts, and Plotly.js
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No data available. Select a table to begin.</Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Pivot Table Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Multi-Dimensional Pivot Table
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Drag and drop columns to create cross-tabs and pivot tables
            </Typography>
            {queryResult ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption">Pivot table component - Coming soon</Typography>
              </Box>
            ) : (
              <Typography color="text.secondary">No data available</Typography>
            )}
          </Box>
        </TabPanel>

        {/* Statistical Analysis Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Statistical Tests & Analysis
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      T-Test
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Compare means between two groups
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      ANOVA
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Analysis of variance for multiple groups
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Correlation Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Calculate correlation coefficients
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Regression Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Linear and polynomial regression
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Time Series Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Time Series Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              ARIMA, exponential smoothing, and trend analysis
            </Typography>
            <Box>
              <Typography variant="caption">Time series components - Coming soon</Typography>
            </Box>
          </Box>
        </TabPanel>

        {/* Geographic Map Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Geographic Visualization
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Property locations, heat maps, and geographic overlays
            </Typography>
            <Box>
              <Typography variant="caption">Map component - Coming soon</Typography>
            </Box>
          </Box>
        </TabPanel>

        {/* Network Graph Tab */}
        <TabPanel value={tabValue} index={5}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Network Graph Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Relationship visualization and network analysis
            </Typography>
            <Box>
              <Typography variant="caption">Network graph component - Coming soon</Typography>
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onClose={() => setShowFilterDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Conditions</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Add Filter Condition"
            placeholder="e.g., Property.TaxValue > 100000"
            sx={{ mt: 1 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                if (target.value.trim()) {
                  setFilterConditions([...filterConditions, target.value.trim()]);
                  target.value = '';
                }
              }
            }}
          />
          <Box sx={{ mt: 2 }}>
            {filterConditions.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No filters applied
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFilterDialog(false)}>Close</Button>
          <Button
            onClick={() => {
              setFilterConditions([]);
              setShowFilterDialog(false);
            }}
            color="error"
          >
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
