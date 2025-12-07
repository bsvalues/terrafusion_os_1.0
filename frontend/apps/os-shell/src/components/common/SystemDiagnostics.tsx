import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

interface SystemMetrics {
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  aiAgentsActive: number;
  quantumCoherence: number;
  networkLatency: number;
  securityStatus: string;
}

const SystemDiagnostics: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    uptime: '72:14:33',
    cpuUsage: 23.4,
    memoryUsage: 67.8,
    aiAgentsActive: 1008,
    quantumCoherence: 94.7,
    networkLatency: 12,
    securityStatus: 'SECURE',
  });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        cpuUsage: Math.max(15, Math.min(85, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(45, Math.min(85, prev.memoryUsage + (Math.random() - 0.5) * 5)),
        aiAgentsActive: Math.max(
          980,
          Math.min(1008, prev.aiAgentsActive + Math.floor((Math.random() - 0.5) * 20))
        ),
        quantumCoherence: Math.max(
          90,
          Math.min(99, prev.quantumCoherence + (Math.random() - 0.5) * 2)
        ),
        networkLatency: Math.max(
          5,
          Math.min(50, prev.networkLatency + Math.floor((Math.random() - 0.5) * 10))
        ),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <Box className='tf-osdiag' onClick={() => setIsVisible(false)} sx={{ cursor: 'pointer' }}>
      <div className='tf-osdiag-title'>SYSTEM DIAGNOSTICS</div>

      <div className='tf-osdiag-metric'>
        <span>UPTIME:</span>
        <span className='tf-osdiag-value'>{metrics.uptime}</span>
      </div>

      <div className='tf-osdiag-metric'>
        <span>CPU:</span>
        <span className='tf-osdiag-value'>{metrics.cpuUsage.toFixed(1)}%</span>
      </div>

      <div className='tf-osdiag-metric'>
        <span>MEMORY:</span>
        <span className='tf-osdiag-value'>{metrics.memoryUsage.toFixed(1)}%</span>
      </div>

      <div className='tf-osdiag-metric'>
        <span>AI AGENTS:</span>
        <span className='tf-osdiag-value'>{metrics.aiAgentsActive}</span>
      </div>

      <div className='tf-osdiag-metric'>
        <span>Q-COHERENCE:</span>
        <span className='tf-osdiag-value'>{metrics.quantumCoherence.toFixed(1)}%</span>
      </div>

      <div className='tf-osdiag-metric'>
        <span>LATENCY:</span>
        <span className='tf-osdiag-value'>{metrics.networkLatency}ms</span>
      </div>

      <div className='tf-osdiag-metric'>
        <span>SECURITY:</span>
        <span className='tf-osdiag-value' style={{ color: '#00ff88' }}>
          {metrics.securityStatus}
        </span>
      </div>

      <Typography
        variant='caption'
        sx={{
          display: 'block',
          textAlign: 'center',
          mt: 1,
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.6rem',
        }}
      >
        Click to hide • Terrafusion OS v1.0
      </Typography>
    </Box>
  );
};

export default SystemDiagnostics;
