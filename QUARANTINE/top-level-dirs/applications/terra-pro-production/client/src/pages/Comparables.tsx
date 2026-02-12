import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search,
  MapPin,
  Calendar,
  DollarSign,
  Square,
  Bed,
  Bath,
  Filter,
  Plus,
  BarChart3,
  Target,
  TrendingUp,
  MoreVertical,
 } from '@mui/icons-material';

export default function Comparables() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-slate-900">Comparables</h1>
          <p
</> className="text-slate-600">Find and analyze comparable property sales</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Comparable
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Subject Property
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Enter subject property address..." className="pl-10" />
              </div>
            </div>
            <Button className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Find Comparables
            </Button>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" size="sm"><>

              <Filter className="h-4 w-4 mr-2" />
              Distance: 1 mile
            </Button>
            <Button
</> variant="outline" size="sm"><>

              <Calendar className="h-4 w-4 mr-2" />
              Last 6 months
            </Button>
            <Button
</> variant="outline" size="sm">
              <Square className="h-4 w-4 mr-2" />
              Size: ±20%
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Found Comps</CardTitle>
            <Search
</> className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">24</div>
            <p
</> className="text-xs text-slate-500">Within criteria</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Avg Price/SqFt</CardTitle>
            <DollarSign
</> className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">$265</div>
            <p
</> className="text-xs text-slate-500">Local market</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Market Trend</CardTitle>
            <TrendingUp
</> className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">+2.3%</div>
            <p
</> className="text-xs text-slate-500">Last 6 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Days on Market</CardTitle>
            <Calendar
</> className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">18</div>
            <p
</> className="text-xs text-slate-500">Average DOM</p>
          </CardContent>
        </Card>
      </div>

      {/* Comparables List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between"><>

          <h2 className="text-xl font-semibold">Recent Sales</h2>
          <Button
</> variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analyze Selected
          </Button>
        </div>

        {/* Comparable 1 - Best Match */}
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-4">
                <div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center"><>

                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div
</> className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><>

                    <h3 className="font-semibold text-lg">145 Maple Street</h3>
                    <Badge
</> className="bg-green-100 text-green-800">Best Match</Badge>
                  </div><>

                  <p className="text-slate-600">Cityville, CA 90210 • 0.2 miles away</p>
                  <p
</> className="text-sm text-slate-500">Sold: March 15, 2025 • MLS: 12345678</p>
                </div>
              </div>
              <div className="text-right"><>

                <div className="font-bold text-xl text-green-700">$492,000</div>
                <div
</> className="text-sm text-slate-500">$266/sq ft</div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4 mb-4">
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
              <div className="text-center"><>

                <div className="font-semibold mb-1">1995</div>
                <span
</> className="text-xs text-slate-500">Year Built</span>
              </div>
              <div className="text-center"><>

                <div className="font-semibold mb-1">12</div>
                <span
</> className="text-xs text-slate-500">Days on Market</span>
              </div>
            </div>

            <div className="flex justify-between items-center"><>

              <div className="text-sm text-slate-600">
                Similarity Score: 98% • Same neighborhood, similar size and age
              </div>
              <div
</> className="flex gap-2"><>

                <Button size="sm" variant="outline">
                  View Details
                </Button>
                <Button
</> size="sm" variant="outline">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparable 2 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-4">
                <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center"><>

                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div
</> className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><>

                    <h3 className="font-semibold text-lg">890 Oak Drive</h3>
                    <Badge
</> className="bg-blue-100 text-blue-800">Good Match</Badge>
                  </div><>

                  <p className="text-slate-600">Cityville, CA 90210 • 0.4 miles away</p>
                  <p
</> className="text-sm text-slate-500">Sold: February 28, 2025 • MLS: 87654321</p>
                </div>
              </div>
              <div className="text-right"><>

                <div className="font-bold text-xl">$478,500</div>
                <div
</> className="text-sm text-slate-500">$270/sq ft</div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4 mb-4">
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
                  <span className="font-semibold">1,772</span>
                </div>
                <span className="text-xs text-slate-500">Sq Ft</span>
              </div>
              <div className="text-center"><>

                <div className="font-semibold mb-1">1998</div>
                <span
</> className="text-xs text-slate-500">Year Built</span>
              </div>
              <div className="text-center"><>

                <div className="font-semibold mb-1">8</div>
                <span
</> className="text-xs text-slate-500">Days on Market</span>
              </div>
            </div>

            <div className="flex justify-between items-center"><>

              <div className="text-sm text-slate-600">
                Similarity Score: 92% • Similar size, slightly newer
              </div>
              <div
</> className="flex gap-2"><>

                <Button size="sm" variant="outline">
                  View Details
                </Button>
                <Button
</> size="sm" variant="outline">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparable 3 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-4">
                <div className="h-16 w-16 bg-yellow-100 rounded-lg flex items-center justify-center"><>

                  <MapPin className="h-6 w-6 text-yellow-600" />
                </div>
                <div
</> className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><>

                    <h3 className="font-semibold text-lg">567 Pine Avenue</h3>
                    <Badge
</> className="bg-yellow-100 text-yellow-800">Fair Match</Badge>
                  </div><>

                  <p className="text-slate-600">Townsburg, CA 90211 • 0.8 miles away</p>
                  <p
</> className="text-sm text-slate-500">Sold: January 20, 2025 • MLS: 11223344</p>
                </div>
              </div>
              <div className="text-right"><>

                <div className="font-bold text-xl">$465,000</div>
                <div
</> className="text-sm text-slate-500">$258/sq ft</div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4 mb-4">
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
                  <span className="font-semibold">2</span>
                </div>
                <span className="text-xs text-slate-500">Bathrooms</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Square className="h-4 w-4 text-slate-500" />
                  <span className="font-semibold">1,802</span>
                </div>
                <span className="text-xs text-slate-500">Sq Ft</span>
              </div>
              <div className="text-center"><>

                <div className="font-semibold mb-1">1992</div>
                <span
</> className="text-xs text-slate-500">Year Built</span>
              </div>
              <div className="text-center"><>

                <div className="font-semibold mb-1">22</div>
                <span
</> className="text-xs text-slate-500">Days on Market</span>
              </div>
            </div>

            <div className="flex justify-between items-center"><>

              <div className="text-sm text-slate-600">
                Similarity Score: 85% • Different area, extra bedroom
              </div>
              <div
</> className="flex gap-2"><>

                <Button size="sm" variant="outline">
                  View Details
                </Button>
                <Button
</> size="sm" variant="outline">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
