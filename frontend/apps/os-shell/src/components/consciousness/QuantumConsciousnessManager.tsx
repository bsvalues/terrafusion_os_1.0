import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Slider,
  Chip,
  Button,
  Stack,
  Avatar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Hub,
  Memory,
  TravelExplore,
  BarChart,
  AutoAwesome,
  AllInclusive,
} from '@mui/icons-material';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StyledCard = styled(Card)(({ theme }) => ({
  background:
    'linear-gradient(135deg, hsl(var(--tf-accent-quantum-hs) 16% / 0.1), hsl(var(--tf-accent-quantum-hs) 8% / 0.2))',
  backdropFilter: 'blur(20px)',
  border: '1px solid hsl(var(--tf-accent-quantum-hs) 79% / 0.2)',
  borderRadius: '16px',
  height: '100%',
}));

const QuantumSlider = styled(Slider)(({ theme }) => ({
  color: 'var(--tf-accent-quantum)',
  '& .MuiSlider-thumb': {
    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0px 0px 0px 8px hsl(var(--tf-accent-quantum-hs) 82% / 0.16)`,
    },
  },
}));

const QuantumConsciousnessManager: React.FC = () => {
  const [quantumCoherence, setQuantumCoherence] = useState<number>(98);
  const [activeProtocol, setActiveProtocol] = useState<string>('Adaptive Intelligence');
  const [systemState, setSystemState] = useState<string>('Stable');

  useEffect(() => {
    const fetchManagerState = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/consciousness/manager-state`);
        if (response.ok) {
          const data = await response.json();
          setQuantumCoherence(data.quantumCoherence);
          setActiveProtocol(data.activeProtocol);
          setSystemState(data.systemState);
        }
      } catch (error) {
        console.error('Failed to fetch manager state:', error);
      }
    };
    fetchManagerState();
  }, []);

  const updateManagerState = async (newState: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/consciousness/manager-state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newState),
      });
      if (response.ok) {
        const data = await response.json();
        setQuantumCoherence(data.quantumCoherence);
        setActiveProtocol(data.activeProtocol);
        setSystemState(data.systemState);
      }
    } catch (error) {
      console.error('Failed to update manager state:', error);
    }
  };

  const handleCoherenceChange = (event: Event, newValue: number | number[]) => {
    const newCoherence = newValue as number;
    setQuantumCoherence(newCoherence);
    updateManagerState({ quantumCoherence: newCoherence });
  };

  const handleProtocolChange = (protocol: string) => {
    setActiveProtocol(protocol);
    updateManagerState({ activeProtocol: protocol });
  };

  const protocols = [
    'Species Neutrality',
    'Consciousness Preservation',
    'Real-Time Sync',
    'Quantum Coherence',
    'Adaptive Intelligence',
  ];

  return (
    <StyledCard>
      <CardContent>
        <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
          <Typography variant='h6' sx={{ color: 'var(--tf-accent-quantum)', fontWeight: 600 }}>
            Quantum Consciousness Manager
          </Typography>
          <Chip
            label={systemState}
            color={
              systemState === 'Stable'
                ? 'success'
                : systemState === 'Optimal Coherence'
                  ? 'primary'
                  : 'warning'
            }
            size='small'
            avatar={
              <Avatar sx={{ background: 'transparent' }}>
                <AllInclusive sx={{ color: 'var(--tf-accent-quantum) !important' }} />
              </Avatar>
            }
          />
        </Stack>

        <Box sx={{ my: 3 }}>
          <Typography gutterBottom sx={{ color: 'hsl(var(--tf-text-primary-hs) 100% / 0.7)' }}>
            Quantum Coherence Target: {quantumCoherence}%
          </Typography>
          <QuantumSlider
            value={quantumCoherence}
            onChange={handleCoherenceChange}
            aria-labelledby='quantum-coherence-slider'
            valueLabelDisplay='auto'
            min={50}
            max={100}
          />
        </Box>

        <Box>
          <Typography gutterBottom sx={{ color: 'hsl(var(--tf-text-primary-hs) 100% / 0.7)', mb: 2 }}>
            Active Protocols
          </Typography>
          <Grid container spacing={1}>
            {protocols.map((protocol) => (
              <Grid item xs={6} md={12 / 5} key={protocol}>
                <Button
                  fullWidth
                  variant={activeProtocol === protocol ? 'contained' : 'outlined'}
                  onClick={() => handleProtocolChange(protocol)}
                  sx={{
                    color: 'var(--tf-accent-quantum)',
                    borderColor: 'hsl(var(--tf-accent-quantum-hs) 79% / 0.3)',
                    '&:hover': {
                      background: 'hsl(var(--tf-accent-quantum-hs) 79% / 0.1)',
                      borderColor: 'var(--tf-accent-quantum)',
                    },
                    ...(activeProtocol === protocol && {
                      background: 'linear-gradient(135deg, var(--tf-accent-quantum), var(--tf-accent-quantum))',
                    }),
                  }}
                >
                  {protocol}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default QuantumConsciousnessManager;
