"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Clock, ArrowRight  } from '@mui/icons-material'

const activities = [
  {
    id: 1,
    user: "Sarah Chen",
    action: "completed property valuation",
    target: "Batch #2847",
    time: "2 minutes ago",
    status: "success",
    avatar: "/asian-woman-professional.png",
  },
  {
    id: 2,
    user: "Mike Rodriguez",
    action: "approved building permit",
    target: "BP-2024-0156",
    time: "5 minutes ago",
    status: "success",
    avatar: "/hispanic-professional-man.png",
  },
  {
    id: 3,
    user: "System",
    action: "generated compliance report",
    target: "Monthly SOC 2 Audit",
    time: "12 minutes ago",
    status: "info",
    avatar: "/system-robot-icon.png",
  },
  {
    id: 4,
    user: "Jennifer Park",
    action: "updated GIS layer",
    target: "Zoning Districts 2024",
    time: "18 minutes ago",
    status: "success",
    avatar: "/asian-gis-analyst.png",
  },
  {
    id: 5,
    user: "David Thompson",
    action: "processed citizen request",
    target: "Service Request #4521",
    time: "25 minutes ago",
    status: "success",
    avatar: "/man-customer-service.png",
  },
  {
    id: 6,
    user: "AI Assistant",
    action: "detected anomaly",
    target: "Revenue Pattern Analysis",
    time: "32 minutes ago",
    status: "warning",
    avatar: "/ai-brain-icon.png",
  },
]

export function RecentActivity() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "tf-success"
      case "warning":
        return "tf-warning"
      case "error":
        return "tf-error"
      case "info":
        return "tf-primary"
      default:
        return "tf-gray"
    }
  }

  return (
    <Card className="transcend-glow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><>

            <Clock className="w-5 h-5 text-tf-primary" />
            Recent Activity
          </CardTitle>
          <Button
</>
variant="ghost" size="sm" className="text-tf-primary hover:bg-tf-primary/10">
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
            <Avatar className="w-8 h-8">
              <AvatarImage src={activity.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {activity.user
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1"><>

                <p className="text-sm font-medium truncate">{activity.user}</p>
                <Badge
</>

                  variant="secondary"
                  className={`text-xs bg-${getStatusColor(activity.status)}/10 text-${getStatusColor(activity.status)} border-${getStatusColor(activity.status)}/20`}
                >
                  {activity.status}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {activity.action} <span className="font-medium text-foreground">{activity.target}</span>
              </p>

              <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
            </div>
          </div>
        ))}

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">All activities logged and audited</p>
        </div>
      </CardContent>
    </Card>
  )
}
