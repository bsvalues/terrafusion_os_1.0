import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Dashboard, Add, Refresh } from '@mui/icons-material';
import { Costforge_aiService } from '../services/Costforge_aiService';
import { Costforge_aiDto, PagedResult } from '../types/Costforge_aiTypes';

interface Costforge_aiDashboardProps {
  title?: string;
}

export const Costforge_aiDashboard: React.FC<Costforge_aiDashboardProps> = ({
  title = "costforge-ai Dashboard"
}) => {
  const [data, setData] = useState<PagedResult<Costforge_aiDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await Costforge_aiService.getAll(1, 20);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Dashboard sx={{ mr: 2 }} />
              {title}
            </Typography>
            <div>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadData}
                sx={{ mr: 2 }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                color="primary"
              >
                Add New
              </Button>
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Records
              </Typography>
              <Typography variant="h5" component="div">
                {data?.totalCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Current Page
              </Typography>
              <Typography variant="h5" component="div">
                {data?.page || 1} of {Math.ceil((data?.totalCount || 0) / (data?.pageSize || 1))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Module Status
              </Typography>
              <Typography variant="h5" component="div" color="success.main">
                Operational
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Data grid would go here */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Module Data
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Implement your data grid component here using @mui/x-data-grid
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Costforge_aiDashboard;
