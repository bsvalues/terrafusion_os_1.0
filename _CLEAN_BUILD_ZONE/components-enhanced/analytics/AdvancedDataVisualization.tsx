import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FilterList as FilterIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  ScatterPlot as ScatterPlotIcon,
  Map as MapIcon,
  Layers as LayersIcon
} from '@mui/icons-material';
import {
  ComposedChart,
  LineChart,
  AreaChart,
  BarChart,
  ScatterChart,
  PieChart,
  RadarChart,
  Treemap,
  Sankey,
  Line,
  Area,
  Bar,
  Scatter,
  Pie,
  Cell,
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, CircleMarker, Choropleth } from 'react-leaflet';
import { HeatmapLayer } from 'react-leaflet-heatmap-layer';
import 'leaflet/dist/leaflet.css';
import { useAdvancedVisualization } from './hooks/useAdvancedVisualization';

interface AdvancedDataVisualizationProps {
  jurisdiction: string;
  data?: any[];
  initialChartType?: ChartType;
  showControls?: boolean;
  height?: number;
  interactive?: boolean;
}

type ChartType = 
  | 'line' 
  | 'area' 
  | 'bar' 
  | 'scatter' 
  | 'pie' 
  | 'radar' 
  | 'treemap' 
  | 'sankey' 
  | 'heatmap'
  | 'choropleth'
  | 'bubble'
  | 'candlestick'
  | '3d-surface';

