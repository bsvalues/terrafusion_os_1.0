import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Building, Cpu, Clock  } from '@mui/icons-material'

export function CountySegmentation() {
  const segments = [
    {
      name: "Small Counties",
      icon: Users,
      population: "<50K",
      count: 2847,
      message: "Right-Sized Revolution",
      conversion: "18.2%",
      color: "text-primary",
    },
    {
      name: "Large Counties",
      icon: Building,
      population: ">1M",
      count: 42,
      message: "Metrics-Driven Transformation",
      conversion: "24.7%",
      color: "text-accent",
    },
    {
      name: "Technical Counties",
      icon: Cpu,
      population: "Tech Hubs",
      count: 156,
      message: "API-First Government",
      conversion: "31.4%",
      color: "text-transcend",
    },
    {
      name: "Traditional Counties",
      icon: Clock,
      population: "Established",
      count: 1897,
      message: "Trusted Transformation",
      conversion: "14.8%",
      color: "text-yellow-400",
    },
  ]

  return (
    <Card className="bg-dark-800/50 border-primary/20">
      <CardHeader>
        <CardTitle className="text-white">County Segmentation Model</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {segments.map((segment /* , index */) => (
            <div key={index} className="p-4 bg-dark-700/30 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <segment.icon className={`w-6 h-6 ${segment.color}`} />
                <Badge variant="secondary" className="bg-accent/20 text-accent">
                  {segment.conversion}
                </Badge>
              </div><>

              <h3 className="text-white font-semibold mb-2">{segment.name}</h3>
              <p
</>
className="text-sm text-gray-400 mb-2">{segment.population}</p><>

              <p className="text-lg font-bold text-white mb-2">{segment.count.toLocaleString()}</p>
              <p
</>
className="text-sm text-gray-300">{segment.message}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
