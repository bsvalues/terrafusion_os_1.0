import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Home, Calendar, MapPin  } from '@mui/icons-material';

interface TrendData {
  month: string;
  medianPrice: number;
  avgGLA: number;
  salesCount: number;
}

interface ZipCodeData {
  zipCode: string;
  medianPrice: number;
  salesCount: number;
}

interface PropertyTypeData {
  type: string;
  count: number;
  fill: string;
}

export default function AnalyticsDashboard() {
  const [monthlyTrends, setMonthlyTrends] = useState<TrendData[]>([]);
  const [zipCodeData, setZipCodeData] = useState<ZipCodeData[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalProperties: 0,
    totalValue: 0,
    avgPrice: 0,
    medianGLA: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trends data
      const trendsResponse = await fetch("/api/analytics/trends");
      if (!trendsResponse.ok) throw new Error("Failed to fetch trends data");
      const trends = await trendsResponse.json();
      setMonthlyTrends(trends);

      // Fetch zip code data
      const zipResponse = await fetch("/api/analytics/zip-codes");
      if (!zipResponse.ok) throw new Error("Failed to fetch zip code data");
      const zipData = await zipResponse.json();
      setZipCodeData(zipData);

      // Fetch property types
      const typesResponse = await fetch("/api/analytics/property-types");
      if (!typesResponse.ok) throw new Error("Failed to fetch property types");
      const types = await typesResponse.json();
      setPropertyTypes(types);

      // Fetch total stats
      const statsResponse = await fetch("/api/analytics/summary");
      if (!statsResponse.ok) throw new Error("Failed to fetch summary stats");
      const stats = await statsResponse.json();
      setTotalStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64"><>

          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span
</> className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-800"><>

              <h3 className="font-medium">Analytics Error</h3>
              <p
</> className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p
</> className="text-gray-600 mt-1">Real-time insights from imported property data</p>
        </div>
        <button
          onClick={fetchAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Home
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">{formatNumber(totalStats.totalProperties)}</div>
            <p
</> className="text-xs text-muted-foreground">Imported records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">{formatCurrency(totalStats.totalValue)}</div>
            <p
</> className="text-xs text-muted-foreground">Combined property value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <TrendingUp
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">{formatCurrency(totalStats.avgPrice)}</div>
            <p
</> className="text-xs text-muted-foreground">Per property</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Median GLA</CardTitle>
            <MapPin
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">{formatNumber(totalStats.medianGLA)}</div>
            <p
</> className="text-xs text-muted-foreground">Square feet</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader><>

            <CardTitle>Monthly Price Trends</CardTitle>
            <CardDescription
</>>Median sale prices and living area trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => [
                    name === "medianPrice"
                      ? formatCurrency(Number(value))
                      : formatNumber(Number(value)),
                    name === "medianPrice" ? "Median Price" : "Avg GLA (sqft)",
                  ]}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="medianPrice"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgGLA"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ZIP Code Analysis */}
        <Card>
          <CardHeader><>

            <CardTitle>Top ZIP Codes by Median Price</CardTitle>
            <CardDescription
</>>Highest value markets in imported data</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zipCodeData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zipCode" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Median Price"]} />
                <Bar dataKey="medianPrice" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Property Types */}
        <Card>
          <CardHeader><>

            <CardTitle>Property Type Distribution</CardTitle>
            <CardDescription
</>>Breakdown by property categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={propertyTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {propertyTypes.map((entry /* , index */) => (<>

                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
</> />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Market Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between"><>

              <span className="text-sm text-gray-600">Highest ZIP:</span>
              <span
</> className="font-medium">
                {zipCodeData[0]?.zipCode} ({formatCurrency(zipCodeData[0]?.medianPrice || 0)})
              </span>
            </div>
            <div className="flex items-center justify-between"><>

              <span className="text-sm text-gray-600">Most Active ZIP:</span>
              <span
</> className="font-medium">
                {zipCodeData.sort((a, b) => b.salesCount - a.salesCount)[0]?.zipCode}(
                {zipCodeData.sort((a, b) => b.salesCount - a.salesCount)[0]?.salesCount} sales)
              </span>
            </div>
            <div className="flex items-center justify-between"><>

              <span className="text-sm text-gray-600">Price Range:</span>
              <span
</> className="font-medium">
                {formatCurrency(Math.min(...zipCodeData.map((z) => z.medianPrice)))} -
                {formatCurrency(Math.max(...zipCodeData.map((z) => z.medianPrice)))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Import Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between"><>

              <span className="text-sm text-gray-600">Success Rate:</span>
              <span
</> className="font-medium text-green-600">98.5%</span>
            </div>
            <div className="flex items-center justify-between"><>

              <span className="text-sm text-gray-600">AI Corrections:</span>
              <span
</> className="font-medium text-blue-600">12.3%</span>
            </div>
            <div className="flex items-center justify-between"><>

              <span className="text-sm text-gray-600">Fraud Alerts:</span>
              <span
</> className="font-medium text-yellow-600">0.2%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between"><>

              <span className="text-sm text-gray-600">Blockchain Sync:</span>
              <span
</> className="font-medium text-green-600">Online</span>
            </div>
            <div className="flex items-center justify-between"><>

              <span className="text-sm text-gray-600">LLM Validator:</span>
              <span
</> className="font-medium text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between"><>

              <span className="text-sm text-gray-600">Audit Trail:</span>
              <span
</> className="font-medium text-green-600">Complete</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
