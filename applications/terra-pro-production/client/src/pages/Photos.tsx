import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Camera,
  Upload,
  Search,
  Filter,
  Grid3X3,
  List,
  Download,
  Edit,
  Trash2,
  Eye,
  Plus,
  MapPin,
  Calendar,
  MoreHorizontal,
 } from '@mui/icons-material';

export default function Photos() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-slate-900">Photos</h1>
          <p
</> className="text-slate-600">Manage property photos and documentation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><>

            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          <Button
</>>
            <Upload className="h-4 w-4 mr-2" />
            Upload Photos
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" /><>

              <Input placeholder="Search photos by property address or tags..." className="pl-10" />
            </div>
            <div
</> className="flex gap-2">
              <Button variant="outline" size="sm"><>

                <Filter className="h-4 w-4 mr-2" />
                Category
              </Button>
              <Button
</> variant="outline" size="sm"><>

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

      {/* Photo Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3"><>

              <Camera className="h-6 w-6 text-blue-600" />
            </div>
            <h3
</> className="font-semibold">Exterior</h3>
            <p className="text-sm text-slate-500">124 photos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3"><>

              <Camera className="h-6 w-6 text-green-600" />
            </div>
            <h3
</> className="font-semibold">Interior</h3>
            <p className="text-sm text-slate-500">89 photos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3"><>

              <Camera className="h-6 w-6 text-purple-600" />
            </div>
            <h3
</> className="font-semibold">Defects</h3>
            <p className="text-sm text-slate-500">23 photos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3"><>

              <Camera className="h-6 w-6 text-orange-600" />
            </div>
            <h3
</> className="font-semibold">Comparables</h3>
            <p className="text-sm text-slate-500">67 photos</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Photos Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between"><>

          <h2 className="text-xl font-semibold">Recent Photos</h2>
          <Button
</> variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Album
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Photo Card 1 */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center"><>

              <Camera className="h-12 w-12 text-blue-600" />
            </div>
            <CardContent
</> className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><>

                  <h3 className="font-semibold">Front Exterior</h3>
                  <p
</> className="text-sm text-slate-600">123 Maple Street</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Exterior</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <MapPin className="h-3 w-3" /><>

                <span>Cityville, CA</span>
                <span
</>>•</span>
                <span>Today 2:30 PM</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="flex-1"><>

                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
</> variant="outline" size="sm"><>

                  <Edit className="h-4 w-4" />
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Photo Card 2 */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center"><>

              <Camera className="h-12 w-12 text-green-600" />
            </div>
            <CardContent
</> className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><>

                  <h3 className="font-semibold">Living Room</h3>
                  <p
</> className="text-sm text-slate-600">123 Maple Street</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Interior</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <MapPin className="h-3 w-3" /><>

                <span>Cityville, CA</span>
                <span
</>>•</span>
                <span>Today 1:45 PM</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="flex-1"><>

                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
</> variant="outline" size="sm"><>

                  <Edit className="h-4 w-4" />
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Photo Card 3 */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center"><>

              <Camera className="h-12 w-12 text-purple-600" />
            </div>
            <CardContent
</> className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><>

                  <h3 className="font-semibold">Roof Damage</h3>
                  <p
</> className="text-sm text-slate-600">789 Oak Avenue</p>
                </div>
                <Badge className="bg-red-100 text-red-800">Defect</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <MapPin className="h-3 w-3" /><>

                <span>Townsburg, CA</span>
                <span
</>>•</span>
                <span>Yesterday 4:15 PM</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="flex-1"><>

                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
</> variant="outline" size="sm"><>

                  <Edit className="h-4 w-4" />
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Photo Card 4 */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center"><>

              <Camera className="h-12 w-12 text-orange-600" />
            </div>
            <CardContent
</> className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><>

                  <h3 className="font-semibold">Kitchen</h3>
                  <p
</> className="text-sm text-slate-600">456 Pine Road</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Interior</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <MapPin className="h-3 w-3" /><>

                <span>Villageton, CA</span>
                <span
</>>•</span>
                <span>May 26, 3:20 PM</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="flex-1"><>

                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
</> variant="outline" size="sm"><>

                  <Edit className="h-4 w-4" />
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Photo Card 5 */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center"><>

              <Camera className="h-12 w-12 text-teal-600" />
            </div>
            <CardContent
</> className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><>

                  <h3 className="font-semibold">Comparable Sale</h3>
                  <p
</> className="text-sm text-slate-600">145 Maple Street</p>
                </div>
                <Badge className="bg-orange-100 text-orange-800">Comp</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <MapPin className="h-3 w-3" /><>

                <span>Cityville, CA</span>
                <span
</>>•</span>
                <span>May 25, 11:00 AM</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="flex-1"><>

                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
</> variant="outline" size="sm"><>

                  <Edit className="h-4 w-4" />
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Photo Card 6 */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center"><>

              <Camera className="h-12 w-12 text-indigo-600" />
            </div>
            <CardContent
</> className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><>

                  <h3 className="font-semibold">Backyard</h3>
                  <p
</> className="text-sm text-slate-600">321 Cedar Drive</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Exterior</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <MapPin className="h-3 w-3" /><>

                <span>Riverside, CA</span>
                <span
</>>•</span>
                <span>May 24, 5:45 PM</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="flex-1"><>

                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
</> variant="outline" size="sm"><>

                  <Edit className="h-4 w-4" />
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
