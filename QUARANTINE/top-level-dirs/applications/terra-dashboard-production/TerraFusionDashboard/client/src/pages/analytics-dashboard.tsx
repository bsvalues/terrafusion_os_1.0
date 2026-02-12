import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  DollarSign, 
  Home, 
  MapPin,
  Calendar,
  FileText
 } from '@mui/icons-material';

interface PropertyAnalytics {
  totalProperties: number;
  totalAssessedValue: number;
  averageAssessedValue: number;
  medianAssessedValue: number;
  propertyTypeDistribution: Array<{
    type: string;
    count: number;
    totalValue: number;
    avgValue: number;
  }>;
  cityDistribution: Array<{
    city: string;
    count: number;
    totalValue: number;
    avgValue: number;
  }>;
  valueBands: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  yearBuiltAnalysis: Array<{
    decade: string;
    count: number;
    avgValue: number;
  }>;
}

export function AnalyticsDashboard() {
  const [exportingCSV, setExportingCSV] = useState(false);

  const { data: analytics, isLoading, error } = useQuery<PropertyAnalytics>({
    queryKey: ['/api/analytics/properties'],
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const response = await fetch('/api/export/properties/csv');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'benton_county_properties.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportingCSV(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64" />
<>
            <Skeleton className="h-10 w-32" />
          </div>
          <div
</> className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
<>
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div
</> className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="text-center">
<>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Analytics Unavailable</h3>
                <p
</> className="text-red-600">Unable to load property analytics data.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
<>
            <h1 className="text-3xl font-bold text-gray-900">Property Analytics</h1>
            <p
</> className="text-gray-600 mt-1">Benton County, Washington - Comprehensive Analysis</p>
          </div>
          <Button
            onClick={handleExportCSV}
            disabled={exportingCSV}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {exportingCSV ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
<>
                  <p className="text-sm font-medium text-gray-500">Total Properties</p>
                  <p
</> className="text-2xl font-bold text-gray-900">
                    {formatNumber(analytics.totalProperties)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
<>
                  <p className="text-sm font-medium text-gray-500">Total Assessed Value</p>
                  <p
</> className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.totalAssessedValue)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
<>
                  <p className="text-sm font-medium text-gray-500">Average Value</p>
                  <p
</> className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.averageAssessedValue)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
<>
                  <p className="text-sm font-medium text-gray-500">Median Value</p>
                  <p
</> className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.medianAssessedValue)}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Property Type Distribution */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Property Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analytics.propertyTypeDistribution.slice(0, 8).map((type /* , index */) => (
                  <div key={type.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}
                      />
                      <span className="text-sm font-medium text-gray-700">{type.type}</span>
                    </div>
                    <div className="text-right">
<>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatNumber(type.count)}
                      </div>
                      <div
</> className="text-xs text-gray-500">
                        {formatCurrency(type.avgValue)} avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* City Distribution */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Geographic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analytics.cityDistribution.map((city /* , index */) => (
                  <div key={city.city} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: `hsl(${index * 60}, 60%, 50%)` }}
                      />
                      <span className="text-sm font-medium text-gray-700">{city.city}</span>
                    </div>
                    <div className="text-right">
<>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatNumber(city.count)}
                      </div>
                      <div
</> className="text-xs text-gray-500">
                        {formatCurrency(city.avgValue)} avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Value Bands */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Value Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analytics.valueBands.map((band /* , index */) => (
                  <div key={band.range} className="space-y-2">
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm font-medium text-gray-700">{band.range}</span>
                      <div
</> className="text-right">
<>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatNumber(band.count)}
                        </span>
                        <span
</> className="text-xs text-gray-500 ml-2">
                          ({band.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(band.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Year Built Analysis */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Construction Era Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analytics.yearBuiltAnalysis
                  .filter(era => era.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 8)
                  .map((era /* , index */) => (
                  <div key={era.decade} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: `hsl(${index * 40}, 65%, 55%)` }}
                      />
                      <span className="text-sm font-medium text-gray-700">{era.decade}</span>
                    </div>
                    <div className="text-right">
<>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatNumber(era.count)}
                      </div>
                      <div
</> className="text-xs text-gray-500">
                        {formatCurrency(era.avgValue)} avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Quality Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
<>
                <h3 className="font-semibold text-blue-900">Data Source</h3>
                <p
</> className="text-blue-800 text-sm mt-1">
                  Analytics based on {formatNumber(analytics.totalProperties)} authentic Benton County property records 
                  from official assessor files. Data includes comprehensive property valuations, ownership details, 
                  and geographic classifications across all incorporated and unincorporated areas.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
<>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Complete Dataset
                  </Badge>
                  <Badge
</> variant="secondary" className="bg-blue-100 text-blue-800">
                    Official Records
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Real-time Sync
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}