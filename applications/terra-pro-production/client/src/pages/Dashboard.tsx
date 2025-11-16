import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp,
  FileText,
  Bot,
  Zap,
  Clock,
  CheckCircle,
  Warning,
  Users,
  BarChart3,
  Refresh,
  ArrowRight,
  Activity,
  DollarSign,
  MapPin,
 } from '@mui/icons-material';
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface DashboardStats {
  activeOrders: number;
  completedToday: number;
  avgTurnaroundTime: string;
  aiConversions: number;
  qcPending: number;
  totalValue: string;
}

interface RecentActivity {
  id: string;
  type: "order" | "conversion" | "qc" | "ai_insight";
  title: string;
  subtitle: string;
  time: string;
  status: "completed" | "pending" | "in_progress";
}

export default function Dashboard() {
  // Mock data - replace with real API calls
  const stats: DashboardStats = {
    activeOrders: 12,
    completedToday: 8,
    avgTurnaroundTime: "2.3 days",
    aiConversions: 24,
    qcPending: 3,
    totalValue: "$2.4M",
  };

  const recentActivities: RecentActivity[] = [
    {
      id: "1",
      type: "ai_insight",
      title: "AI Agent completed property analysis",
      subtitle: "406 Stardust Ct, Grandview WA - $485,000 valuation",
      time: "2 minutes ago",
      status: "completed",
    },
    {
      id: "2",
      type: "conversion",
      title: "Data conversion completed",
      subtitle: "MLS export converted: 45 properties processed",
      time: "8 minutes ago",
      status: "completed",
    },
    {
      id: "3",
      type: "qc",
      title: "QC Review required",
      subtitle: "Comparable adjustments need verification",
      time: "15 minutes ago",
      status: "pending",
    },
    {
      id: "4",
      type: "order",
      title: "New appraisal order",
      subtitle: "Single family residence - Rush order",
      time: "32 minutes ago",
      status: "in_progress",
    },
  ];

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "ai_insight":
        return <Bot className="w-4 h-4" />;
      case "conversion":
        return <Refresh className="w-4 h-4" />;
      case "qc":
        return <Warning className="w-4 h-4" />;
      case "order":
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: RecentActivity["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-orange-500";
      case "in_progress":
        return "bg-blue-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p
</> className="text-muted-foreground mt-1">
            Welcome back to Terrafusion AI Appraisal Platform
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><>

            <Activity className="w-3 h-3 mr-1" />
            AI Active
          </Badge>
          <Button
</>>
            <Zap className="w-4 h-4 mr-2" />
            Quick Start
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><>

                <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                <p
</> className="text-2xl font-bold text-foreground">{stats.activeOrders}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><>

                <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                <p
</> className="text-2xl font-bold text-foreground">{stats.completedToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><>

                <p className="text-sm font-medium text-muted-foreground">Avg Turnaround</p>
                <p
</> className="text-2xl font-bold text-foreground">{stats.avgTurnaroundTime}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><>

                <p className="text-sm font-medium text-muted-foreground">AI Conversions</p>
                <p
</> className="text-2xl font-bold text-foreground">{stats.aiConversions}</p>
              </div>
              <Bot className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><>

                <p className="text-sm font-medium text-muted-foreground">QC Pending</p>
                <p
</> className="text-2xl font-bold text-foreground">{stats.qcPending}</p>
              </div>
              <Warning className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><>

                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p
</> className="text-2xl font-bold text-foreground">{stats.totalValue}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/orders">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Start New Appraisal
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/conversion">
              <Button variant="outline" className="w-full justify-start">
                <Refresh className="w-4 h-4 mr-2" />
                Import Data
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/compliance">
              <Button variant="outline" className="w-full justify-start">
                <Warning className="w-4 h-4 mr-2" />
                Review QC Items
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-1"><>

                    <div className={`w-2 h-2 rounded-full ${getStatusColor(activity.status)}`} />
                  </div>
                  <div
</> className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {getActivityIcon(activity.type)}
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    </div><>

                    <p className="text-sm text-muted-foreground mt-1">{activity.subtitle}</p>
                    <p
</> className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              AI Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><>

                <span>Conversion Accuracy</span>
                <span
</> className="font-medium">98.5%</span>
              </div><>

              <Progress value={98.5} className="h-2" />
            </div>
            <div
</> className="space-y-2">
              <div className="flex justify-between text-sm"><>

                <span>Processing Speed</span>
                <span
</> className="font-medium">94.2%</span>
              </div><>

              <Progress value={94.2} className="h-2" />
            </div>
            <div
</> className="space-y-2">
              <div className="flex justify-between text-sm"><>

                <span>Agent Uptime</span>
                <span
</> className="font-medium">99.8%</span>
              </div>
              <Progress value={99.8} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><>

                <span>Orders This Week</span>
                <span
</> className="font-medium">45</span>
              </div><>

              <Progress value={78} className="h-2" />
            </div>
            <div
</> className="space-y-2">
              <div className="flex justify-between text-sm"><>

                <span>Quality Score</span>
                <span
</> className="font-medium">96.7%</span>
              </div><>

              <Progress value={96.7} className="h-2" />
            </div>
            <div
</> className="space-y-2">
              <div className="flex justify-between text-sm"><>

                <span>Client Satisfaction</span>
                <span
</> className="font-medium">98.1%</span>
              </div>
              <Progress value={98.1} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
