'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, CircularProgress } from '@mui/material';
import { CheckCircle, Warning, Info } from '@mui/icons-material';

interface HealthStatus {
  status: string;
  services: {
    api: boolean;
    consciousness: boolean;
    portal: boolean;
  };
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check backend health
    const checkHealth = async () => {
      try {
        // Simulate health check (you can replace with actual API call)
        setTimeout(() => {
          setHealth({
            status: 'operational',
            services: {
              api: false, // Backend not running yet
              consciousness: false,
              portal: true,
            },
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Health check failed:', error);
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 900,
          width: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              TerraFusion Portal
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Government. Transcended.
            </Typography>
            <Chip
              label="Next.js Portal Active"
              color="success"
              icon={<CheckCircle />}
              sx={{ fontSize: '1rem', py: 2.5, px: 1 }}
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {loading ? (
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                    ) : health?.services.portal ? (
                      <CheckCircle color="success" sx={{ mr: 1 }} />
                    ) : (
                      <Warning color="warning" sx={{ mr: 1 }} />
                    )}
                    <Typography variant="h6">Portal Frontend</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Next.js 14 + React 18
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    Running on port 3000
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {health?.services.api ? (
                      <CheckCircle color="success" sx={{ mr: 1 }} />
                    ) : (
                      <Warning color="warning" sx={{ mr: 1 }} />
                    )}
                    <Typography variant="h6">Backend API</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    TerraFusion.API (.NET 8)
                  </Typography>
                  <Typography variant="caption" color="warning.main">
                    Waiting on port 5001
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {health?.services.consciousness ? (
                      <CheckCircle color="success" sx={{ mr: 1 }} />
                    ) : (
                      <Warning color="warning" sx={{ mr: 1 }} />
                    )}
                    <Typography variant="h6">AI Consciousness</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    50,000+ AI Agents
                  </Typography>
                  <Typography variant="caption" color="warning.main">
                    Waiting on port 3004
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, p: 3, bgcolor: 'info.lighter', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Info color="info" sx={{ mr: 1, mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Next Steps
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  The portal frontend is running successfully! To complete the full stack:
                </Typography>
                <Typography variant="body2" component="div" color="text.secondary">
                  1. <strong>Start Backend API:</strong> <code>cd backend && dotnet run --project TerraFusion.API</code>
                  <br />
                  2. <strong>Start AI Engine:</strong> <code>dotnet run --project TerraFusion.Consciousness --urls "http://localhost:3004"</code>
                  <br />
                  3. <strong>Refresh this page</strong> to see full system status
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              TerraFusion OS v1.0 | Multi-County Government AI Platform
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
