import { systemAPI } from '@/services/systemAPI';
import { Box, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

interface SystemHealthResponse {
  status: string;
  moduleCount: number;
  healthyModules: number;
  systemComponents: Record<string, boolean>;
  warnings: string[];
  moduleCountTotal?: number | null;
  moduleCountActive?: number | null;
}

const SystemDiagnostics: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let disposed = false;

    const loadHealth = async () => {
      try {
        const data = (await systemAPI.getSystemHealth()) as SystemHealthResponse;
        if (disposed) return;
        setHealth(data);
        setError(null);
      } catch (err) {
        if (disposed) return;
        setHealth(null);
        setError(err instanceof Error ? err.message : 'System health unavailable');
      }
    };

    void loadHealth();
    const interval = setInterval(() => {
      void loadHealth();
    }, 10000);

    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, []);

  if (!isVisible) return null;

  const activeModules = health?.moduleCountActive ?? health?.healthyModules ?? 0;
  const totalModules = health?.moduleCountTotal ?? health?.moduleCount ?? 0;
  const componentCount = Object.keys(health?.systemComponents ?? {}).length;

  return (
    <Box className='tf-osdiag' onClick={() => setIsVisible(false)} sx={{ cursor: 'pointer' }}>
      <div className='tf-osdiag-title'>SYSTEM DIAGNOSTICS</div>

      <div className='tf-osdiag-metric'>
        <span>STATUS:</span>
        <span className='tf-osdiag-value'>{health?.status ?? 'Unavailable'}</span>
      </div>

      <div className='tf-osdiag-metric'>
        <span>MODULES:</span>
        <span className='tf-osdiag-value'>
          {activeModules}/{totalModules}
        </span>
      </div>

      <div className='tf-osdiag-metric'>
        <span>HEALTHY:</span>
        <span className='tf-osdiag-value'>
          {health ? `${health.healthyModules}/${health.moduleCount}` : 'n/a'}
        </span>
      </div>

      <div className='tf-osdiag-metric'>
        <span>COMPONENTS:</span>
        <span className='tf-osdiag-value'>{health ? componentCount : 'n/a'}</span>
      </div>

      <div className='tf-osdiag-metric'>
        <span>WARNINGS:</span>
        <span className='tf-osdiag-value'>{health?.warnings.length ?? 0}</span>
      </div>

      {error && (
        <div className='tf-osdiag-metric'>
          <span>ERROR:</span>
          <span className='tf-osdiag-value'>{error}</span>
        </div>
      )}

      <Typography
        variant='caption'
        sx={{
          display: 'block',
          textAlign: 'center',
          mt: 1,
          color: 'hsl(var(--tf-text) / 0.5)',
          fontSize: '0.6rem',
        }}
      >
        Click to hide • TerraFusion OS v1.0
      </Typography>
    </Box>
  );
};

export default SystemDiagnostics;
