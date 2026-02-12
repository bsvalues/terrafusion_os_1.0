import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  DollarSign,
  Building2,
  Clock,
  Target,
  Filter,
  Refresh,
 } from '@mui/icons-material';

export default function Analytics() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p
</> className="text-slate-600">Performance insights and market trends</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><>

            <Filter className="h-4 w-4 mr-2" />
            Time Period
          </Button>
          <Button
</> variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign
</> className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">$23,400</div>
            <div
</> className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600" /><>

              <span className="text-green-600">+12.5%</span>
              <span
</> className="text-slate-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Avg Turnaround</CardTitle>
            <Clock
</> className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">2.3 days</div>
            <div
</> className="flex items-center gap-1 text-xs">
              <TrendingDown className="h-3 w-3 text-green-600" /><>

              <span className="text-green-600">-0.4 days</span>
              <span
</> className="text-slate-500">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <Target
</> className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">96.8%</div>
            <div
</> className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600" /><>

              <span className="text-green-600">+2.1%</span>
              <span
</> className="text-slate-500">vs target</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Properties Valued</CardTitle>
            <Building2
</> className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">47</div>
            <div
</> className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600" /><>

              <span className="text-green-600">+8</span>
              <span
</> className="text-slate-500">this month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-2" /><>

                <p className="text-slate-600">Revenue chart visualization</p>
                <p
</> className="text-sm text-slate-500">Monthly performance data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Market Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-2" /><>

                <p className="text-slate-600">Market trend analysis</p>
                <p
</> className="text-sm text-slate-500">Regional market data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performing Areas */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Areas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><>

                <div className="font-semibold">Cityville, CA</div>
                <div
</> className="text-sm text-slate-500">47 properties</div>
              </div>
              <Badge className="bg-green-100 text-green-800">+15.2%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div><>

                <div className="font-semibold">Townsburg, CA</div>
                <div
</> className="text-sm text-slate-500">32 properties</div>
              </div>
              <Badge className="bg-green-100 text-green-800">+12.8%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div><>

                <div className="font-semibold">Riverside, CA</div>
                <div
</> className="text-sm text-slate-500">28 properties</div>
              </div>
              <Badge className="bg-green-100 text-green-800">+9.4%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div><>

                <div className="font-semibold">Villageton, CA</div>
                <div
</> className="text-sm text-slate-500">19 properties</div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">+3.1%</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Property Types */}
        <Card>
          <CardHeader>
            <CardTitle>Property Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><>

                <div className="font-semibold">Single Family</div>
                <div
</> className="text-sm text-slate-500">78% of portfolio</div>
              </div>
              <div className="text-right"><>

                <div className="font-semibold">$18,200</div>
                <div
</> className="text-sm text-slate-500">avg revenue</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div><>

                <div className="font-semibold">Townhouse</div>
                <div
</> className="text-sm text-slate-500">12% of portfolio</div>
              </div>
              <div className="text-right"><>

                <div className="font-semibold">$2,800</div>
                <div
</> className="text-sm text-slate-500">avg revenue</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div><>

                <div className="font-semibold">Condominium</div>
                <div
</> className="text-sm text-slate-500">8% of portfolio</div>
              </div>
              <div className="text-right"><>

                <div className="font-semibold">$1,900</div>
                <div
</> className="text-sm text-slate-500">avg revenue</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div><>

                <div className="font-semibold">Multi-Family</div>
                <div
</> className="text-sm text-slate-500">2% of portfolio</div>
              </div>
              <div className="text-right"><>

                <div className="font-semibold">$500</div>
                <div
</> className="text-sm text-slate-500">avg revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3"><>

              <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
              <div
</> className="flex-1"><>

                <div className="font-semibold text-sm">Report Completed</div>
                <div
</> className="text-xs text-slate-500">123 Maple Street - $485,000</div>
                <div className="text-xs text-slate-400">2 hours ago</div>
              </div>
            </div>
            <div className="flex items-start gap-3"><>

              <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
              <div
</> className="flex-1"><>

                <div className="font-semibold text-sm">New Order Received</div>
                <div
</> className="text-xs text-slate-500">789 Oak Avenue - Metro Bank</div>
                <div className="text-xs text-slate-400">4 hours ago</div>
              </div>
            </div>
            <div className="flex items-start gap-3"><>

              <div className="h-2 w-2 bg-purple-500 rounded-full mt-2"></div>
              <div
</> className="flex-1"><>

                <div className="font-semibold text-sm">AI Analysis Complete</div>
                <div
</> className="text-xs text-slate-500">456 Pine Road - 96.8% accuracy</div>
                <div className="text-xs text-slate-400">6 hours ago</div>
              </div>
            </div>
            <div className="flex items-start gap-3"><>

              <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
              <div
</> className="flex-1"><>

                <div className="font-semibold text-sm">Photo Upload</div>
                <div
</> className="text-xs text-slate-500">321 Cedar Drive - 15 photos</div>
                <div className="text-xs text-slate-400">8 hours ago</div>
              </div>
            </div>
            <div className="flex items-start gap-3"><>

              <div className="h-2 w-2 bg-red-500 rounded-full mt-2"></div>
              <div
</> className="flex-1"><>

                <div className="font-semibold text-sm">Compliance Review</div>
                <div
</> className="text-xs text-slate-500">987 Elm Street - Action required</div>
                <div className="text-xs text-slate-400">10 hours ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
