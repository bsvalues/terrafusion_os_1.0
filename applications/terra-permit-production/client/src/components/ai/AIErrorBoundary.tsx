import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle  } from '@mui/icons-material';
import { Button } from '@/components/ui/button';

interface AIErrorBoundaryProps {
  children: ReactNode;
}

interface AIErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AIErrorBoundary extends Component<AIErrorBoundaryProps, AIErrorBoundaryState> {
  constructor(props: AIErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): AIErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('AI component error:', error, errorInfo);
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const error = this.state.error || new Error('Unknown error');
      const isApiKeyError = error.message?.includes('OpenAI API key') || 
                            error.message?.includes('API configuration') || 
                            error.message?.includes('not configured');
      
      return (
        <Card className="my-4">
          <CardContent className="pt-6 space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {isApiKeyError 
                  ? 'AI features require a valid OpenAI API key' 
                  : 'Error loading AI component'}
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-muted-foreground"><>

              <p>
                {isApiKeyError 
                  ? 'To use the AI analysis features, please configure your OpenAI API key in settings.' 
                  : `Something went wrong with the AI service: ${error.message}`}
              </p>
              
              <div
</> className="flex space-x-2 mt-4">
                {isApiKeyError && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      window.location.href = '/settings?highlight=openai_key';
                    }}
                  >
                    Go to Settings
                  </Button>
                )}
                
                <Button onClick={this.resetErrorBoundary}>
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default AIErrorBoundary;