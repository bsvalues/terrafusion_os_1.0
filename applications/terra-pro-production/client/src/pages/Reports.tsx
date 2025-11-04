import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText,
  Search,
  Download,
  Eye,
  Calendar,
  Building2,
  Filter,
  Plus,
  MoreHorizontal,
 } from '@mui/icons-material';

export default function Reports() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p
</> className="text-slate-600">Manage and view all appraisal reports</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" /><>

              <Input placeholder="Search reports by address, client, or ID..." className="pl-10" />
            </div>
            <Button
</> variant="outline"><>

              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
</> variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid gap-6">
        {/* Report Card 1 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center"><>

                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div
</> className="flex-1"><>

                  <h3 className="font-semibold text-lg">123 Maple Street</h3>
                  <p
</> className="text-slate-600">Cityville, CA 90210</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500"><>

                    <span>Report #APR-2025-001</span>
                    <span
</>>•</span><>

                    <span>Due: May 15, 2025</span>
                    <span
</>>•</span>
                    <span>Client: First National Bank</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3"><>

                <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                <Button
</> variant="outline" size="sm"><>

                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between"><>

              <div className="text-sm text-slate-600">Last updated: 2 hours ago by John Doe</div>
              <div
</> className="text-sm font-medium text-slate-900">Progress: 65%</div>
            </div>
          </CardContent>
        </Card>

        {/* Report Card 2 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center"><>

                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div
</> className="flex-1"><>

                  <h3 className="font-semibold text-lg">789 Oak Avenue</h3>
                  <p
</> className="text-slate-600">Townsburg, CA 90211</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500"><>

                    <span>Report #APR-2025-002</span>
                    <span
</>>•</span><>

                    <span>Completed: May 1, 2025</span>
                    <span
</>>•</span>
                    <span>Client: Homeward Mortgage</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3"><>

                <Badge className="bg-green-100 text-green-800">Completed</Badge>
                <Button
</> variant="outline" size="sm"><>

                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between"><>

              <div className="text-sm text-slate-600">Delivered: May 1, 2025</div>
              <div
</> className="text-sm font-medium text-green-600">$485,000 valuation</div>
            </div>
          </CardContent>
        </Card>

        {/* Report Card 3 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center"><>

                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <div
</> className="flex-1"><>

                  <h3 className="font-semibold text-lg">456 Pine Road</h3>
                  <p
</> className="text-slate-600">Villageton, CA 90212</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500"><>

                    <span>Report #APR-2025-003</span>
                    <span
</>>•</span><>

                    <span>Due: April 28, 2025</span>
                    <span
</>>•</span>
                    <span>Client: Unity Credit Union</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3"><>

                <Badge className="bg-red-100 text-red-800">Review Required</Badge>
                <Button
</> variant="outline" size="sm"><>

                  <Eye className="h-4 w-4 mr-2" />
                  Review
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between"><>

              <div className="text-sm text-slate-600">
                Needs attention: Compliance review required
              </div>
              <div
</> className="text-sm font-medium text-slate-900">Progress: 92%</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
