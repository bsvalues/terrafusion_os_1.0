/**
 * React Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */

import React from 'react';
import TerraCard from '../components/TerraCard';
import TerraButton from '../components/TerraButton';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console or error reporting service
    // eslint-disable-next-line no-console
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // You can also log to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" style={{ 
          padding: '40px', 
          maxWidth: '800px', 
          margin: '40px auto' 
        }}>
          <TerraCard>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
              <h1 style={{ marginBottom: '16px', color: 'var(--primary-600)' }}>
                Something Went Wrong
              </h1>
              <p style={{ 
                marginBottom: '32px', 
                color: 'var(--neutral-600)',
                fontSize: '16px',
                lineHeight: '1.6'
              }}>
                We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details style={{ 
                  textAlign: 'left', 
                  marginBottom: '32px',
                  padding: '20px',
                  backgroundColor: 'var(--neutral-50)',
                  borderRadius: '8px',
                  border: '1px solid var(--neutral-200)'
                }}>
                  <summary style={{ 
                    cursor: 'pointer', 
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: 'var(--error-600)'
                  }}>
                    Error Details (Development Only)
                  </summary>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                    color: 'var(--neutral-700)'
                  }}>
                    <strong>Error:</strong> {this.state.error.toString()}
                    <br /><br />
                    <strong>Stack Trace:</strong>
                    <br />
                    {this.state.errorInfo.componentStack}
                  </div>
                </details>
              )}
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <TerraButton 
                  onClick={this.handleReset}
                  variant="primary"
                >
                  Try Again
                </TerraButton>
                <TerraButton 
                  onClick={() => window.location.href = '/frontend_engine'}
                  variant="outline"
                >
                  Go to Home
                </TerraButton>
              </div>
            </div>
          </TerraCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
