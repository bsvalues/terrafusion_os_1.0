import React, { useState } from "react";
import { useLocation } from "wouter";
import { AppraiserPageLayout } from "@/components/layout/appraiser-page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus,
  History,
  Clock,
  Edit,
  Trash2,
  LineChart,
  Building2,
  ListTodo,
  Search,
 } from '@mui/icons-material';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample report data for demonstration
const sampleReports = [
  {
    id: 1,
    propertyId: 101,
    status: "Active",
    propertyAddress: "123 Main St, Austin, TX",
    lastEdited: "2023-04-15",
  },
  {
    id: 2,
    propertyId: 102,
    status: "Complete",
    propertyAddress: "456 Oak Ave, Dallas, TX",
    lastEdited: "2023-04-10",
  },
  {
    id: 3,
    propertyId: 103,
    status: "Active",
    propertyAddress: "789 Pine Ln, Houston, TX",
    lastEdited: "2023-04-20",
  },
];

// Sample comparable properties
const sampleComparables = [
  {
    id: 1,
    reportId: 1,
    address: "111 First St",
    city: "Austin",
    state: "TX",
    salePrice: 425000,
    grossLivingArea: 2100,
    bedrooms: 3,
    bathrooms: 2,
  },
  {
    id: 2,
    reportId: 1,
    address: "222 Second Ave",
    city: "Austin",
    state: "TX",
    salePrice: 455000,
    grossLivingArea: 2300,
    bedrooms: 4,
    bathrooms: 2.5,
  },
  {
    id: 3,
    reportId: 1,
    address: "333 Third Blvd",
    city: "Austin",
    state: "TX",
    salePrice: 412000,
    grossLivingArea: 2000,
    bedrooms: 3,
    bathrooms: 2,
  },
];

