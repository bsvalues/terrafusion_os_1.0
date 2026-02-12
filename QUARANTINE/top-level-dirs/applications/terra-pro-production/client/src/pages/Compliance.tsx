import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckSquare,
  Warning,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Search,
  Filter,
  Download,
  Plus,
  Shield,
 } from '@mui/icons-material';

export default function Compliance() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-slate-900">Compliance</h1>
          <p
</> className="text-slate-600">Ensure regulatory compliance and quality standards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><>

            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button
</>>
            <Plus className="h-4 w-4 mr-2" />
            New Check
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield
</> className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">94.2%</div>
            <p
</> className="text-xs text-slate-500">Overall compliance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Passed Checks</CardTitle>
            <CheckCircle2
</> className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">89</div>
            <p
</> className="text-xs text-slate-500">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
            <Warning
</> className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">5</div>
            <p
</> className="text-xs text-slate-500">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Avg Check Time</CardTitle>
            <Clock
</> className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">2.1m</div>
            <p
</> className="text-xs text-slate-500">Automated checks</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" /><>

              <Input
                placeholder="Search compliance checks by property or rule..."
                className="pl-10"
              />
            </div>
            <Button
</> variant="outline"><>

              <Filter className="h-4 w-4 mr-2" />
              Status
            </Button>
            <Button
</> variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Rule Type
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Checks */}
      <div className="space-y-6">
        <div className="flex items-center justify-between"><>

          <h2 className="text-xl font-semibold">Recent Compliance Checks</h2>
          <Button
</> variant="outline" size="sm">
            <CheckSquare className="h-4 w-4 mr-2" />
            Run All Checks
          </Button>
        </div>

        {/* Failed Check */}
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center"><>

                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div
</> className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><>

                    <h3 className="font-semibold text-lg">USPAP Compliance Check</h3>
                    <Badge
</> className="bg-red-100 text-red-800">Failed</Badge>
                  </div><>

                  <p className="text-slate-600">Property: 456 Pine Road, Villageton, CA</p>
                  <div
</> className="flex items-center gap-4 mt-2 text-sm text-slate-500"><>

                    <span>Rule: USPAP-SR1-2(e)</span>
                    <span
</>>•</span><>

                    <span>Report: APR-2025-003</span>
                    <span
</>>•</span>
                    <span>Checked: 2 hours ago</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3"><>

                <Button size="sm" variant="destructive">
                  Fix Issues
                </Button>
                <Button
</> variant="outline" size="sm">
                  Details
                </Button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded border border-red-200"><>

              <div className="text-sm text-red-800 font-medium mb-1">Issue Details:</div>
              <div
</> className="text-sm text-red-700">
                Missing required comparable property analysis documentation. Three comparable sales
                must include detailed adjustment explanations.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Check */}
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center"><>

                  <Warning className="h-6 w-6 text-yellow-600" />
                </div>
                <div
</> className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><>

                    <h3 className="font-semibold text-lg">Data Quality Check</h3>
                    <Badge
</> className="bg-yellow-100 text-yellow-800">Warning</Badge>
                  </div><>

                  <p className="text-slate-600">Property: 789 Oak Avenue, Townsburg, CA</p>
                  <div
</> className="flex items-center gap-4 mt-2 text-sm text-slate-500"><>

                    <span>Rule: DQ-001</span>
                    <span
</>>•</span><>

                    <span>Report: APR-2025-002</span>
                    <span
</>>•</span>
                    <span>Checked: 1 hour ago</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3"><>

                <Button size="sm" variant="outline">
                  Review
                </Button>
                <Button
</> variant="outline" size="sm">
                  Details
                </Button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded border border-yellow-200"><>

              <div className="text-sm text-yellow-800 font-medium mb-1">Warning Details:</div>
              <div
</> className="text-sm text-yellow-700">
                Comparable sale #2 is 6.2 months old, which exceeds the recommended 6-month
                threshold for this market area.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passed Check */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center"><>

                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div
</> className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><>

                    <h3 className="font-semibold text-lg">FNMA Guidelines Check</h3>
                    <Badge
</> className="bg-green-100 text-green-800">Passed</Badge>
                  </div><>

                  <p className="text-slate-600">Property: 123 Maple Street, Cityville, CA</p>
                  <div
</> className="flex items-center gap-4 mt-2 text-sm text-slate-500"><>

                    <span>Rule: FNMA-1004</span>
                    <span
</>>•</span><>

                    <span>Report: APR-2025-001</span>
                    <span
</>>•</span>
                    <span>Checked: 30 minutes ago</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right"><>

                  <div className="font-semibold text-green-600">100%</div>
                  <div
</> className="text-sm text-slate-500">Compliance</div>
                </div>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
              <div className="text-sm text-green-800">
                All FNMA guidelines satisfied. Report meets all formatting, content, and
                documentation requirements.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing Check */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center"><>

                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div
</> className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><>

                    <h3 className="font-semibold text-lg">FHA Compliance Check</h3>
                    <Badge
</> className="bg-blue-100 text-blue-800">Processing</Badge>
                  </div><>

                  <p className="text-slate-600">Property: 321 Cedar Drive, Riverside, CA</p>
                  <div
</> className="flex items-center gap-4 mt-2 text-sm text-slate-500"><>

                    <span>Rule: FHA-4000.1</span>
                    <span
</>>•</span><>

                    <span>Report: APR-2025-004</span>
                    <span
</>>•</span>
                    <span>Started: 5 minutes ago</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right"><>

                  <div className="font-semibold text-blue-600">75%</div>
                  <div
</> className="text-sm text-slate-500">Complete</div>
                </div>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="text-sm text-blue-800">
                Running automated checks against FHA property requirements and appraisal
                standards...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Active Compliance Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3"><>

              <h3 className="font-semibold text-slate-900">USPAP Standards</h3>
              <div
</> className="space-y-2 text-sm">
                <div className="flex justify-between"><>

                  <span>SR1-1 Requirements</span>
                  <Badge
</> className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex justify-between"><>

                  <span>SR1-2 Comparable Sales</span>
                  <Badge
</> className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex justify-between"><>

                  <span>SR2-1 Report Content</span>
                  <Badge
</> className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3"><>

              <h3 className="font-semibold text-slate-900">Agency Guidelines</h3>
              <div
</> className="space-y-2 text-sm">
                <div className="flex justify-between"><>

                  <span>FNMA Form 1004</span>
                  <Badge
</> className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex justify-between"><>

                  <span>FHA Requirements</span>
                  <Badge
</> className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex justify-between"><>

                  <span>VA Standards</span>
                  <Badge
</> className="bg-yellow-100 text-yellow-800">Optional</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3"><>

              <h3 className="font-semibold text-slate-900">Quality Standards</h3>
              <div
</> className="space-y-2 text-sm">
                <div className="flex justify-between"><>

                  <span>Data Completeness</span>
                  <Badge
</> className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex justify-between"><>

                  <span>Photo Requirements</span>
                  <Badge
</> className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex justify-between"><>

                  <span>Market Analysis</span>
                  <Badge
</> className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
