import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Home,
  Building2,
  BarChart3,
  FileText,
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  Warning,
  Plus,
  Search,
  Upload,
 } from '@mui/icons-material';

export default function ForcedNewDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center py-8"><>

          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🎉 NEW TERRAFUSION UI IS LIVE! 🎉
          </h1>
          <p
</> className="text-xl text-gray-600 max-w-2xl mx-auto">
            Modern property appraisal platform with AI-powered insights and streamlined workflows
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700"><>

              <Plus className="mr-2 h-5 w-5" />
              Start New Appraisal
            </Button>
            <Button
</> size="lg" variant="outline">
              <Upload className="mr-2 h-5 w-5" />
              Import Order
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
              <FileText
</> className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold">12</div>
              <p
</> className="text-xs text-muted-foreground">+2 from last week</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
              <CheckCircle2
</> className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold">47</div>
              <p
</> className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
              <BarChart3
</> className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold">96.8%</div>
              <p
</> className="text-xs text-muted-foreground">Valuation precision</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium">Avg. Turnaround</CardTitle>
              <Clock
</> className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold">2.3 days</div>
              <p
</> className="text-xs text-muted-foreground">Industry leading</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Appraisals */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Active Appraisals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div><>

                      <h3 className="font-semibold">123 Maple Street</h3>
                      <p
</> className="text-sm text-gray-600">Cityville, CA 90210</p>
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
</> className="flex justify-between text-xs text-gray-500 mt-2"><>

                    <span>Due: May 15, 2025</span>
                    <span
</>>Client: First National Bank</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div><>

                      <h3 className="font-semibold">456 Oak Avenue</h3>
                      <p
</> className="text-sm text-gray-600">Townsburg, CA 90211</p>
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
</> className="flex justify-between text-xs text-gray-500 mt-2"><>

                    <span>Due: May 2, 2025</span>
                    <span
</>>Client: Homeward Mortgage</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div><>

                      <h3 className="font-semibold">789 Pine Road</h3>
                      <p
</> className="text-sm text-gray-600">Villageton, CA 90212</p>
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
</> className="flex justify-between text-xs text-gray-500 mt-2"><>

                    <span>Due: May 20, 2025</span>
                    <span
</>>Client: Unity Credit Union</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Notifications */}
          <div className="space-y-6">
            <Card className="bg-white shadow-lg border-0">
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

                  <MapPin className="mr-2 h-4 w-4" />
                  Map Analysis
                </Button>
                <Button
</> className="w-full justify-start" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Market Trends
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
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
</> className="text-xs text-blue-600">
                    15 new photos synced from TerraField mobile
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
