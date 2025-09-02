import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function InvestmentTracking() {
  const investments = [
    {
      category: "R&D",
      allocated: "$8.2M",
      spent: "$6.4M",
      remaining: "$1.8M",
      status: "On Track",
    },
    {
      category: "Sales & Marketing",
      allocated: "$12.5M",
      spent: "$11.2M",
      remaining: "$1.3M",
      status: "Accelerated",
    },
    {
      category: "Infrastructure",
      allocated: "$5.8M",
      spent: "$4.1M",
      remaining: "$1.7M",
      status: "Efficient",
    },
    {
      category: "Expansion",
      allocated: "$15.0M",
      spent: "$12.8M",
      remaining: "$2.2M",
      status: "Aggressive",
    },
  ]

  return (
    <Card className="bg-dark-800/50 border-primary/20">
      <CardHeader>
        <CardTitle className="text-white">Investment Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {investments.map((investment /* , index */) => (
          <div key={index} className="p-3 bg-dark-700/30 rounded-lg">
            <div className="flex items-center justify-between mb-2"><>

              <h4 className="text-white font-medium">{investment.category}</h4>
              <Badge
</> variant="secondary" className="bg-primary/20 text-primary">
                {investment.status}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div><>

                <p className="text-gray-400">Allocated</p>
                <p
</> className="text-white font-semibold">{investment.allocated}</p>
              </div>
              <div><>

                <p className="text-gray-400">Spent</p>
                <p
</> className="text-accent font-semibold">{investment.spent}</p>
              </div>
              <div><>

                <p className="text-gray-400">Remaining</p>
                <p
</> className="text-transcend font-semibold">{investment.remaining}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
