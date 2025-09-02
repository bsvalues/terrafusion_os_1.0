"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function MichiganConquestDashboard() {
  return (
    <div className="p-6">
      <Card className="bg-tf-dark-lighter/30 border-tf-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl text-tf-transcend">Michigan Conquest Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center"><>

              <div className="text-3xl font-bold text-tf-transcend">83</div>
              <div
</> className="text-sm text-tf-light/70">Counties</div>
            </div>
            <div className="text-center"><>

              <div className="text-3xl font-bold text-tf-primary">10.0M</div>
              <div
</> className="text-sm text-tf-light/70">Population</div>
            </div>
            <div className="text-center"><>

              <div className="text-3xl font-bold text-tf-accent">$284M</div>
              <div
</> className="text-sm text-tf-light/70">Market Size</div>
            </div>
            <div className="text-center"><>

              <div className="text-3xl font-bold text-tf-success">88%</div>
              <div
</> className="text-sm text-tf-light/70">Conquest Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}