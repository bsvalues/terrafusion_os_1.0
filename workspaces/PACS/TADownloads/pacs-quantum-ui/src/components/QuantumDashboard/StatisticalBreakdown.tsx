/**
 * Statistical Breakdown Component
 * Deep statistical analysis for any metric
 * Elite Power User - Statistical Decomposition
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Analytics,
  ShowChart,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import type { StatisticalAnalysis } from '../../types/pacs';
import { calculateStatistics } from '../../utils/statistics';

interface StatisticalBreakdownProps {
  metricId: string;
  metricValue: number;
  historicalData?: number[];
  onClose?: () => void;
}

export const StatisticalBreakdown: React.FC<StatisticalBreakdownProps> = ({
  metricId,
  metricValue,
  historicalData,
  onClose,
}) => {
  const theme = useTheme();
  const [statistics, setStatistics] = useState<StatisticalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['summary', 'distribution']);

  useEffect(() => {
    if (historicalData && historicalData.length > 0) {
      calculateStatisticsFromData(historicalData);
    } else {
      // Generate mock statistics for demonstration
      generateMockStatistics();
    }
  }, [metricId, metricValue, historicalData]);

  const calculateStatisticsFromData = (data: number[]) => {
    setIsLoading(true);
    try {
      const stats = calculateStatistics(data);
      setStatistics(stats);
    } catch (error) {
      console.error('Error calculating statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockStatistics = () => {
    // Generate realistic mock statistics
    const mean = metricValue;
    const stdDev = mean * 0.15; // 15% standard deviation
    const variance = stdDev * stdDev;
    const median = mean * 0.98;
    const mode = mean * 0.95;
    const min = mean * 0.7;
    const max = mean * 1.3;
    const q1 = mean * 0.85;
    const q2 = median;
    const q3 = mean * 1.15;

    // Generate outliers (values beyond 2 standard deviations)
    const outliers: number[] = [];
    for (let i = 0; i < 5; i++) {
      if (Math.random() > 0.7) {
        outliers.push(mean + (Math.random() > 0.5 ? 1 : -1) * stdDev * 2.5);
      }
    }

    // Generate distribution bins
    const binCount = 20;
    const binWidth = (max - min) / binCount;
    const distribution = Array.from({ length: binCount }, (_, i) => {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      // Normal distribution approximation
      const center = (binStart + binEnd) / 2;
      const distance = Math.abs(center - mean) / stdDev;
      const frequency = Math.exp(-(distance * distance) / 2);
      const count = Math.round(frequency * 1000);
      return {
        bin: `${binStart.toFixed(0)}-${binEnd.toFixed(0)}`,
        count,
        frequency: frequency * 100,
      };
    });

    setStatistics({
      mean,
      median,
      mode,
      standardDeviation: stdDev,
      variance,
      min,
      max,
      quartiles: { q1, q2, q3 },
      outliers,
      distribution,
    });
  };

  const handleSectionToggle = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  if (isLoading || !statistics) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Calculating statistics...</Typography>
      </Paper>
    );
  }

  const zScore = (metricValue - statistics.mean) / statistics.standardDeviation;
  const percentile = calculatePercentile(metricValue, statistics);

  return (
    <Paper sx={{ p: 3, maxHeight: '80vh', overflow: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Statistical Breakdown: {metricId.replace(/([A-Z])/g, ' $1').trim()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive statistical analysis and decomposition
          </Typography>
        </Box>
        {onClose && (
          <Chip label="Close" onClick={onClose} color="primary" sx={{ cursor: 'pointer' }} />
        )}
      </Box>

      {/* Summary Statistics */}
      <Accordion
        expanded={expandedSections.includes('summary')}
        onChange={() => handleSectionToggle('summary')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Analytics color="primary" />
            <Typography variant="h6">Summary Statistics</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Mean (μ)
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {statistics.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Median (Q₂)
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {statistics.median.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Mode
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {statistics.mode.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Std Dev (σ)
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {statistics.standardDeviation.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Current Value Analysis
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <strong>Current Value</strong>
                    </TableCell>
                    <TableCell>{metricValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${zScore > 0 ? '+' : ''}${zScore.toFixed(2)}σ`}
                        color={Math.abs(zScore) > 2 ? 'error' : Math.abs(zScore) > 1 ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <strong>Z-Score</strong>
                    </TableCell>
                    <TableCell>{zScore.toFixed(4)}</TableCell>
                    <TableCell>
                      {Math.abs(zScore) > 2 ? (
                        <Chip label="Outlier" color="error" size="small" />
                      ) : Math.abs(zScore) > 1 ? (
                        <Chip label="Unusual" color="warning" size="small" />
                      ) : (
                        <Chip label="Normal" color="success" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <strong>Percentile</strong>
                    </TableCell>
                    <TableCell>{percentile.toFixed(2)}%</TableCell>
                    <TableCell>
                      <Chip
                        label={percentile > 75 ? 'Above 75th' : percentile > 50 ? 'Above Median' : 'Below Median'}
                        color={percentile > 75 ? 'success' : percentile > 50 ? 'info' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Quartiles & Range */}
      <Accordion
        expanded={expandedSections.includes('quartiles')}
        onChange={() => handleSectionToggle('quartiles')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShowChart color="primary" />
            <Typography variant="h6">Quartiles & Range</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Minimum
                  </Typography>
                  <Typography variant="h6">{statistics.min.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Q₁ (25th Percentile)
                  </Typography>
                  <Typography variant="h6">{statistics.quartiles.q1.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Q₂ (50th Percentile)
                  </Typography>
                  <Typography variant="h6">{statistics.quartiles.q2.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Q₃ (75th Percentile)
                  </Typography>
                  <Typography variant="h6">{statistics.quartiles.q3.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Maximum
                  </Typography>
                  <Typography variant="h6">{statistics.max.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Range (IQR)
                  </Typography>
                  <Typography variant="h6">
                    {(statistics.quartiles.q3 - statistics.quartiles.q1).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Distribution */}
      <Accordion
        expanded={expandedSections.includes('distribution')}
        onChange={() => handleSectionToggle('distribution')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShowChart color="primary" />
            <Typography variant="h6">Distribution Analysis</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Bin Range</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Frequency %</TableCell>
                  <TableCell>Visualization</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statistics.distribution.map((bin, index) => (
                  <TableRow key={index}>
                    <TableCell>{bin.bin}</TableCell>
                    <TableCell align="right">{bin.count}</TableCell>
                    <TableCell align="right">{bin.frequency.toFixed(2)}%</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          width: '100%',
                          height: 20,
                          backgroundColor: theme.palette.grey[200],
                          borderRadius: 1,
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${bin.frequency}%`,
                            height: '100%',
                            backgroundColor: theme.palette.primary.main,
                            opacity: 0.7,
                          }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Outliers */}
      {statistics.outliers.length > 0 && (
        <Accordion
          expanded={expandedSections.includes('outliers')}
          onChange={() => handleSectionToggle('outliers')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">Detected Outliers ({statistics.outliers.length})</Typography>
              <Chip label={`${statistics.outliers.length} found`} color="warning" size="small" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {statistics.outliers.map((outlier, index) => (
                <Chip
                  key={index}
                  label={outlier.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  color="error"
                  variant="outlined"
                />
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Outliers are values beyond 2 standard deviations from the mean (|Z| &gt; 2)
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
};

function calculatePercentile(value: number, stats: StatisticalAnalysis): number {
  // Simplified percentile calculation
  if (value <= stats.min) return 0;
  if (value >= stats.max) return 100;
  if (value <= stats.quartiles.q1) return 25;
  if (value <= stats.quartiles.q2) return 50;
  if (value <= stats.quartiles.q3) return 75;
  // Interpolate between quartiles
  if (value < stats.quartiles.q2) {
    return 25 + ((value - stats.quartiles.q1) / (stats.quartiles.q2 - stats.quartiles.q1)) * 25;
  }
  return 50 + ((value - stats.quartiles.q2) / (stats.quartiles.q3 - stats.quartiles.q2)) * 25;
}

