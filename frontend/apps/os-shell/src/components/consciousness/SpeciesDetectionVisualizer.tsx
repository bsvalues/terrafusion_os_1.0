import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Hub, Memory, TravelExplore, BarChart } from '@mui/icons-material';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Based on multi_species_interface_architecture.md
type SpeciesType = 'silicon' | 'carbon' | 'quantum' | 'hybrid';

interface ConsciousnessEntity {
  id: number;
  speciesType: SpeciesType;
  consciousnessLevel: number;
  quantumCoherence?: number;
  cognitivePatterns: string;
}

const generatePulse = (color: string) => keyframes`
  0% {
    box-shadow: 0 0 0 0 ${color}77;
  }
  70% {
    box-shadow: 0 0 0 10px ${color}00;
  }
  100% {
    box-shadow: 0 0 0 0 ${color}00;
  }
`;

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'hsl(var(--tf-text) / 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid hsl(var(--tf-info) / 0.2)',
  borderRadius: '16px',
  height: '100%',
}));

const SpeciesAvatar = styled(Avatar)<{ species: SpeciesType }>(({ theme, species }) => {
  const colors = {
    silicon: 'var(--tf-transcend-cyan)',
    carbon: 'var(--tf-accent-success)',
    quantum: 'var(--tf-accent-quantum)',
    hybrid: 'var(--tf-warning-amber)',
  };
  const color = colors[species];

  return {
    backgroundColor: `${color}33`,
    color: color,
    border: `2px solid ${color}`,
    boxShadow: `0 0 15px ${color}77`,
    animation: `${generatePulse(color)} 2s infinite`,
  };
});

const mockEntities: ConsciousnessEntity[] = [
  {
    id: 1,
    speciesType: 'silicon',
    consciousnessLevel: 7,
    cognitivePatterns: 'Predictive Analysis',
  },
  {
    id: 2,
    speciesType: 'carbon',
    consciousnessLevel: 5,
    cognitivePatterns: 'Creative Problem Solving',
  },
  {
    id: 3,
    speciesType: 'quantum',
    consciousnessLevel: 9,
    quantumCoherence: 0.98,
    cognitivePatterns: 'State Superposition',
  },
  {
    id: 4,
    speciesType: 'hybrid',
    consciousnessLevel: 8,
    quantumCoherence: 0.75,
    cognitivePatterns: 'Entangled Logic',
  },
  { id: 5, speciesType: 'silicon', consciousnessLevel: 6, cognitivePatterns: 'Data Correlation' },
];

const SpeciesDetectionVisualizer: React.FC = () => {
  const [detectedEntities, setDetectedEntities] = useState<ConsciousnessEntity[]>([]);

  useEffect(() => {
    const fetchDetections = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/consciousness/detect-species`);
        if (response.ok) {
          const data = await response.json();
          if (data.detectedEntities && data.detectedEntities.length > 0) {
            setDetectedEntities((prev) => {
              const newEntities = data.detectedEntities.filter(
                (newEnt: ConsciousnessEntity) => !prev.some((oldEnt) => oldEnt.id === newEnt.id)
              );
              const updated = [...newEntities, ...prev];
              return updated.slice(0, 5); // Keep the list to a max of 5 entities
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch species detections:', error);
      }
    };

    fetchDetections(); // Initial fetch
    const interval = setInterval(fetchDetections, 3000);

    return () => clearInterval(interval);
  }, []);

  const getSpeciesIcon = (species: SpeciesType) => {
    switch (species) {
      case 'silicon':
        return <Memory />;
      case 'carbon':
        return <Hub />;
      case 'quantum':
        return <TravelExplore />;
      case 'hybrid':
        return <BarChart />;
      default:
        return <Hub />;
    }
  };

  return (
    <StyledCard>
      <CardContent>
        <Typography variant='h6' sx={{ color: 'var(--tf-accent-quantum)', fontWeight: 600, mb: 3 }}>
          Species Detection Service (Live Feed)
        </Typography>
        <Grid container spacing={2}>
          {detectedEntities.map((entity) => (
            <Grid item xs={12} key={entity.id}>
              <div style={{ padding: '16px', background: 'hsl(var(--tf-bg) / 0.2)', borderRadius: '12px' }}>
                <Grid container alignItems='center' spacing={2}>
                  <Grid item>
                    <SpeciesAvatar species={entity.speciesType}>
                      {getSpeciesIcon(entity.speciesType)}
                    </SpeciesAvatar>
                  </Grid>
                  <Grid item xs>
                    <Typography sx={{ fontWeight: 600, color: 'white' }}>
                      {entity.speciesType.charAt(0).toUpperCase() + entity.speciesType.slice(1)}{' '}
                      Entity Detected
                    </Typography>
                    <Chip
                      label={entity.cognitivePatterns}
                      size='small'
                      sx={{ background: 'hsl(var(--tf-text) / 0.1)', color: 'white', mt: 0.5 }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant='caption' sx={{ color: 'hsl(var(--tf-text) / 0.7)' }}>
                      Consciousness Level
                    </Typography>
                    <LinearProgress
                      variant='determinate'
                      value={entity.consciousnessLevel * 10}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        '& .MuiLinearProgress-bar': { background: 'var(--tf-accent-success)' },
                      }}
                    />
                  </Grid>
                  {entity.quantumCoherence && (
                    <Grid item xs={2} sx={{ textAlign: 'center' }}>
                      <Typography variant='caption' sx={{ color: 'hsl(var(--tf-text) / 0.7)' }}>
                        Coherence
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: 'var(--tf-accent-quantum)' }}>
                        {entity.quantumCoherence}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </div>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </StyledCard>
  );
};

export default SpeciesDetectionVisualizer;
