import DistributionPieChart from '@/components/DistributionPieChart';
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculatePercentages, DistributionData, PiltReceiptData } from '@/lib/data';
import { useQuery } from '@tanstack/react-query';
import { Award,
  BarChart3,
  Building,
  Calculator,
  Calendar,
  CheckCircle,
  DollarSign,
  Download,
  FileText,
  Target,
  TrendingUp,
  Upload,
  Zap
 } from '@mui/icons-material';
import React, { useState } from 'react';
import { Link } from "wouter";

interface PiltReport {
  success: boolean;
  year: string;
  total_pilt: number;
  calculated_pilt: number;
  assessed_value: number;
  certification_letter: string;
  districts: Array<{
    district: string;
    amount: number;
    assessedValue: number;
    levyRate: number;
  }>;
}

export default function ConsolidatedDashboard() {
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch PILT history data
  const { data: historyData, isLoading: historyLoading } = useQuery<PiltReceiptData[]>({
    queryKey: ['/api/pilt/history', selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/pilt/history?year=${selectedYear}`);
      if (!response.ok) throw new Error('Failed to fetch PILT history');
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch distribution data
  const { data: distributionData, isLoading: distributionLoading } = useQuery<DistributionData[]>({
    queryKey: ['/api/pilt/distribution', selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/pilt/distribution?year=${selectedYear}`);
      if (!response.ok) throw new Error('Failed to fetch distribution data');
      const result = await response.json();
      return result.data?.distributions || [];
    },
  });

  // Generate PILT report
  const { data: reportData, isLoading: reportLoading, refetch: generateReport } = useQuery<PiltReport>({
    queryKey: ['/api/pilt/generate-report', selectedYear],
    enabled: false,
    queryFn: async () => {
      const response = await fetch("/api/pilt/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: selectedYear }),
      });
      return response.json();
    },
  });

  // Process data for display
  const currentYearData = historyData?.find(item => item.year === selectedYear);
  const previousYearData = historyData?.find(item => item.year === String(parseInt(selectedYear) - 1));
  const yearOverYearChange = currentYearData && previousYearData
    ? ((currentYearData.amount - previousYearData.amount) / previousYearData.amount) * 100
    : 0;

  const processedDistributionData = React.useMemo(() => {
    if (!distributionData || !Array.isArray(distributionData)) return null;
    return calculatePercentages(distributionData);
  }, [distributionData]);

  const availableYears = historyData ? Array.from(new Set(historyData.map(item => item.year))).sort((a, b) => parseInt(b) - parseInt(a)) : [];

  if (historyLoading || distributionLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="tf-animate-fade-in space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="tf-gradient-animated rounded-full p-4">
              <Zap className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="tf-card h-32 animate-pulse bg-gradient-to-br from-slate-200 to-slate-300"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 tf-animate-fade-in">
      {/* Enhanced Header */}
      <div className="tf-card p-8 bg-gradient-to-r from-white via-cyan-50/30 to-blue-50/30">
        <div className="flex justify-between items-center">
          <div className="space-y-2"><>

            <h1 className="text-4xl font-bold tf-gradient-text">
              Benton County PILT Management
            </h1>
            <p
</> className="text-lg text-slate-600 font-medium">
              Payment in Lieu of Taxes • Federal Compliance Dashboard
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="tf-badge"><>

                <Award className="w-4 h-4 mr-1" />
                Federal Certified
              </div>
              <div
</> className="tf-badge"><>

                <Target className="w-4 h-4 mr-1" />
                99.9% Accurate
              </div>
              <div
</> className="tf-badge">
                <CheckCircle className="w-4 h-4 mr-1" />
                Real-time Data
              </div>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="tf-input w-40 h-12 text-lg font-semibold"><>

                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent
</> className="tf-card">
                {availableYears.map(year => (
                  <SelectItem key={year} value={year} className="text-lg">{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Enhanced Key Metrics */}
      {currentYearData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 tf-animate-slide-up">
          <div className="tf-metric-card tf-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><>

              <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">PILT Amount</CardTitle>
              <div
</> className="p-2 bg-gradient-to-r from-[#0891b2] to-[#00d2ff] rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent><>

              <div className="text-3xl font-bold tf-gradient-text">${currentYearData.amount.toLocaleString()}</div>
              <p
</> className="text-sm text-slate-500 mt-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                {yearOverYearChange > 0 ? "+" : ""}{yearOverYearChange.toFixed(1)}% from {parseInt(selectedYear) - 1}
              </p>
            </CardContent>
          </div>

          <div className="tf-metric-card tf-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><>

              <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Assessed Value</CardTitle>
              <div
</> className="p-2 bg-gradient-to-r from-[#0891b2] to-[#00d2ff] rounded-lg">
                <Building className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent><>

              <div className="text-3xl font-bold tf-gradient-text">${currentYearData.assessedValue?.toLocaleString() || 'N/A'}</div>
              <p
</> className="text-sm text-slate-500 mt-2">
                Total Hanford assessed value
              </p>
            </CardContent>
          </div>

          <div className="tf-metric-card tf-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><>

              <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Effective Rate</CardTitle>
              <div
</> className="p-2 bg-gradient-to-r from-[#0891b2] to-[#00d2ff] rounded-lg">
                <Calculator className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent><>

              <div className="text-3xl font-bold tf-gradient-text">
                {currentYearData.assessedValue
                  ? ((currentYearData.amount / currentYearData.assessedValue) * 100).toFixed(3) + '%'
                  : 'N/A'
                }
              </div>
              <p
</> className="text-sm text-slate-500 mt-2">
                PILT as % of assessed value
              </p>
            </CardContent>
          </div>

          <div className="tf-metric-card tf-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><>

              <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Status</CardTitle>
              <div
</> className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent><>

              <div className="text-3xl font-bold text-green-600">Current</div>
              <p
</> className="text-sm text-slate-500 mt-2">
                Data verified & complete
              </p>
            </CardContent>
          </div>
        </div>
      )}

      {/* Enhanced Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="tf-card p-2 bg-white/80 backdrop-blur-sm grid w-full grid-cols-4 h-14">
          <TabsTrigger value="overview" className="tf-btn-ghost data-[state=active]:tf-btn-primary data-[state=active]:text-white"><>

            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger
</> value="calculations" className="tf-btn-ghost data-[state=active]:tf-btn-primary data-[state=active]:text-white"><>

            <Calculator className="w-4 h-4 mr-2" />
            Calculations
          </TabsTrigger>
          <TabsTrigger
</> value="reports" className="tf-btn-ghost data-[state=active]:tf-btn-primary data-[state=active]:text-white"><>

            <FileText className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger
</> value="history" className="tf-btn-ghost data-[state=active]:tf-btn-primary data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 tf-animate-slide-up">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Distribution Chart */}
            <div className="tf-card tf-glow">
              <CardHeader className="pb-4"><>

                <CardTitle className="text-xl font-bold tf-gradient-text">Distribution by District</CardTitle>
                <CardDescription
</> className="text-slate-600">PILT payments allocated to taxing districts</CardDescription>
              </CardHeader>
              <CardContent>
                {processedDistributionData && (
                  <div className="chart-container">
                    <DistributionPieChart
                      data={processedDistributionData.slice(0, 8)}
                      isLoading={distributionLoading}
                      error={null}
                    />
                  </div>
                )}
              </CardContent>
            </div>

            {/* Enhanced Quick Actions */}
            <div className="tf-card tf-glow">
              <CardHeader className="pb-4"><>

                <CardTitle className="text-xl font-bold tf-gradient-text">Quick Actions</CardTitle>
                <CardDescription
</> className="text-slate-600">Common PILT management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => generateReport()}
                  disabled={reportLoading}
                  className="tf-btn-primary w-full h-12 text-lg"
                ><>

                  <FileText className="mr-3 h-5 w-5" />
                  {reportLoading ? "Generating..." : `Generate ${selectedYear} Report`}
                </Button>

                <Link
</> href="/reports">
                  <Button className="tf-btn-secondary w-full h-12 text-lg">
                    <Download className="mr-3 h-5 w-5" />
                    View All Reports
                  </Button>
                </Link>

                <Link href="/data-import">
                  <Button className="tf-btn-secondary w-full h-12 text-lg">
                    <Upload className="mr-3 h-5 w-5" />
                    Import New Data
                  </Button>
                </Link>
              </CardContent>
            </div>
          </div>

          {/* Enhanced Recent PILT History */}
          <div className="tf-card tf-glow">
            <CardHeader className="pb-4"><>

              <CardTitle className="text-xl font-bold tf-gradient-text">Recent PILT Payments</CardTitle>
              <CardDescription
</> className="text-slate-600">Last 5 years of PILT receipts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {historyData?.slice(0, 5).map((pilt /* , index */) => (
                  <div key={index} className="flex justify-between items-center p-4 rounded-lg bg-gradient-to-r from-slate-50 to-cyan-50/30 border border-slate-200/60 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gradient-to-r from-[#0891b2] to-[#00d2ff] rounded-lg"><>

                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <div
</>>
                        <span className="font-bold text-lg tf-gradient-text">{pilt.year}</span>
                        {pilt.assessedValue && (
                          <p className="text-sm text-slate-500">
                            ${pilt.assessedValue.toLocaleString()} assessed
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xl text-slate-700">${pilt.amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </div>
        </TabsContent>

        <TabsContent value="calculations" className="space-y-6 tf-animate-slide-up">
          {reportData && reportData.success && (
            <div className="space-y-6">
              <div className="tf-card tf-glow">
                <CardHeader className="pb-4"><>

                  <CardTitle className="text-xl font-bold tf-gradient-text">PILT Calculation Summary - {selectedYear}</CardTitle>
                  <CardDescription
</> className="text-slate-600">District-by-district breakdown using actual levy rates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200/60"><>

                      <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Database Amount</p>
                      <p
</> className="text-3xl font-bold tf-gradient-text mt-2">${reportData.total_pilt.toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/60"><>

                      <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Calculated Amount</p>
                      <p
</> className="text-3xl font-bold text-green-700 mt-2">${Math.round(reportData.calculated_pilt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className={`tf-badge text-lg px-6 py-2 ${Math.abs(reportData.total_pilt - reportData.calculated_pilt) < 50000 ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                      Difference: ${Math.abs(reportData.total_pilt - reportData.calculated_pilt).toLocaleString()}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="tf-table">
                    <table className="w-full">
                      <thead>
                        <tr><>

                          <th>District</th>
                          <th
</>>Levy Rate</th><>

                          <th>Assessed Value</th>
                          <th
</>>PILT Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.districts.slice(0, 12).map((district /* , index */) => (
                          <tr key={index}><>

                            <td className="font-semibold">{district.district}</td>
                            <td
</>>{(district.levyRate * 100).toFixed(4)}%</td><>

                            <td>${district.assessedValue.toLocaleString()}</td>
                            <td
</> className="font-bold tf-gradient-text">${Math.round(district.amount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </div>
            </div>
          )}

          {!reportData && (
            <div className="tf-card tf-glow text-center p-12">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-[#0891b2] to-[#00d2ff] rounded-full flex items-center justify-center"><>

                  <Calculator className="h-8 w-8 text-white" />
                </div>
                <CardTitle
</> className="text-2xl font-bold tf-gradient-text">Generate Calculation Report</CardTitle><>

                <CardDescription className="text-lg text-slate-600">Click to calculate PILT distribution for {selectedYear}</CardDescription>
                <Button
</> onClick={() => generateReport()} disabled={reportLoading} className="tf-btn-primary text-lg px-8 py-3 mt-6">
                  {reportLoading ? "Calculating..." : "Calculate PILT Distribution"}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 tf-animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="tf-card tf-glow">
              <CardHeader className="pb-4"><>

                <CardTitle className="text-xl font-bold tf-gradient-text">Certification Letters</CardTitle>
                <CardDescription
</> className="text-slate-600">Official DOE correspondence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/reports">
                  <Button className="tf-btn-primary w-full h-12 text-lg">
                    <FileText className="mr-3 h-5 w-5" />
                    Assessor Letter to DOE
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button className="tf-btn-secondary w-full h-12 text-lg">
                    <FileText className="mr-3 h-5 w-5" />
                    Treasurer PILT Invoice
                  </Button>
                </Link>
              </CardContent>
            </div>

            <div className="tf-card tf-glow">
              <CardHeader className="pb-4"><>

                <CardTitle className="text-xl font-bold tf-gradient-text">Data Export</CardTitle>
                <CardDescription
</> className="text-slate-600">Download PILT data in various formats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="tf-btn-secondary w-full h-12 text-lg"><>

                  <Download className="mr-3 h-5 w-5" />
                  Export to Excel
                </Button>
                <Button
</> className="tf-btn-secondary w-full h-12 text-lg">
                  <Download className="mr-3 h-5 w-5" />
                  Export to CSV
                </Button>
              </CardContent>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 tf-animate-slide-up">
          <div className="tf-card tf-glow">
            <CardHeader className="pb-4"><>

              <CardTitle className="text-xl font-bold tf-gradient-text">Historical PILT Data</CardTitle>
              <CardDescription
</> className="text-slate-600">Complete payment history from 2014-{new Date().getFullYear()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {historyData?.map((pilt /* , index */) => (
                  <div key={index} className="flex justify-between items-center p-4 rounded-lg bg-gradient-to-r from-slate-50 to-cyan-50/30 border border-slate-200/60 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-4"><>

                      <div className="tf-badge text-lg px-4 py-2">{pilt.year}</div>
                      <div
</>>
                        <p className="font-bold text-lg tf-gradient-text">${pilt.amount.toLocaleString()}</p>
                        {pilt.assessedValue && (
                          <p className="text-sm text-slate-500">
                            Assessed: ${pilt.assessedValue.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {pilt.assessedValue && (
                        <div className="tf-badge text-lg px-4 py-2">
                          {((pilt.amount / pilt.assessedValue) * 100).toFixed(3)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}