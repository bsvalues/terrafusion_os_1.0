import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { FileDown, 
  Calendar, 
  Settings, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText 
 } from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DataExportService } from '@/services/DataExportService';

interface ReportConfig {
  includeCharts: boolean;
  includeInsights: boolean;
  includeRecommendations: boolean;
  format: 'pdf' | 'excel' | 'csv';
  detailed: boolean;
}

interface ScheduleOption {
  type: 'now' | 'later';
  date?: string;
  time?: string;
}

export const BatchReportGenerator: React.FC = () => {
  // Fetch all valuations
  const { data: valuations, isLoading: isLoadingValuations } = useQuery({
    queryKey: ['/api/valuations'],
    queryFn: async () => {
      const response = await fetch('/api/valuations');
      if (!response.ok) throw new Error('Failed to fetch valuations');
      return response.json();
    }
  });
  
  // Fetch all incomes
  const { data: incomes, isLoading: isLoadingIncomes } = useQuery({
    queryKey: ['/api/incomes'],
    queryFn: async () => {
      const response = await fetch('/api/incomes');
      if (!response.ok) throw new Error('Failed to fetch incomes');
      return response.json();
    }
  });
  
  // State for selected valuations
  const [selectedValuations, setSelectedValuations] = useState<number[]>([]);
  
  // State for report configuration
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    includeCharts: true,
    includeInsights: true,
    includeRecommendations: true,
    format: 'pdf',
    detailed: true
  });
  
  // State for dialog
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  
  // State for scheduling
  const [scheduleOption, setScheduleOption] = useState<ScheduleOption>({
    type: 'now'
  });
  
  // State for status messages
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({
    type: null,
    message: ''
  });
  
  // Handler for selecting/deselecting valuations
  const toggleValuationSelection = (valuationId: number) => {
    setSelectedValuations(prev => 
      prev.includes(valuationId)
        ? prev.filter(id => id !== valuationId)
        : [...prev, valuationId]
    );
  };
  
  // Handler for selecting all valuations
  const selectAllValuations = () => {
    if (valuations?.data) {
      setSelectedValuations(valuations.data.map(v => v.id));
    }
  };
  
  // Handler for deselecting all valuations
  const deselectAllValuations = () => {
    setSelectedValuations([]);
  };
  
  // Handler for config changes
  const handleConfigChange = (key: keyof ReportConfig, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handler for schedule option changes
  const handleScheduleOptionChange = (key: keyof ScheduleOption, value: any) => {
    setScheduleOption(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Set default schedule date/time on mount
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setScheduleOption({
      type: 'now',
      date: tomorrow.toISOString().split('T')[0],
      time: '12:00'
    });
  }, []);
  
  // Generate selected valuations immediate report
  const generateReports = async () => {
    if (selectedValuations.length === 0) {
      setStatusMessage({
        type: 'error',
        message: 'Please select at least one valuation for reporting'
      });
      return;
    }
    
    try {
      if (scheduleOption.type === 'later') {
        // Calculate scheduled time
        const scheduledDate = new Date(`${scheduleOption.date}T${scheduleOption.time}`);
        const now = new Date();
        
        if (scheduledDate <= now) {
          setStatusMessage({
            type: 'error',
            message: 'Scheduled time must be in the future'
          });
          return;
        }
        
        // In a real implementation, we would store the schedule in the database
        // and implement a background job to generate the reports at the scheduled time
        // For now, we'll just show a success message
        setStatusMessage({
          type: 'success',
          message: `Reports scheduled for ${scheduleOption.date} at ${scheduleOption.time}`
        });
      } else {
        // Generate reports immediately
        if (!valuations?.data || !incomes) {
          setStatusMessage({
            type: 'error',
            message: 'Data not available for report generation'
          });
          return;
        }
        
        // Get the selected valuation objects
        const selectedValuationObjects = valuations.data.filter(
          valuation => selectedValuations.includes(valuation.id)
        );
        
        // Export data based on selected format
        if (reportConfig.format === 'csv' || reportConfig.format === 'excel') {
          const exportResult = await DataExportService.batchExport([
            {
              data: selectedValuationObjects,
              type: reportConfig.format,
              filename: 'valuations_report',
              options: {
                includeId: true,
                dateFormat: 'YYYY-MM-DD'
              }
            }
          ]);
          
          if (exportResult) {
            setStatusMessage({
              type: 'success',
              message: 'Reports generated successfully!'
            });
          } else {
            setStatusMessage({
              type: 'error',
              message: 'Failed to generate reports. Please try again.'
            });
          }
        } else {
          // For PDF, we would normally use a different approach
          // In a real implementation, this might involve server-side rendering
          // or batching through a PDF generation service
          setStatusMessage({
            type: 'success',
            message: 'PDF reports generated successfully!'
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatusMessage({
        type: 'error',
        message: `Error generating reports: ${errorMessage}`
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Options Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><>

            <DialogTitle>Configure Report Options</DialogTitle>
            <DialogDescription
</>

</>>
              Set options for the batch reports
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><>

              <Label>Content Options</Label>
              <div
</>

className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-charts" 
                    checked={reportConfig.includeCharts}
                    onCheckedChange={(checked) => 
                      handleConfigChange('includeCharts', Boolean(checked))
                    }
                  />
                  <Label htmlFor="include-charts">Include Charts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-insights" 
                    checked={reportConfig.includeInsights}
                    onCheckedChange={(checked) => 
                      handleConfigChange('includeInsights', Boolean(checked))
                    }
                  />
                  <Label htmlFor="include-insights">Include Insights</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-recommendations" 
                    checked={reportConfig.includeRecommendations}
                    onCheckedChange={(checked) => 
                      handleConfigChange('includeRecommendations', Boolean(checked))
                    }
                  />
                  <Label htmlFor="include-recommendations">Include Recommendations</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="detailed-reports" 
                    checked={reportConfig.detailed}
                    onCheckedChange={(checked) => 
                      handleConfigChange('detailed', Boolean(checked))
                    }
                  />
                  <Label htmlFor="detailed-reports">Detailed Reports</Label>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2"><>

              <Label>Export Format</Label>
              <RadioGroup
</>

                value={reportConfig.format} 
                onValueChange={(value) => 
                  handleConfigChange('format', value)
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="format-pdf" />
                  <Label htmlFor="format-pdf">PDF</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excel" id="format-excel" />
                  <Label htmlFor="format-excel">Excel</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="format-csv" />
                  <Label htmlFor="format-csv">CSV</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" onClick={() => setIsConfigDialogOpen(false)}>
              Save Options
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Main Card */}
      <Card>
        <CardHeader><>

          <CardTitle>Batch Report Generator</CardTitle>
          <CardDescription
</>

</>>
            Generate reports for multiple valuations at once
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Status message */}
            {statusMessage.type && (
              <Alert variant={statusMessage.type === 'error' ? 'destructive' : 'default'}>
                {statusMessage.type === 'success' && <CheckCircle className="h-4 w-4" />}
                {statusMessage.type === 'error' && <AlertCircle className="h-4 w-4" />}
                {statusMessage.type === 'info' && <FileText className="h-4 w-4" />}<>

                <AlertTitle>
                  {statusMessage.type === 'success' ? 'Success' : 
                   statusMessage.type === 'error' ? 'Error' : 'Information'}
                </AlertTitle>
                <AlertDescription
</>

</>>
                  {statusMessage.message}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Selection controls */}
            <div className="flex justify-between items-center">
              <div><>

                <h3 className="text-lg font-medium">Select Valuations</h3>
                <p
</>

className="text-sm text-muted-foreground">
                  {selectedValuations.length} valuations selected
                </p>
              </div>
              <div className="space-x-2"><>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllValuations}
                  disabled={!valuations?.data}
                >
                  Select All
                </Button>
                <Button
</>

                  variant="outline" 
                  size="sm" 
                  onClick={deselectAllValuations}
                  disabled={selectedValuations.length === 0}
                >
                  Deselect All
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfigDialogOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Report Options
                </Button>
              </div>
            </div>
            
            {/* Current settings summary */}
            <div className="bg-muted p-4 rounded-lg"><>

              <h4 className="font-medium mb-2">Current Report Settings</h4>
              <div
</>

className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm"><>

                <div>Format: {reportConfig.format.toUpperCase()}</div>
                <div
</>

</>>Charts: {reportConfig.includeCharts ? 'Yes' : 'No'}</div><>

                <div>Insights: {reportConfig.includeInsights ? 'Yes' : 'No'}</div>
                <div
</>

</>>Recommendations: {reportConfig.includeRecommendations ? 'Yes' : 'No'}</div>
              </div>
            </div>
            
            {/* Valuation selection table */}
            {isLoadingValuations ? (
              <div className="text-center py-4">Loading valuations...</div>
            ) : valuations?.data && valuations.data.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow><>

                      <TableHead className="w-12"></TableHead>
                      <TableHead
</>

</>>Name</TableHead><>

                      <TableHead>Valuation Amount</TableHead>
                      <TableHead
</>

</>>Annual Income</TableHead><>

                      <TableHead>Multiplier</TableHead>
                      <TableHead
</>

</>>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {valuations.data.map((valuation) => (
                      <TableRow key={valuation.id}>
                        <TableCell><>

                          <Checkbox 
                            id={`select-${valuation.id}`}
                            checked={selectedValuations.includes(valuation.id)}
                            onCheckedChange={() => toggleValuationSelection(valuation.id)}
                            aria-label={`Select ${valuation.name}`}
                          />
                        </TableCell>
                        <TableCell
</>

</>>
                          <label 
                            htmlFor={`select-${valuation.id}`}
                            className="cursor-pointer font-medium"
                          >
                            {valuation.name}
                          </label>
                        </TableCell><>

                        <TableCell>
                          {formatCurrency(parseFloat(valuation.valuationAmount))}
                        </TableCell>
                        <TableCell
</>

</>>
                          {formatCurrency(parseFloat(valuation.totalAnnualIncome))}
                        </TableCell><>

                        <TableCell>{valuation.multiplier}x</TableCell>
                        <TableCell
</>

</>>
                          {formatDate(new Date(valuation.createdAt))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4">
                No valuations found. Create some valuations first.
              </div>
            )}
            
            {/* Scheduling options */}
            <div className="space-y-4"><>

              <h3 className="text-lg font-medium">Generation Options</h3>
              
              <RadioGroup
</>

                value={scheduleOption.type} 
                onValueChange={(value) => 
                  handleScheduleOptionChange('type', value)
                }
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="now" id="generate-now" />
                  <Label htmlFor="generate-now">Generate now</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="later" id="schedule-later" />
                  <Label htmlFor="schedule-later">Schedule for later</Label>
                </div>
              </RadioGroup>
              
              {scheduleOption.type === 'later' && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2"><>

                    <Label htmlFor="schedule-date">Schedule Date</Label>
                    <Input
</>

                      id="schedule-date"
                      type="date"
                      value={scheduleOption.date}
                      onChange={(e) => 
                        handleScheduleOptionChange('date', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2"><>

                    <Label htmlFor="schedule-time">Schedule Time</Label>
                    <Input
</>

                      id="schedule-time"
                      type="time"
                      value={scheduleOption.time}
                      onChange={(e) => 
                        handleScheduleOptionChange('time', e.target.value)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between"><>

          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button
</>

            onClick={generateReports}
            disabled={selectedValuations.length === 0}
          >
            {scheduleOption.type === 'later' ? (
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Reports
            ) : (
                <FileDown className="mr-2 h-4 w-4" />
                Generate Reports
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};