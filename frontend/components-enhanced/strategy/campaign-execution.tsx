import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar  } from '@mui/icons-material'

export function CampaignExecution() {
  const campaigns = [
    {
      name: "Small County Blitz",
      status: "Active",
      progress: 78,
      target: "500 counties",
      current: "389 contacted",
      conversion: "18.2%",
    },
    {
      name: "Large County Enterprise",
      status: "Planning",
      progress: 34,
      target: "42 counties",
      current: "14 in pipeline",
      conversion: "24.7%",
    },
    {
      name: "Tech Hub Conquest",
      status: "Active",
      progress: 91,
      target: "156 counties",
      current: "142 engaged",
      conversion: "31.4%",
    },
    {
      name: "Traditional Outreach",
      status: "Optimizing",
      progress: 56,
      target: "800 counties",
      current: "448 contacted",
      conversion: "14.8%",
    },
  ]

  return (
    <Card className="bg-dark-800/50 border-primary/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Campaign Execution Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {campaigns.map((campaign /* , index */) => (
          <div key={index} className="space-y-3">
            <div className="flex items-center justify-between"><>

              <h3 className="text-white font-semibold">{campaign.name}</h3>
              <Badge
</>

                variant="secondary"
                className={`${
                  campaign.status === "Active"
                    ? "bg-accent/20 text-accent"
                    : campaign.status === "Planning"
                      ? "bg-primary/20 text-primary"
                      : "bg-transcend/20 text-transcend"
                }`}
              >
                {campaign.status}
              </Badge>
            </div>
            <Progress value={campaign.progress} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div><>

                <span className="text-gray-400">Target: </span>
                <span
</>
className="text-white">{campaign.target}</span>
              </div>
              <div><>

                <span className="text-gray-400">Current: </span>
                <span
</>
className="text-accent">{campaign.current}</span>
              </div>
              <div><>

                <span className="text-gray-400">Rate: </span>
                <span
</>
className="text-transcend">{campaign.conversion}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
