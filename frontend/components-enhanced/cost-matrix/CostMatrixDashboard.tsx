import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Calculate as CalculateIcon,
  Download as DownloadIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface CostMatrix {
  id: number;
  region: string;
  buildingType: string;
  buildingTypeDescription: string;
  baseCost: number;
  matrixYear: number;
  sourceMatrixId: number;
  matrixDescription: string;
  dataPoints: number;
  minCost: number;
  maxCost: number;
  county: string;
  state: string;
  adjustmentFactors: string;
  costPerSqFt: number;
  adjustmentFactor: number;
  createdAt: string;
  updatedAt: string;
  effectiveDate?: string;
}

interface CostCalculationRequest {
  county: string;
  region: string;
  buildingType: string;
  squareFootage: number;
  adjustmentFactors?: {
    complexity: number;
    quality: number;
    condition: number;
  };
}

interface CostCalculationResult {
  county: string;
  region: string;
  buildingType: string;
  squareFootage: number;
  baseCostPerSqFt: number;
  totalCost: number;
  adjustmentFactors?: {
    complexity: number;
    quality: number;
    condition: number;
  };
  calculatedAt: string;
}

interface CostMatrixMetadata {
  counties: string[];
  regions: string[];
  buildingTypes: { code: string; description: string }[];
  totalMatrices: number;
  lastUpdated: string;
}

