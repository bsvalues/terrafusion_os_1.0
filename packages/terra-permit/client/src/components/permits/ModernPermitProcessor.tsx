import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileCheck, Box, AlertCircle, Sparkles, Brain, ArrowRight, BarChart, Activity, RefreshCw, Settings, Shield, FileWarning } from 'lucide-react';
import ContextualTooltip from '@/components/ui/contextual-tooltip';
import { useHelp } from '@/contexts/HelpContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PermitRecommendationEngine } from '@/components/ai/PermitRecommendationEngine';
import { AdvancedProcessingOptimization } from '@/components/ai/AdvancedProcessingOptimization';
import ErrorDisplay, { ErrorAction } from '@/components/ui/error-display';

/**
 * TerraFusionProcessor - The TerraFusionPermit processing component for permit data
 * with integrated contextual help and tooltips.
 */
const TerraFusionProcessor: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [simulatedUploadId, setSimulatedUploadId] = useState<number | null>(null);
  const [showAiRecommendations, setShowAiRecommendations] = useState(false);
  const [showAdvancedOptimization, setShowAdvancedOptimization] = useState(false);
  
  // Error handling states
  const [error, setError] = useState<{
    code: string;
    title: string;
    description: string;
    details?: string;
    severity: 'error' | 'warning' | 'info';
    helpTopic?: string;
    step?: number;
    recoverable: boolean;
  } | null>(null);
  
  const { showHelp } = useHelp();
  
  // Generate a simulated upload ID when processing is complete
  useEffect(() => {
    if (showSuccessAlert && !simulatedUploadId) {
      // Generate a random ID for demonstration purposes
      setSimulatedUploadId(Math.floor(Math.random() * 10000) + 1);
      
      // Show AI recommendations after a short delay
      setTimeout(() => {
        setShowAiRecommendations(true);
      }, 1000);
    }
  }, [showSuccessAlert, simulatedUploadId]);
  
  // Simulate processing step change with potential errors
  const nextStep = () => {
    // Clear any existing errors first
    setError(null);
    
    if (processingStep < 3) {
      // Random chance to trigger an error based on the current step
      const errorChance = Math.random();
      
      // Different error probability for each step to showcase different error types
      if (processingStep === 1 && errorChance < 0.3) {
        // 30% chance to show validation error during validation step
        simulateDataValidationError();
      } else if (processingStep === 2 && errorChance < 0.3) {
        // 30% chance to show AI processing error during AI step
        simulateAIProcessingError();
      } else {
        // Normal progress - move to next step
        setProcessingStep(prev => prev + 1);
      }
    } else {
      setShowSuccessAlert(true);
    }
  };
  
  // Simulate upload progress
  const simulateUpload = () => {
    // Clear any existing errors
    setError(null);
    setUploadProgress(0);
    
    // Random chance to trigger an error for demonstration
    const shouldSimulateError = Math.random() < 0.3; // 30% chance of error
    
    if (shouldSimulateError) {
      // Simulate an upload error after a short delay
      setTimeout(() => {
        setUploadProgress(70); // Show progress bar at 70% when error occurs
        setError({
          code: 'UPLOAD_ERROR',
          title: 'File Upload Error',
          description: 'There was a problem uploading your permit files to the server.',
          details: 'The server connection was interrupted during file upload. This could be due to network issues or file server constraints.',
          severity: 'error',
          helpTopic: 'upload-troubleshooting',
          recoverable: true
        });
      }, 1500);
    } else {
      // Normal upload progress simulation
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setProcessingStep(1);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    }
  };
  
  // Error recovery functions
  const handleErrorRetry = () => {
    setError(null);
    
    // Retry upload
    if (processingStep === 0) {
      simulateUpload();
    } 
    // Retry the current processing step
    else {
      // First reset the current step to trigger a reprocessing
      setProcessingStep(prev => {
        // If we're already at step 0, stay there
        if (prev === 0) return 0;
        // Otherwise go back one step
        return prev - 1;
      });
      
      // Then move forward after a delay to simulate reprocessing
      setTimeout(() => {
        setProcessingStep(prev => prev + 1);
      }, 1000);
    }
  };
  
  // Method to handle file validation errors during data validation step
  const simulateDataValidationError = () => {
    setError({
      code: 'VALIDATION_ERROR',
      title: 'Permit Data Validation Failed',
      description: 'Some of your permit records contain invalid or missing data.',
      details: 'We found 3 permits with missing address information and 2 permits with invalid dates. These need to be corrected before processing can continue.',
      severity: 'warning',
      helpTopic: 'data-validation',
      step: 1,
      recoverable: true
    });
  };
  
  // Method to handle AI processing errors
  const simulateAIProcessingError = () => {
    setError({
      code: 'AI_SERVICE_ERROR',
      title: 'AI Processing Service Unavailable',
      description: 'We couldn\'t connect to the AI processing service.',
      details: 'The connection to the OpenAI service timed out. This could be due to service interruption or API credential issues.',
      severity: 'error',
      helpTopic: 'ai-troubleshooting',
      step: 2,
      recoverable: true
    });
  };
  
  // Processing steps display
  const renderProcessingSteps = () => {
    const steps = [
      { 
        title: 'Upload Complete', 
        description: 'Your permit data has been successfully uploaded and is ready for processing.',
        icon: Upload,
        tooltipContent: 'All files have been uploaded to the server and saved for further processing.'
      },
      { 
        title: 'Data Validation', 
        description: 'Automatically validating permit entries and checking for errors.',
        icon: FileCheck,
        tooltipContent: 'This step checks for missing fields, inconsistent data types, and validates against permit rules.'
      },
      { 
        title: 'AI Processing', 
        description: 'Applying AI analysis to identify patterns and make recommendations.',
        icon: Sparkles,
        tooltipContent: 'Our AI models analyze your data to identify trends, flag potential issues, and suggest optimizations.'
      },
      { 
        title: 'Ready for Review', 
        description: 'All processing complete. Your permits are ready for final review.',
        icon: Box,
        tooltipContent: 'Review the processed permits, make any final adjustments, and prepare for export or database storage.'
      }
    ];
    
    return (
      <div className="space-y-4 mt-6">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = processingStep > index;
          const isActive = processingStep === index;
          
          return (
            <div 
              key={index}
              className={`flex items-start p-4 rounded-lg border transition-all ${
                isActive ? 'border-terrafusion-primary bg-terrafusion-primary/5' : 
                isCompleted ? 'border-terrafusion-green bg-terrafusion-green/10' : 
                'border-gray-200'
              }`}
            >
              <div className={`p-2 rounded-full mr-4 ${
                isActive ? 'bg-terrafusion-primary text-white' : 
                isCompleted ? 'bg-terrafusion-green text-white' : 
                'bg-gray-100'
              }`}>
                <StepIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className={`font-medium ${isActive || isCompleted ? 'text-black' : 'text-gray-500'}`}>
                    {step.title}
                  </h3>
                  <ContextualTooltip
                    content={step.tooltipContent}
                    className="ml-2"
                    iconClassName={`h-4 w-4 ${isActive ? 'text-primary' : 'text-gray-400'}`}
                  />
                </div>
                <p className={`text-sm mt-1 ${isActive || isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                  {step.description}
                </p>
              </div>
              {isActive && (
                <Button size="sm" className="ml-auto self-center" onClick={nextStep}>
                  {index === steps.length - 1 ? 'Complete' : 'Next'}
                </Button>
              )}
              {isCompleted && (
                <div className="ml-auto text-terrafusion-green self-center">
                  <FileCheck className="h-5 w-5" />
                </div>
              )}
            </div>
          );
        })}
        
        {showSuccessAlert && (
          <Alert className="bg-terrafusion-green/10 border-terrafusion-green/30 text-terrafusion-primary mt-4">
            <AlertCircle className="h-4 w-4 text-terrafusion-green" />
            <AlertTitle>Processing Complete!</AlertTitle>
            <AlertDescription>
              All permit processing steps have been completed successfully. You can now review the results or download the processed data.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };
  
  // Render AI recommendation panel
  const renderAiRecommendationPanel = () => {
    return (
      <Card className="border-terrafusion-primary/20 mt-6">
        <CardHeader className="bg-terrafusion-primary/5 pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Brain className="h-5 w-5 text-terrafusion-primary" />
                AI Permit Recommendations
                <ContextualTooltip
                  content="Our AI analyzes your permit data and provides intelligent recommendations to help you process permits more efficiently."
                  className="ml-2"
                  asSpan={true}
                />
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Intelligent insights and suggestions based on your permit data
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                <span>AI-Powered</span>
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAdvancedOptimization(!showAdvancedOptimization)}
                aria-label={showAdvancedOptimization ? 'Hide advanced optimization options' : 'Show advanced optimization options'}
                aria-expanded={showAdvancedOptimization}
              >
                {showAdvancedOptimization ? 'Hide Advanced' : 'Show Advanced'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Processing Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">84%</span>
                    <Badge className="bg-terrafusion-green/20 text-terrafusion-primary hover:bg-terrafusion-green/30">+12%</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Above department average</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Permits Processed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">42</span>
                    <span className="text-xs text-gray-500">of 42</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">100% complete</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">1.3</span>
                    <span className="text-xs">min/permit</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">30% faster than average</div>
                </CardContent>
              </Card>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-terrafusion-blue" />
                Top Recommendations
                <ContextualTooltip
                  content="AI-generated suggestions to improve your permit processing efficiency"
                  className="ml-2"
                  asSpan={true}
                />
              </h4>
              
              <div className="space-y-3">
                <div className="flex gap-3 p-3 border rounded-lg bg-terrafusion-beige/30">
                  <div className="p-2 bg-terrafusion-primary/10 rounded-full h-fit">
                    <BarChart className="h-4 w-4 text-terrafusion-primary" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium">Group Similar Permits</h5>
                    <div className="text-xs text-gray-600 mt-0.5">Processing permits by neighborhood or type can increase efficiency by 18%</div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">High Impact</Badge>
                      <Badge variant="outline" className="text-xs">Easy to Implement</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 p-3 border rounded-lg bg-terrafusion-blue/10">
                  <div className="p-2 bg-terrafusion-blue/20 rounded-full h-fit">
                    <ArrowRight className="h-4 w-4 text-terrafusion-blue" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium">Prioritize Residential Permits</h5>
                    <div className="text-xs text-gray-600 mt-0.5">Based on current backlog analysis, residential permits should be prioritized</div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">Medium Impact</Badge>
                      <Badge variant="outline" className="text-xs">Strategic</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  aria-label="View all AI-generated recommendations"
                >
                  View All Recommendations
                  <ContextualTooltip
                    content="See all AI-generated recommendations for optimizing your permit process"
                    className="ml-2"
                    asSpan={true}
                  />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Permit Processor
                <ContextualTooltip
                  content="This modern interface guides you through uploading, processing, and analyzing permit data with contextual help at every step."
                  title="Smart Permit Processing"
                  className="ml-2"
                  asSpan={true}
                />
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Upload, validate, and process permit data with intelligent guidance and contextual help
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => showHelp('permits')}
              aria-label="Open permit processing help guide"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Help Guide
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upload" className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Upload & Process
                <ContextualTooltip
                  content="Upload permit files and intelligently process them using our advanced AI tools."
                  className="ml-2"
                  asSpan={true}
                />
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export & Download
                <ContextualTooltip
                  content="Export processed permits in various formats or download templates."
                  className="ml-2"
                  asSpan={true}
                />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              {/* Display error component when an error is present */}
              {error && (
                <div className="mb-4">
                  <ErrorDisplay
                    title={error.title}
                    description={error.description}
                    severity={error.severity}
                    errorCode={error.code}
                    errorDetails={error.details}
                    helpTopic={error.helpTopic}
                    actions={[
                      {
                        label: 'Retry',
                        onClick: handleErrorRetry,
                        icon: RefreshCw,
                        primary: true
                      },
                      {
                        label: 'Settings',
                        onClick: () => showHelp('system-settings'),
                        icon: Settings
                      },
                      ...(error.code === 'AI_SERVICE_ERROR' ? [
                        {
                          label: 'Skip AI Processing',
                          onClick: () => {
                            setError(null);
                            // Skip to next step
                            setProcessingStep(3);
                          },
                          icon: ArrowRight
                        }
                      ] : []),
                      ...(error.code === 'VALIDATION_ERROR' ? [
                        {
                          label: 'Edit Permits',
                          onClick: () => {
                            setError(null);
                            // This would typically open a permit editor
                            // For now just reset the step
                            setTimeout(() => setProcessingStep(2), 500);
                          },
                          icon: FileWarning
                        }
                      ] : [])
                    ]}
                  />
                </div>
              )}
              
              {processingStep === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload Permit Files</h3>
                  <div className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                    Upload Excel (.xlsx), CSV or JSON files containing permit data.
                    <ContextualTooltip
                      content="We support standard permit formats and can automatically detect fields for standard permit types."
                      className="ml-1"
                      asSpan={true}
                    />
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button 
                      onClick={simulateUpload}
                      aria-label="Select permit files to upload"
                    >
                      Select Files
                    </Button>
                    <div className="inline-flex items-center">
                      <Button 
                        variant="outline"
                        aria-label="Use a predefined permit template"
                      >
                        Use Template
                      </Button>
                      <ContextualTooltip
                        content="Download a standardized template that's pre-formatted for easy data entry and processing."
                        className="ml-2"
                        asSpan={true}
                      />
                    </div>
                  </div>
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-6 max-w-md mx-auto">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {renderProcessingSteps()}
                  
                  {/* AI Recommendation Panel */}
                  {showAiRecommendations && renderAiRecommendationPanel()}
                  
                  {/* Advanced Processing Optimization - only show when requested */}
                  {showAiRecommendations && showAdvancedOptimization && (
                    <AdvancedProcessingOptimization 
                      uploadId={simulatedUploadId || undefined} 
                      className="mt-6"
                    />
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="export" className="space-y-4">
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Download className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Export Processed Permits</h3>
                <div className="text-sm text-gray-500 mb-4">
                  Download your processed permit data in various formats
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="inline-flex items-center">
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center"
                      aria-label="Download as Excel format with data validation"
                    >
                      Excel Format
                    </Button>
                    <ContextualTooltip
                      content="Download as a formatted Excel file with data validation and formatting applied."
                      className="ml-2"
                      asSpan={true}
                    />
                  </div>
                  <div className="inline-flex items-center">
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center"
                      aria-label="Download as CSV format for maximum compatibility"
                    >
                      CSV Format
                    </Button>
                    <ContextualTooltip
                      content="Download as a simple CSV file for maximum compatibility with other systems."
                      className="ml-2"
                      asSpan={true}
                    />
                  </div>
                  <div className="inline-flex items-center">
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center"
                      aria-label="Generate a comprehensive PDF report"
                    >
                      PDF Report
                    </Button>
                    <ContextualTooltip
                      content="Generate a comprehensive PDF report with data visualizations and summaries."
                      className="ml-2"
                      asSpan={true}
                    />
                  </div>
                  <div className="inline-flex items-center">
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center"
                      aria-label="Export as JSON for integration with web services"
                    >
                      JSON Data
                    </Button>
                    <ContextualTooltip
                      content="Export as JSON for integration with web services and APIs."
                      className="ml-2"
                      asSpan={true}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TerraFusionProcessor;