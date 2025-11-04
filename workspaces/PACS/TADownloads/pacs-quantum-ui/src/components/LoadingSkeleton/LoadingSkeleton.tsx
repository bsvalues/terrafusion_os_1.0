/**
 * Loading Skeleton Components
 * Elite Power User - Professional Loading States
 */

import React from 'react';
import { Box, Skeleton, Paper, Grid } from '@mui/material';

export const DashboardSkeleton: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
      <Skeleton variant="text" width={200} height={24} sx={{ mb: 4 }} />
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Paper sx={{ p: 2 }}>
              <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="rectangular" width="100%" height={20} sx={{ mt: 1, borderRadius: 1 }} />
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Skeleton variant="text" width={200} height={24} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1 }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1 }} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export const QueryBuilderSkeleton: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width={250} height={40} sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Skeleton variant="text" width={120} height={24} sx={{ mb: 2 }} />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" width="100%" height={40} sx={{ mb: 1, borderRadius: 1 }} />
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2 }}>
            <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 1 }} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 4 }) => {
  return (
    <Box>
      <Skeleton variant="rectangular" width="100%" height={48} sx={{ mb: 1, borderRadius: 1 }} />
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: 'flex', gap: 1, mb: 1 }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="rectangular"
              width={`${100 / columns}%`}
              height={48}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => {
  return (
    <Box>
      <Skeleton variant="text" width={200} height={24} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 1 }} />
    </Box>
  );
};

export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <Box>
      {Array.from({ length: items }).map((_, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

