"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function MichiganTimeline() {
  const milestones = [
    { date: "Q1 2025", event: "Initial Reconnaissance", status: "PLANNED" },
    { date: "Q2 2025", event: "Wayne County Demo", status: "PLANNED" },
    { date: "Q3 2025", event: "Detroit Metro Expansion", status: "PLANNED" },
    { date: "Q4 2025", event: "Great Lakes Rollout", status: "PLANNED" }
  ]

  return (
    <div className="p-6">
      <Card className="bg-tf-dark-lighter/30 border-tf-success/20">
        <CardHeader>
          <CardTitle className="text-2xl text-tf-success">Michigan Conquest Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone /* , index */) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-tf-dark/30 rounded-lg"><>

                <div className="text-sm text-tf-accent font-mono">{milestone.date}</div>
                <div
</>
className="flex-1 text-tf-light">{milestone.event}</div>
                <Badge variant="secondary">{milestone.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}