import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  Avatar,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Psychology,
  AccountTree,
  Code,
  Security,
  Assessment,
  Settings,
  PlayArrow,
  Pause,
  Error as ErrorIcon,
  CheckCircle
} from '@mui/icons-material';

interface AIAgentNodeData {
  label: string;
  agentType: 'SUPREME_COMMANDER' | 'FIELD_GENERAL' | 'OPERATIONAL_AGENT';
  agentId?: string;
  specialization?: string[];
  securityClearance?: 'RED' | 'YELLOW' | 'GREEN';
  status?: 'READY' | 'RUNNING' | 'COMPLETED' | 'ERROR';
  performanceMetrics?: {
    tasksCompleted: number;
    successRate: number;
    averageResponseTime: number;
    confidenceAverage: number;
  };
  configuration?: {
    capabilities?: string[];
    languages?: string[];
    frameworks?: string[];
    governmentStandards?: string[];
  };
  currentTask?: string;
}

interface AIAgentNodeProps extends NodeProps {
  data: AIAgentNodeData;
  selected?: boolean;
}

export const AIAgentNode: React.FC<AIAgentNodeProps> = memo(({ data, selected }) => {
  const getAgentIcon = () => {
    switch (data.agentType) {
      case 'SUPREME_COMMANDER':
        return <Psychology sx={{ fontSize: 24 }} />;
      case 'FIELD_GENERAL':
        return <AccountTree sx={{ fontSize: 24 }} />;
      default:
        return getSpecializationIcon();
    }
  };

  const getSpecializationIcon = () => {
    if (!data.specialization || data.specialization.length === 0) {
      return <Code sx={{ fontSize: 24 }} />;
    }

    const spec = data.specialization[0];
    if (spec.includes('SECURITY') || spec.includes('AUDIT')) {
      return <Security sx={{ fontSize: 24 }} />;
    } else if (spec.includes('COMPLIANCE') || spec.includes('VALIDATOR')) {
      return <Assessment sx={{ fontSize: 24 }} />;
    } else {
      return <Code sx={{ fontSize: 24 }} />;
    }
  };

  const getClearanceColor = (): string => {
    switch (data.securityClearance) {
      case 'RED': return '#F44336';
      case 'YELLOW': return '#FF9800';
      case 'GREEN': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getStatusColor = (): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (data.status) {
      case 'RUNNING': return 'warning';
      case 'COMPLETED': return 'success';
      case 'ERROR': return 'error';
      default: return 'primary';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'RUNNING':
        return <CircularProgress size={16} />;
      case 'COMPLETED':
        return <CheckCircle sx={{ fontSize: 16, color: '#4CAF50' }} />;
      case 'ERROR':
        return <ErrorIcon sx={{ fontSize: 16, color: '#F44336' }} />;
      default:
        return <PlayArrow sx={{ fontSize: 16 }} />;
    }
  };

  const getAgentTypeColor = (): string => {
    switch (data.agentType) {
      case 'SUPREME_COMMANDER': return '#6A1B9A';
      case 'FIELD_GENERAL': return '#1976D2';
      default: return '#388E3C';
    }
  };

  const getAgentTypeLabel = (): string => {
    switch (data.agentType) {
      case 'SUPREME_COMMANDER': return 'Supreme Commander';
      case 'FIELD_GENERAL': return 'Field General';
      default: return 'Operational Agent';
    }
  };

  return (
    <Paper
      elevation={selected ? 8 : 4}
      sx={{
        minWidth: 280,
        maxWidth: 350,
        border: selected ? '2px solid #1976d2' : '2px solid transparent',
        borderRadius: 2,
        overflow: 'visible',
        position: 'relative',
        backgroundColor: '#ffffff',
        '&:hover': {
          boxShadow: 6
        }
      }}
    >
      {/* Input Handles */}
      <Handle 
        type="target" 
        position={Position.Top}
        style={{ background: '#1976d2', border: '2px solid #fff', width: 12, height: 12 }}
      />
      <Handle 
        type="target" 
        position={Position.Left}
        style={{ background: '#1976d2', border: '2px solid #fff', width: 12, height: 12 }}
      />

      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(45deg, ${getAgentTypeColor()}, ${getClearanceColor()})`,
          color: 'white',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Avatar 
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.2)', 
            width: 32, 
            height: 32 
          }}
        >
          {getAgentIcon()}
        </Avatar>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
            {data.label}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            {data.agentId || 'Agent ID'}
          </Typography>
        </Box>

        <Chip
          label={data.securityClearance || 'GREEN'}
          size="small"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '10px'
          }}
        />
      </Box>

      {/* Body */}
      <Box sx={{ p: 2 }}>
        {/* Agent Type */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Chip
            label={getAgentTypeLabel()}
            size="small"
            sx={{
              backgroundColor: getAgentTypeColor(),
              color: 'white',
              fontSize: '11px'
            }}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getStatusIcon()}
            <Chip
              label={data.status || 'READY'}
              size="small"
              color={getStatusColor()}
              variant="outlined"
              sx={{ fontSize: '10px' }}
            />
          </Box>
        </Box>

        {/* Specialization */}
        {data.specialization && data.specialization.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              Specialization:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {data.specialization.slice(0, 3).map((spec) => (
                <Tooltip key={spec} title={spec} arrow>
                  <Chip
                    label={spec.replace(/_/g, ' ')}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '9px',
                      height: '20px',
                      '& .MuiChip-label': {
                        px: 1
                      }
                    }}
                  />
                </Tooltip>
              ))}
              {data.specialization.length > 3 && (
                <Chip
                  label={`+${data.specialization.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '9px', height: '20px' }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Performance Metrics */}
        {data.performanceMetrics && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              Performance:
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 0.5 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {data.performanceMetrics.tasksCompleted}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tasks
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {Math.round(data.performanceMetrics.successRate * 100)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Success
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {Math.round(data.performanceMetrics.averageResponseTime)}ms
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Time
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {Math.round(data.performanceMetrics.confidenceAverage)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Confidence
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Current Task */}
        {data.currentTask && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              Current Task:
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
              {data.currentTask}
            </Typography>
          </Box>
        )}

        {/* Government Standards */}
        {data.configuration?.governmentStandards && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              Compliance:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {data.configuration.governmentStandards.map((standard) => (
                <Chip
                  key={standard}
                  label={standard}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{
                    fontSize: '9px',
                    height: '20px',
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Footer with Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          backgroundColor: '#f5f5f5',
          borderTop: '1px solid #e0e0e0'
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Agent Node
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Configure Agent" arrow>
            <IconButton size="small" sx={{ p: 0.5 }}>
              <Settings sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          
          {data.status === 'READY' && (
            <Tooltip title="Start Agent" arrow>
              <IconButton size="small" sx={{ p: 0.5, color: '#4CAF50' }}>
                <PlayArrow sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
          
          {data.status === 'RUNNING' && (
            <Tooltip title="Pause Agent" arrow>
              <IconButton size="small" sx={{ p: 0.5, color: '#FF9800' }}>
                <Pause sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Output Handles */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        style={{ background: '#4CAF50', border: '2px solid #fff', width: 12, height: 12 }}
      />
      <Handle 
        type="source" 
        position={Position.Right}
        style={{ background: '#4CAF50', border: '2px solid #fff', width: 12, height: 12 }}
      />

      {/* Status Indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: -8,
          right: -8,
          width: 16,
          height: 16,
          borderRadius: '50%',
          backgroundColor: getClearanceColor(),
          border: '2px solid #fff',
          boxShadow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {data.status === 'RUNNING' && (
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#fff',
              animation: 'pulse 1s infinite'
            }}
          />
        )}
      </Box>

      {/* Pulse animation for running status */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </Paper>
  );
});

AIAgentNode.displayName = 'AIAgentNode';
export default AIAgentNode;