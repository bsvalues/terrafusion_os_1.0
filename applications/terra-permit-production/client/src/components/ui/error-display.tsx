import React from 'react';
import { AlertCircle, Refresh, XCircle, CheckCircle, HelpCircle, ArrowRight  } from '@mui/icons-material';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useHelp } from '@/contexts/HelpContext';

export type ErrorSeverity = 'error' | 'warning' | 'info' | 'success';
export type ErrorAction = {
  label: string;
  onClick: () => void;
  icon?: React.ElementType;
  primary?: boolean;
};

export interface ErrorDisplayProps {
  title: string;
  description: string;
  severity: ErrorSeverity;
  errorCode?: string;
  errorDetails?: string;
  actions?: ErrorAction[];
  helpTopic?: string;
  className?: string;
  compact?: boolean;
}

/**
 * A reusable component for displaying user-friendly error messages
 * with custom actions and built-in help integration.
 */
export const ErrorDisplay = ({
  title,
  description,
  severity = 'error',
  errorCode,
  errorDetails,
  actions = [],
  helpTopic,
  className = '',
  compact = false,
}: ErrorDisplayProps) => {
  const { showHelp } = useHelp();
  
  // Determine the icon based on severity
  const getIcon = () => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'info':
      default:
        return <HelpCircle className="h-5 w-5 text-blue-500" />;
    }
  };
  
  // Get background and border colors based on severity
  const getBackgroundStyle = () => {
    switch (severity) {
      case 'error':
        return 'bg-destructive/5 border-destructive/20 text-destructive-foreground';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };
  
  const handleHelpClick = () => {
    if (helpTopic) {
      showHelp(helpTopic);
    }
  };
  
  // Compact view is for use in-line within other components
  if (compact) {
    return (
      <Alert className={`${getBackgroundStyle()} ${className}`}>
        {getIcon()}
        <AlertTitle className="flex items-center">
          {title}
          {errorCode && <span className="ml-2 text-xs opacity-70">({errorCode})</span>}
        </AlertTitle>
        <AlertDescription>
          <div className="mt-1">{description}</div>
          
          {(actions.length > 0 || helpTopic) && (
            <div className="flex gap-2 mt-3">
              {actions.map((action /* , index */) => (
                <Button 
                  key={index} 
                  size="sm" 
                  variant={action.primary ? "default" : "outline"}
                  onClick={action.onClick}
                  className="flex items-center text-xs h-8"
                >
                  {action.icon && React.createElement(action.icon, { className: "h-3.5 w-3.5 mr-1.5" })}
                  {action.label}
                </Button>
              ))}
              
              {helpTopic && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-8"
                  onClick={handleHelpClick}
                >
                  <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                  Help
                </Button>
              )}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Full view with more details and prominent actions
  return (
    <Card className={`border ${getBackgroundStyle()} ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4"><>

          <div className="p-2 rounded-full bg-white/80">
            {getIcon()}
          </div>
          <div
</> className="flex-1">
            <h3 className="text-lg font-medium flex items-center">
              {title}
              {errorCode && <span className="ml-2 text-sm opacity-70 font-normal">({errorCode})</span>}
            </h3>
            <p className="mt-1">{description}</p>
            
            {errorDetails && (
              <>
                <Separator className="my-3 opacity-30" />
                <div className="text-sm opacity-80 bg-white/10 p-2 rounded">
                  <p>{errorDetails}</p>
                </div>
              </>
            )}
            
            {(actions.length > 0 || helpTopic) && (
              <>
                <Separator className="my-3 opacity-30" />
                <div className="flex flex-wrap gap-3">
                  {actions.map((action /* , index */) => (
                    <Button 
                      key={index} 
                      variant={action.primary ? "default" : "outline"}
                      onClick={action.onClick}
                      className="flex items-center"
                    >
                      {action.icon && React.createElement(action.icon, { className: "h-4 w-4 mr-2" })}
                      {action.label}
                    </Button>
                  ))}
                  
                  {helpTopic && (
                    <Button 
                      variant="outline" 
                      onClick={handleHelpClick}
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      View Help Guide
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorDisplay;