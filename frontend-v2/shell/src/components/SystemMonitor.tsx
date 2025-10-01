import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  timestamp: number;
}

interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status: string;
}

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const slideUp = keyframes`
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const MonitorContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
  backdrop-filter: blur(10px);
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  animation: ${slideUp} 0.5s ease-out;
`;

const MetricValue = styled.div<{ $status: 'good' | 'warning' | 'critical' }>`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: ${props => {
    switch (props.$status) {
      case 'good': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#ffffff';
    }
  }};
  animation: ${pulse} 2s infinite;
`;

const MetricLabel = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ProgressBar = styled.div<{ $percentage: number; $status: 'good' | 'warning' | 'critical' }>`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-top: 0.5rem;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    width: ${props => props.$percentage}%;
    height: 100%;
    background: ${props => {
      switch (props.$status) {
        case 'good': return 'linear-gradient(90deg, #10b981, #059669)';
        case 'warning': return 'linear-gradient(90deg, #f59e0b, #d97706)';
        case 'critical': return 'linear-gradient(90deg, #ef4444, #dc2626)';
        default: return 'linear-gradient(90deg, #6b7280, #4b5563)';
      }
    }};
    transition: width 0.5s ease;
    border-radius: 4px;
  }
`;

const ProcessList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
`;

const ProcessItem = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 80px 80px 100px;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  
  &:last-child {
    border-bottom: none;
  }
`;

const ProcessHeader = styled(ProcessItem)`
  font-weight: 600;
  color: white;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.$status.toLowerCase()) {
      case 'running': return 'rgba(16, 185, 129, 0.2)';
      case 'sleeping': return 'rgba(59, 130, 246, 0.2)';
      case 'stopped': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(156, 163, 175, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.$status.toLowerCase()) {
      case 'running': return '#10b981';
      case 'sleeping': return '#3b82f6';
      case 'stopped': return '#ef4444';
      default: return '#9ca3af';
    }
  }};
`;

const SystemMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    uptime: 0,
    timestamp: Date.now()
  });

  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const generateMockMetrics = (): SystemMetrics => {
      const now = Date.now();
      const timeFactor = (now / 10000) % 100;
      
      return {
        cpu: Math.max(5, Math.min(95, 25 + Math.sin(timeFactor / 10) * 20 + Math.random() * 10)),
        memory: Math.max(10, Math.min(90, 45 + Math.cos(timeFactor / 8) * 15 + Math.random() * 8)),
        disk: Math.max(20, Math.min(85, 55 + Math.sin(timeFactor / 15) * 10 + Math.random() * 5)),
        network: Math.max(0, Math.min(100, Math.abs(Math.sin(timeFactor / 5)) * 80 + Math.random() * 20)),
        uptime: Math.floor(now / 1000) % 86400, // Mock uptime in seconds
        timestamp: now
      };
    };

    const generateMockProcesses = (): ProcessInfo[] => {
      const processNames = [
        'terrafusion-core', 'trust-fabric', 'data-layer', 'government-api',
        'citizen-services', 'emergency-mgmt', 'edge-compute', 'benton-county'
      ];
      
      return processNames.map((name, index) => ({
        pid: 1000 + index,
        name,
        cpu: Math.random() * 25,
        memory: Math.random() * 200 + 50,
        status: Math.random() > 0.1 ? 'running' : Math.random() > 0.5 ? 'sleeping' : 'stopped'
      })).sort((a, b) => b.cpu - a.cpu);
    };

    const updateMetrics = (): void => {
      if (isActive) {
        setMetrics(generateMockMetrics());
        setProcesses(generateMockProcesses());
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  const getStatus = (value: number, thresholds: { warning: number; critical: number }): 'good' | 'warning' | 'critical' => {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'good';
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cpuStatus = getStatus(metrics.cpu, { warning: 70, critical: 90 });
  const memoryStatus = getStatus(metrics.memory, { warning: 75, critical: 90 });
  const diskStatus = getStatus(metrics.disk, { warning: 80, critical: 95 });

  return (
    <MonitorContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ color: 'white', margin: 0 }}>🖥️ System Monitor</h3>
        <button
          onClick={() => setIsActive(!isActive)}
          style={{
            background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isActive ? '#10b981' : '#ef4444',
            border: `1px solid ${isActive ? '#10b981' : '#ef4444'}`,
            borderRadius: '4px',
            padding: '0.25rem 0.5rem',
            cursor: 'pointer'
          }}
        >
          {isActive ? '⏸️ Pause' : '▶️ Resume'}
        </button>
      </div>

      <MetricsGrid>
        <MetricCard>
          <MetricValue $status={cpuStatus}>
            {metrics.cpu.toFixed(1)}%
          </MetricValue>
          <MetricLabel>CPU Usage</MetricLabel>
          <ProgressBar $percentage={metrics.cpu} $status={cpuStatus} />
        </MetricCard>

        <MetricCard>
          <MetricValue $status={memoryStatus}>
            {metrics.memory.toFixed(1)}%
          </MetricValue>
          <MetricLabel>Memory Usage</MetricLabel>
          <ProgressBar $percentage={metrics.memory} $status={memoryStatus} />
        </MetricCard>

        <MetricCard>
          <MetricValue $status={diskStatus}>
            {metrics.disk.toFixed(1)}%
          </MetricValue>
          <MetricLabel>Disk Usage</MetricLabel>
          <ProgressBar $percentage={metrics.disk} $status={diskStatus} />
        </MetricCard>

        <MetricCard>
          <MetricValue $status="good">
            {metrics.network.toFixed(1)}%
          </MetricValue>
          <MetricLabel>Network I/O</MetricLabel>
          <ProgressBar $percentage={metrics.network} $status="good" />
        </MetricCard>
      </MetricsGrid>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          System Uptime: {formatUptime(metrics.uptime)} | 
          Last Update: {new Date(metrics.timestamp).toLocaleTimeString()}
        </div>
      </div>

      <div>
        <h4 style={{ color: 'white', marginBottom: '1rem' }}>🔄 TerraFusion Processes</h4>
        <ProcessList>
          <ProcessHeader>
            <div>PID</div>
            <div>Process Name</div>
            <div>CPU %</div>
            <div>Memory</div>
            <div>Status</div>
          </ProcessHeader>
          {processes.map(process => (
            <ProcessItem key={process.pid}>
              <div>{process.pid}</div>
              <div>{process.name}</div>
              <div>{process.cpu.toFixed(1)}%</div>
              <div>{process.memory.toFixed(0)}MB</div>
              <div>
                <StatusBadge $status={process.status}>
                  {process.status}
                </StatusBadge>
              </div>
            </ProcessItem>
          ))}
        </ProcessList>
      </div>
    </MonitorContainer>
  );
};

export default SystemMonitor;
