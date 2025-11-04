import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shuffle,
  Upload,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  Warning,
  Plus,
  Settings,
  History,
  Refresh,
 } from '@mui/icons-material';

export default function Conversion() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-slate-900">Data Conversion</h1>
          <p
</> className="text-slate-600">Convert and process property data between formats</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><>

            <Settings className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button
</>>
            <Plus className="h-4 w-4 mr-2" />
            New Conversion
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Conversions Today</CardTitle>
            <Shuffle
</> className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">12</div>
            <p
</> className="text-xs text-slate-500">Files processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2
</> className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">98.5%</div>
            <p
</> className="text-xs text-slate-500">Accuracy rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Clock
</> className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">1.2s</div>
            <p
</> className="text-xs text-slate-500">Average time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText
</> className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">8</div>
            <p
</> className="text-xs text-slate-500">Active templates</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Conversion Interface */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>File Conversion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" /><>

                <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
                <p
</> className="text-slate-600 mb-4">Drag and drop files here or click to browse</p>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </div>

              {/* Conversion Options */}
              <div className="space-y-4">
                <div><>

                  <label className="block text-sm font-medium mb-2">Input Format</label>
                  <select
</> className="w-full p-2 border border-slate-300 rounded-md"><>

                    <option>CSV</option>
                    <option
</>>Excel (XLSX)</option><>

                    <option>XML</option>
                    <option
</>>JSON</option>
                  </select>
                </div>

                <div><>

                  <label className="block text-sm font-medium mb-2">Output Format</label>
                  <select
</> className="w-full p-2 border border-slate-300 rounded-md"><>

                    <option>Terrafusion JSON</option>
                    <option
</>>MISMO XML</option><>

                    <option>UAD Format</option>
                    <option
</>>Custom Template</option>
                  </select>
                </div>

                <div><>

                  <label className="block text-sm font-medium mb-2">Conversion Template</label>
                  <select
</> className="w-full p-2 border border-slate-300 rounded-md"><>

                    <option>Standard Property Data</option>
                    <option
</>>MLS Import Template</option><>

                    <option>Appraisal Report Format</option>
                    <option
</>>Comparable Sales Data</option>
                  </select>
                </div>

                <Button className="w-full">
                  <Shuffle className="h-4 w-4 mr-2" />
                  Start Conversion
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Conversions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-slate-600" />
                Recent Conversions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div><>

                  <div className="font-semibold text-sm">MLS_Data_Export.csv</div>
                  <div
</> className="text-xs text-slate-500">To Terrafusion JSON</div>
                </div>
                <Badge className="bg-green-100 text-green-800">Complete</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div><>

                  <div className="font-semibold text-sm">Property_List.xlsx</div>
                  <div
</> className="text-xs text-slate-500">To MISMO XML</div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div><>

                  <div className="font-semibold text-sm">Comps_Report.json</div>
                  <div
</> className="text-xs text-slate-500">To UAD Format</div>
                </div>
                <Badge className="bg-green-100 text-green-800">Complete</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div><>

                  <div className="font-semibold text-sm">Assessment_Data.xml</div>
                  <div
</> className="text-xs text-slate-500">To CSV Format</div>
                </div>
                <Badge className="bg-red-100 text-red-800">Failed</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start"><>

                <FileText className="h-4 w-4 mr-2" />
                MLS Data Import
              </Button>
              <Button
</> variant="outline" size="sm" className="w-full justify-start"><>

                <FileText className="h-4 w-4 mr-2" />
                Comparable Sales
              </Button>
              <Button
</> variant="outline" size="sm" className="w-full justify-start"><>

                <FileText className="h-4 w-4 mr-2" />
                Property Assessment
              </Button>
              <Button
</> variant="outline" size="sm" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Appraisal Report
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Conversion Engine</span>
                <Badge
</> className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Template Engine</span>
                <Badge
</> className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between"><>

                <span className="text-sm">File Storage</span>
                <Badge
</> className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Queue Status</span>
                <Badge
</> className="bg-yellow-100 text-yellow-800">2 pending</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Conversion History */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-500 border-b pb-2"><>

              <div className="col-span-3">File Name</div>
              <div
</> className="col-span-2">Input Format</div><>

              <div className="col-span-2">Output Format</div>
              <div
</> className="col-span-2">Status</div><>

              <div className="col-span-2">Processed</div>
              <div
</> className="col-span-1">Actions</div>
            </div>

            <div className="grid grid-cols-12 gap-4 text-sm py-2 border-b"><>

              <div className="col-span-3 font-medium">PropertyData_May2025.csv</div>
              <div
</> className="col-span-2">CSV</div><>

              <div className="col-span-2">Terrafusion JSON</div>
              <div
</> className="col-span-2">
                <Badge className="bg-green-100 text-green-800">Completed</Badge>
              </div><>

              <div className="col-span-2 text-slate-500">2 hours ago</div>
              <div
</> className="col-span-1">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 text-sm py-2 border-b"><>

              <div className="col-span-3 font-medium">MLSExport_20250529.xlsx</div>
              <div
</> className="col-span-2">Excel</div><>

              <div className="col-span-2">MISMO XML</div>
              <div
</> className="col-span-2">
                <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
              </div><>

              <div className="col-span-2 text-slate-500">5 minutes ago</div>
              <div
</> className="col-span-1">
                <Button variant="outline" size="sm">
                  <Refresh className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 text-sm py-2 border-b"><>

              <div className="col-span-3 font-medium">ComparableSales.json</div>
              <div
</> className="col-span-2">JSON</div><>

              <div className="col-span-2">UAD Format</div>
              <div
</> className="col-span-2">
                <Badge className="bg-green-100 text-green-800">Completed</Badge>
              </div><>

              <div className="col-span-2 text-slate-500">1 day ago</div>
              <div
</> className="col-span-1">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
