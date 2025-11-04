import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BarChart3, Calendar  } from '@mui/icons-material';
import { Badge } from '@/components/ui/badge';
import SpectacularReportGenerator from '@/components/SpectacularReportGenerator';

export default function Reports() {
  const [selectedYear, setSelectedYear] = useState('2024');

  const { data: piltHistory } = useQuery({
    queryKey: ['/api/pilt/history']
  });

  const { data: distributions } = useQuery({
    queryKey: ['/api/pilt/distribution', selectedYear],
    queryFn: () => fetch(`/api/pilt/distribution?year=${selectedYear}`).then(res => res.json())
  });

  const availableYears = piltHistory && Array.isArray(piltHistory) ? 
    Array.from(new Set(piltHistory.map((p: any) => p.year))).sort().reverse() : 
    ['2024', '2023', '2022', '2021'];

  const currentYearData = piltHistory && Array.isArray(piltHistory) ? 
    piltHistory.find((p: any) => p.year === selectedYear) : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><>

          <h1 className="text-3xl font-bold">PILT Reports & Analytics</h1>
          <p
</> className="text-muted-foreground">
            Generate comprehensive reports and advanced analytics for PILT data
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32"><>

              <SelectValue />
            </SelectTrigger>
            <SelectContent
</>>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {currentYearData && (
        <Card>
          <CardHeader><>

            <CardTitle>Year {selectedYear} Overview</CardTitle>
            <CardDescription
</>>
              Key metrics for the selected year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><>

                <div className="text-2xl font-bold text-green-600">
                  ${parseFloat(currentYearData.amount).toLocaleString()}
                </div>
                <p
</> className="text-sm text-muted-foreground">Total PILT Amount</p>
              </div>
              <div><>

                <div className="text-2xl font-bold text-blue-600">
                  {distributions?.length || 0}
                </div>
                <p
</> className="text-sm text-muted-foreground">Districts</p>
              </div>
              <div><>

                <div className="text-2xl font-bold text-purple-600">
                  {currentYearData.assessedValue ? 
                    `$${parseFloat(currentYearData.assessedValue).toLocaleString()}` : 
                    'N/A'
                  }
                </div>
                <p
</> className="text-sm text-muted-foreground">Assessed Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics" className="flex items-center gap-2"><>

            <BarChart3 className="h-4 w-4" />
            Advanced Analytics
          </TabsTrigger>
          <TabsTrigger
</> value="official" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Official Letters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics"><>

          <SpectacularReportGenerator />
        </TabsContent>

        <TabsContent
</> value="official">
          <Card>
            <CardHeader><>

              <CardTitle>Official Report Templates</CardTitle>
              <CardDescription
</>>
                Generate official letters and reports for state agencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader><>

                    <CardTitle className="text-base">Assessor Letter</CardTitle>
                    <CardDescription
</>>Official letter to Department of Energy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Letter
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader><>

                    <CardTitle className="text-base">Treasurer Report</CardTitle>
                    <CardDescription
</>>Financial distribution summary</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader><>

                    <CardTitle className="text-base">District Summary</CardTitle>
                    <CardDescription
</>>Detailed breakdown by district</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Summary
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}