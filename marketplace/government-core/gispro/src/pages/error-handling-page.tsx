import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Progress 
} from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import ErrorBoundary from '@/components/ui/error-boundary';
import { 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  Info, 
  Zap, 
  RotateCcw,
  Bug,
  Shield,
  Activity,
  AlertCircle,
  Bell,
  RefreshCw,
  Database,
  Network,
  Server
} from 'lucide-react';

// Error simulation components
interface ErrorTriggerComponentProps {
  shouldError: boolean;
}

function ErrorTriggerComponent({ shouldError }: ErrorTriggerComponentProps) {
  if (shouldError) {
    throw new Error('Simulated component error for demonstration');
  }
  
  return (
    <motion.div 
      className="p-4 bg-green-50 border border-green-200 rounded-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <p className="text-green-800 font-medium">Component is working correctly!</p>
      </div>
      <p className="text-green-600 text-sm mt-2">
        This component will throw an error when the error boundary test is triggered.
      </p>
    </motion.div>
  );
}

// Simulated async error component
function AsyncErrorComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const simulateAsyncError = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Simulate async operation that fails
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Simulated network error'));
        }, 2000);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Async Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAsyncSuccess = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Simulate successful async operation
      await new Promise((resolve) => {
        setTimeout(resolve, 1500);
      });
      setSuccess(true);
      toast({
        title: 'Success',
        description: 'Async operation completed successfully!',
        variant: 'default'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-3">
        <Button 
          onClick={simulateAsyncError}
          disabled={isLoading}
          variant="destructive"
          className="flex items-center gap-2"
        >
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Trigger Async Error
        </Button>
        
        <Button 
          onClick={simulateAsyncSuccess}
          disabled={isLoading}
          variant="default"
          className="flex items-center gap-2"
        >
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Simulate Success
        </Button>
      </div>
      
      {isLoading && (
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Processing request...</span>
          </div>
          <Progress value={65} className="w-full" />
        </motion.div>
      )}
      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Async Error Occurred</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Async operation completed successfully!</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Network error simulation
function NetworkErrorSimulator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Connection Restored',
        description: 'Network connection has been restored.',
        variant: 'default'
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Connection Lost',
        description: 'Network connection has been lost.',
        variant: 'destructive'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const simulateNetworkError = () => {
    setConnectionAttempts(prev => prev + 1);
    toast({
      title: 'Network Error',
      description: `Failed to connect to server (Attempt ${connectionAttempts + 1})`,
      variant: 'destructive'
    });
  };

  const simulateServerError = () => {
    toast({
      title: 'Server Error',
      description: 'Server returned 500 Internal Server Error',
      variant: 'destructive'
    });
  };

  const simulateTimeoutError = () => {
    toast({
      title: 'Request Timeout',
      description: 'Request timed out after 30 seconds',
      variant: 'destructive'
    });
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="font-medium">
          Status: {isOnline ? 'Online' : 'Offline'}
        </span>
        <Badge variant={isOnline ? 'default' : 'destructive'}>
          {connectionAttempts} failed attempts
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Button 
          onClick={simulateNetworkError}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Network className="h-4 w-4" />
          Network Error
        </Button>
        
        <Button 
          onClick={simulateServerError}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Server className="h-4 w-4" />
          Server Error
        </Button>
        
        <Button 
          onClick={simulateTimeoutError}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Timeout Error
        </Button>
      </div>
    </motion.div>
  );
}

export default function ErrorHandlingPage() {
  const { toast } = useToast();
  const [showErrorComponent, setShowErrorComponent] = useState(false);
  const [errorBoundaryKey, setErrorBoundaryKey] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Form validation simulation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const resetErrorBoundary = () => {
    setShowErrorComponent(false);
    setErrorBoundaryKey(prev => prev + 1);
  };

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Error Handling & Recovery Demo
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Comprehensive demonstration of error handling patterns, recovery strategies, 
          and user experience during error states in TerraFusion OS.
        </p>
      </motion.div>

      {/* Toast Notifications Demo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Toast Notifications</CardTitle>
            </div>
            <CardDescription>
              Demonstrates different types of toast notifications for user feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => 
                  toast({
                    title: 'Success',
                    description: 'Operation completed successfully!',
                    variant: 'default'
                  })
                }
                variant="default"
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Success Toast
              </Button>
              
              <Button
                onClick={() => 
                  toast({
                    title: 'Information',
                    description: 'Here is some helpful information.',
                    variant: 'default'
                  })
                }
                variant="outline"
                className="flex items-center gap-2"
              >
                <Info className="h-4 w-4" />
                Info Toast
              </Button>
              
              <Button
                onClick={() => 
                  toast({
                    title: 'Warning',
                    description: 'Please be aware of this important notice.',
                    variant: 'destructive'
                  })
                }
                variant="outline"
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Warning Toast
              </Button>
              
              <Button
                onClick={() => 
                  toast({
                    title: 'Error',
                    description: 'An error occurred during the operation.',
                    variant: 'destructive'
                  })
                }
                variant="outline"
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Error Toast
              </Button>
            </div>
            
            <Separator className="my-6" />
            
            <Button
              onClick={() => 
                toast({
                  title: 'Custom Toast',
                  description: 'This is a custom toast with an action.',
                  variant: 'default',
                  action: (
                    <Button size="sm" variant="outline" onClick={() => alert('Custom action')}>
                      Action
                    </Button>
                  )
                })
              }
              variant="outline"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Custom Toast with Action
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Boundary Demo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Error Boundary</CardTitle>
            </div>
            <CardDescription>
              Demonstrates how the application handles uncaught exceptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowErrorComponent(true)}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Trigger Component Error
                </Button>
                
                <Button 
                  onClick={resetErrorBoundary}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Error Boundary
                </Button>
              </div>
              
              <ErrorBoundary key={errorBoundaryKey}>
                <ErrorTriggerComponent shouldError={showErrorComponent} />
              </ErrorBoundary>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Async Error Handling */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Async Error Handling</CardTitle>
            </div>
            <CardDescription>
              Demonstrates handling errors in asynchronous operations and state updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncErrorComponent />
          </CardContent>
        </Card>
      </motion.div>

      {/* Network Error Simulation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              <CardTitle>Network Error Simulation</CardTitle>
            </div>
            <CardDescription>
              Simulates various network-related errors and connection issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NetworkErrorSimulator />
          </CardContent>
        </Card>
      </motion.div>

      {/* Form Validation Errors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Form Validation Errors</CardTitle>
            </div>
            <CardDescription>
              Demonstrates client-side validation and error messaging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              if (validateForm()) {
                toast({
                  title: 'Form Submitted',
                  description: 'All validation passed successfully!',
                  variant: 'default'
                });
              } else {
                toast({
                  title: 'Validation Failed',
                  description: 'Please fix the errors below.',
                  variant: 'destructive'
                });
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={validationErrors.email ? 'border-red-500' : ''}
                  />
                  {validationErrors.email && (
                    <motion.p 
                      className="text-sm text-red-600"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      {validationErrors.email}
                    </motion.p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={validationErrors.password ? 'border-red-500' : ''}
                  />
                  {validationErrors.password && (
                    <motion.p 
                      className="text-sm text-red-600"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      {validationErrors.password}
                    </motion.p>
                  )}
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={validationErrors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {validationErrors.confirmPassword && (
                    <motion.p 
                      className="text-sm text-red-600"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      {validationErrors.confirmPassword}
                    </motion.p>
                  )}
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                Submit Form
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Recovery Strategies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              <CardTitle>Error Recovery Strategies</CardTitle>
            </div>
            <CardDescription>
              Best practices for error recovery and graceful degradation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Recovery Patterns
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    Error boundaries to prevent application crashes
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    Retry mechanisms for network failures
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    Graceful fallbacks for missing data
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    Progressive loading and error states
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  User Experience
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    Clear, actionable error messages
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    Toast notifications for immediate feedback
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    Loading states during recovery attempts
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    Offline detection and handling
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}