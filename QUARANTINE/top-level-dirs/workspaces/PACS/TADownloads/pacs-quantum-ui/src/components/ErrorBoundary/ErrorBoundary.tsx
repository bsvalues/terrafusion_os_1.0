/**
 * Error Boundary Component
 * Elite Power User - Comprehensive Error Handling
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Paper, Typography, Collapse } from '@mui/material';
import { ErrorOutline, Refresh as RefreshIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState((prev) => ({
      showDetails: !prev.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} onReset={this.handleReset} onToggleDetails={this.toggleDetails} showDetails={this.state.showDetails} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  onToggleDetails: () => void;
  showDetails: boolean;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo, onReset, onToggleDetails, showDetails }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        p: 3,
      }}
    >
      <Paper
        sx={{
          p: 4,
          maxWidth: 600,
          textAlign: 'center',
        }}
        elevation={3}
      >
        <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Something went wrong
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
        </Typography>

        {error && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="error" gutterBottom>
              {error.name}: {error.message}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={onReset}>
            Try Again
          </Button>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </Box>

        {(error || errorInfo) && (
          <Box>
            <Button
              variant="text"
              size="small"
              endIcon={<ExpandMoreIcon sx={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />}
              onClick={onToggleDetails}
              sx={{ mb: 1 }}
            >
              {showDetails ? 'Hide' : 'Show'} Error Details
            </Button>
            <Collapse in={showDetails}>
              <Paper
                sx={{
                  p: 2,
                  mt: 1,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                  maxHeight: 300,
                  overflow: 'auto',
                }}
              >
                {error && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                      Error Stack:
                    </Typography>
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {error.stack || error.toString()}
                    </Typography>
                  </Box>
                )}
                {errorInfo && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                      Component Stack:
                    </Typography>
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {errorInfo.componentStack}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Collapse>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

