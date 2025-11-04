/**
 * Correlation Matrix Component
 * Visual representation of data relationships
 * Elite Power User - Causality Analysis
 */

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { LiveMetrics, CorrelationMatrix as CorrelationMatrixType } from '../../types/pacs';
import { calculateCorrelationMatrix } from '../../utils/statistics';

interface CorrelationMatrixProps {
  metrics: LiveMetrics;
  showSignificance?: boolean;
}

const CorrelationMatrixComponent: React.FC<CorrelationMatrixProps> = ({
  metrics,
  showSignificance = true,
}) => {
  const theme = useTheme();
  const matrix: CorrelationMatrixType = useMemo(() => {
    return calculateCorrelationMatrix(metrics);
  }, [metrics]);

  const getCorrelationColor = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue >= 0.8) return theme.palette.error.main;
    if (absValue >= 0.6) return theme.palette.warning.main;
    if (absValue >= 0.4) return theme.palette.info.main;
    if (absValue >= 0.2) return theme.palette.success.light;
    return theme.palette.grey[300];
  };

  const getCorrelationStrength = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue >= 0.8) return 'Very Strong';
    if (absValue >= 0.6) return 'Strong';
    if (absValue >= 0.4) return 'Moderate';
    if (absValue >= 0.2) return 'Weak';
    return 'Very Weak';
  };

  if (!matrix || matrix.variables.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Insufficient data for correlation analysis
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        Correlation Analysis
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, zIndex: 2, backgroundColor: 'background.paper' }}>
                Variable
              </TableCell>
              {matrix.variables.map((variable) => (
                <TableCell
                  key={variable}
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    minWidth: 80,
                    backgroundColor: 'background.paper',
                  }}
                >
                  {variable.replace(/([A-Z])/g, ' $1').trim().substring(0, 12)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {matrix.variables.map((rowVar, rowIndex) => (
              <TableRow key={rowVar}>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    backgroundColor: 'background.paper',
                  }}
                >
                  {rowVar.replace(/([A-Z])/g, ' $1').trim().substring(0, 15)}
                </TableCell>
                {matrix.variables.map((colVar, colIndex) => {
                  const correlation = matrix.correlations[rowIndex][colIndex];
                  const significance = showSignificance ? matrix.significance[rowIndex][colIndex] : 1;
                  const isDiagonal = rowIndex === colIndex;
                  const isSignificant = significance < 0.05;

                  return (
                    <TableCell
                      key={colVar}
                      align="center"
                      sx={{
                        backgroundColor: isDiagonal
                          ? theme.palette.grey[100]
                          : getCorrelationColor(correlation),
                        color: isDiagonal ? 'text.secondary' : 'text.primary',
                        fontWeight: isDiagonal ? 'bold' : 'normal',
                        position: 'relative',
                      }}
                    >
                      <Tooltip
                        title={
                          isDiagonal
                            ? 'Self-correlation (always 1.0)'
                            : `${getCorrelationStrength(correlation)} ${correlation > 0 ? 'positive' : 'negative'} correlation${!isSignificant ? ' (not significant)' : ''}`
                        }
                        arrow
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: 'help',
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 'bold',
                              color: isDiagonal ? 'text.secondary' : 'white',
                            }}
                          >
                            {isDiagonal ? '1.00' : correlation.toFixed(2)}
                          </Typography>
                          {!isDiagonal && (
                            <Box
                              sx={{
                                width: Math.abs(correlation) * 50,
                                height: 4,
                                backgroundColor: 'rgba(255,255,255,0.8)',
                                borderRadius: 1,
                              }}
                            />
                          )}
                          {showSignificance && !isDiagonal && (
                            <Chip
                              label={isSignificant ? 'p&lt;0.05' : 'ns'}
                              size="small"
                              color={isSignificant ? 'success' : 'default'}
                              sx={{ height: 16, fontSize: '0.6rem' }}
                            />
                          )}
                        </Box>
                      </Tooltip>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Correlation Strength:
        </Typography>
        <Chip label="Very Strong (≥0.8)" size="small" sx={{ backgroundColor: theme.palette.error.main, color: 'white' }} />
        <Chip label="Strong (≥0.6)" size="small" sx={{ backgroundColor: theme.palette.warning.main, color: 'white' }} />
        <Chip label="Moderate (≥0.4)" size="small" sx={{ backgroundColor: theme.palette.info.main, color: 'white' }} />
        <Chip label="Weak (≥0.2)" size="small" sx={{ backgroundColor: theme.palette.success.light, color: 'white' }} />
        <Chip label="Very Weak (&lt;0.2)" size="small" sx={{ backgroundColor: theme.palette.grey[300] }} />
      </Box>
    </Box>
  );
};

// Export default
export default CorrelationMatrixComponent;

