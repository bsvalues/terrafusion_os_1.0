import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText,
  BarChart3,
  MapPin,
  Brain,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Bell,
  Settings,
  Users,
  TrendingUp,
  Home,
  Building,
  Map,
  Camera,
 } from '@mui/icons-material';

const TerraFusionDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div><>

              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Terrafusion Pro
              </h1>
              <p
</> className="text-gray-600 text-lg">AI-Powered Appraisal Platform</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                <Badge className="ml-2 bg-red-500">3</Badge>
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><>

                  <p className="text-sm font-medium text-gray-600">Active Orders</p>
                  <p
</> className="text-3xl font-bold text-blue-600">23</p>
                  <p className="text-xs text-green-600 mt-1">↑ 12% from last week</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><>

                  <p className="text-sm font-medium text-gray-600">Completed This Week</p>
                  <p
</> className="text-3xl font-bold text-green-600">47</p>
                  <p className="text-xs text-green-600 mt-1">↑ 8% increase</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><>

                  <p className="text-sm font-medium text-gray-600">AI Valuations</p>
                  <p
</> className="text-3xl font-bold text-purple-600">134</p>
                  <p className="text-xs text-green-600 mt-1">94.2% accuracy</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><>

                  <p className="text-sm font-medium text-gray-600">Avg Completion</p>
                  <p
</> className="text-3xl font-bold text-orange-600">2.3 days</p>
                  <p className="text-xs text-green-600 mt-1">↓ 15% faster</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-6 w-6 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/urar">
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center"><>

                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div
</>><>

                        <h4 className="font-semibold text-gray-900">New URAR Form</h4>
                        <p
</> className="text-sm text-gray-600">AI-enhanced appraisal</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/comps-search">
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center"><>

                        <Search className="h-6 w-6 text-white" />
                      </div>
                      <div
</>><>

                        <h4 className="font-semibold text-gray-900">Find Comparables</h4>
                        <p
</> className="text-sm text-gray-600">AI-powered search</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/property-analysis">
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center"><>

                        <Brain className="h-6 w-6 text-white" />
                      </div>
                      <div
</>><>

                        <h4 className="font-semibold text-gray-900">Property Analysis</h4>
                        <p
</> className="text-sm text-gray-600">Advanced AI insights</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/photos">
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center"><>

                        <Camera className="h-6 w-6 text-white" />
                      </div>
                      <div
</>><>

                        <h4 className="font-semibold text-gray-900">Field Data</h4>
                        <p
</> className="text-sm text-gray-600">Mobile capture tools</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/legacy-importer">
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-indigo-500 rounded-lg flex items-center justify-center"><>

                        <Download className="h-6 w-6 text-white" />
                      </div>
                      <div
</>><>

                        <h4 className="font-semibold text-gray-900">Legacy Import</h4>
                        <p
</> className="text-sm text-gray-600">Import legacy data</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-xl"><>

                <Clock className="h-6 w-6 text-blue-600" />
                Recent Orders
              </CardTitle>
              <div
</> className="flex gap-2">
                <Button variant="outline" size="sm"><>

                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Link
</> href="/orders">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    View All
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><>

                      <h4 className="font-semibold text-gray-900">#APR-2025-001</h4>
                      <Badge
</> className="bg-red-100 text-red-800 border-red-200">
                        High Priority
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2"><>

                      <MapPin className="h-4 w-4" />
                      123 Oak Street, Seattle, WA 98101
                    </div>
                    <div
</> className="flex items-center gap-4 text-sm text-gray-600"><>

                      <span>Client: First National Bank</span>
                      <span
</>>Due: May 30, 2025</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-sm font-medium text-blue-600">IN PROGRESS</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1"><>

                      <span>Progress</span>
                      <span
</>>75%</span>
                    </div><>

                    <Progress value={75} className="h-2" />
                  </div>
                  <Button
</> size="sm" variant="outline">
                    Continue
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><>

                      <h4 className="font-semibold text-gray-900">#APR-2025-002</h4>
                      <Badge
</> className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Medium Priority
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2"><>

                      <MapPin className="h-4 w-4" />
                      456 Pine Avenue, Bellevue, WA 98004
                    </div>
                    <div
</> className="flex items-center gap-4 text-sm text-gray-600"><>

                      <span>Client: Pacific Mortgage Co</span>
                      <span
</>>Due: June 2, 2025</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-sm font-medium text-yellow-600">REVIEW</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1"><>

                      <span>Progress</span>
                      <span
</>>90%</span>
                    </div><>

                    <Progress value={90} className="h-2" />
                  </div>
                  <Button
</> size="sm" variant="outline">
                    Review
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><>

                      <h4 className="font-semibold text-gray-900">#APR-2025-003</h4>
                      <Badge
</> className="bg-green-100 text-green-800 border-green-200">
                        Normal Priority
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2"><>

                      <MapPin className="h-4 w-4" />
                      789 Elm Drive, Tacoma, WA 98402
                    </div>
                    <div
</> className="flex items-center gap-4 text-sm text-gray-600"><>

                      <span>Client: Community Bank</span>
                      <span
</>>Due: June 5, 2025</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-sm font-medium text-gray-600">DRAFT</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1"><>

                      <span>Progress</span>
                      <span
</>>45%</span>
                    </div><>

                    <Progress value={45} className="h-2" />
                  </div>
                  <Button
</> size="sm" variant="outline">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><>

                  <span className="text-sm text-gray-600">Suggestion Accuracy</span>
                  <span
</> className="font-semibold text-purple-600">94.2%</span>
                </div>
                <div className="flex justify-between items-center"><>

                  <span className="text-sm text-gray-600">Time Saved per Appraisal</span>
                  <span
</> className="font-semibold text-purple-600">2.3 hours</span>
                </div>
                <div className="flex justify-between items-center"><>

                  <span className="text-sm text-gray-600">Forms Auto-completed</span>
                  <span
</> className="font-semibold text-purple-600">78%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Quick Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><>

                  <span className="text-sm text-gray-600">Revenue This Month</span>
                  <span
</> className="font-semibold text-blue-600">$47,250</span>
                </div>
                <div className="flex justify-between items-center"><>

                  <span className="text-sm text-gray-600">Client Satisfaction</span>
                  <span
</> className="font-semibold text-blue-600">4.8/5.0</span>
                </div>
                <div className="flex justify-between items-center"><>

                  <span className="text-sm text-gray-600">Compliance Score</span>
                  <span
</> className="font-semibold text-blue-600">99.2%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TerraFusionDashboard;