export default function CompsPage() {
  console.log("CompsPage rendering");
  const [, setLocation] = useLocation();
  const [selectedReport, setSelectedReport] = useState<number | null>(1);
  const [comparables, setComparables] = useState(sampleComparables);

  // Get the selected report details
  const selectedReportDetails = selectedReport
    ? sampleReports.find((r) => r.id === selectedReport)
    : null;

  return (
    <AppraiserPageLayout
      title="Comparable Properties"
      subtitle="Manage and analyze comparable properties for appraisal reports"
      showWorkflowContext={true}
      workflowStep={{
        previous: "Property Research",
        current: "Comps Selection",
        next: "Valuation Analysis",
      }}
      appraisalTips={[
        {
          title: "AI Comp Suggestions",
          content:
            "Terrafusion AI can recommend comparable properties based on your subject property characteristics.",
          type: "ai",
        },
        {
          title: "Adjustment Tips",
          content:
            "For best results, select properties with similar construction, age, and amenities to minimize adjustments.",
          type: "tip",
        },
      ]}
      quickActions={[
        {
          label: "Search Market Data",
          onClick: () => setLocation("/comps-search"),
          icon: <Search className="h-4 w-4" />,
          variant: "default",
        },
        {
          label: "View Map",
          onClick: () => setLocation("/comps-map"),
          icon: <Building2 className="h-4 w-4" />,
          variant: "outline",
        },
        {
          label: "Adjustment Grid",
          onClick: () => setLocation("/adjustment-grid"),
          icon: <LineChart className="h-4 w-4" />,
          variant: "outline",
        },
        {
          label: "Quality Check",
          onClick: () => setLocation("/comps-check"),
          icon: <ListTodo className="h-4 w-4" />,
          variant: "outline",
        },
      ]}
      actions={
        <Button onClick={() => setLocation("/comps-search")}>
          <Plus className="h-4 w-4 mr-2" />
          Find Comparables
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Report Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Select Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-full md:w-auto flex-1">
                <Select
                  value={selectedReport?.toString() || ""}
                  onValueChange={(value) => setSelectedReport(value ? Number(value) : null)}
                >
                  <SelectTrigger className="w-full"><>

                    <SelectValue placeholder="Select a report..." />
                  </SelectTrigger>
                  <SelectContent
</>>
                    <SelectItem value="">Select a report...</SelectItem>
                    {sampleReports.map((report) => (
                      <SelectItem key={report.id} value={report.id.toString()}>
                        {report.propertyAddress} ({report.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Comparable
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Selected Report Details */}
        {selectedReportDetails && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex flex-wrap justify-between gap-4">
                <div><>

                  <h2 className="text-xl font-medium mb-2">
                    {selectedReportDetails.propertyAddress}
                  </h2>
                  <div
</> className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          selectedReportDetails.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {selectedReportDetails.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Last edited: {selectedReportDetails.lastEdited}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Property ID: {selectedReportDetails.propertyId}
                    </div>
                  </div>
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/snapshots/${selectedReportDetails.propertyId}`)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    View Snapshot History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparables Table with Tabs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Comparables</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="table">
              <TabsList className="mb-4"><>

                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger
</> value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="map">Map View</TabsTrigger>
              </TabsList>

              <TabsContent value="table" className="pt-2">
                {selectedReport && comparables.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow><>

                          <TableHead>Address</TableHead>
                          <TableHead
</> className="text-right">Sale Price</TableHead><>

                          <TableHead className="text-right">Sq Ft</TableHead>
                          <TableHead
</> className="text-center">Beds/Baths</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparables.map((comp) => (
                          <TableRow key={comp.id}>
                            <TableCell><>

                              <div>{comp.address}</div>
                              <div
</> className="text-xs text-muted-foreground">
                                {comp.city}, {comp.state}
                              </div>
                            </TableCell><>

                            <TableCell className="text-right font-medium">
                              ${comp.salePrice.toLocaleString()}
                            </TableCell>
                            <TableCell
</> className="text-right">
                              {comp.grossLivingArea.toLocaleString()}
                            </TableCell><>

                            <TableCell className="text-center">
                              {comp.bedrooms}/{comp.bathrooms}
                            </TableCell>
                            <TableCell
</>>
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setLocation(`/snapshots/${selectedReportDetails?.propertyId}`)
                                  }
                                ><>

                                  <History className="h-3.5 w-3.5 mr-1" />
                                  History
                                </Button>
                                <Button
</> variant="outline" size="sm"><>

                                  <Edit className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </Button>
                                <Button
</>
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-12 border rounded-md bg-muted/20"><>

                    <h3 className="text-lg font-medium mb-1">No comparable properties</h3>
                    <p
</> className="text-muted-foreground mb-4">
                      {selectedReport
                        ? "No comparable properties have been added to this report yet."
                        : "Please select a report to view its comparable properties."}
                    </p>
                    <Button disabled={!selectedReport}>Add Your First Comparable</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="grid" className="pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparables.map((comp) => (
                    <Card key={comp.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex justify-between"><>

                            <Badge variant="outline">${comp.salePrice.toLocaleString()}</Badge>
                            <div
</> className="text-sm">
                              {comp.bedrooms}bd / {comp.bathrooms}ba
                            </div>
                          </div><>

                          <h3 className="font-medium">{comp.address}</h3>
                          <div
</> className="text-sm text-muted-foreground">
                            {comp.city}, {comp.state}
                          </div><>

                          <div className="text-sm">
                            {comp.grossLivingArea.toLocaleString()} sq ft
                          </div>
                          <div
</> className="flex justify-between mt-4 pt-2 border-t">
                            <Button variant="outline" size="sm"><>

                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
</>
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="map" className="pt-2">
                <div className="h-[400px] border rounded-md flex items-center justify-center bg-muted/20">
                  <div className="text-center"><>

                    <p className="text-muted-foreground mb-4">
                      Map view would display comparable properties geographically
                    </p>
                    <Button
</> variant="outline">Open Interactive Map</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppraiserPageLayout>
  );
}