const CostMatrixDashboard: React.FC = () => {
  const [matrices, setMatrices] = useState<CostMatrix[]>([]);
  const [metadata, setMetadata] = useState<CostMatrixMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculationResult, setCalculationResult] = useState<CostCalculationResult | null>(null);

  // Filter states
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedBuildingType, setSelectedBuildingType] = useState('');

  // Calculation form states
  const [calcCounty, setCalcCounty] = useState('');
  const [calcRegion, setCalcRegion] = useState('');
  const [calcBuildingType, setCalcBuildingType] = useState('');
  const [squareFootage, setSquareFootage] = useState<number>(1000);
  const [complexity, setComplexity] = useState<number>(1.0);
  const [quality, setQuality] = useState<number>(1.0);
  const [condition, setCondition] = useState<number>(1.0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMatrices();
  }, [selectedCounty, selectedRegion]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load metadata
      const metadataResponse = await fetch('/api/costmatrix/metadata');
      if (!metadataResponse.ok) throw new Error('Failed to load metadata');
      const metadataData = await metadataResponse.json();
      setMetadata(metadataData);

      // Load initial matrices
      await loadMatrices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadMatrices = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCounty) params.append('county', selectedCounty);
      if (selectedRegion) params.append('region', selectedRegion);

      const response = await fetch(`/api/costmatrix?${params}`);
      if (!response.ok) throw new Error('Failed to load cost matrices');
      
      const data = await response.json();
      setMatrices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matrices');
    }
  };

  const refreshMatrices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/costmatrix/refresh', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to refresh matrices');
      
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh matrices');
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = async () => {
    if (!calcCounty || !calcRegion || !calcBuildingType || !squareFootage) {
      setError('Please fill in all required fields for calculation');
      return;
    }

    try {
      setCalculating(true);
      setError(null);

      const request: CostCalculationRequest = {
        county: calcCounty,
        region: calcRegion,
        buildingType: calcBuildingType,
        squareFootage,
        adjustmentFactors: {
          complexity,
          quality,
          condition
        }
      };

      const response = await fetch('/api/costmatrix/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) throw new Error('Failed to calculate cost');
      
      const result = await response.json();
      setCalculationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate cost');
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cost Matrix Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Metadata Summary */}
      {metadata && (
        <Card sx={{ mb: 3 }}>
          <CardContent><>

            <Typography variant="h6" gutterBottom>
              System Overview
            </Typography>
            <Grid
</>
container spacing={2}>
              <Grid item xs={12} sm={3}><>

                <Typography variant="body2" color="textSecondary">
                  Total Matrices
                </Typography>
                <Typography
</>
variant="h6">
                  {metadata.totalMatrices.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}><>

                <Typography variant="body2" color="textSecondary">
                  Counties
                </Typography>
                <Typography
</>
variant="h6">
                  {metadata.counties.length}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}><>

                <Typography variant="body2" color="textSecondary">
                  Regions
                </Typography>
                <Typography
</>
variant="h6">
                  {metadata.regions.length}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}><>

                <Typography variant="body2" color="textSecondary">
                  Building Types
                </Typography>
                <Typography
</>
variant="h6">
                  {metadata.buildingTypes.length}
                </Typography>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Last Updated: {formatDate(metadata.lastUpdated)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Cost Calculator */}
      <Card sx={{ mb: 3 }}>
        <CardContent><>

          <Typography variant="h6" gutterBottom>
            Cost Calculator
          </Typography>
          <Grid
</>
container spacing={2}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth><>

                <InputLabel>County</InputLabel>
                <Select
</>

                  value={calcCounty}
                  onChange={(e) => setCalcCounty(e.target.value)}
                  label="County"
                >
                  {metadata?.counties.map((county) => (
                    <MenuItem key={county} value={county}>
                      {county}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth><>

                <InputLabel>Region</InputLabel>
                <Select
</>

                  value={calcRegion}
                  onChange={(e) => setCalcRegion(e.target.value)}
                  label="Region"
                >
                  {metadata?.regions.map((region) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth><>

                <InputLabel>Building Type</InputLabel>
                <Select
</>

                  value={calcBuildingType}
                  onChange={(e) => setCalcBuildingType(e.target.value)}
                  label="Building Type"
                >
                  {metadata?.buildingTypes.map((bt) => (
                    <MenuItem key={bt.code} value={bt.code}>
                      {bt.code} - {bt.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}><>

              <TextField
                fullWidth
                label="Square Footage"
                type="number"
                value={squareFootage}
                onChange={(e) => setSquareFootage(Number(e.target.value))}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid
</>
item xs={12} sm={4}><>

              <TextField
                fullWidth
                label="Complexity Factor"
                type="number"
                value={complexity}
                onChange={(e) => setComplexity(Number(e.target.value))}
                inputProps={{ min: 0.1, max: 3.0, step: 0.1 }}
              />
            </Grid>
            <Grid
</>
item xs={12} sm={4}><>

              <TextField
                fullWidth
                label="Quality Factor"
                type="number"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                inputProps={{ min: 0.1, max: 3.0, step: 0.1 }}
              />
            </Grid>
            <Grid
</>
item xs={12} sm={4}><>

              <TextField
                fullWidth
                label="Condition Factor"
                type="number"
                value={condition}
                onChange={(e) => setCondition(Number(e.target.value))}
                inputProps={{ min: 0.1, max: 3.0, step: 0.1 }}
              />
            </Grid>
            <Grid
</>
item xs={12}>
              <Button
                variant="contained"
                startIcon={<CalculateIcon />}
                onClick={calculateCost}
                disabled={calculating}
                sx={{ mr: 2 }}
              >
                {calculating ? 'Calculating...' : 'Calculate Cost'}
              </Button>
            </Grid>
          </Grid>

          {/* Calculation Result */}
          {calculationResult && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}><>

              <Typography variant="h6" gutterBottom>
                Calculation Result
              </Typography>
              <Grid
</>
container spacing={2}>
                <Grid item xs={12} sm={6}><>

                  <Typography variant="body2" color="textSecondary">
                    Base Cost per Sq Ft
                  </Typography>
                  <Typography
</>
variant="h6">
                    {formatCurrency(calculationResult.baseCostPerSqFt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}><>

                  <Typography variant="body2" color="textSecondary">
                    Total Estimated Cost
                  </Typography>
                  <Typography
</>
variant="h4" color="primary">
                    {formatCurrency(calculationResult.totalCost)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}><>

            <Typography variant="h6">
              Cost Matrices ({matrices.length})
            </Typography>
            <Box
</>
</>>
              <Tooltip title="Refresh matrices from data files">
                <IconButton onClick={refreshMatrices} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><>

                <InputLabel>Filter by County</InputLabel>
                <Select
</>

                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  label="Filter by County"
                >
                  <MenuItem value="">All Counties</MenuItem>
                  {metadata?.counties.map((county) => (
                    <MenuItem key={county} value={county}>
                      {county}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><>

                <InputLabel>Filter by Region</InputLabel>
                <Select
</>

                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  label="Filter by Region"
                >
                  <MenuItem value="">All Regions</MenuItem>
                  {metadata?.regions.map((region) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Cost Matrices Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow><>

                  <TableCell>County</TableCell>
                  <TableCell
</>
</>>Region</TableCell><>

                  <TableCell>Building Type</TableCell>
                  <TableCell
</>
</>>Description</TableCell><>

                  <TableCell align="right">Base Cost</TableCell>
                  <TableCell
</>
align="right">Min Cost</TableCell><>

                  <TableCell align="right">Max Cost</TableCell>
                  <TableCell
</>
align="center">Data Points</TableCell><>

                  <TableCell align="center">Year</TableCell>
                  <TableCell
</>
align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matrices.map((matrix) => (
                  <TableRow key={matrix.id}>
                    <TableCell><>

                      <Chip label={matrix.county} size="small" />
                    </TableCell>
                    <TableCell
</>
</>>{matrix.region}</TableCell><>

                    <TableCell>{matrix.buildingType}</TableCell>
                    <TableCell
</>
</>>{matrix.buildingTypeDescription}</TableCell><>

                    <TableCell align="right">
                      {formatCurrency(matrix.baseCost)}
                    </TableCell>
                    <TableCell
</>
align="right">
                      {formatCurrency(matrix.minCost)}
                    </TableCell><>

                    <TableCell align="right">
                      {formatCurrency(matrix.maxCost)}
                    </TableCell>
                    <TableCell
</>
align="center">{matrix.dataPoints}</TableCell><>

                    <TableCell align="center">{matrix.matrixYear}</TableCell>
                    <TableCell
</>
align="center">
                      <Tooltip title={matrix.matrixDescription}>
                        <IconButton size="small">
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CostMatrixDashboard;
