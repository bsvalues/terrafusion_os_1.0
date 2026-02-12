import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart,
  Search,
  Plus,
  Calendar,
  DollarSign,
  Clock,
  Building2,
  User,
  Filter,
  MoreVertical,
 } from '@mui/icons-material';

export default function Orders() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
          <p
</> className="text-slate-600">Manage incoming appraisal orders and assignments</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock
</> className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">8</div>
            <p
</> className="text-xs text-slate-500">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <ShoppingCart
</> className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">15</div>
            <p
</> className="text-xs text-slate-500">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar
</> className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">47</div>
            <p
</> className="text-xs text-slate-500">Orders completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign
</> className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">$23,400</div>
            <p
</> className="text-xs text-slate-500">This month</p>
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
                placeholder="Search orders by property, client, or order ID..."
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
              <Calendar className="h-4 w-4 mr-2" />
              Due Date
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="grid gap-6">
        {/* Urgent Order */}
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center"><>

                  <Building2 className="h-6 w-6 text-red-600" />
                </div>
                <div
</> className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><>

                    <h3 className="font-semibold text-lg">987 Elm Street</h3>
                    <Badge
</> className="bg-red-100 text-red-800">Urgent</Badge>
                  </div><>

                  <p className="text-slate-600">Downtown, CA 90213</p>
                  <div
</> className="flex items-center gap-4 mt-2 text-sm text-slate-500"><>

                    <span>Order #ORD-2025-045</span>
                    <span
</>>•</span><>

                    <span>Due: Tomorrow</span>
                    <span
</>>•</span>
                    <span>Rush Fee: $150</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right"><>

                  <div className="font-semibold text-lg">$650</div>
                  <div
</> className="text-sm text-slate-500">Base + Rush</div>
                </div><>

                <Button size="sm">Accept</Button>
                <Button
</> variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded border border-red-200">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" /><>

                <span className="text-sm font-medium">Metro Bank</span>
                <span
</> className="text-sm text-slate-500">• Loan Officer: Sarah Johnson</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regular Order */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center"><>

                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div
</> className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><>

                    <h3 className="font-semibold text-lg">234 Cedar Lane</h3>
                    <Badge
</> className="bg-blue-100 text-blue-800">New</Badge>
                  </div><>

                  <p className="text-slate-600">Suburbia, CA 90214</p>
                  <div
</> className="flex items-center gap-4 mt-2 text-sm text-slate-500"><>

                    <span>Order #ORD-2025-046</span>
                    <span
</>>•</span><>

                    <span>Due: May 20, 2025</span>
                    <span
</>>•</span>
                    <span>Standard Delivery</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right"><>

                  <div className="font-semibold text-lg">$500</div>
                  <div
</> className="text-sm text-slate-500">Standard Fee</div>
                </div><>

                <Button size="sm">Accept</Button>
                <Button
</> variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-slate-50 rounded border">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" /><>

                <span className="text-sm font-medium">Community Credit Union</span>
                <span
</> className="text-sm text-slate-500">• Contact: Mike Chen</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* In Progress Order */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center"><>

                  <Building2 className="h-6 w-6 text-yellow-600" />
                </div>
                <div
</> className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><>

                    <h3 className="font-semibold text-lg">567 Birch Avenue</h3>
                    <Badge
</> className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                  </div><>

                  <p className="text-slate-600">Riverside, CA 90215</p>
                  <div
</> className="flex items-center gap-4 mt-2 text-sm text-slate-500"><>

                    <span>Order #ORD-2025-043</span>
                    <span
</>>•</span><>

                    <span>Due: May 18, 2025</span>
                    <span
</>>•</span>
                    <span>Started: 3 days ago</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right"><>

                  <div className="font-semibold text-lg">$525</div>
                  <div
</> className="text-sm text-slate-500">75% Complete</div>
                </div><>

                <Button size="sm" variant="outline">
                  Continue
                </Button>
                <Button
</> variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-slate-50 rounded border">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" /><>

                <span className="text-sm font-medium">First Home Lending</span>
                <span
</> className="text-sm text-slate-500">• Processor: Lisa Wang</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
