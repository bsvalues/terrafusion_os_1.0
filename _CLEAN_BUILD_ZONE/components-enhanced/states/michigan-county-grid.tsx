"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function MichiganCountyGrid() {
  const counties = [
    { name: "Wayne County", status: "TARGETED", population: "1.7M" },
    { name: "Oakland County", status: "ANALYSIS", population: "1.3M" },
    { name: "Macomb County", status: "PENDING", population: "881K" },
    { name: "Kent County", status: "PENDING", population: "657K" }
  ]

  return (
    <div className="p-6">
      <Card className="bg-tf-dark-lighter/30 border-tf-accent/20">
        <CardHeader>
          <CardTitle className="text-2xl text-tf-accent">Michigan County Grid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {counties.map((county /* , index */) => (
              <div key={index} className="p-4 bg-tf-dark/30 rounded-lg border border-tf-primary/20"><>

                <div className="font-semibold text-tf-light">{county.name}</div>
                <div
</>
className="text-sm text-tf-light/70">{county.population}</div>
                <Badge variant="secondary" className="mt-2">
                  {county.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}