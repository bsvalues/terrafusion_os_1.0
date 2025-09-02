"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ArizonaConquestDashboard() {
  return (
    <div className="p-6">
      <Card className="bg-tf-dark-lighter/30 border-tf-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl text-tf-transcend">Arizona Conquest Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center"><>

              <div className="text-3xl font-bold text-tf-transcend">15</div>
              <div
</> className="text-sm text-tf-light/70">Counties</div>
            </div>
            <div className="text-center"><>

              <div className="text-3xl font-bold text-tf-primary">7.3M</div>
              <div
</> className="text-sm text-tf-light/70">Population</div>
            </div>
            <div className="text-center"><>

              <div className="text-3xl font-bold text-tf-accent">$187M</div>
              <div
</> className="text-sm text-tf-light/70">Market Size</div>
            </div>
            <div className="text-center"><>

              <div className="text-3xl font-bold text-tf-success">92%</div>
              <div
</> className="text-sm text-tf-light/70">Conquest Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}