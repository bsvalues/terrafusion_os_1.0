import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileText, 
  BarChart4, 
  Download, 
  Calendar, 
  List, 
  Clock,
  PlusCircle
 } from '@mui/icons-material';
import { formatDate } from '@/lib/formatters';
import { CustomizableReport } from '@/components/CustomizableReport';
import { BatchReportGenerator } from '@/components/BatchReportGenerator';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('single');
  const [selectedValuationId, setSelectedValuationId] = useState<number | null>(null);
  
  // Fetch valuations for the dropdown
  const { data: valuations, isLoading: isLoadingValuations } = useQuery({
    queryKey: ['/api/valuations'],
    queryFn: async () => {
      const response = await fetch('/api/valuations');
      if (!response.ok) throw new Error('Failed to fetch valuations');
      return response.json();
    }
  });
  
  // Fetch incomes
  const { data: incomes, isLoading: isLoadingIncomes } = useQuery({
    queryKey: ['/api/incomes'],
    queryFn: async () => {
      const response = await fetch('/api/incomes');
      if (!response.ok) throw new Error('Failed to fetch incomes');
      return response.json();
    },
    enabled: !!selectedValuationId // Only fetch incomes when a valuation is selected
  });
  
  const [, setLocation] = useLocation();
  
  // Get the selected valuation object
  const selectedValuation = valuations?.data?.find(v => v.id === selectedValuationId);
  
  // Handle valuation selection
  const handleValuationChange = (value: string) => {
    setSelectedValuationId(Number(value));
  };
  
  // Navigate to valuation creation page
  const handleCreateValuation = () => {
    setLocation('/valuations/new');
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p
</>

className="text-muted-foreground">
            Generate and customize valuation reports
          </p>
        </div>
      </div>
      
      <Tabs
        defaultValue="single"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="single" className="flex items-center"><>

            <FileText className="mr-2 h-4 w-4" />
            Single Report
          </TabsTrigger>
          <TabsTrigger
</>

value="batch" className="flex items-center"><>

            <List className="mr-2 h-4 w-4" />
            Batch Reports
          </TabsTrigger>
          <TabsTrigger
</>

value="scheduled" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Scheduled Reports
          </TabsTrigger>
        </TabsList>
        
        {/* Single Report Tab */}
        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Generate a Customizable Report</CardTitle>
              <CardDescription
</>

</>>
                Create a detailed report for a specific valuation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="col-span-3"><>

                    <Label htmlFor="valuation-select">Select Valuation</Label>
                    <Select
</>

value={selectedValuationId?.toString()} onValueChange={handleValuationChange}>
                      <SelectTrigger className="w-full mt-1"><>

                        <SelectValue placeholder="Select a valuation" />
                      </SelectTrigger>
                      <SelectContent
</>

</>>
                        {isLoadingValuations ? (
                          <SelectItem value="loading" disabled>
                            Loading valuations...
                          </SelectItem>
                        ) : valuations?.data && valuations.data.length > 0 ? (
                          valuations.data.map((valuation) => (
                            <SelectItem key={valuation.id} value={valuation.id.toString()}>
                              {valuation.name} ({formatDate(new Date(valuation.createdAt))})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No valuations available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleCreateValuation}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create New
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                {selectedValuation ? (
                  isLoadingIncomes ? (
                    <div className="text-center py-6">Loading report data...</div>
                  ) : (
                    <CustomizableReport
                      valuation={selectedValuation}
                      valuations={valuations?.data || []}
                      incomes={incomes || []}
                    />
                  )
                ) : (
                  <div className="text-center py-6">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" /><>

                    <h3 className="mt-2 text-lg font-medium">No Valuation Selected</h3>
                    <p
</>

className="text-sm text-muted-foreground mt-1">
                      Select a valuation from the dropdown above to generate a report.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Batch Reports Tab */}
        <TabsContent value="batch">
          <BatchReportGenerator />
        </TabsContent>
        
        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled">
          <Card>
            <CardHeader><>

              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription
</>

</>>
                View and manage your scheduled reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-50" /><>

                <h3 className="mt-4 text-lg font-medium">No Scheduled Reports</h3>
                <p
</>

className="text-sm text-muted-foreground mt-1">
                  You don't have any scheduled reports. Create one in the Batch Reports tab.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('batch')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule a Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}