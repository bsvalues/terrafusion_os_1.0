"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Calculator, FileText, Users, MapPin, DollarSign, Shield, Zap, Plus} from '@mui/icons-material'

const quickActions = [
  {title: "New Valuation",
    description: "Start CostForge AI analysis",
    icon: Calculator,
    color: "tf-accent",
    action: "costforge-new",},
  {title: "Process Permit",
    description: "Review pending applications",
    icon: FileText,
    color: "tf-primary",
    action: "permit-process",},
  {title: "Citizen Request",
    description: "Handle service requests",
    icon: Users,
    color: "tf-success",
    action: "citizen-request",},
  {title: "GIS Analysis",
    description: "Run spatial analysis",
    icon: MapPin,
    color: "tf-transcend",
    action: "gis-analysis",},
  {title: "Revenue Report",
    description: "Generate financial summary",
    icon: DollarSign,
    color: "tf-warning",
    action: "revenue-report",},
  {title: "Security Audit",
    description: "Run compliance check",
    icon: Shield,
    color: "tf-error",
    action: "security-audit",},
]

export function QuickActions() {
  const handleAction = (action: string) =>{
    console.log(`Executing quick action: ${action}`)
  }

  return (<Card className="transcend-glow"><CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-tf-accent" />Quick Actions</CardTitle></CardHeader><CardContent className="space-y-3">{quickActions.map((action /* , index */) => {
          const Icon = action.icon
          return (<Button
              key={index}
              variant="ghost"
              className="w-full justify-start h-auto p-3 hover:bg-muted/50"
              onClick={() => handleAction(action.action)}
            ><div className={`p-2 rounded-lg bg-${action.color}/10 border border-${action.color}/20 mr-3`}><><Icon className={`w-4 h-4 text-${action.color}`} /></div><div
</>
className="text-left"><><p className="font-medium text-sm">{action.title}</p><p
</>
className="text-xs text-muted-foreground">{action.description}</p></div></Button>)
        })}<Button
          variant="outline"
          className="w-full border-dashed border-tf-primary/30 text-tf-primary hover:bg-tf-primary/5 bg-transparent"
        ><Plus className="w-4 h-4 mr-2" />Add Custom Action</Button></CardContent></Card>
  )
}
