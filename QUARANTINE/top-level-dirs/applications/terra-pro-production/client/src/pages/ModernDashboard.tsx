import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Warning,
  Plus,
  ArrowRight,
  BarChart3,
  Camera,
  Search,
  Brain,
 } from '@mui/icons-material';

export default function ModernDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p
</> className="text-slate-600">Welcome back to your property appraisal workspace</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
            <FileText
</> className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">12</div>
            <p
</> className="text-xs text-slate-500">+2 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle2
</> className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">47</div>
            <p
</> className="text-xs text-slate-500">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
            <Brain
</> className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">96.8%</div>
            <p
</> className="text-xs text-slate-500">Valuation precision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Avg. Turnaround</CardTitle>
            <Clock
</> className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">2.3 days</div>
            <p
</> className="text-xs text-slate-500">Industry leading</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Reports */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Active Appraisals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div><>

                    <h3 className="font-semibold">123 Maple Street</h3>
                    <p
</> className="text-sm text-slate-600">Cityville, CA 90210</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>Progress</span>
                    <span
</>>65%</span>
                  </div><>

                  <Progress value={65} className="h-2" />
                </div>
                <div
</> className="flex justify-between text-xs text-slate-500 mt-2"><>

                  <span>Due: May 15, 2025</span>
                  <span
</>>Client: First National Bank</span>
                </div>
              </div>

              <div className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div><>

                    <h3 className="font-semibold">456 Oak Avenue</h3>
                    <p
</> className="text-sm text-slate-600">Townsburg, CA 90211</p>
                  </div>
                  <Badge className="bg-red-100 text-red-800">Review Required</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>Progress</span>
                    <span
</>>92%</span>
                  </div><>

                  <Progress value={92} className="h-2" />
                </div>
                <div
</> className="flex justify-between text-xs text-slate-500 mt-2"><>

                  <span>Due: May 2, 2025</span>
                  <span
</>>Client: Homeward Mortgage</span>
                </div>
              </div>

              <div className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div><>

                    <h3 className="font-semibold">789 Pine Road</h3>
                    <p
</> className="text-sm text-slate-600">Villageton, CA 90212</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Started</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>Progress</span>
                    <span
</>>25%</span>
                  </div><>

                  <Progress value={25} className="h-2" />
                </div>
                <div
</> className="flex justify-between text-xs text-slate-500 mt-2"><>

                  <span>Due: May 20, 2025</span>
                  <span
</>>Client: Unity Credit Union</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline"><>

                <Search className="mr-2 h-4 w-4" />
                Search Comparables
              </Button>
              <Button
</> className="w-full justify-start" variant="outline"><>

                <Camera className="mr-2 h-4 w-4" />
                Upload Photos
              </Button>
              <Button
</> className="w-full justify-start" variant="outline"><>

                <BarChart3 className="mr-2 h-4 w-4" />
                Market Analysis
              </Button>
              <Button
</> className="w-full justify-start" variant="outline">
                <Brain className="mr-2 h-4 w-4" />
                AI Assistant
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warning className="h-5 w-5 text-orange-500" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><>

                <p className="text-sm font-medium text-red-800">Compliance Review</p>
                <p
</> className="text-xs text-red-600">
                  Oak Avenue property needs review before submission
                </p>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"><>

                <p className="text-sm font-medium text-yellow-800">AI Insight</p>
                <p
</> className="text-xs text-yellow-600">
                  3.2% variance detected in comparable selection
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg"><>

                <p className="text-sm font-medium text-blue-800">Photo Sync</p>
                <p
</> className="text-xs text-blue-600">15 new photos synced from mobile app</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
