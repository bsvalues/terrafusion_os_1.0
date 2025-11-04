import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PencilRuler,
  Plus,
  Search,
  Grid3X3,
  List,
  Download,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Square,
  Home,
  Calendar,
 } from '@mui/icons-material';

export default function Sketches() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-slate-900">Sketches</h1>
          <p
</> className="text-slate-600">Create and manage property floor plans and sketches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><>

            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button
</>>
            <Plus className="h-4 w-4 mr-2" />
            New Sketch
          </Button>
        </div>
      </div>

      {/* Search and View Options */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" /><>

              <Input
                placeholder="Search sketches by property address or name..."
                className="pl-10"
              />
            </div>
            <div
</> className="flex gap-2">
              <Button variant="outline" size="sm"><>

                <Calendar className="h-4 w-4 mr-2" />
                Date
              </Button>
              <div
</> className="border-l pl-2 ml-2">
                <Button variant="outline" size="sm"><>

                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
</> variant="outline" size="sm">
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sketch Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3"><>

              <Home className="h-6 w-6 text-blue-600" />
            </div>
            <h3
</> className="font-semibold">Floor Plans</h3>
            <p className="text-sm text-slate-500">34 sketches</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3"><>

              <Square className="h-6 w-6 text-green-600" />
            </div>
            <h3
</> className="font-semibold">Site Plans</h3>
            <p className="text-sm text-slate-500">18 sketches</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3"><>

              <PencilRuler className="h-6 w-6 text-purple-600" />
            </div>
            <h3
</> className="font-semibold">Room Details</h3>
            <p className="text-sm text-slate-500">42 sketches</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3"><>

              <PencilRuler className="h-6 w-6 text-orange-600" />
            </div>
            <h3
</> className="font-semibold">Templates</h3>
            <p className="text-sm text-slate-500">12 templates</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sketches Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between"><>

          <h2 className="text-xl font-semibold">Recent Sketches</h2>
          <Button
</> variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sketch Card 1 */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <div className="text-center">
                <PencilRuler className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <div className="text-sm text-blue-700">Floor Plan Preview</div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><>

                  <h3 className="font-semibold">Main Floor Plan</h3>
                  <p
</> className="text-sm text-slate-600">123 Maple Street</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Floor Plan</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3"><>

                <span>1,850 sq ft</span>
                <span
</>>Updated today</span><>

                <span>3 bed, 2 bath</span>
                <span
</>>Scale: 1/4"=1'</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="flex-1"><>

                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
</> variant="outline" size="sm"><>

                  <Copy className="h-4 w-4" />
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sketch Card 2 */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              <div className="text-center">
                <Square className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <div className="text-sm text-green-700">Site Plan Preview</div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><>

                  <h3 className="font-semibold">Property Layout</h3>
                  <p
</> className="text-sm text-slate-600">789 Oak Avenue</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Site Plan</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3"><>

                <span>0.25 acre lot</span>
                <span
</>>Yesterday 3:45 PM</span><>

                <span>Setbacks noted</span>
                <span
</>>Scale: 1"=20'</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="flex-1"><>

                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
</> variant="outline" size="sm"><>

                  <Copy className="h-4 w-4" />
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sketch Card 3 */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
              <div className="text-center">
                <PencilRuler className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                <div className="text-sm text-purple-700">Room Detail Preview</div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><>

                  <h3 className="font-semibold">Kitchen Layout</h3>
                  <p
</> className="text-sm text-slate-600">456 Pine Road</p>
                </div>
                <Badge className="bg-purple-100 text-purple-800">Room Detail</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3"><>

                <span>240 sq ft</span>
                <span
</>>May 26, 2:30 PM</span><>

                <span>Galley style</span>
                <span
</>>Scale: 1/2"=1'</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="flex-1"><>

                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
</> variant="outline" size="sm"><>

                  <Copy className="h-4 w-4" />
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sketch Card 4 */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <div className="text-center">
                <Home className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                <div className="text-sm text-orange-700">Floor Plan Preview</div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><>

                  <h3 className="font-semibold">Second Floor</h3>
                  <p
</> className="text-sm text-slate-600">321 Cedar Drive</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Floor Plan</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3"><>

                <span>1,600 sq ft</span>
                <span
</>>May 24, 1:15 PM</span><>

                <span>4 bed, 2 bath</span>
                <span
</>>Scale: 1/4"=1'</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="flex-1"><>

                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
</> variant="outline" size="sm"><>

                  <Copy className="h-4 w-4" />
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sketch Card 5 */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
              <div className="text-center">
                <Square className="h-12 w-12 text-teal-600 mx-auto mb-2" />
                <div className="text-sm text-teal-700">Site Plan Preview</div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><>

                  <h3 className="font-semibold">Lot Survey</h3>
                  <p
</> className="text-sm text-slate-600">567 Birch Avenue</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Site Plan</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3"><>

                <span>0.18 acre lot</span>
                <span
</>>May 23, 4:20 PM</span><>

                <span>Corner lot</span>
                <span
</>>Scale: 1"=30'</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="flex-1"><>

                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
</> variant="outline" size="sm"><>

                  <Copy className="h-4 w-4" />
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sketch Card 6 - Template */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow border-dashed border-2 border-slate-300">
            <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <div className="text-center">
                <Plus className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                <div className="text-sm text-slate-600">Create New Sketch</div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="text-center"><>

                <h3 className="font-semibold mb-2">Start Fresh</h3>
                <p
</> className="text-sm text-slate-600 mb-3">
                  Begin with a blank canvas or use a template
                </p>
                <Button size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  New Sketch
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