const AdvancedDataVisualization: React.FC<AdvancedDataVisualizationProps> = ({
  jurisdiction,
  data: externalData,
  initialChartType = 'line',
  showControls = true,
  height = 400,
  interactive = true
}) => {
  const {
    data,
    geoData,
    chartTypes,
    isLoading,
    error,
    refreshData,
    exportChart,
    getChartData
  } = useAdvancedVisualization(jurisdiction);

  const [selectedChartType, setSelectedChartType] = useState<ChartType>(initialChartType);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue']);
  const [timeRange, setTimeRange] = useState('30d');
  const [showSettings, setShowSettings] = useState(false);
  const [chartSettings, setChartSettings] = useState({
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    showBrush: false,
    animate: true,
    colors: ['#1976d2', '#dc004e', '#9c27b0', '#ff9800', '#4caf50'],
    opacity: 0.8
  });
  const [mapSettings, setMapSettings] = useState({
    center: [39.8283, -98.5795], // US center
    zoom: 6,
    showHeatmap: false,
    showChoropleth: true,
    colorScale: 'viridis'
  });
  const [filters, setFilters] = useState<Record<string, any>>({});

  const chartData = useMemo(() => {
    return externalData || getChartData(selectedMetrics, timeRange, filters);
  }, [externalData, getChartData, selectedMetrics, timeRange, filters]);

  const handleChartTypeChange = useCallback((newType: ChartType) => {
    setSelectedChartType(newType);
  }, []);

  const handleExport = useCallback(async (format: 'png' | 'svg' | 'pdf') => {
    try {
      await exportChart(selectedChartType, chartData, format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [exportChart, selectedChartType, chartData]);

  const renderChart = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
          <Button onClick={refreshData} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      );
    }

    switch (selectedChartType) {
      case 'line':
        return renderLineChart();
      case 'area':
        return renderAreaChart();
      case 'bar':
        return renderBarChart();
      case 'scatter':
        return renderScatterChart();
      case 'pie':
        return renderPieChart();
      case 'radar':
        return renderRadarChart();
      case 'treemap':
        return renderTreemap();
      case 'heatmap':
        return renderHeatmap();
      case 'choropleth':
        return renderChoroplethMap();
      case 'bubble':
        return renderBubbleChart();
      default:
        return renderLineChart();
    }
  };

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="date" />
        <YAxis />
        {chartSettings.showTooltip && <Tooltip />}
        {chartSettings.showLegend && <Legend />}
        {selectedMetrics.map((metric /* , index */) => (
          <Line
            key={metric}
            type="monotone"
            dataKey={metric}
            stroke={chartSettings.colors[index % chartSettings.colors.length]}
            strokeWidth={2}
            dot={{ fill: chartSettings.colors[index % chartSettings.colors.length] }}
            animationDuration={chartSettings.animate ? 1000 : 0}
          />
        ))}
        {chartSettings.showBrush && <Brush dataKey="date" height={30} />}
      </LineChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="date" />
        <YAxis />
        {chartSettings.showTooltip && <Tooltip />}
        {chartSettings.showLegend && <Legend />}
        {selectedMetrics.map((metric /* , index */) => (
          <Area
            key={metric}
            type="monotone"
            dataKey={metric}
            stackId="1"
            stroke={chartSettings.colors[index % chartSettings.colors.length]}
            fill={chartSettings.colors[index % chartSettings.colors.length]}
            fillOpacity={chartSettings.opacity}
            animationDuration={chartSettings.animate ? 1000 : 0}
          />
        ))}
        {chartSettings.showBrush && <Brush dataKey="date" height={30} />}
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
        {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="date" />
        <YAxis />
        {chartSettings.showTooltip && <Tooltip />}
        {chartSettings.showLegend && <Legend />}
        {selectedMetrics.map((metric /* , index */) => (
          <Bar
            key={metric}
            dataKey={metric}
            fill={chartSettings.colors[index % chartSettings.colors.length]}
            fillOpacity={chartSettings.opacity}
            animationDuration={chartSettings.animate ? 1000 : 0}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  const renderScatterChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart data={chartData}>
        {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="x" />
        <YAxis dataKey="y" />
        <ZAxis dataKey="z" range={[50, 400]} />
        {chartSettings.showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
        {chartSettings.showLegend && <Legend />}
        <Scatter
          name="Data Points"
          data={chartData}
          fill={chartSettings.colors[0]}
          fillOpacity={chartSettings.opacity}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          animationDuration={chartSettings.animate ? 1000 : 0}
        >
          {chartData.map((entry /* , index */) => (
            <Cell
              key={`cell-${index}`}
              fill={chartSettings.colors[index % chartSettings.colors.length]}
            />
          ))}
        </Pie>
        {chartSettings.showTooltip && <Tooltip />}
        {chartSettings.showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );

  const renderRadarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadarChart data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis />
        {selectedMetrics.map((metric /* , index */) => (
          <Radar
            key={metric}
            name={metric}
            dataKey={metric}
            stroke={chartSettings.colors[index % chartSettings.colors.length]}
            fill={chartSettings.colors[index % chartSettings.colors.length]}
            fillOpacity={chartSettings.opacity}
          />
        ))}
        {chartSettings.showLegend && <Legend />}
      </RechartsRadarChart>
    </ResponsiveContainer>
  );

  const renderTreemap = () => (
    <ResponsiveContainer width="100%" height={height}>
      <Treemap
        data={chartData}
        dataKey="size"
        ratio={4 / 3}
        stroke="#fff"
        fill={chartSettings.colors[0]}
      />
    </ResponsiveContainer>
  );

  const renderHeatmap = () => (
    <Box sx={{ height, position: 'relative' }}>
      <MapContainer
        center={mapSettings.center as [number, number]}
        zoom={mapSettings.zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {mapSettings.showHeatmap && (
          <HeatmapLayer
            points={chartData}
            longitudeExtractor={(point: any) => point.lng}
            latitudeExtractor={(point: any) => point.lat}
            intensityExtractor={(point: any) => point.intensity}
          />
        )}
      </MapContainer>
    </Box>
  );

  const renderChoroplethMap = () => (
    <Box sx={{ height, position: 'relative' }}>
      <MapContainer
        center={mapSettings.center as [number, number]}
        zoom={mapSettings.zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {geoData && (
          <GeoJSON
            data={geoData}
            style={(feature) => ({
              fillColor: getFeatureColor(feature?.properties?.value),
              weight: 2,
              opacity: 1,
              color: 'white',
              dashArray: '3',
              fillOpacity: 0.7
            })}
            onEachFeature={(feature, layer) => {
              layer.bindPopup(
                `<strong>${feature.properties.name}</strong><br/>
                 Value: ${feature.properties.value}`
              );
            }}
          />
        )}
      </MapContainer>
    </Box>
  );

  const renderBubbleChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart data={chartData}>
        {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="x" />
        <YAxis dataKey="y" />
        <ZAxis dataKey="z" range={[64, 144]} />
        {chartSettings.showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
        {chartSettings.showLegend && <Legend />}
        <Scatter
          name="Bubble Data"
          data={chartData}
          fill={chartSettings.colors[0]}
          fillOpacity={chartSettings.opacity}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );

  const getFeatureColor = (value: number) => {
    // Color scale based on value
    const colors = ['#ffffcc', '#c7e9b4', '#7fcdbb', '#41b6c4', '#2c7fb8', '#253494'];
    const max = Math.max(...chartData.map((d: any) => d.value));
    const min = Math.min(...chartData.map((d: any) => d.value));
    const normalized = (value - min) / (max - min);
    const index = Math.floor(normalized * (colors.length - 1));
    return colors[index] || colors[0];
  };

  const renderControls = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
      <FormControl size="small" sx={{ minWidth: 120 }}><>

        <InputLabel>Chart Type</InputLabel>
        <Select
</>

          value={selectedChartType}
          onChange={(e) => handleChartTypeChange(e.target.value as ChartType)}
          label="Chart Type"
        >
          <MenuItem value="line">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LineChartIcon sx={{ mr: 1 }} />
              Line Chart
            </Box>
          </MenuItem>
          <MenuItem value="area">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TimelineIcon sx={{ mr: 1 }} />
              Area Chart
            </Box>
          </MenuItem>
          <MenuItem value="bar">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BarChartIcon sx={{ mr: 1 }} />
              Bar Chart
            </Box>
          </MenuItem>
          <MenuItem value="scatter">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ScatterPlotIcon sx={{ mr: 1 }} />
              Scatter Plot
            </Box>
          </MenuItem>
          <MenuItem value="pie">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PieChartIcon sx={{ mr: 1 }} />
              Pie Chart
            </Box>
          </MenuItem>
          <MenuItem value="choropleth">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MapIcon sx={{ mr: 1 }} />
              Map
            </Box>
          </MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}><>

        <InputLabel>Time Range</InputLabel>
        <Select
</>

          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          label="Time Range"
        ><>

          <MenuItem value="7d">Last 7 Days</MenuItem>
          <MenuItem
</>
value="30d">Last 30 Days</MenuItem><>

          <MenuItem value="90d">Last 90 Days</MenuItem>
          <MenuItem
</>
value="1y">Last Year</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 1 }}>
        {selectedMetrics.map((metric) => (<>

          <Chip
            key={metric}
            label={metric}
            onDelete={() => setSelectedMetrics(prev => prev.filter(m => m !== metric))}
            color="primary"
            variant="outlined"
          />
        ))}
      </Box>

      <Box
</>
sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
        <Tooltip title="Refresh Data">
          <IconButton onClick={refreshData} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings">
          <IconButton onClick={() => setShowSettings(true)} size="small">
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export">
          <IconButton onClick={() => handleExport('png')} size="small">
            <DownloadIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Fullscreen">
          <IconButton size="small">
            <FullscreenIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  const renderSettingsDialog = () => (
    <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="md" fullWidth><>

      <DialogTitle>Visualization Settings</DialogTitle>
      <DialogContent
</>
</>>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}><>

            <Typography variant="subtitle1" gutterBottom>
              Chart Options
            </Typography>
            <FormControlLabel
</>

              control={
                <Switch
                  checked={chartSettings.showGrid}
                  onChange={(e) => setChartSettings(prev => ({ ...prev, showGrid: e.target.checked }))}
                />
              }
              label="Show Grid"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={chartSettings.showLegend}
                  onChange={(e) => setChartSettings(prev => ({ ...prev, showLegend: e.target.checked }))}
                />
              }
              label="Show Legend"
            /><>

            <FormControlLabel
              control={
                <Switch
                  checked={chartSettings.animate}
                  onChange={(e) => setChartSettings(prev => ({ ...prev, animate: e.target.checked }))}
                />
              }
              label="Animations"
            />
          </Grid>
          <Grid
</>
item xs={12} md={6}><>

            <Typography variant="subtitle1" gutterBottom>
              Opacity
            </Typography>
            <Slider
</>

              value={chartSettings.opacity}
              onChange={(_, value) => setChartSettings(prev => ({ ...prev, opacity: value as number }))}
              min={0.1}
              max={1}
              step={0.1}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions><>

        <Button onClick={() => setShowSettings(false)}>Cancel</Button>
        <Button
</>
variant="contained" onClick={() => setShowSettings(false)}>
          Apply Settings
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Advanced Data Visualization
      </Typography>
      
      {showControls && renderControls()}
      
      <Box sx={{ position: 'relative' }}>
        {renderChart()}
      </Box>

      {renderSettingsDialog()}
    </Paper>
  );
};

export default AdvancedDataVisualization;
