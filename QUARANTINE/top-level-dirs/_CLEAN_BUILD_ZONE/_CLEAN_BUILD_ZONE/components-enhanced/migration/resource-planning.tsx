import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Server, Headphones, Wrench  } from '@mui/icons-material'

export function ResourcePlanning() {
  const resources = [
    {
      category: "Terrafusion Team",
      icon: Users,
      resources: ["Migration Specialist (Lead)", "Data Engineer", "QA Specialist", "Project Manager"],
      commitment: "72 hours",
    },
    {
      category: "County Staff",
      icon: Headphones,
      resources: [
        "IT Director (Primary contact)",
        "Department heads (2-3)",
        "Power users (5-8)",
        "End users (as needed)",
      ],
      commitment: "16 hours",
    },
    {
      category: "Infrastructure",
      icon: Server,
      resources: ["Cloud migration environment", "Backup systems", "Network bandwidth", "Security protocols"],
      commitment: "Fully managed",
    },
    {
      category: "Tools & Support",
      icon: Wrench,
      resources: ["Migration automation tools", "24/7 support hotline", "Real-time monitoring", "Rollback procedures"],
      commitment: "Included",
    },
  ]

  return (
    <Card className="bg-dark-800/50 border-primary/20">
      <CardHeader>
        <CardTitle className="text-white">Resource Planning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {resources.map((resource /* , index */) => (
          <div key={index} className="p-4 bg-dark-700/30 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <resource.icon className="w-5 h-5 text-primary" /><>

              <h3 className="text-white font-semibold">{resource.category}</h3>
              <span
</>
className="text-accent text-sm ml-auto">{resource.commitment}</span>
            </div>
            <ul className="space-y-1">
              {resource.resources.map((item, itemIndex) => (
                <li key={itemIndex} className="text-sm text-gray-300 flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
