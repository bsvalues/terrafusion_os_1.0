import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2,
  Search,
  Plus,
  MapPin,
  Calendar,
  DollarSign,
  Square,
  Bed,
  Bath,
  Filter,
  Eye,
  Edit,
  MoreHorizontal,
 } from '@mui/icons-material';

export default function Properties() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-slate-900">Properties</h1>
          <p
</> className="text-slate-600">Browse and manage property database</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" /><>

              <Input placeholder="Search by address, city, or ZIP code..." className="pl-10" />
            </div>
            <Button
</> variant="outline"><>

              <Filter className="h-4 w-4 mr-2" />
              Property Type
            </Button>
            <Button
</> variant="outline"><>

              <DollarSign className="h-4 w-4 mr-2" />
              Price Range
            </Button>
            <Button
</> variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Location
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Card 1 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg flex items-center justify-center"><>

              <Building2 className="h-16 w-16 text-blue-600" />
            </div>
            <div
</> className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div><>

                  <h3 className="font-semibold text-lg">123 Maple Street</h3>
                  <p
</> className="text-slate-600 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Cityville, CA 90210
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Bed className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">3</span>
                  </div>
                  <span className="text-xs text-slate-500">Bedrooms</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Bath className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">2</span>
                  </div>
                  <span className="text-xs text-slate-500">Bathrooms</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Square className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">1,850</span>
                  </div>
                  <span className="text-xs text-slate-500">Sq Ft</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div><>

                  <div className="font-semibold text-xl text-slate-900">$485,000</div>
                  <div
</> className="text-sm text-slate-500">Last appraised</div>
                </div>
                <div className="text-right"><>

                  <div className="text-sm text-slate-500">Built 1995</div>
                  <div
</> className="text-sm text-slate-500">Single Family</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1"><>

                  <Eye className="h-4 w-4 mr-2" />
                  View Details
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
            </div>
          </CardContent>
        </Card>

        {/* Property Card 2 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 rounded-t-lg flex items-center justify-center"><>

              <Building2 className="h-16 w-16 text-green-600" />
            </div>
            <div
</> className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div><>

                  <h3 className="font-semibold text-lg">789 Oak Avenue</h3>
                  <p
</> className="text-slate-600 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Townsburg, CA 90211
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Recent</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Bed className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">4</span>
                  </div>
                  <span className="text-xs text-slate-500">Bedrooms</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Bath className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">3</span>
                  </div>
                  <span className="text-xs text-slate-500">Bathrooms</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Square className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">2,340</span>
                  </div>
                  <span className="text-xs text-slate-500">Sq Ft</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div><>

                  <div className="font-semibold text-xl text-slate-900">$625,000</div>
                  <div
</> className="text-sm text-slate-500">Current valuation</div>
                </div>
                <div className="text-right"><>

                  <div className="text-sm text-slate-500">Built 2008</div>
                  <div
</> className="text-sm text-slate-500">Single Family</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1"><>

                  <Eye className="h-4 w-4 mr-2" />
                  View Details
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
            </div>
          </CardContent>
        </Card>

        {/* Property Card 3 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="h-48 bg-gradient-to-br from-purple-100 to-purple-200 rounded-t-lg flex items-center justify-center"><>

              <Building2 className="h-16 w-16 text-purple-600" />
            </div>
            <div
</> className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div><>

                  <h3 className="font-semibold text-lg">456 Pine Road</h3>
                  <p
</> className="text-slate-600 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Villageton, CA 90212
                  </p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Bed className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">2</span>
                  </div>
                  <span className="text-xs text-slate-500">Bedrooms</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Bath className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">2</span>
                  </div>
                  <span className="text-xs text-slate-500">Bathrooms</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Square className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">1,420</span>
                  </div>
                  <span className="text-xs text-slate-500">Sq Ft</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div><>

                  <div className="font-semibold text-xl text-slate-900">$395,000</div>
                  <div
</> className="text-sm text-slate-500">Estimated value</div>
                </div>
                <div className="text-right"><>

                  <div className="text-sm text-slate-500">Built 1987</div>
                  <div
</> className="text-sm text-slate-500">Townhouse</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1"><>

                  <Eye className="h-4 w-4 mr-2" />
                  View Details
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
            </div>
          </CardContent>
        </Card>

        {/* Property Card 4 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="h-48 bg-gradient-to-br from-orange-100 to-orange-200 rounded-t-lg flex items-center justify-center"><>

              <Building2 className="h-16 w-16 text-orange-600" />
            </div>
            <div
</> className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div><>

                  <h3 className="font-semibold text-lg">321 Cedar Drive</h3>
                  <p
</> className="text-slate-600 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Riverside, CA 90213
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">Complete</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Bed className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">5</span>
                  </div>
                  <span className="text-xs text-slate-500">Bedrooms</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Bath className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">4</span>
                  </div>
                  <span className="text-xs text-slate-500">Bathrooms</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Square className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">3,200</span>
                  </div>
                  <span className="text-xs text-slate-500">Sq Ft</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div><>

                  <div className="font-semibold text-xl text-slate-900">$875,000</div>
                  <div
</> className="text-sm text-slate-500">Appraised value</div>
                </div>
                <div className="text-right"><>

                  <div className="text-sm text-slate-500">Built 2015</div>
                  <div
</> className="text-sm text-slate-500">Single Family</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1"><>

                  <Eye className="h-4 w-4 mr-2" />
                  View Details
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
