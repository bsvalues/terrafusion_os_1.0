import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh,
  Delete,
  Speed,
  Storage,
  CloudQueue,
  TrendingUp,
  Settings,
  Visibility,
  Clear
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface CacheStatistics {
  redis: {
    totalKeys: number;
    hitCount: number;
    missCount: number;
    hitRatio: number;
    memoryUsage: number;
    connectedClients: number;
  };
  apiCache: {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRatio: number;
    totalCachedItems: number;
    totalCacheSize: number;
    hitsByEndpoint: Record<string, number>;
    averageResponseTimesByEndpoint: Record<string, number>;
  };
  cdn: {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRatio: number;
    bandwidthUsed: number;
    storageUsed: number;
    edgeLocations: number;
    averageResponseTime: number;
  };
}

interface EdgeLocation {
  id: string;
  name: string;
  country: string;
  region: string;
  isActive: boolean;
  loadPercentage: number;
}

interface CachedItem {
  key: string;
  createdAt: string;
  expiresAt: string;
  sizeBytes: number;
  hitCount: number;
  tags: string[];
  contentType: string;
}

const CacheOptimizationDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<CacheStatistics | null>(null);
  const [edgeLocations, setEdgeLocations] = useState<EdgeLocation[]>([]);
  const [cachedItems, setCachedItems] = useState<CachedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [invalidateDialogOpen, setInvalidateDialogOpen] = useState(false);
  const [warmupDialogOpen, setWarmupDialogOpen] = useState(false);
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);

  // Form states
  const [invalidateKey, setInvalidateKey] = useState('');
  const [invalidatePattern, setInvalidatePattern] = useState('');
  const [invalidateTag, setInvalidateTag] = useState('');
  const [selectedInvalidationType, setSelectedInvalidationType] = useState<'key' | 'pattern' | 'tag'>('key');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [statsResponse, edgeResponse, itemsResponse] = await Promise.all([
        fetch('/api/cache/statistics'),
        fetch('/api/cache/cdn/edge-locations'),
        fetch('/api/cache/items')
      ]);

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setStatistics(stats);
      }

      if (edgeResponse.ok) {
        const edges = await edgeResponse.json();
        setEdgeLocations(edges);
      }

      if (itemsResponse.ok) {
        const items = await itemsResponse.json();
        setCachedItems(items);
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch cache data');
      console.error('Error fetching cache data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleInvalidateCache = async () => {
    try {
      let url = '';
      let body = null;

      switch (selectedInvalidationType) {
        case 'key':
          url = `/api/cache/invalidate/${encodeURIComponent(invalidateKey)}`;
          break;
        case 'pattern':
          url = '/api/cache/invalidate/pattern';
          body = JSON.stringify({ pattern: invalidatePattern });
          break;
        case 'tag':
          url = `/api/cache/invalidate/tag/${encodeURIComponent(invalidateTag)}`;
          break;
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body
      });

      if (response.ok) {
        setInvalidateDialogOpen(false);
        fetchData();
        // Show success message
      } else {
        setError('Failed to invalidate cache');
      }
    } catch (err) {
      setError('Error invalidating cache');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const getHitRatioColor = (ratio: number): string => {
    if (ratio >= 0.8) return '#4caf50';
    if (ratio >= 0.6) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}><>

        <Typography variant="h4" gutterBottom>Cache & Optimization Dashboard</Typography>
        <LinearProgress
</>
/>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}><>

        <Typography variant="h4">Cache & Optimization Dashboard</Typography>
        <Box
</>
</>><>

          <Button
            startIcon={<Refresh />}
            onClick={fetchData}
            disabled={refreshing}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
</>

            startIcon={<Delete />}
            onClick={() => setInvalidateDialogOpen(true)}
            color="warning"
            sx={{ mr: 1 }}
          >
            Invalidate Cache
          </Button>
          <Button
            startIcon={<Settings />}
            onClick={() => setRulesDialogOpen(true)}
          >
            Cache Rules
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {statistics && (
          {/* Key Performance Indicators */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Speed sx={{ mr: 1, color: '#1976d2' }} />
                    <Typography variant="h6">Redis Cache</Typography>
                  </Box><>

                  <Typography variant="h4" sx={{ color: getHitRatioColor(statistics.redis.hitRatio) }}>
                    {(statistics.redis.hitRatio * 100).toFixed(1)}%
                  </Typography>
                  <Typography
</>
variant="body2" color="text.secondary">
                    Hit Ratio ({formatNumber(statistics.redis.hitCount)} hits)
                  </Typography>
                  <Typography variant="caption" display="block">
                    {formatNumber(statistics.redis.totalKeys)} keys, {formatBytes(statistics.redis.memoryUsage)} used
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Storage sx={{ mr: 1, color: '#388e3c' }} />
                    <Typography variant="h6">API Cache</Typography>
                  </Box><>

                  <Typography variant="h4" sx={{ color: getHitRatioColor(statistics.apiCache.hitRatio) }}>
                    {(statistics.apiCache.hitRatio * 100).toFixed(1)}%
                  </Typography>
                  <Typography
</>
variant="body2" color="text.secondary">
                    Hit Ratio ({formatNumber(statistics.apiCache.totalRequests)} requests)
                  </Typography>
                  <Typography variant="caption" display="block">
                    {formatNumber(statistics.apiCache.totalCachedItems)} items, {formatBytes(statistics.apiCache.totalCacheSize)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CloudQueue sx={{ mr: 1, color: '#f57c00' }} />
                    <Typography variant="h6">CDN</Typography>
                  </Box><>

                  <Typography variant="h4" sx={{ color: getHitRatioColor(statistics.cdn.hitRatio) }}>
                    {(statistics.cdn.hitRatio * 100).toFixed(1)}%
                  </Typography>
                  <Typography
</>
variant="body2" color="text.secondary">
                    Hit Ratio ({formatNumber(statistics.cdn.totalRequests)} requests)
                  </Typography>
                  <Typography variant="caption" display="block">
                    {statistics.cdn.edgeLocations} edge locations, {statistics.cdn.averageResponseTime}ms avg
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUp sx={{ mr: 1, color: '#7b1fa2' }} />
                    <Typography variant="h6">Bandwidth</Typography>
                  </Box><>

                  <Typography variant="h4">
                    {formatBytes(statistics.cdn.bandwidthUsed)}
                  </Typography>
                  <Typography
</>
variant="body2" color="text.secondary">
                    Total Bandwidth Used
                  </Typography>
                  <Typography variant="caption" display="block">
                    {formatBytes(statistics.cdn.storageUsed)} storage
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Cache Performance Charts */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent><>

                  <Typography variant="h6" gutterBottom>Cache Hit Ratios</Typography>
                  <ResponsiveContainer
</>
width="100%" height={300}>
                    <BarChart data={[
                      { name: 'Redis', hitRatio: statistics.redis.hitRatio * 100, color: '#1976d2' },
                      { name: 'API Cache', hitRatio: statistics.apiCache.hitRatio * 100, color: '#388e3c' },
                      { name: 'CDN', hitRatio: statistics.cdn.hitRatio * 100, color: '#f57c00' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Hit Ratio']} />
                      <Bar dataKey="hitRatio" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent><>

                  <Typography variant="h6" gutterBottom>API Endpoint Performance</Typography>
                  <ResponsiveContainer
</>
width="100%" height={300}>
                    <BarChart data={Object.entries(statistics.apiCache.averageResponseTimesByEndpoint).map(([endpoint, time]) => ({
                      endpoint: endpoint.split('/').pop() || endpoint,
                      responseTime: time
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="endpoint" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => [`${value}ms`, 'Avg Response Time']} />
                      <Bar dataKey="responseTime" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Edge Locations */}
          {edgeLocations.length > 0 && (
            <Card sx={{ mb: 4 }}>
              <CardContent><>

                <Typography variant="h6" gutterBottom>CDN Edge Locations</Typography>
                <TableContainer
</>
</>>
                  <Table>
                    <TableHead>
                      <TableRow><>

                        <TableCell>Location</TableCell>
                        <TableCell
</>
</>>Region</TableCell><>

                        <TableCell>Status</TableCell>
                        <TableCell
</>
</>>Load</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {edgeLocations.slice(0, 10).map((location) => (
                        <TableRow key={location.id}><>

                          <TableCell>{location.name}</TableCell>
                          <TableCell
</>
</>>{location.region}</TableCell>
                          <TableCell><>

                            <Chip
                              label={location.isActive ? 'Active' : 'Inactive'}
                              color={location.isActive ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell
</>
</>>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LinearProgress
                                variant="determinate"
                                value={location.loadPercentage}
                                sx={{ width: 100, mr: 1 }}
                              />
                              <Typography variant="caption">
                                {location.loadPercentage.toFixed(0)}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
      )}

      {/* Cache Invalidation Dialog */}
      <Dialog open={invalidateDialogOpen} onClose={() => setInvalidateDialogOpen(false)} maxWidth="sm" fullWidth><>

        <DialogTitle>Invalidate Cache</DialogTitle>
        <DialogContent
</>
</>>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}><>

            <InputLabel>Invalidation Type</InputLabel>
            <Select
</>

              value={selectedInvalidationType}
              onChange={(e) => setSelectedInvalidationType(e.target.value as 'key' | 'pattern' | 'tag')}
            ><>

              <MenuItem value="key">By Key</MenuItem>
              <MenuItem
</>
value="pattern">By Pattern</MenuItem>
              <MenuItem value="tag">By Tag</MenuItem>
            </Select>
          </FormControl>

          {selectedInvalidationType === 'key' && (
            <TextField
              fullWidth
              label="Cache Key"
              value={invalidateKey}
              onChange={(e) => setInvalidateKey(e.target.value)}
              placeholder="Enter cache key to invalidate"
            />
          )}

          {selectedInvalidationType === 'pattern' && (
            <TextField
              fullWidth
              label="Pattern"
              value={invalidatePattern}
              onChange={(e) => setInvalidatePattern(e.target.value)}
              placeholder="Enter pattern (e.g., api:users:*)"
            />
          )}

          {selectedInvalidationType === 'tag' && (<>

            <TextField
              fullWidth
              label="Tag"
              value={invalidateTag}
              onChange={(e) => setInvalidateTag(e.target.value)}
              placeholder="Enter tag to invalidate"
            />
          )}
        </DialogContent>
        <DialogActions
</>
</>><>

          <Button onClick={() => setInvalidateDialogOpen(false)}>Cancel</Button>
          <Button
</>
onClick={handleInvalidateCache} color="warning" variant="contained">
            Invalidate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CacheOptimizationDashboard;
