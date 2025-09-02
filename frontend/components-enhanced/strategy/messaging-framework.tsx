import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare  } from '@mui/icons-material'

export function MessagingFramework() {
  const messages = [
    {
      segment: "Small Counties",
      primary: "Right-Sized Revolution",
      secondary: "Big County Power, Small County Price",
      cta: "Join Pioneer Program",
      performance: "Winner",
      confidence: "94%",
    },
    {
      segment: "Large Counties",
      primary: "$2.3M Annual Savings",
      secondary: "40% Efficiency Gain",
      cta: "See ROI Calculator",
      performance: "Testing",
      confidence: "87%",
    },
    {
      segment: "Technical Counties",
      primary: "API-First Government",
      secondary: "Developer-Grade Infrastructure",
      cta: "Review API Docs",
      performance: "Leading",
      confidence: "91%",
    },
    {
      segment: "Traditional Counties",
      primary: "Your Neighbors Trust Us",
      secondary: "50+ Counties Transformed",
      cta: "Read Case Studies",
      performance: "Optimizing",
      confidence: "83%",
    },
  ]

  return (
    <Card className="bg-dark-800/50 border-primary/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Dynamic Messaging Framework
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.map((message /* , index */) => (
          <div key={index} className="p-4 bg-dark-700/30 rounded-lg">
            <div className="flex items-center justify-between mb-3"><>

              <h3 className="text-white font-semibold">{message.segment}</h3>
              <div
</>
className="flex items-center gap-2"><>

                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  {message.performance}
                </Badge>
                <span
</>
className="text-accent text-sm">{message.confidence}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div><>

                <span className="text-gray-400 text-sm">Primary: </span>
                <span
</>
className="text-white font-medium">{message.primary}</span>
              </div>
              <div><>

                <span className="text-gray-400 text-sm">Secondary: </span>
                <span
</>
className="text-gray-300">{message.secondary}</span>
              </div>
              <div><>

                <span className="text-gray-400 text-sm">CTA: </span>
                <span
</>
className="text-transcend font-medium">{message.cta}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
